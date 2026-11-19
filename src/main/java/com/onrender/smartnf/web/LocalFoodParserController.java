package com.onrender.smartnf.web;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpTimeoutException;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.Semaphore;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

@RestController
public class LocalFoodParserController {
    private final boolean enabled;
    private final URI endpoint;
    private final HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(3)).build();
    private final JsonMapper json = JsonMapper.builder().build();
    private final Semaphore slots = new Semaphore(2);
    private final JsonNode schema;
    private final String prompt;
    public record Input(String text) {}

    public LocalFoodParserController(@Value("${SMARTNF_LOCAL_LLM_ENABLED:false}") boolean enabled,
            @Value("${SMARTNF_LLM_PORT:8091}") int port) throws IOException {
        this.enabled = enabled;
        if (port < 1024 || port > 65535) throw new IllegalArgumentException("Invalid local LLM port");
        endpoint = URI.create("http://127.0.0.1:" + port + "/v1/chat/completions");
        try (var input = new ClassPathResource("llm/food-parser.schema.json").getInputStream()) {
            schema = json.readTree(new String(input.readAllBytes(), StandardCharsets.UTF_8));
        }
        try (var input = new ClassPathResource("llm/food-parser-prompt.txt").getInputStream()) {
            prompt = new String(input.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    @PostMapping("/api/recipes/normalize")
    public ResponseEntity<JsonNode> normalize(@RequestBody Input input) {
        if (input == null || input.text() == null || input.text().isBlank() || input.text().length() > 500) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        }
        if (!enabled) return failure(HttpStatus.SERVICE_UNAVAILABLE, "LOCAL_LLM_DISABLED");
        if (!slots.tryAcquire()) return failure(HttpStatus.TOO_MANY_REQUESTS, "LOCAL_LLM_BUSY");
        try {
            var body = Map.of("model", "smartnf-food-parser", "temperature", 0, "max_tokens", 1500,
                    "messages", List.of(Map.of("role", "system", "content", prompt),
                            Map.of("role", "user", "content", json.writeValueAsString(
                                    Map.of("text", input.text(), "candidates", List.of())))),
                    "response_format", Map.of("type", "json_schema", "json_schema", Map.of("name", "food_parser", "schema", schema)));
            var request = HttpRequest.newBuilder(endpoint).timeout(Duration.ofSeconds(45))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(json.writeValueAsString(body))).build();
            var response = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) return failure(HttpStatus.BAD_GATEWAY, "LOCAL_LLM_HTTP_ERROR");
            if (response.body().length() > 131072) throw invalid();
            var choice = json.readTree(response.body()).path("choices").path(0);
            if (!choice.path("finish_reason").asText().equals("stop")) throw invalid();
            var result = json.readTree(choice.path("message").path("content").asText());
            validate(result, input.text());
            return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(result);
        } catch (ResponseStatusException error) {
            return failure(HttpStatus.BAD_GATEWAY, "LOCAL_LLM_AMOUNT_MISMATCH".equals(error.getReason())
                    ? "LOCAL_LLM_AMOUNT_MISMATCH" : "LOCAL_LLM_INVALID_OUTPUT");
        } catch (HttpTimeoutException error) {
            return failure(HttpStatus.GATEWAY_TIMEOUT, "LOCAL_LLM_TIMEOUT");
        } catch (InterruptedException error) {
            Thread.currentThread().interrupt();
            return failure(HttpStatus.SERVICE_UNAVAILABLE, "LOCAL_LLM_UNAVAILABLE");
        } catch (IOException | JacksonException | IllegalArgumentException error) {
            return failure(HttpStatus.SERVICE_UNAVAILABLE, "LOCAL_LLM_UNAVAILABLE");
        } finally {
            slots.release();
        }
    }

    private static void validate(JsonNode result, String text) {
        if (result == null || !result.isObject() || result.size() != 1) throw invalid();
        var entities = result.path("entities");
        if (!entities.isArray() || entities.size() > 20) throw invalid();
        for (JsonNode entity : entities) {
            if (!entity.isObject() || entity.size() != 6 || !entity.path("source_text").isTextual()
                    || !entity.path("normalized_name").isTextual() || entity.path("normalized_name").asText().isBlank()
                    || entity.path("normalized_name").asText().length() > 150
                    || !entity.path("kind").isTextual() || !entity.path("state").isTextual()
                    || !entity.has("amount_text") || !entity.has("candidate_id") || !entity.path("candidate_id").isNull()) throw invalid();
            String source = entity.path("source_text").asText();
            if (source.isBlank() || !text.contains(source)
                    || !Set.of("dish", "ingredient", "unknown").contains(entity.path("kind").asText())
                    || !Set.of("raw", "cooked", "unknown").contains(entity.path("state").asText())) throw invalid();
            var amount = entity.path("amount_text");
            if (!amount.isNull() && (!amount.isTextual() || amount.asText().isBlank() || !source.contains(amount.asText()))) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "LOCAL_LLM_AMOUNT_MISMATCH");
            }
        }
    }

    private ResponseEntity<JsonNode> failure(HttpStatus status, String code) {
        JsonNode body = json.createObjectNode().put("code", code);
        return ResponseEntity.status(status).cacheControl(CacheControl.noStore()).body(body);
    }

    private static ResponseStatusException invalid() {
        return new ResponseStatusException(HttpStatus.BAD_GATEWAY, "모델 해석을 확인할 수 없습니다.");
    }
}
