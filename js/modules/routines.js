// ============================================================================
// LOCK IN 2027 — js/modules/routines.js
// Routine Builder: lista rutyn, edycja kroków, historia wykonania.
// ============================================================================

import { $, escapeHtml, todayKey, vibrate, playSound, fireConfetti } from "../core/utils.js";
import {
  loadRoutines, saveRoutines, saveRoutine, deleteRoutine,
  loadRoutineHistory, saveRoutineHistory
} from "../core/data.js";
import { state } from "../state.js";
import { showToast } from "../components/toast.js";
import { openModal } from "../components/modal.js";

let _routines = [];
let _history = {};

export async function render(container) {
  _routines = loadRoutines();
  _history = loadRoutineHistory(todayKey());

  const active = _routines.filter(r => !r.archived);

  container.innerHTML = `
    <div class="stack-lg">
      <div class="card card-accent">
        <div class="card-header">
          <div>
            <div class="card-subtitle">DZIŚ · ${todayKey()}</div>
            <div class="card-title" style="margin-top:4px;">Twoje rutyny (${active.length})</div>
          </div>
          <button class="btn btn-primary" id="btn-add-routine"><i class="fa-solid fa-plus"></i> Nowa</button>
        </div>
        <p class="text-sm text-secondary">Każda rutyna to lista kroków. Odhaczaj po kolei w ciągu dnia.</p>
      </div>

      <div id="routines-list" class="stack">
        ${active.length ? active.map(r => renderRoutineCard(r)).join("") : renderEmpty()}
      </div>
    </div>
  `;

  $("btn-add-routine")?.addEventListener("click", () => openRoutineEditor(null, container));
  bindRoutineEvents(container);
}

function renderEmpty() {
  return `<div class="empty">
    <div class="empty-icon">📋</div>
    <div class="empty-title">Brak rutyn</div>
    <div class="empty-text">Stwórz pierwszą rutynę — poranną, wieczorną lub własną.</div>
  </div>`;
}

function renderRoutineCard(r) {
  const hist = _history[r.id] || { steps: {} };
  const total = r.steps.length;
  const done = r.steps.filter(s => hist.steps && hist.steps[s.id]).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const complete = pct === 100 && total > 0;

  return `
    <div class="card" data-routine-id="${r.id}" style="${complete ? "border-color:var(--accent);" : ""}">
      <div class="card-header">
        <div class="row" style="gap:10px;align-items:center;">
          <div style="font-size:28px;">${r.icon || "📋"}</div>
          <div>
            <div class="card-title">${escapeHtml(r.name)}</div>
            <div class="card-subtitle">${done}/${total} kroków</div>
          </div>
        </div>
        <div class="row" style="gap:4px;">
          <button class="btn-icon btn-icon-sm" data-edit-routine="${r.id}" title="Edytuj"><i class="fa-solid fa-pen"></i></button>
          <button class="btn-icon btn-icon-sm" data-del-routine="${r.id}" title="Usuń" style="color:var(--danger);"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>

      <div class="progress progress-sm mb-2"><div class="progress-fill" style="width:${pct}%"></div></div>

      <div class="stack-sm">
        ${r.steps.map(step => {
          const isDone = hist.steps && hist.steps[step.id];
          return `
            <div class="list-item list-item-clickable" data-step-routine="${r.id}" data-step-id="${step.id}"
              style="${isDone ? "background:var(--accent-subtle);border-color:var(--accent-medium);" : ""}">
              <div class="checkbox-box" style="${isDone ? "background:var(--accent);border-color:var(--accent);color:var(--text-inverse);" : ""}">
                ${isDone ? '<i class="fa-solid fa-check" style="font-size:12px;"></i>' : ""}
              </div>
              <div style="font-size:18px;width:24px;">${step.icon || "▫️"}</div>
              <div class="list-item-body">
                <div class="list-item-title ${isDone ? "text-tertiary" : ""}" style="${isDone ? "text-decoration:line-through;" : ""}">
                  ${escapeHtml(step.label)}
                </div>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

function bindRoutineEvents(container) {
  container.querySelectorAll("[data-step-routine]").forEach(el => {
    el.addEventListener("click", (ev) => {
      if (ev.target.closest("[data-edit-routine]") || ev.target.closest("[data-del-routine]")) return;
      const routineId = el.dataset.stepRoutine;
      const stepId = el.dataset.stepId;
      const hist = _history[routineId] || { steps: {} };
      if (!hist.steps) hist.steps = {};
      hist.steps[stepId] = !hist.steps[stepId];
      _history[routineId] = hist;
      saveRoutineHistory(todayKey(), _history);
      vibrate(15);
      if (hist.steps[stepId]) playSound("done");
      render(container);
      const r = _routines.find(x => x.id === routineId);
      if (r) {
        const allDone = r.steps.every(s => hist.steps[s.id]);
        if (allDone) setTimeout(() => fireConfetti(), 200);
      }
    });
  });

  container.querySelectorAll("[data-edit-routine]").forEach(btn => {
    btn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      const r = _routines.find(x => x.id === btn.dataset.editRoutine);
      if (r) openRoutineEditor(r, container);
    });
  });

  container.querySelectorAll("[data-del-routine]").forEach(btn => {
    btn.addEventListener("click", async (ev) => {
      ev.stopPropagation();
      if (!confirm("Usunąć tę rutynę? Historia zostanie zachowana.")) return;
      await deleteRoutine(btn.dataset.delRoutine);
      _routines = loadRoutines();
      render(container);
      showToast("Usunięto", "");
    });
  });
}

