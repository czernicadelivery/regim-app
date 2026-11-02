// ============================================================================
// LOCK IN 2027 — js/core/widgets.js
// Definicje widgetów dashboardu. Każdy widget = { id, label, description, render }.
// render() zwraca HTML string (async).
// ============================================================================

import { escapeHtml, todayKey, formatDatePL } from "./utils.js";
import { loadDayDoc, loadGamification, loadMeasurements } from "./data.js";
import { state } from "../state.js";
import { calcCompletionPct, calcCompletionStats, buildTrainingTask } from "../modules/tasks.js";
import { calcDailyScore, getPersonalQuote, updateCountdown } from "../modules/overview.js";
import { xpProgress } from "./gamification-engine.js";
import { loadFriends, loadIncomingRequests } from "./data.js";

// ============================================================================
// POSZCZEGÓLNE WIDGETY
// ============================================================================

async function widgetDailyScore() {
  const ds = calcDailyScore();
  const pct = ds ? ds.score : 0;
  const ringSize = 100;
  const radius = (ringSize - 14) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (pct / 100) * circ;

  const label = !ds ? "Brak danych"
    : pct >= 85 ? "🔥 Świetny dzień"
    : pct >= 70 ? "✅ Dobry dzień"
    : pct >= 50 ? "🟡 Przeciętny"
    : pct >= 25 ? "⚠️ Słabo"
    : "❌ Do poprawy";

  return `
    <div class="card">
      <div class="card-header">
        <div>
          <div class="card-subtitle">DAILY SCORE</div>
          <div class="card-title" style="margin-top:4px;">${label}</div>
        </div>
      </div>
      <div class="row" style="gap:16px;align-items:center;">
        <div class="ring" style="width:${ringSize}px;height:${ringSize}px;">
          <svg width="${ringSize}" height="${ringSize}">
            <circle class="ring-track" cx="${ringSize/2}" cy="${ringSize/2}" r="${radius}" fill="none" stroke-width="7"/>
            <circle class="ring-fill" cx="${ringSize/2}" cy="${ringSize/2}" r="${radius}" fill="none" stroke-width="7"
              stroke-dasharray="${circ}" stroke-dashoffset="${offset}"/>
          </svg>
          <div class="ring-value" style="font-size:20px;">${pct}</div>
        </div>
        <div style="flex:1;min-width:0;">
          ${ds ? ds.parts.map(p => `
            <div class="row-between" style="padding:4px 0;font-size:12px;">
              <span class="text-secondary">${p.label}</span>
              <span class="font-bold text-accent">${p.pct}%</span>
            </div>
          `).join("") : `<div class="text-sm text-tertiary">Uzupełnij dane</div>`}
        </div>
      </div>
    </div>
  `;
}

async function widgetXp() {
  const gam = await loadGamification() || { xp: 0, level: 1 };
  const p = xpProgress(gam.xp || 0);
  return `
    <a href="#achievements" class="card card-padded-sm row-between" style="text-decoration:none;color:inherit;">
      <div class="row" style="gap:10px;">
        <div style="font-size:24px;">🏆</div>
        <div>
          <div class="text-xs text-tertiary font-bold uppercase">Poziom ${gam.level || 1}</div>
          <div class="text-sm font-bold text-accent">${gam.xp || 0} XP</div>
        </div>
      </div>
      <div style="flex:1;margin-left:12px;">
        <div class="progress progress-sm"><div class="progress-fill" style="width:${p.pct}%"></div></div>
        <div class="text-xs text-tertiary text-right mt-1">${p.gained}/${p.needed}</div>
      </div>
    </a>
  `;
}

