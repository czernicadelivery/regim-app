// ============================================================================
// LOCK IN 2027 — js/modules/onboarding.js
// Onboarding 4.0: 8 kroków. Zapisuje rozszerzony profil (modes, goals, schedule, budget).
// ============================================================================

import { $, escapeHtml } from "../core/utils.js";
import { saveProfile } from "../core/data.js";
import { state } from "../state.js";
import { showToast } from "../components/toast.js";
import { MODES } from "../core/modes.js";

// ============================================================================
// DANE
// ============================================================================

const GOALS = [
  { id: "lose-weight", label: "Schudnąć", icon: "⚖️" },
  { id: "gain-weight", label: "Przybrać na wadze", icon: "📈" },
  { id: "build-muscle", label: "Zbudować mięśnie", icon: "💪" },
  { id: "improve-strength", label: "Poprawić siłę", icon: "🏋️" },
  { id: "improve-fitness", label: "Poprawić kondycję", icon: "🏃" },
  { id: "health", label: "Dbać o zdrowie", icon: "❤️" },
  { id: "looks", label: "Poprawić wygląd", icon: "👁️" },
  { id: "skincare", label: "Rozwinąć skincare", icon: "✨" },
  { id: "hair", label: "Wygląd włosów", icon: "💇" },
  { id: "style", label: "Styl ubierania", icon: "👔" },
  { id: "hygiene", label: "Higiena i grooming", icon: "🧼" },
  { id: "consistency", label: "Regularność", icon: "🔁" },
  { id: "sleep", label: "Poprawić sen", icon: "😴" },
  { id: "nutrition", label: "Odżywianie", icon: "🍽️" },
  { id: "focus", label: "Koncentracja", icon: "🧠" },
  { id: "organization", label: "Organizacja", icon: "📅" }
];

const BUDGETS = [
  { id: "0", label: "0 zł — bez wydatków", desc: "Bez zakupów, bez presji" },
  { id: "30", label: "Do 30 zł / mies.", desc: "Podstawowe produkty" },
  { id: "60", label: "30–60 zł / mies.", desc: "Umiarkowany budżet" },
  { id: "100", label: "60–100 zł / mies.", desc: "Rozszerzony zestaw" },
  { id: "100plus", label: "100+ zł / mies.", desc: "Bez limitu" },
  { id: "na", label: "Nie chcę określać" }
];

const DAYS = [
  { id: 1, label: "Pon" }, { id: 2, label: "Wt" }, { id: 3, label: "Śr" },
  { id: 4, label: "Czw" }, { id: 5, label: "Pt" }, { id: 6, label: "Sob" }, { id: 0, label: "Nd" }
];

const STEPS = [
  { id: "basics",      icon: "👋", title: "Poznajmy się",        desc: "Podstawowe informacje" },
  { id: "goals",       icon: "🎯", title: "Twoje cele",          desc: "Co chcesz osiągnąć?" },
  { id: "modes",       icon: "⚙️", title: "Tryby aplikacji",     desc: "Wybierz jeden lub więcej" },
  { id: "fitness",     icon: "💪", title: "Twoja forma",         desc: "Możliwości i sprzęt" },
  { id: "schedule",    icon: "📅", title: "Harmonogram",         desc: "Kiedy trenujesz?" },
  { id: "skincare",    icon: "✨", title: "Skincare",            desc: "Czy interesuje Cię pielęgnacja?" },
  { id: "supplements", icon: "💊", title: "Suplementy i budżet", desc: "Twoje podejście" },
  { id: "summary",     icon: "✅", title: "Gotowe!",             desc: "Podsumowanie konfiguracji" }
];

// ============================================================================
// STAN LOKALNY KREATORA
// ============================================================================

let _step = 0;
let _data = {
  displayName: "",
  units: "metric",
  language: "pl",
  goals: [],
  modes: [],
  fitness: { pushups: null, pullups: null, plank: null, squats: null },
  equipment: [],
  schedule: { days: [1, 2, 3, 4, 5], hours: "18:00" },
  skincareInterest: false,
  skinType: null,
  supplementsInterest: "none",
  budget: "na",
  onboardingCompleted: false
};

