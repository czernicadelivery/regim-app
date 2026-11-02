// ============================================================================
// LOCK IN 2027 — js/modules/looksmaxxing.js
// Lookmaxxing Lab: trendy, osobisty plan wyglądu, kategorie.
// NIEBEZPIECZNE trendy = wyraźne ostrzeżenia.
// ============================================================================

import { $, escapeHtml, todayKey } from "../core/utils.js";
import { localKey } from "../core/storage.js";
import { LOOKS_CATEGORIES, TREND_LEVELS, TRENDS_CATALOG, getTrend, getCategory, getLevel } from "../core/looksmaxxing-catalog.js";
import { showToast } from "../components/toast.js";
import { openModal } from "../components/modal.js";

let _activeTab = "overview"; // overview | trends | myPlan
let _trendFilter = "all";

// ============================================================================
// POMOCNICZE: PLAN
// ============================================================================

function loadMyPlan() {
  try {
    const raw = localStorage.getItem(localKey("looksmaxxing-plan"));
    return raw ? JSON.parse(raw) : { activeTrends: [], focus: [] };
  } catch (e) { return { activeTrends: [], focus: [] }; }
}

function saveMyPlan(plan) {
  localStorage.setItem(localKey("looksmaxxing-plan"), JSON.stringify(plan));
}

// ============================================================================
// RENDER
// ============================================================================

export async function render(container) {
  container.innerHTML = `
    <div class="stack-lg">
      <div class="card card-accent">
        <div class="row-between">
          <div>
            <div class="card-subtitle">LOOKMAXXING LAB</div>
            <div class="card-title" style="margin-top:4px;">Rozwój wyglądu</div>
          </div>
          <div style="font-size:32px;">👁️</div>
        </div>
        <p class="text-sm text-secondary mt-2" style="line-height:1.5;">
          Edukacja o trendach wyglądu. Niebezpieczne praktyki są wyraźnie oznaczone — bez instrukcji wykonywania.
        </p>
      </div>

      <div class="tabs" id="looks-tabs">
        <button class="tab ${_activeTab === "overview" ? "active" : ""}" data-tab="overview">🎯 Przegląd</button>
        <button class="tab ${_activeTab === "trends" ? "active" : ""}" data-tab="trends">📚 Trendy</button>
        <button class="tab ${_activeTab === "myPlan" ? "active" : ""}" data-tab="myPlan">📋 Mój plan</button>
      </div>

      <div id="looks-content"></div>
    </div>
  `;

  renderContent(container);
  bindEvents(container);
}

function renderContent(container) {
  const content = container.querySelector("#looks-content");
  if (!content) return;

  if (_activeTab === "overview") content.innerHTML = renderOverview();
  else if (_activeTab === "trends") content.innerHTML = renderTrends();
  else if (_activeTab === "myPlan") content.innerHTML = renderMyPlan();

  bindTabEvents(container);
}

// ============================================================================
// TAB: PRZEGLĄD
// ============================================================================

function renderOverview() {
  const plan = loadMyPlan();
  const safeCount = TRENDS_CATALOG.filter(t => t.level === "verified" || t.level === "limited").length;
  const dangerCount = TRENDS_CATALOG.filter(t => t.level === "dangerous").length;

  return `
    <div class="grid-2">
      <div class="stat">
        <div class="stat-label">Bezpieczne trendy</div>
        <div class="stat-value accent">${safeCount}</div>
      </div>
      <div class="stat" style="border-color:var(--danger);">
        <div class="stat-label">Niebezpieczne</div>
        <div class="stat-value" style="color:var(--danger);">${dangerCount}</div>
      </div>
    </div>

    <div class="card mt-4">
      <div class="card-header"><div class="card-title">🎯 Kategorie</div></div>
      <div class="grid-2" style="gap:8px;">
        ${LOOKS_CATEGORIES.map(cat => `
          <button class="card card-padded-sm" data-filter-cat="${cat.id}" style="text-align:left;padding:10px;">
            <div style="font-size:22px;">${cat.icon}</div>
            <div class="text-xs font-bold mt-1">${cat.name}</div>
          </button>
        `).join("")}
      </div>
    </div>

    <div class="card mt-4" style="background:var(--warning-subtle);border-color:var(--warning);">
      <div class="row" style="gap:10px;align-items:flex-start;">
        <div style="font-size:24px;">⚠️</div>
        <div>
          <div class="text-sm font-bold" style="color:var(--warning);">Ważne</div>
          <div class="text-xs text-secondary mt-1" style="line-height:1.5;">
            Aplikacja NIE poleca ryzykownych metod. Treści o niebezpiecznych trendach (jak Bonesmashing) są ostrzeżeniami, nie instrukcjami.
            Skonsultuj się z dermatologiem lub chirurgiem szczękowym w przypadku realnych problemów.
          </div>
        </div>
      </div>
    </div>

    ${plan.activeTrends.length > 0 ? `
      <div class="card mt-4">
        <div class="card-header"><div class="card-title">📋 Twój plan (${plan.activeTrends.length})</div></div>
        <div class="stack-sm">
          ${plan.activeTrends.slice(0, 3).map(id => {
            const t = getTrend(id);
            return t ? `<div class="text-sm">• ${escapeHtml(t.name)}</div>` : "";
          }).join("")}
        </div>
      </div>
    ` : ""}
  `;
}

