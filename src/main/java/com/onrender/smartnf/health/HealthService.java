package com.onrender.smartnf.health;

import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import static com.onrender.smartnf.health.HealthModels.*;

@Service
@Transactional
public class HealthService {
    public static final String DOCUMENT_VERSION="dev-health-20261102-refs",CATALOG_VERSION="care-20261028";
    private final HealthRepository repository;
    public HealthService(HealthRepository repository){this.repository=repository;}
    public ConsentState consent(long member){repository.lockMember(member);return repository.consent(member);}
    public Map<String,Object> bootstrap(long member){
        repository.lockMember(member);var consent=repository.consent(member);var result=new LinkedHashMap<String,Object>();result.put("consent",consent);
        Long profile=consent.agreed()?repository.latestProfile(member):null,care=consent.agreed()?repository.latestCare(member):null;
        result.put("profile",profile==null?null:repository.profile(member,profile));result.put("care",care==null?null:repository.care(member,care));return result;
    }
    public void eraseForAccountWithdrawal(long member){
        repository.lockMember(member);var consent=repository.consent(member);repository.erase(member);
        if(consent.agreed())repository.consentEvent(member,"WITHDRAWN");
    }
    public ConsentState changeConsent(long member,ConsentRequest request){
        repository.lockMember(member);var current=repository.consent(member);
        if(request==null||!DOCUMENT_VERSION.equals(request.documentVersion())||(request.decision()==null||!Set.of("AGREED","WITHDRAWN").contains(request.decision())))throw HealthException.invalid();
        if(!Objects.equals(current.eventId(),request.expectedEventId()))throw HealthException.conflict();
        if(request.decision().equals("WITHDRAWN")){repository.erase(member);repository.consentEvent(member,"WITHDRAWN");}
        else if(!current.agreed())repository.consentEvent(member,"AGREED");
        return repository.consent(member);
    }
    private ConsentState require(long member,Long event){
        repository.lockMember(member);var c=repository.consent(member);
        if(!c.agreed())throw new HealthException(403,"건강정보 저장 동의가 필요합니다.");
        if(event!=null&&!event.equals(c.eventId()))throw HealthException.conflict();return c;
    }
    public Profile latestProfile(long member){require(member,null);Long id=repository.latestProfile(member);return id==null?null:repository.profile(member,id);}
    public Profile profile(long member,long id){require(member,null);return repository.profile(member,id);}
    public List<HistoryRow> history(long member,int page){require(member,null);if(page<0||page>100000)throw HealthException.invalid();return repository.history(member,page);}
    public CareSet latestCare(long member){require(member,null);Long id=repository.latestCare(member);return id==null?null:repository.care(member,id);}
    public Profile save(long member,ProfileRequest request){
        if(request==null||request.requestId()==null||request.consentEventId()==null||request.demo()||!request.confirmedByUser())throw HealthException.invalid();
        require(member,request.consentEventId());var fields=HealthValidation.profile(request.fields());String hash=HealthValidation.hash(fields);
        var prior=repository.priorProfile(member,request.requestId());
        if(prior!=null){if(!prior.hash().equals(hash)||!Objects.equals(repository.latestProfile(member),prior.id()))throw HealthException.conflict();return repository.profile(member,prior.id());}
        if(!Objects.equals(repository.latestProfile(member),request.expectedCurrentProfileId()))throw HealthException.conflict();
        long id=repository.insertProfile(member,request,fields,hash);return repository.profile(member,id);
    }
    public CareSet saveCare(long member,CareRequest request){
        if(request==null||request.requestId()==null||request.consentEventId()==null||request.demo()||!request.confirmedByUser())throw HealthException.invalid();
        require(member,request.consentEventId());var items=HealthValidation.care(request.items());
        if(request.profileId()!=null)repository.profile(member,request.profileId());
        if(!Objects.equals(request.profileId(),repository.latestProfile(member)))throw HealthException.conflict();
        var hashFields=new TreeMap<String,List<String>>();hashFields.put("profileId",List.of(String.valueOf(request.profileId())));for(var item:items)hashFields.put(item.id(),item.scopes());String hash=HealthValidation.hash(hashFields);
        var prior=repository.priorCare(member,request.requestId());
        if(prior!=null){if(!prior.hash().equals(hash)||!Objects.equals(repository.latestCare(member),prior.id()))throw HealthException.conflict();return repository.care(member,prior.id());}
        if(!Objects.equals(repository.latestCare(member),request.expectedCurrentSetId()))throw HealthException.conflict();
        long id=repository.insertCare(member,request,items,hash);return repository.care(member,id);
    }
}
