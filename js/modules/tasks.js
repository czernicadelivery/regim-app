// ============================================================================
// LOCK IN 2027 — js/modules/tasks.js
// Zadania: jeśli profile.modes → generowane z modów. W przeciwnym razie legacy.
// ============================================================================

import { $, escapeHtml, dateKey, todayKey, vibrate, playSound, fireConfetti } from "../core/utils.js";
import { localKey, getToggle, isBoosterActive, getSettings } from "../core/storage.js";
import { TASK_CATEGORIES, BASE_CALISTHENICS, LIGHT_CALISTHENICS } from "../core/constants.js";
import { loadDayDoc, saveDayDoc, loadCustomTasks, saveCustomTasks, loadGamification, saveGamification } from "../core/data.js";
import { calculateDailyXp } from "../core/gamification-engine.js";
import { getTasksFromModes, buildCategoriesFromTasks, CATEGORY_META } from "../core/modes.js";
import { state } from "../state.js";
import { showToast } from "../components/toast.js";

const todayDow = new Date().getDay();
const isSunday = todayDow === 0;

// ============================================================================
// LEGACY: hardcoded tasks (dla userów bez modes)
// ============================================================================

export function buildTrainingTask() {
  if (isSunday) return null;
  if (todayDow === 1) return { id: "trening", label: "🏊 Basen 1,5h", hint: "Poniedziałek", done: false };
  const exercises = isBoosterActive()
    ? BASE_CALISTHENICS.map(e => ({ ...e, boosted: true }))
    : BASE_CALISTHENICS;
  return { id: "trening", label: "💪 Kalistenika + hantle 1kg", hint: "Standardowy plan", done: false, exercises };
}

function applyLegacyTasks() {
  const suppCat = TASK_CATEGORIES.find(c => c.id === "suplementy");
  if (suppCat) {
    if (getToggle("supplements")) {
      const arr = [{ id: "d3", label: "Witamina D3 ×2 tabletki", hint: "Rano", done: false }];
      if (getToggle("creatine")) arr.push({ id: "creatine", label: "Kreatyna 3-5g", hint: "Do wody", done: false });
      suppCat.tasks = arr;
    } else suppCat.tasks = [];
  }

  const treningCat = TASK_CATEGORIES.find(c => c.id === "trening");
  if (treningCat) {
    const t = buildTrainingTask();
    treningCat.tasks = t ? [t] : [];
  }

  const skincareCat = TASK_CATEGORIES.find(c => c.id === "skincare");
  if (skincareCat) {
    if (getToggle("skincare")) {
      skincareCat.tasks = [
        { id: "cold-am", label: "Przemycie twarzy zimną wodą (rano)", done: false },
        { id: "benzacne", label: "Benzacne punktowo", done: false },
        { id: "moisturizer", label: "Krem nawilżający", done: false },
        { id: "cold-pm", label: "Przemycie twarzy zimną wodą (wieczór)", done: false }
      ];
    } else skincareCat.tasks = [];
  }

  const mentalCat = TASK_CATEGORIES.find(c => c.id === "mental");
  if (mentalCat) {
    const arr = [
      { id: "nofap", label: "NoFap — zero pornografii", done: false },
      { id: "milk-night", label: "Szklanka mleka przed snem", done: false },
      { id: "vent-room", label: "Wietrzenie pokoju 2 min", done: false }
    ];
    if (getToggle("jawline")) { arr.push({ id: "mewing", label: "Mewing", done: false }); arr.push({ id: "postawa", label: "Kontrola postawy", done: false }); }
    if (getToggle("beast")) arr.push({ id: "cold-shower", label: "Zimny prysznic 2 min", done: false });
    mentalCat.tasks = arr;
  }

  const masaCat = TASK_CATEGORIES.find(c => c.id === "masa");
  if (masaCat) masaCat.tasks = [{ id: "shake", label: "Szejk masowy / 80g białka", done: false }];

  const pomiaryCat = TASK_CATEGORIES.find(c => c.id === "pomiary");
  if (pomiaryCat) {
    pomiaryCat.tasks = isSunday ? [
      { id: "pomiar-waga", label: "Pomiar wagi", done: false },
      { id: "zarost", label: "Trymowanie zarostu", done: false },
      { id: "paznokcie", label: "Paznokcie", done: false }
    ] : [];
  }
}

