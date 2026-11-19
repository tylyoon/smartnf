package com.onrender.smartnf;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:smartnf-auth;MODE=MySQL;DB_CLOSE_DELAY=-1",
    "spring.datasource.username=sa", "spring.datasource.password=",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.flyway.enabled=false", "spring.sql.init.mode=always",
    "spring.sql.init.schema-locations=classpath:auth-test-schema.sql",
    "spring.jpa.hibernate.ddl-auto=none", "GOOGLE_LOGIN_ENABLED=false", "KAKAO_LOGIN_ENABLED=false", "NAVER_LOGIN_ENABLED=false"
})
class SmartnfApplicationTests {

	@Test
	void contextLoads() {
	}

}
