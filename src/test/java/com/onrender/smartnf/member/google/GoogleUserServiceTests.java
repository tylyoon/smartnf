package com.onrender.smartnf.member.google;

import java.time.Instant;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.security.config.oauth2.client.CommonOAuth2Provider;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.core.*;
import org.springframework.security.oauth2.core.oidc.OidcIdToken;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class GoogleUserServiceTests {
    @Test void validatedSubjectMapsToInternalRolesWithoutCollectingProfile(){
        var members=mock(GoogleMemberService.class);
        when(members.resolve("subject-123")).thenReturn(new GooglePrincipal("subject-123",42L,"test",List.of("USER")));
        var registration=CommonOAuth2Provider.GOOGLE.getBuilder("google").clientId("client").clientSecret("secret")
            .scope("openid").redirectUri("http://localhost:8080/login/oauth2/code/google").build();
        var now=Instant.now();
        var idToken=new OidcIdToken("already-validated-by-oidc-provider",now,now.plusSeconds(300),
            Map.of("sub","subject-123","iss","https://accounts.google.com","aud",List.of("client")));
        var access=new OAuth2AccessToken(OAuth2AccessToken.TokenType.BEARER,"not-retained",now,now.plusSeconds(300),Set.of("openid"));
        var profileService=mock(DefaultOAuth2UserService.class);
        var delegate=new OidcUserService();
        delegate.setOauth2UserService(profileService);
        var user=(GooglePrincipal)new GoogleUserService(members,delegate).loadUser(new OidcUserRequest(registration,access,idToken));
        assertEquals(42L,user.getMemberId());assertEquals("google:subject-123",user.getName());
        assertEquals(Map.of("sub","subject-123"),user.getAttributes());
        assertSame(idToken,user.getIdToken());assertNull(user.getUserInfo());
        assertEquals(List.of("ROLE_USER"),user.getAuthorities().stream().map(a->a.getAuthority()).toList());
        verify(members).resolve("subject-123");
        verifyNoInteractions(profileService);
    }
}
