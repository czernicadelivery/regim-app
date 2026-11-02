// ============================================================================
// LOCK IN 2027 — js/modules/progress.js
// Kalendarz aktywności, rekordy, wykresy 30 dni, odznaki, porównanie okresów.
// ============================================================================

import { $, escapeHtml, dateKey } from "../core/utils.js";
import { loadDayDoc, loadDaysRange, collectAllDays, loadLastNDays } from "../core/data.js";
import { state } from "../state.js";
import { openModal } from "../components/modal.js";
import { makeLine, makeBar, COLORS } from "../components/chart.js";

const MONTH_NAMES = ["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"];

let _calYear = new Date().getFullYear();
let _calMonth = new Date().getMonth();

// --- Statystyki 30 dni --------------------------------------------------
async function renderLast30() {
  const days = await loadDaysRange(30, 0);
  const perfect = days.filter(d => d.completedPct === 100).length;
  const avgPct = days.length ? Math.round(days.reduce((a, b) => a + (b.completedPct || 0), 0) / days.length) : 0;
  const totalDone = days.reduce((a, d) => a + ((d.tasks && d.tasks.filter(t => t.done).length) || 0), 0);
  const sleepArr = days.map(d => d.morning && d.morning.sleepTotal).filter(v => v != null);
  const avgSleep = sleepArr.length ? (sleepArr.reduce((a, b) => a + b, 0) / sleepArr.length).toFixed(1) : "—";

  return `
    <div class="grid-4">
      <div class="stat"><div class="stat-label">Perfect days</div><div class="stat-value accent">${perfect}</div></div>
      <div class="stat"><div class="stat-label">Śr. ukończenie</div><div class="stat-value">${avgPct}<span class="stat-unit">%</span></div></div>
      <div class="stat"><div class="stat-label">Zadania</div><div class="stat-value">${totalDone}</div></div>
      <div class="stat"><div class="stat-label">Śr. sen</div><div class="stat-value">${avgSleep}<span class="stat-unit">h</span></div></div>
    </div>
  `;
}

// --- Porównanie 7d vs poprzednie 7d -------------------------------------
async function renderCompare() {
  const thisWeek = await loadDaysRange(7, 0);
  const lastWeek = await loadDaysRange(7, 7);
  const avg = (arr, key, path) => {
    const vals = arr.map(d => path ? d[path] && d[path][key] : d[key]).filter(v => v != null);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };

  const tw = {
    pct: avg(thisWeek, "completedPct"),
    sleep: avg(thisWeek, "sleepTotal", "morning"),
    rhr: avg(thisWeek, "rhr", "morning"),
    steps: avg(thisWeek, "steps", "evening")
  };
  const lw = {
    pct: avg(lastWeek, "completedPct"),
    sleep: avg(lastWeek, "sleepTotal", "morning"),
    rhr: avg(lastWeek, "rhr", "morning"),
    steps: avg(lastWeek, "steps", "evening")
  };

  const row = (label, a, b, unit = "") => {
    const diff = (a != null && b != null) ? a - b : null;
    const arrow = diff == null ? "—" : diff > 0.5 ? "↑" : diff < -0.5 ? "↓" : "→";
    const color = diff == null ? "text-tertiary" : diff > 0.5 ? "text-success" : diff < -0.5 ? "text-danger" : "text-secondary";
    return `
      <div class="row-between" style="padding:10px 0;border-bottom:1px solid var(--border-subtle);">
        <span class="text-sm text-secondary">${label}</span>
        <span class="text-sm font-bold ${color}">${a != null ? a.toFixed(1) : "—"}${unit} ${arrow}</span>
      </div>
    `;
  };

  return `
    <div class="card">
      <div class="card-header">
        <div>
          <div class="card-subtitle">TEN TYDZIEŃ vs POPRZEDNI</div>
          <div class="card-title" style="margin-top:4px;">Trend</div>
        </div>
      </div>
      ${row("Ukończenie", tw.pct, lw.pct, "%")}
      ${row("Sen", tw.sleep, lw.sleep, "h")}
      ${row("RHR", tw.rhr, lw.rhr, "bpm")}
      ${row("Kroki", tw.steps, lw.steps)}
    </div>
  `;
}

