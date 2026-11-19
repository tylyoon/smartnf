package com.onrender.smartnf.health;

import java.util.*;

public final class HealthModels {
    private HealthModels(){}
    public record ProfileRequest(UUID requestId,Long expectedCurrentProfileId,Long consentEventId,
        boolean demo,boolean confirmedByUser,Map<String,List<String>> fields){}
    public record CareItem(String id,List<String> scopes){}
    public record CareRequest(UUID requestId,Long expectedCurrentSetId,Long profileId,Long consentEventId,
        boolean demo,boolean confirmedByUser,List<CareItem> items){}
    public record ConsentRequest(String documentVersion,String decision,Long expectedEventId){}
    public record ConsentState(boolean agreed,Long eventId,String version){}
    public record Profile(long id,String savedAt,Map<String,List<String>> fields){}
    public record CareSet(long id,Long profileId,String savedAt,List<CareItem> items,boolean needsReview){}
    public record HistoryRow(long id,String savedAt){}
}
