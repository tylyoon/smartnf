package com.onrender.smartnf.web;
import java.util.*;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.json.JsonMapper;
@Service
public class MyRecipeService {
 private final JdbcTemplate jdbc;private final JsonMapper json=JsonMapper.builder().build();
 public MyRecipeService(JdbcTemplate jdbc){this.jdbc=jdbc;}
 public record Snapshot(String name,int servings,int minutes,List<String> ingredients,List<String> steps){}
 public record SaveItem(UUID key,Snapshot recipe,Snapshot baseRecipe){public SaveItem(UUID key,Snapshot recipe){this(key,recipe,null);}}
 public record Saved(long number,Snapshot recipe,String recipeId,long contentRevision){
  public Saved(long number,Snapshot recipe){this(number,recipe,null,1);}
  public String displayNumber(){return "%03d".formatted(number);}
 }
 public static String fingerprint(String data){try{return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(data.getBytes(StandardCharsets.UTF_8)));}catch(java.security.NoSuchAlgorithmException e){throw new IllegalStateException(e);}}
 private static void validate(Snapshot r){if(r==null||!text(r.name(),100)||r.servings()<1||r.servings()>24||r.minutes()<1||r.minutes()>1440||!texts(r.ingredients(),25,140)||!texts(r.steps(),20,500))throw error(HttpStatus.BAD_REQUEST);}
 private static boolean text(String s,int n){return s!=null&&!s.isBlank()&&s.length()<=n;}
 private static boolean texts(List<String> a,int n,int len){return a!=null&&!a.isEmpty()&&a.size()<=n&&a.stream().allMatch(s->text(s,len));}
 private void lock(long member){var rows=jdbc.query("SELECT id FROM members WHERE id=? FOR UPDATE",(r,i)->r.getLong(1),member);if(rows.isEmpty())throw error(HttpStatus.NOT_FOUND);}
 @Transactional public long save(long member,UUID key,Snapshot recipe){
  validate(recipe);if(key==null)throw error(HttpStatus.BAD_REQUEST);lock(member);
  String payload=json.writeValueAsString(recipe),hash=fingerprint(payload);
  var old=jdbc.query("SELECT recipe_number,request_hash FROM my_recipe_save_requests WHERE member_id=? AND request_key=?",(r,i)->new String[]{r.getString(1),r.getString(2)},member,key.toString());
  if(!old.isEmpty()){if(!old.getFirst()[1].equals(hash))throw error(HttpStatus.CONFLICT);return Long.parseLong(old.getFirst()[0]);}
  jdbc.update("INSERT INTO recipe_library(recipe_id,recipe_data) VALUES(?,?) ON DUPLICATE KEY UPDATE recipe_id=recipe_id",hash,payload);
  if(!payload.equals(jdbc.queryForObject("SELECT recipe_data FROM recipe_library WHERE recipe_id=?",String.class,hash)))throw error(HttpStatus.CONFLICT);
  var owned=jdbc.query("SELECT recipe_number FROM my_recipes WHERE member_id=? AND recipe_id=? AND recipe_overrides IS NULL ORDER BY recipe_number",(r,i)->r.getLong(1),member,hash);
  long number;
  if(!owned.isEmpty())number=owned.getFirst();else{
   var seq=jdbc.query("SELECT last_number FROM my_recipe_sequences WHERE member_id=?",(r,i)->r.getLong(1),member);number=seq.isEmpty()?1:seq.getFirst()+1;
   if(seq.isEmpty())jdbc.update("INSERT INTO my_recipe_sequences(member_id,last_number) VALUES(?,?)",member,number);else jdbc.update("UPDATE my_recipe_sequences SET last_number=? WHERE member_id=?",number,member);
   jdbc.update("INSERT INTO my_recipes(member_id,recipe_number,save_key,recipe_id) VALUES(?,?,?,?)",member,number,key.toString(),hash);
  }
  jdbc.update("INSERT INTO my_recipe_save_requests(member_id,request_key,recipe_number,request_hash) VALUES(?,?,?,?)",member,key.toString(),number,hash);return number;
 }
 @Transactional public List<Long> saveAll(long member,List<SaveItem> items){
  if(items==null||items.isEmpty()||items.size()>5)throw error(HttpStatus.BAD_REQUEST);
  for(var item:items){if(item==null||item.key()==null)throw error(HttpStatus.BAD_REQUEST);validate(item.recipe());if(item.baseRecipe()!=null)validate(item.baseRecipe());}
  return items.stream().map(item->item.baseRecipe()==null?save(member,item.key(),item.recipe()):saveVariant(member,item)).toList();
 }
 private long saveVariant(long member,SaveItem item){
  lock(member);
  String requestHash=fingerprint(json.writeValueAsString(List.of(item.baseRecipe(),item.recipe())));
  var existing=jdbc.query("SELECT recipe_number,request_hash FROM my_recipe_save_requests WHERE member_id=? AND request_key=?",(r,i)->new String[]{r.getString(1),r.getString(2)},member,item.key().toString());
  if(!existing.isEmpty()){if(!existing.getFirst()[1].equals(requestHash))throw error(HttpStatus.CONFLICT);return Long.parseLong(existing.getFirst()[0]);}
  String baseHash=fingerprint(json.writeValueAsString(item.baseRecipe()));
  UUID internalKey=UUID.nameUUIDFromBytes(("recipe-base:"+member+":"+baseHash).getBytes(StandardCharsets.UTF_8));
  long number=save(member,internalKey,item.baseRecipe());
  var owned=list(member).stream().filter(r->r.number()==number).findFirst().orElseThrow();
  if(!owned.recipe().equals(item.recipe()))update(member,number,owned.contentRevision(),item.recipe());
  jdbc.update("INSERT INTO my_recipe_save_requests(member_id,request_key,recipe_number,request_hash) VALUES(?,?,?,?)",member,item.key().toString(),number,requestHash);return number;
 }
 public List<Saved> list(long member){return jdbc.query("SELECT m.recipe_number,m.recipe_id,m.content_revision,l.recipe_data,m.recipe_overrides FROM my_recipes m JOIN recipe_library l ON l.recipe_id=m.recipe_id WHERE m.member_id=? ORDER BY m.recipe_number DESC",(r,i)->new Saved(r.getLong(1),effective(r.getString(4),r.getString(5)),r.getString(2),r.getLong(3)),member);}
 public Snapshot effective(String base,String overrides){
  if(overrides==null)return json.readValue(base,Snapshot.class);
  var node=(tools.jackson.databind.node.ObjectNode)json.readTree(base);var diff=json.readTree(overrides);
  for(String key:List.of("name","servings","minutes","ingredients","steps"))if(diff.has(key))node.set(key,diff.get(key));
  return json.treeToValue(node,Snapshot.class);
 }
 @Transactional public Saved update(long member,long number,long revision,Snapshot value){
  validate(value);lock(member);
  var rows=jdbc.query("SELECT l.recipe_data,m.content_revision FROM my_recipes m JOIN recipe_library l ON m.recipe_id=l.recipe_id WHERE m.member_id=? AND m.recipe_number=? FOR UPDATE",(r,i)->new Object[]{r.getString(1),r.getLong(2)},member,number);
  if(rows.isEmpty())throw error(HttpStatus.NOT_FOUND);if((Long)rows.getFirst()[1]!=revision)throw error(HttpStatus.CONFLICT);
  var base=json.readTree((String)rows.getFirst()[0]);var next=json.valueToTree(value);var diff=json.createObjectNode();
  for(String key:List.of("name","servings","minutes","ingredients","steps"))if(!base.get(key).equals(next.get(key)))diff.set(key,next.get(key));
  jdbc.update("UPDATE my_recipes SET recipe_overrides=?,content_revision=content_revision+1 WHERE member_id=? AND recipe_number=? AND content_revision=?",diff.isEmpty()?null:json.writeValueAsString(diff),member,number,revision);
  jdbc.update("DELETE FROM my_recipe_prediction WHERE member_id=? AND recipe_number=?",member,number);
  return list(member).stream().filter(r->r.number()==number).findFirst().orElseThrow();
 }
 @Transactional public boolean delete(long member,long number){lock(member);return jdbc.update("DELETE FROM my_recipes WHERE member_id=? AND recipe_number=?",member,number)==1;}
 private static ResponseStatusException error(HttpStatus status){return new ResponseStatusException(status);}
}
