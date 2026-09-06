// ============================================================================
// REGIM — app.js
// Logika: Auth, Firestore (archiwum dzienne), kalendarz, To-Do, streak,
// stoper treningu mowy, moduł zegarka + mock AI Coach, wykresy Chart.js.
// ============================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// ----------------------------------------------------------------------------
// 1. KONFIGURACJA FIREBASE
// Podmień poniższe wartości na dane ze swojego projektu Firebase Console
// (Project Settings → General → Your apps → SDK setup and configuration).
// ----------------------------------------------------------------------------
const firebaseConfig = {
  apiKey: "TWOJ_API_KEY",
  authDomain: "TWOJ_PROJEKT.firebaseapp.com",
  projectId: "TWOJ_PROJEKT",
  storageBucket: "TWOJ_PROJEKT.appspot.com",
  messagingSenderId: "0000000000",
  appId: "1:0000000000:web:xxxxxxxxxxxxxxxx",
};

let app, auth, db;
let firebaseReady = false;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  firebaseReady = true;
} catch (e) {
  console.warn("Firebase nie skonfigurowany — działam w trybie lokalnym (localStorage).", e);
}

let currentUser = null;

// ----------------------------------------------------------------------------
// 2. STAŁE / DEFINICJE ZADAŃ
// ----------------------------------------------------------------------------

// dzień tygodnia JS: 0=niedziela...1=poniedziałek...6=sobota
function isMonday(date) {
  return date.getDay() === 1;
}

function buildTasksForDate(date) {
  const monday = isMonday(date);
  const tasks = [
    { id: "d3", label: "Witamina D3", icon: "💊" },
    { id: "dieta", label: "Dieta — kalorie / szejk", icon: "🥤" },
    monday
      ? { id: "trening", label: "Basen — 1,5h", icon: "🏊" }
      : { id: "trening", label: "Kalistenika", icon: "🤸" },
    { id: "mowa", label: "Trening mowy", icon: "🗣" },
  ];
  return tasks.map((t) => ({ ...t, done: false }));
}

function dateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`; // np. 2026-09-06
}

function todayDate() {
  return new Date();
}

// ----------------------------------------------------------------------------
// 3. WARSTWA DANYCH (Firestore z fallbackiem do localStorage)
// Struktura dokumentu dnia (kolekcja: users/{uid}/days/{YYYY-MM-DD}):
// {
//   date, tasks: [{id,label,done}], completedPct, streakAtDay,
//   watch: { sleep, steps, hr, calories, weight },
//   aiVerdict: string | null, aiScore: number | null
// }
// ----------------------------------------------------------------------------

function localKey(uid, key) {
  return `regim:${uid}:${key}`;
}

async function saveDayDoc(dayData) {
  const uid = currentUser?.uid || "local";
  if (firebaseReady && currentUser) {
    const ref = doc(db, "users", uid, "days", dayData.date);
    await setDoc(ref, dayData, { merge: true });
  } else {
    localStorage.setItem(localKey(uid, dayData.date), JSON.stringify(dayData));
  }
}

async function loadDayDoc(dateStr) {
  const uid = currentUser?.uid || "local";
  if (firebaseReady && currentUser) {
    const ref = doc(db, "users", uid, "days", dateStr);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() : null;
  } else {
    const raw = localStorage.getItem(localKey(uid, dateStr));
    return raw ? JSON.parse(raw) : null;
  }
}

async function loadMonthDocs(year, month) {
  // month: 0-11. Zwraca mapę { "YYYY-MM-DD": dayData }
  const uid = currentUser?.uid || "local";
  const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  const result = {};

  if (firebaseReady && currentUser) {
    const start = `${prefix}-01`;
    const end = `${prefix}-31`;
    const colRef = collection(db, "users", uid, "days");
    const q = query(colRef, where("date", ">=", start), where("date", "<=", end));
    const snaps = await getDocs(q);
    snaps.forEach((s) => (result[s.id] = s.data()));
  } else {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      const marker = `regim:${uid}:`;
      if (k.startsWith(marker) && k.slice(marker.length).startsWith(prefix)) {
        const dateStr = k.slice(marker.length);
        result[dateStr] = JSON.parse(localStorage.getItem(k));
      }
    }
  }
  return result;
}

async function loadLastNDays(n) {
  // Dla wykresów — pobiera dokumenty z ostatnich n dni (nieposortowane wg braków).
  const uid = currentUser?.uid || "local";
  const docs = [];
  const today = todayDate();

  if (firebaseReady && currentUser) {
    const colRef = collection(db, "users", uid, "days");
    const start = new Date(today);
    start.setDate(start.getDate() - (n - 1));
    const q = query(
      colRef,
      where("date", ">=", dateKey(start)),
      orderBy("date", "asc"),
      limit(n)
    );
    const snaps = await getDocs(q);
    snaps.forEach((s) => docs.push(s.data()));
  } else {
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const raw = localStorage.getItem(localKey(uid, dateKey(d)));
      if (raw) docs.push(JSON.parse(raw));
    }
  }
  return docs;
}

// ----------------------------------------------------------------------------
// 4. STREAK — logika brutalnego resetu
// ----------------------------------------------------------------------------

async function computeStreakUpTo(dateStr) {
  // Liczy wstecz od dnia poprzedzającego dateStr, ile pod rząd dni miało 100%.
  let streak = 0;
  let cursor = new Date(dateStr);
  cursor.setDate(cursor.getDate() - 1);

  // Ograniczenie do 400 dni wstecz jako zabezpieczenie przed pętlą nieskończoną.
  for (let i = 0; i < 400; i++) {
    const key = dateKey(cursor);
    const data = await loadDayDoc(key);
    if (data && data.completedPct === 100) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

function calcCompletionPct(tasks) {
  if (!tasks.length) return 0;
  const done = tasks.filter((t) => t.done).length;
  return Math.round((done / tasks.length) * 100);
}

// ----------------------------------------------------------------------------
// 5. STAN APLIKACJI
// ----------------------------------------------------------------------------

const state = {
  todayTasks: [],
  todayKey: dateKey(todayDate()),
  calYear: todayDate().getFullYear(),
  calMonth: todayDate().getMonth(), // 0-11
  streak: 0,
};

// ----------------------------------------------------------------------------
// 6. RENDEROWANIE: TO-DO
// ----------------------------------------------------------------------------

function renderTodoList() {
  const list = document.getElementById("todo-list");
  list.innerHTML = "";
  state.todayTasks.forEach((task, idx) => {
    const row = document.createElement("button");
    row.className = `w-full flex items-center gap-3 px-4 py-3.5 brutal-border bg-panel text-left transition ${
      task.done ? "border-win/60" : "hover:border-blood"
    }`;
    row.innerHTML = `
      <span class="w-6 h-6 flex-shrink-0 flex items-center justify-center brutal-border ${
        task.done ? "bg-win border-win" : "border-neutral-600"
      } font-mono text-xs">${task.done ? "✓" : ""}</span>
      <span class="text-xl">${task.icon}</span>
      <span class="flex-1 font-display uppercase tracking-wide text-sm ${
        task.done ? "task-done text-neutral-500" : "text-neutral-100"
      }">${task.label}</span>
    `;
    row.addEventListener("click", () => toggleTask(idx));
    list.appendChild(row);
  });

  const doneCount = state.todayTasks.filter((t) => t.done).length;
  document.getElementById("today-progress").textContent = `${doneCount}/${state.todayTasks.length}`;
}

async function toggleTask(idx) {
  state.todayTasks[idx].done = !state.todayTasks[idx].done;
  renderTodoList();
  await persistToday();
}

async function persistToday() {
  const pct = calcCompletionPct(state.todayTasks);
  const existing = (await loadDayDoc(state.todayKey)) || {};
  const dayData = {
    ...existing,
    date: state.todayKey,
    tasks: state.todayTasks,
    completedPct: pct,
  };
  await saveDayDoc(dayData);
  await refreshStreak();
  await renderCalendar(); // odśwież kolor dzisiejszego dnia w kalendarzu
}

async function refreshStreak() {
  const today = await loadDayDoc(state.todayKey);
  const pctToday = today?.completedPct ?? 0;
  const base = await computeStreakUpTo(state.todayKey);
  // Brutalny reset: jeśli dzisiaj nie jest 100%, streak "na żywo" pokazuje bazę
  // (dni wstecz), ale nie liczy dzisiaj dopóki nie osiągnie 100%.
  state.streak = pctToday === 100 ? base + 1 : base;
  const el = document.getElementById("streak-count");
  el.textContent = state.streak;
  const badge = document.getElementById("streak-badge");
  if (state.streak > 0) {
    badge.classList.add("streak-alive", "border-blood");
  } else {
    badge.classList.remove("streak-alive", "border-blood");
  }
}

// ----------------------------------------------------------------------------
// 7. RENDEROWANIE: KALENDARZ
// ----------------------------------------------------------------------------

const MONTH_NAMES = [
  "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
  "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień",
];

async function renderCalendar() {
  const { calYear, calMonth } = state;
  document.getElementById("cal-label").textContent = `${MONTH_NAMES[calMonth]} ${calYear}`;

  const monthDocs = await loadMonthDocs(calYear, calMonth);
  const grid = document.getElementById("cal-grid");
  grid.innerHTML = "";

  const firstOfMonth = new Date(calYear, calMonth, 1);
  // JS: 0=niedziela. Chcemy siatkę PN-ND, więc przesuwamy.
  let startOffset = firstOfMonth.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  for (let i = 0; i < startOffset; i++) {
    const empty = document.createElement("div");
    empty.className = "day-cell";
    grid.appendChild(empty);
  }

  const todayStr = dateKey(todayDate());

  for (let d = 1; d <= daysInMonth; d++) {
    const cellDate = new Date(calYear, calMonth, d);
    const key = dateKey(cellDate);
    const data = monthDocs[key];
    const pct = data?.completedPct;

    let colorClasses = "border-line text-neutral-500";
    if (pct === 100) colorClasses = "bg-winDim border-win text-neutral-100";
    else if (pct !== undefined && pct > 0) colorClasses = "bg-panel border-warn text-neutral-200";
    else if (pct === 0) colorClasses = "bg-bloodDim/40 border-blood text-neutral-200";

    const isToday = key === todayStr;

    const cell = document.createElement("button");
    cell.className = `day-cell brutal-border flex items-center justify-center font-mono text-xs relative ${colorClasses} ${
      isToday ? "ring-2 ring-neutral-100" : ""
    }`;
    cell.textContent = d;
    cell.addEventListener("click", () => openDayModal(key, cellDate));
    grid.appendChild(cell);
  }
}

document.getElementById("cal-prev")?.addEventListener("click", () => {
  state.calMonth -= 1;
  if (state.calMonth < 0) {
    state.calMonth = 11;
    state.calYear -= 1;
  }
  renderCalendar();
});
document.getElementById("cal-next")?.addEventListener("click", () => {
  state.calMonth += 1;
  if (state.calMonth > 11) {
    state.calMonth = 0;
    state.calYear += 1;
  }
  renderCalendar();
});

// ----------------------------------------------------------------------------
// 8. MODAL — ARCHIWUM DNIA
// ----------------------------------------------------------------------------

async function openDayModal(key, dateObj) {
  const data = await loadDayDoc(key);
  const backdrop = document.getElementById("modal-backdrop");
  const content = document.getElementById("modal-content");
  const dateLabel = dateObj.toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" });
  document.getElementById("modal-date").textContent = dateLabel;

  if (!data) {
    content.innerHTML = `<p class="text-neutral-500">Brak zapisanych danych dla tego dnia.</p>`;
  } else {
    const tasksHtml = (data.tasks || [])
      .map(
        (t) => `
      <div class="flex items-center gap-2">
        <span class="${t.done ? "text-win" : "text-blood"}">${t.done ? "✓" : "✕"}</span>
        <span class="${t.done ? "text-neutral-300" : "text-neutral-500 line-through"}">${t.label}</span>
      </div>`
      )
      .join("");

    const w = data.watch || {};
    const watchHtml = `
      <div class="grid grid-cols-2 gap-2 pt-2 border-t border-line">
        <div><span class="text-neutral-500">Sen:</span> ${w.sleep ?? "—"} h</div>
        <div><span class="text-neutral-500">Kroki:</span> ${w.steps ?? "—"}</div>
        <div><span class="text-neutral-500">Tętno:</span> ${w.hr ?? "—"} bpm</div>
        <div><span class="text-neutral-500">Kalorie:</span> ${w.calories ?? "—"} kcal</div>
        <div class="col-span-2"><span class="text-neutral-500">Waga:</span> ${w.weight ?? "—"} kg</div>
      </div>`;

    const aiHtml = data.aiVerdict
      ? `<div class="pt-2 border-t border-line">
           <div class="text-blood uppercase text-[10px] mb-1">Werdykt AI</div>
           <p class="text-neutral-300 whitespace-pre-line">${escapeHtml(data.aiVerdict)}</p>
         </div>`
      : "";

    content.innerHTML = `
      <div class="mb-1 flex items-center gap-2">
        <span class="font-display text-2xl ${data.completedPct === 100 ? "text-win" : "text-blood"}">${data.completedPct ?? 0}%</span>
        <span class="text-neutral-500 text-xs">wykonania</span>
      </div>
      <div class="space-y-1">${tasksHtml}</div>
      ${watchHtml}
      ${aiHtml}
    `;
  }

  backdrop.classList.remove("hidden");
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

document.getElementById("modal-close")?.addEventListener("click", () => {
  document.getElementById("modal-backdrop").classList.add("hidden");
});
document.getElementById("modal-backdrop")?.addEventListener("click", (e) => {
  if (e.target.id === "modal-backdrop") e.target.classList.add("hidden");
});

// ----------------------------------------------------------------------------
// 9. ZAKŁADKI
// ----------------------------------------------------------------------------

document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((b) => {
      b.classList.remove("tab-active");
      b.classList.add("text-neutral-500");
    });
    btn.classList.add("tab-active");
    btn.classList.remove("text-neutral-500");

    document.querySelectorAll(".tab-panel").forEach((p) => p.classList.add("hidden"));
    document.getElementById(`tab-${btn.dataset.tab}`).classList.remove("hidden");

    if (btn.dataset.tab === "watch") {
      renderCharts();
    }
  });
});

// ----------------------------------------------------------------------------
// 10. MODUŁ MOWY — STOPER FAZOWY
// ----------------------------------------------------------------------------

const SPEECH_PHASES = [
  { name: "Masaż / kląskanie", seconds: 120 },
  { name: "Szybkie T-D", seconds: 180 },
  { name: "Słowa: TDAWA, DOWED", seconds: 300 },
];

let speechTimerHandle = null;
let speechPhaseIdx = 0;
let speechRemaining = 0;
let speechAudioCtx = null;

function beep(freq = 880, duration = 250) {
  try {
    speechAudioCtx = speechAudioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const osc = speechAudioCtx.createOscillator();
    const gain = speechAudioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = "square";
    gain.gain.setValueAtTime(0.15, speechAudioCtx.currentTime);
    osc.connect(gain);
    gain.connect(speechAudioCtx.destination);
    osc.start();
    osc.stop(speechAudioCtx.currentTime + duration / 1000);
  } catch (e) {
    console.warn("Audio nieobsługiwane", e);
  }
}

function formatMMSS(totalSeconds) {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const s = Math.floor(totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function updateSpeechUI() {
  document.getElementById("speech-timer").textContent = formatMMSS(speechRemaining);
  document.getElementById("speech-phase-name").textContent = SPEECH_PHASES[speechPhaseIdx]?.name || "Gotowy";
  for (let i = 0; i < 3; i++) {
    const dot = document.getElementById(`phase-dot-${i + 1}`);
    if (i < speechPhaseIdx) dot.className = "h-1.5 bg-win";
    else if (i === speechPhaseIdx) dot.className = "h-1.5 bg-blood";
    else dot.className = "h-1.5 bg-line";
  }
}

function startSpeechTraining() {
  speechPhaseIdx = 0;
  speechRemaining = SPEECH_PHASES[0].seconds;
  document.getElementById("speech-start-btn").classList.add("hidden");
  document.getElementById("speech-stop-btn").classList.remove("hidden");
  beep(660, 200);
  updateSpeechUI();

  clearInterval(speechTimerHandle);
  speechTimerHandle = setInterval(() => {
    speechRemaining -= 1;
    if (speechRemaining < 0) {
      // Faza zakończona
      beep(880, 300);
      speechPhaseIdx += 1;
      if (speechPhaseIdx >= SPEECH_PHASES.length) {
        finishSpeechTraining();
        return;
      }
      speechRemaining = SPEECH_PHASES[speechPhaseIdx].seconds;
    }
    updateSpeechUI();
  }, 1000);
}

async function finishSpeechTraining() {
  clearInterval(speechTimerHandle);
  beep(1046, 500);
  setTimeout(() => beep(1318, 500), 200);
  document.getElementById("speech-phase-name").textContent = "Zakończono ✓";
  document.getElementById("speech-timer").textContent = "00:00";
  document.getElementById("speech-start-btn").classList.remove("hidden");
  document.getElementById("speech-stop-btn").classList.add("hidden");

  // Auto-odhaczenie zadania "mowa" na dzisiaj
  const idx = state.todayTasks.findIndex((t) => t.id === "mowa");
  if (idx !== -1 && !state.todayTasks[idx].done) {
    state.todayTasks[idx].done = true;
    renderTodoList();
    await persistToday();
    showToast("Trening mowy zaliczony ✓");
  }
}

function stopSpeechTraining() {
  clearInterval(speechTimerHandle);
  speechPhaseIdx = 0;
  speechRemaining = 0;
  updateSpeechUI();
  document.getElementById("speech-phase-name").textContent = "Przerwano";
  document.getElementById("speech-start-btn").classList.remove("hidden");
  document.getElementById("speech-stop-btn").classList.add("hidden");
}

document.getElementById("speech-start-btn")?.addEventListener("click", startSpeechTraining);
document.getElementById("speech-stop-btn")?.addEventListener("click", stopSpeechTraining);

// ----------------------------------------------------------------------------
// 11. MODUŁ ZEGARKA — FORMULARZ + WYKRESY
// ----------------------------------------------------------------------------

document.getElementById("watch-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const watch = {
    sleep: parseFloat(document.getElementById("input-sleep").value) || null,
    steps: parseInt(document.getElementById("input-steps").value) || null,
    hr: parseInt(document.getElementById("input-hr").value) || null,
    calories: parseInt(document.getElementById("input-calories").value) || null,
    weight: parseFloat(document.getElementById("input-weight").value) || null,
  };
  const existing = (await loadDayDoc(state.todayKey)) || { date: state.todayKey, tasks: state.todayTasks, completedPct: calcCompletionPct(state.todayTasks) };
  await saveDayDoc({ ...existing, watch });
  showToast("Dane zapisane.");
  renderCharts();
});

let weightChart = null;
let sleepChart = null;

async function renderCharts() {
  const docs = await loadLastNDays(7);
  const labels = docs.map((d) => {
    const [, m, day] = d.date.split("-");
    return `${day}.${m}`;
  });
  const weights = docs.map((d) => d.watch?.weight ?? null);
  const sleeps = docs.map((d) => d.watch?.sleep ?? null);

  const chartBaseOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: "#737373", font: { family: "JetBrains Mono", size: 10 } }, grid: { color: "#1a1a1a" } },
      y: { ticks: { color: "#737373", font: { family: "JetBrains Mono", size: 10 } }, grid: { color: "#1a1a1a" } },
    },
  };

  const weightCtx = document.getElementById("chart-weight");
  if (weightChart) weightChart.destroy();
  weightChart = new Chart(weightCtx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          data: weights,
          borderColor: "#dc2626",
          backgroundColor: "rgba(220,38,38,0.1)",
          pointBackgroundColor: "#dc2626",
          tension: 0.15,
          fill: true,
          spanGaps: true,
        },
      ],
    },
    options: chartBaseOptions,
  });

  const sleepCtx = document.getElementById("chart-sleep");
  if (sleepChart) sleepChart.destroy();
  sleepChart = new Chart(sleepCtx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          data: sleeps,
          backgroundColor: sleeps.map((s) => (s !== null && s < 7 ? "#dc2626" : "#16a34a")),
        },
      ],
    },
    options: chartBaseOptions,
  });
}

// ----------------------------------------------------------------------------
// 12. AI COACH — MOCK API + PROMPT SYSTEMOWY
// ----------------------------------------------------------------------------

// System prompt, który wysyłałbyś do prawdziwego API (np. Anthropic /v1/messages,
// OpenAI /v1/chat/completions albo dowolnego backendu-proxy).
// Podłącz realne wywołanie w funkcji callRealAI() poniżej — patrz komentarz.
const AI_COACH_SYSTEM_PROMPT = `
Jesteś bezlitosnym, toksycznym trenerem dyscypliny. Twój podopieczny prowadzi
rygorystyczny system codziennych zadań (D3, dieta, trening, mowa) i raportuje
dane z zegarka (sen, kroki, tętno, kalorie, waga).