// ============================================================================
// RENDER
// ============================================================================

export async function render(container) {
  renderStep(container);
}

function renderStep(container) {
  const step = STEPS[_step];
  const isLast = _step === STEPS.length - 1;
  const isFirst = _step === 0;
  const pct = Math.round(((_step + 1) / STEPS.length) * 100);

  container.innerHTML = `
    <div class="card card-accent mb-4">
      <div class="row-between mb-2">
        <span class="badge badge-accent">${step.icon} Krok ${_step + 1} z ${STEPS.length}</span>
        <span class="text-xs text-tertiary">${step.title}</span>
      </div>
      <div class="progress progress-sm">
        <div class="progress-fill" style="width:${pct}%"></div>
      </div>
    </div>

    <div class="card">
      <h2 class="text-xl font-black mb-1">${step.title}</h2>
      <p class="text-sm text-secondary mb-4">${step.desc}</p>
      <div id="onb-form" class="stack">${renderStepFields(step.id)}</div>

      <div class="row-between mt-6">
        <button class="btn btn-ghost" id="btn-onb-back" ${isFirst ? 'style="visibility:hidden"' : ''}>
          <i class="fa-solid fa-arrow-left"></i> Wstecz
        </button>
        <button class="btn btn-primary" id="btn-onb-next">
          ${isLast ? '<i class="fa-solid fa-check"></i> Zakończ' : 'Dalej <i class="fa-solid fa-arrow-right"></i>'}
        </button>
      </div>
    </div>
  `;

  bindEvents(container);
}

function renderStepFields(stepId) {
  switch (stepId) {
    case "basics": return renderBasics();
    case "goals": return renderGoals();
    case "modes": return renderModes();
    case "fitness": return renderFitness();
    case "schedule": return renderSchedule();
    case "skincare": return renderSkincare();
    case "supplements": return renderSupplements();
    case "summary": return renderSummary();
    default: return "";
  }
}

// --- Krok 1: Basics --------------------------------------------------------
function renderBasics() {
  return `
    <div class="form-group">
      <label class="form-label">Jak masz na imię?</label>
      <input class="input" id="onb-name" placeholder="np. Karol" value="${escapeHtml(_data.displayName)}">
    </div>
    <div class="form-group">
      <label class="form-label">Jednostki</label>
      <div class="row" style="gap:8px;">
        <button class="chip ${_data.units === "metric" ? "active" : ""}" data-units="metric">📏 kg, cm</button>
        <button class="chip ${_data.units === "imperial" ? "active" : ""}" data-units="imperial">⚖️ lb, ft</button>
      </div>
    </div>
  `;
}

// --- Krok 2: Goals ---------------------------------------------------------
function renderGoals() {
  return `
    <p class="text-xs text-tertiary mb-2">Możesz wybrać wiele opcji (${_data.goals.length} wybrano)</p>
    <div class="grid-2" style="gap:8px;">
      ${GOALS.map(g => `
        <button class="card card-padded-sm ${_data.goals.includes(g.id) ? "card-accent" : ""}"
          data-goal="${g.id}" style="text-align:left;padding:10px;">
          <div style="font-size:20px;">${g.icon}</div>
          <div class="text-xs font-bold mt-1">${g.label}</div>
        </button>
      `).join("")}
    </div>
  `;
}

// --- Krok 3: Modes ---------------------------------------------------------
function renderModes() {
  return `
    <p class="text-xs text-tertiary mb-2">Tryby określają, jakie zadania dostajesz (${_data.modes.length} wybrano)</p>
    <div class="stack-sm">
      ${MODES.map(m => `
        <button class="card card-padded-sm ${_data.modes.includes(m.id) ? "card-accent" : ""}"
          data-mode="${m.id}" style="text-align:left;width:100%;">
          <div class="row" style="gap:12px;align-items:center;">
            <div style="font-size:28px;">${m.icon}</div>
            <div style="flex:1;">
              <div class="text-sm font-bold">${m.label}</div>
              <div class="text-xs text-tertiary">${m.desc}</div>
            </div>
            ${_data.modes.includes(m.id) ? '<i class="fa-solid fa-check-circle text-accent"></i>' : ''}
          </div>
        </button>
      `).join("")}
    </div>
  `;
}

