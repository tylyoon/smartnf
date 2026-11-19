/* SmartNF: run in the approved KDCA list page's DevTools Console.
 * Read-only list queries. Export only approved content IDs and titles.
 * No API TOKEN, URLs, cookies or form values are logged/exported.
 */
(() => {
  'use strict';
  const EXPECTED = 688;
  const PATH = '/healthinfo/biz/health/portalUseGuidance/openApiReqst/openApiReqstMain.do';
  const clean = value => String(value || '').replace(/\s+/g, ' ').trim();

  function extract(doc) {
    for (const table of doc.querySelectorAll('table')) {
      const headings = [...table.querySelectorAll('th')].map(cell => clean(cell.textContent));
      const idIndex = headings.indexOf('ID');
      const titleIndex = headings.indexOf('콘텐츠');
      const statusIndex = headings.indexOf('상태');
      if (idIndex < 0 || titleIndex < 0 || statusIndex < 0) continue;
      const rows = [];
      for (const tr of table.querySelectorAll('tr')) {
        const cells = [...tr.querySelectorAll('td')];
        if (!cells.length) continue;
        if (cells.length <= Math.max(idIndex, titleIndex, statusIndex)) continue;
        const id = clean(cells[idIndex].textContent);
        if (!/^\d{1,10}$/.test(id)) continue;
        // Skip waiting/rejected requests; never turn them into approved rows.
        if (clean(cells[statusIndex].textContent) !== '승인') continue;
        const title = clean(cells[titleIndex].textContent);
        if (!title || /https?:\/\/|TOKEN\s*=/i.test(title)) throw new Error('UNEXPECTED_TITLE');
        rows.push({content_id: id, title});
      }
      return rows;
    }
    throw new Error('LIST_TABLE_NOT_FOUND');
  }

  function merge(records, rows) {
    let added = 0;
    const pageIds = new Set();
    for (const row of rows) {
      if (pageIds.has(row.content_id)) throw new Error('DUPLICATE_ID_IN_PAGE');
      pageIds.add(row.content_id);
      const existing = records.get(row.content_id);
      if (existing && existing.title !== row.title) throw new Error('TITLE_CONFLICT');
      if (!existing) { records.set(row.content_id, row); added++; }
    }
    if (records.size > EXPECTED) throw new Error('MORE_THAN_EXPECTED');
    return added;
  }

  function payload(records, completed, pages, reason) {
    return {schema_version: '0.1', source: 'KDCA approved request list',
      expected_count: EXPECTED, observed_count: records.size, complete: completed,
      pages_read: pages, stop_reason: reason, exported_at: new Date().toISOString(),
      records: [...records.values()].map(row => ({content_id: row.content_id, title: row.title}))};
  }

  // Pure helpers are exposed only in Node for offline fixture tests.
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {extract, merge, payload};
    return;
  }

  async function run() {
    if (window.__smartnfExportRunning) { console.log('이미 추출 중입니다. 완료까지 기다리세요.'); return; }
    if (location.hostname !== 'health.kdca.go.kr' || location.protocol !== 'https:' || location.pathname !== PATH) {
      console.log('질병관리청의 승인 건강정보 목록 화면에서 실행하세요.'); return;
    }
    const form = document.getElementById('openApiReqstMainForm');
    if (!form || !form.elements.namedItem('pageIndex')) {
      console.log('목록 조회 폼을 확인할 수 없습니다.'); return;
    }
    // Use only the 3 observed search fields, never serialize arbitrary controls.
    const searchType = form.elements.namedItem('searchTy');
    const allOption = searchType && [...(searchType.options || [])].find(o => clean(o.textContent) === '전체');
    if (!allOption) { console.log('전체 검색 옵션을 확인할 수 없습니다.'); return; }
    const endpoint = new URL(PATH, location.origin);
    const records = new Map();
    let pages = 0, completed = false, reason = 'MAX_PAGES_REACHED';
    const allowedErrors = new Set(['UNEXPECTED_TITLE', 'LIST_TABLE_NOT_FOUND', 'DUPLICATE_ID_IN_PAGE',
      'TITLE_CONFLICT', 'MORE_THAN_EXPECTED', 'HTTP_NOT_SUCCESS', 'EMPTY_APPROVED_PAGE', 'REPEATED_PAGE']);
    window.__smartnfExportRunning = true;
    console.log('승인 목록 추출 시작: ID·콘텐츠명만 저장합니다. 화면을 닫거나 새로고침하지 마세요.');
    try {
      for (let page = 1; page <= 200; page++) {
        if (page > 1) await new Promise(resolve => setTimeout(resolve, 1000));
        const body = new URLSearchParams({searchTy: allOption.value, searchWrd: '', pageIndex: String(page)});
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 30000);
        let html;
        try {
          const response = await fetch(endpoint.href, {method: 'POST', body,
            credentials: 'same-origin', redirect: 'error', signal: controller.signal});
          if (!response.ok) throw new Error('HTTP_NOT_SUCCESS');
          html = await response.text();
        } finally { clearTimeout(timer); }
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const rows = extract(doc);
        if (!rows.length) throw new Error('EMPTY_APPROVED_PAGE');
        if (!merge(records, rows)) throw new Error('REPEATED_PAGE');
        pages = page;
        console.log(`${page}페이지 확인 / 승인 ${records.size}건`);
        if (records.size === EXPECTED) { completed = true; reason = 'EXPECTED_COUNT_REACHED'; break; }
      }
    } catch (error) {
      // Raw fetch errors may contain URLs. Print a fixed local code only.
      reason = allowedErrors.has(error.message) ? error.message :
        error.name === 'AbortError' ? 'REQUEST_TIMEOUT' : 'REQUEST_FAILED';
    } finally { window.__smartnfExportRunning = false; }
    if (records.size) {
      const data = payload(records, completed, pages, reason);
      const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json;charset=utf-8'});
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = completed ? 'approved_health_catalog.json' : 'approved_health_catalog.partial.json';
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    }
    console.log(completed ? '완료: 승인 목록 688건 JSON 저장.' :
      `미완료: ${records.size}/688건 (${reason}). 부분 파일을 전체 목록으로 사용하지 마세요.`);
  }
  run().catch(() => { window.__smartnfExportRunning = false; console.log('추출 중단: 설정 확인이 필요합니다.'); });
})();
