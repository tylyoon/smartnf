package com.onrender.smartnf.health;

import tools.jackson.databind.json.JsonMapper;
import tools.jackson.databind.node.ObjectNode;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.security.MessageDigest;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
public class BusinessPaymentController {
    private final CurrentHealthMember members;
    private final JsonMapper mapper = JsonMapper.builder().build();

    public BusinessPaymentController(CurrentHealthMember members) {
        this.members = members;
    }

    @PostMapping(value="/api/me/business-payments/{action}", produces=MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> payment(Authentication auth, @PathVariable String action,
                                           @RequestBody String json) throws Exception {
        long member = members.id(auth);
        if (!Set.of("config", "prepare", "status", "confirm", "sync", "cancel", "refund", "release").contains(action)
                || json.length() > 16384) return ResponseEntity.badRequest().build();
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(run(member, action, json, 60));
    }

    @PostMapping(value="/api/business-payments/webhook/{token}", produces=MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> webhook(@PathVariable String token, @RequestBody String json) throws Exception {
        String expected = System.getenv().getOrDefault("SMARTNF_TOSS_WEBHOOK_TOKEN", "");
        if (expected.length() < 32 || !MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8),
                token.getBytes(StandardCharsets.UTF_8))) return ResponseEntity.status(403).build();
        if (json.length() > 65536) return ResponseEntity.badRequest().build();
        var body = mapper.readTree(json);
        if (body == null || !body.isObject()) return ResponseEntity.badRequest().build();
        ((ObjectNode) body).put("hookToken", token);
        String result = run(0, "webhook", mapper.writeValueAsString(body), 8);
        return ResponseEntity.status(mapper.readTree(result).has("error") ? 503 : 200)
                .cacheControl(CacheControl.noStore()).body("{}");
    }

    private String run(long member, String action, String json, int timeout) throws Exception {
        var output = Files.createTempFile("smartnf-payment-", ".json");
        Process process = null;
        try {
            var builder = new ProcessBuilder(System.getenv().getOrDefault("SMARTNF_PYTHON", "python"),
                    "tools/business/trade_payments.py", String.valueOf(member), action);
            builder.environment().put("PYTHONIOENCODING", "utf-8");
            process = builder.redirectOutput(output.toFile()).redirectError(ProcessBuilder.Redirect.DISCARD).start();
            try (var input = process.getOutputStream()) {
                input.write(json.getBytes(StandardCharsets.UTF_8));
            }
            if (!process.waitFor(timeout, TimeUnit.SECONDS) || process.exitValue() != 0) {
                return "{\"error\":\"PG 처리 상태를 다시 조회하세요.\"}";
            }
            return Files.readString(output, StandardCharsets.UTF_8);
        } finally {
            if (process != null && process.isAlive()) process.destroyForcibly();
            Files.deleteIfExists(output);
        }
    }
}
