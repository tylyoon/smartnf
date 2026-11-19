package com.onrender.smartnf.web;
import java.util.*;
import static com.onrender.smartnf.web.RecipeTastePolicy.*;
public class RecipeTastePolicyCheck {
 static void check(boolean ok){if(!ok)throw new AssertionError();}
 public static void main(String[] args){
  check(basic("김치볶음밥").cuisine().equals("한식"));check(basic("김치찌개").role().equals("메인"));
  check(basic("오이무침").role().equals("사이드"));check(basic("두부구이").role().equals("겸용"));
  check(basic("알 수 없는 요리").taste().isEmpty());
  var f=new Feedback(3,true,Map.of("spicy",1,"salty",2),List.of());validate(f);
  check(profile(List.of(f,f)).isEmpty());check(profile(List.of(f,f,f)).get("spicy")==1);
  check(profile(List.of(f,f,new Feedback(1,false,Map.of("spicy",5),List.of("너무 매워요")))).get("spicy")==2);
  var predicted=new Features("한식","메인",Map.of("spicy",2,"salty",2),"","","USER");
  check(distance(predicted,profile(List.of(f,f,f)))==0.5);check(distance(basic("김치"),profile(List.of(f,f,f)))==null);
  try{scores(Map.of("spicy",6));throw new AssertionError();}catch(IllegalArgumentException good){}
  try{scores(Map.of("invented",2));throw new AssertionError();}catch(IllegalArgumentException good){}
  check(likingStars(f)==5);check(againStars(f)==5);
  var stars=new Feedback(0,null,Map.of("spicy",2),List.of(),4,3,"부드러움","고소함");validate(stars);
  check(profile(List.of(stars,stars,stars)).get("spicy")==2);
  try{validate(new Feedback(0,null,Map.of(),List.of(),6,null,null,null));throw new AssertionError();}catch(IllegalArgumentException good){}
  try{validate(new Feedback(0,null,Map.of(),List.of(),null,0,null,null));throw new AssertionError();}catch(IllegalArgumentException good){}
  check(norm(" 두 부 ").equals("두부"));System.out.println("RecipeTastePolicy checks passed");
 }
}
