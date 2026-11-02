// ============================================================================
// LOCK IN 2027 — js/modules/nutrition.js
// Plan posiłków, kreator, szejki masowe, zestawy Żabka/Biedronka.
// ============================================================================

import { $, escapeHtml, todayKey, vibrate, playSound } from "../core/utils.js";
import { FOOD_DB, FOOD_INGREDIENTS, STORE_MEALS } from "../core/constants.js";
import { loadMealPlan, saveMealPlan } from "../core/data.js";
import { state } from "../state.js";
import { showToast } from "../components/toast.js";
import { openModal } from "../components/modal.js";

const MEAL_NAMES = { breakfast: "Śniadanie", breakfast2: "2. Śniadanie", lunch: "Obiad", dinner: "Kolacja", snacks: "Przekąski" };
const MEAL_TABS = [
  { id: "breakfast", label: "🍳 Śniadanie" },
  { id: "lunch", label: "🍝 Obiad" },
  { id: "snack", label: "🥜 Przekąski" },
  { id: "dinner", label: "🥗 Kolacja" },
  { id: "shake", label: "🥤 Szejki" }
];

const SHAKES = [
  { name: "Klasyk Masowy", ingredients: ["300 ml mleka 3.2%", "40 g płatków owsianych", "1 banan", "2 łyżki masła orzechowego"], kcal: 700, prot: 24 },
  { name: "Czekoladowy Moc", ingredients: ["300 ml mleka", "40 g płatków", "1 łyżka kakao", "1 banan", "1 łyżka miodu"], kcal: 690, prot: 22 },
  { name: "Orzechowy Beast", ingredients: ["300 ml mleka", "30 g płatków", "2 łyżki masła orzechowego", "1 łyżka miodu"], kcal: 750, prot: 22 },
  { name: "Twarogowy Pro", ingredients: ["250 ml mleka", "150 g twarogu", "1 banan", "1 łyżka miodu"], kcal: 680, prot: 38 }
];

let _currentFoodTab = "breakfast";

function getDayTotals() {
  let kcal = 0, prot = 0;
  Object.keys(state.mealPlan).forEach(k => {
    (state.mealPlan[k] || []).forEach(it => { kcal += it.kcal; prot += it.prot; });
  });
  return { kcal, prot };
}

function getMealTotals(key) {
  const items = state.mealPlan[key] || [];
  return items.reduce((a, i) => ({ kcal: a.kcal + i.kcal, prot: a.prot + i.prot }), { kcal: 0, prot: 0 });
}

function renderSummary() {
  const t = getDayTotals();
  const el = $("nutrition-summary");
  if (!el) return;
  el.innerHTML = `
    <div class="grid-2">
      <div class="stat"><div class="stat-label">Kalorie</div><div class="stat-value accent">${t.kcal}</div></div>
      <div class="stat"><div class="stat-label">Białko</div><div class="stat-value">${t.prot}<span class="stat-unit">g</span></div></div>
    </div>
    <div class="mt-3">
      <div class="progress"><div class="progress-fill" style="width:${Math.min(100, Math.round((t.prot / 80) * 100))}%"></div></div>
      <div class="text-xs text-tertiary mt-2">${t.prot} g / 80 g białka dziennie</div>
    </div>
  `;
}

function renderFoodList() {
  const wrap = $("nutrition-food-list");
  if (!wrap) return;
  const items = FOOD_DB[_currentFoodTab] || [];
  wrap.innerHTML = items.map((f, i) => `
    <div class="card card-padded-sm">
      <div class="row-between">
        <div style="flex:1;min-width:0;">
          <div class="list-item-title">${escapeHtml(f.name)}</div>
          <div class="list-item-subtitle">${f.kcal} kcal · ${f.prot}g białka</div>
        </div>
        <button class="btn-icon btn-icon-sm" data-add-food="${_currentFoodTab}-${i}"><i class="fa-solid fa-plus"></i></button>
      </div>
    </div>
  `).join("");

  wrap.querySelectorAll("[data-add-food]").forEach(btn => {
    btn.addEventListener("click", () => {
      const [tab, idx] = btn.dataset.addFood.split("-");
      const f = FOOD_DB[tab][parseInt(idx)];
      const meal = tab === "breakfast" ? "breakfast" : tab === "lunch" ? "lunch" : tab === "snack" ? "snacks" : tab === "dinner" ? "dinner" : "breakfast";
      state.mealPlan[meal] = state.mealPlan[meal] || [];
      state.mealPlan[meal].push({ name: f.name, kcal: f.kcal, prot: f.prot });
      saveMealPlan(todayKey(), state.mealPlan);
      renderSummary();
      vibrate(15); playSound("done");
      showToast("✅ Dodano do " + MEAL_NAMES[meal], "success");
    });
  });
}

