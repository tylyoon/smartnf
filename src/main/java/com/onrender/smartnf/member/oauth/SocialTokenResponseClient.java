package com.onrender.smartnf.member.oauth;

import org.springframework.security.oauth2.client.endpoint.*;
import org.springframework.security.oauth2.core.endpoint.OAuth2AccessTokenResponse;
import org.springframework.stereotype.Component;
import org.springframework.util.*;

/** Include the already-validated authorization-request state in Naver's POST body. */
@Component
public class SocialTokenResponseClient implements OAuth2AccessTokenResponseClient<OAuth2AuthorizationCodeGrantRequest> {
    private final RestClientAuthorizationCodeTokenResponseClient delegate=new RestClientAuthorizationCodeTokenResponseClient();
    public SocialTokenResponseClient(){delegate.addParametersConverter(SocialTokenResponseClient::additionalParameters);}
    SocialTokenResponseClient(org.springframework.web.client.RestClient client){this();delegate.setRestClient(client);}
    public static MultiValueMap<String,String> additionalParameters(OAuth2AuthorizationCodeGrantRequest request){
        MultiValueMap<String,String> parameters=new LinkedMultiValueMap<>();
        if("naver".equals(request.getClientRegistration().getRegistrationId())){
            String state=request.getAuthorizationExchange().getAuthorizationRequest().getState();
            if(state==null||state.isBlank())throw new org.springframework.security.oauth2.core.OAuth2AuthenticationException(new org.springframework.security.oauth2.core.OAuth2Error("invalid_state"));
            parameters.add("state",state);
        }
        return parameters;
    }
    @Override public OAuth2AccessTokenResponse getTokenResponse(OAuth2AuthorizationCodeGrantRequest request){return delegate.getTokenResponse(request);}
}
