// ============================================================================
// LOCK IN 2027 — js/modules/health.js
// Formularze (sen, HR, kroki, waga, stres, nastrój), gotowość dnia, wykresy.
// ============================================================================

import { $, escapeHtml, todayKey, formatDatePL } from "../core/utils.js";
import { getSettings } from "../core/storage.js";
import { loadDayDoc, saveDayDoc, loadLastNDays } from "../core/data.js";
import { state } from "../state.js";
import { showToast } from "../components/toast.js";
import { makeLine, makeBar, COLORS } from "../components/chart.js";
import { persistToday } from "./tasks.js";

// --- RHR ranges po wieku -------------------------------------------------
export function getRhrRange(age) {
  if (!age || age < 6) return { min: 75, max: 120, label: "małe dzieci" };
  if (age < 12) return { min: 70, max: 110, label: "dzieci 6-11" };
  if (age < 18) return { min: 60, max: 90, label: "nastolatki 12-17" };
  if (age < 65) return { min: 60, max: 100, label: "dorośli" };
  return { min: 60, max: 100, label: "seniorzy" };
}

// --- Readiness (0-100) ---------------------------------------------------
export function calculateReadiness() {
  const m = state.morning || {};
  const e = state.evening || {};
  const age = getSettings().age;
  const range = getRhrRange(age);
  let score = 0, max = 0;

  if (m.sleepTotal != null) {
    max += 40;
    const s = m.sleepTotal;
    if (s >= 8) score += 40;
    else if (s >= 7) score += 32;
    else if (s >= 6) score += 20;
    else if (s >= 5) score += 10;
  }
  if (m.sleepDeep != null && m.sleepTotal) {
    max += 15;
    const r = m.sleepDeep / m.sleepTotal;
    if (r >= 0.20) score += 15;
    else if (r >= 0.15) score += 10;
    else if (r >= 0.10) score += 5;
  }
  if (m.rhr != null) {
    max += 20;
    if (m.rhr <= range.max && m.rhr >= range.min) score += 20;
    else if (m.rhr < range.min && m.rhr >= 50) score += 18;
    else if (m.rhr <= range.max + 5) score += 12;
    else if (m.rhr <= range.max + 15) score += 5;
  }
  if (e.stress != null) {
    max += 15;
    const s = e.stress;
    if (s < 25) score += 15;
    else if (s < 40) score += 12;
    else if (s < 55) score += 8;
    else if (s < 70) score += 3;
  }
  if (m.breathing != null) {
    max += 10;
    if (m.breathing >= 95) score += 10;
    else if (m.breathing >= 85) score += 7;
    else if (m.breathing >= 70) score += 4;
  }
  if (max === 0) return null;
  return Math.round((score / max) * 100);
}

export function getTrainingLevel() {
  const m = state.morning || {};
  const age = getSettings().age;
  const range = getRhrRange(age);
  const readiness = calculateReadiness();
  if (m.sleepTotal != null && m.sleepTotal < 5) return "recovery";
  if (m.rhr != null && m.rhr > range.max + 15) return "recovery";
  if (m.breathing != null && m.breathing < 70) return "recovery";
  if (readiness != null && readiness < 40) return "recovery";
  if (m.sleepTotal != null && m.sleepTotal < 6.5) return "light";
  if (m.moodMorning != null && m.moodMorning <= 3) return "light";
  if (m.rhr != null && m.rhr > range.max) return "light";
  if (readiness != null && readiness < 60) return "light";
  if (readiness != null && readiness >= 80) return "full";
  return "normal";
}

function renderReadinessCard() {
  const pct = calculateReadiness();
  if (pct == null) {
    return `
      <div class="card">
        <div class="card-header"><div class="card-title">Gotowość dnia</div></div>
        <div class="text-sm text-tertiary">Uzupełnij poranny raport — policzymy gotowość z dostępnych danych.</div>
      </div>
    `;
  }
  let color = COLORS.accent, label = "Umiarkowana";
  if (pct >= 80) { color = COLORS.success; label = "Pełna gotowość"; }
  else if (pct >= 60) { color = COLORS.warning; label = "Umiarkowana"; }
  else if (pct >= 40) { color = COLORS.warning; label = "Obniżona"; }
  else { color = COLORS.danger; label = "Niska"; }

  const size = 120, radius = 52, circ = 2 * Math.PI * radius;
  const offset = circ - (pct / 100) * circ;

  return `
    <div class="card">
      <div class="card-header">
        <div>
          <div class="card-subtitle">GOTOWOŚĆ DNIA</div>
          <div class="card-title" style="margin-top:4px;">${label}</div>
        </div>
      </div>
      <div class="row" style="gap:16px;align-items:center;">
        <div class="ring" style="width:${size}px;height:${size}px;">
          <svg width="${size}" height="${size}">
            <circle class="ring-track" cx="${size/2}" cy="${size/2}" r="${radius}" fill="none" stroke-width="8"/>
            <circle cx="${size/2}" cy="${size/2}" r="${radius}" fill="none" stroke="${color}" stroke-width="8"
              stroke-linecap="round" stroke-dasharray="${circ}" stroke-dashoffset="${offset}"
              style="transition:stroke-dashoffset 800ms ease-out;"/>
          </svg>
          <div class="ring-value" style="font-size:26px;">${pct}</div>
        </div>
        <div style="flex:1;min-width:0;font-size:13px;color:var(--text-secondary);line-height:1.5;">
          Gotowość liczona z: sen, RHR, stres, oddech. To nie diagnoza medyczna.
        </div>
      </div>
    </div>
  `;
}

