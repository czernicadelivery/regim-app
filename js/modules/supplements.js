// ============================================================================
// LOCK IN 2027 — js/modules/supplements.js
// Supplement Center: katalog, tracker, historia, filtry.
// ============================================================================

import { $, escapeHtml, dateKey } from "../core/utils.js";
import {
  loadSupplements, saveSupplement, deleteSupplement,
  loadSupplementLogs, logSupplement, loadProfile
} from "../core/data.js";
import { SUPPLEMENTS_CATALOG, CATEGORIES, EVIDENCE_LEVELS, getSupplementById, getCategoryById } from "../core/supplements-catalog.js";
import { state } from "../state.js";
import { showToast } from "../components/toast.js";
import { openModal } from "../components/modal.js";

let _mySupps = [];
let _logs = {};
let _activeTab = "mine"; // mine | catalog
let _catalogFilter = "all";
let _searchQuery = "";

export async function render(container) {
  _mySupps = await loadSupplements();
  _logs = await loadSupplementLogs(_mySupps.map(s => s.id));

  const profile = state.profile || (await loadProfile()) || {};
  const budget = profile.budget || "na";

  container.innerHTML = `
    <div class="stack-lg">
      <div class="card card-accent">
        <div class="row-between">
          <div>
            <div class="card-subtitle">SUPPLEMENT CENTER</div>
            <div class="card-title" style="margin-top:4px;">${_mySupps.filter(s => s.isActive !== false).length} aktywnych</div>
          </div>
          <button class="btn btn-primary btn-sm" id="btn-add-supp"><i class="fa-solid fa-plus"></i> Dodaj</button>
        </div>
      </div>

      ${budget === "0" ? `
        <div class="card" style="background:var(--success-subtle);border-color:var(--success);">
          <div class="text-sm">✅ Budżet: 0 zł — brak sugestii zakupowych. Skupiamy się na edukacji.</div>
        </div>
      ` : ""}

      <div class="tabs" id="supp-tabs">
        <button class="tab ${_activeTab === "mine" ? "active" : ""}" data-tab="mine">💊 Moje (${_mySupps.length})</button>
        <button class="tab ${_activeTab === "catalog" ? "active" : ""}" data-tab="catalog">📚 Katalog</button>
        <button class="tab ${_activeTab === "history" ? "active" : ""}" data-tab="history">📅 Historia</button>
      </div>

      <div id="supp-content"></div>
    </div>
  `;

  renderContent(container);
  bindEvents(container);
}

function renderContent(container) {
  const content = container.querySelector("#supp-content");
  if (!content) return;

  if (_activeTab === "mine") content.innerHTML = renderMineTab();
  else if (_activeTab === "catalog") content.innerHTML = renderCatalogTab();
  else if (_activeTab === "history") content.innerHTML = renderHistoryTab();

  bindTabEvents(container);
}

// ============================================================================
// TAB: MOJE
// ============================================================================

function renderMineTab() {
  const active = _mySupps.filter(s => s.status !== "paused" && s.status !== "finished" && s.status !== "wishlist" && s.isActive !== false);
  const other = _mySupps.filter(s => active.indexOf(s) === -1);

  if (_mySupps.length === 0) {
    return `<div class="empty">
      <div class="empty-icon">💊</div>
      <div class="empty-title">Brak suplementów</div>
      <div class="empty-text">Dodaj z katalogu lub własny. Nie musisz nic stosować.</div>
    </div>`;
  }

  return `
    <div class="stack">
      ${active.length ? `
        <div>
          <div class="section-header"><span class="section-header-title">Stosuję dziś (${active.length})</span></div>
          <div class="stack-sm">${active.map(s => renderMySupp(s, true)).join("")}</div>
        </div>
      ` : ""}

      ${other.length ? `
        <div>
          <div class="section-header"><span class="section-header-title">Pozostałe (${other.length})</span></div>
          <div class="stack-sm">${other.map(s => renderMySupp(s, false)).join("")}</div>
        </div>
      ` : ""}
    </div>
  `;
}

