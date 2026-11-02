// ============================================================================
// LOCK IN 2027 — js/modules/overview.js
// Dashboard + debug XP (Podetap 2, wersja z logami).
// ============================================================================

import { $, escapeHtml, todayKey, formatDatePL } from "../core/utils.js";
import { getSettings, getToggle, isBoosterActive } from "../core/storage.js";
import { loadDayDoc, loadGamification, saveGamification } from "../core/data.js";
import { state } from "../state.js";
import { calcCompletionPct, calcCompletionStats, applyConditionalTasks, syncStateFromCategories, buildTrainingTask, refreshStreak } from "./tasks.js";
import { calculateDailyXp } from "../core/gamification-engine.js";

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

async function renderDailyScore() {
  const ds = calcDailyScore();
  const pct = ds ? ds.score : 0;
  const ringSize = 120;
  const radius = (ringSize - 16) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (pct / 100) * circ;

  const partsHtml = ds
    ? ds.parts.map(p => `
        <div class="row-between" style="padding:8px 0;border-bottom:1px solid var(--border-subtle);">
          <span class="text-sm text-secondary">${p.label}</span>
          <span class="text-sm font-bold text-accent">${p.pct}%</span>
        </div>
      `).join("")
    : `<div class="text-sm text-tertiary">Brak danych — uzupełnij zadania / sen / kroki.</div>`;

  return `
    <div class="card">
      <div class="card-header">
        <div>
          <div class="card-subtitle">DAILY SCORE</div>
          <div class="card-title" style="margin-top:4px;">${ds ? getScoreLabel(pct) : "Brak danych"}</div>
        </div>
      </div>
      <div class="row" style="gap:20px;align-items:center;">
        <div class="ring" style="width:${ringSize}px;height:${ringSize}px;">
          <svg width="${ringSize}" height="${ringSize}">
            <circle class="ring-track" cx="${ringSize/2}" cy="${ringSize/2}" r="${radius}" fill="none" stroke-width="8"/>
            <circle class="ring-fill" cx="${ringSize/2}" cy="${ringSize/2}" r="${radius}" fill="none" stroke-width="8"
              stroke-dasharray="${circ}" stroke-dashoffset="${offset}"/>
          </svg>
          <div class="ring-value" style="font-size:24px;">${pct}</div>
        </div>
        <div style="flex:1;min-width:0;">
          ${partsHtml}
        </div>
      </div>
    </div>
  `;
}

function getScoreLabel(pct) {
  if (pct >= 85) return "🔥 Świetny dzień";
  if (pct >= 70) return "✅ Dobry dzień";
  if (pct >= 50) return "🟡 Przeciętny";
  if (pct >= 25) return "⚠️ Słabo";
  return "❌ Do poprawy";
}

async function renderXpWidget() {
  const gam = await loadGamification() || { xp: 0, level: 1 };
  return `
    <a href="#achievements" class="card card-padded-sm row-between" style="text-decoration:none;color:inherit;">
      <div class="row" style="gap:10px;">
        <div style="font-size:24px;">🏆</div>
        <div>
          <div class="text-xs text-tertiary font-bold uppercase">Poziom ${gam.level || 1}</div>
          <div class="text-sm font-bold text-accent">${gam.xp || 0} XP</div>
        </div>
      </div>
      <i class="fa-solid fa-chevron-right text-tertiary"></i>
    </a>
  `;
}

async function renderQuickStats() {
  const m = state.morning || {};
  const e = state.evening || {};
  const streak = state._streak || 0;
  return `
    <div class="grid-2">
      <div class="stat"><div class="stat-label">Sen</div><div class="stat-value">${m.sleepTotal != null ? m.sleepTotal.toFixed(1) : "—"}<span class="stat-unit">h</span></div></div>
      <div class="stat"><div class="stat-label">Kroki</div><div class="stat-value">${e.steps != null ? e.steps.toLocaleString("pl-PL") : "—"}</div></div>
      <div class="stat"><div class="stat-label">RHR</div><div class="stat-value">${m.rhr != null ? m.rhr : "—"}<span class="stat-unit">bpm</span></div></div>
      <div class="stat"><div class="stat-label">Streak</div><div class="stat-value accent">${streak}<span class="stat-unit">dni</span></div></div>
    </div>
  `;
}

function renderTodayTasks() {
  const preview = state.tasks.slice(0, 5);
  if (!preview.length) return `<div class="empty"><div class="empty-icon">📋</div><div class="empty-text">Brak zadań</div></div>`;
  return `
    <div class="stack-sm">
      ${preview.map(t => `
        <div class="list-item">
          <div class="checkbox-box" style="${t.done ? "background:var(--accent);border-color:var(--accent);color:var(--text-inverse);" : ""}">
            ${t.done ? '<i class="fa-solid fa-check" style="font-size:12px;"></i>' : ""}
          </div>
          <div class="list-item-body">
            <div class="list-item-title ${t.done ? "text-tertiary" : ""}" style="${t.done ? "text-decoration:line-through;" : ""}">${escapeHtml(t.label)}</div>
          </div>
        </div>
      `).join("")}
    </div>
    <a href="#tasks" class="btn btn-ghost btn-block mt-3">Zobacz wszystkie →</a>
  `;
}

