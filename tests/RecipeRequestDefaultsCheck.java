package com.onrender.smartnf.web;
import tools.jackson.databind.json.JsonMapper;
public class RecipeRequestDefaultsCheck {
 public static void main(String[] args) {
  var json=JsonMapper.builder().build();
  for(String body:new String[]{"{\"foodName\":\"스파게티\",\"consent\":true,\"usePreferences\":false}","{\"foodName\":\"스파게티\",\"consent\":true}","{\"foodName\":\"스파게티\",\"consent\":true,\"usePreferences\":null,\"manualTasteEnabled\":null}"}){
   var r=json.readValue(body,RecipeGenerationController.RecipeRequest.class);
   if(!r.consent()||r.usePreferences()||r.manualTasteEnabled())throw new AssertionError();
   if(!new RecipePreferenceService(null,null).resolve(null,r.usePreferences(),r.manualTasteEnabled(),r.preferredTaste()).targets().isEmpty())throw new AssertionError();
  }
  var manual=json.readValue("{\"foodName\":\"스파게티\",\"consent\":true,\"usePreferences\":true,\"manualTasteEnabled\":true,\"preferredTaste\":{\"spicy\":1}}",RecipeGenerationController.RecipeRequest.class);
  if(!manual.usePreferences()||!manual.manualTasteEnabled()||manual.preferredTaste().get("spicy")!=1)throw new AssertionError();
  System.out.println("Jackson 3: optional missing/null preference flags default false; enabled manual preferences preserved; OFF needs no member/history lookup");
 }
}
