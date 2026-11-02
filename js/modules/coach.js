// ============================================================================
// LOCK IN 2027 — js/modules/coach.js
// AI Coach (lokalna analiza), czarna lista, baza wiedzy, fiszka dnia, RAGE.
// ============================================================================

import { $, escapeHtml, dateKey, vibrate, playSound } from "../core/utils.js";
import { BLACK_LIST, RAGE_QUOTES, GUIDE_SECTIONS, KNOWLEDGE_BASE, FACTS, KEYWORDS } from "../core/constants.js";
import { loadDayDoc, loadLastNDays, saveAnalysisToHistory, loadAnalysisHistory } from "../core/data.js";
import { getSettings } from "../core/storage.js";
import { state } from "../state.js";
import { showToast } from "../components/toast.js";
import { calculateReadiness, getTrainingLevel, getRhrRange } from "./health.js";
import { calcCompletionPct, calcCompletionStats } from "./tasks.js";

// --- Keywords -----------------------------------------------------------
function detectKeywords(text) {
  if (!text) return [];
  const lower = text.toLowerCase();
  const found = new Set();
  Object.keys(KEYWORDS).forEach(cat => {
    if (KEYWORDS[cat].some(w => lower.indexOf(w) >= 0)) found.add(cat);
  });
  return Array.from(found);
}

// --- Analysis sections --------------------------------------------------
function sec(title, icon, body, color) {
  return `<div class="card card-padded-sm"><div class="card-subtitle" style="color:${color || "var(--accent)"};">${icon} ${title}</div><div class="text-sm text-secondary mt-2" style="line-height:1.6;">${body}</div></div>`;
}

async function generateFullAnalysis() {
  const last7 = await loadLastNDays(8);
  const today = last7[last7.length - 1] || {};
  const m = today.morning || {};
  const e = today.evening || {};
  const kws = detectKeywords(today.note);
  const age = getSettings().age;
  const rhrRange = getRhrRange(age);
  const readiness = calculateReadiness();
  const level = getTrainingLevel();
  const sections = [];

  // Scenariusze
  if (kws.indexOf("vape") >= 0) sections.push(sec("VAPE ALERT", "🚭", "Odrzucasz to. Wapek = koniec drogi.", "#f87171"));
  if (kws.indexOf("alcohol") >= 0) sections.push(sec("ALKOHOL", "🍺", "Spadek testosteronu. Nie ma opcji.", "#f87171"));
  if (kws.indexOf("lazy") >= 0) sections.push(sec("LENISTWO", "💀", "Jedna rzecz teraz. Ruszyć dupe.", "#f87171"));
  if (kws.indexOf("sick") >= 0) sections.push(sec("CHOROBA", "🤒", "Zero treningu, sen, woda.", "#fbbf24"));
  if (kws.indexOf("stress") >= 0) sections.push(sec("STRES", "🧘", "Oddech 4-7-8. 5 minut.", "#fbbf24"));

  // Sen
  let b = "";
  if (m.sleepTotal == null) b = "Brak danych o snie.";
  else {
    const s = m.sleepTotal;
    if (s >= 8) b = `<strong>${s.toFixed(1)}h</strong> — kozacki sen.`;
    else if (s >= 7) b = `<strong>${s.toFixed(1)}h</strong> — ok, celuj w 8+.`;
    else if (s >= 6) b = `<strong>${s.toFixed(1)}h</strong> — poniżej progu.`;
    else b = `<em>Tylko ${s.toFixed(1)}h.</em> Masa nie rośnie na takim śnie.`;
  }
  sections.push(sec("Sen", "🌙", b, "#4ade80"));

  // RHR
  if (m.rhr != null) {
    let r = `Norma wieku ${age}: <strong>${rhrRange.min}–${rhrRange.max} bpm</strong>. `;
    if (m.rhr > rhrRange.max) r += `<em>Powyżej normy.</em> Odpocznij.`;
    else r += `RHR <strong>${m.rhr} bpm</strong> — w normie.`;
    sections.push(sec("RHR", "💓", r, "#4ade80"));
  }

  // Gotowość / trening
  let tb = "";
  if (readiness == null) tb = "Za mało danych.";
  else {
    tb = `Gotowość: <strong>${readiness}%</strong>. `;
    if (readiness >= 80) tb += "Dziś mocny trening.";
    else if (readiness >= 60) tb += "Standardowy trening.";
    else if (readiness >= 40) tb += "Lżejszy dzień.";
    else tb += "<em>Recovery.</em>";
  }
  sections.push(sec("Trening", "🏋️", tb, "#b6f05a"));

  // Zadania
  const stats = calcCompletionStats();
  const pct = calcCompletionPct();
  let zb = `Zadania: <strong>${stats.requiredDone}/${stats.requiredTotal}</strong> (${pct}%). `;
  if (pct === 100) zb += "PERFECT DAY!";
  else if (pct >= 75) zb += "Bardzo dobrze.";
  else if (pct >= 50) zb += "Połowa za tobą.";
  else if (pct > 0) zb += "<em>Słabo.</em>";
  else zb += "<em>Zero.</em> Jedno teraz.";
  sections.push(sec("Zadania", "✅", zb, "#4ade80"));

  // Priorytet
  const priorities = [];
  if (m.sleepTotal != null && m.sleepTotal < 7) priorities.push("Sen 8h+ dziś.");
  if (m.rhr != null && m.rhr > rhrRange.max) priorities.push("RHR powyżej normy — odpocznij.");
  if (stats.requiredDone < stats.requiredTotal) priorities.push(`Dokończ ${stats.requiredTotal - stats.requiredDone} zadań.`);
  if (!priorities.length) priorities.push("Utrzymaj rytm.");
  const fact = FACTS[Math.floor(Math.random() * FACTS.length)];
  sections.push(sec("Priorytety", "🎯", `<strong>${priorities.join("<br>• ")}</strong><br><br>💡 ${fact}`, "#b6f05a"));

  return sections.join("");
}

