package com.onrender.smartnf.member;

import java.sql.Statement;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.Instant;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.stereotype.Repository;

/** Explicit SQL repository; existing JPA configuration remains unchanged. */
@Repository
public class MemberRepository {
    private final JdbcTemplate jdbc;
    public MemberRepository(JdbcTemplate jdbc){this.jdbc=jdbc;}
    public record LoginMember(long id,String email,String hash,String name,String status,long authVersion) {
        public LoginMember(long id,String email,String hash,String name,String status){this(id,email,hash,name,status,0);}
    }
    public Optional<LoginMember> findLogin(String email){
        return jdbc.query("SELECT m.id,c.login_email,c.password_hash,m.display_name,m.status,m.auth_version FROM members m JOIN local_credentials c ON c.member_id=m.id WHERE c.login_email=?",
            (rs,row)->new LoginMember(rs.getLong(1),rs.getString(2),rs.getString(3),rs.getString(4),rs.getString(5),rs.getLong(6)),email).stream().findFirst();
    }
    public record SocialMember(long id,String name,String status,long authVersion) {
        public SocialMember(long id,String name,String status){this(id,name,status,0);}
    }
    public Optional<SocialMember> findSocial(String provider,String providerId){
        return jdbc.query("SELECT m.id,m.display_name,m.status,m.auth_version FROM members m JOIN social_accounts s ON s.member_id=m.id WHERE s.provider=? AND s.provider_user_id=?",
            (rs,row)->new SocialMember(rs.getLong(1),rs.getString(2),rs.getString(3),rs.getLong(4)),provider,providerId).stream().findFirst();
    }
    public void insertSocial(long memberId,String provider,String providerId,Instant now){jdbc.update("INSERT INTO social_accounts(member_id,provider,provider_user_id,created_at) VALUES (?,?,?,?)",memberId,provider,providerId,LocalDateTime.ofInstant(now,ZoneOffset.UTC));}
    public List<String> roles(long memberId){return jdbc.queryForList("SELECT role FROM member_roles WHERE member_id=?",String.class,memberId);}
    public long insertMember(String name, Instant now){
        var key=new GeneratedKeyHolder();
        jdbc.update(connection->{var s=connection.prepareStatement("INSERT INTO members(display_name,status,created_at,updated_at) VALUES (?,'ACTIVE',?,?)",Statement.RETURN_GENERATED_KEYS);
            s.setString(1,name);s.setObject(2,LocalDateTime.ofInstant(now,ZoneOffset.UTC));s.setObject(3,LocalDateTime.ofInstant(now,ZoneOffset.UTC));return s;},key);
        return Objects.requireNonNull(key.getKey()).longValue();
    }
    public void insertCredential(long id,String email,String hash,Instant now){jdbc.update("INSERT INTO local_credentials(member_id,login_email,password_hash,password_changed_at) VALUES (?,?,?,?)",id,email,hash,LocalDateTime.ofInstant(now,ZoneOffset.UTC));}
    public void grantUser(long id,Instant now){jdbc.update("INSERT INTO member_roles(member_id,role,granted_at) VALUES (?,'USER',?)",id,LocalDateTime.ofInstant(now,ZoneOffset.UTC));}
    public List<Long> signupDocuments(String version){return jdbc.queryForList("SELECT id FROM consent_documents WHERE version=? AND consent_type IN ('TERMS','PRIVACY') AND required=TRUE AND effective_at<=CURRENT_TIMESTAMP ORDER BY id",Long.class,version);}
    public void recordAgreement(long memberId,long documentId,Instant now){jdbc.update("INSERT INTO member_consents(member_id,document_id,decision,recorded_at) VALUES (?,?,'AGREED',?)",memberId,documentId,LocalDateTime.ofInstant(now,ZoneOffset.UTC));}
}
