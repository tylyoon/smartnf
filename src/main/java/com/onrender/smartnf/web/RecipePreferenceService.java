package com.onrender.smartnf.web;

import com.onrender.smartnf.health.CurrentHealthMember;
import com.onrender.smartnf.health.HealthException;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.json.JsonMapper;
import static com.onrender.smartnf.web.RecipeTastePolicy.*;

@Service
public class RecipePreferenceService {
    public record Preference(Map<String,Double> targets,String source,int evaluated) {}
    private final CurrentHealthMember current;
    private final JdbcTemplate jdbc;
    private final JsonMapper json=JsonMapper.builder().build();
    public RecipePreferenceService(CurrentHealthMember current,JdbcTemplate jdbc){this.current=current;this.jdbc=jdbc;}
    private long member(Authentication auth){
        try{return current.id(auth);}catch(HealthException e){throw new ResponseStatusException(org.springframework.http.HttpStatusCode.valueOf(e.status()),e.getMessage());}
    }
    public Preference read(Authentication auth){
        long m=member(auth);var unique=new LinkedHashMap<String,Feedback>();
        jdbc.query("SELECT l.recipe_data,r.recipe_overrides,t.feedback_data FROM my_recipes r JOIN recipe_library l ON l.recipe_id=r.recipe_id JOIN my_recipe_taste t ON r.member_id=t.member_id AND r.recipe_number=t.recipe_number WHERE r.member_id=? AND t.feedback_data IS NOT NULL ORDER BY r.recipe_number DESC",row->{
            var recipe=new MyRecipeService(jdbc).effective(row.getString(1),row.getString(2));var feedback=json.readValue(row.getString(3),Feedback.class);
            validate(feedback);unique.putIfAbsent(norm(recipe.name()),feedback);
        },m);
        return new Preference(Collections.unmodifiableMap(profile(new ArrayList<>(unique.values()))),"SAVED",unique.size());
    }
    public Preference resolve(Authentication auth,boolean enabled,boolean manual,Map<String,Integer> supplied){
        if(!enabled)return new Preference(Map.of(),"OFF",0);
        if(manual){
            member(auth);
            try{scores(supplied);}catch(IllegalArgumentException e){throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"맛 선호는 0~5로 선택하세요.");}
            if(supplied.isEmpty())throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"맛 선호를 하나 이상 선택하세요.");
            var targets=new LinkedHashMap<String,Double>();supplied.forEach((k,v)->targets.put(k,v.doubleValue()));
            return new Preference(Collections.unmodifiableMap(targets),"MANUAL",0);
        }
        var saved=read(auth);
        if(saved.targets().isEmpty())throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"저장된 맛 평가가 부족합니다. 직접 선호를 선택해 주세요.");
        return saved;
    }
    public static String summary(Preference preference){
        if(preference.targets().isEmpty())return "";
        var labels=Map.of("spicy","매운맛","sweet","단맛","salty","짠맛","sour","신맛","umami","감칠맛","rich","기름진 정도");
        var parts=new ArrayList<String>();
        AXES.forEach(k->{if(preference.targets().containsKey(k))parts.add(labels.get(k)+" "+String.format(Locale.ROOT,"%.1f",preference.targets().get(k))+"/5");});
        return (preference.source().equals("SAVED")?"저장한 취향 반영: ":"직접 선택한 취향 반영: ")+String.join(" · ",parts);
    }
}