ZASADY:
- Analizujesz wyłącznie dane podane w wiadomości użytkownika. Nie zmyślaj liczb.
- Jeśli sen < 7h — wyzywaj za lenistwo i tłumaczenie się zmęczeniem.
- Jeśli zadania nie są wykonane w 100% — brak taryfy ulgowej, wprost nazywaj to porażką.
- Jeśli waga rośnie lub stoi w miejscu mimo deklarowanej diety — drąż i konfrontuj.
- Jeśli wszystko zrobione i dane dobre — pochwal krótko, ale każ iść dalej, bez poklepywania po plecach.
- Styl: krótkie, uderzeniowe zdania. Bezpośrednio per "ty". Zero emotikonek, zero słodzenia.
- Maksymalnie 4-5 zdań. Kończ jednym konkretnym rozkazem na jutro.
- Nigdy nie udzielaj porad medycznych ani nie sugeruj konkretnych diet/leków — trzymaj się
  motywacji i dyscypliny, nie zdrowia klinicznego.
`.trim();

function buildUserPrompt(dayData) {
  const tasksSummary = (dayData.tasks || [])
    .map((t) => `${t.label}: ${t.done ? "ZROBIONE" : "NIEZROBIONE"}`)
    .join(", ");
  const w = dayData.watch || {};
  return `
