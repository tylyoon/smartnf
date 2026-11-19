package com.onrender.smartnf.web;

import java.text.Normalizer;
import java.util.*;

/** Predictions are explicitly provisional; a missing score is never neutral/zero. */
public final class RecipeTastePolicy {
    public static final List<String> CUISINES = List.of("미분류", "한식", "중식", "일식", "이탈리아식", "프랑스식", "동남아식", "인도식", "멕시코식", "미국식", "기타", "퓨전");
    public static final List<String> ROLES = List.of("미분류", "메인", "사이드", "겸용", "기타");
    public static final List<String> AXES = List.of("spicy", "sweet", "salty", "sour", "umami", "rich");
    public record Features(String cuisine, String role, Map<String,Integer> taste, String texture, String aroma, String source) {}
    public record Feedback(int liking, Boolean again, Map<String,Integer> actual, List<String> adjustments,
            Integer likingStars, Integer againStars, String texture, String aroma) {
        public Feedback(int liking,Boolean again,Map<String,Integer> actual,List<String> adjustments) {
            this(liking,again,actual,adjustments,null,null,null,null);
        }
    }
    public static Integer likingStars(Feedback f) { return f==null?null:f.likingStars()!=null?f.likingStars():f.liking()==0?null:f.liking()==1?1:f.liking()==2?3:5; }
    public static Integer againStars(Feedback f) { return f==null?null:f.againStars()!=null?f.againStars():f.again()==null?null:f.again()?5:1; }
    public static final List<String> ADJUSTMENTS = List.of("너무 매워요", "너무 달아요", "너무 짜요", "너무 셔요", "너무 기름져요");
    private RecipeTastePolicy() {}
    public static String norm(String s) { return Normalizer.normalize(s == null ? "" : s, Normalizer.Form.NFKC).toLowerCase(Locale.ROOT).replaceAll("[\\s\\p{Punct}]", ""); }
    public static void scores(Map<String,Integer> scores) {
        if (scores == null || scores.keySet().stream().anyMatch(k -> k == null || !AXES.contains(k)) || scores.values().stream().anyMatch(v -> v == null || v < 0 || v > 5)) throw new IllegalArgumentException("맛 강도는 0~5로 입력하세요.");
    }
    public static void validate(Features f) {
        if (f == null || f.cuisine() == null || f.role() == null || f.source() == null || !List.of("RULE","LOCAL_LLM","USER").contains(f.source()) || !CUISINES.contains(f.cuisine()) || !ROLES.contains(f.role()) || f.texture() == null || f.aroma() == null || f.texture().length() > 80 || f.aroma().length() > 80) throw new IllegalArgumentException("분류 값을 확인하세요.");
        scores(f.taste());
    }
    public static void validate(Feedback f) {
        if (f == null || f.liking() < 0 || f.liking() > 3 || invalidStar(f.likingStars()) || invalidStar(f.againStars()) || invalidDescription(f.texture()) || invalidDescription(f.aroma()) || f.adjustments() == null || f.adjustments().size() > 5 || f.adjustments().stream().anyMatch(s -> s == null || !ADJUSTMENTS.contains(s))) throw new IllegalArgumentException("평가 값을 확인하세요.");
        scores(f.actual());
    }
    static boolean invalidStar(Integer value) { return value!=null&&(value<1||value>5); }
    static boolean invalidDescription(String value) { return value!=null&&value.length()>80; }
    public static Features basic(String name) {
        String n = norm(name), cuisine = "미분류", role = "미분류";
        if (n.matches(".*(김치|비빔밥|된장|불고기|나물|찌개).*")) cuisine = "한식";
        else if (n.matches(".*(마파두부|짜장|짬뽕|탕수육).*")) cuisine = "중식";
        else if (n.matches(".*(우동|스시|초밥|오야코동).*")) cuisine = "일식";
        else if (n.matches(".*(파스타|리소토|라자냐).*")) cuisine = "이탈리아식";
        if (n.matches(".*(볶음밥|비빔밥|덮밥|찌개|짜글이|파스타|리소토|우동|국수|불고기|돈가스).*")) role = "메인";
        else if (n.matches(".*(샐러드|두부구이).*")) role = "겸용";
        else if (n.matches(".*(나물|무침|절임|달걀말이).*" ) || n.equals("김치")) role = "사이드";
        return new Features(cuisine,role,Map.of(),"","","RULE");
    }
    /** One current feedback per saved recipe. Each axis requires three informative dishes. */
    public static Map<String,Double> profile(List<Feedback> feedback) {
        var out = new LinkedHashMap<String,Double>();
        var correction = Map.of("spicy","너무 매워요","sweet","너무 달아요","salty","너무 짜요","sour","너무 셔요","rich","너무 기름져요");
        for (String axis : AXES) {
            var values = new ArrayList<Integer>();
            for (Feedback f : feedback) {
                if (f == null || !f.actual().containsKey(axis)) continue;
                int actual = f.actual().get(axis);
                if (correction.containsKey(axis) && f.adjustments().contains(correction.get(axis))) values.add(Math.max(0,actual-1));
                else if (likingStars(f)!=null && likingStars(f)>=4 && (againStars(f)==null || againStars(f)>=3)) values.add(actual);
            }
            if (values.size() >= 3) out.put(axis,values.stream().mapToInt(Integer::intValue).average().orElseThrow());
        }
        return out;
    }
    public static Double distance(Features f, Map<String,Double> profile) {
        if (profile.isEmpty() || !f.taste().keySet().containsAll(profile.keySet())) return null;
        return profile.entrySet().stream().mapToDouble(e -> Math.abs(f.taste().get(e.getKey()) - e.getValue())).average().orElseThrow();
    }
}
