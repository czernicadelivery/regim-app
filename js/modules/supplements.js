// ============================================================================
// LOCK IN 2027 — js/modules/supplements.js
// Suplementy: D3, kreatyna, historia przyjmowania.
// ============================================================================

import { $, escapeHtml, todayKey } from "../core/utils.js";
import { getSettings, getToggle, setToggle } from "../core/storage.js";
import { localKey } from "../core/storage.js";
import { state } from "../state.js";
import { showToast } from "../components/toast.js";

function loadSuppHistory() {
  try {
    return JSON.parse(localStorage.getItem(localKey("supp-history")) || "{}");
  } catch (e) { return {}; }
}

function saveSuppHistory(h) {
  localStorage.setItem(localKey("supp-history"), JSON.stringify(h));
}

function markTaken(id) {
  const h = loadSuppHistory();
  const tk = todayKey();
  h[tk] = h[tk] || {};
  h[tk][id] = !h[tk][id];
  saveSuppHistory(h);
  return h[tk][id];
}

function renderSupplementCard(id, icon, name, dose, color) {
  const h = loadSuppHistory();
  const tk = todayKey();
  const taken = h[tk] && h[tk][id];
  return `
    <div class="card card-padded-sm" data-supp="${id}" style="${taken ? "background:var(--accent-subtle);border-color:var(--accent-medium);" : ""}">
      <div class="row-between">
        <div class="row" style="gap:12px;align-items:center;">
          <div style="font-size:28px;">${icon}</div>
          <div>
            <div class="list-item-title">${escapeHtml(name)}</div>
            <div class="list-item-subtitle">${escapeHtml(dose)}</div>
          </div>
        </div>
        <button class="btn-icon" data-supp-toggle="${id}">
          <i class="fa-solid fa-${taken ? "check" : "plus"}" style="color:${taken ? "var(--accent)" : "var(--text-secondary)"};"></i>
        </button>
      </div>
    </div>
  `;
}

function renderSupplementsList() {
  const s = getSettings();
  return `
    <div class="stack-sm">
      ${renderSupplementCard("d3", "💊", "Witamina D3", `${s.d3Iu * s.d3Tablets} IU (${s.d3Tablets} tabl.)`, "warning")}
      ${renderSupplementCard("creatine", "⚡", "Kreatyna", "3-5g", "info")}
      ${renderSupplementCard("omega3", "🐟", "Omega-3", "1000 mg", "success")}
    </div>
  `;
}

function renderHistory() {
  const h = loadSuppHistory();
  const keys = Object.keys(h).sort().reverse().slice(0, 14);
  if (!keys.length) return `<div class="empty"><div class="empty-icon">📊</div><div class="empty-text">Brak historii</div></div>`;

  return `
    <div class="stack-sm">
      ${keys.map(k => {
        const day = h[k];
        const items = ["d3", "creatine", "omega3"].filter(id => day[id]);
        if (!items.length) return "";
        return `
          <div class="card card-padded-sm">
            <div class="text-xs text-tertiary mb-1">${k}</div>
            <div class="row" style="gap:6px;flex-wrap:wrap;">
              ${items.map(i => `<span class="badge badge-success">${i}</span>`).join("")}
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

export async function render(container) {
  container.innerHTML = `
    <div class="stack-lg">
      <div class="card card-accent">
        <div class="card-header">
          <div class="card-title">💊 Dziś</div>
          <div class="text-xs text-tertiary">${todayKey()}</div>
        </div>
        <div id="supp-list">${renderSupplementsList()}</div>
      </div>

      <div>
        <div class="section-header"><span class="section-header-title">Historia (14 dni)</span></div>
        <div id="supp-history">${renderHistory()}</div>
      </div>

      <div class="card">
        <div class="card-header"><div class="card-title">💡 Ważne</div></div>
        <ul class="text-sm text-secondary" style="line-height:1.7;padding-left:20px;">
          <li>D3 max 4000 IU dziennie (nastolatek)</li>
          <li>Kreatyna 3-5g — wymaga 2.5-3L wody</li>
          <li>Suplementy to dodatek, nie podstawa</li>
          <li>Nie przyjmuj dawek bez konsultacji</li>
        </ul>
      </div>
    </div>
  `;

  container.querySelectorAll("[data-supp-toggle]").forEach(btn => {
    btn.addEventListener("click", () => {
      const taken = markTaken(btn.dataset.suppToggle);
      $("supp-list").innerHTML = renderSupplementsList();
      $("supp-history").innerHTML = renderHistory();
      bindToggles();
      showToast(taken ? "✅ Zapisano" : "Odznaczono", taken ? "success" : "");
    });
  });

  bindToggles();
}

function bindToggles() {
  document.querySelectorAll("[data-supp-toggle]").forEach(btn => {
    // re-bind after re-render
    const clone = btn.cloneNode(true);
    btn.parentNode.replaceChild(clone, btn);
    clone.addEventListener("click", () => {
      const taken = markTaken(clone.dataset.suppToggle);
      $("supp-list").innerHTML = renderSupplementsList();
      $("supp-history").innerHTML = renderHistory();
      bindToggles();
      showToast(taken ? "✅ Zapisano" : "Odznaczono", taken ? "success" : "");
    });
  });
}
