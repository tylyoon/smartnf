import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.concurrent.TimeUnit;
import java.util.regex.Pattern;

/** Exercises the same UTF-8 subprocess boundary as the Spring controller. */
public class BusinessWorkerCheck {
    private static String call(Path database, String action, String json) throws Exception {
        return call(database, action, json, "tools/business/trade.py");
    }

    private static String call(Path database, String action, String json, String script) throws Exception {
        var output = Files.createTempFile("smartnf-worker-check-", ".json");
        Process process = null;
        try {
            var builder = new ProcessBuilder(System.getenv().getOrDefault("SMARTNF_PYTHON", "python"),
                    script, "1", action);
            builder.environment().put("SMARTNF_TRADE_DB", database.toString());
            builder.environment().put("PYTHONIOENCODING", "utf-8");
            process = builder.redirectOutput(output.toFile()).redirectError(ProcessBuilder.Redirect.INHERIT).start();
            try (var input = process.getOutputStream()) {
                input.write(json.getBytes(StandardCharsets.UTF_8));
            }
            if (!process.waitFor(30, TimeUnit.SECONDS) || process.exitValue() != 0) {
                throw new AssertionError("Business worker did not complete");
            }
            return Files.readString(output, StandardCharsets.UTF_8);
        } finally {
            if (process != null && process.isAlive()) process.destroyForcibly();
            Files.deleteIfExists(output);
        }
    }

    public static void main(String[] args) throws Exception {
        var temporary = Files.createTempDirectory("smartnf-business-java-");
        try {
            var database = temporary.resolve("trade.sqlite");
            var result = call(database, "register", """
                    {"name":"한글 테스트 농장","requestId":"java-register"}
                    """);
            var match = Pattern.compile("\"id\"\\s*:\\s*\"(B-[A-Z0-9]+)\"").matcher(result);
            if (!match.find()) throw new AssertionError(result);
            var organization = match.group(1);
            var listed = call(database, "organizations", "{}");
            if (!listed.contains("한글 테스트 농장")) throw new AssertionError(listed);
            var payload = "{\"org\":\"" + organization
                    + "\",\"name\":\"냉장 창고\",\"zone\":\"냉장\",\"requestId\":\"java-warehouse\"}";
            var created = call(database, "warehouse", payload);
            if (!created.equals(call(database, "warehouse", payload))) throw new AssertionError("Retry changed result");
            var dashboard = call(database, "dashboard", "{\"org\":\"" + organization + "\"}");
            if (!dashboard.contains("냉장 창고") || !dashboard.contains("notifications")) throw new AssertionError(dashboard);
            var pgConfig = call(database, "config", "{}", "tools/business/trade_payments.py");
            if (!pgConfig.contains("\"mode\": \"TEST\"") || pgConfig.contains("test_gsk_")) throw new AssertionError("PG configuration disclosure");
            System.out.println("PASS Java 21 workers, UTF-8, persistence, idempotent retry and PG test-only config");
        } finally {
            try (var paths = Files.walk(temporary)) {
                for (var path : paths.sorted(Comparator.reverseOrder()).toList()) Files.deleteIfExists(path);
            }
        }
    }
}
