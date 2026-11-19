package com.onrender.smartnf.member.oauth;

import org.junit.jupiter.api.Test;
import org.springframework.http.*;
import org.springframework.security.oauth2.client.endpoint.*;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.core.*;
import org.springframework.security.oauth2.core.endpoint.*;
import org.springframework.security.oauth2.core.http.converter.OAuth2AccessTokenResponseHttpMessageConverter;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import static org.junit.jupiter.api.Assertions.*;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

class SocialTokenResponseClientTests {
    OAuth2AuthorizationCodeGrantRequest grant(String provider){
        String token=provider.equals("naver")?"https://nid.naver.com/oauth2.0/token":"https://kauth.kakao.com/oauth/token";
        var registration=ClientRegistration.withRegistrationId(provider).clientId("fake-client").clientSecret("fake-secret")
            .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_POST).authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
            .authorizationUri("https://example.test/authorize").tokenUri(token).redirectUri("http://localhost:8080/login/oauth2/code/"+provider).build();
        var request=OAuth2AuthorizationRequest.authorizationCode().authorizationUri("https://example.test/authorize").clientId("fake-client")
            .redirectUri(registration.getRedirectUri()).state("verified-state").build();
        var response=OAuth2AuthorizationResponse.success("fake-code").redirectUri(registration.getRedirectUri()).state("verified-state").build();
        return new OAuth2AuthorizationCodeGrantRequest(registration,new OAuth2AuthorizationExchange(request,response));
    }
    @Test void tokenPostKeepsCredentialsInBodyAndAddsStateOnlyForNaver(){
        for(String provider:java.util.List.of("naver","kakao")){
            var builder=RestClient.builder().messageConverters(converters->converters.add(0,new OAuth2AccessTokenResponseHttpMessageConverter()));
            var server=MockRestServiceServer.bindTo(builder).build();var request=grant(provider);
            var expectation=server.expect(requestTo(request.getClientRegistration().getProviderDetails().getTokenUri())).andExpect(method(HttpMethod.POST))
                .andExpect(content().string(containsString("client_id=fake-client")))
                .andExpect(content().string(containsString("client_secret=fake-secret")))
                .andExpect(content().string(containsString("code=fake-code")));
            if(provider.equals("naver"))expectation.andExpect(content().string(containsString("state=verified-state")));
            else expectation.andExpect(content().string(not(containsString("state="))));
            expectation.andRespond(withSuccess("{\"access_token\":\"fake-access\",\"token_type\":\"Bearer\",\"expires_in\":3600}",MediaType.APPLICATION_JSON));
            assertEquals("fake-access",new SocialTokenResponseClient(builder.build()).getTokenResponse(request).getAccessToken().getTokenValue());server.verify();
        }
    }
}
