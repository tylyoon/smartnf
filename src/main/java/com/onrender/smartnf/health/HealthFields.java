package com.onrender.smartnf.health;

import java.util.*;

/** Closed server-owned contract matching the health form, schema version 1. */
public final class HealthFields {
    private HealthFields(){}
    public record Field(String name,String column,String kind,String min,String max,int scale,String label,List<String> options){}
    public static final Map<String,Field> ALL;
    public static final Set<String> PROFILE;
    public static final Map<String,String> METRICS;
    public static final List<String> CONDITION_CODES=List.of("diabetes","hypertension","dyslipidemia","kidney","other");
    public static final List<String> CONDITION_LABELS=List.of("당뇨병","고혈압","이상지질혈증","신장질환","기타 만성질환");
    public static final Map<String,List<String>> SUPPORTED=Map.of(
        "bmi",List.of("weightcare","balanced","regular","sugar","movement"),
        "bp",List.of("salt","balanced","movement","weightcare","alcohol","smoking"),
        "glucose",List.of("regular","sugar","balanced","movement","weightcare"),
        "lipid",List.of("fat","sugar","balanced","movement","weightcare","alcohol"),
        "habits",List.of("regular","balanced","sugar","salt","late"),
        "activity",List.of("movement","balanced","weightcare","alcohol","smoking"));
    static {
        var fields=new LinkedHashMap<String,Field>();
        fields.put("conditions",new Field("conditions","conditions","checkbox","","",0,"conditions",List.of()));
        fields.put("diagnosed_0",new Field("diagnosed_0","diagnosed_0","month","","",0,"진단 시기",List.of()));
        fields.put("visit_0",new Field("visit_0","visit_0","date","","",0,"최근 진료일",List.of()));
        fields.put("status_0",new Field("status_0","status_0","select","","",0,"관리 상태 (본인 인지)",List.of("미확인","정기 진료·관리 중","최근 진단받음","관리 방법 상담 필요")));
        fields.put("labdate_0",new Field("labdate_0","labdate_0","date","","",0,"최근 검사일",List.of()));
        fields.put("labs_0",new Field("labs_0","labs_0","textarea","","",0,"최근 검사 항목·수치·단위",List.of()));
        fields.put("care_0",new Field("care_0","care_0","textarea","","",0,"치료·복약 및 의료진이 정한 목표",List.of()));
        fields.put("symptoms_0",new Field("symptoms_0","symptoms_0","textarea","","",0,"불편한 증상·식사 또는 운동 제한",List.of()));
        fields.put("diagnosed_1",new Field("diagnosed_1","diagnosed_1","month","","",0,"진단 시기",List.of()));
        fields.put("visit_1",new Field("visit_1","visit_1","date","","",0,"최근 진료일",List.of()));
        fields.put("status_1",new Field("status_1","status_1","select","","",0,"관리 상태 (본인 인지)",List.of("미확인","정기 진료·관리 중","최근 진단받음","관리 방법 상담 필요")));
        fields.put("labdate_1",new Field("labdate_1","labdate_1","date","","",0,"최근 검사일",List.of()));
        fields.put("labs_1",new Field("labs_1","labs_1","textarea","","",0,"최근 검사 항목·수치·단위",List.of()));
        fields.put("care_1",new Field("care_1","care_1","textarea","","",0,"치료·복약 및 의료진이 정한 목표",List.of()));
        fields.put("symptoms_1",new Field("symptoms_1","symptoms_1","textarea","","",0,"불편한 증상·식사 또는 운동 제한",List.of()));
        fields.put("diagnosed_2",new Field("diagnosed_2","diagnosed_2","month","","",0,"진단 시기",List.of()));
        fields.put("visit_2",new Field("visit_2","visit_2","date","","",0,"최근 진료일",List.of()));
        fields.put("status_2",new Field("status_2","status_2","select","","",0,"관리 상태 (본인 인지)",List.of("미확인","정기 진료·관리 중","최근 진단받음","관리 방법 상담 필요")));
        fields.put("labdate_2",new Field("labdate_2","labdate_2","date","","",0,"최근 검사일",List.of()));
        fields.put("labs_2",new Field("labs_2","labs_2","textarea","","",0,"최근 검사 항목·수치·단위",List.of()));
        fields.put("care_2",new Field("care_2","care_2","textarea","","",0,"치료·복약 및 의료진이 정한 목표",List.of()));
        fields.put("symptoms_2",new Field("symptoms_2","symptoms_2","textarea","","",0,"불편한 증상·식사 또는 운동 제한",List.of()));
        fields.put("diagnosed_3",new Field("diagnosed_3","diagnosed_3","month","","",0,"진단 시기",List.of()));
        fields.put("visit_3",new Field("visit_3","visit_3","date","","",0,"최근 진료일",List.of()));
        fields.put("status_3",new Field("status_3","status_3","select","","",0,"관리 상태 (본인 인지)",List.of("미확인","정기 진료·관리 중","최근 진단받음","관리 방법 상담 필요")));
        fields.put("labdate_3",new Field("labdate_3","labdate_3","date","","",0,"최근 검사일",List.of()));
        fields.put("labs_3",new Field("labs_3","labs_3","textarea","","",0,"최근 검사 항목·수치·단위",List.of()));
        fields.put("care_3",new Field("care_3","care_3","textarea","","",0,"치료·복약 및 의료진이 정한 목표",List.of()));
        fields.put("symptoms_3",new Field("symptoms_3","symptoms_3","textarea","","",0,"불편한 증상·식사 또는 운동 제한",List.of()));
        fields.put("diagnosed_4",new Field("diagnosed_4","diagnosed_4","month","","",0,"진단 시기",List.of()));
        fields.put("visit_4",new Field("visit_4","visit_4","date","","",0,"최근 진료일",List.of()));
        fields.put("status_4",new Field("status_4","status_4","select","","",0,"관리 상태 (본인 인지)",List.of("미확인","정기 진료·관리 중","최근 진단받음","관리 방법 상담 필요")));
        fields.put("labdate_4",new Field("labdate_4","labdate_4","date","","",0,"최근 검사일",List.of()));
        fields.put("labs_4",new Field("labs_4","labs_4","textarea","","",0,"최근 검사 항목·수치·단위",List.of()));
        fields.put("care_4",new Field("care_4","care_4","textarea","","",0,"치료·복약 및 의료진이 정한 목표",List.of()));
        fields.put("symptoms_4",new Field("symptoms_4","symptoms_4","textarea","","",0,"불편한 증상·식사 또는 운동 제한",List.of()));
        fields.put("age",new Field("age","age","number","1","120",0,"나이 (세)",List.of()));
        fields.put("height",new Field("height","height","number","30","250",1,"키 (cm)",List.of()));
        fields.put("weight",new Field("weight","weight","number","1","400",1,"체중 (kg)",List.of()));
        fields.put("waist",new Field("waist","waist","number","20","250",1,"허리둘레 (cm)",List.of()));
        fields.put("sys",new Field("sys","sys","number","30","300",0,"수축기 혈압 (mmHg)",List.of()));
        fields.put("dia",new Field("dia","dia","number","20","200",0,"이완기 혈압 (mmHg)",List.of()));
        fields.put("glucose",new Field("glucose","glucose","number","1","1000",0,"공복혈당 (mg/dL)",List.of()));
        fields.put("sex",new Field("sex","sex","select","","",0,"기준 적용 성별",List.of("","남성","여성")));
        fields.put("referenceContext",new Field("referenceContext","reference_context","select","","",0,"참고 기준 적용 상태",List.of("미확인","일반 성인 참고","임신·수유 등 별도 확인","별도 기준 확인 필요")));
        fields.put("measured",new Field("measured","measured","date","","",0,"측정일",List.of()));
        fields.put("postGlucose",new Field("postGlucose","post_glucose","number","0","1000",1,"식후 혈당 (mg/dL)",List.of()));
        fields.put("hba1c",new Field("hba1c","hba1c","number","0","30",1,"당화혈색소 HbA1c (%)",List.of()));
        fields.put("ast",new Field("ast","ast","number","0","10000",1,"AST (U/L)",List.of()));
        fields.put("alt",new Field("alt","alt","number","0","10000",1,"ALT (U/L)",List.of()));
        fields.put("ggt",new Field("ggt","ggt","number","0","10000",1,"γ-GTP (U/L)",List.of()));
        fields.put("creatinine",new Field("creatinine","creatinine","number","0","100",2,"크레아티닌 (mg/dL)",List.of()));
        fields.put("egfr",new Field("egfr","egfr","number","0","300",1,"eGFR (mL/min/1.73m²)",List.of()));
        fields.put("hemoglobin",new Field("hemoglobin","hemoglobin","number","0","30",1,"혈색소 (g/dL)",List.of()));
        fields.put("glucoseMethod",new Field("glucoseMethod","glucose_method","select","","",0,"혈당 측정 방식",List.of("미확인","검사실 혈장","자가혈당계")));
        fields.put("fasting",new Field("fasting","fasting","select","","",0,"공복 조건",List.of("미확인","8시간 이상 공복 확인","비공복")));
        fields.put("postType",new Field("postType","post_type","select","","",0,"식후 검사 종류",List.of("미확인","일반 식사 후","75g 경구 포도당 부하검사")));
        fields.put("postHours",new Field("postHours","post_hours","number","0","24",1,"식사·부하 후 경과 시간",List.of()));
        fields.put("bpContext",new Field("bpContext","bp_context","select","","",0,"혈압 측정 환경",List.of("미확인","가정","진료실")));
        fields.put("bodyFat",new Field("bodyFat","body_fat","number","0","100",1,"체지방률 (%)",List.of()));
        fields.put("steps",new Field("steps","steps","number","0","200000",0,"걸음수 (걸음/일)",List.of()));
        fields.put("activeMinutes",new Field("activeMinutes","active_minutes","number","0","1440",0,"활동 시간 (분/일)",List.of()));
        fields.put("sleepHours",new Field("sleepHours","sleep_hours","number","0","24",1,"수면 시간 (시간/일)",List.of()));
        fields.put("smoking",new Field("smoking","smoking","select","","",0,"흡연 기록",List.of("미확인","현재 흡연","과거 흡연","흡연하지 않음")));
        fields.put("drinkingDays",new Field("drinkingDays","drinking_days","number","0","7",0,"최근 7일 음주 일수",List.of()));
        fields.put("totalChol",new Field("totalChol","total_chol","number","0","2000",1,"총콜레스테롤 (mg/dL)",List.of()));
        fields.put("ldl",new Field("ldl","ldl","number","0","2000",1,"LDL 콜레스테롤 (mg/dL)",List.of()));
        fields.put("hdl",new Field("hdl","hdl","number","0","500",1,"HDL 콜레스테롤 (mg/dL)",List.of()));
        fields.put("tg",new Field("tg","tg","number","0","5000",1,"중성지방 (mg/dL)",List.of()));
        fields.put("labMeasured",new Field("labMeasured","lab_measured","date","","",0,"검사일",List.of()));
        fields.put("labSource",new Field("labSource","lab_source","text","","",0,"검사기관·기기 출처",List.of()));
        fields.put("goal",new Field("goal","goal","checkbox","","",0,"관리 목표",List.of("건강한 식습관","체중 관리","만성질환 관련 관리")));
        fields.put("medication",new Field("medication","medication","select","","",0,"치료·복약 여부",List.of("미확인","치료 또는 복약 중","해당 없음")));
        fields.put("restriction",new Field("restriction","restriction","textarea","","",0,"의료진이 정한 식사·운동 제한",List.of()));
        fields.put("activity",new Field("activity","activity","select","","",0,"현재 활동 수준",List.of("미확인","활동이 적은 편","가벼운 활동을 하는 편","규칙적으로 운동하는 편")));
        fields.put("exerciseLimit",new Field("exerciseLimit","exercise_limit","select","","",0,"부상·운동 제한 여부",List.of("미확인","있음","없음")));
        fields.put("weightGoal",new Field("weightGoal","weight_goal","select","","",0,"체중 관리 방향",List.of("선택하지 않음","감량","유지","증량")));
        fields.put("targetWeight",new Field("targetWeight","target_weight","number","1","400",1,"목표 체중 (kg)",List.of()));
        fields.put("goalStart",new Field("goalStart","goal_start","date","","",0,"목표 기간 시작",List.of()));
        fields.put("goalEnd",new Field("goalEnd","goal_end","date","","",0,"목표 기간 종료",List.of()));
        fields.put("goalReviewed",new Field("goalReviewed","goal_reviewed","select","","",0,"의료진과 목표 확인 여부",List.of("미확인","의료진과 확인함","아직 확인하지 않음")));
        fields.put("weightNotes",new Field("weightNotes","weight_notes","textarea","","",0,"개인 목표·주의사항",List.of()));
        fields.put("breakfast",new Field("breakfast","breakfast","select","","",0,"아침 식사를 한 날",List.of("","0","1","2","3","4","5","6","7")));
        fields.put("vegetables",new Field("vegetables","vegetables","select","","",0,"채소를 먹은 날",List.of("","0","1","2","3","4","5","6","7")));
        fields.put("sugary",new Field("sugary","sugary","select","","",0,"단 음료를 마신 날",List.of("","0","1","2","3","4","5","6","7")));
        fields.put("late",new Field("late","late","select","","",0,"야식을 먹은 날",List.of("","0","1","2","3","4","5","6","7")));
        fields.put("regular",new Field("regular","regular","select","","",0,"식사 시간이 일정했나요?",List.of("미확인","대체로 일정함","날마다 달랐음")));
        ALL=Collections.unmodifiableMap(fields);
        PROFILE=Collections.unmodifiableSet(new LinkedHashSet<>(List.of("age","sex","referenceContext","measured","glucoseMethod","fasting","postType","postHours","bpContext","steps","activeMinutes","sleepHours","smoking","drinkingDays","labMeasured","labSource","goal","medication","restriction","activity","exerciseLimit","weightGoal","targetWeight","goalStart","goalEnd","goalReviewed","weightNotes","breakfast","vegetables","sugary","late","regular")));
        METRICS=Map.ofEntries(Map.entry("height","cm"),Map.entry("weight","kg"),Map.entry("waist","cm"),Map.entry("sys","mmHg"),Map.entry("dia","mmHg"),Map.entry("glucose","mg/dL"),Map.entry("postGlucose","mg/dL"),Map.entry("hba1c","%"),Map.entry("ast","U/L"),Map.entry("alt","U/L"),Map.entry("ggt","U/L"),Map.entry("creatinine","mg/dL"),Map.entry("egfr","mL/min/1.73m²"),Map.entry("hemoglobin","g/dL"),Map.entry("bodyFat","%"),Map.entry("totalChol","mg/dL"),Map.entry("ldl","mg/dL"),Map.entry("hdl","mg/dL"),Map.entry("tg","mg/dL"));
    }
}
