// ============================================================================
// LOCK IN 2027 — js/modules/skincare.js
// Skincare Studio: profil skóry, produkty, dziennik, biblioteka składników.
// ============================================================================

import { $, escapeHtml, dateKey } from "../core/utils.js";
import {
  loadSkinProfile, saveSkinProfile,
  loadSkinProducts, saveSkinProducts,
  loadSkinJournal, saveSkinJournal
} from "../core/data.js";
import {
  SKIN_TYPES, PRODUCT_CATEGORIES, INGREDIENTS_CATALOG,
  getSkinType, getProductCategory, getIngredient
} from "../core/skincare-catalog.js";
import { state } from "../state.js";
import { showToast } from "../components/toast.js";
import { openModal } from "../components/modal.js";

let _activeTab = "profile";
let _profile = {};
let _products = [];
let _journal = [];

export async function render(container) {
  _profile = loadSkinProfile();
  _products = loadSkinProducts();
  _journal = loadSkinJournal();

  container.innerHTML = `
    <div class="stack-lg">
      <div class="card card-accent">
        <div class="row-between">
          <div>
            <div class="card-subtitle">SKINCARE STUDIO</div>
            <div class="card-title" style="margin-top:4px;">
              ${_profile.skinType && _profile.skinType !== "unknown" ? (getSkinType(_profile.skinType)?.icon + " " + getSkinType(_profile.skinType)?.label) : "Skonfiguruj profil skóry"}
            </div>
          </div>
          <div class="text-right">
            <div class="text-2xl font-black text-accent">${_products.length}</div>
            <div class="text-xs text-tertiary">produktów</div>
          </div>
        </div>
      </div>

      <div class="tabs" id="skin-tabs">
        <button class="tab ${_activeTab === "profile" ? "active" : ""}" data-tab="profile">👤 Profil</button>
        <button class="tab ${_activeTab === "products" ? "active" : ""}" data-tab="products">🧴 Produkty</button>
        <button class="tab ${_activeTab === "journal" ? "active" : ""}" data-tab="journal">📔 Dziennik</button>
        <button class="tab ${_activeTab === "library" ? "active" : ""}" data-tab="library">📚 Składniki</button>
      </div>

      <div id="skin-content"></div>
    </div>
  `;

  renderContent(container);
  bindEvents(container);
}

function renderContent(container) {
  const content = container.querySelector("#skin-content");
  if (!content) return;

  if (_activeTab === "profile") content.innerHTML = renderProfileTab();
  else if (_activeTab === "products") content.innerHTML = renderProductsTab();
  else if (_activeTab === "journal") content.innerHTML = renderJournalTab();
  else if (_activeTab === "library") content.innerHTML = renderLibraryTab();

  bindTabEvents(container);
}

// ============================================================================
// PROFIL SKÓRY
// ============================================================================

function renderProfileTab() {
  return `
    <div class="card">
      <div class="card-header"><div class="card-title">Typ skóry</div></div>
      <div class="grid-2" style="gap:8px;">
        ${SKIN_TYPES.map(st => `
          <button class="card card-padded-sm ${_profile.skinType === st.id ? "card-accent" : ""}" data-skintype="${st.id}"
            style="text-align:left;">
            <div class="row-between">
              <div>
                <div class="text-sm font-bold">${st.icon} ${st.label}</div>
              </div>
              ${_profile.skinType === st.id ? '<i class="fa-solid fa-check-circle text-accent"></i>' : ''}
            </div>
          </button>
        `).join("")}
      </div>
    </div>

    <div class="card mt-4">
      <div class="card-header"><div class="card-title">Notatki</div></div>
      <textarea class="textarea" id="skin-notes" placeholder="np. suchość na policzkach, przetłuszczająca się strefa T">${escapeHtml(_profile.notes || "")}</textarea>
      <button class="btn btn-primary btn-block mt-3" id="skin-save-profile">Zapisz profil</button>
    </div>

    <div class="card mt-4" style="background:var(--warning-subtle);border-color:var(--warning);">
      <div class="text-sm text-secondary">
        ⚠️ Pielęgnacja to kwestia indywidualna. Informacje tutaj są edukacyjne — nie zastępują porady dermatologa.
        W przypadku problemów skórnych skonsultuj się ze specjalistą.
      </div>
    </div>
  `;
}

// ============================================================================
// PRODUKTY
// ============================================================================