// --- Formularze ----------------------------------------------------------
function morningForm(m) {
  return `
    <form id="form-morning" class="stack">
      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">Sen (h)</label>
          <input type="number" step="0.01" class="input" id="in-sleep-total" placeholder="8.0" value="${m.sleepTotal ?? ""}">
        </div>
        <div class="form-group">
          <label class="form-label">Głęboki (h)</label>
          <input type="number" step="0.01" class="input" id="in-sleep-deep" placeholder="1.4" value="${m.sleepDeep ?? ""}">
        </div>
        <div class="form-group">
          <label class="form-label">REM (h)</label>
          <input type="number" step="0.01" class="input" id="in-sleep-rem" placeholder="1.5" value="${m.sleepRem ?? ""}">
        </div>
        <div class="form-group">
          <label class="form-label">Pobudki</label>
          <input type="number" class="input" id="in-sleep-wakes" placeholder="2" value="${m.sleepWakes ?? ""}">
        </div>
        <div class="form-group">
          <label class="form-label">Śr. HR snu</label>
          <input type="number" class="input" id="in-sleep-hr" placeholder="58" value="${m.sleepHr ?? ""}">
        </div>
        <div class="form-group">
          <label class="form-label">RHR</label>
          <input type="number" class="input" id="in-rhr" placeholder="72" value="${m.rhr ?? ""}">
        </div>
        <div class="form-group">
          <label class="form-label">Oddech</label>
          <input type="number" class="input" id="in-breathing" placeholder="95" value="${m.breathing ?? ""}">
        </div>
        <div class="form-group">
          <label class="form-label">Waga (kg)</label>
          <input type="number" step="0.1" class="input" id="in-weight" placeholder="45.0" value="${m.dailyWeight ?? ""}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Nastrój: <span id="mood-m-val" class="text-accent font-bold">${m.moodMorning ?? 5}</span>/10</label>
        <input type="range" min="1" max="10" value="${m.moodMorning ?? 5}" id="in-mood-m" class="slider">
      </div>
      <button type="submit" class="btn btn-primary btn-block"><i class="fa-solid fa-floppy-disk"></i> Zapisz rano</button>
    </form>
  `;
}

function eveningForm(e, note) {
  return `
    <form id="form-evening" class="stack">
      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">Kroki</label>
          <input type="number" class="input" id="in-steps" placeholder="9000" value="${e.steps ?? ""}">
        </div>
        <div class="form-group">
          <label class="form-label">Kcal spalone</label>
          <input type="number" class="input" id="in-kcal" placeholder="2200" value="${e.kcalBurned ?? ""}">
        </div>
        <div class="form-group">
          <label class="form-label">Śr. HR</label>
          <input type="number" class="input" id="in-hr-day" placeholder="78" value="${e.hrDay ?? ""}">
        </div>
        <div class="form-group">
          <label class="form-label">SpO2 (%)</label>
          <input type="number" class="input" id="in-spo2" placeholder="97" value="${e.spo2Day ?? ""}">
        </div>
        <div class="form-group">
          <label class="form-label">RPE (1-10)</label>
          <input type="number" min="1" max="10" class="input" id="in-rpe" placeholder="7" value="${e.rpe ?? ""}">
        </div>
        <div class="form-group">
          <label class="form-label">Stres (0-100)</label>
          <input type="number" min="0" max="100" class="input" id="in-stress" placeholder="35" value="${e.stress ?? ""}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Nastrój: <span id="mood-e-val" class="text-accent font-bold">${e.moodEvening ?? 5}</span>/10</label>
        <input type="range" min="1" max="10" value="${e.moodEvening ?? 5}" id="in-mood-e" class="slider">
      </div>
      <div class="form-group">
        <label class="form-label">Notatka</label>
        <textarea class="textarea" id="in-note" placeholder="jak było dzisiaj...">${escapeHtml(note || "")}</textarea>
      </div>
      <button type="submit" class="btn btn-primary btn-block"><i class="fa-solid fa-floppy-disk"></i> Zapisz wieczór</button>
    </form>
  `;
}