function renderMySupp(s, active) {
  const taken = _logs[s.id] === true;
  const cat = getCategoryById(s.category);
  const statusLabel = {
    active: "Stosuję",
    paused: "Przerwa",
    finished: "Zakończone",
    wishlist: "Do kupienia",
    observe: "Obserwuję"
  }[s.status || "active"] || "Stosuję";

  return `
    <div class="card card-padded-sm" style="${taken && active ? "background:var(--accent-subtle);border-color:var(--accent-medium);" : ""}">
      <div class="row-between">
        <div style="flex:1;min-width:0;">
          <div class="row" style="gap:8px;align-items:center;margin-bottom:4px;">
            <span class="text-sm font-bold">${escapeHtml(s.name)}</span>
            <span class="badge badge-neutral" style="font-size:9px;">${statusLabel}</span>
          </div>
          <div class="text-xs text-tertiary">
            ${s.dose ? escapeHtml(s.dose) + " " + escapeHtml(s.unit || "") : "dawka nieokreślona"}
            ${s.frequency ? " · " + escapeHtml(s.frequency) : ""}
          </div>
          ${cat ? `<div class="text-xs text-tertiary mt-1">${cat.icon} ${cat.name}</div>` : ""}
        </div>
        <div class="row" style="gap:6px;">
          ${active ? `
            <button class="btn-icon btn-icon-sm" data-toggle-supp="${s.id}" title="${taken ? "Cofnij" : "Przyjęte"}">
              <i class="fa-solid fa-${taken ? "check" : "plus"}" style="color:${taken ? "var(--accent)" : "var(--text-secondary)"};"></i>
            </button>
          ` : ""}
          <button class="btn-icon btn-icon-sm" data-edit-supp="${s.id}" title="Edytuj"><i class="fa-solid fa-pen"></i></button>
        </div>
      </div>
    </div>
  `;
}

// ============================================================================
// TAB: KATALOG
// ============================================================================

function renderCatalogTab() {
  const filtered = SUPPLEMENTS_CATALOG.filter(s => {
    if (_catalogFilter !== "all" && s.category !== _catalogFilter) return false;
    if (_searchQuery && !s.name.toLowerCase().includes(_searchQuery.toLowerCase())) return false;
    return true;
  });

  return `
    <div class="card card-padded-sm mb-3">
      <input class="input" id="supp-search" placeholder="🔍 Szukaj suplementu..." value="${escapeHtml(_searchQuery)}">
    </div>

    <div style="overflow-x:auto;padding-bottom:4px;margin-bottom:12px;">
      <div class="row" style="gap:6px;flex-wrap:nowrap;">
        <button class="chip ${_catalogFilter === "all" ? "active" : ""}" data-cat-filter="all">Wszystkie</button>
        ${CATEGORIES.map(c => `<button class="chip ${_catalogFilter === c.id ? "active" : ""}" data-cat-filter="${c.id}">${c.icon} ${c.name}</button>`).join("")}
      </div>
    </div>

    <div class="stack-sm">
      ${filtered.length ? filtered.map(s => renderCatalogItem(s)).join("") : `<div class="empty"><div class="empty-icon">🔍</div><div class="empty-text">Nie znaleziono.</div></div>`}
    </div>
  `;
}

function renderCatalogItem(s) {
  const cat = getCategoryById(s.category);
  const ev = EVIDENCE_LEVELS[s.evidence] || EVIDENCE_LEVELS.unclear;
  const isMine = _mySupps.some(m => m.catalogId === s.id);
  return `
    <div class="card card-padded-sm">
      <div class="row-between">
        <div style="flex:1;min-width:0;">
          <div class="text-sm font-bold">${escapeHtml(s.name)}</div>
          <div class="row" style="gap:6px;margin-top:4px;flex-wrap:wrap;">
            ${cat ? `<span class="badge badge-neutral">${cat.icon} ${cat.name}</span>` : ""}
            <span class="badge" style="background:${ev.color}20;color:${ev.color};font-size:9px;">${ev.icon} ${ev.label}</span>
          </div>
          <p class="text-xs text-secondary mt-2" style="line-height:1.5;">${escapeHtml(s.desc)}</p>
        </div>
      </div>
      <div class="row-between mt-2">
        <button class="btn btn-sm btn-ghost" data-info-supp="${s.id}">
          <i class="fa-solid fa-circle-info"></i> Szczegóły
        </button>
        ${isMine ? `<span class="badge badge-success">✓ W moich</span>` : `
          <button class="btn btn-sm btn-primary" data-add-from-cat="${s.id}">
            <i class="fa-solid fa-plus"></i> Dodaj
          </button>
        `}
      </div>
    </div>
  `;
}

