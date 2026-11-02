// ============================================================================
// LOCK IN 2027 — js/modules/onboarding.js
// 6 kroków: Basics → Cel (6 modes) → Fitness → Schedule → Lifestyle → Summary.
// Podgląd kategorii zadań na żywo pod wyborem trybów.
// ============================================================================

import { $, escapeHtml } from "../core/utils.js";
import { saveProfile } from "../core/data.js";
import { state } from "../state.js";
import { showToast } from "../components/toast.js";
import { MODES, CATEGORY_META, getCategoriesFromModes, getTasksFromModes } from "../core/modes.js";

// ============================================================================
// DANE
// ============================================================================

const BUDGETS = [
  { id: "0",     label: "0 zł — bez wydatków",  desc: "Żadnych sugestii zakupowych" },
  { id: "30",    label: "Do 30 zł / mies.",     desc: "Podstawowe produkty" },
  { id: "60",    label: "30–60 zł / mies.",     desc: "Umiarkowany budżet" },
  { id: "100",   label: "60–100 zł / mies.",    desc: "Rozszerzony zestaw" },
  { id: "100plus", label: "100+ zł / mies.",    desc: "Bez limitu" },
  { id: "na",    label: "Nie chcę określać" }
];

const DAYS = [
  { id: 1, label: "Pon" }, { id: 2, label: "Wt" }, { id: 3, label: "Śr" },
  { id: 4, label: "Czw" }, { id: 5, label: "Pt" }, { id: 6, label: "Sob" }, { id: 0, label: "Nd" }
];

const EQUIPMENT = [
  { id: "dumbbells", label: "🏋️ Hantle" },
  { id: "bands",     label: "🔗 Gumy" },
  { id: "gym",       label: "🏢 Siłownia" },
  { id: "pool",      label: "🏊 Basen" }
];

const STEPS = [
  { id: "basics",     icon: "👋", title: "Poznajmy się",       desc: "Podstawowe informacje" },
  { id: "goal",       icon: "🎯", title: "Twój cel",           desc: "Wybierz co najmniej jeden tryb" },
  { id: "fitness",    icon: "💪", title: "Twoja forma",        desc: "Możliwości i sprzęt (opcjonalnie)" },
  { id: "schedule",   icon: "📅", title: "Harmonogram",        desc: "Kiedy trenujesz?" },
  { id: "lifestyle",  icon: "✨", title: "Lifestyle",          desc: "Suplementy, budżet, skincare" },
  { id: "summary",    icon: "✅", title: "Gotowe!",            desc: "Podsumowanie konfiguracji" }
];

// ============================================================================
// STAN KREATORA
// ============================================================================

let _step = 0;
let _data = {
  displayName: "",
  units: "metric",
  age: null,
  modes: [],
  fitness: { pushups: null, pullups: null, plank: null, squats: null },
  equipment: [],
  schedule: { days: [1, 2, 3, 4, 5], hours: "18:00" },
  supplementsInterest: "none",
  budget: "na",
  skincareInterest: false,
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
    case "basics":    return renderBasics();
    case "goal":      return renderGoal();
    case "fitness":   return renderFitness();
    case "schedule":  return renderSchedule();
    case "lifestyle": return renderLifestyle();
    case "summary":   return renderSummary();
    default: return "";
  }
}

