// ============================================================================
// LOCK IN 2027 — js/modules/onboarding.js
// Kreator pierwszego uruchomienia (Wizard). 5 kroków.
// ============================================================================

import { $, escapeHtml } from "../core/utils.js";
import { saveProfile } from "../core/data.js";
import { state } from "../state.js";
import { showToast } from "../components/toast.js";

const STEPS = [
  { id: "identity", title: "Jak masz na imię?", desc: "Będziemy się tak do Ciebie zwracać." },
  { id: "goal", title: "Jaki jest Twój główny cel?", desc: "Dobierzemy odpowiednie wskazówki." },
  { id: "activity", title: "Twój poziom aktywności", desc: "Jak często się ruszasz?" },
  { id: "units", title: "Jednostki", desc: "W jakich jednostkach chcesz mierzyć?" },
  { id: "body", title: "Dane ciała (opcjonalnie)", desc: "Możesz to pominąć i uzupełnić później." }
];

let _currentStep = 0;
let _formData = {
  displayName: "",
  goal: "mass",
  activityLevel: "moderate",
  units: "metric",
  age: null,
  height: null,
  onboardingCompleted: false
};

export async function render(container) {
  renderStep(container);
}

function renderStep(container) {
  const step = STEPS[_currentStep];
  const isLast = _currentStep === STEPS.length - 1;

  container.innerHTML = `
    <div class="card card-accent mb-4">
      <div class="row-between mb-2">
        <span class="badge badge-accent">Krok ${_currentStep + 1} z ${STEPS.length}</span>
        <span class="text-xs text-tertiary">${step.title}</span>
      </div>
      <div class="progress progress-sm">
        <div class="progress-fill" style="width: ${((_currentStep + 1) / STEPS.length) * 100}%"></div>
      </div>
    </div>

    <div class="card">
      <h2 class="text-xl font-black mb-1">${step.title}</h2>
      <p class="text-sm text-secondary mb-4">${step.desc}</p>

      <div id="onboarding-form" class="stack">
        ${renderStepFields(step.id)}
      </div>

      <div class="row-between mt-6">
        <button class="btn btn-ghost" id="btn-onb-back" ${_currentStep === 0 ? 'style="visibility:hidden"' : ''}>
          <i class="fa-solid fa-arrow-left"></i> Wstecz
        </button>
        <button class="btn btn-primary" id="btn-onb-next">
          ${isLast ? '<i class="fa-solid fa-check"></i> Zakończ' : 'Dalej <i class="fa-solid fa-arrow-right"></i>'}
        </button>
      </div>
    </div>
  `;

  bindStepEvents(container);
}