// --- Rekordy ------------------------------------------------------------
async function renderRecords() {
  const days = await collectAllDays();
  let bestSleep = 0, lowRhr = 999, maxSteps = 0, maxWeight = 0;
  days.forEach(d => {
    const m = d.morning || {};
    const e = d.evening || {};
    if (m.sleepTotal != null) bestSleep = Math.max(bestSleep, m.sleepTotal);
    if (m.rhr != null) lowRhr = Math.min(lowRhr, m.rhr);
    if (e.steps != null) maxSteps = Math.max(maxSteps, e.steps);
    if (m.dailyWeight != null) maxWeight = Math.max(maxWeight, m.dailyWeight);
  });
  return `
    <div class="grid-2">
      <div class="stat"><div class="stat-label">🏆 Rekord snu</div><div class="stat-value">${bestSleep > 0 ? bestSleep.toFixed(1) : "—"}<span class="stat-unit">h</span></div></div>
      <div class="stat"><div class="stat-label">💓 Min RHR</div><div class="stat-value">${lowRhr < 999 ? lowRhr : "—"}<span class="stat-unit">bpm</span></div></div>
      <div class="stat"><div class="stat-label">👟 Max kroki</div><div class="stat-value">${maxSteps > 0 ? maxSteps.toLocaleString("pl-PL") : "—"}</div></div>
      <div class="stat"><div class="stat-label">⚖️ Max waga</div><div class="stat-value">${maxWeight > 0 ? maxWeight.toFixed(1) : "—"}<span class="stat-unit">kg</span></div></div>
    </div>
  `;
}

// --- Odznaki ------------------------------------------------------------
async function renderBadges() {
  const days = await collectAllDays();
  const streak = state._streak || 0;
  const perfect = days.filter(d => d.completedPct === 100).length;
  const maxSteps = Math.max.apply(null, days.map(d => (d.evening && d.evening.steps) || 0).concat([0]));
  const earlySleep = days.filter(d => ((d.morning && d.morning.sleepTotal) || 0) >= 8).length;

  const badges = [
    { icon: "🔥", label: "Streak 7", un: streak >= 7 },
    { icon: "💪", label: "Streak 30", un: streak >= 30 },
    { icon: "🏆", label: "Perfect ×10", un: perfect >= 10 },
    { icon: "👟", label: "15k kroków", un: maxSteps >= 15000 },
    { icon: "😴", label: "8h ×30", un: earlySleep >= 30 },
    { icon: "⭐", label: "Perfect ×50", un: perfect >= 50 }
  ];

  return `
    <div class="grid-3">
      ${badges.map(b => `
        <div class="card card-padded-sm text-center" style="${b.un ? "" : "opacity:.35;filter:grayscale(1);"}">
          <div style="font-size:28px;">${b.icon}</div>
          <div class="text-xs text-secondary font-semibold mt-1">${b.label}</div>
        </div>
      `).join("")}
    </div>
  `;
}

// --- Kalendarz ----------------------------------------------------------
async function renderCalendar() {
  const grid = $("progress-cal-grid");
  const label = $("progress-cal-label");
  if (!grid) return;
  if (label) label.textContent = MONTH_NAMES[_calMonth] + " " + _calYear;

  const first = new Date(_calYear, _calMonth, 1);
  let startDow = first.getDay() - 1;
  if (startDow < 0) startDow = 6;
  const daysInMonth = new Date(_calYear, _calMonth + 1, 0).getDate();
  const today = dateKey(new Date());

  const promises = [];
  for (let d = 1; d <= daysInMonth; d++) {
    promises.push(loadDayDoc(dateKey(new Date(_calYear, _calMonth, d))));
  }
  const docs = await Promise.all(promises);

  let html = "";
  for (let i = 0; i < startDow; i++) html += `<div></div>`;
  for (let d = 1; d <= daysInMonth; d++) {
    const dk = dateKey(new Date(_calYear, _calMonth, d));
    const doc = docs[d - 1];
    const pct = doc && doc.completedPct != null ? doc.completedPct : null;
    let bg = "var(--bg-surface)";
    let dot = "transparent";
    if (pct === 100) { bg = "var(--accent-subtle)"; dot = "var(--accent)"; }
    else if (pct > 0) { bg = "var(--warning-subtle)"; dot = "var(--warning)"; }
    const isToday = dk === today;
    html += `
      <button class="cal-day" data-cal-date="${dk}" style="
        aspect-ratio:1;border-radius:10px;background:${bg};
        display:flex;flex-direction:column;align-items:center;justify-content:center;
        font-size:12px;font-weight:700;position:relative;
        border:1px solid ${isToday ? "var(--accent)" : "var(--border-subtle)"};
        color:var(--text-primary);cursor:pointer;transition:transform 150ms;
      ">
        <span>${d}</span>
        <span style="width:4px;height:4px;border-radius:50%;background:${dot};margin-top:2px;"></span>
      </button>
    `;
  }
  grid.innerHTML = html;

  grid.querySelectorAll("[data-cal-date]").forEach(btn => {
    btn.addEventListener("click", () => openDayDetail(btn.dataset.calDate));
  });
}

