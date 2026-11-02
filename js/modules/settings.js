// ============================================================================
// LOCK IN 2027 — js/modules/settings.js
// Ustawienia: profil, tryby, harmonogram, budżet, Personal Profile hub,
//             dashboard config, restart onboardingu.
// ============================================================================

import { $, escapeHtml } from "../core/utils.js";
import { getSettings, saveSettings, getToggle, setToggle, calcBMI, bmiLabel } from "../core/storage.js";
import { loadDayDoc, saveProfile, loadWidgetsConfig, saveWidgetsConfig, resetWidgetsConfig } from "../core/data.js";
import { todayKey } from "../core/utils.js";
import { state } from "../state.js";
import { showToast } from "../components/toast.js";
import { WIDGET_CATALOG } from "../core/widgets.js";
import { MODES, CATEGORY_META, getCategoriesFromModes } from "../core/modes.js";

// ============================================================================
// HELPERS
// ============================================================================

function getProfile() {
  return state.profile || {
    displayName: getSettings().name || "Karol",
    units: "metric",
    modes: [],
    schedule: { days: [1, 2, 3, 4, 5], hours: "18:00" },
    budget: "na"
  };
}

// ============================================================================
// SEKCJA: PROFIL
// ============================================================================

function renderProfileSection() {
  const p = getProfile();
  return `
    <div class="card">
      <div class="card-header"><div class="card-title">👤 Profil</div></div>
      <div class="stack">
        <div class="form-group">
          <label class="form-label">Nazwa</label>
          <input class="input" id="set-name" value="${escapeHtml(p.displayName || "")}">
        </div>
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Wiek (opcjonalnie)</label>
            <input type="number" class="input" id="set-age" value="${p.age || ""}">
          </div>
          <div class="form-group">
            <label class="form-label">Wzrost (cm)</label>
            <input type="number" class="input" id="set-height" value="${p.height || ""}">
          </div>
          <div class="form-group">
            <label class="form-label">Cel wagowy (kg)</label>
            <input type="number" step="0.1" class="input" id="set-goal-weight" value="${p.goalWeight || ""}">
          </div>
          <div class="form-group">
            <label class="form-label">Start (kg)</label>
            <input type="number" step="0.1" class="input" id="set-start-weight" value="${p.startWeight || ""}">
          </div>
        </div>
        <button class="btn btn-primary btn-block" id="btn-save-profile">
          <i class="fa-solid fa-floppy-disk"></i> Zapisz profil
        </button>
      </div>
    </div>
  `;
}

// ============================================================================
// SEKCJA: TRYBY
// ============================================================================

function renderModesSection() {
  const p = getProfile();
  const active = Array.isArray(p.modes) ? p.modes : [];
  const cats = getCategoriesFromModes(active);
  return `
    <div class="card">
      <div class="card-header">
        <div class="card-title">🎯 Tryby</div>
        <span class="badge badge-accent">${active.length} aktywnych</span>
      </div>
      <p class="text-xs text-tertiary mb-3">Zmień wybór — zmieni się pula zadań na dziś.</p>

      <div class="grid-2" style="gap:8px;">
        ${MODES.map(m => {
          const isSel = active.includes(m.id);
          return `
            <button class="card card-padded-sm ${isSel ? "card-accent" : ""}" data-toggle-mode="${m.id}"
              style="text-align:left;padding:10px;position:relative;">
              ${isSel ? `<div style="position:absolute;top:6px;right:6px;width:18px;height:18px;border-radius:50%;background:var(--accent);color:var(--text-inverse);display:flex;align-items:center;justify-content:center;font-size:10px;"><i class="fa-solid fa-check"></i></div>` : ''}
              <div style="font-size:24px;line-height:1;margin-bottom:6px;">${m.icon}</div>
              <div class="text-xs font-bold">${m.name}</div>
              <div class="text-[10px] text-tertiary" style="margin-top:2px;">${m.desc}</div>
            </button>
          `;
        }).join("")}
      </div>

      ${cats.length ? `
        <div class="card card-flat mt-3">
          <div class="card-subtitle mb-2">KATEGORIE ZADAŃ</div>
          <div class="row" style="gap:4px;flex-wrap:wrap;">
            ${cats.map(c => {
              const meta = CATEGORY_META[c];
              return meta ? `<span class="badge badge-neutral">${meta.icon} ${meta.name}</span>` : "";
            }).join("")}
          </div>
        </div>
      ` : ""}

      <button class="btn btn-secondary btn-block mt-3" id="btn-save-modes">
        <i class="fa-solid fa-floppy-disk"></i> Zapisz tryby
      </button>
    </div>
  `;
}

