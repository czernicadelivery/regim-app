// ============================================================================
// LOCK IN 2027 — js/core/nutrition-data.js
// CRUD: przepisy własne, lista zakupów, nawodnienie.
// Wszystko lokalnie (localStorage).
// ============================================================================

import { localKey } from "./storage.js";
import { dateKey } from "./utils.js";

// ============================================================================
// PRZEPISY WŁASNE
// ============================================================================

export function loadMyRecipes() {
  try {
    const raw = localStorage.getItem(localKey("my-recipes"));
    return raw ? JSON.parse(raw) || [] : [];
  } catch (e) { return []; }
}

export function saveMyRecipes(recipes) {
  localStorage.setItem(localKey("my-recipes"), JSON.stringify(recipes));
}

export function addMyRecipe(recipe) {
  const list = loadMyRecipes();
  list.unshift({ ...recipe, id: "r-" + Date.now(), createdAt: Date.now() });
  saveMyRecipes(list);
  return list[0];
}

export function deleteMyRecipe(id) {
  const list = loadMyRecipes().filter(r => r.id !== id);
  saveMyRecipes(list);
  return list;
}

// ============================================================================
// LISTA ZAKUPÓW
// ============================================================================

export function loadShoppingList() {
  try {
    const raw = localStorage.getItem(localKey("shopping-list"));
    return raw ? JSON.parse(raw) || [] : [];
  } catch (e) { return []; }
}

export function saveShoppingList(items) {
  localStorage.setItem(localKey("shopping-list"), JSON.stringify(items));
}

export function addShoppingItem(name, qty = "", source = "manual") {
  const list = loadShoppingList();
  list.unshift({ id: "sh-" + Date.now(), name, qty, source, checked: false, createdAt: Date.now() });
  saveShoppingList(list);
  return list[0];
}

export function toggleShoppingItem(id) {
  const list = loadShoppingList();
  const item = list.find(i => i.id === id);
  if (item) item.checked = !item.checked;
  saveShoppingList(list);
  return list;
}

export function deleteShoppingItem(id) {
  const list = loadShoppingList().filter(i => i.id !== id);
  saveShoppingList(list);
  return list;
}

export function clearCheckedShopping() {
  const list = loadShoppingList().filter(i => !i.checked);
  saveShoppingList(list);
  return list;
}

// ============================================================================
// NAWODNIENIE
// ============================================================================

export function loadWaterGoal() {
  try {
    const raw = localStorage.getItem(localKey("water-goal"));
    return raw ? parseInt(raw) : 2000;
  } catch (e) { return 2000; }
}

export function saveWaterGoal(ml) {
  localStorage.setItem(localKey("water-goal"), String(ml));
}

export function loadWaterToday() {
  try {
    const today = dateKey(new Date());
    const raw = localStorage.getItem(localKey("water-" + today));
    return raw ? parseInt(raw) || 0 : 0;
  } catch (e) { return 0; }
}

export function addWater(ml) {
  const today = dateKey(new Date());
  const current = loadWaterToday();
  const newValue = Math.max(0, current + ml);
  localStorage.setItem(localKey("water-" + today), String(newValue));
  return newValue;
}

export function resetWaterToday() {
  const today = dateKey(new Date());
  localStorage.setItem(localKey("water-" + today), "0");
  return 0;
}
