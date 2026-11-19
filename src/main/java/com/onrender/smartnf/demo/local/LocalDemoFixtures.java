package com.onrender.smartnf.demo.local;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import com.onrender.smartnf.health.HealthModels.CareItem;
import com.onrender.smartnf.health.HealthDailyModels.*;

/** Entirely fictional local fixtures; no clinical targets or inferred improvements. */
public final class LocalDemoFixtures {
    private LocalDemoFixtures() {}
    public static final LocalDate FROM=LocalDate.of(2026,10,25), TO=LocalDate.of(2026,11,1);
    public record Person(int number,String name,List<CareItem> care,List<String> widgets) {
        public String email(){return "smartnf"+number+"@smartnf.com";}
    }
    private static CareItem care(String id,String... scopes){return new CareItem(id,List.of(scopes));}
    public static List<Person> people(){return List.of(
        new Person(1,"[가상] 혈압관리 1",List.of(care("salt","bp","habits"),care("movement","bp","activity")),List.of("bp","care","profile","history","privacy")),
        new Person(2,"[가상] 체중관리 2",List.of(care("weightcare","bmi"),care("late","habits"),care("movement","activity")),List.of("weight","care","history","privacy")),
        new Person(3,"[가상] 혈당식습관 3",List.of(care("regular","glucose","habits"),care("sugar","glucose","habits")),List.of("care","profile","history","privacy")),
        new Person(4,"[가상] 균형식생활 4",List.of(care("balanced","habits"),care("regular","habits")),List.of("profile","care","weight","privacy")),
        new Person(5,"[가상] 불규칙기록 5",List.of(care("salt","bp"),care("balanced","habits"),care("movement","activity")),List.of("history","care","bp","weight","privacy"))
    );}
    private static final String[][] WEIGHT={
        {"72.1","72.0","72.2","72.0","72.1","72.3","72.1","72.0"},
        {"81.0","80.8","81.1","80.9","80.7","80.9","80.8","80.8"},
        {"65.2","65.3","65.2","65.1","65.4","65.2","65.3","65.2"},
        {"58.0","58.1","58.0","58.2","58.1","58.0","58.1","58.0"},
        {"76.4",null,"76.3",null,"76.5",null,null,"76.4"}
    };
    private static final int[][] SYS={{134,132,135,133,131,136,132,133},{126,125,127,126,124,128,126,125},{122,124,123,121,125,122,124,123},{116,118,117,116,119,117,118,116},{138,0,0,0,136,0,139,0}};
    private static final String[][] NOTES={
        {"국은 건더기 위주로 먹고 20분 걸음","점심 외식, 국물은 조금 남김","김치 양을 의식함, 걷기는 쉬었음","집에서 식사, 저녁에 15분 걸음","양념은 따로 덜어 먹음","외식으로 평소보다 짭짤하게 먹음","저녁 식사 후 산책","식사·걷기 기록을 돌아봄"},
        {"정해둔 양을 덜어 먹고 산책","간식 과자 한 번, 야식 없음","늦은 저녁 후 간식도 먹음","식사를 천천히 먹음","식사량을 기록하고 20분 걸음","주말 외식, 식사량 기록은 일부만 함","야식 없이 저녁 마무리","한 주 기록을 확인함"},
        {"세 끼 시간을 메모, 단 음료 대신 물","아침이 늦어짐, 음료는 무가당","점심에 단 음료를 마심","세 끼 시간을 맞춰 먹음","바빠서 식사 시간이 불규칙했음","단 음료 대신 차를 마심","아침·점심·저녁 기록","식사 시간과 음료 습관을 돌아봄"},
        {"밥·채소·달걀을 함께 먹음","점심에 채소 반찬을 추가","일정 때문에 아침이 늦어짐","생선과 채소 반찬을 먹음","비슷한 음식이 반복되어 메모","두부 반찬을 먹고 산책","식사 시간을 메모","다음 주에는 다양한 식품을 골라볼 계획"},
        {"아침 혈압과 체중만 기록","","체중만 기록, 실천은 일부만 기억남","","외식 메모와 측정값 기록","","저녁 혈압만 측정","체중과 식사 메모만 기록"}
    };
    public static Map<String,List<String>> profile(Person p,boolean latest){
        int n=p.number()-1;var f=new LinkedHashMap<String,List<String>>();
        f.put("age",List.of(List.of("52","38","45","29","60").get(n)));
        f.put("sex",List.of(n%2==0?"남성":"여성"));f.put("height",List.of(List.of("172","165","168","163","175").get(n)));
        f.put("weight",List.of(WEIGHT[n][latest?7:0]));f.put("measured",List.of((latest?TO:FROM).toString()));
        f.put("referenceContext",List.of("일반 성인 참고"));f.put("conditions",List.of());
        if(n==0||n==4){f.put("sys",List.of(n==0?"133":"138"));f.put("dia",List.of(n==0?"83":"86"));f.put("bpContext",List.of("가정"));}
        if(n==2){f.put("glucose",List.of("112"));f.put("glucoseMethod",List.of("검사실 혈장"));f.put("fasting",List.of("8시간 이상 공복 확인"));}
        if(n==1){f.put("weightGoal",List.of("감량"));f.put("targetWeight",List.of("78"));}
        f.put("labSource",List.of("가상 화면 점검용 자료 · 실제 진단/검사 결과 아님"));return f;
    }
    public static Map<LocalDate,Input> daily(Person p){
        var out=new LinkedHashMap<LocalDate,Input>();int n=p.number()-1;
        for(int d=0;d<8;d++){
            if(n==4&&Set.of(1,3,5).contains(d))continue;
            var practices=new ArrayList<Practice>();int index=0;
            for(var c:p.care()){
                String status=List.of("DONE","PARTIAL","NOT_DONE","DONE","UNRECORDED","PARTIAL","DONE","DONE").get((d+index+n)%8);
                practices.add(new Practice(c.id(),status,""));index++;
            }
            BigDecimal weight=WEIGHT[n][d]==null?null:new BigDecimal(WEIGHT[n][d]);
            // People 2–4 intentionally have days without BP; the fifth also has partial measurements.
            boolean hasBp=SYS[n][d]!=0&&(n==0||n==4||d%2==0);
            out.put(FROM.plusDays(d),new Input(weight,hasBp?BigDecimal.valueOf(SYS[n][d]):null,hasBp?BigDecimal.valueOf(SYS[n][d]-50):null,
                hasBp?(d==5?"CLINIC":"HOME"):"UNKNOWN",hasBp?(d==6?"PM":"AM"):"UNKNOWN",weight==null?"UNKNOWN":"AM",
                "[가상] "+NOTES[n][d]+" · 식사 메모이며 음식·영양 DB 기록은 아님",practices));
        }
        return out;
    }
}
