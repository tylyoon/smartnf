package com.onrender.smartnf.health;

import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import java.io.*;
import java.security.*;
import static com.onrender.smartnf.health.HealthModels.*;

public final class HealthValidation {
    private HealthValidation(){}
    public static Map<String,List<String>> profile(Map<String,List<String>> input){
        if(input==null||input.size()>87)throw HealthException.invalid();
        var result=new TreeMap<String,List<String>>();boolean meaningful=false;
        for(var entry:input.entrySet()){
            var definition=HealthFields.ALL.get(entry.getKey());var values=entry.getValue();
            if(definition==null||values==null||values.size()>5||values.stream().anyMatch(Objects::isNull))throw HealthException.invalid();
            if(definition.name().equals("conditions")){
                if(new HashSet<>(values).size()!=values.size()||!HealthFields.CONDITION_LABELS.containsAll(values))throw HealthException.invalid();
                var selected=values.stream().sorted().toList();result.put("conditions",selected);meaningful|=!selected.isEmpty();continue;
            }
            if(definition.name().equals("goal")){
                if(new HashSet<>(values).size()!=values.size()||!definition.options().containsAll(values))throw HealthException.invalid();
                var goals=values.stream().sorted().toList();result.put("goal",goals);meaningful|=!goals.isEmpty();continue;
            }
            if(values.size()!=1)throw HealthException.invalid();
            String v=values.get(0).strip();if(v.length()>(definition.name().equals("labSource")?120:2000)||v.codePoints().anyMatch(c->Character.isISOControl(c)&&c!='\n'&&c!='\r'&&c!='\t'))throw HealthException.invalid();
            if(!v.isEmpty())try{
                switch(definition.kind()){
                    case "number" -> {
                        if(v.length()>24||!v.matches("[0-9]+(?:\\.[0-9]+)?"))throw HealthException.invalid();
                        var n=new BigDecimal(v).stripTrailingZeros();
                        if(n.compareTo(new BigDecimal(definition.min()))<0||n.compareTo(new BigDecimal(definition.max()))>0||Math.max(0,n.scale())>definition.scale())throw HealthException.invalid();
                        v=n.toPlainString();meaningful=true;
                    }
                    case "select" -> {if(!definition.options().contains(v))throw HealthException.invalid();meaningful|=!v.equals(definition.options().get(0));}
                    case "date" -> {if(!v.matches("[0-9]{4}-[0-9]{2}-[0-9]{2}"))throw HealthException.invalid();var date=LocalDate.parse(v);if(date.getYear()<1900||(!definition.name().startsWith("goal")&&date.isAfter(LocalDate.now(ZoneId.of("Asia/Seoul")))))throw HealthException.invalid();meaningful=true;}
                    case "month" -> {if(!v.matches("[0-9]{4}-[0-9]{2}"))throw HealthException.invalid();var month=YearMonth.parse(v);if(month.getYear()<1900||month.isAfter(YearMonth.now(ZoneId.of("Asia/Seoul"))))throw HealthException.invalid();meaningful=true;}
                    default -> meaningful=true;
                }
            }catch(DateTimeException|NumberFormatException ex){throw HealthException.invalid();}
            result.put(definition.name(),List.of(v));
        }
        result.putIfAbsent("conditions",List.of());
        // Discard default controls for unselected conditions; reject hidden substantive data.
        for(int i=0;i<5;i++)if(!result.get("conditions").contains(HealthFields.CONDITION_LABELS.get(i))){
            for(String prefix:List.of("diagnosed","visit","status","labdate","labs","care","symptoms")){
                String key=prefix+"_"+i,v=value(result,key);
                if(!v.isEmpty()&&!(prefix.equals("status")&&v.equals("미확인")))throw HealthException.invalid();
                result.remove(key);
            }
        }
        if(!meaningful)throw HealthException.invalid();
        String start=value(result,"goalStart"),end=value(result,"goalEnd");
        if(!start.isEmpty()&&!end.isEmpty()&&end.compareTo(start)<0)throw HealthException.invalid();
        String weight=value(result,"weight"),target=value(result,"targetWeight"),goal=value(result,"weightGoal");
        if(!weight.isEmpty()&&!target.isEmpty()){
            int comparison=new BigDecimal(target).compareTo(new BigDecimal(weight));
            if((goal.equals("감량")&&comparison>=0)||(goal.equals("증량")&&comparison<=0)||(goal.equals("유지")&&comparison!=0))throw HealthException.invalid();
        }
        return Collections.unmodifiableMap(result);
    }
    public static String value(Map<String,List<String>> fields,String name){var list=fields.get(name);return list==null||list.isEmpty()?"":list.get(0);}
    public static List<CareItem> care(List<CareItem> input){
        if(input==null||input.size()>10)throw HealthException.invalid();
        var ids=new HashSet<String>();var result=new ArrayList<CareItem>();
        for(var item:input){
            if(item==null||item.id()==null||!ids.add(item.id())||item.scopes()==null||item.scopes().isEmpty()||item.scopes().size()>6||new HashSet<>(item.scopes()).size()!=item.scopes().size())throw HealthException.invalid();
            for(String scope:item.scopes())if(scope==null||!HealthFields.SUPPORTED.getOrDefault(scope,List.of()).contains(item.id()))throw HealthException.invalid();
            result.add(new CareItem(item.id(),item.scopes().stream().sorted().toList()));
        }
        result.sort(Comparator.comparing(CareItem::id));return List.copyOf(result);
    }
    public static String hash(Map<String,List<String>> values){
        try{
            var bytes=new ByteArrayOutputStream();var out=new DataOutputStream(bytes);
            for(var e:new TreeMap<>(values).entrySet()){write(out,e.getKey());out.writeInt(e.getValue().size());for(String v:e.getValue())write(out,v);}
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes.toByteArray()));
        }catch(IOException|NoSuchAlgorithmException error){throw new IllegalStateException("저장 요청 검증 실패");}
    }
    private static void write(DataOutputStream out,String value)throws IOException{byte[] b=value.getBytes(java.nio.charset.StandardCharsets.UTF_8);out.writeInt(b.length);out.write(b);}
}
