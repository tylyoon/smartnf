(() => {
    const form = document.querySelector("#recipe-comparison");
    const status = document.querySelector("#comparison-status");
    const result = document.querySelector("#comparison-result");
    const sources = document.querySelector("#comparison-sources");
    const current = document.querySelector("#comparison-current");
    const currentGrams = document.querySelector("#comparison-current-grams");
    const riceGrams = document.querySelector("#comparison-rice-grams");
    const currentIds = [
        "mfds_dishes:D306-266000000-0001",
        "mfds_dishes:D106-266100000-0001",
        "mfds_dishes:D106-266250000-0001"
    ];
    const ingredientIds = [
        "rda_10_4:F2050070009a", "rda_10_4:I014000F110a",
        "rda_10_4:D0150000009a", "rda_10_4:F1910040000a",
        "rda_10_4:F053000B060a", "rda_10_4:R0070000005a",
        "rda_10_4:N0200000009a", "rda_10_4:C0110020009a",
        "rda_10_4:R0010030009a", "rda_10_4:R0010010009a",
        "rda_10_4:P0130000009a", "rda_10_4:F1320000000a",
        "rda_10_4:I014000D210a", "rda_10_4:R0200020009a"
    ];
    const riceId = "rda_10_4:A013000A039a";
    const nutrientNames = { energy: "열량 (kcal)", protein: "단백질 (g)", sodium: "나트륨 (mg)" };
    const byId = id => document.getElementById(id);
    const health = (path, body) => window.SmartNFHealthAPI.request(path, body);
    const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(new Date());
    const plan = byId("comparison-plan");
    const planDate = byId("comparison-plan-date");
    const planMeal = byId("comparison-plan-meal");
    const planStatus = byId("comparison-plan-status");
    const planLink = byId("comparison-plan-link");
    const planButton = plan.querySelector("button");
    const fields = byId("comparison-fields");
    const recordDate = byId("comparison-record-date");
    const recordLoad = byId("comparison-record-load");
    const recordChoice = byId("comparison-record-choice");
    const record = byId("comparison-record");
    const recordStatus = byId("comparison-record-status");
    const formatter = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 1 });

    function selectOptions(select, ids, catalog, placeholder) {
        select.add(new Option(placeholder, ""));
        for (const id of ids) {
            const food = catalog.get(id);
            if (food) select.add(new Option(food.name.replaceAll("_", " · "), id));
        }
    }

    function ingredientRow(ingredient, catalog) {
        const row = document.createElement("div");
        row.className = "ui-fields recipe-comparison-row";
        const referenceLabel = document.createElement("label");
        referenceLabel.textContent = ingredient + " · DB 항목";
        const select = document.createElement("select");
        selectOptions(select, ingredientIds, catalog, "확인하지 않음");
        referenceLabel.append(select);
        const gramsLabel = document.createElement("label");
        gramsLabel.textContent = "레시피 전체 분량 (g)";
        const grams = document.createElement("input");
        Object.assign(grams, { type: "number", min: "0.01", max: "5000", step: "0.01" });
        const explicitGrams = ingredient.match(/(?:^|[^\d./])([0-9]+(?:\.[0-9]+)?)\s*g(?:\s|$)/i);
        if (explicitGrams) {
            grams.value = explicitGrams[1];
            gramsLabel.firstChild.textContent += " · AI 제안";
        }
        gramsLabel.append(grams);
        row.append(referenceLabel, gramsLabel);
        document.querySelector("#comparison-ingredients").append(row);
        return { select, grams };
    }

    function planInput(entry) {
        return {
            type: entry.type, scope: entry.scope, management: entry.management,
            restaurant: entry.restaurant, time: entry.time, note: entry.note,
            items: entry.items.map(food => ({
                foodId: food.foodId, recipeId: food.recipeId, recipeVersion: food.recipeVersion,
                ingredientIndices: food.ingredients.map(item => item.index)
            }))
        };
    }

    function wireRecordPicker(catalog) {
        recordDate.addEventListener("input", () => {
            recordChoice.hidden = true;
            record.replaceChildren();
        });
        recordLoad.addEventListener("click", async () => {
            const date = recordDate.value;
            if (!date) {
                recordStatus.textContent = "조회할 날짜를 선택해 주세요.";
                return;
            }
            recordLoad.disabled = true;
            recordChoice.hidden = true;
            recordStatus.textContent = "식사 기록을 불러오는 중입니다.";
            try {
                const day = await health("/meals/day?date=" + encodeURIComponent(date));
                if (date !== recordDate.value) return;
                record.replaceChildren(new Option("음식 선택", ""));
                const labels = { breakfast: "아침", lunch: "점심", dinner: "저녁", snack: "간식" };
                for (const item of day.items.filter(item => item.name.replace(/\s/g, "").includes("김치찌개"))) {
                    record.add(new Option(`${labels[item.meal] || "식사"} · ${item.name}`, item.name));
                }
                recordChoice.hidden = record.options.length === 1;
                recordStatus.textContent = recordChoice.hidden ? "이 날짜에 김치찌개 기록이 없습니다."
                    : "음식을 선택한 다음 DB 항목과 실제 먹은 무게를 확인해 주세요.";
            } catch (error) {
                if (date === recordDate.value) recordStatus.textContent = error.message;
            } finally {
                recordLoad.disabled = false;
            }
        });
        record.addEventListener("change", () => {
            if (!record.value) return;
            const normalized = name => name.replace(/[\s_·()]/g, "");
            const match = currentIds.find(id => catalog.has(id)
                && normalized(catalog.get(id).name) === normalized(record.value));
            current.value = match || "";
            currentGrams.value = "";
            current.dispatchEvent(new Event("input", { bubbles: true }));
            recordStatus.textContent = `선택한 기록 · ${record.value}. DB 항목과 먹은 무게를 확인해 주세요.`;
        });
    }

    async function load() {
        let recipe;
        try {
            const key = "smartnf.recipe-comparison";
            const draft = JSON.parse(sessionStorage.getItem(key));
            sessionStorage.removeItem(key);
            const account = document.querySelector("header[data-account-key]")?.dataset.accountKey;
            if (account && account !== "anonymous" && draft?.account === account) recipe = draft.recipe;
        } catch {
            status.textContent = "비교할 레시피를 불러오지 못했습니다. 추천 화면에서 다시 선택해 주세요.";
            return;
        }
        if (!recipe || typeof recipe.name !== "string" || !Number.isInteger(recipe.servings)
                || recipe.servings < 1 || recipe.servings > 24 || !Array.isArray(recipe.ingredients)
                || !recipe.ingredients.length || recipe.ingredients.length > 25
                || !recipe.ingredients.every(item => typeof item === "string")) {
            status.textContent = "AI 레시피를 생성한 뒤 결과 카드에서 ‘내 식사와 비교하기’를 눌러 주세요.";
            return;
        }
        status.textContent = "영양성분 자료를 불러오는 중입니다.";
        const response = await fetch("/js/data/food-nutrition/meal-references.tsv");
        if (!response.ok) throw new Error("Missing nutrition data");
        const wanted = new Set([...currentIds, ...ingredientIds, riceId]);
        const catalog = new Map();
        for (const line of (await response.text()).split(/\r?\n/)) {
            const [id, name, version, source, basis] = line.split("\t");
            if (wanted.has(id) && /^100g(?: |$)/.test(basis)) {
                catalog.set(id, { name, version, source });
            }
        }
        if (!currentIds.some(id => catalog.has(id)) || !catalog.has(riceId)) {
            throw new Error("Missing reference entries");
        }
        selectOptions(current, currentIds, catalog, "현재 식사의 김치찌개 종류 선택");
        document.querySelector("#comparison-recipe-name").textContent = recipe.name + " · " + recipe.servings + "인분 레시피";
        const rows = recipe.ingredients.map(ingredient => ingredientRow(ingredient, catalog));
        status.textContent = "김치찌개 한 끼 비교용입니다. 현재 음식과 재료별 DB 항목을 직접 확인해 주세요.";
        form.hidden = false;

        planDate.value = today;
        recordDate.value = today;
        wireRecordPicker(catalog);
        let compared = null;
        let pending = null;
        form.addEventListener("input", event => {
            if (event.target === recordDate || event.target === record) return;
            compared = null;
            result.hidden = sources.hidden = plan.hidden = true;
        });
        form.addEventListener("submit", async event => {
            event.preventDefault();
            if (fields.disabled) return;
            compared = null;
            result.hidden = sources.hidden = plan.hidden = true;
            planStatus.textContent = "";
            planLink.hidden = true;
            const ingredients = rows.map(({ select, grams }) => select.value && grams.valueAsNumber > 0
                ? { foodId: select.value, grams: grams.valueAsNumber } : null);
            const request = {
                current: { foodId: current.value, grams: currentGrams.valueAsNumber },
                riceGrams: riceGrams.valueAsNumber,
                servings: recipe.servings,
                ingredients
            };
            fields.disabled = true;
            status.textContent = "공공 영양성분 자료로 계산하고 있습니다.";
            try {
                const headers = { "Content-Type": "application/json", Accept: "application/json" };
                const csrfHeader = document.querySelector('meta[name="_csrf_header"]').content;
                headers[csrfHeader] = document.querySelector('meta[name="_csrf"]').content;
                const response = await fetch("/api/recipes/compare-nutrition", {
                    method: "POST", headers, body: JSON.stringify(request), signal: AbortSignal.timeout(15000)
                });
                if (response.redirected || response.status === 401 || response.status === 403) {
                    throw new Error("로그인 상태를 확인하고 화면을 새로고침해 주세요.");
                }
                if (!response.ok) throw new Error("선택한 식품과 분량을 확인해 주세요.");
                const nutrients = await response.json();
                const table = byId("comparison-values");
                table.replaceChildren();
                for (const { key, current, suggested, difference } of nutrients) {
                    const row = table.insertRow();
                    const heading = document.createElement("th");
                    heading.scope = "row";
                    heading.textContent = nutrientNames[key];
                    row.append(heading);
                    row.insertCell().textContent = current == null ? "자료 부족" : formatter.format(current);
                    row.insertCell().textContent = suggested == null ? "자료 부족" : formatter.format(suggested);
                    row.insertCell().textContent = difference == null ? "—"
                        : (difference > 0 ? "+" : "") + formatter.format(difference);
                }
                const refs = [request.current.foodId, ...ingredients.filter(Boolean).map(item => item.foodId)];
                if (request.riceGrams > 0) refs.push(riceId);
                const labels = new Set(refs.map(id => {
                    const food = catalog.get(id);
                    return food.source + " · " + food.version;
                }));
                sources.textContent = "자료 출처 · " + [...labels].join(" / ");
                sources.hidden = result.hidden = false;
                const missing = ingredients.filter(item => item === null).length;
                status.textContent = missing ? `재료 ${missing}개의 DB 항목 또는 무게를 확인해 주세요.`
                    : "확인한 분량으로 1인분을 계산했습니다.";
                if (!missing) {
                    compared = request;
                    plan.hidden = false;
                    planButton.disabled = false;
                }
            } catch (error) {
                status.textContent = error.name === "TimeoutError" ? "계산 응답 시간이 초과되었습니다." : error.message;
            } finally {
                fields.disabled = false;
            }
        });
        plan.addEventListener("submit", async event => {
            event.preventDefault();
            if (!compared || planButton.disabled) return;
            planButton.disabled = fields.disabled = planDate.disabled = planMeal.disabled = true;
            planStatus.textContent = "MyPage 식사 계획을 확인하고 있습니다.";
            let saved = false;
            try {
                if (!pending) {
                    const consent = await health("/plans/consent");
                    if (!consent.agreed) {
                        planStatus.textContent = "MyPage에서 식사 계획 저장에 동의한 뒤 다시 눌러 주세요.";
                        planLink.href = "/mypage/plans";
                        planLink.hidden = false;
                        return;
                    }
                    const date = planDate.value;
                    const day = await health("/plans/day?date=" + encodeURIComponent(date));
                    const weights = new Map();
                    for (const { foodId, grams } of compared.ingredients) {
                        weights.set(foodId, (weights.get(foodId) || 0) + grams / compared.servings);
                    }
                    if (compared.riceGrams > 0) {
                        weights.set(riceId, (weights.get(riceId) || 0) + compared.riceGrams);
                    }
                    const weightFormatter = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 4, useGrouping: false });
                    const grams = [...weights].map(([id, value]) =>
                        `${catalog.get(id).name} ${weightFormatter.format(value)}g`);
                    const note = `AI 식사 계획 · ${planMeal.value} · ${recipe.name} · 1인분\n${grams.join(" / ")}`;
                    if (note.length > 500) throw new Error("계획 메모가 너무 깁니다. 재료 수가 적은 레시피를 골라 주세요.");
                    pending = {
                        requestId: crypto.randomUUID(), date, expectedRevision: day.revision,
                        consentEventId: consent.eventId,
                        plans: [...day.plans.map(planInput), {
                            type: "CHOICE", scope: "GENERAL", management: [], note,
                            items: [...weights.keys()].map(foodId => ({ foodId, ingredientIndices: [] }))
                        }]
                    };
                }
                await health("/plans", pending);
                planStatus.textContent = `${pending.date} 식사 계획에 저장했습니다. MyPage에서 해당 날짜를 조회하세요.`;
                pending = null;
                saved = true;
                planLink.href = "/mypage/plans";
                planLink.hidden = false;
            } catch (error) {
                if (error.status >= 400 && error.status < 500) pending = null;
                planStatus.textContent = error.message + (pending
                    ? " 같은 계획으로 다시 눌러 저장 결과를 확인하세요."
                    : error.status === 409 ? " MyPage 계획을 확인한 뒤 다시 저장해 주세요." : "");
            } finally {
                fields.disabled = planDate.disabled = planMeal.disabled = Boolean(pending);
                planButton.disabled = saved;
            }
        });
    }

    load().catch(() => {
        status.textContent = "영양성분 자료를 불러오지 못했습니다. 잠시 후 다시 비교해 주세요.";
    });
})();
