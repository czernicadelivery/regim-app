// ============================================================================
// LOCK IN 2027 — js/modules/inventory.js
// My Inventory + Budget Tracker: produkty, wishlist, wydatki.
// ============================================================================

import { $, escapeHtml, dateKey } from "../core/utils.js";
import {
  loadInventory, addInventoryItem, updateInventoryItem, deleteInventoryItem,
  loadBudget, saveBudget, addTransaction, deleteTransaction,
  getMonthSpend, getTotalSpend, getTransactionsByMonth
} from "../core/inventory-data.js";
import {
  INVENTORY_CATEGORIES, INVENTORY_STATUS, BUDGET_CATEGORIES,
  getInventoryCategory, getInventoryStatus, getBudgetCategory
} from "../core/inventory-catalog.js";
import { state } from "../state.js";
import { showToast } from "../components/toast.js";
import { openModal } from "../components/modal.js";

let _activeTab = "inventory"; // inventory | budget
let _invFilter = "owned";
let _items = [];
let _budget = {};

// ============================================================================
// RENDER
// ============================================================================

export async function render(container) {
  _items = loadInventory();
  _budget = loadBudget();

  const owned = _items.filter(i => i.status === "owned").length;
  const wishlist = _items.filter(i => i.status === "wishlist").length;
  const now = new Date();
  const monthSpend = getMonthSpend(_budget, now.getFullYear(), now.getMonth());

  container.innerHTML = `
    <div class="stack-lg">
      <div class="card card-accent">
        <div class="row-between">
          <div>
            <div class="card-subtitle">MY SPACE</div>
            <div class="card-title" style="margin-top:4px;">Inventory + Budżet</div>
          </div>
          <div style="font-size:32px;">📦</div>
        </div>
        <div class="grid-3 mt-3">
          <div class="stat"><div class="stat-label">Posiadam</div><div class="stat-value accent">${owned}</div></div>
          <div class="stat"><div class="stat-label">Wishlist</div><div class="stat-value">${wishlist}</div></div>
          <div class="stat"><div class="stat-label">Ten miesiąc</div><div class="stat-value">${monthSpend}<span class="stat-unit">zł</span></div></div>
        </div>
      </div>

      <div class="tabs" id="inv-tabs">
        <button class="tab ${_activeTab === "inventory" ? "active" : ""}" data-tab="inventory">📦 Magazyn (${_items.length})</button>
        <button class="tab ${_activeTab === "budget" ? "active" : ""}" data-tab="budget">💰 Budżet</button>
      </div>

      <div id="inv-content"></div>
    </div>
  `;

  renderContent(container);
  bindEvents(container);
}

function renderContent(container) {
  const content = container.querySelector("#inv-content");
  if (!content) return;

  if (_activeTab === "inventory") content.innerHTML = renderInventory();
  else content.innerHTML = renderBudget();

  bindTabEvents(container);
}

// ============================================================================
// TAB: INVENTORY
// ============================================================================

function renderInventory() {
  const filtered = _items.filter(i => i.status === _invFilter);

  return `
    <div class="row" style="gap:8px;margin-bottom:12px;">
      <button class="btn btn-primary" id="btn-add-item" style="flex:1;"><i class="fa-solid fa-plus"></i> Dodaj produkt</button>
    </div>

    <div style="overflow-x:auto;padding-bottom:4px;margin-bottom:12px;">
      <div class="row" style="gap:6px;flex-wrap:nowrap;">
        ${INVENTORY_STATUS.map(s => `
          <button class="chip ${_invFilter === s.id ? "active" : ""}" data-status-filter="${s.id}">
            ${s.icon} ${s.name} (${_items.filter(i => i.status === s.id).length})
          </button>
        `).join("")}
      </div>
    </div>

    ${filtered.length === 0 ? `
      <div class="empty">
        <div class="empty-icon">📦</div>
        <div class="empty-title">${_invFilter === "owned" ? "Brak posiadanych" : _invFilter === "wishlist" ? "Wishlist pusta" : "Brak zużytych"}</div>
        <div class="empty-text">Dodaj pierwszy produkt.</div>
      </div>
    ` : `
      <div class="stack-sm">
        ${filtered.map(item => renderInventoryItem(item)).join("")}
      </div>
    `}
  `;
}

