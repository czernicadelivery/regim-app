// ============================================================================
// LOCK IN 2027 — js/modules/tasks.js
// Zadania: mode-based generation + custom CRUD + priority + frequency + archive.
// ============================================================================

import { $, escapeHtml, dateKey, todayKey, vibrate, playSound, fireConfetti } from "../core/utils.js";
import { localKey, getToggle, isBoosterActive, getSettings } from "../core/storage.js";
import { TASK_CATEGORIES, BASE_CALISTHENICS, LIGHT_CALISTHENICS } from "../core/constants.js";
import { loadDayDoc, saveDayDoc, loadCustomTasks, saveCustomTasks, updateCustomTask, deleteCustomTask, archiveCustomTask, restoreCustomTask, loadGamification, saveGamification } from "../core/data.js";
import { calculateDailyXp } from "../core/gamification-engine.js";
import { getTasksFromModes, buildCategoriesFromTasks, CATEGORY_META } from "../core/modes.js";
import { state } from "../state.js";
import { showToast } from "../components/toast.js";
import { openModal } from "../components/modal.js";

const todayDow = new Date().getDay();
const isSunday = todayDow === 0;

// ============================================================================
// LEGACY (dla userów bez modes)
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
// MODE-BASED
// ============================================================================

function applyModeTasks(modes) {
  const modeTasks = getTasksFromModes(modes);
  const newCategories = buildCategoriesFromTasks(modeTasks);
  newCategories.push({ id: "custom", icon: CATEGORY_META.custom.icon, name: CATEGORY_META.custom.name, order: 999, tasks: [] });
  TASK_CATEGORIES.length = 0;
  newCategories.forEach(c => TASK_CATEGORIES.push(c));
}

// ============================================================================
// GŁÓWNA LOGIKA
// ============================================================================

export function applyConditionalTasks() {
  const profile = state.profile || {};
  const modes = Array.isArray(profile.modes) ? profile.modes : [];

  if (modes.length > 0) applyModeTasks(modes);
  else applyLegacyTasks();

  // Custom tasks: filtrujemy archived
  const customCat = TASK_CATEGORIES.find(c => c.id === "custom");
  if (customCat) {
    customCat.tasks = state.customTasks
      .filter(t => !t.archived)
      .map(t => ({
        id: t.id, label: t.label, hint: t.hint, done: t.done || false,
        custom: true, priority: t.priority || "normal", frequency: t.frequency || "daily"
      }));
  }

  syncStateFromCategories();
}

export function syncStateFromCategories() {
  state.tasks = TASK_CATEGORIES.flatMap(c => c.tasks).map(t => ({
    id: t.id, label: t.label, done: t.done, custom: !!t.custom,
    priority: t.priority || "normal", category: c.id
  }));
  const customCat = TASK_CATEGORIES.find(c => c.id === "custom");
  state.customTasks = customCat ? customCat.tasks.map(t => ({
    id: t.id, label: t.label, hint: t.hint, done: t.done, priority: t.priority, frequency: t.frequency
  })) : [];
}

export function calcCompletionPct() {
  if (!state.tasks.length) return 0;
  return Math.round((state.tasks.filter(t => t.done).length / state.tasks.length) * 100);
}

export function calcCompletionStats() {
  return { requiredDone: state.tasks.filter(t => t.done).length, requiredTotal: state.tasks.length };
}

