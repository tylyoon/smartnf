(() => {
    const images = document.querySelectorAll("[data-recipe-commons-photo]");
    const token = document.querySelector('meta[name="_csrf"]')?.content;
    const header = document.querySelector('meta[name="_csrf_header"]')?.content;
    if (!images.length || !token || !header) return;

    const requests = new Map();
    async function loadPhoto(name) {
        try {
            const response = await fetch("/api/recipes/commons-photo", {
                method: "POST",
                headers: { "Content-Type": "application/json", [header]: token },
                body: JSON.stringify({ name, discover: false })
            });
            if (response.ok && response.status !== 204 && !response.redirected) {
                return await response.json();
            }
        } catch {
            // A saved recipe remains readable without its photo.
        }
    }

    async function showPhoto(image) {
        const name = image.dataset.dishName;
        const key = name.normalize("NFKC").replace(/\s+/g, "").replace(/[.!。]+$/, "");
        if (!requests.has(key)) requests.set(key, loadPhoto(name));
        const photo = await requests.get(key);
        if (!photo) return;

        const credit = image.closest(".recipe-saved").querySelector("[data-recipe-photo-credit]");
        const source = credit.querySelector("[data-recipe-photo-source]");
        source.href = photo.source;
        source.textContent = `${photo.title || name} · ${photo.author} · ${photo.provider || "Wikimedia Commons"}`;
        const license = credit.querySelector("[data-recipe-photo-license]");
        license.href = photo.licenseUrl;
        license.textContent = photo.license;
        image.addEventListener("load", () => {
            image.hidden = false;
            credit.hidden = false;
        }, { once: true });
        image.src = photo.image;
    }

    const observer = new IntersectionObserver(entries => {
        for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            observer.unobserve(entry.target);
            showPhoto(entry.target.querySelector("[data-recipe-commons-photo]"));
        }
    }, { rootMargin: "200px" });
    images.forEach(image => observer.observe(image.closest(".recipe-saved")));
})();
