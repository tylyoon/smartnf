package com.onrender.smartnf.demo;

import java.util.List;
import org.springframework.stereotype.Service;

/** 실제 회원·건강·거래·운영 저장소를 읽지 않는 독립 가상 시나리오입니다. */
@Service
public class DemoService {
    public DemoSummary summary() {
        return new DemoSummary(true, true, "가상 시나리오 · 실제 처리 결과 아님",
                List.of(new DemoJob("DEMO-001", "공공 영양정보 동기화", "조회 예시", "식품 출처·단위·수집 이력 확인"),
                        new DemoJob("DEMO-002", "문서 추출 검수", "검수 대기 예시", "가상 거래명세서 품목·수량·합계 대조"),
                        new DemoJob("DEMO-003", "ERP·Excel 입력", "실패 예시", "실제 입력 없이 복구 흐름 확인")),
                List.of(new DemoDocument("가상 거래명세서", "샘플 공급업체 A", "현미 1kg", 2, 4500, 9000),
                        new DemoDocument("가상 거래명세서", "샘플 공급업체 A", "두부 300g", 3, 2000, 6000)));
    }
    public record DemoSummary(boolean demo, boolean readOnly, String notice,
                              List<DemoJob> jobs, List<DemoDocument> documents) { }
    public record DemoJob(String id, String name, String status, String description) { }
    public record DemoDocument(String type, String supplier, String product,
                               int quantity, int unitPrice, int amount) { }
}