// ============================================================================
// TAB: HISTORIA
// ============================================================================

function renderHistoryTab() {
  if (_mySupps.length === 0) {
    return `<div class="empty"><div class="empty-icon">📅</div><div class="empty-title">Brak historii</div><div class="empty-text">Dodaj suplement, aby śledzić.</div></div>`;
  }
  // Ostatnie 7 dni
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(dateKey(d));
  }
  return `
    <div class="stack-sm">
      ${days.map(day => {
        const dayLogs = JSON.parse(localStorage.getItem(`regim:${window.__currentUser?.uid || "local"}:supp-history-${day}`) || "{}");
        const taken = _mySupps.filter(s => dayLogs[s.id]).length;
        return `
          <div class="card card-padded-sm">
            <div class="row-between">
              <div class="text-sm font-semibold">${day}</div>
              <div class="text-xs text-tertiary">${taken} / ${_mySupps.length} przyjęte</div>
            </div>
          </div>
        `;
      }).join("")}
    </div>
    <div class="text-xs text-tertiary mt-3 text-center">
      Historia zapisywana lokalnie (Spark — bez backendu).
    </div>
  `;
}

// ============================================================================
// SZCZEGÓŁY SKŁADNIKA (modal)
// ============================================================================

function openInfoModal(id) {
  const s = getSupplementById(id);
  if (!s) return;
  const cat = getCategoryById(s.category);
  const ev = EVIDENCE_LEVELS[s.evidence] || EVIDENCE_LEVELS.unclear;

  const body = document.createElement("div");
  body.innerHTML = `
    <div class="stack">
      <div class="row" style="gap:6px;flex-wrap:wrap;">
        ${cat ? `<span class="badge badge-accent">${cat.icon} ${cat.name}</span>` : ""}
        <span class="badge" style="background:${ev.color}20;color:${ev.color};">${ev.icon} ${ev.label}</span>
      </div>
      <p class="text-sm text-secondary" style="line-height:1.6;">${escapeHtml(s.desc)}</p>
      ${s.sources ? `
        <div class="card card-flat">
          <div class="card-subtitle mb-1">ŹRÓDŁA ŻYWIENIOWE</div>
          <div class="text-sm text-secondary">${escapeHtml(s.sources)}</div>
        </div>
      ` : ""}
      ${s.warnings ? `
        <div class="card card-flat" style="background:var(--warning-subtle);border-color:var(--warning);">
          <div class="card-subtitle mb-1" style="color:var(--warning);">⚠️ OSTRZEŻENIA</div>
          <div class="text-sm text-secondary">${escapeHtml(s.warnings)}</div>
        </div>
      ` : ""}
      ${s.interactions && s.interactions.length ? `
        <div class="card card-flat" style="background:var(--danger-subtle);border-color:var(--danger);">
          <div class="card-subtitle mb-1" style="color:var(--danger);">🚨 INTERAKCJE</div>
          <ul class="text-sm text-secondary" style="padding-left:18px;line-height:1.6;">
            ${s.interactions.map(i => `<li>${escapeHtml(i)}</li>`).join("")}
          </ul>
        </div>
      ` : ""}
      <div class="text-xs text-tertiary">
        ℹ️ Aplikacja NIE ustala indywidualnych dawek. Dawkę zawsze ustalaj z lekarzem, farmaceutą lub według etykiety produktu.
      </div>
    </div>
  `;

  openModal({
    title: s.name,
    body,
    actions: [
      { label: "Zamknij", variant: "ghost" },
      {
        label: "Dodaj do moich",
        variant: "primary",
        onClick: () => openAddSupplementModal(s)
      }
    ]
  });
}

// ============================================================================
// DODAWANIE (z katalogu lub własny)
// ============================================================================

