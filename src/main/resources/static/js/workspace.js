'use strict';
(() => {
  // 검토 화면에서 입력은 절대 서버로 전송하지 않습니다.
  document.querySelectorAll('[data-demo-form]').forEach(form => {
    form.addEventListener('submit', event => {
      event.preventDefault();
      const password = form.querySelector('[name=password]');
      const confirm = form.querySelector('[name=confirm]');
      const feedback = form.querySelector('.ui-feedback');
      if (password && confirm && password.value !== confirm.value) {
        feedback.textContent = '비밀번호 확인 값이 다릅니다. 시연용 값으로 다시 확인해주세요.';
        return;
      }
      const result = form.querySelector('.ui-demo-result');
      if (result) result.hidden = false;
      feedback.textContent = '화면 흐름을 확인했습니다. 입력값은 전송·저장하지 않았습니다.';
      if (password) {password.value = ''; confirm.value = '';}
    });
  });
  document.querySelectorAll('[data-demo-action]').forEach(button => {
    button.addEventListener('click', () => {
      const feedback = button.parentElement.querySelector('.ui-feedback');
      if (feedback) feedback.textContent = button.dataset.demoAction;
    });
  });
  document.querySelectorAll('[data-demo-file]').forEach(input => {
    input.addEventListener('change', () => {
      input.closest('section').querySelector('.ui-feedback').textContent = input.files.length
        ? '선택한 파일: ' + input.files[0].name + ' · 파일 내용 읽기·업로드는 하지 않습니다.'
        : '선택한 파일이 없습니다.';
    });
  });
})();
// 다음 동작은 가상 화면 표시만 바꾸며 개인정보나 분석 결과를 저장하지 않습니다.
document.querySelectorAll('[data-health-filter]').forEach(button => {
  button.addEventListener('click', () => {
    const selected = button.dataset.healthFilter;
    document.querySelectorAll('[data-health-filter]').forEach(b => b.setAttribute('aria-pressed',String(b===button)));
    document.querySelectorAll('[data-health-topic]').forEach(card => {card.hidden=selected!=='all'&&card.dataset.healthTopic!==selected;});
  });
});
document.querySelector('[data-food-search]')?.addEventListener('input',event=>{
  const query=event.target.value.trim().toLowerCase();
  let visible=0;
  document.querySelectorAll('[data-food-rows] tr').forEach(row=>{
    row.hidden=!row.textContent.toLowerCase().includes(query);
    if(!row.hidden)visible++;
  });
  document.querySelector('[data-food-empty]').hidden=visible!==0;
});
document.querySelectorAll('[data-feedback-period]').forEach(button=>{
  button.addEventListener('click',()=>{
    document.querySelectorAll('[data-feedback-period]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    document.querySelectorAll('[data-feedback-panel]').forEach(panel=>{panel.hidden=panel.dataset.feedbackPanel!==button.dataset.feedbackPeriod;});
  });
});

// Highlight the service on its landing page and descendant screens.
(() => {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  document.querySelectorAll('.site-header nav a').forEach(link => {
    const target = new URL(link.href, window.location.origin).pathname.replace(/\/$/, '') || '/';
    if (path === target) link.setAttribute('aria-current', 'page');
    else if (target !== '/' && path.startsWith(target + '/')) link.setAttribute('aria-current', 'location');
  });
})();
