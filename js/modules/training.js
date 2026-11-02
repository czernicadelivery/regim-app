// ============================================================================
// LOCK IN 2027 — js/modules/training.js
// Biblioteka ćwiczeń, kreator, plan tygodnia, tryb aktywny z timerem, historia.
// ============================================================================

import { $, escapeHtml, todayKey, vibrate, playSound, fireConfetti } from "../core/utils.js";
import { localKey } from "../core/storage.js";
import { EXERCISES_LIBRARY, WORKOUT_PLAN } from "../core/constants.js";
import { state } from "../state.js";
import { showToast } from "../components/toast.js";
import { openModal } from "../components/modal.js";
import { makeBar, COLORS } from "../components/chart.js";

const MUSCLE_GROUPS = [
  { id: "klatka", label: "Klatka piersiowa" },
  { id: "plecy", label: "Plecy" },
  { id: "barki", label: "Barki" },
  { id: "biceps", label: "Biceps" },
  { id: "triceps", label: "Triceps" },
  { id: "brzuch", label: "Brzuch" },
  { id: "nogi", label: "Nogi" },
  { id: "posladki", label: "Pośladki" },
  { id: "cardio", label: "Cardio" },
  { id: "fullbody", label: "Full Body" },
  { id: "recovery", label: "Regeneracja" }
];

const DAY_NAMES = ["Niedziela", "Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota"];

let _activeTab = "today";
let _libraryFilter = "wszystkie";
let _creatorSelection = [];
let _elapsedTimerId = null;

// --- Helpers ------------------------------------------------------------
function findExercise(id) {
  for (const group of Object.values(EXERCISES_LIBRARY)) {
    const found = group.find(e => e.id === id);
    if (found) return found;
  }
  return null;
}

function loadCustomWorkouts() {
  try {
    const raw = localStorage.getItem(localKey("custom-workouts"));
    return raw ? JSON.parse(raw) : [];
  } catch (e) { return []; }
}

function saveCustomWorkouts(list) {
  localStorage.setItem(localKey("custom-workouts"), JSON.stringify(list));
}

function loadCustomPlan() {
  try {
    const raw = localStorage.getItem(localKey("custom-plan"));
    return raw ? JSON.parse(raw) : {};
  } catch (e) { return {}; }
}

function saveCustomPlan(plan) {
  localStorage.setItem(localKey("custom-plan"), JSON.stringify(plan));
}

function getPlanForDay(dow) {
  const custom = loadCustomPlan();
  return custom[dow] || WORKOUT_PLAN[dow] || { type: "rest", label: "Odpoczynek", exercises: [] };
}

function loadHistory() {
  try {
    const raw = localStorage.getItem(localKey("workout-history"));
    return raw ? JSON.parse(raw) : [];
  } catch (e) { return []; }
}

function saveHistory(list) {
  localStorage.setItem(localKey("workout-history"), JSON.stringify(list.slice(0, 100)));
}

// --- Render helpers -----------------------------------------------------
function exerciseCard(ex, compact = false) {
  return `
    <div class="card card-padded-sm" data-exid="${ex.id}">
      <div class="row-between">
        <div style="flex:1;min-width:0;">
          <div class="card-title">${escapeHtml(ex.name)}</div>
          <div class="list-item-subtitle">${escapeHtml(ex.muscle)} · ${escapeHtml(ex.level)} · ${escapeHtml(ex.equipment)}</div>
        </div>
        ${compact ? "" : `<button class="btn-icon btn-icon-sm" data-info="${ex.id}"><i class="fa-solid fa-circle-info"></i></button>`}
      </div>
      ${compact ? "" : `
        <div class="row mt-3" style="gap:8px;flex-wrap:wrap;">
          <span class="badge badge-neutral">${ex.sets} serie</span>
          <span class="badge badge-neutral">${ex.reps}</span>
          <span class="badge badge-neutral">${ex.rest}s odpoczynku</span>
        </div>
        <p class="text-sm text-secondary mt-2" style="line-height:1.5;">${escapeHtml(ex.desc)}</p>
        ${ex.tips ? `<p class="text-xs text-tertiary mt-2">💡 ${escapeHtml(ex.tips)}</p>` : ""}
      `}
    </div>
  `;
}

