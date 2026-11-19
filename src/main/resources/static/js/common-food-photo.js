import { api, element } from './food-studio-core.js';
export async function mountPhoto(record, body) {
    body.dataset.photoFoodId = record.id;
    try {
        const photo = await api('/api/foods/photo', { foodId: record.id, discover: true });
        if (!photo || body.dataset.photoFoodId !== record.id || !body.isConnected) return;
        const imageUrl = new URL(photo.image, location.origin);
        const sourceUrl = new URL(photo.source);
        const local = imageUrl.origin === location.origin && imageUrl.pathname.startsWith('/photos/catalog/');
        if ((!local && (imageUrl.protocol !== 'https:' || !['upload.wikimedia.org', 'thumb.wikimedia.org',
                'api.openverse.org', 'www.foodsafetykorea.go.kr', 'tong.visitkorea.or.kr'].includes(imageUrl.hostname)))
                || sourceUrl.protocol !== 'https:') return;
        body.querySelector('.common-food-photo')?.remove();
        const figure = element('figure', undefined, 'common-food-photo');
        const image = element('img');
        Object.assign(image, { src: photo.image, alt: `${record.name} 참고 사진`, loading: 'lazy', referrerPolicy: 'no-referrer' });
        image.addEventListener('error', () => figure.remove());
        const caption = element('figcaption', `${record.name} · 참고 사진`);
        const source = element('a', `${photo.title || record.name} · ${photo.author} · ${photo.provider || "Wikimedia Commons"}`);
        source.href = photo.source; source.rel = 'noreferrer';
        const license = element('a', photo.license);
        license.href = photo.licenseUrl; license.rel = 'noreferrer';
        caption.append(element('br'), source, document.createTextNode(' · '), license);
        figure.append(image, caption); body.prepend(figure);
    } catch { /* Food selection remains available while a photo is being prepared. */ }
}
