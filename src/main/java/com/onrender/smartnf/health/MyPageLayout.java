package com.onrender.smartnf.health;

import java.util.*;

/** Closed rendering contract: no arbitrary HTML, script, URL, SQL or profile values. */
public final class MyPageLayout {
    private MyPageLayout() {}
    public static final List<String> ALLOWED=List.of("care","profile","bp","weight","history","privacy","plans");
    public static final List<String> DEFAULT=List.of("care","profile","history","privacy");
    public record State(long revision,List<String> widgets) {}
    public record Save(Long expectedRevision,List<String> widgets) {}
    public record Prompt(String text) {}
    public record Suggestion(String mode,String explanation,List<String> widgets) {}
    public static List<String> validate(List<String> ids){
        if(ids==null||ids.isEmpty()||ids.size()>ALLOWED.size()||new HashSet<>(ids).size()!=ids.size())throw HealthException.invalid();
        for(String id:ids)if(id==null||!ALLOWED.contains(id))throw HealthException.invalid();
        return List.copyOf(ids);
    }
    public static Suggestion suggest(String text){
        if(text==null||text.isBlank()||text.length()>300||text.chars().anyMatch(c->Character.isISOControl(c)&&c!='\n'&&c!='\t'))throw HealthException.invalid();
        String s=text.toLowerCase(Locale.ROOT);var widgets=new LinkedHashSet<String>();
        if(s.contains("장보기")||s.contains("외식")||s.contains("선택 식품"))widgets.add("plans");
        if(s.contains("혈압")||s.contains("blood pressure"))widgets.add("bp");
        if(s.contains("체중")||s.contains("weight"))widgets.add("weight");
        if(s.contains("관리항목")||s.contains("관리 항목")||s.contains("실천"))widgets.add("care");
        if(s.contains("건강정보")||s.contains("건강 정보"))widgets.add("profile");
        if(s.contains("이력")||s.contains("기록"))widgets.add("history");
        if(s.contains("동의")||s.contains("보호"))widgets.add("privacy");
        if(widgets.isEmpty())return new Suggestion("LOCAL_RULES","요청을 지원하는 카드와 연결하지 못했습니다. 혈압·체중·관리항목·건강정보·이력·동의 중 필요한 내용을 말하거나 직접 카드를 선택해 주세요.",List.of());
        if(!(s.contains("만")||s.contains("간단"))){widgets.add("care");widgets.add("privacy");}
        return new Suggestion("LOCAL_RULES","로컬 키워드 규칙으로 만든 구성 제안입니다. AI 분석이나 건강 판단이 아닙니다. 카드와 순서를 확인한 뒤 저장하세요.",List.copyOf(widgets));
    }
}
