package com.onrender.smartnf.health;
import java.math.*;import java.util.regex.*;
public record ProductQuantity(BigDecimal amount,String unit){
 public static ProductQuantity parse(String name){if(name==null)return null;String flags=name.replaceAll("[0-9]\\+{1,2}등급","등급");if(flags.matches("(?s).*(옵션|선택|증정|내외|이상|이하|혼합|모둠|세트|~|/|\\+|[0-9]\\s*-\\s*[0-9]|당\\s*[0-9]|각\\s*[0-9]).*"))return null;
  var m=Pattern.compile("(?i)(?<![0-9.])([0-9]+(?:\\.[0-9]+)?)\\s*(kg|㎏|ml|ℓ|L|리터|밀리리터|g|그램)(?![a-z])").matcher(name);if(!m.find()){
   var count=Pattern.compile("(?<![0-9.])([0-9]+)\\s*(개입|구|개|알|판|팩|봉|병)(?![가-힣])").matcher(name);if(!count.find())return null;
   BigDecimal value=new BigDecimal(count.group(1));String token=count.group(2),unit=token.matches("개입|구|개|알")?"ea":token.equals("팩")?"pack":token.equals("봉")?"bag":token.equals("병")?"bottle":"pack";int end=count.end();
   while(count.find()){String next=count.group(2),nextUnit=next.matches("개입|구|개|알")?"ea":next.equals("팩")?"pack":next.equals("봉")?"bag":next.equals("병")?"bottle":"pack";if(!nextUnit.equals(unit)||new BigDecimal(count.group(1)).compareTo(value)!=0)return null;}var mult=Pattern.compile("(?i)^\\s*[x×*]\\s*([0-9]+)").matcher(name.substring(end));if(mult.find())value=value.multiply(new BigDecimal(mult.group(1)));else if(name.matches("(?s).*[x×*].*"))return null;
   return value.signum()>0&&value.compareTo(BigDecimal.valueOf(10000000))<=0?new ProductQuantity(value,unit):null;
  }if(name.substring(0,m.start()).matches("(?s).*[0-9]+\\s*(?:봉|팩|병|개입|입).*"))return null;BigDecimal amount=new BigDecimal(m.group(1));String raw=m.group(2).toLowerCase();String unit=raw.matches("ml|ℓ|l|리터|밀리리터")?"ml":"g";if(raw.matches("kg|㎏|ℓ|l|리터"))amount=amount.multiply(BigDecimal.valueOf(1000));int end=m.end();if(m.find())return null;
  var multiple=Pattern.compile("(?i)^\\s*(?:[x×*]\\s*([0-9]+)\\s*(?:봉|팩|병|개|입)?|[·,]\\s*([0-9]+)\\s*(?:개입|개|병|팩|봉|입)(?![가-힣]))").matcher(name.substring(end));if(multiple.find()){amount=amount.multiply(new BigDecimal(multiple.group(1)!=null?multiple.group(1):multiple.group(2)));if(name.substring(end+multiple.end()).matches("(?s).*[0-9]+\\s*(?:봉|팩|병|개입|개|입).*"))return null;}else if(name.matches("(?s).*[x×*].*")||name.substring(end).matches("(?s).*[0-9]+\\s*(?:봉|팩|병|개입|개|입).*"))return null;
  return amount.signum()>0&&amount.compareTo(BigDecimal.valueOf(10000000))<=0?new ProductQuantity(amount,unit):null;
 }
 public static java.util.List<ProductQuantity> quantities(String name){
  var first=parse(name);if(first==null)return java.util.List.of();var out=new java.util.ArrayList<ProductQuantity>();out.add(first);
  var count=Pattern.compile("(?<![0-9.])([0-9]+)\\s*(개입|구|개|알|팩|봉|병)(?![가-힣])").matcher(name);
  if(count.find()){BigDecimal amount=new BigDecimal(count.group(1));String token=count.group(2),unit=token.matches("개입|구|개|알")?"ea":token.equals("팩")?"pack":token.equals("봉")?"bag":"bottle";int end=count.end();
   if(!count.find()){var mult=Pattern.compile("(?i)^\\s*[x×*]\\s*([0-9]+)").matcher(name.substring(end));if(mult.find())amount=amount.multiply(new BigDecimal(mult.group(1)));if(!unit.equals(first.unit())&&amount.signum()>0&&amount.compareTo(BigDecimal.valueOf(10000000))<=0)out.add(new ProductQuantity(amount,unit));}
  }return java.util.List.copyOf(out);
 }

}
