package com.onrender.smartnf.web;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.sql.Timestamp;
import java.text.Normalizer;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.HashSet;
import org.springframework.transaction.annotation.Transactional;
import java.util.concurrent.Semaphore;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.ModelAndView;
import org.springframework.web.util.HtmlUtils;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

@RestController
public class RecipePhotoController {
    // Verify each title's food identity before adding it to the catalogue.
    private static final String CC0_URL = "https://creativecommons.org/publicdomain/zero/1.0/";
    private static final String FILE_TITLE = "File:Doenjang-jjigae.jpg";
    private static final String DISH_PATTERN = "(?:구수한|기본|집밥)?된장찌개";
    private static final String COMMONS_QUERY =
            "https://commons.wikimedia.org/w/api.php?action=query&format=json&formatversion=2"
                    + "&prop=imageinfo&iiprop=url%7Cmime%7Cextmetadata&iiurlwidth=330";
    private static final URI LOOKUP = URI.create(
            COMMONS_QUERY + "&titles=" + URLEncoder.encode(FILE_TITLE, StandardCharsets.UTF_8));
    private static final Duration RETRY_DELAY = Duration.ofHours(1);
    private static final Duration CLAIM_TIMEOUT = Duration.ofMinutes(5);
    private static final String DUE_FOR_SEARCH = """
            approved = FALSE AND rejected = FALSE AND image_url IS NULL
            AND (search_status IS NULL OR search_status = 'READY'
                 OR (search_status = 'SEARCHING' AND checked_at < ?)
                 OR (search_status NOT IN ('SEARCHING', 'EXCLUDED') AND checked_at <= ?))
            """;

