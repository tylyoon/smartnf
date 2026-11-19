package com.onrender.smartnf.health;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import static com.onrender.smartnf.health.HealthModels.*;

@RestController
@RequestMapping("/api/me/health")
public class HealthApiController {
    private final CurrentHealthMember current;private final HealthService service;
    public HealthApiController(CurrentHealthMember current,HealthService service){this.current=current;this.service=service;}
    @GetMapping("/consent") public ConsentState consent(Authentication auth){return service.consent(current.id(auth));}
    @PostMapping("/consent") public ConsentState consent(Authentication auth,@RequestBody ConsentRequest request){return service.changeConsent(current.id(auth),request);}
    // Wrapper permits a successful empty result without a misleading 204/JSON parse failure.
    @GetMapping("/profile") public Map<String,Object> profile(Authentication auth){var result=new LinkedHashMap<String,Object>();result.put("profile",service.latestProfile(current.id(auth)));return result;}
    @GetMapping("/profiles/{id}") public Profile profile(Authentication auth,@PathVariable long id){return service.profile(current.id(auth),id);}
    @GetMapping("/history") public List<HistoryRow> history(Authentication auth,@RequestParam(defaultValue="0") int page){return service.history(current.id(auth),page);}
    @PostMapping("/profiles") public Profile save(Authentication auth,@RequestBody ProfileRequest request){return service.save(current.id(auth),request);}
    @GetMapping("/care") public Map<String,Object> care(Authentication auth){var result=new LinkedHashMap<String,Object>();result.put("care",service.latestCare(current.id(auth)));return result;}
    @PostMapping("/care") public CareSet saveCare(Authentication auth,@RequestBody CareRequest request){return service.saveCare(current.id(auth),request);}
    @GetMapping("/catalog") public Map<String,Object> catalog(Authentication auth){service.consent(current.id(auth));return Map.of("version",HealthService.CATALOG_VERSION,"fields",HealthFields.ALL,"supported",HealthFields.SUPPORTED);}
}