function renderProductsTab() {
  if (_products.length === 0) {
    return `<div class="empty">
      <div class="empty-icon">🧴</div>
      <div class="empty-title">Brak produktów</div>
      <div class="empty-text">Dodaj produkty, które posiadasz — to pomoże budować rutynę.</div>
      <button class="btn btn-primary mt-3" id="btn-add-product">
        <i class="fa-solid fa-plus"></i> Dodaj pierwszy
      </button>
    </div>`;
  }

  const byCategory = {};
  _products.forEach(p => {
    if (!byCategory[p.category]) byCategory[p.category] = [];
    byCategory[p.category].push(p);
  });

  return `
    <div class="stack">
      ${Object.keys(byCategory).map(catId => {
        const cat = getProductCategory(catId);
        const items = byCategory[catId];
        return `
          <div>
            <div class="section-header"><span class="section-header-title">${cat?.icon || "📦"} ${cat?.name || catId} (${items.length})</span></div>
            <div class="stack-sm">
              ${items.map(p => renderProductItem(p)).join("")}
            </div>
          </div>
        `;
      }).join("")}
      <button class="btn btn-secondary btn-block mt-3" id="btn-add-product">
        <i class="fa-solid fa-plus"></i> Dodaj produkt
      </button>
    </div>
  `;
}

function renderProductItem(p) {
  const statusBadge = p.status === "wishlist" ? '<span class="badge badge-warning" style="font-size:9px;">Wishlist</span>' :
    p.status === "finished" ? '<span class="badge badge-neutral" style="font-size:9px;">Zakończone</span>' :
    '<span class="badge badge-success" style="font-size:9px;">Posiadam</span>';
  return `
    <div class="card card-padded-sm">
      <div class="row-between">
        <div style="flex:1;min-width:0;">
          <div class="row" style="gap:6px;flex-wrap:wrap;">
            <span class="text-sm font-bold">${escapeHtml(p.name)}</span>
            ${statusBadge}
          </div>
          ${p.brand ? `<div class="text-xs text-tertiary mt-1">${escapeHtml(p.brand)}</div>` : ""}
          ${p.notes ? `<div class="text-xs text-secondary mt-1" style="line-height:1.4;">${escapeHtml(p.notes)}</div>` : ""}
        </div>
        <div class="row" style="gap:6px;">
          <button class="btn-icon btn-icon-sm" data-edit-product="${p.id}"><i class="fa-solid fa-pen"></i></button>
          <button class="btn-icon btn-icon-sm" data-del-product="${p.id}" style="color:var(--danger);"><i class="fa-solid fa-xmark"></i></button>
        </div>
      </div>
    </div>
  `;
}

// ============================================================================
// DZIENNIK
// ============================================================================

function renderJournalTab() {
  const today = dateKey(new Date());
  const todayEntry = _journal.find(e => e.date === today);

  return `
    <div class="card">
      <div class="card-header"><div class="card-title">Wpis na dziś</div></div>
      <div class="form-group">
        <label class="form-label">Stan skóry dziś</label>
        <div class="row" style="gap:6px;flex-wrap:wrap;" id="skin-feel-today">
          ${[
            { id: "great", icon: "🌟", label: "Świetnie" },
            { id: "good", icon: "✅", label: "Dobrze" },
            { id: "ok", icon: "🟡", label: "OK" },
            { id: "bad", icon: "⚠️", label: "Słabo" },
            { id: "breakout", icon: "🔴", label: "Wysyp" }
          ].map(f => `
            <button class="chip ${todayEntry?.feel === f.id ? "active" : ""}" data-feel="${f.id}">${f.icon} ${f.label}</button>
          `).join("")}
        </div>
      </div>
      <div class="form-group mt-3">
        <label class="form-label">Notatka</label>
        <textarea class="textarea" id="journal-note" placeholder="np. suchość na policzkach po nowym kremie">${escapeHtml(todayEntry?.note || "")}</textarea>
      </div>
      <button class="btn btn-primary btn-block mt-3" id="btn-save-journal">Zapisz wpis</button>
    </div>

    <div class="mt-4">
      <div class="section-header"><span class="section-header-title">Historia (${_journal.length})</span></div>
      ${_journal.length ? `
        <div class="stack-sm">
          ${_journal.slice(0, 14).map(e => `
            <div class="card card-padded-sm">
              <div class="row-between">
                <div class="text-xs text-tertiary font-semibold">${e.date}</div>
                <div class="text-sm">
                  ${e.feel === "great" ? "🌟" : e.feel === "good" ? "✅" : e.feel === "ok" ? "🟡" : e.feel === "bad" ? "⚠️" : e.feel === "breakout" ? "🔴" : ""}
                </div>
              </div>
              ${e.note ? `<div class="text-xs text-secondary mt-1" style="line-height:1.4;">${escapeHtml(e.note)}</div>` : ""}
            </div>
          `).join("")}
        </div>
      ` : `<div class="empty"><div class="empty-icon">📔</div><div class="empty-text">Brak wpisów. Dodaj pierwszy powyżej.</div></div>`}
    </div>
  `;
}

