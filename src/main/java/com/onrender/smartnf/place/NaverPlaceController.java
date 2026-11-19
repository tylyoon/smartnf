package com.onrender.smartnf.place;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;
import java.util.Set;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Fixed-host provider proxy. Never returns credentials or forwards health data. */
@RestController
@RequestMapping("/api/places")
public class NaverPlaceController {
    private final HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
    private final Set<String> categories = Set.of("마트", "대형마트", "창고형매장", "쇼핑센터", "전통시장", "식료품점", "한식", "중식", "일식", "이탈리아음식", "태국음식", "베트남음식", "음식점");
    private final Map<String, Set<String>> brands = Map.of(
        "대형마트", Set.of("이마트", "홈플러스", "롯데마트", "하나로마트"),
        "창고형매장", Set.of("트레이더스", "코스트코"),
        "쇼핑센터", Set.of("스타필드", "롯데백화점", "신세계백화점", "현대백화점"));
    private boolean safeText(String text, int min) {
        return text != null && text.length() >= min && text.length() <= 60
            && text.matches("[가-힣a-zA-Z0-9 .·()_-]*");
    }
    private long window = 0;
    private int calls = 0;
    private String env(String name) { String v = System.getenv(name); return v == null ? "" : v.trim(); }
    private boolean ready() { return !env("NAVER_SEARCH_CLIENT_ID").isEmpty() && !env("NAVER_SEARCH_CLIENT_SECRET").isEmpty(); }
    private synchronized boolean allowance() {
        long now = System.currentTimeMillis() / 60000;
        if (now != window) { window = now; calls = 0; }
        return ++calls <= 30;
    }
    @GetMapping("/config")
    public Map<String, Object> config() {
        return Map.of("keyId", env("NAVER_MAP_KEY_ID"), "searchConfigured", ready());
    }
    @GetMapping(value = "/search", produces = "application/json")
    public ResponseEntity<String> search(@RequestParam("region") String region, @RequestParam("category") String category,
            @RequestParam(value = "brand", defaultValue = "") String brand,
            @RequestParam(value = "keyword", defaultValue = "") String keyword) {
        region = region.trim(); keyword = keyword.trim();
        if (!safeText(region, 2) || !safeText(keyword, 0) || !categories.contains(category)
                || (!brand.isEmpty() && !brands.getOrDefault(category, Set.of()).contains(brand)))
            return failure(400, "INVALID_QUERY");
        if (!ready()) return failure(503, "NOT_CONFIGURED");
        if (!allowance()) return failure(429, "RATE_LIMIT");
        String q = URLEncoder.encode(region + " " + (brand.isEmpty() ? category : brand) + (keyword.isEmpty() ? "" : " " + keyword), StandardCharsets.UTF_8);
        HttpRequest request = HttpRequest.newBuilder(URI.create("https://naverapihub.apigw.ntruss.com/search/v1/local?display=5&start=1&sort=random&format=json&query=" + q))
            .timeout(Duration.ofSeconds(8)).header("X-NCP-APIGW-API-KEY-ID", env("NAVER_SEARCH_CLIENT_ID"))
            .header("X-NCP-APIGW-API-KEY", env("NAVER_SEARCH_CLIENT_SECRET")).GET().build();
        try {
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() != 200) return failure(502, "PROVIDER_ERROR");
            return ResponseEntity.ok().header("Cache-Control", "no-store").body(response.body());
        } catch (InterruptedException ex) { Thread.currentThread().interrupt(); return failure(503, "INTERRUPTED"); }
        catch (Exception ex) { return failure(502, "PROVIDER_UNAVAILABLE"); }
    }
    private ResponseEntity<String> failure(int status, String code) {
        return ResponseEntity.status(status).header("Cache-Control", "no-store").body("{\"error\":\"" + code + "\"}");
    }
}