// --- Krok 4: Fitness -------------------------------------------------------
function renderFitness() {
  return `
    <p class="text-xs text-tertiary mb-2">Wpisz swoje maksymalne wyniki (opcjonalnie, do personalizacji treningu)</p>
    <div class="grid-2">
      <div class="form-group">
        <label class="form-label">Pompki (max)</label>
        <input type="number" class="input" id="onb-pushups" placeholder="np. 25" value="${_data.fitness.pushups ?? ""}">
      </div>
      <div class="form-group">
        <label class="form-label">Podciągnięcia (max)</label>
        <input type="number" class="input" id="onb-pullups" placeholder="np. 8" value="${_data.fitness.pullups ?? ""}">
      </div>
      <div class="form-group">
        <label class="form-label">Plank (sekundy)</label>
        <input type="number" class="input" id="onb-plank" placeholder="np. 60" value="${_data.fitness.plank ?? ""}">
      </div>
      <div class="form-group">
        <label class="form-label">Przysiady (max)</label>
        <input type="number" class="input" id="onb-squats" placeholder="np. 40" value="${_data.fitness.squats ?? ""}">
      </div>
    </div>
    <div class="form-group mt-3">
      <label class="form-label">Sprzęt, który masz</label>
      <div class="row" style="gap:8px;flex-wrap:wrap;">
        ${[
          { id: "dumbbells", label: "🏋️ Hantle" },
          { id: "bands", label: "🔗 Gumy" },
          { id: "gym", label: "🏢 Siłownia" },
          { id: "pool", label: "🏊 Basen" }
        ].map(e => `
          <button class="chip ${_data.equipment.includes(e.id) ? "active" : ""}" data-equip="${e.id}">${e.label}</button>
        `).join("")}
      </div>
    </div>
  `;
}

// --- Krok 5: Schedule ------------------------------------------------------
function renderSchedule() {
  return `
    <p class="text-xs text-tertiary mb-2">Kiedy trenujesz?</p>
    <div class="form-group">
      <label class="form-label">Dni treningowe</label>
      <div class="row" style="gap:6px;flex-wrap:wrap;">
        ${DAYS.map(d => `
          <button class="chip ${_data.schedule.days.includes(d.id) ? "active" : ""}" data-day="${d.id}">${d.label}</button>
        `).join("")}
      </div>
    </div>
    <div class="form-group mt-3">
      <label class="form-label">Preferowana godzina</label>
      <input type="time" class="input" id="onb-hours" value="${_data.schedule.hours}">
    </div>
  `;
}

// --- Krok 6: Skincare ------------------------------------------------------
function renderSkincare() {
  return `
    <div class="form-group">
      <label class="form-label">Czy interesuje Cię pielęgnacja twarzy?</label>
      <div class="row" style="gap:8px;">
        <button class="chip ${_data.skincareInterest ? "active" : ""}" data-skincare="yes">✨ Tak</button>
        <button class="chip ${!_data.skincareInterest ? "active" : ""}" data-skincare="no">Nie</button>
      </div>
    </div>
    ${_data.skincareInterest ? `
      <div class="form-group mt-3">
        <label class="form-label">Typ skóry (jeśli znasz)</label>
        <div class="row" style="gap:6px;flex-wrap:wrap;">
          ${[
            { id: "normal", label: "Normalna" },
            { id: "oily", label: "Tłusta" },
            { id: "dry", label: "Sucha" },
            { id: "combination", label: "Mieszana" },
            { id: "unknown", label: "Nie wiem" }
          ].map(t => `
            <button class="chip ${_data.skinType === t.id ? "active" : ""}" data-skintype="${t.id}">${t.label}</button>
          `).join("")}
        </div>
      </div>
    ` : ""}
  `;
}