// ============================================================================
// SEKCJA: HARMONOGRAM
// ============================================================================

const DAYS = [
  { id: 1, label: "Pon" }, { id: 2, label: "Wt" }, { id: 3, label: "Śr" },
  { id: 4, label: "Czw" }, { id: 5, label: "Pt" }, { id: 6, label: "Sob" }, { id: 0, label: "Nd" }
];

function renderScheduleSection() {
  const p = getProfile();
  const sch = p.schedule || { days: [1, 2, 3, 4, 5], hours: "18:00" };
  return `
    <div class="card">
      <div class="card-header"><div class="card-title">📅 Harmonogram</div></div>
      <div class="form-group">
        <label class="form-label">Dni treningowe</label>
        <div class="row" style="gap:6px;flex-wrap:wrap;">
          ${DAYS.map(d => `
            <button class="chip ${sch.days.includes(d.id) ? "active" : ""}" data-toggle-day="${d.id}">${d.label}</button>
          `).join("")}
        </div>
      </div>
      <div class="form-group mt-3">
        <label class="form-label">Preferowana godzina</label>
        <input type="time" class="input" id="set-hours" value="${sch.hours || "18:00"}">
      </div>
      <button class="btn btn-secondary btn-block mt-3" id="btn-save-schedule">
        <i class="fa-solid fa-floppy-disk"></i> Zapisz harmonogram
      </button>
    </div>
  `;
}

// ============================================================================
// SEKCJA: BUDŻET
// ============================================================================

const BUDGETS = [
  { id: "0",       label: "0 zł — bez wydatków" },
  { id: "30",      label: "Do 30 zł / mies." },
  { id: "60",      label: "30–60 zł / mies." },
  { id: "100",     label: "60–100 zł / mies." },
  { id: "100plus", label: "100+ zł / mies." },
  { id: "na",      label: "Nie określam" }
];

function renderBudgetSection() {
  const p = getProfile();
  const current = p.budget || "na";
  return `
    <div class="card">
      <div class="card-header"><div class="card-title">💰 Budżet miesięczny</div></div>
      <p class="text-xs text-tertiary mb-3">Wpływa na sugestie produktów i suplementów.</p>
      <div class="stack-sm">
        ${BUDGETS.map(b => `
          <button class="card card-padded-sm ${current === b.id ? "card-accent" : ""}" data-budget="${b.id}"
            style="text-align:left;padding:10px 14px;">
            <div class="row-between">
              <span class="text-sm">${b.label}</span>
              ${current === b.id ? '<i class="fa-solid fa-check-circle text-accent"></i>' : ''}
            </div>
          </button>
        `).join("")}
      </div>
    </div>
  `;
}

// ============================================================================
// SEKCJA: PERSONAL PROFILE HUB (z suplementami)
// ============================================================================

function renderProfileHub() {
  return `
    <div class="card">
      <div class="card-header"><div class="card-title">💼 Personal Profile 2.0</div></div>
      <div class="grid-2">
        <a href="#measurements" class="card card-padded-sm" style="text-decoration:none;color:inherit;">
          <div class="text-2xl mb-2">📏</div>
          <div class="text-sm font-bold">Pomiary</div>
          <div class="text-xs text-tertiary mt-1">Waga, obwody</div>
        </a>
        <a href="#fitness" class="card card-padded-sm" style="text-decoration:none;color:inherit;">
          <div class="text-2xl mb-2">🏆</div>
          <div class="text-sm font-bold">Rekordy</div>
          <div class="text-xs text-tertiary mt-1">Pompki, plank</div>
        </a>
        <a href="#custom-questions" class="card card-padded-sm" style="text-decoration:none;color:inherit;">
          <div class="text-2xl mb-2">❓</div>
          <div class="text-sm font-bold">Pytania</div>
          <div class="text-xs text-tertiary mt-1">Personalizuj profil</div>
        </a>
        <a href="#supplements" class="card card-padded-sm" style="text-decoration:none;color:inherit;">
          <div class="text-2xl mb-2">💊</div>
          <div class="text-sm font-bold">Suplementy</div>
          <div class="text-xs text-tertiary mt-1">Katalog + tracker</div>
        </a>
      </div>
    </div>
  `;
}

// ============================================================================
// SEKCJA: DASHBOARD CONFIG
// ============================================================================