async function widgetQuickStats() {
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

async function widgetTasks() {
  const preview = state.tasks.slice(0, 5);
  const stats = calcCompletionStats();
  if (!preview.length) return `<div class="card"><div class="text-sm text-tertiary">Brak zadań</div></div>`;
  return `
    <div class="card">
      <div class="card-header">
        <div class="card-title">Zadania dnia</div>
        <a href="#tasks" class="text-xs text-accent" style="text-decoration:none;">${stats.requiredDone}/${stats.requiredTotal} →</a>
      </div>
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
    </div>
  `;
}

async function widgetTraining() {
  const t = buildTrainingTask();
  if (!t) return `
    <div class="card">
      <div class="card-header"><div class="card-title">Następny trening</div></div>
      <div class="text-sm text-tertiary">Dziś odpoczynek — regeneracja to też dyscyplina.</div>
    </div>
  `;
  return `
    <div class="card">
      <div class="card-header"><div class="card-title">Następny trening</div></div>
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
    </div>
  `;
}

async function widgetQuote() {
  return `
    <div class="card">
      <div class="card-header"><div class="card-title">Cytat dnia</div></div>
      <p class="text-sm text-secondary" style="line-height:1.6;">${escapeHtml(getPersonalQuote())}</p>
    </div>
  `;
}

async function widgetCountdown() {
  const { remaining, dayNum } = updateCountdown();
  return `
    <div class="card card-accent">
      <div class="card-header">
        <div>
          <div class="card-subtitle">LOCK IN 2027</div>
          <div class="card-title" style="margin-top:4px;">Dzień ${dayNum} / 73</div>
        </div>
        <div class="text-right">
          <div class="text-2xl font-black text-accent">${remaining}</div>
          <div class="text-xs text-tertiary">dni do celu</div>
        </div>
      </div>
      <div class="progress progress-lg"><div class="progress-fill" style="width:${Math.round((dayNum / 73) * 100)}%"></div></div>
    </div>
  `;
}

async function widgetSocial() {
  let friends = [];
  let requests = [];
  try {
    friends = await loadFriends();
    requests = await loadIncomingRequests();
  } catch (e) {}
  return `
    <div class="card">
      <div class="card-header">
        <div class="card-title">👥 Social</div>
        <a href="#social" class="text-xs text-accent" style="text-decoration:none;">Zobacz →</a>
      </div>
      <div class="row-between">
        <div class="stat-label">Znajomi</div>
        <div class="text-sm font-bold">${friends.length}</div>
      </div>
      ${requests.length > 0 ? `
        <div class="row-between mt-2">
          <div class="stat-label">Nowe prośby</div>
          <div class="badge badge-warning">${requests.length}</div>
        </div>
      ` : ""}
    </div>
  `;
}

async function widgetLastMeasurement() {
  let measurements = [];
  try { measurements = await loadMeasurements(); } catch (e) {}
  const last = measurements[0];
  return `
    <div class="card">
      <div class="card-header">
        <div class="card-title">📏 Ostatni pomiar</div>
        <a href="#measurements" class="text-xs text-accent" style="text-decoration:none;">Dodaj →</a>
      </div>
      ${last ? `
        <div class="row-between">
          <div class="stat-label">Waga</div>
          <div class="text-sm font-bold">${last.weight || "—"} kg</div>
        </div>
        <div class="row-between mt-2">
          <div class="stat-label">Data</div>
          <div class="text-xs text-tertiary">${last.date?.toDate ? last.date.toDate().toLocaleDateString("pl-PL") : "—"}</div>
        </div>
      ` : `<div class="text-sm text-tertiary">Brak pomiarów</div>`}
    </div>
  `;
}

async function widgetShortcuts() {
  return `
    <div class="card">
      <div class="card-header"><div class="card-title">Skróty</div></div>
      <div class="grid-2" style="gap:8px;">
        <a href="#health" class="btn btn-secondary btn-sm" style="text-decoration:none;">📊 Health</a>
        <a href="#progress" class="btn btn-secondary btn-sm" style="text-decoration:none;">📈 Progress</a>
        <a href="#coach" class="btn btn-secondary btn-sm" style="text-decoration:none;">🤖 Coach</a>
        <a href="#nutrition" class="btn btn-secondary btn-sm" style="text-decoration:none;">🍽️ Nutrition</a>
      </div>
    </div>
  `;
}

// ============================================================================
// KATALOG WIDGETÓW (kolejność w tym obiekcie = domyślna kolejność)
// ============================================================================

export const WIDGET_CATALOG = [
  { id: "countdown", label: "Licznik Lock In", icon: "🔒", render: widgetCountdown },
  { id: "xp", label: "XP / Poziom", icon: "🏆", render: widgetXp },
  { id: "dailyscore", label: "Daily Score", icon: "🎯", render: widgetDailyScore },
  { id: "quickstats", label: "Szybkie statystyki", icon: "📊", render: widgetQuickStats },
  { id: "tasks", label: "Zadania dnia", icon: "✅", render: widgetTasks },
  { id: "training", label: "Następny trening", icon: "🏋️", render: widgetTraining },
  { id: "quote", label: "Cytat dnia", icon: "💬", render: widgetQuote },
  { id: "measurement", label: "Ostatni pomiar", icon: "📏", render: widgetLastMeasurement },
  { id: "social", label: "Social", icon: "👥", render: widgetSocial },
  { id: "shortcuts", label: "Skróty", icon: "⚡", render: widgetShortcuts }
];

export function getWidgetById(id) {
  return WIDGET_CATALOG.find(w => w.id === id);
}