// ============================================================================
// MODE-BASED: generuje kategorie z modes
// ============================================================================

function applyModeTasks(modes) {
  // 1. Zbierz zadania z modów
  const modeTasks = getTasksFromModes(modes);

  // 2. Zbuduj kategorie z tych zadań
  const newCategories = buildCategoriesFromTasks(modeTasks);

  // 3. Dodaj kategorię Custom (zawsze)
  newCategories.push({ id: "custom", icon: CATEGORY_META.custom.icon, name: CATEGORY_META.custom.name, order: 999, tasks: [] });

  // 4. Mutacja TASK_CATEGORIES in-place (zachowuje referencję dla innych modułów)
  TASK_CATEGORIES.length = 0;
  newCategories.forEach(c => TASK_CATEGORIES.push(c));
}

// ============================================================================
// GŁÓWNA FUNKCJA — decyduje: mode-based czy legacy
// ============================================================================

export function applyConditionalTasks() {
  const profile = state.profile || {};
  const modes = Array.isArray(profile.modes) ? profile.modes : [];

  if (modes.length > 0) {
    applyModeTasks(modes);
  } else {
    applyLegacyTasks();
  }

  // Custom tasks (zawsze)
  const customCat = TASK_CATEGORIES.find(c => c.id === "custom");
  if (customCat) {
    customCat.tasks = state.customTasks.map(t => ({
      id: t.id, label: t.label, hint: t.hint, done: t.done || false, custom: true
    }));
  }

  syncStateFromCategories();
}

export function syncStateFromCategories() {
  state.tasks = TASK_CATEGORIES.flatMap(c => c.tasks).map(t => ({
    id: t.id, label: t.label, done: t.done, custom: !!t.custom
  }));
  const customCat = TASK_CATEGORIES.find(c => c.id === "custom");
  state.customTasks = customCat ? customCat.tasks.map(t => ({ id: t.id, label: t.label, hint: t.hint, done: t.done })) : [];
}

export function calcCompletionPct() {
  if (!state.tasks.length) return 0;
  return Math.round((state.tasks.filter(t => t.done).length / state.tasks.length) * 100);
}

export function calcCompletionStats() {
  return { requiredDone: state.tasks.filter(t => t.done).length, requiredTotal: state.tasks.length };
}

// ============================================================================
// PERSIST + XP (bez zmian)
// ============================================================================

export async function persistToday() {
  syncStateFromCategories();
  const existing = (await loadDayDoc(todayKey())) || {};
  const dayData = {
    ...existing,
    date: todayKey(),
    tasks: state.tasks,
    completedPct: calcCompletionPct(),
    note: state.note,
    morning: { ...(existing.morning || {}), ...state.morning },
    evening: { ...(existing.evening || {}), ...state.evening },
    updatedAt: Date.now()
  };
  await saveDayDoc(dayData);
  await refreshStreak();
  await checkMilestone();
  try { await updateXpFromDay(dayData); }
  catch (e) { console.error("updateXpFromDay error:", e); }
}

