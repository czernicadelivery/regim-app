// ============================================================================
// LOCK IN 2027 — js/modules/overview.js
// Dashboard: Daily Score, streak, zadania dnia, cytat, brief.
// Daily Score = 50% zadania + 30% sen + 20% aktywność (tylko z dostępnych).
// ============================================================================

import { $, escapeHtml, todayKey, formatDatePL } from "../core/utils.js";
import { getSettings, getToggle, isBoosterActive } from "../core/storage.js";
import { loadDayDoc } from "../core/data.js";
import { state } from "../state.js";
import { calcCompletionPct, calcCompletionStats, applyConditionalTasks, syncStateFromCategories, buildTrainingTask } from "./tasks.js";

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
  // 3 składniki: zadania (50%), sen (30%), aktywność (20%).
  // Składniki bez danych są pomijane, wagi renormalizowane.
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

async function renderQuickStats() {
  const m = state.morning || {};
  const e = state.evening || {};
  const streak = state._streak || 0;
  return `
    <div class="grid-2">
      <div class="stat">
        <div class="stat-label">Sen</div>
        <div class="stat-value">${m.sleepTotal != null ? m.sleepTotal.toFixed(1) : "—"}<span class="stat-unit">h</span></div>
      </div>
      <div class="stat">
        <div class="stat-label">Kroki</div>
        <div class="stat-value">${e.steps != null ? e.steps.toLocaleString("pl-PL") : "—"}</div>
      </div>
      <div class="stat">
        <div class="stat-label">RHR</div>
        <div class="stat-value">${m.rhr != null ? m.rhr : "—"}<span class="stat-unit">bpm</span></div>
      </div>
      <div class="stat">
        <div class="stat-label">Streak</div>
        <div class="stat-value accent">${streak}<span class="stat-unit">dni</span></div>
      </div>
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

export async function render(container) {
  state.customTasks = state.customTasks.length ? state.customTasks : [];
  applyConditionalTasks();
  await loadToday();

  const { remaining, dayNum } = updateCountdown();
  const settings = getSettings();

  container.innerHTML = `
    <div class="stack-lg">
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