function renderDashboardConfig() {
  const activeIds = loadWidgetsConfig();
  const allIds = WIDGET_CATALOG.map(w => w.id);
  const activeWidgets = activeIds.map(id => WIDGET_CATALOG.find(w => w.id === id)).filter(Boolean);
  const inactiveWidgets = allIds.filter(id => !activeIds.includes(id)).map(id => WIDGET_CATALOG.find(w => w.id === id)).filter(Boolean);

  const item = (w, isActive, idx) => `
    <div class="list-item" data-widget-id="${w.id}">
      <div style="font-size:20px;width:28px;flex-shrink:0;">${w.icon}</div>
      <div class="list-item-body">
        <div class="list-item-title">${escapeHtml(w.label)}</div>
      </div>
      ${isActive ? `
        <div class="row" style="gap:4px;">
          ${idx > 0 ? `<button class="btn-icon btn-icon-sm" data-move-up="${w.id}"><i class="fa-solid fa-arrow-up"></i></button>` : `<span style="width:32px;"></span>`}
          ${idx < activeIds.length - 1 ? `<button class="btn-icon btn-icon-sm" data-move-down="${w.id}"><i class="fa-solid fa-arrow-down"></i></button>` : `<span style="width:32px;"></span>`}
          <button class="btn-icon btn-icon-sm" data-toggle-widget="${w.id}" style="color:var(--danger);"><i class="fa-solid fa-eye-slash"></i></button>
        </div>
      ` : `
        <button class="btn-icon btn-icon-sm" data-toggle-widget="${w.id}" style="color:var(--accent);"><i class="fa-solid fa-plus"></i></button>
      `}
    </div>
  `;

  return `
    <div id="dashboard-config-section" class="card">
      <div class="card-header">
        <div class="card-title">🎛️ Personalizacja dashboardu</div>
        <button class="btn btn-ghost btn-sm" id="btn-reset-dash">Reset</button>
      </div>
      <p class="text-xs text-tertiary mb-3">Wybierz karty widoczne na dashboardzie.</p>

      <div class="section-header"><span class="section-header-title">Aktywne (${activeWidgets.length})</span></div>
      <div id="active-widgets">${activeWidgets.map((w, i) => item(w, true, i)).join("")}</div>

      ${inactiveWidgets.length ? `
        <div class="section-header mt-4"><span class="section-header-title">Ukryte (${inactiveWidgets.length})</span></div>
        <div id="inactive-widgets">${inactiveWidgets.map(w => item(w, false, -1)).join("")}</div>
      ` : ""}
    </div>
  `;
}

// ============================================================================
// SEKCJA: ZAAWANSOWANE
// ============================================================================

function renderAdvancedSection() {
  return `
    <div class="card" style="border-color:rgba(248,113,113,.3);">
      <div class="card-header"><div class="card-title">⚠️ Zaawansowane</div></div>
      <p class="text-xs text-tertiary mb-3">
        Restart onboardingu usunie tylko ustawienia profilu (tryby, cele, harmonogram). Twoje dane dni, pomiarów, treningów i XP zostaną zachowane.
      </p>
      <button class="btn btn-danger btn-block" id="btn-restart-onboarding">
        <i class="fa-solid fa-rotate-left"></i> Uruchom onboarding od nowa
      </button>
    </div>
  `;
}

// ============================================================================
// SEKCJA: O APLIKACJI
// ============================================================================

function renderAboutSection() {
  return `
    <div class="card">
      <div class="card-header"><div class="card-title">ℹ️ O aplikacji</div></div>
      <div class="text-sm text-secondary" style="line-height:1.6;">
        <strong>LOCK IN 2027</strong> v2.4<br>
        Projekt: regim-web<br>
        Gałąź: redesign-v2<br>
        Stack: Vanilla JS + Firebase<br>
        Plan: Spark (darmowy)
      </div>
    </div>
  `;
}

// ============================================================================
// GŁÓWNY RENDER
// ============================================================================

export async function render(container) {
  const today = await loadDayDoc(todayKey());
  state.morning = (today && today.morning) || {};

  container.innerHTML = `
    <div class="stack-lg">
      ${renderProfileSection()}
      ${renderModesSection()}
      ${renderScheduleSection()}
      ${renderBudgetSection()}
      ${renderProfileHub()}
      ${renderDashboardConfig()}
      ${renderAdvancedSection()}
      ${renderAboutSection()}
    </div>
  `;

  bindEvents(container);
}

// ============================================================================
// EVENTY
// ============================================================================