function renderInventoryItem(item) {
  const cat = getInventoryCategory(item.category);
  const status = getInventoryStatus(item.status);
  return `
    <div class="card card-padded-sm">
      <div class="row-between">
        <div style="flex:1;min-width:0;">
          <div class="row" style="gap:6px;flex-wrap:wrap;">
            <span class="text-sm font-bold">${escapeHtml(item.name)}</span>
            ${cat ? `<span class="badge badge-neutral" style="font-size:9px;">${cat.icon} ${cat.name}</span>` : ""}
          </div>
          <div class="text-xs text-tertiary mt-1">
            ${item.brand ? escapeHtml(item.brand) + " · " : ""}
            ${item.price ? item.price + " zł" : "brak ceny"}
            ${item.quantity ? " · " + item.quantity : ""}
          </div>
          ${item.notes ? `<div class="text-xs text-secondary mt-1" style="line-height:1.4;">${escapeHtml(item.notes)}</div>` : ""}
        </div>
        <div class="row" style="gap:4px;">
          <button class="btn-icon btn-icon-sm" data-edit-item="${item.id}"><i class="fa-solid fa-pen"></i></button>
          <button class="btn-icon btn-icon-sm" data-del-item="${item.id}" style="color:var(--danger);"><i class="fa-solid fa-xmark"></i></button>
        </div>
      </div>
    </div>
  `;
}

// ============================================================================
// TAB: BUDGET
// ============================================================================

function renderBudget() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const monthSpend = getMonthSpend(_budget, year, month);
  const limit = _budget.monthlyLimit || 0;
  const pct = limit > 0 ? Math.min(100, Math.round((monthSpend / limit) * 100)) : 0;
  const monthTx = getTransactionsByMonth(_budget, year, month);

  return `
    <div class="card">
      <div class="card-header"><div class="card-title">💰 Budżet miesięczny</div></div>
      <div class="form-group">
        <label class="form-label">Limit miesięczny (zł)</label>
        <div class="input-group">
          <input type="number" class="input" id="budget-limit" value="${limit || ""}" placeholder="np. 100">
          <div class="input-group-suffix">zł</div>
        </div>
      </div>
      <button class="btn btn-secondary btn-block mt-2" id="btn-save-limit">Zapisz limit</button>
      ${limit > 0 ? `
        <div class="mt-3">
          <div class="row-between mb-1">
            <span class="text-xs text-secondary">Wydane w tym miesiącu</span>
            <span class="text-sm font-bold ${pct > 100 ? "text-danger" : pct > 80 ? "text-warning" : "text-accent"}">${monthSpend} / ${limit} zł (${pct}%)</span>
          </div>
          <div class="progress progress-lg">
            <div class="progress-fill" style="width:${pct}%;background:${pct > 100 ? "var(--danger)" : pct > 80 ? "var(--warning)" : "var(--accent)"};"></div>
          </div>
        </div>
      ` : ""}
    </div>

    <div class="row mt-4" style="gap:8px;">
      <button class="btn btn-primary" id="btn-add-tx" style="flex:1;"><i class="fa-solid fa-plus"></i> Dodaj wydatek</button>
    </div>

    <div class="mt-4">
      <div class="section-header"><span class="section-header-title">Wydatki (${monthTx.length} w tym miesiącu)</span></div>
      ${monthTx.length === 0 ? `
        <div class="empty"><div class="empty-icon">💰</div><div class="empty-text">Brak wydatków w tym miesiącu.</div></div>
      ` : `
        <div class="stack-sm">
          ${monthTx.map(tx => renderTransaction(tx)).join("")}
        </div>
      `}
    </div>

    <div class="card mt-4">
      <div class="row-between">
        <span class="text-sm text-secondary">Suma wszystkich wydatków</span>
        <span class="text-lg font-bold text-accent">${getTotalSpend(_budget)} zł</span>
      </div>
    </div>
  `;
}