async function updateXpFromDay(dayData) {
  const gamData = (await loadGamification()) || { xp: 0, level: 1, dailyXp: {} };
  const today = dayData.date;
  const tasks = dayData.tasks || [];
  const completed = tasks.filter(t => t.done).length;
  const total = tasks.length;
  const streak = state._streak || 0;
  const todayXp = calculateDailyXp(completed, total, streak);
  const savedTodayXp = (gamData.dailyXp && gamData.dailyXp[today]) || 0;

  if (todayXp > savedTodayXp) {
    const diff = todayXp - savedTodayXp;
    const newTotalXp = (gamData.xp || 0) + diff;
    const newLevel = Math.floor(Math.sqrt(newTotalXp / 100)) + 1;
    const newDailyXp = { ...(gamData.dailyXp || {}), [today]: todayXp };
    await saveGamification({ xp: newTotalXp, level: newLevel, dailyXp: newDailyXp });
    showToast(`+${diff} XP`, "success");
  }
}

export async function refreshStreak() {
  const today = await loadDayDoc(todayKey());
  const pctToday = today?.completedPct ?? 0;
  const base = await computeStreakUpTo(todayKey());
  state._streak = pctToday === 100 ? base + 1 : base;
  const el = $("topbar-streak");
  if (el) el.textContent = state._streak;
}

export async function computeStreakUpTo(dateStr) {
  let streak = 0;
  const cursor = new Date(dateStr + "T00:00:00");
  cursor.setDate(cursor.getDate() - 1);
  for (let i = 0; i < 400; i++) {
    const data = await loadDayDoc(dateKey(cursor));
    if (data && data.completedPct === 100) { streak++; cursor.setDate(cursor.getDate() - 1); }
    else break;
  }
  return streak;
}

export async function checkMilestone() {
  const streak = state._streak || 0;
  const milestones = [7, 14, 30, 60, 73];
  const hit = milestones.find(m => streak === m);
  if (!hit || state.lastMilestoneShown === hit) return;
  state.lastMilestoneShown = hit;
  fireConfetti();
  showToast(`🎉 ${hit} dni streak!`, "success");
}

// ============================================================================
// RENDER
// ============================================================================

export async function render(container) {
  state.customTasks = loadCustomTasks();
  applyConditionalTasks();

  const today = await loadDayDoc(todayKey());
  const savedTasks = (today && today.tasks) || [];
  if (savedTasks.length) {
    const map = new Map(savedTasks.map(t => [t.id, t.done]));
    TASK_CATEGORIES.forEach(c => c.tasks.forEach(t => {
      if (map.has(t.id)) t.done = map.get(t.id);
    }));
  }
  syncStateFromCategories();

  container.innerHTML = `
    <div class="card mb-4">
      <div class="card-header">
        <div>
          <div class="card-title">Dziś</div>
          <div class="card-subtitle">${calcCompletionStats().requiredDone}/${calcCompletionStats().requiredTotal} zadań</div>
        </div>
        <div class="text-2xl font-black text-accent" id="tasks-pct">${calcCompletionPct()}%</div>
      </div>
      <div class="progress"><div class="progress-fill" id="tasks-progress" style="width:${calcCompletionPct()}%"></div></div>
    </div>
    <div id="tasks-categories" class="stack-lg"></div>
    <button class="btn btn-secondary btn-block mt-4" id="btn-add-task">
      <i class="fa-solid fa-plus"></i> Dodaj własne zadanie
    </button>
  `;

  renderCategories();

  $("btn-add-task")?.addEventListener("click", async () => {
    const label = prompt("Nazwa zadania:");
    if (!label || !label.trim()) return;
    const hint = prompt("Krótki opis (opcjonalnie):") || "";
    const id = "custom-" + Date.now();
    state.customTasks.push({ id, label: label.trim(), hint: hint.trim(), done: false });
    await saveCustomTasks(state.customTasks);
    applyConditionalTasks();
    await persistToday();
    renderCategories();
    updateHeaderProgress();
    showToast("✅ Dodano", "success");
  });
}