// --- Krok 1: Basics ------------------------------------------------------
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
    <div class="form-group">
      <label class="form-label">Wiek (opcjonalnie)</label>
      <input type="number" class="input" id="onb-age" placeholder="np. 16" value="${_data.age ?? ""}">
    </div>
  `;
}

// --- Krok 2: Cel (6 modów) ----------------------------------------------
function renderGoal() {
  const selected = _data.modes;
  return `
    <p class="text-xs text-tertiary mb-3">Możesz wybrać kilka trybów — zadania się połączą (bez duplikatów).</p>
    <div class="grid-2" style="gap:10px;">
      ${MODES.map(m => {
        const isSel = selected.includes(m.id);
        const cats = getCategoriesFromModes([m.id]);
        return `
          <button class="card ${isSel ? "card-accent" : ""}" data-mode="${m.id}"
            style="text-align:left;padding:14px;position:relative;${isSel ? 'border-color:var(--accent);' : ''}">
            ${isSel ? `<div style="position:absolute;top:8px;right:8px;width:22px;height:22px;border-radius:50%;background:var(--accent);color:var(--text-inverse);display:flex;align-items:center;justify-content:center;font-size:11px;"><i class="fa-solid fa-check"></i></div>` : ''}
            <div style="font-size:32px;line-height:1;margin-bottom:8px;">${m.icon}</div>
            <div class="text-sm font-bold">${m.name}</div>
            <div class="text-xs text-tertiary" style="margin-top:2px;line-height:1.3;">${m.desc}</div>
            <div class="row" style="gap:4px;flex-wrap:wrap;margin-top:8px;">
              ${cats.map(c => {
                const meta = CATEGORY_META[c];
                if (!meta) return "";
                return `<span style="font-size:14px;" title="${meta.name}">${meta.icon}</span>`;
              }).join("")}
            </div>
          </button>
        `;
      }).join("")}
    </div>

    <div class="card mt-4" style="background:var(--bg-surface);">
      <div class="card-subtitle mb-2">KATEGORIE KTÓRE SIĘ POJAWIĄ</div>
      ${renderCategoryPreview()}
    </div>
  `;
}

function renderCategoryPreview() {
  if (!_data.modes.length) {
    return `<div class="text-sm text-tertiary">Wybierz co najmniej jeden tryb, żeby zobaczyć kategorie.</div>`;
  }
  const cats = getCategoriesFromModes(_data.modes);
  const tasks = getTasksFromModes(_data.modes);
  return `
    <div class="row" style="gap:6px;flex-wrap:wrap;">
      ${cats.map(id => {
        const meta = CATEGORY_META[id];
        if (!meta) return "";
        return `<span class="badge badge-accent">${meta.icon} ${meta.name}</span>`;
      }).join("")}
    </div>
    <div class="text-xs text-tertiary mt-3">📊 ${tasks.length} unikalnych zadań</div>
  `;
}

// --- Krok 3: Fitness -----------------------------------------------------
function renderFitness() {
  return `
    <p class="text-xs text-tertiary mb-2">Personalizujemy poziom treningu (możesz pominąć).</p>
    <div class="grid-2">
      <div class="form-group">
        <label class="form-label">Pompki (max)</label>
        <input type="number" class="input" id="onb-pushups" placeholder="np. 25" value="${_data.fitness.pushups ?? ""}">
      </div>
      <div class="form-group">
        <label class="form-label">Podciągnięcia</label>
        <input type="number" class="input" id="onb-pullups" placeholder="np. 8" value="${_data.fitness.pullups ?? ""}">
      </div>
      <div class="form-group">
        <label class="form-label">Plank (sekundy)</label>
        <input type="number" class="input" id="onb-plank" placeholder="np. 60" value="${_data.fitness.plank ?? ""}">
      </div>
      <div class="form-group">
        <label class="form-label">Przysiady</label>
        <input type="number" class="input" id="onb-squats" placeholder="np. 40" value="${_data.fitness.squats ?? ""}">
      </div>
    </div>
    <div class="form-group mt-3">
      <label class="form-label">Sprzęt, który masz</label>
      <div class="row" style="gap:8px;flex-wrap:wrap;">
        ${EQUIPMENT.map(e => `
          <button class="chip ${_data.equipment.includes(e.id) ? "active" : ""}" data-equip="${e.id}">${e.label}</button>
        `).join("")}
      </div>
    </div>
  `;
}

// --- Krok 4: Schedule ----------------------------------------------------
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

// --- Krok 5: Lifestyle ---------------------------------------------------
function renderLifestyle() {
  return `
    <div class="form-group">
      <label class="form-label">Suplementy</label>
      <div class="stack-sm">
        ${[
          { id: "none",     label: "🚫 Nie stosuję",              desc: "Bez suplementów" },
          { id: "catalog",  label: "📚 Tylko biblioteka",         desc: "Chcę wiedzieć, nie kupuję" },
          { id: "tracking", label: "💊 Śledzę przyjmowanie",      desc: "Stosuję i monitoruję" }
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

    <div class="form-group mt-4">
      <label class="form-label">Budżet miesięczny</label>
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
        <div class="text-sm text-secondary">✅ Bez sugestii zakupowych. Skupiamy się na tym co masz.</div>
      </div>
    ` : ""}

    <div class="form-group mt-4">
      <label class="form-label">Czy interesuje Cię pielęgnacja twarzy?</label>
      <div class="row" style="gap:8px;">
        <button class="chip ${_data.skincareInterest ? "active" : ""}" data-skincare="yes">✨ Tak</button>
        <button class="chip ${!_data.skincareInterest ? "active" : ""}" data-skincare="no">Nie</button>
      </div>
    </div>
  `;
}

// --- Krok 6: Summary -----------------------------------------------------
function renderSummary() {
  const modeObjs = _data.modes.map(id => MODES.find(m => m.id === id)).filter(Boolean);
  const cats = getCategoriesFromModes(_data.modes);
  const tasks = getTasksFromModes(_data.modes);
  const days = _data.schedule.days.map(id => DAYS.find(d => d.id === id)?.label).filter(Boolean);
  const budgetLabel = BUDGETS.find(b => b.id === _data.budget)?.label || "—";

  return `
    <div class="stack">
      <div class="card card-flat">
        <div class="card-subtitle mb-1">Imię</div>
        <div class="text-sm font-bold">${escapeHtml(_data.displayName || "—")}</div>
      </div>

      <div class="card card-flat">
        <div class="card-subtitle mb-1">Tryby (${modeObjs.length})</div>
        <div class="row" style="gap:4px;flex-wrap:wrap;">
          ${modeObjs.length ? modeObjs.map(m => `<span class="badge badge-accent">${m.icon} ${m.name}</span>`).join("") : '<span class="text-sm text-tertiary">Brak</span>'}
        </div>
      </div>

      <div class="card card-flat">
        <div class="card-subtitle mb-1">Kategorie zadań (${cats.length})</div>
        <div class="row" style="gap:4px;flex-wrap:wrap;">
          ${cats.map(id => {
            const meta = CATEGORY_META[id];
            return `<span class="badge badge-neutral">${meta.icon} ${meta.name}</span>`;
          }).join("")}
        </div>
        <div class="text-xs text-tertiary mt-2">📊 ${tasks.length} unikalnych zadań</div>
      </div>

      <div class="card card-flat">
        <div class="card-subtitle mb-1">Trening</div>
        <div class="text-sm">${days.length ? days.join(", ") + " · " + _data.schedule.hours : "Brak dni"}</div>
      </div>

      <div class="card card-flat">
        <div class="card-subtitle mb-1">Budżet</div>
        <div class="text-sm">${budgetLabel}</div>
      </div>
    </div>
  `;
}

// ============================================================================
// EVENTY
// ============================================================================

function bindEvents(container) {
  container.querySelectorAll("[data-units]").forEach(el => {
    el.addEventListener("click", () => { _data.units = el.dataset.units; renderStep(container); });
  });

  container.querySelectorAll("[data-mode]").forEach(el => {
    el.addEventListener("click", () => {
      const id = el.dataset.mode;
      const idx = _data.modes.indexOf(id);
      if (idx >= 0) _data.modes.splice(idx, 1);
      else _data.modes.push(id);
      renderStep(container);
    });
  });

  container.querySelectorAll("[data-equip]").forEach(el => {
    el.addEventListener("click", () => {
      const id = el.dataset.equip;
      const idx = _data.equipment.indexOf(id);
      if (idx >= 0) _data.equipment.splice(idx, 1);
      else _data.equipment.push(id);
      renderStep(container);
    });
  });

  container.querySelectorAll("[data-day]").forEach(el => {
    el.addEventListener("click", () => {
      const id = parseInt(el.dataset.day);
      const idx = _data.schedule.days.indexOf(id);
      if (idx >= 0) _data.schedule.days.splice(idx, 1);
      else _data.schedule.days.push(id);
      renderStep(container);
    });
  });

  container.querySelectorAll("[data-supp]").forEach(el => {
    el.addEventListener("click", () => { _data.supplementsInterest = el.dataset.supp; renderStep(container); });
  });

  container.querySelectorAll("[data-budget]").forEach(el => {
    el.addEventListener("click", () => { _data.budget = el.dataset.budget; renderStep(container); });
  });

  container.querySelectorAll("[data-skincare]").forEach(el => {
    el.addEventListener("click", () => { _data.skincareInterest = el.dataset.skincare === "yes"; renderStep(container); });
  });

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
  const nameEl = $("onb-name");
  if (nameEl) _data.displayName = nameEl.value.trim();
  const ageEl = $("onb-age");
  if (ageEl) _data.age = ageEl.value ? parseInt(ageEl.value) : null;
  const hoursEl = $("onb-hours");
  if (hoursEl) _data.schedule.hours = hoursEl.value;
  const push = $("onb-pushups"); const pull = $("onb-pullups"); const plank = $("onb-plank"); const squat = $("onb-squats");
  if (push) _data.fitness.pushups = push.value ? parseInt(push.value) : null;
  if (pull) _data.fitness.pullups = pull.value ? parseInt(pull.value) : null;
  if (plank) _data.fitness.plank = plank.value ? parseInt(plank.value) : null;
  if (squat) _data.fitness.squats = squat.value ? parseInt(squat.value) : null;
}

function validateAndSaveStep() {
  const step = STEPS[_step];

  if (step.id === "basics") {
    const name = $("onb-name")?.value.trim();
    if (!name) { showToast("Podaj swoje imię", "error"); return false; }
  }

  if (step.id === "goal") {
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
