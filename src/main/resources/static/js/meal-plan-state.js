export const copyParts = parts => structuredClone(parts);
export const slotKey = slot => `${slot.date}:${slot.meal}`;
export function buildSlots(first, days, meals, indices, previous, addDays) {
    if (indices.length !== days * meals.length) throw new Error('추천 끼니 수를 확인하지 못했습니다.');
    const locked = new Map(previous.filter(slot => slot.locked).map(slot => [slotKey(slot), slot]));
    const slots = [];
    for (let day = 0; day < days; day++) meals.forEach((meal, index) => {
        const slot = { date: addDays(first, day), meal, recipe: indices[day * meals.length + index], custom: null, locked: false };
        slots.push(locked.has(slotKey(slot)) ? structuredClone(locked.get(slotKey(slot))) : slot);
    });
    return slots;
}
export function replaceSlot(slot, parts) {
    if (!parts.length) throw new Error('한 끼에 먹을 음식을 먼저 담아 주세요.');
    if (!slot.original) slot.original = { recipe: slot.recipe, custom: slot.custom ? copyParts(slot.custom) : null };
    slot.custom = copyParts(parts); slot.locked = true;
}
export function slotParts(slot, recipeParts) { return slot.custom ? copyParts(slot.custom) : slot.recommended ? copyParts(slot.recommended) : slot.recipe == null ? [] : recipeParts(slot.recipe); }
export function estimate(parts, catalog, keys) {
    const items = parts.flatMap(part => part.ingredients);
    const coverage = {}, values = {}, aiCoverage = {};
    for (const key of keys) {
        let count = 0, sum = 0, aiCount=0;
        for (const item of items) {
            const value = catalog.get(item.foodId)?.nutrients[key];
            if (Number.isFinite(value) && Number.isFinite(item.grams) && item.grams > 0 && item.grams <= 50000) { count++; sum += value * item.grams / 100;if(catalog.get(item.foodId)?.aiKeys?.includes(key))aiCount++; }
        }
        coverage[key] = count;aiCoverage[key]=aiCount; values[key] = count ? sum : null;
    }
    return { values, coverage, aiCoverage, total: items.length };
}
export function mergeOwnedPlans(existing, additions) {
    const tags = additions.map(plan => plan.note.match(/^\[식단 계획 · (?:아침|점심|저녁|간식)\]/)?.[0]).filter(Boolean);
    return [...existing.filter(plan => !tags.some(tag => plan.note?.startsWith(tag))), ...additions];
}
