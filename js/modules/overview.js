// ============================================================================
// LOCK IN 2027 — js/modules/overview.js
// Dashboard 2.0: dynamiczne renderowanie widgetów (personalizacja).
// ============================================================================

import { $, escapeHtml, todayKey, formatDatePL } from "../core/utils.js";
import { getSettings, getToggle, isBoosterActive } from "../core/storage.js";
import { loadDayDoc, loadGamification, saveGamification, loadWidgetsConfig } from "../core/data.js";
import { state } from "../state.js";
import { calcCompletionPct, calcCompletionStats, applyConditionalTasks, syncStateFromCategories, buildTrainingTask, refreshStreak } from "./tasks.js";
import { calculateDailyXp } from "../core/gamification-engine.js";
import { WIDGET_CATALOG, getWidgetById } from "../core/widgets.js";

const LOCKIN_TARGET = new Date("2027-01-01T00:00:00");
const LOCKIN_TOTAL_DAYS = 73;

export function updateCountdown() {
  const now = new Date();
  const remaining = Math.max(0, Math.ceil((LOCKIN_TARGET - now) / 86400000));
  const startStr = localStorage.getItem("regim:lockin-start");
  const start = startStr ? new Date(startStr + "T00:00:00") : new Date(LOCKIN_TARGET.getTime() - LOCKIN_TOTAL_DAYS * 86400000);
  const dayNum = Math.max(1, Math.min(LOCKIN_TOTAL_DAYS, Math.floor((now - start) / 86400000) + 1));
  return { remaining, dayNum };
}

export function getPersonalQuote() {
  const m = state.morning || {};
  const sleep = m.sleepTotal;
  if (sleep != null && sleep < 6) return "😴 Krótko spałeś. Dziś przetrwać, nie bić rekordów.";
  if (isBoosterActive()) return "⚡ Booster aktywny — trening podbity. Rób robotę.";
  return "🎯 Jedna rzecz naraz. Małe kroki codziennie > wielkie plany raz.";
}

export function calcDailyScore() {
  const parts = [];
  const pct = calcCompletionPct();
  if (calcCompletionStats().requiredTotal > 0) parts.push({ pct, weight: 0.5, label: "Zadania" });
  const m = state.morning || {};
  if (m.sleepTotal != null) {
    const sleepPct = Math.min(100, Math.round((m.sleepTotal / 8) * 100));
    parts.push({ pct: sleepPct, weight: 0.3, label: "Sen" });
  }
  const e = state.evening || {};
  if (e.steps != null) {
    const stepsPct = Math.min(100, Math.round((e.steps / 8000) * 100));
    parts.push({ pct: stepsPct, weight: 0.2, label: "Aktywność" });
  }
  if (!parts.length) return null;
  const totalWeight = parts.reduce((a, p) => a + p.weight, 0);
  const score = Math.round(parts.reduce((a, p) => a + p.pct * p.weight, 0) / totalWeight);
  return { score, parts };
}

// ============================================================================
// GŁÓWNY RENDER — dynamiczne widgety
// ============================================================================

export async function render(container) {
  console.log("%c[OVERVIEW] render start", "color:#60a5fa;font-weight:bold;");

  applyConditionalTasks();
  await loadToday();
  await syncXp();

  const widgetIds = loadWidgetsConfig();

  // Renderujemy HTML w kolejności
  const widgetHtmls = [];
  for (const id of widgetIds) {
    const w = getWidgetById(id);
    if (!w) continue;
    try {
      widgetHtmls.push(await w.render());
    } catch (e) {
      console.error("Widget render error:", id, e);
    }
  }

  container.innerHTML = `
    <div class="stack-lg">
      <div class="row-between">
        <div class="text-xs text-tertiary uppercase font-bold tracking-widest">DASHBOARD</div>
        <button class="btn-icon btn-icon-sm" id="btn-edit-dashboard" title="Personalizuj">
          <i class="fa-solid fa-sliders"></i>
        </button>
      </div>

      <div id="dashboard-widgets" class="stack-lg">
        ${widgetHtmls.join("")}
      </div>
    </div>
  `;

  $("btn-edit-dashboard")?.addEventListener("click", () => {
    location.hash = "#settings";
    // Przewiniemy do sekcji personalizacji po załadowaniu
    setTimeout(() => {
      const target = document.getElementById("dashboard-config-section");
      if (target) target.scrollIntoView({ behavior: "smooth" });
    }, 400);
  });

  const dateEl = $("topbar-date");
  if (dateEl) dateEl.textContent = formatDatePL(new Date());
  const greetEl = $("topbar-greeting");
  if (greetEl) {
    const h = new Date().getHours();
    const greet = h < 12 ? "Dzień dobry" : h < 18 ? "Cześć" : "Dobry wieczór";
    const settings = getSettings();
    greetEl.textContent = `${greet}, ${settings.name}`;
  }
}

async function loadToday() {
  const today = await loadDayDoc(todayKey());
  state.morning = (today && today.morning) || {};
  state.evening = (today && today.evening) || {};
  state.note = (today && today.note) || "";
  const savedTasks = (today && today.tasks) || [];
  if (savedTasks.length) {
    const { TASK_CATEGORIES } = await import("../core/constants.js");
    const map = new Map(savedTasks.map(t => [t.id, t.done]));
    TASK_CATEGORIES.forEach(c => c.tasks.forEach(t => {
      if (map.has(t.id)) t.done = map.get(t.id);
    }));
    syncStateFromCategories();
  }
}

async function syncXp() {
  try {
    await refreshStreak();
    const gamData = await loadGamification() || { xp: 0, level: 1, dailyXp: {} };
    const today = todayKey();
    const dayDoc = await loadDayDoc(today);
    const tasksInDoc = (dayDoc && dayDoc.tasks) || [];
    let completed, total;
    if (tasksInDoc.length > 0) {
      completed = tasksInDoc.filter(t => t.done).length;
      total = tasksInDoc.length;
    } else {
      completed = state.tasks.filter(t => t.done).length;
      total = state.tasks.length;
    }
    const streak = state._streak || 0;
    const todayXp = calculateDailyXp(completed, total, streak);
    const savedTodayXp = (gamData.dailyXp && gamData.dailyXp[today]) || 0;
    if (todayXp > savedTodayXp) {
      const diff = todayXp - savedTodayXp;
      const newTotalXp = (gamData.xp || 0) + diff;
      const newLevel = Math.floor(Math.sqrt(newTotalXp / 100)) + 1;
      const newDailyXp = { ...(gamData.dailyXp || {}), [today]: todayXp };
      await saveGamification({ xp: newTotalXp, level: newLevel, dailyXp: newDailyXp });
    }
  } catch (e) {
    console.error("[XP] syncXp error:", e);
  }
}
