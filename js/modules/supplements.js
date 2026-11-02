// ============================================================================
// LOCK IN 2027 — js/modules/supplements.js
// Katalog suplementów + własne wpisy + historia przyjmowania.
// ============================================================================

import { $, escapeHtml, dateKey } from "../core/utils.js";
import { loadSupplements, saveSupplement, deleteSupplement, loadSupplementLogs, logSupplement } from "../core/data.js";
import { showToast } from "../components/toast.js";
import { openModal } from "../components/modal.js";

const CATALOG = [
  { id: "d3", name: "Witamina D3", unit: "IU", category: "vitamin", info: "Wspiera kości i odporność. Dawkę ustala lekarz." },
  { id: "c", name: "Witamina C", unit: "mg", category: "vitamin", info: "Antyoksydant, wspiera odporność." },
  { id: "b-complex", name: "Witaminy z grupy B", unit: "mg", category: "vitamin", info: "Wspierają metabolizm i układ nerwowy." },
  { id: "magnesium", name: "Magnez", unit: "mg", category: "mineral", info: "Wspiera mięśnie i układ nerwowy." },
  { id: "zinc", name: "Cynk", unit: "mg", category: "mineral", info: "Wspiera odporność i skórę." },
  { id: "omega3", name: "Omega-3", unit: "mg", category: "fat", info: "Zdrowie serca i mózgu." },
  { id: "creatine", name: "Kreatyna", unit: "g", category: "sport", info: "Wspiera siłę i masę mięśniową." },
  { id: "electrolytes", name: "Elektrolity", unit: "g", category: "sport", info: "Nawodnienie, równowaga elektrolitowa." },
  { id: "protein", name: "Białko", unit: "g", category: "sport", info: "Uzupełnienie diety." }
];

let _supps = [];
let _logs = {};

export async function render(container) {
  _supps = await loadSupplements();
  _logs = await loadSupplementLogs(_supps.map(s => s.id));

  const active = _supps.filter(s => s.isActive !== false);
  const inactive = _supps.filter(s => s.isActive === false);

  container.innerHTML = `
    <div class="stack-lg">
      <div class="card card-accent">
        <div class="card-header">
          <div>
            <div class="card-subtitle">DZIŚ · ${dateKey(new Date())}</div>
            <div class="card-title" style="margin-top:4px;">Twoje suplementy (${active.length})</div>
          </div>
          <button class="btn btn-primary" id="btn-add-supp"><i class="fa-solid fa-plus"></i> Dodaj</button>
        </div>
      </div>

      <div id="active-list">
        ${active.length ? active.map(s => renderSupp(s, true)).join("") : renderEmpty()}
      </div>

      ${inactive.length ? `
        <div>
          <div class="section-header"><span class="section-header-title">Nieaktywne (${inactive.length})</span></div>
          <div>${inactive.map(s => renderSupp(s, false)).join("")}</div>
        </div>
      ` : ""}

      <div class="card">
        <div class="card-header"><div class="card-title">💡 Ważne</div></div>
        <ul class="text-sm text-secondary" style="line-height:1.7;padding-left:20px;">
          <li>Dawki ustalasz samodzielnie — aplikacja nie sugeruje dawek.</li>
          <li>Skonsultuj suplementację z lekarzem lub dietetykiem.</li>
          <li>To nie jest porada medyczna.</li>
        </ul>
      </div>
    </div>
  `;

  $("btn-add-supp")?.addEventListener("click", openAddModal);
  container.querySelectorAll("[data-toggle-supp]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.toggleSupp;
      const newVal = !_logs[id];
      await logSupplement(id, newVal);
      _logs[id] = newVal;
      const container2 = document.getElementById("supplements-content");
      if (container2) render(container2);
    });
  });
  container.querySelectorAll("[data-edit-supp]").forEach(btn => {
    btn.addEventListener("click", () => {
      const s = _supps.find(x => x.id === btn.dataset.editSupp);
      if (s) openEditModal(s);
    });
  });
}

function renderEmpty() {
  return `<div class="empty">
    <div class="empty-icon">💊</div>
    <div class="empty-title">Brak suplementów</div>
    <div class="empty-text">Dodaj pierwszy suplement z katalogu lub własny.</div>
  </div>`;
}

function renderSupp(s, active) {
  const taken = _logs[s.id] === true;
  return `
    <div class="card card-padded-sm mb-2" style="${taken ? "background:var(--accent-subtle);border-color:var(--accent-medium);" : ""}">
      <div class="row-between">
        <div style="flex:1;min-width:0;">
          <div class="text-sm font-bold">${escapeHtml(s.name)}</div>
          <div class="text-xs text-tertiary mt-1">${escapeHtml(s.dose || "")} ${escapeHtml(s.unit || "")} · ${escapeHtml(s.frequency || "codziennie")}</div>
        </div>
        <div class="row" style="gap:6px;">
          ${active ? `<button class="btn-icon btn-icon-sm" data-toggle-supp="${s.id}" title="Przyjęty">
            <i class="fa-solid fa-${taken ? "check" : "plus"}" style="color:${taken ? "var(--accent)" : "var(--text-secondary)"};"></i>
          </button>` : ""}
          <button class="btn-icon btn-icon-sm" data-edit-supp="${s.id}" title="Edytuj"><i class="fa-solid fa-pen"></i></button>
        </div>
      </div>
    </div>
  `;
}

