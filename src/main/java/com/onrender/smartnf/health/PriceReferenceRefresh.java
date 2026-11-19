package com.onrender.smartnf.health;
import java.nio.file.*;import java.nio.charset.StandardCharsets;import java.util.concurrent.*;import java.util.logging.Logger;
import org.springframework.stereotype.Service;import org.springframework.beans.factory.DisposableBean;import org.springframework.beans.factory.annotation.Value;import org.springframework.jdbc.core.JdbcTemplate;
/** Persistent Python checkpoints own the 10:00/10:10/10:20 KST schedule and catch-up. */
@Service public class PriceReferenceRefresh implements DisposableBean {
 private final ScheduledExecutorService executor=Executors.newSingleThreadScheduledExecutor(r->{Thread t=new Thread(r,"smartnf-price-reference");t.setDaemon(true);return t;});
 private volatile Process active;private static final Logger LOG=Logger.getLogger(PriceReferenceRefresh.class.getName());
 private final JdbcTemplate jdbc;private final String key,model;
 public PriceReferenceRefresh(JdbcTemplate jdbc,@Value("${GEMINI_API_KEY:}") String key,@Value("${GEMINI_RECIPE_MODEL:gemini-3.5-flash-lite}") String model){
  this.jdbc=jdbc;this.key=key;this.model=model;
  if(!"false".equalsIgnoreCase(System.getenv("SMARTNF_PRICE_AUTO_REFRESH")))executor.scheduleWithFixedDelay(this::refresh,30,30,TimeUnit.SECONDS);
 }
 void refresh(){
  String python=System.getenv().getOrDefault("SMARTNF_PYTHON","python"),dir=System.getenv().getOrDefault("SMARTNF_PRICE_DATA_DIR","data/price-reference");
  Path script=Path.of("tools/price_sources/scheduled_prices.py");if(!Files.isRegularFile(script))return;
  try{
   // Only food names leave the database. No member IDs, health criteria, plans or quantities.
   var queries=jdbc.queryForList("SELECT DISTINCT i.food_name FROM shopping_list_items i JOIN shopping_lists l ON l.id=i.list_id WHERE l.deleted=FALSE ORDER BY i.food_name LIMIT 100",String.class);
   String targets=String.join("\n",queries.stream().filter(q->q!=null&&!q.isBlank()&&q.length()<=100&&q.chars().noneMatch(Character::isISOControl)).toList());
   Path log=Path.of(dir,"scheduled.log");Files.createDirectories(log.getParent());
   var builder=new ProcessBuilder(python,script.toString(),"--directory",dir).redirectErrorStream(true).redirectOutput(ProcessBuilder.Redirect.appendTo(log.toFile()));
   if(!key.isBlank())builder.environment().put("GEMINI_API_KEY",key);if(!model.isBlank())builder.environment().put("GEMINI_RECIPE_MODEL",model);
   active=builder.start();try(var input=active.getOutputStream()){input.write(targets.getBytes(StandardCharsets.UTF_8));}
   if(!active.waitFor(1100,TimeUnit.SECONDS)){active.destroyForcibly();LOG.warning("정기 수집 시간 초과 · 체크포인트에서 재개합니다.");}else if(active.exitValue()!=0)LOG.warning("정기 수집 실패 · 기존 가격 유지 · scheduled.log 확인");
  }catch(InterruptedException e){Thread.currentThread().interrupt();}catch(Exception e){LOG.warning("정기 수집 시작 실패 · 기존 가격 유지");}finally{active=null;}
 }
 @Override public void destroy(){executor.shutdownNow();Process p=active;if(p!=null)p.destroyForcibly();}
}
