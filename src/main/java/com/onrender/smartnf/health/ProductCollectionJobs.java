package com.onrender.smartnf.health;
import java.time.*;import java.util.*;import java.util.concurrent.*;import org.springframework.stereotype.Service;
@Service public class ProductCollectionJobs implements AutoCloseable,org.springframework.beans.factory.DisposableBean {
 public record Start(UUID requestId,String provider,String query){}
 public record View(UUID id,String provider,String query,String state,String message,List<CollectedProductService.Offer> offers){}
 private static final class Job {final long member,created;final UUID id;final String provider,query;volatile View view;Job(long m,Start s){member=m;created=System.currentTimeMillis();id=s.requestId();provider=s.provider();query=s.query();view=new View(id,provider,query,"QUEUED","수집 대기 중입니다.",List.of());}}
 private final Map<UUID,Job> jobs=new HashMap<>();
 private final Map<Long,Long> last=new HashMap<>();
 private final ThreadPoolExecutor executor=new ThreadPoolExecutor(2,2,0,TimeUnit.MILLISECONDS,new ArrayBlockingQueue<>(10),r->{Thread t=new Thread(r,"smartnf-product-collection");t.setDaemon(true);return t;});
 private final IngredientProductService api;private final HomeplusFlyerCollector homeplus;
 public ProductCollectionJobs(IngredientProductService api,HomeplusFlyerCollector homeplus){this.api=api;this.homeplus=homeplus;}
 private void prune(){long now=System.currentTimeMillis();jobs.entrySet().removeIf(e->now-e.getValue().created>20*60_000);last.entrySet().removeIf(e->now-e.getValue()>20*60_000);}
 public synchronized View start(long member,Start raw){
  if(raw==null||raw.requestId()==null||raw.provider()==null||!Set.of("11ST","HOMEPLUS").contains(raw.provider())||raw.query()==null||raw.query().isBlank()||raw.query().strip().length()>100||raw.query().chars().anyMatch(Character::isISOControl))throw HealthException.invalid();
  Start s=new Start(raw.requestId(),raw.provider(),raw.query().strip());prune();Job old=jobs.get(s.requestId());if(old!=null){if(old.member!=member)throw new HealthException(404,"수집 작업을 찾을 수 없습니다.");if(!old.provider.equals(s.provider())||!old.query.equals(s.query()))throw HealthException.conflict();return old.view;}
  if(jobs.size()>=100||System.currentTimeMillis()-last.getOrDefault(member,0L)<60_000||jobs.values().stream().anyMatch(j->j.member==member&&Set.of("QUEUED","RUNNING").contains(j.view.state())))throw new HealthException(429,"수집 작업이 진행 중이거나 요청이 많습니다. 1분 뒤 다시 시도하세요.");
  Job job=new Job(member,s);jobs.put(job.id,job);try{executor.execute(()->run(job));last.put(member,System.currentTimeMillis());}catch(RejectedExecutionException e){jobs.remove(job.id);throw new HealthException(429,"수집 요청이 많습니다. 잠시 후 다시 시도하세요.");}return job.view;
 }
 public synchronized View get(long member,UUID id){prune();Job job=jobs.get(id);if(job==null||job.member!=member)throw new HealthException(404,"수집 작업이 만료되었거나 찾을 수 없습니다. 다시 수집해 주세요.");return job.view;}
 public synchronized View current(long member){prune();return jobs.values().stream().filter(j->j.member==member).max(Comparator.comparingLong(j->j.created)).map(j->j.view).orElse(null);}
 private void done(Job job,String state,String message,List<CollectedProductService.Offer> offers){job.view=new View(job.id,job.provider,job.query,state,message,List.copyOf(offers));}
 private void run(Job job){done(job,"RUNNING","판매처에서 자료를 확인하고 있습니다.",List.of());try{
  List<CollectedProductService.Offer> offers;
  if(job.provider.equals("HOMEPLUS"))offers=homeplus.collect(job.query);
  else{
   var response=api.search(job.query);if(!response.provider().equals("11ST")){done(job,"NEEDS_CONFIGURATION","선택한 11번가 수집은 연결되지 않았습니다. 판매 사이트에서 확인하세요.",List.of());return;}if(response.products().isEmpty()&&response.message().contains("설정")){done(job,"NEEDS_CONFIGURATION",response.message(),List.of());return;}
   String day=LocalDate.now(ZoneId.of("Asia/Seoul")).toString();offers=response.products().stream().map(p->new CollectedProductService.Offer("API","11ST",p.id(),p.name(),p.merchant().isBlank()?"11번가 판매자":p.merchant(),p.grams(),p.price(),p.url(),p.checkedAt(),day,day,"ONLINE",p.conditions(),"",p.name()+" · API ProductPrice 기준. 포장·옵션·배송 조건 확인 필요.",false)).toList();
  }
  done(job,offers.isEmpty()?"EMPTY":"REVIEW_REQUIRED",offers.isEmpty()?"일치하는 상품이 없습니다. 다른 검색어로 다시 시도하세요.":offers.size()+"개 후보를 가져왔습니다. 검토 화면에서 가격·포장량·기간·조건을 확인하세요.",offers);
 }catch(HomeplusFlyerCollector.Unavailable e){done(job,e.state,e.getMessage(),List.of());}catch(HealthException e){done(job,e.status()==429?"RATE_LIMITED":"FAILED",e.getMessage(),List.of());}catch(Exception e){done(job,"FAILED","상품 수집에 실패했습니다. 기존 저장 상품은 유지됩니다. 다시 시도하세요.",List.of());}}
 @Override public void close(){executor.shutdownNow();}
 @Override public void destroy(){close();}
}
