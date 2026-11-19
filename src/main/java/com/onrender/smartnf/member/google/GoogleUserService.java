package com.onrender.smartnf.member.google;

import org.springframework.security.oauth2.client.oidc.userinfo.*;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.*;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;

/** Spring's OIDC authentication provider validates signature, issuer, audience, expiry and nonce. */
@Service
public class GoogleUserService implements OAuth2UserService<OidcUserRequest,OidcUser> {
    private final GoogleMemberService members;
    private final OidcUserService delegate;
    @org.springframework.beans.factory.annotation.Autowired
    public GoogleUserService(GoogleMemberService members){this(members,new OidcUserService());}
    GoogleUserService(GoogleMemberService members,OidcUserService delegate){
        this.members=members;this.delegate=delegate;
        // Only the already-validated ID token's subject is needed, never UserInfo.
        this.delegate.setRetrieveUserInfo(request->false);
    }
    @Override public OidcUser loadUser(OidcUserRequest request){
        if(!"google".equals(request.getClientRegistration().getRegistrationId()))
            throw new OAuth2AuthenticationException(new OAuth2Error("unsupported_provider"));
        var user=delegate.loadUser(request);
        return members.resolve(user.getSubject()).withIdToken(request.getIdToken());
    }
}
