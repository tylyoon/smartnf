package com.onrender.smartnf.health;

import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestControllerAdvice(assignableTypes={HealthApiController.class,MyPageLayoutController.class,HealthDailyController.class,MealController.class,FoodPlanController.class})
public class HealthApiErrors {
    @ExceptionHandler(HealthException.class) ResponseEntity<Map<String,Object>> health(HealthException error){return ResponseEntity.status(error.status()).body(Map.of("message",error.getMessage()));}
    @ExceptionHandler(org.springframework.http.converter.HttpMessageNotReadableException.class)
    ResponseEntity<Map<String,Object>> malformed(){return ResponseEntity.badRequest().body(Map.of("message","전송 형식을 확인해 주세요."));}
    @ExceptionHandler(org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class)
    ResponseEntity<Map<String,Object>> argument(){return ResponseEntity.badRequest().body(Map.of("message","날짜·조회 형식을 확인하세요."));}
    @ExceptionHandler(org.springframework.dao.DataAccessException.class)
    ResponseEntity<Map<String,Object>> storage(){return ResponseEntity.status(503).body(Map.of("message","저장을 완료하지 못했습니다. 입력은 유지됩니다. 잠시 후 다시 확인해 주세요."));}
}
