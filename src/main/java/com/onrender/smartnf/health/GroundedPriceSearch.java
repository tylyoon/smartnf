package com.onrender.smartnf.health;
import java.nio.file.*;import java.nio.charset.StandardCharsets;import java.util.concurrent.TimeUnit;import org.springframework.stereotype.Service;import org.springframework.beans.factory.annotation.Value;
@Service public class GroundedPriceSearch {
 private final String key,model;private long last;
 public GroundedPriceSearch(@Value("${GEMINI_API_KEY:}") String key,@Value("${GEMINI_RECIPE_MODEL:gemini-3.5-flash-lite}") String model){this.key=key;this.model=model;}
 public synchronized String search(String query){if(query==null||query.isBlank()||query.length()>100||query.chars().anyMatch(Character::isISOControl))throw HealthException.invalid();if(System.currentTimeMillis()-last<10000)throw new HealthException(429,"잠시 후 다시 검색하세요.");last=System.currentTimeMillis();Path out=null;Process process=null;
  try{out=Files.createTempFile("smartnf-grounding-",".json");var b=new ProcessBuilder(System.getenv().getOrDefault("SMARTNF_PYTHON","python"),"tools/price_sources/grounded_price_search.py",query).redirectOutput(out.toFile()).redirectError(ProcessBuilder.Redirect.DISCARD);b.environment().put("PYTHONIOENCODING","utf-8");if(!key.isBlank())b.environment().put("GEMINI_API_KEY",key);if(!model.isBlank())b.environment().put("GEMINI_RECIPE_MODEL",model);process=b.start();if(!process.waitFor(45,TimeUnit.SECONDS)||process.exitValue()!=0||Files.size(out)>300000)throw new Exception();return Files.readString(out,StandardCharsets.UTF_8);
  }catch(InterruptedException e){Thread.currentThread().interrupt();throw new HealthException(503,"Grounding 검색 중단");}catch(Exception e){throw new HealthException(502,"Grounding 검색 실패");}finally{if(process!=null&&process.isAlive())process.destroyForcibly();if(out!=null)try{Files.deleteIfExists(out);}catch(Exception ignored){}}
 }
}