    private final JdbcTemplate jdbc;
    private final RecipePhotoProviders providers;
    private final RecipePhotoSearchPlanner planner;
    private final Semaphore discoverySlots = new Semaphore(5);
    private final HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(3)).build();
    private final JsonMapper json = JsonMapper.builder().build();
    private volatile Instant openverseRetryAfter = Instant.EPOCH;
    private Instant refreshAfter = Instant.EPOCH;
    private Optional<Photo> cached = Optional.empty();

    public RecipePhotoController(JdbcTemplate jdbc,
            @Value("${SMARTNF_PHOTO_MFDS_API_KEY:}") String mfdsKey,
            @Value("${SMARTNF_PHOTO_TOUR_API_KEY:}") String tourKey,
            @Value("${SMARTNF_LOCAL_LLM_ENABLED:false}") boolean llmEnabled,
            @Value("${SMARTNF_LLM_PORT:8091}") int llmPort) {
        this.jdbc = jdbc;
        this.providers = new RecipePhotoProviders(mfdsKey, tourKey);
        this.planner = new RecipePhotoSearchPlanner(llmEnabled, llmPort);
    }

    @PostMapping(value = "/api/recipes/commons-photo", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Photo> lookup(@RequestBody Lookup request) {
        String name = request.name() == null ? "" : Normalizer.normalize(request.name(), Normalizer.Form.NFKC).strip();
        if (!name.matches("[\\p{L}\\p{N} ()·,.!。-]{1,100}")) {
            return ResponseEntity.noContent().build();
        }
        String key = dishKey(name);
        if (key.isEmpty()) return ResponseEntity.noContent().build();

        Optional<Photo> photo = approvedPhoto(key);
        if (photo.isEmpty() && request.discover()) {
            jdbc.update("""
                    INSERT IGNORE INTO recipe_photo_candidates
                        (dish_key, dish_name, checked_at, search_status, search_term)
                    VALUES (?, ?, ?, 'READY', ?)
                    """, key, name, Timestamp.from(Instant.now()), name);
        }
        return photo.map(value -> ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(value))
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PostMapping("/api/foods/photo")
    public ResponseEntity<Photo> foodPhoto(@RequestBody FoodLookup request) {
        if (request == null || request.foodId() == null) return ResponseEntity.noContent().build();
        com.onrender.smartnf.health.MealCatalog.Food food;
        try {
            food = com.onrender.smartnf.health.MealCatalog.find(request.foodId());
        } catch (com.onrender.smartnf.health.HealthException error) {
            return ResponseEntity.noContent().build();
        }
        String name = food.name().replace('_', ' ').strip();
        if (name.length() > 100) return ResponseEntity.noContent().build();
        // Full canonical name retains raw/cooked distinctions. DB IDs with the same name share this key.
        String key = food.id().startsWith("mfds_dishes:") ? dishKey(name) : foodKey(name);
        Optional<Photo> photo = approvedPhoto(key);
        if (photo.isEmpty() && request.discover()) {
            jdbc.update("""
                    INSERT IGNORE INTO recipe_photo_candidates
                        (dish_key, dish_name, checked_at, search_status, search_term)
                    VALUES (?, ?, ?, 'READY', ?)
                    """, key, name, Timestamp.from(Instant.now()), name);
        }
        return photo.map(value -> ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(value))
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    private static String foodKey(String name) {
        try {
            byte[] bytes = dishKey(name).getBytes(StandardCharsets.UTF_8);
            return "food:" + java.util.HexFormat.of().formatHex(
                    java.security.MessageDigest.getInstance("SHA-256").digest(bytes));
        } catch (java.security.NoSuchAlgorithmException error) {
            throw new IllegalStateException(error);
        }
    }

    public record FoodLookup(String foodId, boolean discover) {}

    @GetMapping("/admin/recipe-photos")
    public ModelAndView review() {
        List<ReviewPhoto> candidates = jdbc.query("""
                SELECT dish_key, dish_name, image_url, source_url, author, search_term, photo_license, photo_license_url, photo_provider, photo_title FROM recipe_photo_candidates
                WHERE approved = FALSE AND rejected = FALSE AND image_url IS NOT NULL
                ORDER BY checked_at DESC LIMIT 50
                """, (row, index) -> new ReviewPhoto(row.getString(1), row.getString(2),
                row.getString(3), row.getString(4), row.getString(5), row.getString(6), row.getString(7), row.getString(8), row.getString(9), row.getString(10)));
        List<SearchHistory> history = jdbc.query("""
                SELECT dish_key, dish_name, checked_at, search_status, search_term, search_details
                FROM recipe_photo_candidates
                WHERE approved = FALSE AND rejected = FALSE AND image_url IS NULL
                ORDER BY checked_at DESC, dish_key LIMIT 50
                """, (row, index) -> new SearchHistory(row.getString(1), row.getString(2),
                row.getTimestamp(3), statusLabel(row.getString(4)), row.getString(5),
                "EXCLUDED".equals(row.getString(4)), row.getString(6)));
        var view = new ModelAndView("preview/recipes/photo-review", "candidates", candidates);
        view.addObject("history", history);
        view.addObject("photoSources", providers.statuses());
        view.addObject("openverseStatus", Instant.now().isBefore(openverseRetryAfter) ? "요청 제한 · 잠시 대기" : "검색 사용 · 키 불필요");
        return view;
    }

    @PostMapping("/admin/recipe-photos")
    @Transactional
    public ModelAndView review(@RequestParam("key") String key, @RequestParam("approve") boolean approve, @RequestParam("image") String image) {
        applyDecision(key, image, approve);
        return new ModelAndView("redirect:/admin/recipe-photos");
    }

    public record Decision(String key, boolean changed, boolean approved) {}

    @PostMapping("/admin/recipe-photos/decision")
    @Transactional
    public Decision decide(@RequestParam("key") String key, @RequestParam("image") String image,
            @RequestParam("approve") boolean approve) {
        return new Decision(key, applyDecision(key, image, approve) == 1, approve);
    }

    private int applyDecision(String key, String image, boolean approve) {
        if (approve) {
            return jdbc.update("""
                    UPDATE recipe_photo_candidates SET approved = TRUE, rejected = FALSE
                    WHERE dish_key = ? AND approved = FALSE AND rejected = FALSE AND image_url = ?
                    """, key, image);
        } else {
            List<Photo> current = jdbc.query("""
                    SELECT image_url, source_url, author, photo_license, photo_license_url, photo_provider, photo_title
                    FROM recipe_photo_candidates
                    WHERE dish_key = ? AND approved = FALSE AND rejected = FALSE AND image_url = ?
                    FOR UPDATE
                    """, (row, index) -> new Photo(row.getString(1), row.getString(2), row.getString(3),
                            row.getString(4), row.getString(5), row.getString(6), row.getString(7)), key, image);
            if (!current.isEmpty()) {
                Photo photo = current.get(0);
                jdbc.update("""
                        INSERT IGNORE INTO recipe_photo_rejections (dish_key, image_hash, image_url, source_url, rejected_at)
                        VALUES (?, SHA2(?, 256), ?, ?, CURRENT_TIMESTAMP)
                        """, key, photo.image(), photo.image(), photo.source());
                return jdbc.update("""
                        UPDATE recipe_photo_candidates SET image_url = NULL, source_url = NULL, author = NULL,
                            photo_title = '', approved = FALSE, rejected = FALSE,
                            search_status = 'READY', checked_at = CURRENT_TIMESTAMP,
                            search_details = '사진 후보만 제외됨 · 다른 사진 검색 대기'
                        WHERE dish_key = ? AND approved = FALSE AND rejected = FALSE AND image_url = ?
                        """, key, image);
            }
        }
        return 0;
    }

    @PostMapping("/admin/recipe-photos/requeue")
    public ModelAndView requeue() {
        jdbc.update("""
                UPDATE recipe_photo_candidates SET search_status = 'READY'
                WHERE approved = FALSE AND rejected = FALSE AND image_url IS NULL
                  AND (search_status IS NULL OR search_status NOT IN ('EXCLUDED', 'SEARCHING'))
                """);
        return new ModelAndView("redirect:/admin/recipe-photos");
    }

    @Scheduled(initialDelay = 60_000, fixedDelay = 300_000)
    public void retryDuePhotos() {
        Instant now = Instant.now();
        var due = jdbc.query("""
                SELECT dish_key, dish_name FROM recipe_photo_candidates
                WHERE %s
                ORDER BY CASE WHEN search_status = 'READY' THEN 0 ELSE 1 END, checked_at, dish_key
                LIMIT 10
                """.formatted(DUE_FOR_SEARCH),
                (row, index) -> new LookupTarget(row.getString(1), row.getString(2)),
                Timestamp.from(now.minus(CLAIM_TIMEOUT)), Timestamp.from(now.minus(RETRY_DELAY)));
        for (LookupTarget target : due) {
            if (Thread.currentThread().isInterrupted()) return;
            discover(target.key(), target.name());
        }
    }

    @PostMapping("/admin/recipe-photos/search-visibility")
    public ModelAndView searchVisibility(@RequestParam("key") String key, @RequestParam("exclude") boolean exclude) {
        jdbc.update("""
                UPDATE recipe_photo_candidates SET search_status = ?
                WHERE dish_key = ? AND approved = FALSE AND rejected = FALSE AND image_url IS NULL
                  AND (? = TRUE OR search_status = 'EXCLUDED')
                """, exclude ? "EXCLUDED" : "READY", key, exclude);
        return new ModelAndView("redirect:/admin/recipe-photos");
    }

    Map<String, Photo> approvedPhotos(List<String> names) {
        List<String> keys = names.stream().map(RecipePhotoController::dishKey).distinct().toList();
        if (keys.isEmpty()) return Map.of();

        String placeholders = String.join(",", Collections.nCopies(keys.size(), "?"));
        Map<String, Photo> photosByKey = jdbc.query("""
                SELECT dish_key, image_url, source_url, author, photo_license, photo_license_url, photo_provider, photo_title FROM recipe_photo_candidates
                WHERE approved = TRUE AND image_url IS NOT NULL AND dish_key IN (%s)
                """.formatted(placeholders), rows -> {
            Map<String, Photo> photos = new HashMap<>();
            while (rows.next()) {
                photos.put(rows.getString(1), new Photo(rows.getString(2), rows.getString(3),
                        rows.getString(4), rows.getString(5), rows.getString(6), rows.getString(7), rows.getString(8)));
            }
            return photos;
        }, keys.toArray());

        Map<String, Photo> photosByName = new HashMap<>();
        for (String name : names) {
            Photo photo = photosByKey.get(dishKey(name));
            if (photo != null) photosByName.put(name, photo);
        }
        return photosByName;
    }

    private static String dishKey(String name) {
        return Normalizer.normalize(name, Normalizer.Form.NFKC).strip()
                .replaceAll("\\s+", "").replaceFirst("[.!。]+$", "");
    }

    private Optional<Photo> approvedPhoto(String key) {
        return jdbc.query("""
                SELECT image_url, source_url, author, photo_license, photo_license_url, photo_provider, photo_title FROM recipe_photo_candidates
                WHERE dish_key = ? AND approved = TRUE AND image_url IS NOT NULL
                """, (row, index) -> new Photo(row.getString(1), row.getString(2), row.getString(3), row.getString(4), row.getString(5), row.getString(6), row.getString(7)), key)
                .stream().findFirst();
    }

    private void discover(String key, String name) {
        if (!discoverySlots.tryAcquire()) return;
        try {
            Instant now = Instant.now().truncatedTo(ChronoUnit.SECONDS);
            int claimed = jdbc.update("""
                    INSERT IGNORE INTO recipe_photo_candidates
                        (dish_key, dish_name, checked_at, search_status, search_term)
                    VALUES (?, ?, ?, 'SEARCHING', ?)
                    """, key, name, Timestamp.from(now), name);
            if (claimed == 0) {
                claimed = jdbc.update("""
                        UPDATE recipe_photo_candidates
                        SET checked_at = ?, search_status = 'SEARCHING', search_term = ?
                        WHERE dish_key = ? AND %s
                          AND (search_status IS NULL OR search_status <> 'READY' OR checked_at < ?)
                        """.formatted(DUE_FOR_SEARCH), Timestamp.from(now), name, key,
                        Timestamp.from(now.minus(CLAIM_TIMEOUT)), Timestamp.from(now.minus(RETRY_DELAY)),
                        Timestamp.from(now));
            }
            if (claimed == 0) return;

            Set<String> excluded = new HashSet<>(jdbc.query("""
                    SELECT image_url FROM recipe_photo_rejections WHERE dish_key = ?
                    """, (row, index) -> row.getString(1), key));
            List<String> trace = new ArrayList<>();
            SearchResult result = searchRound(List.of(name), excluded, trace);
            boolean failed = "ERROR".equals(result.status());
            if (result.photo().isEmpty() && !key.startsWith("food:") && !Thread.currentThread().isInterrupted()) {
                var plan = planner.plan(name);
                trace.add(plan.status());
                LinkedHashSet<String> expanded = new LinkedHashSet<>();
                if (!plan.representative().isEmpty()) expanded.add(plan.representative());
                expanded.addAll(searchTerms(name, true));
                if (!plan.representative().isEmpty()) expanded.addAll(searchTerms(plan.representative(), true));
                expanded.remove(name);
                result = expanded.isEmpty() ? result : searchRound(expanded.stream().limit(4).toList(), excluded, trace);
            }
            if (result.photo().isEmpty() && failed)
                result = new SearchResult(result.term(), "ERROR", Optional.empty());
            String details = String.join(" · ", trace);
            if (details.length() > 1900) details = details.substring(0, 1900);

            Photo candidate = result.photo().orElse(null);
            jdbc.update("""
                    UPDATE recipe_photo_candidates
                    SET search_status = ?, search_term = ?, image_url = ?, source_url = ?, author = ?, photo_license = ?, photo_license_url = ?, photo_provider = ?, photo_title = ?, search_details = ?
                    WHERE dish_key = ? AND search_status = 'SEARCHING' AND checked_at = ?
                      AND approved = FALSE AND rejected = FALSE AND image_url IS NULL
                    """, result.status(), result.term(), candidate == null ? null : candidate.image(),
                    candidate == null ? null : candidate.source(), candidate == null ? null : candidate.author(),
                    candidate == null ? "CC0" : candidate.license(),
                    candidate == null ? CC0_URL : candidate.licenseUrl(),
                    candidate == null ? "Wikimedia Commons" : candidate.provider(),
                    candidate == null ? "" : candidate.title(), details,
                    key, Timestamp.from(now));
        } finally {
            discoverySlots.release();
        }
    }

    private SearchResult searchRound(List<String> terms, Set<String> excluded, List<String> trace) {
        SearchResult result = new SearchResult(terms.get(0), "NO_RESULTS", Optional.empty());
        boolean failed = false;
        for (String provider : List.of("등록 사진", "식품안전나라", "포토코리아", "Wikimedia", "Openverse")) {
            for (String term : terms) {
                if (Thread.currentThread().isInterrupted()) return result;
                SearchResult attempt;
                if (provider.equals("Wikimedia")) attempt = search(term, excluded);
                else if (provider.equals("Openverse")) attempt = searchOpenverse(term, excluded);
                else {
                    var found = providers.search(provider, term, excluded);
                    attempt = new SearchResult(term, found.status(), found.photo());
                }
                trace.add(provider + " / " + term + " / " + statusLabel(attempt.status()));
                failed |= "ERROR".equals(attempt.status());
                result = attempt;
                if (attempt.photo().isPresent()) return attempt;
                if (List.of("NOT_CONFIGURED", "DAILY_LIMIT").contains(attempt.status())) break;
            }
        }
        return failed ? new SearchResult(result.term(), "ERROR", Optional.empty()) : result;
    }

    private SearchResult search(String term, Set<String> excluded) {
        URI uri = URI.create(COMMONS_QUERY + "&generator=search&gsrnamespace=6&gsrlimit=10&gsrsearch="
                + URLEncoder.encode(term, StandardCharsets.UTF_8));
        try {
            JsonNode response = json.readTree(fetch(uri));
            if (response == null || !response.isObject() || response.has("error")) {
                return new SearchResult(term, "ERROR", Optional.empty());
            }
            boolean filesFound = false;
            boolean cc0Found = false;
            for (JsonNode page : response.path("query").path("pages")) {
                if (!page.path("title").asText().startsWith("File:")) continue;
                filesFound = true;
                JsonNode metadata = page.path("imageinfo").path(0).path("extmetadata");
                if (licenseName(licenseUrl(metadata)) == null) continue;
                cc0Found = true;
                Optional<Photo> photo = parsePhoto(page);
                if (photo.isPresent() && !excluded.contains(photo.get().image())) return new SearchResult(term, "FOUND", photo);
            }
            String status = cc0Found ? "INVALID_METADATA" : filesFound ? "NO_CC0" : "NO_RESULTS";
            return new SearchResult(term, status, Optional.empty());
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
        } catch (IOException | JacksonException | IllegalArgumentException ex) {
            // Preserve the failure status for the administrator without exposing upstream details.
        }
        return new SearchResult(term, "ERROR", Optional.empty());
    }

    static List<String> searchTerms(String name, boolean dish) {
        LinkedHashSet<String> terms = new LinkedHashSet<>();
        terms.add(name);
        if (!dish) return List.copyOf(terms); // Never simplify away raw/cooked food distinctions.
        String compact = dishKey(name);
        if (compact.contains("김치") && compact.endsWith("국")) { terms.add("김치국"); terms.add("kimchi soup"); }
        if (compact.contains("김칫") && compact.endsWith("국")) { terms.add("김칫국"); terms.add("kimchi soup"); }
        String[][] aliases = {
            {"김치국", "김치국", "kimchi soup"}, {"김칫국", "김칫국", "kimchi soup"},
            {"김치찌개", "김치찌개", "kimchi jjigae"}, {"김치찜", "김치찜", "kimchi jjim"},
            {"김치짜글이", "김치짜글이", "kimchi jjageuli"}, {"된장찌개", "된장찌개", "doenjang jjigae"},
            {"짜장면", "짜장면", "jajangmyeon"}, {"자장면", "짜장면", "jajangmyeon"},
            {"두부김치", "두부김치", "dubu kimchi"}, {"볶음밥", "볶음밥", "bokkeumbap"},
            {"김치전", "김치전", "kimchi pancake"}, {"삼겹살구이", "삼겹살구이", "samgyeopsal"}
        };
        for (String[] alias : aliases) {
            if (compact.contains(alias[0])) { terms.add(alias[1]); terms.add(alias[2]); break; }
        }
        return List.copyOf(terms);
    }

    static String licenseName(String url) {
        if (isCc0(url)) return "CC0";
        if (url.matches("https://creativecommons\\.org/licenses/by/(?:1\\.0|2\\.0|2\\.5|3\\.0|4\\.0)/?"))
            return "CC BY " + url.replaceAll(".*/by/", "").replace("/", "");
        if (url.matches("https://creativecommons\\.org/licenses/by-sa/(?:1\\.0|2\\.0|2\\.5|3\\.0|4\\.0)/?"))
            return "CC BY-SA " + url.replaceAll(".*/by-sa/", "").replace("/", "");
        return null; // NC, ND, missing or unknown licenses are not accepted.
    }

    private SearchResult searchOpenverse(String term, Set<String> excluded) {
        if (Instant.now().isBefore(openverseRetryAfter)) return new SearchResult(term, "ERROR", Optional.empty());
        try {
            URI uri = URI.create("https://api.openverse.org/v1/images/?page_size=10&source=flickr&license=cc0,by,by-sa&mature=false&q="
                    + URLEncoder.encode(term, StandardCharsets.UTF_8));
            JsonNode response = json.readTree(fetch(uri));
            if (response == null || !response.path("results").isArray())
                return new SearchResult(term, "ERROR", Optional.empty());
            for (JsonNode item : response.path("results")) {
                String id = item.path("id").asText("");
                String author = item.path("creator").asText("").strip();
                String source = item.path("foreign_landing_url").asText("");
                String licenseUrl = item.path("license_url").asText("").replaceFirst("^http:", "https:");
                String license = licenseName(licenseUrl);
                // Fetch images only through the fixed Openverse thumbnail endpoint, never a supplied remote URL.
                if (!id.matches("[0-9a-fA-F-]{36}") || author.isBlank() || author.length() > 200
                        || license == null || !safePublicLink(source) || item.path("mature").asBoolean(false)) continue;
                Photo photo = new Photo("https://api.openverse.org/v1/images/" + id + "/thumb/",
                        source, author, license, licenseUrl, "Openverse / " + cleanTitle(item.path("source").asText("source")).substring(0, Math.min(100, cleanTitle(item.path("source").asText("source")).length())), cleanTitle(item.path("title").asText("")));
                if (!excluded.contains(photo.image())) return new SearchResult(term, "FOUND", Optional.of(photo));
            }
            return new SearchResult(term, "NO_RESULTS", Optional.empty());
        } catch (InterruptedException error) { Thread.currentThread().interrupt(); }
        catch (IOException | JacksonException | IllegalArgumentException error) { /* Retry later. */ }
        return new SearchResult(term, "ERROR", Optional.empty());
    }

    private static boolean safePublicLink(String value) {
        try {
            URI uri = URI.create(value);
            String host = uri.getHost();
            return value.length() <= 1000 && "https".equals(uri.getScheme()) && host != null
                    && host.contains(".") && !host.matches("[0-9.]+") && !host.endsWith(".local")
                    && !host.endsWith(".localhost") && uri.getRawUserInfo() == null && uri.getPort() == -1;
        } catch (IllegalArgumentException error) { return false; }
    }

    private static String representativeName(String key) {
        if (key.contains("짜장면") || key.contains("자장면")) return "짜장면";
        if (key.contains("김치찌개")) return "김치찌개";
        if (key.contains("된장찌개")) return "된장찌개";
        if (key.contains("볶음밥")) return "볶음밥";
        if (key.contains("삼겹살구이") || key.contains("삼겹살팬구이")) return "삼겹살구이";
        return null;
    }

    private static String statusLabel(String status) {
        if (status == null) return "이전 조회 · 결과 기록 없음";
        return switch (status) {
            case "FOUND" -> "후보 발견";
            case "NOT_CONFIGURED" -> "키 미설정 · 건너뜀";
            case "DAILY_LIMIT" -> "일일 자체 한도 · 다음 날 재시도";
            case "EXCLUDED" -> "검색 제외됨";
            case "READY" -> "검색 재개됨 · 다음 조회 대기";
            case "SEARCHING" -> "검색 시작 · 결과 기록 대기";
            case "ERROR" -> "일부 사진 출처 연결 오류 · 다음 주기에 재시도";
            case "NO_RESULTS" -> "검색 결과 없음";
            case "NO_CC0" -> "사용 가능한 라이선스 후보 없음";
            case "INVALID_METADATA" -> "후보의 사진 형식·출처 정보 확인 불가";
            default -> "상태 확인 필요";
        };
    }

    private String fetch(URI uri) throws IOException, InterruptedException {
        var request = HttpRequest.newBuilder(uri).timeout(Duration.ofSeconds(5))
                .header("User-Agent", "SmartNF-RecipePhoto/1.0 (https://github.com/tylyoon/smartnf)")
                .GET().build();
        var response = client.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() == 429 && "api.openverse.org".equals(uri.getHost()))
            openverseRetryAfter = Instant.now().plus(Duration.ofHours(1));
        if (response.statusCode() != 200) throw new IOException("Commons returned " + response.statusCode());
        return response.body();
    }

    private synchronized Optional<Photo> photo() {
        if (Instant.now().isBefore(refreshAfter)) {
            return cached;
        }
        cached = Optional.empty();
        try {
            JsonNode page = json.readTree(fetch(LOOKUP)).path("query").path("pages").path(0);
            if (FILE_TITLE.equals(page.path("title").asText())) cached = parsePhoto(page);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
        } catch (IOException | JacksonException | IllegalArgumentException ex) {
            // Recipe text stays usable when Commons or its metadata is unavailable.
        }
        refreshAfter = Instant.now().plus(cached.isPresent() ? Duration.ofDays(1) : Duration.ofMinutes(15));
        return cached;
    }

    private Optional<Photo> parsePhoto(JsonNode page) {
        JsonNode info = page.path("imageinfo").path(0);
        JsonNode metadata = info.path("extmetadata");
        String image = info.path("thumburl").asText("");
        String source = info.path("descriptionurl").asText("");
        String licenseUrl = licenseUrl(metadata);
        String author = HtmlUtils.htmlUnescape(metadata.path("Artist").path("value").asText("")
                .replaceAll("<[^>]*>", "")).strip();
        if (!List.of("image/jpeg", "image/png", "image/webp").contains(info.path("mime").asText())
                || image.length() > 1000 || source.length() > 1000
                || !(trusted(image, "upload.wikimedia.org", "/wikipedia/commons/")
                    || trusted(image, "thumb.wikimedia.org", "/wikipedia/commons/thumb/"))
                || !trusted(source, "commons.wikimedia.org", "/wiki/File:")
                || licenseName(licenseUrl) == null
                || author.isBlank() || author.length() > 200) {
            return Optional.empty();
        }
        return Optional.of(new Photo(image, source, author, licenseName(licenseUrl), licenseUrl, "Wikimedia Commons", cleanTitle(page.path("title").asText(""))));
    }

    static String cleanTitle(String value) {
        String clean = HtmlUtils.htmlUnescape(value.replaceAll("<[^>]*>", "")).strip();
        return clean.length() > 300 ? clean.substring(0, 300) : clean;
    }

    private static String licenseUrl(JsonNode metadata) {
        return metadata.path("LicenseUrl").path("value").asText("").strip()
                .replaceFirst("^http://creativecommons\\.org/", "https://creativecommons.org/");
    }

    private static boolean isCc0(String url) {
        return url.equals(CC0_URL) || url.equals(CC0_URL.substring(0, CC0_URL.length() - 1))
                || url.startsWith(CC0_URL) && url.substring(CC0_URL.length()).matches("deed(?:\\.[a-zA-Z-]+)?");
    }

    private static boolean trusted(String value, String host, String prefix) {
        URI uri;
        try {
            uri = URI.create(value);
        } catch (IllegalArgumentException ex) {
            return false;
        }
        return "https".equals(uri.getScheme()) && host.equals(uri.getHost())
                && uri.getRawUserInfo() == null && uri.getPort() == -1 && uri.getPath().startsWith(prefix);
    }

    private record LookupTarget(String key, String name) {}

    private record SearchResult(String term, String status, Optional<Photo> photo) {}

    public record SearchHistory(String key, String name, Timestamp checkedAt, String status, String term, boolean excluded, String details) {}

    public record ReviewPhoto(String key, String name, String image, String source, String author, String term, String license, String licenseUrl, String provider, String title) {}

    public record Lookup(String name, boolean discover) {}
    public record Photo(String image, String source, String author, String license, String licenseUrl, String provider, String title) {}
}

@Configuration(proxyBeanMethods = false)
@EnableScheduling
class RecipePhotoSchedulingConfiguration {}
