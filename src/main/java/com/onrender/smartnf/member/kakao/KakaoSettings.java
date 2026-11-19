package com.onrender.smartnf.member.kakao;

import java.net.URI;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

@Component
public class KakaoSettings {
    private final Environment environment;
    public KakaoSettings(Environment environment){this.environment=environment;}
    public String clientId(){return environment.getProperty("KAKAO_REST_API_KEY","").strip();}
    public String clientSecret(){return environment.getProperty("KAKAO_CLIENT_SECRET","").strip();}
    public String baseUrl(){return environment.getProperty("SMARTNF_PUBLIC_BASE_URL","").strip().replaceAll("/+$","");}
    public String redirectUri(){return baseUrl()+"/login/oauth2/code/kakao";}
    public boolean ready(){
        if(!"true".equalsIgnoreCase(environment.getProperty("KAKAO_LOGIN_ENABLED","false"))||clientId().isBlank()||clientSecret().isBlank())return false;
        try{
            URI u=URI.create(baseUrl());
            if(u.getHost()==null||u.getUserInfo()!=null||u.getQuery()!=null||u.getFragment()!=null||!u.getPath().isEmpty())return false;
            boolean local=u.getHost().equals("localhost")||u.getHost().equals("127.0.0.1");
            return ("https".equals(u.getScheme()) || (local&&"http".equals(u.getScheme()))) && (u.getPort()==-1||(u.getPort()>0&&u.getPort()<=65535));
        }catch(IllegalArgumentException e){return false;}
    }
    public boolean availableAt(HttpServletRequest request){
        if(!ready())return false;
        URI u=URI.create(baseUrl());
        int port=u.getPort()<0?(u.getScheme().equals("https")?443:80):u.getPort();
        return u.getScheme().equalsIgnoreCase(request.getScheme())&&u.getHost().equalsIgnoreCase(request.getServerName())&&port==request.getServerPort()&&request.getContextPath().isEmpty();
    }
}
