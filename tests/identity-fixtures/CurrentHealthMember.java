package com.onrender.smartnf.health;
public class CurrentHealthMember {public long id(org.springframework.security.core.Authentication auth){if(auth==null)throw new HealthException();return Long.parseLong(auth.getName());}}
