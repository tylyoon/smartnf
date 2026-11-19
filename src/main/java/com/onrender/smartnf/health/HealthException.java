package com.onrender.smartnf.health;

public class HealthException extends RuntimeException {
    private final int status;
    public HealthException(int status,String message){super(message);this.status=status;}
    public int status(){return status;}
    public static HealthException invalid(){return new HealthException(400,"입력값·형식·선택 항목을 확인해 주세요.");}
    public static HealthException conflict(){return new HealthException(409,"다른 화면에서 저장 상태가 변경되었습니다. 최신 기록을 다시 확인해 주세요.");}
}
