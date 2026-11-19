package com.onrender.smartnf.health;
/** Manual browser fixture. Fixed in-memory H2 only, never a local user's MySQL. */
public class FoodPlanBrowserServer {
 public static void main(String[] args){
  if(!Boolean.getBoolean("smartnf.plan.browserFixture"))throw new IllegalStateException("Explicit H2 fixture flag required");
  var app=new org.springframework.boot.SpringApplication(com.onrender.smartnf.SmartnfApplication.class);
  var ctx=app.run("--server.port=18081","--server.address=127.0.0.1","--spring.datasource.url=jdbc:h2:mem:plans-browser;MODE=MySQL;DB_CLOSE_DELAY=-1","--spring.datasource.username=sa","--spring.datasource.password=","--spring.datasource.driver-class-name=org.h2.Driver","--spring.flyway.enabled=false","--spring.sql.init.mode=always","--spring.sql.init.schema-locations=classpath:auth-test-schema.sql,classpath:health-test-schema.sql","--spring.jpa.hibernate.ddl-auto=none","--smartnf.google.enabled=false","--smartnf.kakao.enabled=false","--smartnf.naver.enabled=false");
  var members=ctx.getBean(com.onrender.smartnf.member.MemberRepository.class);var encoder=ctx.getBean(org.springframework.security.crypto.password.PasswordEncoder.class);
  for(int i=1;i<=2;i++){long id=members.insertMember("plan fixture "+i,java.time.Instant.now());members.grantUser(id,java.time.Instant.now());members.insertCredential(id,"plan"+i+"@example.test",encoder.encode("Smartnf-test123!"),java.time.Instant.now());}
  System.out.println("FOOD_PLAN_BROWSER_READY");
 }
}