// --- Krok 7: Supplements ---------------------------------------------------
function renderSupplements() {
  return `
    <div class="form-group">
      <label class="form-label">Suplementy</label>
      <div class="stack-sm">
        ${[
          { id: "none", label: "🚫 Nie stosuję", desc: "Bez suplementów" },
          { id: "catalog", label: "📚 Tylko biblioteka", desc: "Chcę wiedzieć, nie kupuję" },
          { id: "tracking", label: "💊 Śledzę przyjmowanie", desc: "Stosuję i monitoruję" }
        ].map(s => `
          <button class="card card-padded-sm ${_data.supplementsInterest === s.id ? "card-accent" : ""}"
            data-supp="${s.id}" style="text-align:left;">
            <div class="row-between">
              <div>
                <div class="text-sm font-bold">${s.label}</div>
                <div class="text-xs text-tertiary">${s.desc}</div>
              </div>
              ${_data.supplementsInterest === s.id ? '<i class="fa-solid fa-check-circle text-accent"></i>' : ''}
            </div>
          </button>
        `).join("")}
      </div>
    </div>
    <div class="form-group mt-3">
      <label class="form-label">Budżet miesięczny na suplementy</label>
      <div class="stack-sm">
        ${BUDGETS.map(b => `
          <button class="card card-padded-sm ${_data.budget === b.id ? "card-accent" : ""}"
            data-budget="${b.id}" style="text-align:left;padding:8px 12px;">
            <div class="text-sm">${b.label}</div>
            ${b.desc ? `<div class="text-xs text-tertiary">${b.desc}</div>` : ""}
          </button>
        `).join("")}
      </div>
    </div>
    ${_data.budget === "0" ? `
      <div class="card card-flat mt-3" style="background:var(--success-subtle);">
        <div class="text-sm text-secondary">✅ OK — żadnych sugestii zakupowych. Skupiamy się na tym, co masz.</div>
      </div>
    ` : ""}
  `;
}

// --- Krok 8: Summary -------------------------------------------------------
function renderSummary() {
  const modes = _data.modes.map(id => MODES.find(m => m.id === id)).filter(Boolean);
  const goals = _data.goals.map(id => GOALS.find(g => g.id === id)).filter(Boolean);
  const days = _data.schedule.days.map(id => DAYS.find(d => d.id === id)?.label).filter(Boolean);

  return `
    <div class="stack">
      <div class="card card-flat">
        <div class="card-subtitle mb-1">Imię</div>
        <div class="text-sm font-bold">${escapeHtml(_data.displayName || "—")}</div>
      </div>
      <div class="card card-flat">
        <div class="card-subtitle mb-1">Tryby (${modes.length})</div>
        <div class="row" style="gap:4px;flex-wrap:wrap;">
          ${modes.length ? modes.map(m => `<span class="badge badge-accent">${m.icon} ${m.label}</span>`).join("") : '<span class="text-sm text-tertiary">Brak</span>'}
        </div>
      </div>
      <div class="card card-flat">
        <div class="card-subtitle mb-1">Cele (${goals.length})</div>
        <div class="row" style="gap:4px;flex-wrap:wrap;">
          ${goals.length ? goals.map(g => `<span class="badge badge-neutral">${g.icon} ${g.label}</span>`).join("") : '<span class="text-sm text-tertiary">Brak</span>'}
        </div>
      </div>
      <div class="card card-flat">
        <div class="card-subtitle mb-1">Trening</div>
        <div class="text-sm">${days.length ? days.join(", ") : "Brak dni"}</div>
      </div>
      <div class="card card-flat">
        <div class="card-subtitle mb-1">Budżet suplementów</div>
        <div class="text-sm">${BUDGETS.find(b => b.id === _data.budget)?.label || "—"}</div>
      </div>
    </div>
  `;
}

// ============================================================================
// EVENTY
// ============================================================================

