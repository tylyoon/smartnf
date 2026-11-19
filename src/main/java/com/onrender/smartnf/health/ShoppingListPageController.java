package com.onrender.smartnf.health;
import org.springframework.stereotype.Controller;import org.springframework.security.core.Authentication;import org.springframework.web.bind.annotation.GetMapping;
@Controller public class ShoppingListPageController {
 private final CurrentHealthMember current;public ShoppingListPageController(CurrentHealthMember current){this.current=current;}
 @GetMapping("/mypage/shopping") public String page(Authentication a){current.id(a);return "health/shopping-lists";}
}