// --- Modal kreatora -----------------------------------------------------
function openMealCreator() {
  let activeMeal = "breakfast";
  let activeCat = "pieczywo";

  const body = document.createElement("div");
  body.innerHTML = `
    <div class="stack">
      <div class="tabs" id="meal-modal-tabs">
        ${Object.keys(MEAL_NAMES).map((k, i) => `<button class="tab ${i === 0 ? "active" : ""}" data-meal-tab="${k}">${MEAL_NAMES[k]}</button>`).join("")}
      </div>
      <div id="meal-modal-items" class="card card-padded-sm"></div>
      <div class="tabs" id="meal-modal-cats" style="flex-wrap:wrap;">
        ${Object.keys(FOOD_INGREDIENTS).map((k, i) => `<button class="tab ${i === 0 ? "active" : ""}" data-cat-tab="${k}">${k}</button>`).join("")}
      </div>
      <div id="meal-modal-ing" class="grid-2" style="max-height:260px;overflow-y:auto;"></div>
    </div>
  `;

  const refreshItems = () => {
    const items = state.mealPlan[activeMeal] || [];
    const el = body.querySelector("#meal-modal-items");
    if (!items.length) { el.innerHTML = `<div class="text-sm text-tertiary text-center" style="padding:12px;">Puste</div>`; return; }
    el.innerHTML = items.map((it, i) => `
      <div class="row-between" style="padding:6px 0;border-bottom:1px solid var(--border-subtle);">
        <div style="flex:1;min-width:0;">
          <div class="text-sm">${escapeHtml(it.name)}</div>
          <div class="text-xs text-tertiary">${it.kcal} kcal · ${it.prot}g</div>
        </div>
        <button class="btn-icon btn-icon-sm" data-remove-item="${i}"><i class="fa-solid fa-xmark"></i></button>
      </div>
    `).join("");
    el.querySelectorAll("[data-remove-item]").forEach(b => {
      b.addEventListener("click", () => {
        state.mealPlan[activeMeal].splice(parseInt(b.dataset.removeItem), 1);
        saveMealPlan(todayKey(), state.mealPlan);
        refreshItems(); renderSummary();
      });
    });
  };

  const refreshIng = () => {
    const el = body.querySelector("#meal-modal-ing");
    const items = FOOD_INGREDIENTS[activeCat] || [];
    el.innerHTML = items.map((it, i) => `
      <button class="card card-padded-sm" data-add-ing="${i}" style="text-align:left;padding:8px;">
        <div class="text-xs font-bold">${escapeHtml(it.name)}</div>
        <div class="text-xs text-tertiary mt-1">${it.kcal} kcal · ${it.prot}g</div>
      </button>
    `).join("");
    el.querySelectorAll("[data-add-ing]").forEach(b => {
      b.addEventListener("click", () => {
        const it = FOOD_INGREDIENTS[activeCat][parseInt(b.dataset.addIng)];
        state.mealPlan[activeMeal] = state.mealPlan[activeMeal] || [];
        state.mealPlan[activeMeal].push({ name: it.name, kcal: it.kcal, prot: it.prot });
        saveMealPlan(todayKey(), state.mealPlan);
        refreshItems(); renderSummary();
        vibrate(15); playSound("done");
      });
    });
  };

  body.querySelectorAll("[data-meal-tab]").forEach(t => {
    t.addEventListener("click", () => {
      body.querySelectorAll("[data-meal-tab]").forEach(x => x.classList.remove("active"));
      t.classList.add("active");
      activeMeal = t.dataset.mealTab;
      refreshItems();
    });
  });
  body.querySelectorAll("[data-cat-tab]").forEach(t => {
    t.addEventListener("click", () => {
      body.querySelectorAll("[data-cat-tab]").forEach(x => x.classList.remove("active"));
      t.classList.add("active");
      activeCat = t.dataset.catTab;
      refreshIng();
    });
  });

  refreshItems();
  refreshIng();

  openModal({
    title: "🍽️ Kreator posiłku",
    body,
    actions: [{ label: "Gotowe", variant: "primary" }]
  });
}

