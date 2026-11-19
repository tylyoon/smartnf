package com.onrender.smartnf.health;
import java.util.*;import java.nio.charset.StandardCharsets;import java.io.*;import java.util.regex.Pattern;
/** Same auditable family safeguards as the Python matching pipeline. */
public final class IngredientPricePolicy {
 private static final List<String[]> RULES=load();
 private static List<String[]> load(){try(var in=IngredientPricePolicy.class.getResourceAsStream("/price-reference/ingredient_categories.tsv")){if(in==null)return List.of();return new BufferedReader(new InputStreamReader(in,StandardCharsets.UTF_8)).lines().filter(l->!l.isBlank()&&!l.startsWith("#")).map(l->l.split("\t",-1)).filter(f->f.length==6).toList();}catch(Exception e){return List.of();}}
 private static String[] rule(String query){String q=query.split(",",2)[0].strip();return RULES.stream().filter(r->Arrays.stream(r[1].split("\\|")).anyMatch(a->q.equals(a)||q.startsWith(a+" "))).findFirst().orElse(null);}
 public static Boolean compatible(String query,String name){String[] r=rule(query);if(r==null)return null;if(!Pattern.compile(r[3],Pattern.CASE_INSENSITIVE).matcher(name).find()||Pattern.compile(r[4],Pattern.CASE_INSENSITIVE).matcher(name).find())return false;
  for(String term:List.of("무염","가염","흑후추","백후추","저지방","식물성","동물성","양지","설도","등심","불고기","국거리","미국산","호주산","한우"))if(query.contains(term)&&!name.contains(term))return false;return true;}
 public static String specification(String query){String[] r=rule(query);if(r==null)return "";if(r[0].equals("BEEF")&&List.of("양지","설도","등심","불고기","국거리").stream().anyMatch(query::contains))return "";return r[5];}
 public static String searchName(String query){String[] r=rule(query);return r==null?query.split(",",2)[0].strip():r[2];}
}