// ============================================================================
// TAB: TRENDY
// ============================================================================

function renderTrends() {
  const filtered = TRENDS_CATALOG.filter(t => {
    if (_trendFilter !== "all" && t.category !== _trendFilter) return false;
    return true;
  });

  return `
    <div style="overflow-x:auto;padding-bottom:4px;margin-bottom:12px;">
      <div class="row" style="gap:6px;flex-wrap:nowrap;">
        <button class="chip ${_trendFilter === "all" ? "active" : ""}" data-trend-filter="all">Wszystkie</button>
        ${LOOKS_CATEGORIES.map(c => `<button class="chip ${_trendFilter === c.id ? "active" : ""}" data-trend-filter="${c.id}">${c.icon} ${c.name}</button>`).join("")}
      </div>
    </div>

    <div class="stack-sm">
      ${filtered.map(t => renderTrendCard(t)).join("")}
    </div>
  `;
}

function renderTrendCard(t) {
  const level = getLevel(t.level);
  const isDangerous = t.level === "dangerous";
  return `
    <div class="card card-padded-sm" style="${isDangerous ? "border-color:var(--danger);background:var(--danger-subtle);" : ""}">
      <div class="row-between">
        <div style="flex:1;min-width:0;">
          <div class="text-sm font-bold">${escapeHtml(t.name)}</div>
          <div class="row" style="gap:6px;margin-top:4px;flex-wrap:wrap;">
            <span class="badge" style="background:${level.color}20;color:${level.color};font-size:9px;">${level.icon} ${level.label}</span>
          </div>
          <p class="text-xs text-secondary mt-2" style="line-height:1.5;">${escapeHtml(t.what)}</p>
        </div>
        <button class="btn-icon btn-icon-sm" data-info-trend="${t.id}"><i class="fa-solid fa-circle-info"></i></button>
      </div>
    </div>
  `;
}

// ============================================================================
// TAB: MÓJ PLAN
// ============================================================================

function renderMyPlan() {
  const plan = loadMyPlan();
  const active = plan.activeTrends.map(id => getTrend(id)).filter(Boolean);

  return `
    <div class="card">
      <div class="card-header"><div class="card-title">📋 Aktywne trendy (${active.length})</div></div>
      ${active.length === 0 ? `
        <div class="empty"><div class="empty-icon">📋</div><div class="empty-text">Brak aktywnych trendów. Dodaj z katalogu.</div></div>
      ` : `
        <div class="stack-sm">
          ${active.map(t => `
            <div class="list-item">
              <div class="list-item-body">
                <div class="list-item-title">${escapeHtml(t.name)}</div>
                <div class="list-item-subtitle">${getLevel(t.level).label}</div>
              </div>
              <button class="btn-icon btn-icon-sm" data-remove-trend="${t.id}" style="color:var(--danger);"><i class="fa-solid fa-xmark"></i></button>
            </div>
          `).join("")}
        </div>
      `}
    </div>

    ${active.length > 0 ? `
      <div class="card mt-4">
        <div class="card-header"><div class="card-title">💡 Jak wprowadzać</div></div>
        <ul class="text-sm text-secondary" style="line-height:1.7;padding-left:20px;">
          <li>Wprowadzaj <strong>jeden trend naraz</strong> — łatwiej ocenić efekty.</li>
          <li>Daj <strong>4-8 tygodni</strong> na pierwsze efekty.</li>
          <li>Zrób <strong>zdjęcia "przed"</strong> w podobnym oświetleniu.</li>
          <li>Skonsultuj się ze specjalistą przy wątpliwościach.</li>
        </ul>
      </div>
    ` : ""}
  `;
}

// ============================================================================
// MODAL: SZCZEGÓŁY TRENDU
// ============================================================================

