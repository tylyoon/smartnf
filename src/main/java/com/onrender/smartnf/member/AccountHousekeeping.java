package com.onrender.smartnf.member;
import java.time.*;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.jdbc.core.JdbcTemplate;
@Configuration
@EnableScheduling
public class AccountHousekeeping {
 private final JdbcTemplate jdbc;
 public AccountHousekeeping(JdbcTemplate jdbc){this.jdbc=jdbc;}
 @Scheduled(fixedDelay=900000,initialDelay=900000)
 public void clearExpired(){jdbc.update("DELETE FROM member_email_changes WHERE expires_at<=?",LocalDateTime.now(ZoneOffset.UTC));}
}
