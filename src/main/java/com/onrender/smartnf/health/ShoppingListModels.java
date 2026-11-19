package com.onrender.smartnf.health;
import java.math.BigDecimal;import java.time.LocalDate;import java.util.*;
public final class ShoppingListModels {
 private ShoppingListModels(){}
 public record Measure(BigDecimal amount,String unit,String evidence){}
 public record Item(String foodId,String name,BigDecimal grams,List<Measure> quantities){public Item(String foodId,String name,BigDecimal grams){this(foodId,name,grams,List.of());}}
 public static BigDecimal required(Item item,String unit){if("g".equals(unit)&&item.grams()!=null)return item.grams();return item.quantities()==null?null:item.quantities().stream().filter(q->q.unit().equals(unit)).map(Measure::amount).findFirst().orElse(null);}
 public static boolean positive(BigDecimal v){return v!=null&&v.signum()>0&&v.compareTo(new BigDecimal("10000000"))<=0&&v.stripTrailingZeros().scale()<=3;}
 public record Save(UUID id,UUID requestId,Long expectedRevision,LocalDate shoppingDate,LocalDate sourceFrom,LocalDate sourceTo,String sourceKind,List<Item> items){}
 public record Delete(UUID requestId,Long expectedRevision){}
 public record Saved(UUID id,long revision,boolean deleted,LocalDate shoppingDate,LocalDate sourceFrom,LocalDate sourceTo,String sourceKind,List<Item> items){}
 public record DayCount(LocalDate date,int count){}
 public record Range(List<Saved> lists,boolean truncated){}
 public static void date(LocalDate d){if(d==null||d.isBefore(LocalDate.of(1900,1,1))||d.isAfter(LocalDate.of(2100,12,31)))throw HealthException.invalid();}
 private static String text(String s,int max,boolean required){String v=s==null?"":s.strip();if(v.length()>max||required&&v.isEmpty()||v.chars().anyMatch(Character::isISOControl))throw HealthException.invalid();return v;}
 public static Save validate(Save s){
  if(s==null||s.id()==null||s.requestId()==null||s.expectedRevision()==null||s.expectedRevision()<0||s.expectedRevision()==Long.MAX_VALUE)throw HealthException.invalid();
  date(s.shoppingDate());date(s.sourceFrom());date(s.sourceTo());if(s.sourceFrom().isAfter(s.sourceTo())||java.time.temporal.ChronoUnit.DAYS.between(s.sourceFrom(),s.sourceTo())>62||!Set.of("WEEK","MONTH").contains(s.sourceKind()==null?"":s.sourceKind()))throw HealthException.invalid();
  if(s.items()==null||s.items().isEmpty()||s.items().size()>1000)throw new HealthException(400,"저장할 재료는 1~1000개여야 합니다.");
  var items=new ArrayList<Item>();for(var i:s.items()){
   if(i==null||i.grams()!=null&&!positive(i.grams()))throw HealthException.invalid();
   var quantities=new ArrayList<Measure>();var units=new HashSet<String>();
   if(i.quantities()!=null){if(i.quantities().size()>6)throw HealthException.invalid();for(var q:i.quantities()){
    if(q==null||!positive(q.amount())||!Set.of("g","ml","ea","pack","bag","bottle").contains(q.unit()==null?"":q.unit())||!units.add(q.unit()))throw new HealthException(400,"재료 수량·단위 또는 중복 단위를 확인하세요.");
    if(q.unit().equals("g")&&i.grams()!=null&&q.amount().compareTo(i.grams())!=0)throw new HealthException(400,"영양 중량과 확인한 g 수량이 다릅니다.");
    quantities.add(new Measure(q.amount().stripTrailingZeros(),q.unit(),text(q.evidence(),300,true)));
   }}
   if(i.grams()==null&&quantities.isEmpty())throw new HealthException(400,"재료의 수량과 단위를 입력하세요.");
   quantities.sort(Comparator.comparing(Measure::unit));
   BigDecimal grams=i.grams()==null?quantities.stream().filter(q->q.unit().equals("g")).map(Measure::amount).findFirst().orElse(null):i.grams().stripTrailingZeros();
   items.add(new Item(text(i.foodId(),150,false),text(i.name(),200,true),grams,List.copyOf(quantities)));
  }
  return new Save(s.id(),s.requestId(),s.expectedRevision(),s.shoppingDate(),s.sourceFrom(),s.sourceTo(),s.sourceKind(),List.copyOf(items));
 }
}