function bindEvents(container) {
  // Profil
  $("btn-save-profile")?.addEventListener("click", async () => {
    const p = getProfile();
    const data = {
      displayName: $("set-name").value.trim() || p.displayName,
      age: parseInt($("set-age").value) || null,
      height: parseFloat($("set-height").value) || null,
      goalWeight: parseFloat($("set-goal-weight").value) || null,
      startWeight: parseFloat($("set-start-weight").value) || null
    };
    try {
      await saveProfile(data);
      state.profile = { ...(state.profile || {}), ...data };
      saveSettings({ name: data.displayName, age: data.age, height: data.height, goalWeight: data.goalWeight, startWeight: data.startWeight });
      showToast("✅ Profil zapisany", "success");
    } catch (e) {
      console.error(e);
      showToast("Błąd zapisu", "error");
    }
  });

  // Modes toggle
  const selectedModes = new Set(getProfile().modes || []);
  container.querySelectorAll("[data-toggle-mode]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.toggleMode;
      if (selectedModes.has(id)) selectedModes.delete(id);
      else selectedModes.add(id);
      render(container);
    });
  });

  $("btn-save-modes")?.addEventListener("click", async () => {
    const modesArr = Array.from(selectedModes);
    if (modesArr.length === 0) { showToast("Wybierz co najmniej jeden tryb", "error"); return; }
    try {
      await saveProfile({ modes: modesArr });
      state.profile = { ...(state.profile || {}), modes: modesArr };
      showToast("✅ Tryby zapisane", "success");
      const { applyConditionalTasks } = await import("./tasks.js");
      applyConditionalTasks();
    } catch (e) { console.error(e); showToast("Błąd zapisu", "error"); }
  });

  // Schedule
  const selectedDays = new Set(getProfile().schedule?.days || []);
  container.querySelectorAll("[data-toggle-day]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = parseInt(btn.dataset.toggleDay);
      if (selectedDays.has(id)) selectedDays.delete(id);
      else selectedDays.add(id);
      render(container);
    });
  });

  $("btn-save-schedule")?.addEventListener("click", async () => {
    const hours = $("set-hours")?.value || "18:00";
    const daysArr = Array.from(selectedDays).sort((a, b) => a - b);
    try {
      await saveProfile({ schedule: { days: daysArr, hours } });
      state.profile = { ...(state.profile || {}), schedule: { days: daysArr, hours } };
      showToast("✅ Harmonogram zapisany", "success");
    } catch (e) { console.error(e); showToast("Błąd zapisu", "error"); }
  });

  // Budget
  container.querySelectorAll("[data-budget]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.budget;
      try {
        await saveProfile({ budget: id });
        state.profile = { ...(state.profile || {}), budget: id };
        showToast("✅ Budżet zapisany", "success");
        render(container);
      } catch (e) { console.error(e); showToast("Błąd zapisu", "error"); }
    });
  });

  // Dashboard widgets
  container.querySelectorAll("[data-toggle-widget]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.toggleWidget;
      const cur = loadWidgetsConfig();
      const next = cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id];
      saveWidgetsConfig(next);
      render(container);
    });
  });

  container.querySelectorAll("[data-move-up]").forEach(btn => {
    btn.addEventListener("click", () => {
      const cur = loadWidgetsConfig();
      const idx = cur.indexOf(btn.dataset.moveUp);
      if (idx > 0) { [cur[idx - 1], cur[idx]] = [cur[idx], cur[idx - 1]]; saveWidgetsConfig(cur); render(container); }
    });
  });

  container.querySelectorAll("[data-move-down]").forEach(btn => {
    btn.addEventListener("click", () => {
      const cur = loadWidgetsConfig();
      const idx = cur.indexOf(btn.dataset.moveDown);
      if (idx >= 0 && idx < cur.length - 1) { [cur[idx + 1], cur[idx]] = [cur[idx], cur[idx + 1]]; saveWidgetsConfig(cur); render(container); }
    });
  });

  $("btn-reset-dash")?.addEventListener("click", () => {
    if (!confirm("Reset konfiguracji dashboardu?")) return;
    resetWidgetsConfig();
    showToast("✅ Reset", "success");
    render(container);
  });

  // Restart onboarding
  $("btn-restart-onboarding")?.addEventListener("click", async () => {
    if (!confirm("Restart onboardingu? Ustawienia profilu zostaną zresetowane, ale Twoje dane (dni, pomiary, treningi, XP) zostaną zachowane.")) return;
    try {
      await saveProfile({ onboardingCompleted: false });
      state.profile = { ...(state.profile || {}), onboardingCompleted: false };
      showToast("Onboarding zresetowany", "success");
      location.hash = "#onboarding";
      setTimeout(() => window.location.reload(), 400);
    } catch (e) { console.error(e); showToast("Błąd", "error"); }
  });
}
