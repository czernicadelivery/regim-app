// ============================================================================
// LOCK IN 2027 — js/modules/measurements.js
// Pomiary ciała: waga, obwody, historia, wykres.
// ============================================================================

import { $, escapeHtml } from "../core/utils.js";
import { loadMeasurements, addMeasurement } from "../core/data.js";
import { showToast } from "../components/toast.js";
import { openModal, closeModal } from "../components/modal.js";
import { makeLine, COLORS } from "../components/chart.js";

const FIELDS = [
  { id: "weight", label: "Waga", unit: "kg", step: "0.1" },
  { id: "waist", label: "Obwód pasa", unit: "cm", step: "0.1" },
  { id: "chest", label: "Klatka piersiowa", unit: "cm", step: "0.1" },
  { id: "arms", label: "Obwód ramion", unit: "cm", step: "0.1" },
  { id: "forearms", label: "Przedramiona", unit: "cm", step: "0.1" },
  { id: "thighs", label: "Uda", unit: "cm", step: "0.1" },
  { id: "calves", label: "Łydki", unit: "cm", step: "0.1" },
  { id: "hips", label: "Biodra", unit: "cm", step: "0.1" }
];

let _entries = [];

export async function render(container) {
  _entries = await loadMeasurements();

  container.innerHTML = `
    <div class="stack-lg">
      <div class="card card-accent">
        <div class="card-header">
          <div>
            <div class="card-subtitle">DZIŚ</div>
            <div class="card-title" style="margin-top:4px;">Dodaj pomiar</div>
          </div>
          <button class="btn btn-primary" id="btn-add-measure">
            <i class="fa-solid fa-plus"></i> Nowy
          </button>
        </div>
        <p class="text-sm text-secondary">Wszystkie pola są opcjonalne. Uzupełnij tylko te, które chcesz śledzić.</p>
      </div>

      ${_entries.length ? renderChart() : ""}

      <div>
        <div class="section-header"><span class="section-header-title">Historia (${_entries.length})</span></div>
        <div id="measure-list">
          ${_entries.length ? _entries.map(e => renderEntry(e)).join("") : renderEmpty()}
        </div>
      </div>
    </div>
  `;

  $("btn-add-measure")?.addEventListener("click", openAddModal);

  if (_entries.length) renderChartCanvas();
}

function renderEmpty() {
  return `<div class="empty">
    <div class="empty-icon">📏</div>
    <div class="empty-title">Brak pomiarów</div>
    <div class="empty-text">Dodaj pierwszy pomiar, żeby śledzić postępy.</div>
  </div>`;
}

function renderChart() {
  return `
    <div class="card">
      <div class="card-header"><div class="card-title">Waga — historia</div></div>
      <div class="chart-container"><canvas id="measure-chart"></canvas></div>
    </div>
  `;
}

function renderChartCanvas() {
  const withWeight = _entries.filter(e => e.weight != null).slice().reverse();
  if (withWeight.length < 2) return;
  const labels = withWeight.map(e => {
    if (e.date && typeof e.date.toDate === "function") {
      const d = e.date.toDate();
      return `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, "0")}`;
    }
    return "";
  });
  const values = withWeight.map(e => e.weight);
  makeLine("measure-chart", labels, values, COLORS.accent, "Waga (kg)");
}

function renderEntry(e) {
  let dateStr = "—";
  if (e.date && typeof e.date.toDate === "function") {
    const d = e.date.toDate();
    dateStr = d.toLocaleDateString("pl-PL");
  } else if (typeof e.date === "string") {
    dateStr = e.date;
  }

  const visible = FIELDS.filter(f => e[f.id] != null && e[f.id] !== "");
  return `
    <div class="card card-padded-sm">
      <div class="row-between mb-2">
        <span class="text-xs text-tertiary font-semibold">${dateStr}</span>
        <button class="btn-icon btn-icon-sm" data-del-measure="${e.id}"><i class="fa-solid fa-trash"></i></button>
      </div>
      ${visible.length ? `
        <div class="grid-2">
          ${visible.map(f => `
            <div class="row-between" style="padding:4px 0;">
              <span class="text-xs text-secondary">${f.label}</span>
              <span class="text-sm font-bold">${e[f.id]} ${f.unit}</span>
            </div>
          `).join("")}
        </div>
      ` : `<div class="text-sm text-tertiary">Brak wartości</div>`}
    </div>
  `;
}

function openAddModal() {
  const body = document.createElement("div");
  body.innerHTML = `
    <div class="stack">
      ${FIELDS.map(f => `
        <div class="form-group">
          <label class="form-label">${f.label} (${f.unit})</label>
          <input type="number" step="${f.step}" class="input" id="m-${f.id}" placeholder="opcjonalnie">
        </div>
      `).join("")}
    </div>
  `;

  openModal({
    title: "Nowy pomiar",
    body,
    actions: [
      { label: "Anuluj", variant: "ghost" },
      {
        label: "Zapisz",
        variant: "primary",
        onClick: async () => {
          const data = {};
          FIELDS.forEach(f => {
            const v = body.querySelector(`#m-${f.id}`)?.value;
            if (v !== "" && v != null) data[f.id] = parseFloat(v);
          });
          if (Object.keys(data).length === 0) {
            showToast("Wpisz co najmniej jedną wartość", "error");
            return;
          }
          try {
            await addMeasurement(data);
            showToast("✅ Pomiar zapisany", "success");
            const container = document.getElementById("measurements-content");
            if (container) render(container);
          } catch (err) {
            console.error(err);
            showToast("Błąd zapisu", "error");
          }
        }
      }
    ]
  });
}