// --- Render -------------------------------------------------------------
export async function render(container) {
  state.mealPlan = loadMealPlan(todayKey());

  container.innerHTML = `
    <div class="stack-lg">

      <div id="nutrition-summary" class="card"></div>

      <div class="card">
        <div class="card-header">
          <div class="card-title">🥤 Mass Shake 700 kcal</div>
          <button class="btn btn-sm btn-secondary" id="btn-roll-shake"><i class="fa-solid fa-rotate"></i> Losuj</button>
        </div>
        <div id="shake-result" class="text-sm text-tertiary">Kliknij "Losuj" — szejk masowy ≈ 700 kcal.</div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title">🛒 Zestawy sklepowe</div>
          <button class="btn btn-sm btn-secondary" id="btn-show-store"><i class="fa-solid fa-eye"></i> Pokaż</button>
        </div>
        <div id="store-list" class="stack-sm hidden"></div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title">🍽️ Kreator posiłków</div>
          <button class="btn btn-sm btn-primary" id="btn-open-creator"><i class="fa-solid fa-plus"></i> Otwórz</button>
        </div>
        <p class="text-sm text-tertiary">Dodaj produkty, sumuj kalorie i białko.</p>
      </div>

      <div>
        <div class="tabs">
          ${MEAL_TABS.map((t, i) => `<button class="tab ${i === 0 ? "active" : ""}" data-food-tab="${t.id}">${t.label}</button>`).join("")}
        </div>
      </div>

      <div id="nutrition-food-list" class="stack-sm"></div>

      <div class="card">
        <div class="card-header"><div class="card-title">💡 Zasady</div></div>
        <ul class="text-sm text-secondary" style="line-height:1.7;padding-left:20px;">
          <li>Cel: <strong class="text-accent">2800-3000 kcal</strong></li>
          <li>Białko: <strong class="text-accent">~80 g</strong></li>
          <li>Szejk masowy po szkole = game changer</li>
          <li>Zero cukru po 18:00</li>
          <li>Twaróg przed snem — kazeina</li>
        </ul>
      </div>

    </div>
  `;

  renderSummary();
  renderFoodList();

  container.querySelectorAll("[data-food-tab]").forEach(t => {
    t.addEventListener("click", () => {
      container.querySelectorAll("[data-food-tab]").forEach(x => x.classList.remove("active"));
      t.classList.add("active");
      _currentFoodTab = t.dataset.foodTab;
      renderFoodList();
    });
  });

  $("btn-roll-shake")?.addEventListener("click", () => {
    const s = SHAKES[Math.floor(Math.random() * SHAKES.length)];
    const el = $("shake-result");
    el.innerHTML = `
      <div class="font-bold text-accent mb-2">🥤 ${escapeHtml(s.name)}</div>
      <div class="stack-sm" style="margin-bottom:8px;">
        ${s.ingredients.map(i => `<div class="text-sm text-secondary">• ${escapeHtml(i)}</div>`).join("")}
      </div>
      <div class="row" style="gap:12px;">
        <span class="badge badge-accent">≈ ${s.kcal} kcal</span>
        <span class="badge badge-info">≈ ${s.prot}g białka</span>
      </div>
    `;
    vibrate(30); playSound("done");
  });

  $("btn-show-store")?.addEventListener("click", () => {
    const el = $("store-list");
    el.classList.toggle("hidden");
    if (!el.innerHTML.trim()) {
      el.innerHTML = STORE_MEALS.map(s => `
        <div class="card card-padded-sm">
          <div class="row-between mb-2">
            <span class="font-bold text-accent" style="font-size:13px;">${escapeHtml(s.name)}</span>
            <span class="badge badge-info">${s.kcal} kcal · ${s.prot}g</span>
          </div>
          ${s.items.map(i => `<div class="text-sm text-secondary">• ${escapeHtml(i)}</div>`).join("")}
        </div>
      `).join("");
    }
  });

  $("btn-open-creator")?.addEventListener("click", openMealCreator);
}
