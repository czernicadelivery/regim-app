// ============================================================================
// LOCK IN 2027 — js/modules/fitness.js
// Rekordy sportowe: pompki, podciągnięcia, plank, itd.
// ============================================================================

import { $, escapeHtml } from "../core/utils.js";
import { addFitnessRecord } from "../core/data.js";
import { getFs, getCurrentUser, isCloud } from "../firebase.js";
import { showToast } from "../components/toast.js";
import { openModal } from "../components/modal.js";

const EXERCISES = [
  { id: "pushups", label: "Pompki", unit: "powt.", icon: "💪" },
  { id: "pullups", label: "Podciągnięcia", unit: "powt.", icon: "🏋️" },
  { id: "squats", label: "Przysiady", unit: "powt.", icon: "🦵" },
  { id: "plank", label: "Plank", unit: "sek.", icon: "🧘" },
  { id: "running", label: "Bieganie", unit: "km", icon: "🏃" }
];

let _activeExercise = "pushups";
let _records = [];

export async function render(container) {
  _records = await loadAllRecords();

  container.innerHTML = `
    <div class="stack-lg">
      <div class="tabs" id="fitness-tabs">
        ${EXERCISES.map(e => `<button class="tab ${e.id === _activeExercise ? "active" : ""}" data-ex="${e.id}">${e.icon} ${e.label}</button>`).join("")}
      </div>

      <div class="card card-accent">
        <div class="card-header">
          <div>
            <div class="card-subtitle">REKORD</div>
            <div class="card-title" style="margin-top:4px;" id="current-record">—</div>
          </div>
          <button class="btn btn-primary" id="btn-add-record"><i class="fa-solid fa-plus"></i> Nowy</button>
        </div>
      </div>

      <div>
        <div class="section-header"><span class="section-header-title">Historia</span></div>
        <div id="fitness-history"></div>
      </div>
    </div>
  `;

  renderCurrentTab();
  bindEvents(container);
}

async function loadAllRecords() {
  if (!isCloud()) return [];
  const { fsMod, db } = getFs();
  const uid = getCurrentUser().uid;
  try {
    const q = fsMod.query(
      fsMod.collection(db, "users", uid, "fitnessRecords"),
      fsMod.orderBy("date", "desc"),
      fsMod.limit(200)
    );
    const snap = await fsMod.getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error(e);
    return [];
  }
}

function getExerciseInfo(id) {
  return EXERCISES.find(e => e.id === id) || { label: id, unit: "", icon: "❓" };
}

function renderCurrentTab() {
  const info = getExerciseInfo(_activeExercise);
  const forEx = _records.filter(r => r.exerciseId === _activeExercise);

  const best = forEx.length ? Math.max(...forEx.map(r => Number(r.value) || 0)) : null;
  const recordEl = $("current-record");
  if (recordEl) {
    recordEl.textContent = best != null ? `${best} ${info.unit}` : "Brak danych";
  }

  const historyEl = $("fitness-history");
  if (!historyEl) return;
  if (forEx.length === 0) {
    historyEl.innerHTML = `<div class="empty"><div class="empty-icon">📊</div><div class="empty-title">Brak rekordów</div><div class="empty-text">Dodaj pierwszy wynik.</div></div>`;
    return;
  }

  historyEl.innerHTML = forEx.map(r => {
    let dateStr = "—";
    if (r.date && typeof r.date.toDate === "function") {
      dateStr = r.date.toDate().toLocaleDateString("pl-PL");
    } else if (typeof r.date === "string") {
      dateStr = r.date;
    }
    const isPR = Number(r.value) === best;
    return `
      <div class="card card-padded-sm">
        <div class="row-between">
          <div>
            <div class="text-sm font-bold">${r.value} ${info.unit} ${isPR ? "🏆" : ""}</div>
            <div class="text-xs text-tertiary">${dateStr}</div>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function bindEvents(container) {
  container.querySelectorAll("[data-ex]").forEach(tab => {
    tab.addEventListener("click", () => {
      _activeExercise = tab.dataset.ex;
      container.querySelectorAll("[data-ex]").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      renderCurrentTab();
    });
  });

  $("btn-add-record")?.addEventListener("click", openAddModal);
}

function openAddModal() {
  const info = getExerciseInfo(_activeExercise);
  const body = document.createElement("div");
  body.innerHTML = `
    <div class="form-group">
      <label class="form-label">Wynik (${info.unit})</label>
      <input type="number" step="0.1" class="input" id="fr-value" placeholder="np. 25" autofocus>
    </div>
  `;

  openModal({
    title: `Nowy rekord: ${info.label}`,
    body,
    actions: [
      { label: "Anuluj", variant: "ghost" },
      {
        label: "Zapisz",
        variant: "primary",
        onClick: async () => {
          const v = body.querySelector("#fr-value")?.value;
          if (!v) { showToast("Wpisz wynik", "error"); return; }
          try {
            await addFitnessRecord({
              exerciseId: _activeExercise,
              value: parseFloat(v),
              unit: info.unit
            });
            showToast("✅ Rekord zapisany", "success");
            _records = await loadAllRecords();
            renderCurrentTab();
          } catch (e) {
            console.error(e);
            showToast("Błąd zapisu", "error");
          }
        }
      }
    ]
  });
}