// ============================================================================
// BIBLIOTEKA SKŁADNIKÓW
// ============================================================================

function renderLibraryTab() {
  return `
    <div class="card card-flat mb-3">
      <div class="text-xs text-secondary" style="line-height:1.5;">
        📚 Biblioteka składników — informacje edukacyjne. Nie zastępuje porady dermatologa.
      </div>
    </div>
    <div class="stack">
      ${INGREDIENTS_CATALOG.map(ing => renderIngredientCard(ing)).join("")}
    </div>
  `;
}

function renderIngredientCard(ing) {
  return `
    <div class="card card-padded-sm">
      <div class="row-between">
        <div style="flex:1;min-width:0;">
          <div class="text-sm font-bold">${escapeHtml(ing.name)}</div>
          <div class="text-xs text-tertiary mt-1">${escapeHtml(ing.category)}</div>
        </div>
        <button class="btn-icon btn-icon-sm" data-info-ing="${ing.id}"><i class="fa-solid fa-circle-info"></i></button>
      </div>
      <p class="text-xs text-secondary mt-2" style="line-height:1.5;">${escapeHtml(ing.what)}</p>
    </div>
  `;
}

function openIngredientModal(id) {
  const ing = getIngredient(id);
  if (!ing) return;

  const body = document.createElement("div");
  body.innerHTML = `
    <div class="stack">
      <div class="row" style="gap:6px;flex-wrap:wrap;">
        <span class="badge badge-accent">${escapeHtml(ing.category)}</span>
        <span class="badge badge-neutral">${escapeHtml(ing.concentration || "")}</span>
      </div>
      <p class="text-sm text-secondary" style="line-height:1.6;">${escapeHtml(ing.what)}</p>
      ${ing.warnings ? `
        <div class="card card-flat" style="background:var(--warning-subtle);border-color:var(--warning);">
          <div class="card-subtitle mb-1" style="color:var(--warning);">⚠️ OSTRZEŻENIA</div>
          <div class="text-sm text-secondary">${escapeHtml(ing.warnings)}</div>
        </div>
      ` : ""}
      ${ing.pairs && ing.pairs.length ? `
        <div class="card card-flat" style="background:var(--success-subtle);">
          <div class="card-subtitle mb-1" style="color:var(--success);">✅ ŁĄCZ Z</div>
          <div class="text-sm text-secondary">${ing.pairs.join(", ")}</div>
        </div>
      ` : ""}
      ${ing.avoid && ing.avoid.length ? `
        <div class="card card-flat" style="background:var(--danger-subtle);border-color:var(--danger);">
          <div class="card-subtitle mb-1" style="color:var(--danger);">🚫 NIE ŁĄCZ Z</div>
          <div class="text-sm text-secondary">${ing.avoid.join(", ")}</div>
        </div>
      ` : ""}
      <div class="text-xs text-tertiary">
        ℹ️ Informacje edukacyjne. Skonsultuj się z dermatologiem przed wprowadzeniem nowych aktywnych składników.
      </div>
    </div>
  `;

  openModal({
    title: ing.name,
    body,
    actions: [{ label: "Zamknij", variant: "ghost" }]
  });
}

// ============================================================================
// DODAWANIE / EDYCJA PRODUKTU
// ============================================================================