function openRoutineEditor(existing, container) {
  const isEdit = !!existing;
  const data = existing
    ? { ...existing, steps: existing.steps.map(s => ({ ...s })) }
    : { id: "rt-" + Date.now(), name: "", icon: "📋", steps: [], archived: false, createdAt: Date.now() };

  const ICONS = ["📋", "🌅", "🌙", "🏋️", "📚", "✨", "🧘", "💪", "🧠", "🔥", "💧", "🍽️"];

  const body = document.createElement("div");
  body.innerHTML = `
    <div class="stack">
      <div class="form-group">
        <label class="form-label">Nazwa rutyny</label>
        <input class="input" id="re-name" value="${escapeHtml(data.name)}" placeholder="np. Rutyna poranna">
      </div>
      <div class="form-group">
        <label class="form-label">Ikona</label>
        <div class="row" style="gap:6px;flex-wrap:wrap;" id="re-icons">
          ${ICONS.map(ic => `
            <button class="chip ${data.icon === ic ? "active" : ""}" data-icon="${ic}" style="font-size:20px;padding:4px 10px;">${ic}</button>
          `).join("")}
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Kroki (${data.steps.length})</label>
        <div id="re-steps" class="stack-sm"></div>
        <div class="row mt-2" style="gap:6px;">
          <input class="input" id="re-new-step" placeholder="np. Wypić szklankę wody" style="flex:1;">
          <button class="btn btn-secondary" id="re-add-step"><i class="fa-solid fa-plus"></i></button>
        </div>
      </div>
    </div>
  `;

  const renderSteps = () => {
    const el = body.querySelector("#re-steps");
    if (!el) return;
    if (data.steps.length === 0) {
      el.innerHTML = `<div class="text-xs text-tertiary">Brak kroków — dodaj pierwszy.</div>`;
      return;
    }
    el.innerHTML = data.steps.map((s, idx) => `
      <div class="list-item">
        <div style="font-size:16px;width:24px;">${s.icon || "▫️"}</div>
        <div class="list-item-body">
          <div class="list-item-title">${escapeHtml(s.label)}</div>
        </div>
        <button class="btn-icon btn-icon-sm" data-remove-step="${idx}" style="color:var(--danger);"><i class="fa-solid fa-xmark"></i></button>
      </div>
    `).join("");
    el.querySelectorAll("[data-remove-step]").forEach(b => {
      b.addEventListener("click", () => {
        data.steps.splice(parseInt(b.dataset.removeStep), 1);
        renderSteps();
        const labelEl = body.querySelectorAll(".form-label")[2];
        if (labelEl) labelEl.textContent = `Kroki (${data.steps.length})`;
      });
    });
  };
  renderSteps();

  body.querySelectorAll("[data-icon]").forEach(btn => {
    btn.addEventListener("click", () => {
      data.icon = btn.dataset.icon;
      body.querySelectorAll("[data-icon]").forEach(x => x.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  const addStepFn = () => {
    const input = body.querySelector("#re-new-step");
    if (!input) return;
    const val = input.value.trim();
    if (!val) return;
    data.steps.push({ id: "s-" + Date.now() + "-" + data.steps.length, label: val, icon: "▫️" });
    input.value = "";
    renderSteps();
    const labelEl = body.querySelectorAll(".form-label")[2];
    if (labelEl) labelEl.textContent = `Kroki (${data.steps.length})`;
  };

  body.querySelector("#re-add-step")?.addEventListener("click", addStepFn);
  body.querySelector("#re-new-step")?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") { e.preventDefault(); addStepFn(); }
  });

  openModal({
    title: isEdit ? "Edytuj rutynę" : "Nowa rutyna",
    body,
    actions: [
      { label: "Anuluj", variant: "ghost" },
      {
        label: isEdit ? "Zapisz" : "Dodaj",
        variant: "primary",
        onClick: async () => {
          const name = body.querySelector("#re-name").value.trim();
          if (!name) { showToast("Podaj nazwę", "error"); return; }
          if (data.steps.length === 0) { showToast("Dodaj co najmniej 1 krok", "error"); return; }
          data.name = name;
          await saveRoutine(data);
          _routines = loadRoutines();
          if (container) render(container);
          showToast("✅ Zapisano", "success");
        }
      }
    ]
  });
}
