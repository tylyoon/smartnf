(() => {
    let busy = false;
    const notice = (text, failed = false) => {
        let node = document.getElementById('photo-review-message');
        if (!node) {
            node = document.createElement('p');
            node.id = 'photo-review-message';
            node.setAttribute('role', 'status');
            document.querySelector('main')?.prepend(node);
        }
        node.textContent = text;
        node.style.color = failed ? '#a32929' : '#176650';
    };
    document.addEventListener('submit', async event => {
        const form = event.target;
        if (!(form instanceof HTMLFormElement) || !form.matches('[data-photo-review-form]')) return;
        event.preventDefault();
        if (busy) return;
        const button = event.submitter;
        const payload = new FormData(form);
        if (button?.name) payload.append(button.name, button.value);
        const oldMain = document.querySelector('main');
        if (!oldMain) return;
        const row = form.closest('[data-photo-row]');
        const candidate = row?.matches('article') && new URL(form.action).pathname === '/admin/recipe-photos';
        const key = row?.matches('li') ? row.getAttribute('data-photo-row') : null;
        const oldTop = row?.getBoundingClientRect().top;
        const oldScroll = window.scrollY;
        const anchorStyle = document.documentElement.style.overflowAnchor;
        const buttons = [...(candidate ? form.querySelectorAll('button') : oldMain.querySelectorAll('[data-photo-review-form] button'))];
        busy = true;
        buttons.forEach(node => node.disabled = true);
        try {
            if (candidate) {
                const expectedKey = payload.get('key');
                if (!expectedKey || expectedKey !== row.getAttribute('data-photo-row')) throw new Error('Wrong card');
                const response = await fetch('/admin/recipe-photos/decision', {
                    method: 'POST', body: new URLSearchParams(payload), credentials: 'same-origin',
                    headers: { Accept: 'application/json' }
                });
                if (response.redirected || !response.ok) throw new Error('Decision not confirmed');
                const result = await response.json();
                if (result.key !== expectedKey || typeof result.changed !== 'boolean'
                        || result.approved !== (payload.get('approve') === 'true')) throw new Error('Unexpected decision');
                if (!result.changed) {
                    notice('이 후보는 이미 변경됐습니다. 다른 카드는 유지했습니다. 새로고침해 확인해 주세요.', true);
                    return;
                }
                const name = row.querySelector('h2')?.textContent || '선택한 음식';
                document.documentElement.style.overflowAnchor = 'none';
                row.remove(); // Remove only the clicked dish card; never select other cards by image URL.
                window.scrollTo({ top: oldScroll, behavior: 'instant' });
                notice(result.approved ? `${name}: 승인했습니다.` : `${name}: 이 사진만 제외했습니다. 다른 음식의 같은 사진은 유지됩니다.`);
                return;
            }
            const response = await fetch(form.action, {
                method: 'POST', body: new URLSearchParams(payload), credentials: 'same-origin',
                headers: { Accept: 'text/html' }
            });
            const location = new URL(response.url);
            if (response.redirected && (location.origin !== window.location.origin || location.pathname !== '/admin/recipe-photos')) {
                notice('로그인 상태를 확인한 뒤 다시 시도해 주세요.', true);
                return;
            }
            if (!response.ok) throw new Error('Request failed');
            const html = await response.text();
            const page = new DOMParser().parseFromString(html, 'text/html');
            const fresh = page.querySelector('main');
            if (!fresh?.querySelector('[data-photo-review-page]')) throw new Error('Unexpected page');
            document.documentElement.style.overflowAnchor = 'none';
            oldMain.replaceWith(document.importNode(fresh, true));
            // Keep the clicked row in the same viewport position, even if other cards changed height.
            const newRow = key == null ? null : [...document.querySelectorAll('[data-photo-row]')]
                .find(node => node.getAttribute('data-photo-row') === key);
            const delta = newRow && oldTop != null ? newRow.getBoundingClientRect().top - oldTop : 0;
            window.scrollTo({ top: Math.max(0, oldScroll + delta), behavior: 'instant' });
            newRow?.querySelector('button')?.focus({ preventScroll: true });
            const message = document.getElementById('photo-review-message');
            if (message) message.textContent = '변경했습니다.';
        } catch {
            notice('변경 결과를 확인하지 못했습니다. 새로고침해 상태를 확인해 주세요.', true);
        } finally {
            buttons.forEach(node => node.disabled = false);
            document.documentElement.style.overflowAnchor = anchorStyle;
            busy = false;
        }
    });
})();