function renderNextTraining() {
  const t = buildTrainingTask();
  if (!t) return `<div class="text-sm text-tertiary">Dziś odpoczynek — regeneracja to też dyscyplina.</div>`;
  return `
    <div class="row" style="gap:12px;align-items:flex-start;">
      <div style="width:44px;height:44px;border-radius:12px;background:var(--accent-subtle);color:var(--accent);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">
        <i class="fa-solid fa-dumbbell"></i>
      </div>
      <div style="flex:1;min-width:0;">
        <div class="list-item-title">${escapeHtml(t.label)}</div>
        <div class="list-item-subtitle">${escapeHtml(t.hint || "")}</div>
      </div>
      <a href="#training" class="btn btn-sm btn-primary">Trenuj</a>
    </div>
  `;
}

// ============================================================================
// GŁÓWNA FUNKCJA RENDER
// ============================================================================

export async function render(container) {
  console.log("%c[OVERVIEW] render start", "color:#60a5fa;font-weight:bold;");

  // 1. Ładujemy dzisiejsze zadania
  applyConditionalTasks();
  await loadToday();

  // 2. XP
  await syncXp();

  // 3. Render
  const { remaining, dayNum } = updateCountdown();
  const settings = getSettings();

  container.innerHTML = `
    <div class="stack-lg">
      ${await renderXpWidget()}
      ${await renderDailyScore()}
      ${await renderQuickStats()}

      <div class="card card-accent">
        <div class="card-header">
          <div>
            <div class="card-subtitle">LOCK IN 2027</div>
            <div class="card-title" style="margin-top:4px;">Dzień ${dayNum} / ${LOCKIN_TOTAL_DAYS}</div>
          </div>
          <div class="text-right">
            <div class="text-2xl font-black text-accent">${remaining}</div>
            <div class="text-xs text-tertiary">dni do celu</div>
          </div>
        </div>
        <div class="progress progress-lg"><div class="progress-fill" style="width:${Math.round((dayNum / LOCKIN_TOTAL_DAYS) * 100)}%"></div></div>
      </div>

      <div>
        <div class="section-header"><span class="section-header-title">Zadania dnia</span></div>
        ${renderTodayTasks()}
      </div>

      <div class="card">
        <div class="card-header"><div class="card-title">Następny trening</div></div>
        ${renderNextTraining()}
      </div>

      <div class="card">
        <div class="card-header"><div class="card-title">Cytat dnia</div></div>
        <p class="text-sm text-secondary" style="line-height:1.6;">${escapeHtml(getPersonalQuote())}</p>
      </div>

      <div class="row" style="gap:8px;flex-wrap:wrap;">
        <a href="#health" class="btn btn-secondary">📊 Health</a>
        <a href="#progress" class="btn btn-secondary">📈 Progress</a>
        <a href="#coach" class="btn btn-secondary">🤖 Coach</a>
        <a href="#nutrition" class="btn btn-secondary">🍽️ Nutrition</a>
      </div>
    </div>
  `;

  const dateEl = $("topbar-date");
  if (dateEl) dateEl.textContent = formatDatePL(new Date());
  const greetEl = $("topbar-greeting");
  if (greetEl) {
    const h = new Date().getHours();
    const greet = h < 12 ? "Dzień dobry" : h < 18 ? "Cześć" : "Dobry wieczór";
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

// ============================================================================
// XP SYNC — wersja z debugowaniem
// ============================================================================

async function syncXp() {
  try {
    await refreshStreak();

    const gamData = await loadGamification() || { xp: 0, level: 1, dailyXp: {} };
    const today = todayKey();

    // Czytamy BEZPOŚREDNIO z dayDoc (niezależnie od state.tasks)
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

    console.log("[XP] Stan:", {
      tasksInDoc: tasksInDoc.length,
      stateTasks: state.tasks.length,
      completed,
      total,
      streak,
      todayXp,
      savedTodayXp,
      currentTotalXp: gamData.xp || 0
    });

    if (todayXp > savedTodayXp) {
      const diff = todayXp - savedTodayXp;
      const newTotalXp = (gamData.xp || 0) + diff;
      const newLevel = Math.floor(Math.sqrt(newTotalXp / 100)) + 1;
      const newDailyXp = { ...(gamData.dailyXp || {}), [today]: todayXp };

      try {
        await saveGamification({
          xp: newTotalXp,
          level: newLevel,
          dailyXp: newDailyXp
        });
        console.log("[XP] ✅ Zapisano:", newTotalXp, "XP · Poziom", newLevel);
      } catch (err) {
        console.error("[XP] ❌ Zapis nieudany:", err);
      }
    } else {
      console.log("[XP] Brak zmian (todayXp <= savedTodayXp)");
    }
  } catch (e) {
    console.error("[XP] Błąd syncXp:", e);
  }
}

// ============================================================================
// DEBUG — dostępne z konsoli przeglądarki
// ============================================================================

window.__debugXp = async () => {
  console.log("%c=== XP DEBUG ===", "color:#fbbf24;font-weight:bold;font-size:14px;");
  const gam = await loadGamification();
  const day = await loadDayDoc(todayKey());
  console.log("Gamification doc:", gam);
  console.log("Day doc tasks:", day?.tasks);
  console.log("state.tasks done:", state.tasks.filter(t => t.done).length, "/", state.tasks.length);
  console.log("state._streak:", state._streak);
};

window.__forceXpSync = async () => {
  console.log("%c=== FORCE XP SYNC ===", "color:#fbbf24;font-weight:bold;");
  await syncXp();
  console.log("%cReload za 1s...", "color:#4ade80;");
  setTimeout(() => window.location.reload(), 1000);
};
