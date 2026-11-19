package com.onrender.smartnf.health;
import java.util.Map;import org.springframework.http.ResponseEntity;import org.springframework.web.bind.annotation.*;
@RestControllerAdvice(assignableTypes={IngredientProductController.class,ShoppingProductController.class,CollectedProductController.class,ProductCollectionController.class,PriceReferenceController.class}) public class ProductApiErrors {
 @ExceptionHandler(HealthException.class) public ResponseEntity<Map<String,String>> known(HealthException e){return ResponseEntity.status(e.status()).header("Cache-Control","no-store").body(Map.of("message",e.getMessage()));}
 @ExceptionHandler({org.springframework.http.converter.HttpMessageNotReadableException.class,org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class,org.springframework.web.bind.MissingServletRequestParameterException.class}) public ResponseEntity<Map<String,String>> malformed(){return ResponseEntity.badRequest().header("Cache-Control","no-store").body(Map.of("message","상품·장보기 입력 형식을 확인하세요."));}
 @ExceptionHandler(org.springframework.dao.DataAccessException.class) public ResponseEntity<Map<String,String>> storage(){return ResponseEntity.status(503).header("Cache-Control","no-store").body(Map.of("message","상품 선택 저장을 확인하지 못했습니다. DB 연결과 V29·V30 적용 상태를 확인하세요."));}
}