async function openDayDetail(dk) {
  const doc = await loadDayDoc(dk);
  if (!doc) {
    openModal({ title: dk, body: `<p class="text-sm text-tertiary">Brak danych.</p>`, actions: [{ label: "OK" }] });
    return;
  }
  const m = doc.morning || {};
  const e = doc.evening || {};
  openModal({
    title: dk,
    body: `
      <div class="stack">
        <div class="stat"><div class="stat-label">Ukończenie</div><div class="stat-value accent">${doc.completedPct || 0}%</div></div>
        ${m.sleepTotal != null ? `<div class="list-item"><div class="list-item-body"><div class="list-item-title">Sen</div><div class="list-item-subtitle">${m.sleepTotal}h</div></div></div>` : ""}
        ${m.rhr != null ? `<div class="list-item"><div class="list-item-body"><div class="list-item-title">RHR</div><div class="list-item-subtitle">${m.rhr} bpm</div></div></div>` : ""}
        ${m.dailyWeight != null ? `<div class="list-item"><div class="list-item-body"><div class="list-item-title">Waga</div><div class="list-item-subtitle">${m.dailyWeight} kg</div></div></div>` : ""}
        ${e.steps != null ? `<div class="list-item"><div class="list-item-body"><div class="list-item-title">Kroki</div><div class="list-item-subtitle">${e.steps}</div></div></div>` : ""}
        ${doc.note ? `<div class="card card-flat"><div class="text-sm text-secondary">${escapeHtml(doc.note)}</div></div>` : ""}
      </div>
    `,
    actions: [{ label: "Zamknij" }]
  });
}

// --- Wykresy ------------------------------------------------------------
async function renderCharts() {
  const days = await loadDaysRange(30, 0);
  const labels = days.map(d => {
    const [, mm, dd] = (d.date || "").split("-");
    return `${dd}.${mm}`;
  });

  makeLine("progress-chart-weight", labels, days.map(d => (d.morning && d.morning.dailyWeight) || null), COLORS.warning, "Waga");
  makeLine("progress-chart-sleep", labels, days.map(d => (d.morning && d.morning.sleepTotal) || null), COLORS.accent, "Sen");
  makeLine("progress-chart-steps", labels, days.map(d => (d.evening && d.evening.steps) || null), COLORS.info, "Kroki");
  makeBar("progress-chart-completion", labels, days.map(d => d.completedPct || 0), COLORS.accent, "Ukończenie");
}

// --- Render -------------------------------------------------------------
export async function render(container) {
  const last30 = await renderLast30();
  const compare = await renderCompare();
  const records = await renderRecords();
  const badges = await renderBadges();

  container.innerHTML = `
    <div class="stack-lg">
      <div>
        <div class="section-header"><span class="section-header-title">Ostatnie 30 dni</span></div>
        ${last30}
      </div>

      ${compare}

      <div>
        <div class="section-header"><span class="section-header-title">Rekordy</span></div>
        ${records}
      </div>

      <div class="card">
        <div class="card-header"><div class="card-title">Waga (30 dni)</div></div>
        <div class="chart-container"><canvas id="progress-chart-weight"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header"><div class="card-title">Sen (30 dni)</div></div>
        <div class="chart-container"><canvas id="progress-chart-sleep"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header"><div class="card-title">Kroki (30 dni)</div></div>
        <div class="chart-container"><canvas id="progress-chart-steps"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header"><div class="card-title">Ukończenie zadań (30 dni)</div></div>
        <div class="chart-container"><canvas id="progress-chart-completion"></canvas></div>
      </div>

      <div class="card">
        <div class="card-header">
          <button class="btn-icon btn-icon-sm" id="progress-cal-prev"><i class="fa-solid fa-chevron-left"></i></button>
          <div class="card-title" id="progress-cal-label"></div>
          <button class="btn-icon btn-icon-sm" id="progress-cal-next"><i class="fa-solid fa-chevron-right"></i></button>
        </div>
        <div class="grid-7" style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center;margin-bottom:8px;">
          ${["Pn","Wt","Śr","Cz","Pt","So","Nd"].map(n => `<div class="text-xs text-tertiary font-bold">${n}</div>`).join("")}
        </div>
        <div id="progress-cal-grid" style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;"></div>
      </div>

      <div>
        <div class="section-header"><span class="section-header-title">Odznaki</span></div>
        ${badges}
      </div>
    </div>
  `;

  renderCharts();
  renderCalendar();

  $("progress-cal-prev")?.addEventListener("click", () => {
    _calMonth--;
    if (_calMonth < 0) { _calMonth = 11; _calYear--; }
    renderCalendar();
  });
  $("progress-cal-next")?.addEventListener("click", () => {
    _calMonth++;
    if (_calMonth > 11) { _calMonth = 0; _calYear++; }
    renderCalendar();
  });
}
