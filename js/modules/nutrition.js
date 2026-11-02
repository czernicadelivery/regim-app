// ============================================================================
// LOCK IN 2027 — js/modules/nutrition.js
// Nutrition Studio: posiłki, przepisy, lista zakupów, nawodnienie, szejki.
// ============================================================================

import { $, escapeHtml, todayKey, dateKey } from "../core/utils.js";
import { FOOD_DB, FOOD_INGREDIENTS, STORE_MEALS } from "../core/constants.js";
import { loadMealPlan, saveMealPlan } from "../core/data.js";
import {
  loadMyRecipes, addMyRecipe, deleteMyRecipe,
  loadShoppingList, addShoppingItem, toggleShoppingItem,
  deleteShoppingItem, clearCheckedShopping,
  loadWaterGoal, saveWaterGoal, loadWaterToday, addWater, resetWaterToday
} from "../core/nutrition-data.js";
import { RECIPES_CATALOG, RECIPE_CATEGORIES, WATER_GOALS, WATER_UNITS, getRecipe, getRecipeCategory } from "../core/nutrition-catalog.js";
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

let _activeTab = "meals"; // meals | recipes | shopping | water
let _currentFoodTab = "breakfast";

// ============================================================================
// HELPERS
// ============================================================================

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

// ============================================================================
// RENDER GŁÓWNY
// ============================================================================

export async function render(container) {
  state.mealPlan = loadMealPlan(todayKey());

  container.innerHTML = `
    <div class="stack-lg">
      <div class="card card-accent">
        <div class="row-between">
          <div>
            <div class="card-subtitle">NUTRITION STUDIO</div>
            <div class="card-title" style="margin-top:4px;">Jedzenie · Przepisy · Woda</div>
          </div>
          <div style="font-size:32px;">🍽️</div>
        </div>
        <div id="nutrition-summary" class="mt-3"></div>
      </div>

      <div class="tabs" id="nut-tabs">
        <button class="tab ${_activeTab === "meals" ? "active" : ""}" data-tab="meals">🍽️ Posiłki</button>
        <button class="tab ${_activeTab === "recipes" ? "active" : ""}" data-tab="recipes">📖 Przepisy</button>
        <button class="tab ${_activeTab === "shopping" ? "active" : ""}" data-tab="shopping">🛒 Zakupy</button>
        <button class="tab ${_activeTab === "water" ? "active" : ""}" data-tab="water">💧 Woda</button>
      </div>

      <div id="nut-content"></div>
    </div>
  `;

  renderSummary();
  renderContent(container);
  bindEvents(container);
}

function renderContent(container) {
  const content = container.querySelector("#nut-content");
  if (!content) return;

  if (_activeTab === "meals") content.innerHTML = renderMealsTab();
  else if (_activeTab === "recipes") content.innerHTML = renderRecipesTab();
  else if (_activeTab === "shopping") content.innerHTML = renderShoppingTab();
  else if (_activeTab === "water") content.innerHTML = renderWaterTab();

  bindTabEvents(container);
}