function renderTransaction(tx) {
  const cat = getBudgetCategory(tx.category);
  return `
    <div class="card card-padded-sm">
      <div class="row-between">
        <div style="flex:1;min-width:0;">
          <div class="row" style="gap:6px;flex-wrap:wrap;">
            <span class="text-sm font-bold">${escapeHtml(tx.name)}</span>
            ${cat ? `<span class="badge badge-neutral" style="font-size:9px;">${cat.icon} ${cat.name}</span>` : ""}
          </div>
          <div class="text-xs text-tertiary mt-1">${tx.date}${tx.note ? " · " + escapeHtml(tx.note) : ""}</div>
        </div>
        <div class="row" style="gap:6px;align-items:center;">
          <span class="text-sm font-bold text-accent">${tx.amount} zł</span>
          <button class="btn-icon btn-icon-sm" data-del-tx="${tx.id}" style="color:var(--danger);"><i class="fa-solid fa-xmark"></i></button>
        </div>
      </div>
    </div>
  `;
}

// ============================================================================
// MODALE
// ============================================================================

function openItemModal(existing) {
  const isEdit = !!existing;
  const data = existing ? { ...existing } : {
    name: "", brand: "", category: "cosmetics", status: "owned", price: "", quantity: "1", notes: ""
  };

  const body = document.createElement("div");
  body.innerHTML = `
    <div class="stack">
      <div class="form-group">
        <label class="form-label">Nazwa</label>
        <input class="input" id="it-name" value="${escapeHtml(data.name)}" placeholder="np. Kwas hialuronowy 2%">
      </div>
      <div class="form-group">
        <label class="form-label">Marka (opcjonalnie)</label>
        <input class="input" id="it-brand" value="${escapeHtml(data.brand || "")}" placeholder="np. The Ordinary">
      </div>
      <div class="form-group">
        <label class="form-label">Kategoria</label>
        <select class="input" id="it-cat">
          ${INVENTORY_CATEGORIES.map(c => `<option value="${c.id}" ${data.category === c.id ? "selected" : ""}>${c.icon} ${c.name}</option>`).join("")}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Status</label>
        <div class="row" style="gap:6px;">
          ${INVENTORY_STATUS.map(s => `
            <button class="chip ${data.status === s.id ? "active" : ""}" data-status="${s.id}">${s.icon} ${s.name}</button>
          `).join("")}
        </div>
      </div>
      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">Cena (zł)</label>
          <input type="number" step="0.01" class="input" id="it-price" value="${data.price || ""}" placeholder="np. 39.99">
        </div>
        <div class="form-group">
          <label class="form-label">Ilość</label>
          <input type="number" class="input" id="it-qty" value="${data.quantity || "1"}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Notatki</label>
        <textarea class="textarea" id="it-notes" placeholder="np. termin ważności, uwagi">${escapeHtml(data.notes || "")}</textarea>
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
        onClick: () => {
          const name = body.querySelector("#it-name").value.trim();
          if (!name) { showToast("Podaj nazwę", "error"); return; }
          const itemData = {
            name,
            brand: body.querySelector("#it-brand").value.trim(),
            category: body.querySelector("#it-cat").value,
            status,
            price: parseFloat(body.querySelector("#it-price").value) || 0,
            quantity: parseInt(body.querySelector("#it-qty").value) || 1,
            notes: body.querySelector("#it-notes").value.trim()
          };
          if (isEdit) {
            updateInventoryItem(existing.id, itemData);
            showToast("✅ Zapisano", "success");
          } else {
            addInventoryItem(itemData);
            showToast("✅ Dodano", "success");
          }
          _items = loadInventory();
          const container = document.getElementById("inventory-content");
          if (container) render(container);
        }
      }
    ]
  });
}

function openTxModal() {
  const body = document.createElement("div");
  body.innerHTML = `
    <div class="stack">
      <div class="form-group">
        <label class="form-label">Nazwa wydatku</label>
        <input class="input" id="tx-name" placeholder="np. Kwas hialuronowy">
      </div>
      <div class="form-group">
        <label class="form-label">Kategoria</label>
        <select class="input" id="tx-cat">
          ${BUDGET_CATEGORIES.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join("")}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Kwota (zł)</label>
        <div class="input-group">
          <input type="number" step="0.01" class="input" id="tx-amount" placeholder="np. 39.99">
          <div class="input-group-suffix">zł</div>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Data</label>
        <input type="date" class="input" id="tx-date" value="${dateKey(new Date())}">
      </div>
      <div class="form-group">
        <label class="form-label">Notatka (opcjonalnie)</label>
        <input class="input" id="tx-note" placeholder="np. Rossmann">
      </div>
    </div>
  `;

  openModal({
    title: "Nowy wydatek",
    body,
    actions: [
      { label: "Anuluj", variant: "ghost" },
      {
        label: "Dodaj",
        variant: "primary",
        onClick: () => {
          const name = body.querySelector("#tx-name").value.trim();
          const amount = parseFloat(body.querySelector("#tx-amount").value);
          if (!name) { showToast("Podaj nazwę", "error"); return; }
          if (!amount || amount <= 0) { showToast("Podaj kwotę", "error"); return; }
          addTransaction({
            name,
            category: body.querySelector("#tx-cat").value,
            amount,
            date: body.querySelector("#tx-date").value,
            note: body.querySelector("#tx-note").value.trim()
          });
          _budget = loadBudget();
          showToast("✅ Dodano", "success");
          const container = document.getElementById("inventory-content");
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
  container.querySelectorAll("#inv-tabs [data-tab]").forEach(tab => {
    tab.addEventListener("click", () => {
      _activeTab = tab.dataset.tab;
      container.querySelectorAll("#inv-tabs [data-tab]").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      renderContent(container);
    });
  });
}

function bindTabEvents(container) {
  // Inventory
  container.querySelector("#btn-add-item")?.addEventListener("click", () => openItemModal(null));

  container.querySelectorAll("[data-status-filter]").forEach(chip => {
    chip.addEventListener("click", () => {
      _invFilter = chip.dataset.statusFilter;
      renderContent(container);
    });
  });

  container.querySelectorAll("[data-edit-item]").forEach(btn => {
    btn.addEventListener("click", () => {
      const item = _items.find(i => i.id === btn.dataset.editItem);
      if (item) openItemModal(item);
    });
  });

  container.querySelectorAll("[data-del-item]").forEach(btn => {
    btn.addEventListener("click", () => {
      if (!confirm("Usunąć produkt?")) return;
      _items = deleteInventoryItem(btn.dataset.delItem);
      showToast("Usunięto", "");
      renderContent(container);
    });
  });

  // Budget
  container.querySelector("#btn-save-limit")?.addEventListener("click", () => {
    const limit = parseFloat(container.querySelector("#budget-limit").value) || 0;
    _budget.monthlyLimit = limit;
    saveBudget(_budget);
    showToast("✅ Limit zapisany", "success");
    renderContent(container);
  });

  container.querySelector("#btn-add-tx")?.addEventListener("click", openTxModal);

  container.querySelectorAll("[data-del-tx]").forEach(btn => {
    btn.addEventListener("click", () => {
      if (!confirm("Usunąć wydatek?")) return;
      _budget = deleteTransaction(btn.dataset.delTx);
      showToast("Usunięto", "");
      renderContent(container);
    });
  });
}