// --- Wykresy -------------------------------------------------------------
async function renderCharts() {
  const days = await loadLastNDays(14);
  const labels = days.map(d => {
    const [, mm, dd] = (d.date || "").split("-");
    return `${dd}.${mm}`;
  });
  const sleeps = days.map(d => (d.morning && d.morning.sleepTotal) ?? null);
  const rhrs = days.map(d => (d.morning && d.morning.rhr) ?? null);
  const steps = days.map(d => (d.evening && d.evening.steps) ?? null);

  makeBar("health-chart-sleep", labels, sleeps, COLORS.accent, "Sen (h)");
  makeLine("health-chart-rhr", labels, rhrs, COLORS.success, "RHR");
  makeBar("health-chart-steps", labels, steps, COLORS.info, "Kroki");
}

// --- Render --------------------------------------------------------------
export async function render(container) {
  const today = await loadDayDoc(todayKey());
  state.morning = (today && today.morning) || {};
  state.evening = (today && today.evening) || {};
  state.note = (today && today.note) || "";

  const m = state.morning;
  const e = state.evening;

  container.innerHTML = `
    <div class="stack-lg">
      ${renderReadinessCard()}

      <div class="tabs" id="health-tabs">
        <button class="tab active" data-tab="morning">☀️ Rano</button>
        <button class="tab" data-tab="evening">🌙 Wieczór</button>
        <button class="tab" data-tab="charts">📊 Wykresy</button>
      </div>

      <div data-panel="morning">${morningForm(m)}</div>
      <div data-panel="evening" class="hidden">${eveningForm(e, state.note)}</div>
      <div data-panel="charts" class="hidden">
        <div class="card"><div class="card-header"><div class="card-title">Sen (14 dni)</div></div><div class="chart-container"><canvas id="health-chart-sleep"></canvas></div></div>
        <div class="card"><div class="card-header"><div class="card-title">RHR (14 dni)</div></div><div class="chart-container"><canvas id="health-chart-rhr"></canvas></div></div>
        <div class="card"><div class="card-header"><div class="card-title">Kroki (14 dni)</div></div><div class="chart-container"><canvas id="health-chart-steps"></canvas></div></div>
      </div>
    </div>
  `;

  // Tabs
  container.querySelectorAll("#health-tabs .tab").forEach(tab => {
    tab.addEventListener("click", () => {
      container.querySelectorAll("#health-tabs .tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      container.querySelectorAll("[data-panel]").forEach(p => p.classList.add("hidden"));
      const target = container.querySelector(`[data-panel="${tab.dataset.tab}"]`);
      if (target) target.classList.remove("hidden");
      if (tab.dataset.tab === "charts") renderCharts();
    });
  });

  // Slider moods
  const moodM = $("in-mood-m");
  if (moodM) moodM.addEventListener("input", ev => { $("mood-m-val").textContent = ev.target.value; });
  const moodE = $("in-mood-e");
  if (moodE) moodE.addEventListener("input", ev => { $("mood-e-val").textContent = ev.target.value; });

  // Form morning
  const formM = $("form-morning");
  if (formM) formM.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const g = (id) => { const el = $(id); const v = el?.value; return v === "" || v == null ? null : parseFloat(v); };
    state.morning = {
      sleepTotal: g("in-sleep-total"),
      sleepDeep: g("in-sleep-deep"),
      sleepRem: g("in-sleep-rem"),
      sleepWakes: g("in-sleep-wakes"),
      sleepHr: g("in-sleep-hr"),
      rhr: g("in-rhr"),
      breathing: g("in-breathing"),
      dailyWeight: g("in-weight"),
      moodMorning: parseInt($("in-mood-m")?.value) || 5,
      completedAt: Date.now()
    };
    const existing = (await loadDayDoc(todayKey())) || {};
    await saveDayDoc({ ...existing, date: todayKey(), morning: state.morning, updatedAt: Date.now() });
    await persistToday();
    showToast("✅ Raport poranny zapisany", "success");
    render(container);
  });

  // Form evening
  const formE = $("form-evening");
  if (formE) formE.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const g = (id) => { const el = $(id); const v = el?.value; return v === "" || v == null ? null : parseFloat(v); };
    state.evening = {
      steps: g("in-steps"),
      kcalBurned: g("in-kcal"),
      hrDay: g("in-hr-day"),
      spo2Day: g("in-spo2"),
      rpe: g("in-rpe"),
      stress: g("in-stress"),
      moodEvening: parseInt($("in-mood-e")?.value) || 5,
      completedAt: Date.now()
    };
    state.note = $("in-note")?.value || "";
    const existing = (await loadDayDoc(todayKey())) || {};
    await saveDayDoc({ ...existing, date: todayKey(), evening: state.evening, note: state.note, updatedAt: Date.now() });
    await persistToday();
    showToast("✅ Podsumowanie wieczoru zapisane", "success");
    render(container);
  });
}