// ============================================================================
// PERSIST + XP
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

  const archivedCount = state.customTasks.filter(t => t.archived).length;

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

    <div class="row mt-4" style="gap:8px;flex-wrap:wrap;">
      <button class="btn btn-primary" id="btn-add-task" style="flex:1;">
        <i class="fa-solid fa-plus"></i> Nowe zadanie
      </button>
      ${archivedCount > 0 ? `
        <button class="btn btn-secondary" id="btn-show-archive" style="flex:1;">
          <i class="fa-solid fa-box-archive"></i> Archiwum (${archivedCount})
        </button>
      ` : ""}
    </div>
  `;

  renderCategories();

  $("btn-add-task")?.addEventListener("click", () => openTaskEditor(null, container));
  $("btn-show-archive")?.addEventListener("click", () => openArchiveModal(container));
}

function renderCategories() {
  const wrap = $("tasks-categories");
  if (!wrap) return;
  const visible = TASK_CATEGORIES.filter(c => c.tasks.length > 0);
  if (!visible.length) {
    wrap.innerHTML = `<div class="empty"><div class="empty-icon">📋</div><div class="empty-title">Brak zadań</div><div class="empty-text">Dodaj własne lub skonfiguruj tryby.</div></div>`;
    return;
  }
  wrap.innerHTML = visible.map(cat => {
    const doneCount = cat.tasks.filter(t => t.done).length;
    const fullDone = doneCount === cat.tasks.length;
    // Sortowanie: high priority first
    const sortedTasks = [...cat.tasks].sort((a, b) => {
      const pr = { high: 0, normal: 1, low: 2 };
      return (pr[a.priority] ?? 1) - (pr[b.priority] ?? 1);
    });
    return `
      <div class="card card-padded-sm">
        <div class="card-header">
          <div class="row">
            <div style="width:32px;height:32px;border-radius:10px;background:var(--bg-surface);display:flex;align-items:center;justify-content:center;font-size:16px;">${cat.icon}</div>
            <div class="card-title">${cat.name}</div>
          </div>
          <div class="badge ${fullDone ? "badge-success" : "badge-neutral"}">${doneCount}/${cat.tasks.length}</div>
        </div>
        <div class="stack-sm">${sortedTasks.map(t => renderTaskItem(t)).join("")}</div>
      </div>
    `;
  }).join("");

  wrap.querySelectorAll(".task-item").forEach(el => {
    el.addEventListener("click", async (ev) => {
      if (ev.target.closest(".task-edit") || ev.target.closest(".task-delete")) return;
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

  wrap.querySelectorAll(".task-edit").forEach(btn => {
    btn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      const id = btn.dataset.taskId;
      const task = state.customTasks.find(t => t.id === id);
      if (task) {
        const container = document.getElementById("tasks-content");
        openTaskEditor(task, container);
      }
    });
  });

  wrap.querySelectorAll(".task-delete").forEach(btn => {
    btn.addEventListener("click", async (ev) => {
      ev.stopPropagation();
      if (!confirm("Usunąć trwale? (można też zarchiwizować)")) return;
      await deleteCustomTask(btn.dataset.taskId);
      state.customTasks = loadCustomTasks();
      applyConditionalTasks();
      await persistToday();
      renderCategories();
      updateHeaderProgress();
    });
  });
}

function renderTaskItem(t) {
  const priorityDot = t.priority === "high" ? `<span style="width:6px;height:6px;border-radius:50%;background:var(--danger);flex-shrink:0;" title="Wysoki priorytet"></span>` : "";
  const freqBadge = (t.frequency && t.frequency !== "daily") ? `<span class="badge badge-info" style="font-size:9px;padding:2px 6px;">${t.frequency === "weekly" ? "tyg." : t.frequency === "monthly" ? "mies." : t.frequency}</span>` : "";

  const editBtn = t.custom ? `<button class="task-edit btn-icon btn-icon-sm" data-task-id="${t.id}" title="Edytuj"><i class="fa-solid fa-pen"></i></button>` : "";
  const delBtn = t.custom ? `<button class="task-delete btn-icon btn-icon-sm" data-task-id="${t.id}" title="Usuń" style="color:var(--danger);"><i class="fa-solid fa-xmark"></i></button>` : "";

  return `
    <div class="list-item list-item-clickable task-item ${t.done ? "task-done" : ""}" data-task-id="${t.id}" style="${t.done ? "background:var(--accent-subtle);border-color:var(--accent-medium);" : ""}">
      <div class="checkbox-box" style="${t.done ? "background:var(--accent);border-color:var(--accent);color:var(--text-inverse);" : ""}">
        ${t.done ? '<i class="fa-solid fa-check" style="font-size:12px;"></i>' : ""}
      </div>
      <div class="list-item-body">
        <div class="row" style="gap:6px;align-items:center;">
          ${priorityDot}
          <div class="list-item-title ${t.done ? "text-tertiary" : ""}" style="${t.done ? "text-decoration:line-through;" : ""}">${escapeHtml(t.label)}</div>
          ${freqBadge}
        </div>
        ${t.hint ? `<div class="list-item-subtitle">${escapeHtml(t.hint)}</div>` : ""}
      </div>
      ${editBtn}
      ${delBtn}
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

// ============================================================================
// EDYTOR ZADANIA (Modal)
// ============================================================================