function renderCategories() {
  const wrap = $("tasks-categories");
  if (!wrap) return;
  const visible = TASK_CATEGORIES.filter(c => c.tasks.length > 0);
  if (!visible.length) {
    wrap.innerHTML = `<div class="empty"><div class="empty-icon">📋</div><div class="empty-title">Brak zadań</div><div class="empty-text">Skonfiguruj tryby w onboardingu.</div></div>`;
    return;
  }
  wrap.innerHTML = visible.map(cat => {
    const doneCount = cat.tasks.filter(t => t.done).length;
    const fullDone = doneCount === cat.tasks.length;
    return `
      <div class="card card-padded-sm">
        <div class="card-header">
          <div class="row">
            <div style="width:32px;height:32px;border-radius:10px;background:var(--bg-surface);display:flex;align-items:center;justify-content:center;font-size:16px;">${cat.icon}</div>
            <div class="card-title">${cat.name}</div>
          </div>
          <div class="badge ${fullDone ? "badge-success" : "badge-neutral"}">${doneCount}/${cat.tasks.length}</div>
        </div>
        <div class="stack-sm">${cat.tasks.map(t => renderTaskItem(t)).join("")}</div>
      </div>
    `;
  }).join("");

  wrap.querySelectorAll(".task-item").forEach(el => {
    el.addEventListener("click", async (ev) => {
      if (ev.target.closest(".task-delete")) return;
      const id = el.dataset.taskId;
      let task = null;
      TASK_CATEGORIES.forEach(c => { const f = c.tasks.find(t => t.id === id); if (f) task = f; });
      if (!task) return;
      task.done = !task.done;
      syncStateFromCategories();
      vibrate(20);
      if (task.done) playSound("done");
      await persistToday();
      renderCategories();
      updateHeaderProgress();
      if (task.done && calcCompletionPct() === 100) setTimeout(() => fireConfetti(), 200);
    });
  });

  wrap.querySelectorAll(".task-delete").forEach(btn => {
    btn.addEventListener("click", async (ev) => {
      ev.stopPropagation();
      const id = btn.dataset.taskId;
      if (!confirm("Usunąć?")) return;
      state.customTasks = state.customTasks.filter(t => t.id !== id);
      await saveCustomTasks(state.customTasks);
      applyConditionalTasks();
      await persistToday();
      renderCategories();
      updateHeaderProgress();
    });
  });
}

function renderTaskItem(t) {
  const extra = t.exercises ? `<div class="mt-2 stack-sm">${t.exercises.map(e => `
    <div class="row-between" style="padding:6px 10px;background:var(--bg-surface);border-radius:8px;font-size:11px;">
      <span class="truncate">${escapeHtml(e.label)}</span>
      <span class="text-accent font-bold" style="flex-shrink:0;">${e.series}</span>
    </div>
  `).join("")}</div>` : "";
  const del = t.custom ? `<button class="task-delete btn-icon btn-icon-sm" data-task-id="${t.id}"><i class="fa-solid fa-xmark"></i></button>` : "";
  return `
    <div class="list-item list-item-clickable task-item ${t.done ? "task-done" : ""}" data-task-id="${t.id}" style="${t.done ? "background:var(--accent-subtle);border-color:var(--accent-medium);" : ""}">
      <div class="checkbox-box" style="${t.done ? "background:var(--accent);border-color:var(--accent);color:var(--text-inverse);" : ""}">
        ${t.done ? '<i class="fa-solid fa-check" style="font-size:12px;"></i>' : ""}
      </div>
      <div class="list-item-body">
        <div class="list-item-title ${t.done ? "text-tertiary" : ""}" style="${t.done ? "text-decoration:line-through;" : ""}">${escapeHtml(t.label)}</div>
        ${t.hint ? `<div class="list-item-subtitle">${escapeHtml(t.hint)}</div>` : ""}
        ${extra}
      </div>
      ${del}
    </div>
  `;
}

function updateHeaderProgress() {
  const pct = calcCompletionPct();
  const pctEl = $("tasks-pct");
  const barEl = $("tasks-progress");
  if (pctEl) pctEl.textContent = pct + "%";
  if (barEl) barEl.style.width = pct + "%";
}