function renderStepFields(stepId) {
  if (stepId === "identity") {
    return `
      <div class="form-group">
        <label class="form-label">Imię / Nick</label>
        <input class="input" id="onb-name" placeholder="np. Karol" value="${escapeHtml(_formData.displayName)}">
      </div>
    `;
  }

  if (stepId === "goal") {
    const goals = [
      { id: "mass", label: "Budowa masy mięśniowej", icon: "💪" },
      { id: "reduction", label: "Redukcja / Spalanie tłuszczu", icon: "🔥" },
      { id: "health", label: "Zdrowie i sprawność ogólna", icon: "🧘" }
    ];
    return `
      <div class="stack-sm">
        ${goals.map(g => `
          <label class="checkbox ${_formData.goal === g.id ? "checked" : ""}" data-select-goal="${g.id}">
            <div class="checkbox-box">${_formData.goal === g.id ? '<i class="fa-solid fa-check" style="font-size:12px;"></i>' : ""}</div>
            <div style="flex:1;"><span class="text-sm">${g.icon} ${g.label}</span></div>
          </label>
        `).join("")}
      </div>
    `;
  }

  if (stepId === "activity") {
    const acts = [
      { id: "sedentary", label: "Siedzący (brak treningu)", icon: "🪑" },
      { id: "light", label: "Lekki (1-2 treningi/tydz.)", icon: "🚶" },
      { id: "moderate", label: "Umiarkowany (3-4 treningi/tydz.)", icon: "🏃" },
      { id: "active", label: "Aktywny (5+ treningów/tydz.)", icon: "⚡" }
    ];
    return `
      <div class="stack-sm">
        ${acts.map(a => `
          <label class="checkbox ${_formData.activityLevel === a.id ? "checked" : ""}" data-select-act="${a.id}">
            <div class="checkbox-box">${_formData.activityLevel === a.id ? '<i class="fa-solid fa-check" style="font-size:12px;"></i>' : ""}</div>
            <div style="flex:1;"><span class="text-sm">${a.icon} ${a.label}</span></div>
          </label>
        `).join("")}
      </div>
    `;
  }

  if (stepId === "units") {
    return `
      <div class="stack-sm">
        <label class="checkbox ${_formData.units === "metric" ? "checked" : ""}" data-select-units="metric">
          <div class="checkbox-box">${_formData.units === "metric" ? '<i class="fa-solid fa-check" style="font-size:12px;"></i>' : ""}</div>
          <div style="flex:1;"><span class="text-sm">📏 Metryczne (kg, cm)</span></div>
        </label>
        <label class="checkbox ${_formData.units === "imperial" ? "checked" : ""}" data-select-units="imperial">
          <div class="checkbox-box">${_formData.units === "imperial" ? '<i class="fa-solid fa-check" style="font-size:12px;"></i>' : ""}</div>
          <div style="flex:1;"><span class="text-sm">⚖️ Imperialne (lb, ft)</span></div>
        </label>
      </div>
    `;
  }

  if (stepId === "body") {
    return `
      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">Wiek (opcjonalnie)</label>
          <input type="number" class="input" id="onb-age" placeholder="np. 16" value="${_formData.age || ""}">
        </div>
        <div class="form-group">
          <label class="form-label">Wzrost (${_formData.units === "metric" ? "cm" : "ft/in"})</label>
          <input type="number" class="input" id="onb-height" placeholder="${_formData.units === "metric" ? "np. 175" : "np. 5.9"}" value="${_formData.height || ""}">
        </div>
      </div>
    `;
  }

  return "";
}

function bindStepEvents(container) {
  // Przycisk Wstecz
  $("btn-onb-back")?.addEventListener("click", () => {
    if (_currentStep > 0) {
      saveStepData();
      _currentStep--;
      renderStep(container);
    }
  });

  // Przycisk Dalej / Zakończ
  $("btn-onb-next")?.addEventListener("click", async () => {
    if (!saveStepData()) return;

    if (_currentStep < STEPS.length - 1) {
      _currentStep++;
      renderStep(container);
    } else {
      _formData.onboardingCompleted = true;
      const btn = $("btn-onb-next");
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Zapisywanie...';

      try {
        await saveProfile(_formData);
        state.profile = _formData;
        showToast("Profil utworzony! Witaj w LOCK IN 2027.", "success");
        location.hash = "#overview";
        setTimeout(() => window.location.reload(), 800);
      } catch (e) {
        console.error(e);
        showToast("Błąd zapisu profilu", "error");
        btn.disabled = false;
        btn.textContent = "Zakończ";
      }
    }
  });

  // Dynamiczne wybieranie opcji
  const selectHandlers = {
    goal: "data-select-goal",
    activityLevel: "data-select-act",
    units: "data-select-units"
  };

  Object.entries(selectHandlers).forEach(([field, attr]) => {
    container.querySelectorAll(`[${attr}]`).forEach(el => {
      el.addEventListener("click", () => {
        _formData[field] = el.getAttribute(attr);
        renderStep(container);
      });
    });
  });
}

function saveStepData() {
  const stepId = STEPS[_currentStep].id;

  if (stepId === "identity") {
    const name = $("onb-name")?.value.trim();
    if (!name) { showToast("Podaj swoje imię", "error"); return false; }
    _formData.displayName = name;
  }

  if (stepId === "body") {
    const age = $("onb-age")?.value;
    const height = $("onb-height")?.value;
    _formData.age = age ? parseInt(age) : null;
    _formData.height = height ? parseFloat(height) : null;
  }

  return true;
}