function openAddSupplementModal(catalogItem = null) {
  const isFromCatalog = !!catalogItem;

  const body = document.createElement("div");
  body.innerHTML = `
    <div class="stack">
      <div class="form-group">
        <label class="form-label">Nazwa</label>
        <input class="input" id="as-name" value="${escapeHtml(catalogItem?.name || "")}" ${isFromCatalog ? "readonly" : ""}>
      </div>
      <div class="form-group">
        <label class="form-label">Kategoria</label>
        <select class="input" id="as-category" ${isFromCatalog ? "disabled" : ""}>
          ${CATEGORIES.map(c => `<option value="${c.id}" ${catalogItem?.category === c.id ? "selected" : ""}>${c.icon} ${c.name}</option>`).join("")}
        </select>
      </div>
      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">Dawka (z etykiety)</label>
          <input class="input" id="as-dose" placeholder="np. 2000">
        </div>
        <div class="form-group">
          <label class="form-label">Jednostka</label>
          <input class="input" id="as-unit" placeholder="IU, mg, g">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Częstotliwość</label>
        <input class="input" id="as-freq" placeholder="np. codziennie, 3x w tyg." value="codziennie">
      </div>
      <div class="form-group">
        <label class="form-label">Status</label>
        <div class="row" style="gap:6px;flex-wrap:wrap;">
          <button class="chip active" data-status="active">Stosuję</button>
          <button class="chip" data-status="paused">Przerwa</button>
          <button class="chip" data-status="wishlist">Do kupienia</button>
          <button class="chip" data-status="observe">Obserwuję</button>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Notatki (opcjonalnie)</label>
        <textarea class="textarea" id="as-notes" placeholder="np. przyjmować z posiłkiem"></textarea>
      </div>
      <div class="card card-flat" style="background:var(--warning-subtle);">
        <div class="text-xs text-secondary">
          ⚠️ Dawkę ustal z lekarzem/farmaceutą lub zgodnie z etykietą. Aplikacja nie sugeruje dawek.
        </div>
      </div>
    </div>
  `;

  let status = "active";
  body.querySelectorAll("[data-status]").forEach(el => {
    el.addEventListener("click", () => {
      status = el.dataset.status;
      body.querySelectorAll("[data-status]").forEach(x => x.classList.remove("active"));
      el.classList.add("active");
    });
  });

  openModal({
    title: isFromCatalog ? "Dodaj do moich" : "Nowy suplement",
    body,
    actions: [
      { label: "Anuluj", variant: "ghost" },
      {
        label: "Zapisz",
        variant: "primary",
        onClick: async () => {
          const name = body.querySelector("#as-name").value.trim();
          if (!name) { showToast("Podaj nazwę", "error"); return; }

          const data = {
            catalogId: catalogItem?.id || null,
            name,
            category: body.querySelector("#as-category").value,
            dose: body.querySelector("#as-dose").value.trim(),
            unit: body.querySelector("#as-unit").value.trim(),
            frequency: body.querySelector("#as-freq").value.trim(),
            notes: body.querySelector("#as-notes").value.trim(),
            status,
            isActive: status === "active",
            createdAt: new Date().toISOString()
          };

          await saveSupplement(null, data);
          showToast("✅ Dodano", "success");
          const container = document.getElementById("supplements-content");
          if (container) render(container);
        }
      }
    ]
  });
}

// ============================================================================
// EDYCJA
// ============================================================================