function openTrendModal(id) {
  const t = getTrend(id);
  if (!t) return;

  const level = getLevel(t.level);
  const cat = getCategory(t.category);
  const isDangerous = t.level === "dangerous";
  const plan = loadMyPlan();
  const isActive = plan.activeTrends.includes(id);

  const body = document.createElement("div");
  body.innerHTML = `
    <div class="stack">
      <div class="row" style="gap:6px;flex-wrap:wrap;">
        ${cat ? `<span class="badge badge-neutral">${cat.icon} ${cat.name}</span>` : ""}
        <span class="badge" style="background:${level.color}20;color:${level.color};">${level.icon} ${level.label}</span>
      </div>

      <div>
        <div class="text-xs text-tertiary uppercase font-bold mb-1">Co to jest</div>
        <p class="text-sm text-secondary" style="line-height:1.5;">${escapeHtml(t.what)}</p>
      </div>

      <div>
        <div class="text-xs text-tertiary uppercase font-bold mb-1">Co mówią dowody</div>
        <p class="text-sm text-secondary" style="line-height:1.5;">${escapeHtml(t.claim)}</p>
      </div>

      ${t.risk ? `
        <div class="card card-flat" style="background:${isDangerous ? "var(--danger-subtle)" : "var(--warning-subtle)"};border-color:${isDangerous ? "var(--danger)" : "var(--warning)"};">
          <div class="text-xs uppercase font-bold mb-1" style="color:${isDangerous ? "var(--danger)" : "var(--warning)"};">
            ${isDangerous ? "🚨 RYZYKO" : "⚠️ Ostrzeżenia"}
          </div>
          <p class="text-sm text-secondary" style="line-height:1.5;">${escapeHtml(t.risk)}</p>
        </div>
      ` : ""}

      ${t.safer ? `
        <div class="card card-flat" style="background:var(--success-subtle);border-color:var(--success);">
          <div class="text-xs uppercase font-bold mb-1" style="color:var(--success);">✅ Bezpieczniejsze alternatywy</div>
          <p class="text-sm text-secondary" style="line-height:1.5;">${escapeHtml(t.safer)}</p>
        </div>
      ` : ""}

      <div>
        <div class="text-xs text-tertiary uppercase font-bold mb-1">Poziom dowodów</div>
        <p class="text-sm text-secondary">${escapeHtml(t.evidence)}</p>
      </div>

      ${isDangerous ? `
        <div class="card card-flat" style="background:var(--danger);color:var(--text-inverse);">
          <div class="text-xs font-bold" style="line-height:1.5;">
            ❌ Ta praktyka jest NIEBEZPIECZNA. Aplikacja nie dostarcza instrukcji ani nie zachęca do jej wykonywania.
          </div>
        </div>
      ` : ""}
    </div>
  `;

  const actions = [
    { label: "Zamknij", variant: "ghost" }
  ];

  if (!isDangerous) {
    actions.push({
      label: isActive ? "Usuń z planu" : "Dodaj do planu",
      variant: isActive ? "danger" : "primary",
      onClick: () => {
        const p = loadMyPlan();
        if (isActive) p.activeTrends = p.activeTrends.filter(x => x !== id);
        else p.activeTrends.push(id);
        saveMyPlan(p);
        showToast(isActive ? "Usunięto z planu" : "✅ Dodano do planu", "success");
        const c = document.getElementById("looksmaxxing-content");
        if (c) render(c);
      }
    });
  }

  openModal({ title: t.name, body, actions });
}

// ============================================================================
// EVENTY
// ============================================================================

function bindEvents(container) {
  container.querySelectorAll("#looks-tabs [data-tab]").forEach(tab => {
    tab.addEventListener("click", () => {
      _activeTab = tab.dataset.tab;
      container.querySelectorAll("#looks-tabs [data-tab]").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      renderContent(container);
    });
  });
}

function bindTabEvents(container) {
  // Overview — kategorie
  container.querySelectorAll("[data-filter-cat]").forEach(btn => {
    btn.addEventListener("click", () => {
      _trendFilter = btn.dataset.filterCat;
      _activeTab = "trends";
      container.querySelectorAll("#looks-tabs [data-tab]").forEach(t => t.classList.remove("active"));
      container.querySelector(`[data-tab="trends"]`)?.classList.add("active");
      renderContent(container);
    });
  });

  // Trends — filtry
  container.querySelectorAll("[data-trend-filter]").forEach(chip => {
    chip.addEventListener("click", () => {
      _trendFilter = chip.dataset.trendFilter;
      renderContent(container);
    });
  });

  // Trends — info
  container.querySelectorAll("[data-info-trend]").forEach(btn => {
    btn.addEventListener("click", () => openTrendModal(btn.dataset.infoTrend));
  });

  // MyPlan — remove
  container.querySelectorAll("[data-remove-trend]").forEach(btn => {
    btn.addEventListener("click", () => {
      const p = loadMyPlan();
      p.activeTrends = p.activeTrends.filter(x => x !== btn.dataset.removeTrend);
      saveMyPlan(p);
      showToast("Usunięto z planu", "");
      renderContent(container);
    });
  });
}