// --- RAGE ---------------------------------------------------------------
function showRage() {
  const q = RAGE_QUOTES[Math.floor(Math.random() * RAGE_QUOTES.length)];
  vibrate([200, 100, 200]);
  try { playSound("done"); } catch (e) {}
  openRageModal(q);
}

function openRageModal(quote) {
  import("../components/modal.js").then(({ openModal }) => {
    openModal({
      title: "🔥 RAGE MODE",
      body: `<div class="text-center"><div style="font-size:64px;margin-bottom:12px;">🔥</div><div class="text-xl font-black text-danger" style="line-height:1.3;">${escapeHtml(quote)}</div><div class="text-xs text-tertiary mt-3" style="letter-spacing:.1em;">— RAGE MODE ON —</div></div>`,
      actions: [{ label: "RUSZAM", variant: "primary" }]
    });
  });
}

// --- Render sections ----------------------------------------------------
function renderBlackList() {
  return BLACK_LIST.map(b => `
    <div class="card card-padded-sm" style="border-left:3px solid var(--danger);">
      <div class="row" style="gap:12px;align-items:flex-start;">
        <div class="text-danger font-black" style="font-size:14px;flex-shrink:0;">${b.num}</div>
        <div style="flex:1;min-width:0;">
          <div class="font-bold text-danger" style="font-size:12px;margin-bottom:4px;">${escapeHtml(b.title)}</div>
          <div class="text-xs text-secondary" style="line-height:1.5;">${escapeHtml(b.body)}</div>
        </div>
      </div>
    </div>
  `).join("");
}

function renderGuide() {
  return GUIDE_SECTIONS.map((g, i) => `
    <details class="card card-padded-sm">
      <summary style="cursor:pointer;display:flex;justify-content:space-between;align-items:center;font-weight:700;font-size:13px;">
        <span>${g.icon} ${escapeHtml(g.title)}</span>
        <i class="fa-solid fa-chevron-down text-tertiary" style="font-size:11px;"></i>
      </summary>
      <p class="text-sm text-secondary mt-3" style="line-height:1.6;">${escapeHtml(g.body)}</p>
    </details>
  `).join("");
}

function renderKB() {
  return KNOWLEDGE_BASE.map(k => `
    <details class="card card-padded-sm">
      <summary style="cursor:pointer;font-weight:700;font-size:13px;">${escapeHtml(k.title)}</summary>
      <p class="text-sm text-secondary mt-3" style="line-height:1.6;">${escapeHtml(k.body)}</p>
    </details>
  `).join("");
}

function renderFactOfDay() {
  const idx = Math.floor(Date.now() / 86400000) % FACTS.length;
  return `<p class="text-sm text-secondary" style="line-height:1.6;">💡 ${FACTS[idx]}</p>`;
}

function renderHistory() {
  const history = loadAnalysisHistory();
  if (!history.length) return `<div class="empty"><div class="empty-icon">📜</div><div class="empty-text">Brak historii analiz</div></div>`;
  return history.map(h => `
    <div class="card card-padded-sm">
      <div class="font-bold text-accent" style="font-size:12px;margin-bottom:6px;">${h.date}</div>
      <div class="text-xs text-secondary" style="line-height:1.5;">${h.html}</div>
    </div>
  `).join("");
}

// --- Render main --------------------------------------------------------
export async function render(container) {
  const today = await loadDayDoc(dateKey(new Date()));
  state.morning = (today && today.morning) || {};
  state.evening = (today && today.evening) || {};
  state.note = (today && today.note) || "";

  container.innerHTML = `
    <div class="stack-lg">
      <div class="row" style="gap:8px;flex-wrap:wrap;">
        <button class="btn btn-danger" id="coach-rage-btn" style="flex:1;"><i class="fa-solid fa-fire"></i> RAGE</button>
        <button class="btn btn-primary" id="coach-analyze-btn" style="flex:2;"><i class="fa-solid fa-dumbbell"></i> Pełna analiza</button>
      </div>

      <div id="coach-analysis-box" class="hidden stack"></div>

      <div>
        <div class="section-header"><span class="section-header-title">🚫 Czarna lista</span></div>
        <div class="stack-sm">${renderBlackList()}</div>
      </div>

      <div>
        <div class="section-header"><span class="section-header-title">📖 Jak się zmienić</span></div>
        <div class="stack-sm">${renderGuide()}</div>
      </div>

      <div>
        <div class="section-header"><span class="section-header-title">📚 Baza wiedzy</span></div>
        <div class="stack-sm">${renderKB()}</div>
      </div>

      <div class="card">
        <div class="card-header"><div class="card-title">💡 Fiszka dnia</div></div>
        ${renderFactOfDay()}
      </div>

      <div>
        <div class="section-header"><span class="section-header-title">📜 Historia analiz</span></div>
        <div class="stack-sm">${renderHistory()}</div>
      </div>
    </div>
  `;

  $("coach-rage-btn")?.addEventListener("click", showRage);

  $("coach-analyze-btn")?.addEventListener("click", async () => {
    const btn = $("coach-analyze-btn");
    const box = $("coach-analysis-box");
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Analizuję...';
    await new Promise(r => setTimeout(r, 300));
    const html = await generateFullAnalysis();
    box.innerHTML = html;
    box.classList.remove("hidden");
    saveAnalysisToHistory(html);
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-dumbbell"></i> Pełna analiza';
    vibrate(30); playSound("done");
    showToast("🔥 Analiza gotowa", "success");
    box.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}