function openAddModal() {
  const body = document.createElement("div");
  body.innerHTML = `
    <div class="stack">
      <div class="form-group">
        <label class="form-label">Wybierz z katalogu (opcjonalnie)</label>
        <select class="input" id="sup-catalog">
          <option value="">— własny suplement —</option>
          ${CATALOG.map(c => `<option value="${c.id}">${c.name}</option>`).join("")}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Nazwa</label>
        <input class="input" id="sup-name" placeholder="np. Witamina D3">
      </div>
      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">Dawka</label>
          <input class="input" id="sup-dose" placeholder="np. 2000">
        </div>
        <div class="form-group">
          <label class="form-label">Jednostka</label>
          <input class="input" id="sup-unit" placeholder="np. IU">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Częstotliwość</label>
        <input class="input" id="sup-freq" placeholder="np. codziennie" value="codziennie">
      </div>
      <div class="form-group">
        <label class="form-label">Notatki (opcjonalnie)</label>
        <textarea class="textarea" id="sup-notes" placeholder="np. przyjmować z posiłkiem"></textarea>
      </div>
      <div class="text-xs text-tertiary" id="sup-info"></div>
    </div>
  `;

  body.querySelector("#sup-catalog")?.addEventListener("change", (e) => {
    const c = CATALOG.find(x => x.id === e.target.value);
    const infoEl = body.querySelector("#sup-info");
    if (c) {
      body.querySelector("#sup-name").value = c.name;
      body.querySelector("#sup-unit").value = c.unit;
      infoEl.textContent = c.info;
    } else {
      infoEl.textContent = "";
    }
  });

  openModal({
    title: "Nowy suplement",
    body,
    actions: [
      { label: "Anuluj", variant: "ghost" },
      {
        label: "Zapisz",
        variant: "primary",
        onClick: async () => {
          const name = body.querySelector("#sup-name").value.trim();
          if (!name) { showToast("Podaj nazwę", "error"); return; }
          try {
            await saveSupplement(null, {
              name,
              dose: body.querySelector("#sup-dose").value.trim(),
              unit: body.querySelector("#sup-unit").value.trim(),
              frequency: body.querySelector("#sup-freq").value.trim(),
              notes: body.querySelector("#sup-notes").value.trim(),
              isActive: true,
              createdAt: new Date().toISOString()
            });
            showToast("✅ Dodano", "success");
            const c = document.getElementById("supplements-content");
            if (c) render(c);
          } catch (e) {
            console.error(e); showToast("Błąd zapisu", "error");
          }
        }
      }
    ]
  });
}

function openEditModal(s) {
  const body = document.createElement("div");
  body.innerHTML = `
    <div class="stack">
      <div class="form-group">
        <label class="form-label">Nazwa</label>
        <input class="input" id="sup-name" value="${escapeHtml(s.name)}">
      </div>
      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">Dawka</label>
          <input class="input" id="sup-dose" value="${escapeHtml(s.dose || "")}">
        </div>
        <div class="form-group">
          <label class="form-label">Jednostka</label>
          <input class="input" id="sup-unit" value="${escapeHtml(s.unit || "")}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Częstotliwość</label>
        <input class="input" id="sup-freq" value="${escapeHtml(s.frequency || "")}">
      </div>
      <div class="form-group">
        <label class="form-label">Notatki</label>
        <textarea class="textarea" id="sup-notes">${escapeHtml(s.notes || "")}</textarea>
      </div>
      <label class="checkbox ${s.isActive !== false ? "checked" : ""}" id="sup-active">
        <div class="checkbox-box">${s.isActive !== false ? '<i class="fa-solid fa-check" style="font-size:12px;"></i>' : ""}</div>
        <div style="flex:1;"><span class="text-sm">Aktywny</span></div>
      </label>
    </div>
  `;

  let isActive = s.isActive !== false;
  body.querySelector("#sup-active")?.addEventListener("click", (e) => {
    e.preventDefault();
    isActive = !isActive;
    e.currentTarget.classList.toggle("checked");
    e.currentTarget.querySelector(".checkbox-box").innerHTML = isActive ? '<i class="fa-solid fa-check" style="font-size:12px;"></i>' : "";
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
          showToast("Usunięto", "success");
          const c = document.getElementById("supplements-content");
          if (c) render(c);
        },
        close: false
      },
      { label: "Anuluj", variant: "ghost" },
      {
        label: "Zapisz", variant: "primary",
        onClick: async () => {
          const name = body.querySelector("#sup-name").value.trim();
          if (!name) { showToast("Podaj nazwę", "error"); return; }
          await saveSupplement(s.id, {
            name,
            dose: body.querySelector("#sup-dose").value.trim(),
            unit: body.querySelector("#sup-unit").value.trim(),
            frequency: body.querySelector("#sup-freq").value.trim(),
            notes: body.querySelector("#sup-notes").value.trim(),
            isActive
          });
          showToast("✅ Zapisano", "success");
          const c = document.getElementById("supplements-content");
          if (c) render(c);
        }
      }
    ]
  });
}