function openProductModal(existing) {
  const isEdit = !!existing;
  const data = existing ? { ...existing } : {
    name: "", brand: "", category: "cleanser", status: "owned", notes: ""
  };

  const body = document.createElement("div");
  body.innerHTML = `
    <div class="stack">
      <div class="form-group">
        <label class="form-label">Nazwa</label>
        <input class="input" id="sp-name" value="${escapeHtml(data.name)}" placeholder="np. Kwas hialuronowy 2%">
      </div>
      <div class="form-group">
        <label class="form-label">Marka (opcjonalnie)</label>
        <input class="input" id="sp-brand" value="${escapeHtml(data.brand)}" placeholder="np. The Ordinary">
      </div>
      <div class="form-group">
        <label class="form-label">Kategoria</label>
        <select class="input" id="sp-cat">
          ${PRODUCT_CATEGORIES.map(c => `<option value="${c.id}" ${data.category === c.id ? "selected" : ""}>${c.icon} ${c.name}</option>`).join("")}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Status</label>
        <div class="row" style="gap:6px;">
          <button class="chip ${data.status === "owned" ? "active" : ""}" data-status="owned">Posiadam</button>
          <button class="chip ${data.status === "wishlist" ? "active" : ""}" data-status="wishlist">Wishlist</button>
          <button class="chip ${data.status === "finished" ? "active" : ""}" data-status="finished">Zakończone</button>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Notatki</label>
        <textarea class="textarea" id="sp-notes" placeholder="np. stosować wieczorem, 2-3x w tyg.">${escapeHtml(data.notes)}</textarea>
      </div>
    </div>
  `;

  let status = data.status;
  body.querySelectorAll("[data-status]").forEach(el => {
    el.addEventListener("click", () => {
      status = el.dataset.status;
      body.querySelectorAll("[data-status]").forEach(x => x.classList.remove("active"));
      el.classList.add("active");
    });
  });

  openModal({
    title: isEdit ? "Edytuj produkt" : "Nowy produkt",
    body,
    actions: [
      { label: "Anuluj", variant: "ghost" },
      {
        label: isEdit ? "Zapisz" : "Dodaj",
        variant: "primary",
        onClick: async () => {
          const name = body.querySelector("#sp-name").value.trim();
          if (!name) { showToast("Podaj nazwę", "error"); return; }
          const item = {
            id: isEdit ? existing.id : "sp-" + Date.now(),
            name,
            brand: body.querySelector("#sp-brand").value.trim(),
            category: body.querySelector("#sp-cat").value,
            status,
            notes: body.querySelector("#sp-notes").value.trim(),
            createdAt: isEdit ? existing.createdAt : Date.now()
          };
          const idx = _products.findIndex(p => p.id === item.id);
          if (idx >= 0) _products[idx] = item;
          else _products.push(item);
          await saveSkinProducts(_products);
          showToast("✅ Zapisano", "success");
          const container = document.getElementById("skincare-content");
          if (container) render(container);
        }
      }
    ]
  });
}

// ============================================================================
// EVENTY
// ============================================================================

function bindEvents(container) {
  container.querySelectorAll("#skin-tabs [data-tab]").forEach(tab => {
    tab.addEventListener("click", () => {
      _activeTab = tab.dataset.tab;
      container.querySelectorAll("#skin-tabs [data-tab]").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      renderContent(container);
    });
  });
}

function bindTabEvents(container) {
  // Profil skóry
  container.querySelectorAll("[data-skintype]").forEach(btn => {
    btn.addEventListener("click", () => {
      _profile.skinType = btn.dataset.skintype;
      renderContent(container);
    });
  });

  container.querySelector("#skin-save-profile")?.addEventListener("click", () => {
    _profile.notes = container.querySelector("#skin-notes")?.value || "";
    saveSkinProfile(_profile);
    showToast("✅ Profil zapisany", "success");
  });

  // Produkty
  container.querySelector("#btn-add-product")?.addEventListener("click", () => openProductModal(null));
  container.querySelectorAll("[data-edit-product]").forEach(btn => {
    btn.addEventListener("click", () => {
      const p = _products.find(x => x.id === btn.dataset.editProduct);
      if (p) openProductModal(p);
    });
  });
  container.querySelectorAll("[data-del-product]").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm("Usunąć produkt?")) return;
      _products = _products.filter(x => x.id !== btn.dataset.delProduct);
      await saveSkinProducts(_products);
      const c = document.getElementById("skincare-content");
      if (c) render(c);
    });
  });

  // Dziennik
  let feel = "ok";
  container.querySelectorAll("[data-feel]").forEach(btn => {
    btn.addEventListener("click", () => {
      feel = btn.dataset.feel;
      container.querySelectorAll("[data-feel]").forEach(x => x.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  container.querySelector("#btn-save-journal")?.addEventListener("click", () => {
    const today = dateKey(new Date());
    const note = container.querySelector("#journal-note")?.value || "";
    _journal = _journal.filter(e => e.date !== today);
    _journal.unshift({ date: today, feel, note });
    saveSkinJournal(_journal);
    showToast("✅ Wpis zapisany", "success");
    renderContent(container);
  });

  // Biblioteka składników
  container.querySelectorAll("[data-info-ing]").forEach(btn => {
    btn.addEventListener("click", () => openIngredientModal(btn.dataset.infoIng));
  });
}