function openEditModal(s) {
  const body = document.createElement("div");
  body.innerHTML = `
    <div class="stack">
      <div class="form-group">
        <label class="form-label">Nazwa</label>
        <input class="input" id="ed-name" value="${escapeHtml(s.name)}">
      </div>
      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">Dawka</label>
          <input class="input" id="ed-dose" value="${escapeHtml(s.dose || "")}">
        </div>
        <div class="form-group">
          <label class="form-label">Jednostka</label>
          <input class="input" id="ed-unit" value="${escapeHtml(s.unit || "")}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Częstotliwość</label>
        <input class="input" id="ed-freq" value="${escapeHtml(s.frequency || "")}">
      </div>
      <div class="form-group">
        <label class="form-label">Status</label>
        <div class="row" style="gap:6px;flex-wrap:wrap;">
          ${["active","paused","wishlist","observe","finished"].map(st => `
            <button class="chip ${(s.status || "active") === st ? "active" : ""}" data-ed-status="${st}">
              ${st === "active" ? "Stosuję" : st === "paused" ? "Przerwa" : st === "wishlist" ? "Do kupienia" : st === "observe" ? "Obserwuję" : "Zakończone"}
            </button>
          `).join("")}
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Notatki</label>
        <textarea class="textarea" id="ed-notes">${escapeHtml(s.notes || "")}</textarea>
      </div>
    </div>
  `;

  let editStatus = s.status || "active";
  body.querySelectorAll("[data-ed-status]").forEach(el => {
    el.addEventListener("click", () => {
      editStatus = el.dataset.edStatus;
      body.querySelectorAll("[data-ed-status]").forEach(x => x.classList.remove("active"));
      el.classList.add("active");
    });
  });

  openModal({
    title: "Edytuj suplement",
    body,
    actions: [
      {
        label: "Usuń", variant: "danger",
        onClick: async () => {
          if (!confirm("Usunąć ten suplement?")) return;
          await deleteSupplement(s.id);
          showToast("Usunięto", "");
          const c = document.getElementById("supplements-content");
          if (c) render(c);
        },
        close: false
      },
      { label: "Anuluj", variant: "ghost" },
      {
        label: "Zapisz", variant: "primary",
        onClick: async () => {
          const data = {
            name: body.querySelector("#ed-name").value.trim(),
            dose: body.querySelector("#ed-dose").value.trim(),
            unit: body.querySelector("#ed-unit").value.trim(),
            frequency: body.querySelector("#ed-freq").value.trim(),
            notes: body.querySelector("#ed-notes").value.trim(),
            status: editStatus,
            isActive: editStatus === "active"
          };
          if (!data.name) { showToast("Podaj nazwę", "error"); return; }
          await saveSupplement(s.id, data);
          showToast("✅ Zapisano", "success");
          const c = document.getElementById("supplements-content");
          if (c) render(c);
        }
      }
    ]
  });
}

// ============================================================================
// EVENTY
// ============================================================================

function bindEvents(container) {
  // Tabs
  container.querySelectorAll("#supp-tabs [data-tab]").forEach(tab => {
    tab.addEventListener("click", () => {
      _activeTab = tab.dataset.tab;
      container.querySelectorAll("#supp-tabs [data-tab]").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      renderContent(container);
    });
  });

  // Add
  container.querySelector("#btn-add-supp")?.addEventListener("click", () => openAddSupplementModal());
}

function bindTabEvents(container) {
  // Mine — toggle taken
  container.querySelectorAll("[data-toggle-supp]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.toggleSupp;
      const taken = _logs[id] === true;
      await logSupplement(id, !taken);
      _logs[id] = !taken;
      // Zapisz też do historii
      const key = `regim:${window.__currentUser?.uid || "local"}:supp-history-${dateKey(new Date())}`;
      try {
        const hist = JSON.parse(localStorage.getItem(key) || "{}");
        hist[id] = !taken;
        localStorage.setItem(key, JSON.stringify(hist));
      } catch (e) {}
      renderContent(container);
      if (!taken) showToast("✅ Przyjęte", "success");
    });
  });

  // Mine — edit
  container.querySelectorAll("[data-edit-supp]").forEach(btn => {
    btn.addEventListener("click", () => {
      const s = _mySupps.find(x => x.id === btn.dataset.editSupp);
      if (s) openEditModal(s);
    });
  });

  // Catalog — filter chips
  container.querySelectorAll("[data-cat-filter]").forEach(chip => {
    chip.addEventListener("click", () => {
      _catalogFilter = chip.dataset.catFilter;
      renderContent(container);
    });
  });

  // Catalog — search
  const searchEl = container.querySelector("#supp-search");
  if (searchEl) {
    searchEl.addEventListener("input", (e) => {
      _searchQuery = e.target.value;
      renderContent(container);
      const newSearch = container.querySelector("#supp-search");
      if (newSearch) { newSearch.focus(); newSearch.setSelectionRange(_searchQuery.length, _searchQuery.length); }
    });
  }

  // Catalog — info
  container.querySelectorAll("[data-info-supp]").forEach(btn => {
    btn.addEventListener("click", () => openInfoModal(btn.dataset.infoSupp));
  });

  // Catalog — add
  container.querySelectorAll("[data-add-from-cat]").forEach(btn => {
    btn.addEventListener("click", () => {
      const catItem = getSupplementById(btn.dataset.addFromCat);
      if (catItem) openAddSupplementModal(catItem);
    });
  });
}
