// ============================================================================
// LOCK IN 2027 — js/modules/settings.js
// Profil, tryby (toggle), sylwetka, ustawienia.
// ============================================================================

import { $, escapeHtml } from "../core/utils.js";
import { getSettings, saveSettings, getToggle, setToggle, calcBMI, bmiLabel } from "../core/storage.js";
import { loadDayDoc } from "../core/data.js";
import { todayKey } from "../core/utils.js";
import { state } from "../state.js";
import { showToast } from "../components/toast.js";

function lastWeight() {
  const m = state.morning || {};
  return m.dailyWeight || null;
}

function renderToggles() {
  const toggles = [
    { id: "supplements", name: "Suplementacja", desc: "D3 + kreatyna" },
    { id: "skincare", name: "Skincare", desc: "Benzacne, krem" },
    { id: "jawline", name: "Jawline", desc: "Mewing, postawa" },
    { id: "creatine", name: "Kreatyna", desc: "3-5g dziennie" },
    { id: "beast", name: "Hardcore", desc: "Zimny prysznic" }
  ];
  return toggles.map(t => `
    <div class="list-item">
      <div class="list-item-body">
        <div class="list-item-title">${t.name}</div>
        <div class="list-item-subtitle">${t.desc}</div>
      </div>
      <div class="toggle ${getToggle(t.id) ? "on" : ""}" data-toggle="${t.id}"></div>
    </div>
  `).join("");
}

function renderBodyCard() {
  const s = getSettings();
  const w = lastWeight();
  const bmi = w ? calcBMI(w, s.height) : null;
  return `
    <div class="grid-2">
      <div class="stat"><div class="stat-label">Wiek</div><div class="stat-value">${s.age}<span class="stat-unit">lat</span></div></div>
      <div class="stat"><div class="stat-label">Wzrost</div><div class="stat-value">${s.height}<span class="stat-unit">cm</span></div></div>
      <div class="stat"><div class="stat-label">Waga</div><div class="stat-value">${w ? w : "—"}<span class="stat-unit">kg</span></div></div>
      <div class="stat"><div class="stat-label">BMI</div><div class="stat-value">${bmi ? bmi.toFixed(1) : "—"}</div></div>
    </div>
    ${bmi ? `<div class="text-sm text-secondary mt-3">${bmiLabel(bmi)}</div>` : ""}
  `;
}

export async function render(container) {
  const today = await loadDayDoc(todayKey());
  state.morning = (today && today.morning) || {};
  const s = getSettings();

  container.innerHTML = `
    <div class="stack-lg">

      <div class="card">
        <div class="card-header"><div class="card-title">👤 Profil</div></div>
        <div class="stack">
          <div class="form-group">
            <label class="form-label">Imię</label>
            <input class="input" id="set-name" value="${escapeHtml(s.name)}">
          </div>
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Wiek</label>
              <input type="number" class="input" id="set-age" value="${s.age}">
            </div>
            <div class="form-group">
              <label class="form-label">Wzrost (cm)</label>
              <input type="number" class="input" id="set-height" value="${s.height}">
            </div>
            <div class="form-group">
              <label class="form-label">Cel (kg)</label>
              <input type="number" step="0.1" class="input" id="set-goal-weight" value="${s.goalWeight}">
            </div>
            <div class="form-group">
              <label class="form-label">Start (kg)</label>
              <input type="number" step="0.1" class="input" id="set-start-weight" value="${s.startWeight}">
            </div>
          </div>
          <button class="btn btn-primary btn-block" id="btn-save-profile"><i class="fa-solid fa-floppy-disk"></i> Zapisz profil</button>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><div class="card-title">📊 Sylwetka</div></div>
        <div id="body-card">${renderBodyCard()}</div>
      </div>

      <div class="card">
        <div class="card-header"><div class="card-title">🎛️ Tryby</div></div>
        <div class="stack-sm" id="toggles-list">${renderToggles()}</div>
        <p class="text-xs text-tertiary mt-3" style="line-height:1.5;">
          ⚠️ Skincare/Suplementy OFF = booster treningu +15% (dodatkowa seria).
        </p>
      </div>

      <div class="card">
        <div class="card-header"><div class="card-title">💊 D3</div></div>
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">1 tabl. (IU)</label>
            <input type="number" class="input" id="set-d3-iu" value="${s.d3Iu}">
          </div>
          <div class="form-group">
            <label class="form-label">Tabletek/dzień</label>
            <input type="number" class="input" id="set-d3-tab" value="${s.d3Tablets}">
          </div>
        </div>
        <button class="btn btn-secondary btn-block mt-3" id="btn-save-d3">Zapisz D3</button>
      </div>

      <div class="card">
        <div class="card-header"><div class="card-title">ℹ️ O aplikacji</div></div>
        <div class="text-sm text-secondary" style="line-height:1.6;">
          LOCK IN 2027 v2.0<br>
          Projekt: regim-web<br>
          Gałąź: redesign-v2
        </div>
      </div>

    </div>
  `;

  // Save profile
  $("btn-save-profile")?.addEventListener("click", () => {
    saveSettings({
      name: $("set-name").value.trim() || s.name,
      age: parseInt($("set-age").value) || s.age,
      height: parseFloat($("set-height").value) || s.height,
      goalWeight: parseFloat($("set-goal-weight").value) || s.goalWeight,
      startWeight: parseFloat($("set-start-weight").value) || s.startWeight
    });
    showToast("✅ Profil zapisany", "success");
    $("body-card").innerHTML = renderBodyCard();
  });

  // Save D3
  $("btn-save-d3")?.addEventListener("click", () => {
    saveSettings({
      d3Iu: parseInt($("set-d3-iu").value) || s.d3Iu,
      d3Tablets: parseInt($("set-d3-tab").value) || s.d3Tablets
    });
    showToast("✅ D3 zapisane", "success");
  });

  // Toggles
  container.querySelectorAll("[data-toggle]").forEach(el => {
    el.addEventListener("click", () => {
      const id = el.dataset.toggle;
      const newVal = !getToggle(id);
      setToggle(id, newVal);
      el.classList.toggle("on", newVal);
      showToast(newVal ? "✅ Włączone" : "Wyłączone", newVal ? "success" : "");
    });
  });
}
