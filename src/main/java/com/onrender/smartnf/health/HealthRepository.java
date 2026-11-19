package com.onrender.smartnf.health;

import java.sql.*;
import java.time.*;
import java.math.BigDecimal;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.stereotype.Repository;
import static com.onrender.smartnf.health.HealthModels.*;

@Repository
public class HealthRepository {
    private final JdbcTemplate jdbc;
    public HealthRepository(JdbcTemplate jdbc){this.jdbc=jdbc;}
    void lockMember(long member){
        var states=jdbc.queryForList("SELECT status FROM members WHERE id=? FOR UPDATE",String.class,member);
        if(states.size()!=1||!states.get(0).equals("ACTIVE"))throw new HealthException(403,"현재 회원 상태로는 이용할 수 없습니다.");
    }
    long document(){
        var rows=jdbc.queryForList("SELECT id FROM consent_documents WHERE consent_type='HEALTH_DATA' AND version=? AND effective_at<=CURRENT_TIMESTAMP",Long.class,HealthService.DOCUMENT_VERSION);
        if(rows.size()!=1)throw new HealthException(503,"건강정보 저장 안내를 준비 중입니다.");return rows.get(0);
    }
    ConsentState consent(long member){
        long document=document();
        return jdbc.query("SELECT id,decision FROM member_consents WHERE member_id=? AND document_id=? ORDER BY id DESC LIMIT 1",
            (rs,row)->new ConsentState(rs.getString("decision").equals("AGREED"),rs.getLong("id"),HealthService.DOCUMENT_VERSION),member,document)
            .stream().findFirst().orElse(new ConsentState(false,null,HealthService.DOCUMENT_VERSION));
    }
    void consentEvent(long member,String decision){jdbc.update("INSERT INTO member_consents(member_id,document_id,decision,recorded_at) VALUES (?,?,?,?)",member,document(),decision,now());}
    Long latestProfile(long member){return jdbc.queryForList("SELECT id FROM health_profile_versions WHERE member_id=? ORDER BY id DESC LIMIT 1",Long.class,member).stream().findFirst().orElse(null);}
    Long latestCare(long member){return jdbc.queryForList("SELECT id FROM member_care_sets WHERE member_id=? ORDER BY id DESC LIMIT 1",Long.class,member).stream().findFirst().orElse(null);}
    record Stored(long id,String hash){}
    Stored priorProfile(long member,UUID request){return prior("health_profile_versions",member,request);}
    Stored priorCare(long member,UUID request){return prior("member_care_sets",member,request);}
    private Stored prior(String table,long member,UUID request){return jdbc.query("SELECT id,body_hash FROM "+table+" WHERE member_id=? AND request_id=?",(rs,row)->new Stored(rs.getLong(1),rs.getString(2)),member,request.toString()).stream().findFirst().orElse(null);}
    List<HistoryRow> history(long member,int page){return jdbc.query("SELECT id,created_at FROM health_profile_versions WHERE member_id=? ORDER BY id DESC LIMIT 20 OFFSET ?",(rs,row)->new HistoryRow(rs.getLong(1),rs.getTimestamp(2).toLocalDateTime().toString()+"Z"),member,page*20);}
    Profile profile(long member,long id){
        return jdbc.query("SELECT * FROM health_profile_versions WHERE member_id=? AND id=?",(rs,row)->{
            var fields=new LinkedHashMap<String,List<String>>();
            for(String key:HealthFields.PROFILE){var d=HealthFields.ALL.get(key);String value=rs.getString(d.column());if(value!=null)fields.put(key,key.equals("goal")?decodeGoals(value):List.of(decode(d,value)));}
            return new Profile(rs.getLong("id"),rs.getTimestamp("created_at").toLocalDateTime()+"Z",fields);
        },member,id).stream().findFirst().map(profile->{
            var fields=profile.fields();
            jdbc.query("SELECT metric_code,metric_value FROM health_measurements WHERE profile_id=?",(org.springframework.jdbc.core.RowCallbackHandler)rs->fields.put(rs.getString(1),List.of(rs.getBigDecimal(2).stripTrailingZeros().toPlainString())),id);
            var selected=new ArrayList<String>();
            jdbc.query("SELECT * FROM health_profile_conditions WHERE profile_id=?",(org.springframework.jdbc.core.RowCallbackHandler)rs->{
                int index=HealthFields.CONDITION_CODES.indexOf(rs.getString("condition_code"));if(index<0)throw new IllegalStateException("건강정보 분류 오류");
                selected.add(HealthFields.CONDITION_LABELS.get(index));
                int year=rs.getInt("diagnosed_year");if(!rs.wasNull())fields.put("diagnosed_"+index,List.of(YearMonth.of(year,rs.getInt("diagnosed_month")).toString()));
                String[] prefixes={"visit","status","labdate","labs","care","symptoms"};String[] columns={"visit_date","management_status","lab_date","lab_notes","care_notes","symptom_notes"};
                for(int i=0;i<prefixes.length;i++){String value=rs.getString(columns[i]);if(value!=null)fields.put(prefixes[i]+"_"+index,List.of(decode(HealthFields.ALL.get(prefixes[i]+"_"+index),value)));}
            },id);
            fields.put("conditions",selected.stream().sorted().toList());return profile;
        }).orElseThrow(()->new HealthException(404,"기록을 찾을 수 없습니다."));
    }
    long insertProfile(long member,ProfileRequest request,Map<String,List<String>> fields,String hash){
        var columns=new ArrayList<>(List.of("member_id","schema_version","request_id","body_hash","consent_document_id","consent_event_id","created_at"));
        var values=new ArrayList<Object>(List.of(member,1,request.requestId().toString(),hash,document(),request.consentEventId(),now()));
        for(String key:HealthFields.PROFILE){var definition=HealthFields.ALL.get(key);columns.add(definition.column());values.add(key.equals("goal")?encodeGoals(fields.getOrDefault(key,List.of())):encode(definition,HealthValidation.value(fields,key)));}
        long id=insert("INSERT INTO health_profile_versions("+String.join(",",columns)+") VALUES ("+String.join(",",Collections.nCopies(values.size(),"?"))+")",values);
        for(String key:HealthFields.METRICS.keySet()){String value=HealthValidation.value(fields,key);if(!value.isEmpty())jdbc.update("INSERT INTO health_measurements(profile_id,metric_code,metric_value,unit_code) VALUES (?,?,?,?)",id,key,new BigDecimal(value),HealthFields.METRICS.get(key));}
        for(String label:fields.get("conditions")){
            int index=HealthFields.CONDITION_LABELS.indexOf(label);String month=HealthValidation.value(fields,"diagnosed_"+index);YearMonth ym=month.isEmpty()?null:YearMonth.parse(month);
            jdbc.update("INSERT INTO health_profile_conditions(profile_id,condition_code,diagnosed_year,diagnosed_month,visit_date,management_status,lab_date,lab_notes,care_notes,symptom_notes) VALUES (?,?,?,?,?,?,?,?,?,?)",
                id,HealthFields.CONDITION_CODES.get(index),ym==null?null:ym.getYear(),ym==null?null:ym.getMonthValue(),
                encode(HealthFields.ALL.get("visit_"+index),HealthValidation.value(fields,"visit_"+index)),
                encode(HealthFields.ALL.get("status_"+index),HealthValidation.value(fields,"status_"+index)),
                encode(HealthFields.ALL.get("labdate_"+index),HealthValidation.value(fields,"labdate_"+index)),
                nullable(HealthValidation.value(fields,"labs_"+index)),nullable(HealthValidation.value(fields,"care_"+index)),nullable(HealthValidation.value(fields,"symptoms_"+index)));
        }
        return id;
    }
    CareSet care(long member,long id){
        return jdbc.query("SELECT id,profile_id,confirmed_at FROM member_care_sets WHERE member_id=? AND id=?",(rs,row)->{
            Number profile=(Number)rs.getObject(2);return new CareSet(rs.getLong(1),profile==null?null:profile.longValue(),rs.getTimestamp(3).toLocalDateTime()+"Z",new ArrayList<>(),false);
        },member,id).stream().findFirst().map(set->{
            var actionScopes=new TreeMap<String,List<String>>();
            jdbc.query("SELECT action_code FROM member_care_items WHERE set_id=?",(org.springframework.jdbc.core.RowCallbackHandler)rs->actionScopes.put(rs.getString(1),new ArrayList<>()),id);
            jdbc.query("SELECT action_code,scope_code FROM member_care_item_scopes WHERE set_id=? ORDER BY action_code,scope_code",(org.springframework.jdbc.core.RowCallbackHandler)rs->actionScopes.get(rs.getString(1)).add(rs.getString(2)),id);
            var items=actionScopes.entrySet().stream().map(e->new CareItem(e.getKey(),List.copyOf(e.getValue()))).toList();
            return new CareSet(set.id(),set.profileId(),set.savedAt(),items,!Objects.equals(set.profileId(),latestProfile(member)));
        }).orElseThrow(()->new HealthException(404,"기록을 찾을 수 없습니다."));
    }
    long insertCare(long member,CareRequest request,List<CareItem> items,String hash){
        var values=new ArrayList<Object>();Collections.addAll(values,member,request.profileId(),request.requestId().toString(),hash,request.consentEventId(),HealthService.CATALOG_VERSION,now());
        long id=insert("INSERT INTO member_care_sets(member_id,profile_id,request_id,body_hash,consent_event_id,catalog_version,confirmed_at) VALUES (?,?,?,?,?,?,?)",values);
        for(var item:items){jdbc.update("INSERT INTO member_care_items(set_id,action_code) VALUES (?,?)",id,item.id());for(String scope:item.scopes())jdbc.update("INSERT INTO member_care_item_scopes(set_id,action_code,scope_code) VALUES (?,?,?)",id,item.id(),scope);}
        return id;
    }
    void erase(long member){
        jdbc.update("DELETE FROM health_tracking_selection WHERE member_id=?",member);
        jdbc.update("DELETE FROM health_meal_ingredients WHERE day_id IN (SELECT id FROM health_meal_days WHERE member_id=?)",member);
        jdbc.update("DELETE FROM health_meal_items WHERE day_id IN (SELECT id FROM health_meal_days WHERE member_id=?)",member);
        jdbc.update("DELETE FROM health_meal_requests WHERE member_id=?",member);
        jdbc.update("DELETE FROM health_meal_days WHERE member_id=?",member);
        jdbc.update("DELETE FROM health_daily_practices WHERE daily_id IN (SELECT id FROM health_daily_records WHERE member_id=?)",member);
        jdbc.update("DELETE FROM health_daily_requests WHERE member_id=?",member);
        jdbc.update("DELETE FROM health_daily_records WHERE member_id=?",member);
        // Owner-filtered child deletion; no cascade into member identity or other services.
        jdbc.update("DELETE FROM member_care_item_scopes WHERE set_id IN (SELECT id FROM member_care_sets WHERE member_id=?)",member);
        jdbc.update("DELETE FROM member_care_items WHERE set_id IN (SELECT id FROM member_care_sets WHERE member_id=?)",member);
        jdbc.update("DELETE FROM member_care_sets WHERE member_id=?",member);
        jdbc.update("DELETE FROM health_measurements WHERE profile_id IN (SELECT id FROM health_profile_versions WHERE member_id=?)",member);
        jdbc.update("DELETE FROM health_profile_conditions WHERE profile_id IN (SELECT id FROM health_profile_versions WHERE member_id=?)",member);
        jdbc.update("DELETE FROM health_profile_versions WHERE member_id=?",member);
    }
    private long insert(String sql,List<Object> values){var holder=new GeneratedKeyHolder();jdbc.update(c->{var s=c.prepareStatement(sql,Statement.RETURN_GENERATED_KEYS);for(int i=0;i<values.size();i++)s.setObject(i+1,values.get(i));return s;},holder);return Objects.requireNonNull(holder.getKey()).longValue();}
    private static LocalDateTime now(){return LocalDateTime.ofInstant(Instant.now(),ZoneOffset.UTC);}
    private static Object nullable(String value){return value.isEmpty()?null:value;}
    private static Object encode(HealthFields.Field d,String value){
        if(value.isEmpty())return null;
        if(d.kind().equals("date"))return LocalDate.parse(value);
        if(d.kind().equals("number"))return new BigDecimal(value);
        if(d.kind().equals("select")){
            if(Set.of("breakfast","vegetables","sugary","late").contains(d.name()))return Integer.valueOf(value);
            return "V"+d.options().indexOf(value);
        }
        return value;
    }
    // Existing V0/V1/V2 rows remain readable; multiple choices fit the same VARCHAR(40).
    private static String encodeGoals(List<String> goals){
        if(goals.isEmpty())return null;return String.join(",",goals.stream().map(g->"V"+HealthFields.ALL.get("goal").options().indexOf(g)).toList());
    }
    private static List<String> decodeGoals(String value){
        var options=HealthFields.ALL.get("goal").options();if(options.contains(value))return List.of(value);
        return Arrays.stream(value.split(",")).map(v->{if(!v.matches("V[0-2]"))throw new IllegalStateException("관리 목표 저장 형식 오류");return options.get(Integer.parseInt(v.substring(1)));}).sorted().toList();
    }
    private static String decode(HealthFields.Field d,String value){
        if(d.kind().equals("number"))return new BigDecimal(value).stripTrailingZeros().toPlainString();
        if(d.kind().equals("select")&&value.startsWith("V"))return d.options().get(Integer.parseInt(value.substring(1)));
        return value;
    }
}
