package com.onrender.smartnf.health;

import java.util.*;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class MyPageLayoutService {
    private final JdbcTemplate jdbc;private final HealthRepository members;
    public MyPageLayoutService(JdbcTemplate jdbc,HealthRepository members){this.jdbc=jdbc;this.members=members;}
    public MyPageLayout.State get(long member){members.lockMember(member);return read(member);}
    private MyPageLayout.State read(long member){
        return jdbc.query("SELECT revision,widget_ids FROM member_mypage_layouts WHERE member_id=?",
          (rs,n)->new MyPageLayout.State(rs.getLong(1),MyPageLayout.validate(Arrays.asList(rs.getString(2).split(",")))),member)
          .stream().findFirst().orElse(new MyPageLayout.State(0,MyPageLayout.DEFAULT));
    }
    public MyPageLayout.State save(long member,MyPageLayout.Save request){
        if(request==null||request.expectedRevision()==null||request.expectedRevision()<0)throw HealthException.invalid();
        var widgets=MyPageLayout.validate(request.widgets());members.lockMember(member);var current=read(member);
        // Exact retries are safe even if the previous response was lost.
        if(request.expectedRevision()!=current.revision()){
            if(current.revision()==request.expectedRevision()+1&&widgets.equals(current.widgets()))return current;
            throw HealthException.conflict();
        }
        if(current.revision()>0&&widgets.equals(current.widgets()))return current;
        long next=current.revision()+1;String ids=String.join(",",widgets);var now=LocalDateTime.now(ZoneOffset.UTC);
        if(current.revision()==0)jdbc.update("INSERT INTO member_mypage_layouts(member_id,revision,widget_ids,updated_at) VALUES (?,?,?,?)",member,next,ids,now);
        else jdbc.update("UPDATE member_mypage_layouts SET revision=?,widget_ids=?,updated_at=? WHERE member_id=?",next,ids,now,member);
        return new MyPageLayout.State(next,widgets);
    }
    public MyPageLayout.Suggestion suggest(long member,MyPageLayout.Prompt prompt){
        members.lockMember(member);return MyPageLayout.suggest(prompt==null?null:prompt.text());
    }
}