function exerciseInfoModal(id) {
  const ex = findExercise(id);
  if (!ex) return;
  openModal({
    title: ex.name,
    body: `
      <div class="stack">
        <div class="row" style="gap:6px;flex-wrap:wrap;">
          <span class="badge badge-accent">${escapeHtml(ex.muscle)}</span>
          <span class="badge badge-neutral">${escapeHtml(ex.level)}</span>
          <span class="badge badge-info">${escapeHtml(ex.equipment)}</span>
        </div>
        <p class="text-sm text-secondary" style="line-height:1.6;">${escapeHtml(ex.desc)}</p>
        <div class="row" style="gap:8px;flex-wrap:wrap;">
          <span class="badge badge-neutral">Serie: ${ex.sets}</span>
          <span class="badge badge-neutral">Powtórzenia: ${ex.reps}</span>
          <span class="badge badge-neutral">Odpoczynek: ${ex.rest}s</span>
        </div>
        ${ex.tips ? `<div class="card card-flat"><div class="text-sm text-secondary">💡 <strong>Wskazówka:</strong> ${escapeHtml(ex.tips)}</div></div>` : ""}
      </div>
    `,
    actions: [{ label: "Zamknij", variant: "secondary" }]
  });
}

// --- Tab renderers ------------------------------------------------------
function renderTabs() {
  const tabs = [
    { id: "today", label: "Dziś" },
    { id: "plan", label: "Plan" },
    { id: "library", label: "Biblioteka" },
    { id: "creator", label: "Kreator" },
    { id: "history", label: "Historia" }
  ];
  return `
    <div class="tabs" id="training-tabs">
      ${tabs.map(t => `<button class="tab ${t.id === _activeTab ? "active" : ""}" data-train-tab="${t.id}">${t.label}</button>`).join("")}
    </div>
  `;
}

function renderToday() {
  const dow = new Date().getDay();
  const plan = getPlanForDay(dow);
  const exercises = (plan.exercises || []).map(findExercise).filter(Boolean);

  if (plan.type === "rest" || exercises.length === 0) {
    return `
      <div class="card card-accent">
        <div class="card-header"><div class="card-title">Odpoczynek</div></div>
        <p class="text-sm text-secondary">Dziś odpoczynek — regeneracja to też dyscyplina.</p>
      </div>
    `;
  }

  return `
    <div class="card card-accent">
      <div class="card-header">
        <div>
          <div class="card-subtitle">DZISIAJ</div>
          <div class="card-title" style="margin-top:4px;">${escapeHtml(plan.label)}</div>
        </div>
        <span class="badge badge-accent">${exercises.length} ćwiczeń</span>
      </div>
      <button class="btn btn-primary btn-block mt-3" id="btn-start-workout">
        <i class="fa-solid fa-play"></i> Rozpocznij trening
      </button>
    </div>
    <div class="stack">
      ${exercises.map(ex => exerciseCard(ex, true)).join("")}
    </div>
  `;
}