function openTaskEditor(existingTask, container) {
  const isEdit = !!existingTask;
  const data = existingTask ? { ...existingTask } : {
    label: "",
    hint: "",
    priority: "normal",
    frequency: "daily",
    category: "custom"
  };

  const CATEGORIES = Object.entries(CATEGORY_META).map(([id, meta]) => ({ id, ...meta }));

  const body = document.createElement("div");
  body.innerHTML = `
    <div class="stack">
      <div class="form-group">
        <label class="form-label">Nazwa zadania</label>
        <input class="input" id="et-label" value="${escapeHtml(data.label || "")}" placeholder="np. Medytacja 10 min">
      </div>
      <div class="form-group">
        <label class="form-label">Opis (opcjonalnie)</label>
        <input class="input" id="et-hint" value="${escapeHtml(data.hint || "")}" placeholder="np. wieczorem przed snem">
      </div>
      <div class="form-group">
        <label class="form-label">Kategoria</label>
        <select class="input" id="et-category">
          ${CATEGORIES.map(c => `<option value="${c.id}" ${data.category === c.id ? "selected" : ""}>${c.icon} ${c.name}</option>`).join("")}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Priorytet</label>
        <div class="row" style="gap:6px;">
          <button class="chip ${data.priority === "high" ? "active" : ""}" data-priority="high">🔴 Wysoki</button>
          <button class="chip ${data.priority === "normal" ? "active" : ""}" data-priority="normal">🟡 Normalny</button>
          <button class="chip ${data.priority === "low" ? "active" : ""}" data-priority="low">🔵 Niski</button>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Częstotliwość</label>
        <div class="row" style="gap:6px;flex-wrap:wrap;">
          <button class="chip ${data.frequency === "daily" ? "active" : ""}" data-freq="daily">Codziennie</button>
          <button class="chip ${data.frequency === "weekly" ? "active" : ""}" data-freq="weekly">Tygodniowo</button>
          <button class="chip ${data.frequency === "monthly" ? "active" : ""}" data-freq="monthly">Miesięcznie</button>
        </div>
      </div>
    </div>
  `;

  let priority = data.priority;
  let frequency = data.frequency;

  body.querySelectorAll("[data-priority]").forEach(el => {
    el.addEventListener("click", () => {
      priority = el.dataset.priority;
      body.querySelectorAll("[data-priority]").forEach(x => x.classList.remove("active"));
      el.classList.add("active");
    });
  });

  body.querySelectorAll("[data-freq]").forEach(el => {
    el.addEventListener("click", () => {
      frequency = el.dataset.freq;
      body.querySelectorAll("[data-freq]").forEach(x => x.classList.remove("active"));
      el.classList.add("active");
    });
  });

  openModal({
    title: isEdit ? "Edytuj zadanie" : "Nowe zadanie",
    body,
    actions: [
      { label: "Anuluj", variant: "ghost" },
      {
        label: isEdit ? "Zapisz" : "Dodaj",
        variant: "primary",
        onClick: async () => {
          const label = body.querySelector("#et-label").value.trim();
          if (!label) { showToast("Podaj nazwę", "error"); return; }

          const taskData = {
            label,
            hint: body.querySelector("#et-hint").value.trim(),
            category: body.querySelector("#et-category").value,
            priority,
            frequency,
            done: isEdit ? (existingTask.done || false) : false
          };

          if (isEdit) {
            await updateCustomTask(existingTask.id, taskData);
            showToast("✅ Zaktualizowano", "success");
          } else {
            const id = "custom-" + Date.now();
            const tasks = loadCustomTasks();
            tasks.push({ id, ...taskData, archived: false, createdAt: Date.now() });
            await saveCustomTasks(tasks);
            showToast("✅ Dodano", "success");
          }

          state.customTasks = loadCustomTasks();
          applyConditionalTasks();
          await persistToday();
          if (container) render(container);
        }
      }
    ]
  });
}

// ============================================================================
// ARCHIWUM
// ============================================================================

function openArchiveModal(container) {
  const archived = state.customTasks.filter(t => t.archived);

  const body = document.createElement("div");
  if (archived.length === 0) {
    body.innerHTML = `<p class="text-sm text-tertiary">Brak zarchiwizowanych zadań.</p>`;
  } else {
    body.innerHTML = `
      <div class="stack-sm">
        ${archived.map(t => `
          <div class="list-item">
            <div class="list-item-body">
              <div class="list-item-title">${escapeHtml(t.label)}</div>
              ${t.hint ? `<div class="list-item-subtitle">${escapeHtml(t.hint)}</div>` : ""}
            </div>
            <button class="btn btn-sm btn-secondary" data-restore="${t.id}">
              <i class="fa-solid fa-rotate-left"></i> Przywróć
            </button>
          </div>
        `).join("")}
      </div>
    `;

    body.querySelectorAll("[data-restore]").forEach(btn => {
      btn.addEventListener("click", async () => {
        await restoreCustomTask(btn.dataset.restore);
        state.customTasks = loadCustomTasks();
        applyConditionalTasks();
        await persistToday();
        showToast("✅ Przywrócono", "success");
        if (container) render(container);
      });
    });
  }

  openModal({
    title: "📦 Archiwum",
    body,
    actions: [{ label: "Zamknij", variant: "ghost" }]
  });
}