function bindEvents(container) {
  // Basics: units
  container.querySelectorAll("[data-units]").forEach(el => {
    el.addEventListener("click", () => { _data.units = el.dataset.units; renderStep(container); });
  });

  // Goals
  container.querySelectorAll("[data-goal]").forEach(el => {
    el.addEventListener("click", () => {
      const id = el.dataset.goal;
      const idx = _data.goals.indexOf(id);
      if (idx >= 0) _data.goals.splice(idx, 1);
      else _data.goals.push(id);
      renderStep(container);
    });
  });

  // Modes
  container.querySelectorAll("[data-mode]").forEach(el => {
    el.addEventListener("click", () => {
      const id = el.dataset.mode;
      const idx = _data.modes.indexOf(id);
      if (idx >= 0) _data.modes.splice(idx, 1);
      else _data.modes.push(id);
      renderStep(container);
    });
  });

  // Equipment
  container.querySelectorAll("[data-equip]").forEach(el => {
    el.addEventListener("click", () => {
      const id = el.dataset.equip;
      const idx = _data.equipment.indexOf(id);
      if (idx >= 0) _data.equipment.splice(idx, 1);
      else _data.equipment.push(id);
      renderStep(container);
    });
  });

  // Schedule days
  container.querySelectorAll("[data-day]").forEach(el => {
    el.addEventListener("click", () => {
      const id = parseInt(el.dataset.day);
      const idx = _data.schedule.days.indexOf(id);
      if (idx >= 0) _data.schedule.days.splice(idx, 1);
      else _data.schedule.days.push(id);
      renderStep(container);
    });
  });

  // Skincare
  container.querySelectorAll("[data-skincare]").forEach(el => {
    el.addEventListener("click", () => {
      _data.skincareInterest = el.dataset.skincare === "yes";
      renderStep(container);
    });
  });

  container.querySelectorAll("[data-skintype]").forEach(el => {
    el.addEventListener("click", () => { _data.skinType = el.dataset.skintype; renderStep(container); });
  });

  // Supplements
  container.querySelectorAll("[data-supp]").forEach(el => {
    el.addEventListener("click", () => { _data.supplementsInterest = el.dataset.supp; renderStep(container); });
  });

  container.querySelectorAll("[data-budget]").forEach(el => {
    el.addEventListener("click", () => { _data.budget = el.dataset.budget; renderStep(container); });
  });

  // Navigation
  $("btn-onb-back")?.addEventListener("click", () => {
    if (_step > 0) { saveStep(); _step--; renderStep(container); }
  });

  $("btn-onb-next")?.addEventListener("click", async () => {
    if (!validateAndSaveStep()) return;
    if (_step < STEPS.length - 1) {
      _step++;
      renderStep(container);
    } else {
      await finish(container);
    }
  });
}

function saveStep() {
  // Basics
  const nameEl = $("onb-name");
  if (nameEl) _data.displayName = nameEl.value.trim();
  const hoursEl = $("onb-hours");
  if (hoursEl) _data.schedule.hours = hoursEl.value;
  const push = $("onb-pushups"); const pull = $("onb-pullups"); const plank = $("onb-plank"); const squat = $("onb-squats");
  if (push) _data.fitness.pushups = push.value ? parseInt(push.value) : null;
  if (pull) _data.fitness.pullups = pull.value ? parseInt(pull.value) : null;
  if (plank) _data.fitness.plank = plank.value ? parseInt(plank.value) : null;
  if (squat) _data.fitness.squats = squat.value ? parseInt(squat.value) : null;
}

function validateAndSaveStep() {
  const currentStep = STEPS[_step];

  if (currentStep.id === "basics") {
    const name = $("onb-name")?.value.trim();
    if (!name) { showToast("Podaj swoje imię", "error"); return false; }
  }
  if (currentStep.id === "modes") {
    if (_data.modes.length === 0) { showToast("Wybierz co najmniej jeden tryb", "error"); return false; }
  }

  saveStep();
  return true;
}

async function finish(container) {
  const btn = $("btn-onb-next");
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Zapisywanie...';

  try {
    _data.onboardingCompleted = true;
    await saveProfile(_data);
    state.profile = { ...(state.profile || {}), ..._data };
    showToast("✅ Profil gotowy! Witaj w LOCK IN 2027", "success");
    location.hash = "#overview";
    setTimeout(() => window.location.reload(), 600);
  } catch (e) {
    console.error(e);
    showToast("Błąd zapisu: " + (e.message || ""), "error");
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Zakończ';
  }
}