function renderSummary() {
  const el = $("nutrition-summary");
  if (!el) return;
  const t = getDayTotals();
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

// ============================================================================
// TAB: POSIŁKI
// ============================================================================

function renderMealsTab() {
  return `
    <div class="card mb-3">
      <div class="card-header">
        <div class="card-title">🥤 Mass Shake 700 kcal</div>
        <button class="btn btn-sm btn-secondary" id="btn-roll-shake"><i class="fa-solid fa-rotate"></i> Losuj</button>
      </div>
      <div id="shake-result" class="text-sm text-tertiary">Kliknij "Losuj" — szejk masowy ≈ 700 kcal.</div>
    </div>

    <div class="card mb-3">
      <div class="card-header">
        <div class="card-title">🛒 Zestawy sklepowe</div>
        <button class="btn btn-sm btn-secondary" id="btn-show-store"><i class="fa-solid fa-eye"></i> Pokaż</button>
      </div>
      <div id="store-list" class="stack-sm hidden"></div>
    </div>

    <div class="card mb-3">
      <div class="card-header">
        <div class="card-title">🍽️ Kreator posiłków</div>
        <button class="btn btn-sm btn-primary" id="btn-open-creator"><i class="fa-solid fa-plus"></i> Otwórz</button>
      </div>
      <p class="text-sm text-tertiary">Dodaj produkty, sumuj kalorie i białko.</p>
    </div>

    <div class="tabs mb-3">
      ${MEAL_TABS.map((t, i) => `<button class="tab ${i === 0 ? "active" : ""}" data-food-tab="${t.id}">${t.label}</button>`).join("")}
    </div>

    <div id="nutrition-food-list" class="stack-sm"></div>

    <div class="card mt-3">
      <div class="card-header"><div class="card-title">💡 Zasady</div></div>
      <ul class="text-sm text-secondary" style="line-height:1.7;padding-left:20px;">
        <li>Cel: <strong class="text-accent">2800-3000 kcal</strong></li>
        <li>Białko: <strong class="text-accent">~80 g</strong></li>
        <li>Szejk masowy po szkole = game changer</li>
        <li>Zero cukru po 18:00</li>
        <li>Twaróg przed snem — kazeina</li>
      </ul>
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
      showToast("✅ Dodano do " + MEAL_NAMES[meal], "success");
    });
  });
}

// ============================================================================
// TAB: PRZEPISY
// ============================================================================

function renderRecipesTab() {
  const myRecipes = loadMyRecipes();
  const allRecipes = [...myRecipes, ...RECIPES_CATALOG];

  return `
    <div class="row mb-3" style="gap:8px;">
      <button class="btn btn-primary" id="btn-add-recipe" style="flex:1;">
        <i class="fa-solid fa-plus"></i> Własny przepis
      </button>
    </div>

    <div class="stack-sm">
      ${allRecipes.map(r => renderRecipeCard(r)).join("")}
    </div>
  `;
}

function renderRecipeCard(r) {
  const cat = getRecipeCategory(r.category);
  return `
    <div class="card card-padded-sm">
      <div class="row-between">
        <div style="flex:1;min-width:0;">
          <div class="row" style="gap:6px;flex-wrap:wrap;margin-bottom:4px;">
            <span class="text-sm font-bold">${escapeHtml(r.name)}</span>
            ${cat ? `<span class="badge badge-neutral" style="font-size:9px;">${cat.icon} ${cat.name}</span>` : ""}
          </div>
          <div class="text-xs text-tertiary">
            ${r.kcal} kcal · ${r.prot}g białka${r.time ? " · " + escapeHtml(r.time) : ""}
          </div>
        </div>
        <button class="btn-icon btn-icon-sm" data-info-recipe="${r.id}"><i class="fa-solid fa-circle-info"></i></button>
      </div>
    </div>
  `;
}

function openRecipeModal(recipeId) {
  let recipe = getRecipe(recipeId);
  if (!recipe) {
    const my = loadMyRecipes().find(r => r.id === recipeId);
    if (my) recipe = my;
  }
  if (!recipe) return;

  const cat = getRecipeCategory(recipe.category);

  const body = document.createElement("div");
  body.innerHTML = `
    <div class="stack">
      <div class="row" style="gap:6px;flex-wrap:wrap;">
        ${cat ? `<span class="badge badge-accent">${cat.icon} ${cat.name}</span>` : ""}
        <span class="badge badge-neutral">${recipe.kcal} kcal</span>
        <span class="badge badge-neutral">${recipe.prot}g białka</span>
        ${recipe.time ? `<span class="badge badge-info">⏱ ${escapeHtml(recipe.time)}</span>` : ""}
      </div>

      <div>
        <div class="text-xs text-tertiary uppercase font-bold mb-1">Składniki</div>
        <ul class="text-sm text-secondary" style="padding-left:20px;line-height:1.6;">
          ${recipe.ingredients.map(i => `<li>${escapeHtml(i)}</li>`).join("")}
        </ul>
      </div>

      <div>
        <div class="text-xs text-tertiary uppercase font-bold mb-1">Przygotowanie</div>
        <ol class="text-sm text-secondary" style="padding-left:20px;line-height:1.6;">
          ${recipe.steps.map(s => `<li>${escapeHtml(s)}</li>`).join("")}
        </ol>
      </div>
    </div>
  `;

  openModal({
    title: recipe.name,
    body,
    actions: [
      { label: "Zamknij", variant: "ghost" },
      {
        label: "Dodaj do zakupów",
        variant: "secondary",
        onClick: () => {
          recipe.ingredients.forEach(ing => addShoppingItem(ing, "", recipe.name));
          showToast("✅ Dodano do listy zakupów", "success");
        },
        close: false
      },
      {
        label: "Dodaj do posiłku",
        variant: "primary",
        onClick: () => {
          state.mealPlan.breakfast = state.mealPlan.breakfast || [];
          state.mealPlan.breakfast.push({ name: recipe.name, kcal: recipe.kcal, prot: recipe.prot });
          saveMealPlan(todayKey(), state.mealPlan);
          renderSummary();
          showToast("✅ Dodano do śniadania", "success");
        }
      }
    ]
  });
}

function openAddRecipeModal() {
  const body = document.createElement("div");
  body.innerHTML = `
    <div class="stack">
      <div class="form-group">
        <label class="form-label">Nazwa</label>
        <input class="input" id="rp-name" placeholder="np. Omlet z warzywami">
      </div>
      <div class="form-group">
        <label class="form-label">Kategoria</label>
        <select class="input" id="rp-cat">
          ${RECIPE_CATEGORIES.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join("")}
        </select>
      </div>
      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">Kcal</label>
          <input type="number" class="input" id="rp-kcal" placeholder="np. 500">
        </div>
        <div class="form-group">
          <label class="form-label">Białko (g)</label>
          <input type="number" class="input" id="rp-prot" placeholder="np. 30">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Czas (opcjonalnie)</label>
        <input class="input" id="rp-time" placeholder="np. 15 min">
      </div>
      <div class="form-group">
        <label class="form-label">Składniki (każdy w nowej linii)</label>
        <textarea class="textarea" id="rp-ing" placeholder="4 jajka&#10;30 g sera&#10;Sól"></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Kroki (każdy w nowej linii)</label>
        <textarea class="textarea" id="rp-steps" placeholder="Roztrzep jajka&#10;Smaż 3 min"></textarea>
      </div>
    </div>
  `;

  openModal({
    title: "Własny przepis",
    body,
    actions: [
      { label: "Anuluj", variant: "ghost" },
      {
        label: "Zapisz",
        variant: "primary",
        onClick: () => {
          const name = body.querySelector("#rp-name").value.trim();
          if (!name) { showToast("Podaj nazwę", "error"); return; }
          const ingredients = body.querySelector("#rp-ing").value.split("\n").map(s => s.trim()).filter(Boolean);
          const steps = body.querySelector("#rp-steps").value.split("\n").map(s => s.trim()).filter(Boolean);
          addMyRecipe({
            name,
            category: body.querySelector("#rp-cat").value,
            kcal: parseInt(body.querySelector("#rp-kcal").value) || 0,
            prot: parseInt(body.querySelector("#rp-prot").value) || 0,
            time: body.querySelector("#rp-time").value.trim(),
            ingredients,
            steps
          });
          showToast("✅ Przepis zapisany", "success");
          const container = document.getElementById("nutrition-content");
          if (container) render(container);
        }
      }
    ]
  });
}

// ============================================================================
// TAB: ZAKUPY
// ============================================================================

function renderShoppingTab() {
  const items = loadShoppingList();
  const unchecked = items.filter(i => !i.checked);
  const checked = items.filter(i => i.checked);

  return `
    <div class="card mb-3">
      <div class="row" style="gap:6px;">
        <input class="input" id="shop-new" placeholder="Dodaj produkt..." style="flex:1;">
        <button class="btn btn-primary" id="btn-shop-add"><i class="fa-solid fa-plus"></i></button>
      </div>
    </div>

    ${items.length === 0 ? `
      <div class="empty">
        <div class="empty-icon">🛒</div>
        <div class="empty-title">Lista pusta</div>
        <div class="empty-text">Dodaj produkty lub skorzystaj z przepisu.</div>
      </div>
    ` : `
      <div class="stack-sm">
        ${unchecked.length > 0 ? `
          <div class="section-header"><span class="section-header-title">Do kupienia (${unchecked.length})</span></div>
          ${unchecked.map(i => renderShoppingItem(i)).join("")}
        ` : ""}
        ${checked.length > 0 ? `
          <div class="section-header mt-3"><span class="section-header-title">Kupione (${checked.length})</span></div>
          ${checked.map(i => renderShoppingItem(i)).join("")}
          <button class="btn btn-danger btn-block mt-3" id="btn-clear-checked">
            <i class="fa-solid fa-trash"></i> Wyczyść kupione
          </button>
        ` : ""}
      </div>
    `}
  `;
}

function renderShoppingItem(item) {
  return `
    <div class="list-item ${item.checked ? "opacity-50" : ""}">
      <div class="checkbox-box" data-shop-toggle="${item.id}" style="${item.checked ? "background:var(--accent);border-color:var(--accent);color:var(--text-inverse);cursor:pointer;" : "cursor:pointer;"}">
        ${item.checked ? '<i class="fa-solid fa-check" style="font-size:12px;"></i>' : ""}
      </div>
      <div class="list-item-body">
        <div class="list-item-title" style="${item.checked ? "text-decoration:line-through;" : ""}">${escapeHtml(item.name)}</div>
        ${item.source ? `<div class="list-item-subtitle">z: ${escapeHtml(item.source)}</div>` : ""}
      </div>
      <button class="btn-icon btn-icon-sm" data-shop-del="${item.id}" style="color:var(--danger);"><i class="fa-solid fa-xmark"></i></button>
    </div>
  `;
}

// ============================================================================
// TAB: WODA
// ============================================================================

function renderWaterTab() {
  const goal = loadWaterGoal();
  const today = loadWaterToday();
  const pct = goal > 0 ? Math.min(100, Math.round((today / goal) * 100)) : 0;

  return `
    <div class="card card-accent">
      <div class="card-header">
        <div class="card-title">💧 Nawodnienie dziś</div>
        <button class="btn btn-sm btn-ghost" id="btn-reset-water">Reset</button>
      </div>
      <div class="text-center" style="padding:20px 0;">
        <div class="text-4xl font-black text-accent">${today} <span class="text-xl text-secondary">/ ${goal} ml</span></div>
        <div class="text-xs text-tertiary mt-1">${pct}% dziennego celu</div>
      </div>
      <div class="progress progress-lg"><div class="progress-fill" style="width:${pct}%"></div></div>
    </div>

    <div class="card mt-4">
      <div class="card-header"><div class="card-title">Dodaj wodę</div></div>
      <div class="grid-3">
        ${WATER_UNITS.map(u => `
          <button class="card card-padded-sm text-center" data-add-water="${u.ml}" style="cursor:pointer;">
            <div style="font-size:24px;">${u.icon}</div>
            <div class="text-xs font-bold mt-1">${u.label}</div>
            <div class="text-xs text-tertiary">${u.ml} ml</div>
          </button>
        `).join("")}
      </div>
    </div>

    <div class="card mt-4">
      <div class="card-header"><div class="card-title">Cel dzienny</div></div>
      <div class="stack-sm">
        ${WATER_GOALS.map(g => `
          <button class="card card-padded-sm ${goal === g.ml && g.ml > 0 ? "card-accent" : ""}" data-water-goal="${g.ml}" style="text-align:left;">
            <div class="row-between">
              <span class="text-sm">${g.label}</span>
              ${goal === g.ml && g.ml > 0 ? '<i class="fa-solid fa-check-circle text-accent"></i>' : ''}
            </div>
          </button>
        `).join("")}
      </div>
    </div>
  `;
}

// ============================================================================
// KREATOR POSIŁKÓW (jak wcześniej)
// ============================================================================

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

  refreshItems(); refreshIng();

  openModal({
    title: "🍽️ Kreator posiłku",
    body,
    actions: [{ label: "Gotowe", variant: "primary" }]
  });
}

// ============================================================================
// EVENTY
// ============================================================================

function bindEvents(container) {
  container.querySelectorAll("#nut-tabs [data-tab]").forEach(tab => {
    tab.addEventListener("click", () => {
      _activeTab = tab.dataset.tab;
      container.querySelectorAll("#nut-tabs [data-tab]").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      renderContent(container);
    });
  });
}

function bindTabEvents(container) {
  // Posiłki
  if (_activeTab === "meals") {
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

  // Przepisy
  if (_activeTab === "recipes") {
    $("btn-add-recipe")?.addEventListener("click", openAddRecipeModal);
    container.querySelectorAll("[data-info-recipe]").forEach(btn => {
      btn.addEventListener("click", () => openRecipeModal(btn.dataset.infoRecipe));
    });
  }

  // Zakupy
  if (_activeTab === "shopping") {
    const addFn = () => {
      const input = container.querySelector("#shop-new");
      const name = input.value.trim();
      if (!name) return;
      addShoppingItem(name);
      input.value = "";
      renderContent(container);
    };

    container.querySelector("#btn-shop-add")?.addEventListener("click", addFn);
    container.querySelector("#shop-new")?.addEventListener("keypress", (e) => {
      if (e.key === "Enter") { e.preventDefault(); addFn(); }
    });

    container.querySelectorAll("[data-shop-toggle]").forEach(box => {
      box.addEventListener("click", () => {
        toggleShoppingItem(box.dataset.shopToggle);
        renderContent(container);
      });
    });

    container.querySelectorAll("[data-shop-del]").forEach(btn => {
      btn.addEventListener("click", () => {
        deleteShoppingItem(btn.dataset.shopDel);
        renderContent(container);
      });
    });

    $("btn-clear-checked")?.addEventListener("click", () => {
      clearCheckedShopping();
      showToast("Wyczyszczono kupione", "");
      renderContent(container);
    });
  }

  // Woda
  if (_activeTab === "water") {
    container.querySelectorAll("[data-add-water]").forEach(btn => {
      btn.addEventListener("click", () => {
        addWater(parseInt(btn.dataset.addWater));
        showToast("💧 Dodano", "success");
        renderContent(container);
      });
    });

    container.querySelectorAll("[data-water-goal]").forEach(btn => {
      btn.addEventListener("click", () => {
        const val = parseInt(btn.dataset.waterGoal);
        if (val > 0) {
          saveWaterGoal(val);
          showToast("✅ Cel zapisany", "success");
          renderContent(container);
        }
      });
    });

    $("btn-reset-water")?.addEventListener("click", () => {
      resetWaterToday();
      renderContent(container);
    });
  }
}