Dane dnia ${dayData.date}:
Zadania — ${tasksSummary}
Wykonanie: ${dayData.completedPct ?? 0}%
Sen: ${w.sleep ?? "brak danych"} h
Kroki: ${w.steps ?? "brak danych"}
Średnie tętno: ${w.hr ?? "brak danych"} bpm
Spalone kalorie: ${w.calories ?? "brak danych"} kcal
Waga: ${w.weight ?? "brak danych"} kg

Oceń ten dzień jako trener.
`.trim();
}

// --- MOCK: symulacja odpowiedzi AI (działa offline, bez klucza API) ---------
async function mockAI(dayData) {
  await new Promise((r) => setTimeout(r, 900)); // symulacja opóźnienia sieci
  const pct = dayData.completedPct ?? 0;
  const w = dayData.watch || {};
  const lines = [];

  if (pct < 100) {
    lines.push(`${pct}% wykonania to porażka, nie wynik. Nie ma "prawie", jest zrobione albo nie.`);
  } else {
    lines.push(`100%. Dobra, to jest minimum, którego oczekuję — nie powód do świętowania.`);
  }

  if (w.sleep !== null && w.sleep !== undefined && w.sleep < 7) {
    lines.push(`${w.sleep}h snu? To nie regeneracja, to sabotaż własnego ciała.`);
  }

  if (w.steps !== null && w.steps !== undefined && w.steps < 5000) {
    lines.push(`${w.steps} kroków — siedzisz na tyłku cały dzień i się dziwisz brakowi progresu.`);
  }

  lines.push(`Jutro zero wymówek. Zaczynasz o tej samej porze, kończysz zadania do wieczora.`);

  return lines.join(" ");
}

// --- REALNE API (opcjonalne): odkomentuj i podłącz swój endpoint -----------
// Wysyłaj request do WŁASNEGO backendu-proxy (np. Cloudflare Worker), który
// trzyma klucz API po stronie serwera — NIGDY nie wklejaj klucza API w kod
// front-endowy hostowany na GitHub Pages.
async function callRealAI(dayData) {
  const response = await fetch("https://twoj-backend-proxy.example.com/api/coach", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system: AI_COACH_SYSTEM_PROMPT,
      user: buildUserPrompt(dayData),
    }),
  });
  if (!response.ok) throw new Error("Błąd API AI");
  const data = await response.json();
  return data.reply; // dostosuj do formatu odpowiedzi Twojego backendu
}

document.getElementById("btn-analyze-ai")?.addEventListener("click", async () => {
  const btnLabel = document.getElementById("ai-btn-label");
  const spinner = document.getElementById("ai-btn-spinner");
  btnLabel.textContent = "Analizuję...";
  spinner.classList.remove("hidden");

  try {
    const dayData = (await loadDayDoc(state.todayKey)) || {
      date: state.todayKey,
      tasks: state.todayTasks,
      completedPct: calcCompletionPct(state.todayTasks),
    };

    // Domyślnie: mock. Aby użyć realnego API, zamień na: await callRealAI(dayData)
    const verdict = await mockAI(dayData);

    await saveDayDoc({ ...dayData, aiVerdict: verdict });

    document.getElementById("ai-result-box").classList.remove("hidden");
    document.getElementById("ai-result-text").textContent = verdict;

    document.getElementById("ai-verdict-box").classList.remove("hidden");
    document.getElementById("ai-verdict-text").textContent = verdict;
  } catch (err) {
    showToast("Błąd analizy AI.");
    console.error(err);
  } finally {
    btnLabel.textContent = "Analizuj dzień z AI";
    spinner.classList.add("hidden");
  }
});

// ----------------------------------------------------------------------------
// 13. TOAST
// ----------------------------------------------------------------------------

function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.remove("hidden");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.add("hidden"), 2500);
}

// ----------------------------------------------------------------------------
// 14. AUTH
// ----------------------------------------------------------------------------

document.getElementById("btn-signin")?.addEventListener("click", async () => {
  if (!firebaseReady) {
    showToast("Firebase nieskonfigurowany — tryb lokalny aktywny.");
    return;
  }
  try {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  } catch (e) {
    console.warn("Logowanie Google nieudane, próbuję anonimowo.", e);
    try {
      await signInAnonymously(auth);
    } catch (e2) {
      showToast("Błąd logowania.");
    }
  }
});

async function initAuthListener() {
  if (!firebaseReady) {
    currentUser = { uid: "local" };
    await bootApp();
    return;
  }
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUser = user;
      document.getElementById("btn-signin").classList.add("hidden");
      const badge = document.getElementById("user-badge");
      badge.textContent = user.displayName || user.uid.slice(0, 8);
      badge.classList.remove("hidden");
    } else {
      currentUser = null;
    }
    await bootApp();
  });
}

// ----------------------------------------------------------------------------
// 15. BOOTSTRAP APLIKACJI
// ----------------------------------------------------------------------------

let booted = false;

async function bootApp() {
  if (booted) {
    // Re-render po zmianie usera (np. zalogowanie w trakcie)
    await loadTodayTasks();
    renderTodoList();
    await refreshStreak();
    await renderCalendar();
    return;
  }
  booted = true;

  await loadTodayTasks();
  renderTodoList();
  await refreshStreak();
  await renderCalendar();

  const savedToday = await loadDayDoc(state.todayKey);
  if (savedToday?.aiVerdict) {
    document.getElementById("ai-verdict-box").classList.remove("hidden");
    document.getElementById("ai-verdict-text").textContent = savedToday.aiVerdict;
  }
  if (savedToday?.watch) {
    const w = savedToday.watch;
    if (w.sleep) document.getElementById("input-sleep").value = w.sleep;
    if (w.steps) document.getElementById("input-steps").value = w.steps;
    if (w.hr) document.getElementById("input-hr").value = w.hr;
    if (w.calories) document.getElementById("input-calories").value = w.calories;
    if (w.weight) document.getElementById("input-weight").value = w.weight;
  }
}

async function loadTodayTasks() {
  const existing = await loadDayDoc(state.todayKey);
  if (existing?.tasks?.length) {
    state.todayTasks = existing.tasks;
  } else {
    state.todayTasks = buildTasksForDate(todayDate());
    await saveDayDoc({
      date: state.todayKey,
      tasks: state.todayTasks,
      completedPct: 0,
    });
  }
}

// ----------------------------------------------------------------------------
// 16. SERVICE WORKER — rejestracja + kanał powiadomień
// ----------------------------------------------------------------------------

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const reg = await navigator.serviceWorker.register("sw.js");
      console.log("Service Worker zarejestrowany.", reg.scope);

      if ("Notification" in window && Notification.permission === "default") {
        // Prośba o zgodę na powiadomienia przy pierwszej wizycie.
        await Notification.requestPermission();
      }

      // Periodic Background Sync — działa tylko w zainstalowanych PWA na Chrome/Android.
      try {
        if ("periodicSync" in reg) {
          const status = await navigator.permissions.query({ name: "periodic-background-sync" });
          if (status.state === "granted") {
            await reg.periodicSync.register("regim-schedule-check", {
              minInterval: 15 * 60 * 1000, // co najmniej co 15 min
            });
          }
        }
      } catch (e) {
        console.warn("Periodic Background Sync niedostępny.", e);
      }

      // Fallback: dopóki karta jest otwarta, co minutę każemy SW sprawdzić harmonogram.
      setInterval(() => {
        reg.active?.postMessage({ type: "check-schedule" });
      }, 60 * 1000);
      reg.active?.postMessage({ type: "check-schedule" });
    } catch (e) {
      console.warn("Rejestracja Service Workera nieudana.", e);
    }
  });
}

// ----------------------------------------------------------------------------
// START
// ----------------------------------------------------------------------------

initAuthListener();
