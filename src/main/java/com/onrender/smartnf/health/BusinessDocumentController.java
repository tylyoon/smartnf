package com.onrender.smartnf.health;

import java.nio.file.Files;
import java.nio.charset.StandardCharsets;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/me/business-documents")
public class BusinessDocumentController {
    private final CurrentHealthMember members;

    public BusinessDocumentController(CurrentHealthMember members) {
        this.members = members;
    }

    @PostMapping(value="/{action}", produces=MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> process(Authentication auth,@PathVariable String action,@RequestBody String json) throws Exception {
        long member = members.id(auth);
        if (!Set.of("list","upload","get","save","approve","send","excel").contains(action) || json.length()>7_000_000)
            return ResponseEntity.badRequest().build();
        var output = Files.createTempFile("smartnf-document-", ".json");
        Process process = null;
        try {
            var builder = new ProcessBuilder(System.getenv().getOrDefault("SMARTNF_PYTHON","python"),
                    "tools/business/documents.py",String.valueOf(member),action);
            builder.environment().put("PYTHONIOENCODING","utf-8");
            process = builder.redirectOutput(output.toFile()).redirectError(ProcessBuilder.Redirect.DISCARD).start();
            try(var input=process.getOutputStream()){input.write(json.getBytes(StandardCharsets.UTF_8));}
            if (!process.waitFor(120,TimeUnit.SECONDS) || process.exitValue()!=0)
                return ResponseEntity.status(503).body("{\"error\":\"문서 처리기 실행 상태를 확인하세요.\"}");
            return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(Files.readString(output));
        } finally {
            if(process!=null && process.isAlive())process.destroyForcibly();
            Files.deleteIfExists(output);
        }
    }
}
