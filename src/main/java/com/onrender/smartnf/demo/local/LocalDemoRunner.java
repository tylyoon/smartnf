package com.onrender.smartnf.demo.local;

import java.util.Arrays;
import javax.sql.DataSource;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

@Component
@Profile("local-demo")
@ConditionalOnProperty(name="smartnf.local-demo.action")
public class LocalDemoRunner implements ApplicationRunner {
    private final Environment env;private final DataSource source;private final LocalDemoService service;
    public LocalDemoRunner(Environment env,DataSource source,LocalDemoService service){this.env=env;this.source=source;this.service=service;}
    static void guard(String[] profiles,String address,String url,String action){
        if(!Arrays.equals(profiles,new String[]{"local-demo"})||!"127.0.0.1".equals(address)||url==null||!url.matches("jdbc:mysql://(?:localhost|127\\.0\\.0\\.1)(?::[0-9]{1,5})?/smartnf(?:\\?[^#]*)?")||!safeOptions(url)||!java.util.Set.of("seed","delete").contains(action))
            throw new IllegalStateException("가상 데이터는 전용 local-demo 프로필·127.0.0.1 서버·로컬 MySQL smartnf에서만 처리합니다.");
    }
    private static boolean safeOptions(String url){
        if(url==null)return false;
        int separator=url.indexOf('?');if(separator<0)return true;
        var allowed=java.util.Set.of("useunicode","characterencoding","usessl","sslmode","allowpublickeyretrieval","servertimezone","connectiontimezone","zerodatetimebehavior");
        for(String option:url.substring(separator+1).split("&",-1)){
            int equal=option.indexOf('=');if(equal<1||!allowed.contains(option.substring(0,equal).toLowerCase(java.util.Locale.ROOT)))return false;
        }
        return true;
    }
    @Override public void run(ApplicationArguments args)throws Exception {
        String action=env.getProperty("smartnf.local-demo.action");
        // Check configured and driver-reported endpoints. Never print URLs or credentials.
        guard(env.getActiveProfiles(),env.getProperty("server.address"),env.getProperty("spring.datasource.url"),action);
        try(var connection=source.getConnection()){guard(env.getActiveProfiles(),env.getProperty("server.address"),connection.getMetaData().getURL(),action);}
        var result="seed".equals(action)?service.seed(env.getProperty("SMARTNF_DEMO_PASSWORD")):service.delete();
        System.out.printf("SmartNF demo data: created=%d, kept=%d, deleted=%d%n",result.created(),result.skipped(),result.deleted());
        System.out.println("Demo meal fixtures synchronized where eligible. Existing edits/withdrawals are preserved.");
    }
}