function renderPlan() {
  const todayDow = new Date().getDay();
  return `
    <div class="stack">
      ${[1, 2, 3, 4, 5, 6, 0].map(dow => {
        const plan = getPlanForDay(dow);
        const isToday = dow === todayDow;
        return `
          <div class="card ${isToday ? "card-accent" : ""} card-padded-sm" data-plan-day="${dow}">
            <div class="row-between">
              <div style="flex:1;min-width:0;">
                <div class="list-item-title">${DAY_NAMES[dow]}</div>
                <div class="list-item-subtitle">${escapeHtml(plan.label)}</div>
              </div>
              <button class="btn-icon btn-icon-sm" data-edit-day="${dow}"><i class="fa-solid fa-pen"></i></button>
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function renderLibrary() {
  const filterChips = [{ id: "wszystkie", label: "Wszystkie" }]
    .concat(MUSCLE_GROUPS.map(g => ({ id: g.id, label: g.label })))
    .map(g => `<button class="chip ${g.id === _libraryFilter ? "active" : ""}" data-filter="${g.id}">${g.label}</button>`)
    .join("");

  let groups = [];
  if (_libraryFilter === "wszystkie") {
    groups = Object.values(EXERCISES_LIBRARY);
  } else if (EXERCISES_LIBRARY[_libraryFilter]) {
    groups = [EXERCISES_LIBRARY[_libraryFilter]];
  }
  const all = groups.flat();

  return `
    <div style="overflow-x:auto;margin-bottom:16px;padding-bottom:4px;">
      <div class="row" style="gap:8px;flex-wrap:nowrap;">${filterChips}</div>
    </div>
    <div class="stack">
      ${all.map(ex => exerciseCard(ex)).join("")}
    </div>
  `;
}

function renderCreator() {
  const totalExercises = Object.values(EXERCISES_LIBRARY).flat();
  const selectedCount = _creatorSelection.length;
  return `
    <div class="card">
      <div class="card-header">
        <div>
          <div class="card-subtitle">KREATOR</div>
          <div class="card-title" style="margin-top:4px;">Nowy trening</div>
        </div>
        <span class="badge badge-accent">${selectedCount} wybranych</span>
      </div>
      <input class="input mt-3" id="creator-name" placeholder="Nazwa treningu (np. Upper Body)">
      <div class="mt-3">
        <div class="form-label mb-2">Wybierz ćwiczenia:</div>
        <div class="stack-sm" style="max-height:340px;overflow-y:auto;">
          ${totalExercises.map(ex => `
            <label class="checkbox ${_creatorSelection.includes(ex.id) ? "checked" : ""}" data-creator-ex="${ex.id}">
              <div class="checkbox-box">${_creatorSelection.includes(ex.id) ? '<i class="fa-solid fa-check" style="font-size:12px;"></i>' : ""}</div>
              <div style="flex:1;min-width:0;">
                <div class="list-item-title">${escapeHtml(ex.name)}</div>
                <div class="list-item-subtitle">${escapeHtml(ex.muscle)} · ${ex.sets}×${ex.reps}</div>
              </div>
            </label>
          `).join("")}
        </div>
      </div>
      <button class="btn btn-primary btn-block mt-3" id="btn-save-workout">
        <i class="fa-solid fa-floppy-disk"></i> Zapisz trening (${selectedCount})
      </button>
    </div>
    <div class="mt-4">
      <div class="section-header"><span class="section-header-title">Moje treningi</span></div>
      <div class="stack-sm" id="custom-workouts-list">
        ${renderCustomWorkoutsList()}
      </div>
    </div>
  `;
}

function renderCustomWorkoutsList() {
  const list = loadCustomWorkouts();
  if (!list.length) return `<div class="empty"><div class="empty-icon">📋</div><div class="empty-text">Brak własnych treningów</div></div>`;
  return list.map(w => `
    <div class="list-item">
      <div class="list-item-body">
        <div class="list-item-title">${escapeHtml(w.name)}</div>
        <div class="list-item-subtitle">${w.exercises.length} ćwiczeń</div>
      </div>
      <button class="btn-icon btn-icon-sm" data-del-workout="${w.id}"><i class="fa-solid fa-trash"></i></button>
    </div>
  `).join("");
}

function renderHistory() {
  const history = loadHistory();
  if (!history.length) {
    return `<div class="empty"><div class="empty-icon">📊</div><div class="empty-title">Brak historii</div><div class="empty-text">Ukończ pierwszy trening, żeby zobaczyć statystyki.</div></div>`;
  }

  return `
    <div class="card">
      <div class="card-header"><div class="card-title">Ćwiczenia na trening</div></div>
      <div class="chart-container"><canvas id="training-history-chart"></canvas></div>
    </div>
    <div class="stack">
      ${history.slice(0, 20).map(h => `
        <div class="card card-padded-sm">
          <div class="row-between">
            <div style="flex:1;min-width:0;">
              <div class="list-item-title">${escapeHtml(h.label)}</div>
              <div class="list-item-subtitle">${h.date} · ${h.exercises?.length || 0} ćwiczeń · ${Math.round((h.duration || 0) / 60)} min</div>
            </div>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

// --- Bind events --------------------------------------------------------
function bindEvents(container) {
  container.querySelectorAll("[data-train-tab]").forEach(tab => {
    tab.addEventListener("click", () => {
      _activeTab = tab.dataset.trainTab;
      render(container);
    });
  });

  $("btn-start-workout")?.addEventListener("click", () => {
    startWorkout(container);
  });

  container.querySelectorAll("[data-filter]").forEach(chip => {
    chip.addEventListener("click", () => {
      _libraryFilter = chip.dataset.filter;
      render(container);
    });
  });

  container.querySelectorAll("[data-info]").forEach(btn => {
    btn.addEventListener("click", () => exerciseInfoModal(btn.dataset.info));
  });

  container.querySelectorAll("[data-creator-ex]").forEach(label => {
    label.addEventListener("click", (ev) => {
      ev.preventDefault();
      const id = label.dataset.creatorEx;
      const idx = _creatorSelection.indexOf(id);
      if (idx >= 0) _creatorSelection.splice(idx, 1);
      else _creatorSelection.push(id);
      render(container);
    });
  });

  $("btn-save-workout")?.addEventListener("click", () => {
    const name = $("creator-name")?.value?.trim();
    if (!name) { showToast("Podaj nazwę treningu", "error"); return; }
    if (!_creatorSelection.length) { showToast("Wybierz co najmniej 1 ćwiczenie", "error"); return; }
    const list = loadCustomWorkouts();
    list.unshift({ id: "w-" + Date.now(), name, exercises: [..._creatorSelection], createdAt: Date.now() });
    saveCustomWorkouts(list);
    _creatorSelection = [];
    showToast("✅ Trening zapisany", "success");
    render(container);
  });

  container.querySelectorAll("[data-del-workout]").forEach(btn => {
    btn.addEventListener("click", () => {
      if (!confirm("Usunąć ten trening?")) return;
      const list = loadCustomWorkouts().filter(w => w.id !== btn.dataset.delWorkout);
      saveCustomWorkouts(list);
      render(container);
    });
  });

  container.querySelectorAll("[data-edit-day]").forEach(btn => {
    btn.addEventListener("click", () => {
      const dow = parseInt(btn.dataset.editDay);
      openPlanDayEditor(dow, container);
    });
  });
}

// --- Plan day editor ----------------------------------------------------
function openPlanDayEditor(dow, container) {
  const current = getPlanForDay(dow);
  const allExercises = Object.values(EXERCISES_LIBRARY).flat();
  let selected = [...(current.exercises || [])];

  const body = document.createElement("div");
  body.innerHTML = `
    <div class="stack">
      <div class="form-group">
        <label class="form-label">Nazwa treningu</label>
        <input class="input" id="plan-edit-label" value="${escapeHtml(current.label || "")}">
      </div>
      <div>
        <div class="form-label mb-2">Ćwiczenia:</div>
        <div class="stack-sm" style="max-height:300px;overflow-y:auto;" id="plan-edit-list">
          ${allExercises.map(ex => `
            <label class="checkbox ${selected.includes(ex.id) ? "checked" : ""}" data-plan-ex="${ex.id}">
              <div class="checkbox-box">${selected.includes(ex.id) ? '<i class="fa-solid fa-check" style="font-size:12px;"></i>' : ""}</div>
              <div style="flex:1;min-width:0;">
                <div class="list-item-title">${escapeHtml(ex.name)}</div>
                <div class="list-item-subtitle">${escapeHtml(ex.muscle)}</div>
              </div>
            </label>
          `).join("")}
        </div>
      </div>
    </div>
  `;

  body.querySelectorAll("[data-plan-ex]").forEach(label => {
    label.addEventListener("click", (ev) => {
      ev.preventDefault();
      const id = label.dataset.planEx;
      const idx = selected.indexOf(id);
      if (idx >= 0) selected.splice(idx, 1);
      else selected.push(id);
      label.classList.toggle("checked");
      const box = label.querySelector(".checkbox-box");
      box.innerHTML = selected.includes(id) ? '<i class="fa-solid fa-check" style="font-size:12px;"></i>' : "";
    });
  });

  openModal({
    title: DAY_NAMES[dow],
    body,
    actions: [
      { label: "Anuluj", variant: "ghost" },
      {
        label: "Zapisz",
        variant: "primary",
        onClick: () => {
          const label = body.querySelector("#plan-edit-label")?.value?.trim() || "Trening";
          const plan = loadCustomPlan();
          plan[dow] = { type: "custom", label, exercises: selected };
          saveCustomPlan(plan);
          showToast("✅ Plan zaktualizowany", "success");
          render(container);
        }
      }
    ]
  });
}

// --- Main render --------------------------------------------------------
export async function render(container) {
  // Jeśli trwa trening — pokaż tryb aktywny
  if (state.activeWorkout) {
    renderActiveWorkout(container);
    return;
  }

  let content = "";
  if (_activeTab === "today") content = renderToday();
  else if (_activeTab === "plan") content = renderPlan();
  else if (_activeTab === "library") content = renderLibrary();
  else if (_activeTab === "creator") content = renderCreator();
  else if (_activeTab === "history") content = renderHistory();

  container.innerHTML = `
    <div class="stack-lg">
      ${renderTabs()}
      <div id="training-body">${content}</div>
    </div>
  `;

  bindEvents(container);

  if (_activeTab === "history") {
    const history = loadHistory();
    if (history.length) {
      const recent = history.slice(0, 10).reverse();
      const labels = recent.map(h => {
        const d = new Date(h.date + "T00:00:00");
        return `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, "0")}`;
      });
      const values = recent.map(h => h.exercises?.length || 0);
      makeBar("training-history-chart", labels, values, COLORS.accent, "Ćwiczenia");
    }
  }
}

// ============================================================================
// TRYB AKTYWNY TRENINGU
// ============================================================================

function startWorkout(container) {
  const dow = new Date().getDay();
  const plan = getPlanForDay(dow);
  const exercises = (plan.exercises || []).map(findExercise).filter(Boolean);
  if (!exercises.length) {
    showToast("Brak ćwiczeń w planie na dziś", "error");
    return;
  }
  state.activeWorkout = {
    label: plan.label || "Trening",
    startTime: Date.now(),
    currentIdx: 0,
    currentSet: 1,
    restTimerId: null,
    restRemaining: 0,
    restTotal: 0,
    completed: exercises.map(ex => ({
      id: ex.id,
      name: ex.name,
      muscle: ex.muscle,
      totalSets: parseInt(ex.sets) || 3,
      reps: ex.reps,
      rest: ex.rest || 60,
      setsDone: 0
    }))
  };
  vibrate(30); playSound("done");
  render(container);
}

function stopRestTimer() {
  if (state.activeWorkout && state.activeWorkout.restTimerId) {
    clearInterval(state.activeWorkout.restTimerId);
    state.activeWorkout.restTimerId = null;
    state.activeWorkout.restRemaining = 0;
    state.activeWorkout.restTotal = 0;
  }
}

function startRestTimer(seconds) {
  stopRestTimer();
  if (!state.activeWorkout) return;
  state.activeWorkout.restRemaining = seconds;
  state.activeWorkout.restTotal = seconds;
  state.activeWorkout.restTimerId = setInterval(() => {
    if (!state.activeWorkout) { stopRestTimer(); return; }
    state.activeWorkout.restRemaining -= 1;
    if (state.activeWorkout.restRemaining <= 0) {
      stopRestTimer();
      vibrate([100, 50, 100]); playSound("done");
    }
    updateRestDisplay();
  }, 1000);
}

function updateRestDisplay() {
  const el = $("rest-timer-display");
  if (!el || !state.activeWorkout) return;
  if (state.activeWorkout.restTimerId && state.activeWorkout.restRemaining > 0) {
    el.style.display = "block";
    const countdown = $("rest-countdown");
    if (countdown) countdown.textContent = state.activeWorkout.restRemaining + "s";
    const pct = 100 - (state.activeWorkout.restRemaining / state.activeWorkout.restTotal) * 100;
    const bar = $("rest-bar");
    if (bar) bar.style.width = pct + "%";
  } else {
    el.style.display = "none";
  }
}

function renderActiveWorkout(container) {
  const w = state.activeWorkout;
  if (!w) { render(container); return; }

  const totalSets = w.completed.reduce((a, c) => a + c.totalSets, 0);
  const doneSets = w.completed.reduce((a, c) => a + c.setsDone, 0);
  const pct = totalSets > 0 ? Math.round((doneSets / totalSets) * 100) : 0;

  const ex = w.completed[w.currentIdx];
  if (!ex) { finishWorkout(container); return; }

  const elapsed = Math.floor((Date.now() - w.startTime) / 1000);
  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  container.innerHTML = `
    <div class="stack-lg">
      <div class="card card-accent">
        <div class="row-between">
          <div>
            <div class="card-subtitle">AKTYWNY TRENING</div>
            <div class="card-title" style="margin-top:4px;">${escapeHtml(w.label)}</div>
          </div>
          <div class="text-right">
            <div class="text-2xl font-black text-accent" id="workout-elapsed" style="font-variant-numeric:tabular-nums;">${mm}:${ss}</div>
            <div class="text-xs text-tertiary">czas</div>
          </div>
        </div>
        <div class="progress progress-lg mt-3"><div class="progress-fill" style="width:${pct}%"></div></div>
        <div class="text-xs text-secondary mt-2">${doneSets} / ${totalSets} serii ukończonych (${pct}%)</div>
      </div>

      <div class="card">
        <div class="row-between mb-2">
          <div class="card-subtitle">ĆWICZENIE ${w.currentIdx + 1} / ${w.completed.length}</div>
          <span class="badge badge-accent">Seria ${w.currentSet} / ${ex.totalSets}</span>
        </div>
        <div class="text-2xl font-black" style="margin-bottom:4px;">${escapeHtml(ex.name)}</div>
        <div class="list-item-subtitle">${escapeHtml(ex.muscle || "")} · ${ex.reps} powtórzeń · ${ex.rest}s odpoczynku</div>

        <div id="rest-timer-display" style="display:none;margin-top:16px;">
          <div class="row-between" style="margin-bottom:8px;">
            <span class="text-sm text-secondary">Odpoczynek</span>
            <span class="text-xl font-black text-accent" id="rest-countdown">0s</span>
          </div>
          <div class="progress progress-lg"><div class="progress-fill" id="rest-bar" style="width:0%"></div></div>
        </div>

        <div class="stack mt-4">
          <button class="btn btn-primary btn-block btn-lg" id="btn-finish-set">
            <i class="fa-solid fa-check"></i> Zakończ serię ${w.currentSet}
          </button>
          <div class="row" style="gap:8px;">
            <button class="btn btn-secondary" id="btn-skip-rest" style="flex:1;"><i class="fa-solid fa-forward"></i> Pomiń odpoczynek</button>
            <button class="btn btn-secondary" id="btn-skip-exercise" style="flex:1;"><i class="fa-solid fa-forward-step"></i> Następne</button>
          </div>
          <button class="btn btn-danger btn-block mt-2" id="btn-cancel-workout">
            <i class="fa-solid fa-xmark"></i> Przerwij trening
          </button>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><div class="card-title">Postęp</div></div>
        <div class="stack-sm">
          ${w.completed.map((c, i) => {
            const done = c.setsDone >= c.totalSets;
            const active = i === w.currentIdx;
            return `
              <div class="list-item" style="${active ? "background:var(--accent-subtle);border-color:var(--accent-medium);" : ""}">
                <div class="checkbox-box" style="${done ? "background:var(--accent);border-color:var(--accent);color:var(--text-inverse);" : ""}">
                  ${done ? '<i class="fa-solid fa-check" style="font-size:12px;"></i>' : ""}
                </div>
                <div class="list-item-body">
                  <div class="list-item-title ${done ? "text-tertiary" : ""}" style="${done ? "text-decoration:line-through;" : ""}">${escapeHtml(c.name)}</div>
                  <div class="list-item-subtitle">${c.setsDone} / ${c.totalSets} serii</div>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    </div>
  `;

  bindActiveWorkout(container);
  updateRestDisplay();
  startElapsedTimer();
}

function startElapsedTimer() {
  if (_elapsedTimerId) clearInterval(_elapsedTimerId);
  _elapsedTimerId = setInterval(() => {
    if (!state.activeWorkout) {
      clearInterval(_elapsedTimerId);
      _elapsedTimerId = null;
      return;
    }
    const el = $("workout-elapsed");
    if (!el) return;
    const elapsed = Math.floor((Date.now() - state.activeWorkout.startTime) / 1000);
    const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
    const ss = String(elapsed % 60).padStart(2, "0");
    el.textContent = `${mm}:${ss}`;
  }, 1000);
}

function bindActiveWorkout(container) {
  $("btn-finish-set")?.addEventListener("click", () => {
    const w = state.activeWorkout;
    if (!w) return;
    const ex = w.completed[w.currentIdx];
    ex.setsDone += 1;
    vibrate(40); playSound("done");

    if (ex.setsDone >= ex.totalSets) {
      if (w.currentIdx < w.completed.length - 1) {
        w.currentIdx += 1;
        w.currentSet = 1;
        startRestTimer(ex.rest);
      } else {
        finishWorkout(container);
        return;
      }
    } else {
      w.currentSet += 1;
      startRestTimer(ex.rest);
    }
    render(container);
  });

  $("btn-skip-rest")?.addEventListener("click", () => {
    stopRestTimer();
    updateRestDisplay();
  });

  $("btn-skip-exercise")?.addEventListener("click", () => {
    const w = state.activeWorkout;
    if (!w) return;
    const ex = w.completed[w.currentIdx];
    ex.setsDone = ex.totalSets;
    if (w.currentIdx < w.completed.length - 1) {
      w.currentIdx += 1;
      w.currentSet = 1;
      stopRestTimer();
      render(container);
    } else {
      finishWorkout(container);
    }
  });

  $("btn-cancel-workout")?.addEventListener("click", () => {
    if (!confirm("Przerwać trening? Postęp zostanie utracony.")) return;
    stopRestTimer();
    if (_elapsedTimerId) { clearInterval(_elapsedTimerId); _elapsedTimerId = null; }
    state.activeWorkout = null;
    render(container);
    showToast("Trening przerwany", "info");
  });
}

function finishWorkout(container) {
  const w = state.activeWorkout;
  if (!w) return;
  stopRestTimer();
  if (_elapsedTimerId) { clearInterval(_elapsedTimerId); _elapsedTimerId = null; }

  const duration = Math.floor((Date.now() - w.startTime) / 1000);
  const totalSets = w.completed.reduce((a, c) => a + c.setsDone, 0);
  const totalExercises = w.completed.filter(c => c.setsDone > 0).length;
  const minutes = Math.round(duration / 60);

  const history = loadHistory();
  history.unshift({
    id: "h-" + Date.now(),
    date: todayKey(),
    label: w.label,
    exercises: w.completed.filter(c => c.setsDone > 0).map(c => ({
      name: c.name,
      sets: c.setsDone,
      reps: c.reps
    })),
    duration,
    totalSets,
    completedAt: Date.now()
  });
  saveHistory(history);

  fireConfetti(); vibrate([80, 60, 80, 60, 120]);

  state.activeWorkout = null;

  openModal({
    title: "🔥 Trening ukończony!",
    body: `
      <div class="stack">
        <div class="grid-2">
          <div class="stat">
            <div class="stat-label">Czas</div>
            <div class="stat-value">${minutes}<span class="stat-unit">min</span></div>
          </div>
          <div class="stat">
            <div class="stat-label">Ćwiczenia</div>
            <div class="stat-value">${totalExercises}</div>
          </div>
          <div class="stat">
            <div class="stat-label">Serie</div>
            <div class="stat-value accent">${totalSets}</div>
          </div>
          <div class="stat">
            <div class="stat-label">Data</div>
            <div class="stat-value" style="font-size:16px;">${todayKey()}</div>
          </div>
        </div>
        <p class="text-sm text-secondary mt-3">Trening zapisany w historii. Dobra robota.</p>
      </div>
    `,
    actions: [{ label: "OK", variant: "primary" }]
  });

  render(container);
}
