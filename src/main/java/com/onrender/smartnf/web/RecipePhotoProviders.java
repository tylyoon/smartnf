package com.onrender.smartnf.web;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/** Server-only keys, bounded requests and a reviewed, local image catalogue. */
final class RecipePhotoProviders {
    record Result(String status, Optional<RecipePhotoController.Photo> photo) {}
    record SourceStatus(String name, String state) {}
    private record Local(String name, RecipePhotoController.Photo photo) {}
    private final String mfdsKey;
    private final String tourKey;
    private final List<Local> catalogue;
    private final HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(3)).build();
    private final JsonMapper json = JsonMapper.builder().build();
    private final Map<String, Instant> paused = new ConcurrentHashMap<>();
    private final Map<String, Integer> calls = new java.util.HashMap<>();
    private java.time.LocalDate budgetDate = java.time.LocalDate.now(java.time.ZoneId.of("Asia/Seoul"));
    private final Map<String, String> recent = new ConcurrentHashMap<>();
    private static final String MFDS_SOURCE = "https://www.foodsafetykorea.go.kr/api/newDatasetDetail.do?svc_no=COOKRCP01";
    private static final String MFDS_LICENSE = "https://www.data.go.kr/data/15060073/openapi.do";
    private static final String TOUR_SOURCE = "https://www.data.go.kr/data/15101914/openapi.do";
    private static final String KOGL = "https://www.kogl.or.kr/info/licenseType1.do";

    RecipePhotoProviders(String mfdsKey, String tourKey) {
        this.mfdsKey = mfdsKey.strip();
        this.tourKey = normalizeTourKey(tourKey);
        catalogue = loadCatalogue();
    }

    List<SourceStatus> statuses() {
        return List.of(new SourceStatus("등록 사진", catalogue.size() + "개 등록 · 공유마당/셀렉트스타 등 확인한 사진"),
                new SourceStatus("식품안전나라", state("식품안전나라", mfdsKey)),
                new SourceStatus("포토코리아", state("포토코리아", tourKey)));
    }
    private String state(String name, String key) {
        if (key.isBlank()) return "키 미설정 · 건너뜀";
        return "키 설정됨 · " + recent.getOrDefault(name, "첫 검색 대기");
    }
    Result search(String provider, String term) { return search(provider, term, Set.of()); }
    Result search(String provider, String term, Set<String> excluded) {
        if (provider.equals("등록 사진")) {
            return catalogue.stream().filter(row -> key(row.name()).equals(key(term)) && !excluded.contains(row.photo().image()))
                    .findFirst().map(row -> new Result("FOUND", Optional.of(row.photo())))
                    .orElse(new Result("NO_RESULTS", Optional.empty()));
        }
        String apiKey = provider.equals("식품안전나라") ? mfdsKey : tourKey;
        if (apiKey.isBlank()) return new Result("NOT_CONFIGURED", Optional.empty());
        if (Instant.now().isBefore(paused.getOrDefault(provider, Instant.EPOCH)))
            return new Result("ERROR", Optional.empty());
        if (!reserve(provider)) {
            recent.put(provider, "일일 자체 한도 800회 · 다음 날 재시도");
            return new Result("DAILY_LIMIT", Optional.empty());
        }
        try {
            URI uri = provider.equals("식품안전나라")
                    ? URI.create("https://openapi.foodsafetykorea.go.kr/api/" + encode(apiKey)
                        + "/COOKRCP01/json/1/10/RCP_NM=" + encode(term))
                    : URI.create("https://apis.data.go.kr/B551011/PhotoGalleryService1/gallerySearchList1"
                        + "?serviceKey=" + encode(apiKey) + "&MobileOS=ETC&MobileApp=SmartNF&_type=json"
                        + "&numOfRows=10&pageNo=1&keyword=" + encode(term));
            JsonNode root = fetch(uri, provider);
            Optional<RecipePhotoController.Photo> photo;
            if (provider.equals("식품안전나라")) {
                JsonNode data = root.path("COOKRCP01");
                String code = data.path("RESULT").path("CODE").asText("");
                if (!(code.equals("INFO-000") || code.equals("INFO-200"))) throw new ProviderFailure("식품안전나라 응답 코드 " + safeCode(code));
                photo = parseMfds(data.path("row"), term, excluded);
            } else {
                JsonNode data = root.path("response");
                String code = data.path("header").path("resultCode").asText("");
                if (!(code.equals("0000") || code.equals("00"))) throw new ProviderFailure("포토코리아 응답 코드 " + safeCode(code));
                photo = parseTour(data.path("body").path("items").path("item"), term, excluded);
            }
            recent.put(provider, photo.isPresent() ? "최근 검색 · 후보 발견" : "최근 검색 · 결과 없음");
            return new Result(photo.isPresent() ? "FOUND" : "NO_RESULTS", photo);
        } catch (ProviderFailure error) {
            recent.put(provider, error.reason);
            paused.put(provider, Instant.now().plus(Duration.ofMinutes(5)));
            return new Result("ERROR", Optional.empty());
        } catch (InterruptedException error) {
            Thread.currentThread().interrupt();
        } catch (IOException | RuntimeException error) {
            // Exception messages can contain the secret-bearing URI. Never log or send them.
        }
        recent.put(provider, "최근 연결/인증 오류 · 키와 이용 승인 확인");
        paused.put(provider, Instant.now().plus(Duration.ofMinutes(5)));
        return new Result("ERROR", Optional.empty());
    }
    private static final class ProviderFailure extends IOException {
        final String reason;
        ProviderFailure(String reason) { this.reason = reason; }
    }
    private static String safeCode(String code) {
        return code.matches("[A-Z0-9_-]{1,30}") ? code : "확인 불가";
    }
    static String normalizeTourKey(String value) {
        String key = value.strip();
        if (key.matches("(?is).*%[0-9a-f]{2}.*")) {
            try { return java.net.URLDecoder.decode(key.replace("+", "%2B"), StandardCharsets.UTF_8); }
            catch (IllegalArgumentException error) { return key; }
        }
        return key;
    }
    private synchronized boolean reserve(String provider) {
        var today = java.time.LocalDate.now(java.time.ZoneId.of("Asia/Seoul"));
        if (!today.equals(budgetDate)) { calls.clear(); budgetDate = today; }
        int count = calls.getOrDefault(provider, 0);
        if (count >= 800) return false;
        calls.put(provider, count + 1);
        return true;
    }
    private JsonNode fetch(URI uri, String provider) throws IOException, InterruptedException {
        var request = HttpRequest.newBuilder(uri).timeout(Duration.ofSeconds(5))
                .header("User-Agent", "SmartNF-Photo/2.0 (https://github.com/tylyoon/smartnf)")
                .GET().build();
        var response = client.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() != 200)
            throw new ProviderFailure("HTTP " + response.statusCode() + " · 연결/이용 승인 확인");
        if (response.body().length() > 2_000_000) throw new ProviderFailure("응답 크기 제한 초과");
        return json.readTree(response.body());
    }

    static Optional<RecipePhotoController.Photo> parseMfds(JsonNode rows, String term) { return parseMfds(rows, term, Set.of()); }
    static Optional<RecipePhotoController.Photo> parseMfds(JsonNode rows, String term, Set<String> excluded) {
        for (JsonNode row : rows) {
            String name = row.path("RCP_NM").asText("").strip();
            String image = https(row.path("ATT_FILE_NO_MK").asText(""));
            if (image.isEmpty()) image = https(row.path("ATT_FILE_NO_MAIN").asText(""));
            if (excluded.contains(image) || !relevant(name, term) || !allowedImage(image, "www.foodsafetykorea.go.kr", "/uploadimg/")) continue;
            return Optional.of(new RecipePhotoController.Photo(image, MFDS_SOURCE, "식품의약품안전처",
                    "공공데이터 이용허락범위 제한 없음", MFDS_LICENSE, "식품안전나라", RecipePhotoController.cleanTitle(name)));
        }
        return Optional.empty();
    }
    static Optional<RecipePhotoController.Photo> parseTour(JsonNode rows, String term) { return parseTour(rows, term, Set.of()); }
    static Optional<RecipePhotoController.Photo> parseTour(JsonNode rows, String term, Set<String> excluded) {
        List<JsonNode> entries = new ArrayList<>();
        if (rows.isArray()) rows.forEach(entries::add); else if (rows.isObject()) entries.add(rows);
        for (JsonNode row : entries) {
            String name = row.path("galTitle").asText("").strip();
            String image = https(row.path("galWebImageUrl").asText(""));
            String author = RecipePhotoController.cleanTitle(row.path("galPhotographer").asText(""));
            if (excluded.contains(image) || !relevant(name, term) || author.isBlank() || author.length() > 170
                    || !allowedImage(image, "tong.visitkorea.or.kr", "/cms2/")) continue;
            return Optional.of(new RecipePhotoController.Photo(image, TOUR_SOURCE, "한국관광공사 / " + author,
                    "공공누리 제1유형", KOGL, "포토코리아", RecipePhotoController.cleanTitle(name)));
        }
        return Optional.empty();
    }
    static boolean relevant(String title, String term) {
        return !key(term).isEmpty() && title.length() <= 300 && key(title).contains(key(term));
    }
    static boolean allowedImage(String image, String host, String prefix) {
        try {
            URI uri = URI.create(image);
            return image.length() <= 1000 && "https".equals(uri.getScheme()) && host.equals(uri.getHost())
                    && uri.getPort() == -1 && uri.getRawUserInfo() == null && uri.getPath().startsWith(prefix);
        } catch (IllegalArgumentException error) { return false; }
    }
    private static String https(String value) { return value.replaceFirst("^http://", "https://"); }
    private static String encode(String value) { return URLEncoder.encode(value, StandardCharsets.UTF_8).replace("+", "%20"); }
    private static String key(String value) {
        return Normalizer.normalize(value, Normalizer.Form.NFKC).replaceAll("[^\\p{L}\\p{N}]", "").toLowerCase(java.util.Locale.ROOT);
    }
    private List<Local> loadCatalogue() {
        List<Local> values = new ArrayList<>();
        var stream = RecipePhotoProviders.class.getResourceAsStream("/photo-catalog.tsv");
        if (stream == null) return List.of();
        try (var reader = new BufferedReader(new InputStreamReader(stream, StandardCharsets.UTF_8))) {
            String line;
            int count = 0;
            while ((line = reader.readLine()) != null && count++ < 10000) {
                if (line.isBlank() || line.startsWith("#")) continue;
                String[] fields = line.split("\t", -1);
                if (fields.length != 8 || fields[0].isBlank() || fields[0].length() > 100
                        || !fields[2].matches("/photos/catalog/[0-9a-f]{64}\\.(jpg|png|webp)")
                        || fields[1].isBlank() || fields[1].length() > 300 || fields[3].isBlank() || fields[3].length() > 200
                        || fields[7].isBlank() || fields[7].length() > 200
                        || !safeSource(fields[4]) || !validLocalLicense(fields[5], fields[6])) continue;
                if (RecipePhotoProviders.class.getResource("/static" + fields[2]) == null) continue;
                values.add(new Local(fields[0], new RecipePhotoController.Photo(fields[2], fields[4], fields[3],
                        fields[5], fields[6], fields[7], fields[1])));
            }
        } catch (IOException error) { return List.of(); }
        return List.copyOf(values);
    }
    static boolean validLocalLicense(String name, String url) {
        String canonical = RecipePhotoController.licenseName(url);
        return canonical != null && canonical.equals(name) || (name.equals("공공누리 제1유형") && url.equals(KOGL));
    }
    private static boolean safeSource(String value) {
        try {
            URI uri = URI.create(value);
            return value.length() <= 1000 && "https".equals(uri.getScheme()) && uri.getHost() != null
                    && uri.getRawUserInfo() == null && uri.getPort() == -1;
        } catch (IllegalArgumentException error) { return false; }
    }
}
