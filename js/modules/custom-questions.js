// ============================================================================
// LOCK IN 2027 — js/modules/custom-questions.js
// Własne pytania użytkownika (kreator typu form-builder).
// ============================================================================

import { $, escapeHtml } from "../core/utils.js";
import { loadCustomQuestions, saveCustomQuestion } from "../core/data.js";
import { showToast } from "../components/toast.js";
import { openModal } from "../components/modal.js";

const TYPES = [
  { id: "text", label: "Tekst" },
  { id: "number", label: "Liczba" },
  { id: "boolean", label: "Tak / Nie" },
  { id: "select", label: "Wybór" },
  { id: "multiselect", label: "Wielokrotny" },
  { id: "number_unit", label: "Liczba z jednostką" }
];

let _questions = [];

export async function render(container) {
  _questions = await loadCustomQuestions();

  container.innerHTML = `
    <div class="stack-lg">
      <div class="card card-accent">
        <div class="card-header">
          <div>
            <div class="card-subtitle">KREATOR</div>
            <div class="card-title" style="margin-top:4px;">Dodaj pytanie</div>
          </div>
          <button class="btn btn-primary" id="btn-add-q"><i class="fa-solid fa-plus"></i> Nowe</button>
        </div>
        <p class="text-sm text-secondary">Twórz własne pytania, żeby lepiej poznać swoje cele i potrzeby.</p>
      </div>

      <div>
        <div class="section-header"><span class="section-header-title">Twoje pytania (${_questions.length})</span></div>
        <div id="questions-list">
          ${_questions.length ? _questions.map(q => renderQuestion(q)).join("") : renderEmpty()}
        </div>
      </div>
    </div>
  `;

  $("btn-add-q")?.addEventListener("click", () => openEditModal(null));
  container.querySelectorAll("[data-edit-q]").forEach(btn => {
    btn.addEventListener("click", () => {
      const q = _questions.find(x => x.id === btn.dataset.editQ);
      if (q) openEditModal(q);
    });
  });
}

function renderEmpty() {
  return `<div class="empty">
    <div class="empty-icon">❓</div>
    <div class="empty-title">Brak pytań</div>
    <div class="empty-text">Dodaj pytania, żeby spersonalizować profil.</div>
  </div>`;
}

function renderQuestion(q) {
  const type = TYPES.find(t => t.id === q.type) || { label: q.type };
  return `
    <div class="card card-padded-sm mb-2">
      <div class="row-between">
        <div style="flex:1;min-width:0;">
          <div class="text-sm font-bold">${escapeHtml(q.text)}</div>
          <div class="text-xs text-tertiary mt-1">
            ${type.label}
            ${q.required ? " · wymagane" : ""}
            ${q.options && q.options.length ? " · " + q.options.length + " opcji" : ""}
          </div>
        </div>
        <button class="btn-icon btn-icon-sm" data-edit-q="${q.id}"><i class="fa-solid fa-pen"></i></button>
      </div>
    </div>
  `;
}

function openEditModal(existing) {
  const isEdit = !!existing;
  const state = existing
    ? { ...existing }
    : { text: "", type: "text", required: false, options: [], order: _questions.length };

  const body = document.createElement("div");
  body.innerHTML = `
    <div class="stack">
      <div class="form-group">
        <label class="form-label">Treść pytania</label>
        <input class="input" id="q-text" value="${escapeHtml(state.text || "")}" placeholder="np. Ile godzin możesz trenować tygodniowo?">
      </div>
      <div class="form-group">
        <label class="form-label">Typ odpowiedzi</label>
        <select class="input" id="q-type">
          ${TYPES.map(t => `<option value="${t.id}" ${state.type === t.id ? "selected" : ""}>${t.label}</option>`).join("")}
        </select>
      </div>
      <div class="form-group" id="q-options-wrap" style="display:${state.type === "select" || state.type === "multiselect" ? "block" : "none"};">
        <label class="form-label">Opcje (każda w nowej linii)</label>
        <textarea class="textarea" id="q-options" placeholder="Opcja 1&#10;Opcja 2">${(state.options || []).join("\n")}</textarea>
      </div>
      <label class="checkbox ${state.required ? "checked" : ""}" id="q-required-toggle">
        <div class="checkbox-box">${state.required ? '<i class="fa-solid fa-check" style="font-size:12px;"></i>' : ""}</div>
        <div style="flex:1;"><span class="text-sm">Wymagane</span></div>
      </label>
    </div>
  `;

  body.querySelector("#q-type")?.addEventListener("change", (e) => {
    const t = e.target.value;
    const wrap = body.querySelector("#q-options-wrap");
    if (wrap) wrap.style.display = (t === "select" || t === "multiselect") ? "block" : "none";
  });

  body.querySelector("#q-required-toggle")?.addEventListener("click", (e) => {
    e.preventDefault();
    state.required = !state.required;
    const box = e.currentTarget.querySelector(".checkbox-box");
    e.currentTarget.classList.toggle("checked");
    box.innerHTML = state.required ? '<i class="fa-solid fa-check" style="font-size:12px;"></i>' : "";
  });

  openModal({
    title: isEdit ? "Edytuj pytanie" : "Nowe pytanie",
    body,
    actions: [
      { label: "Anuluj", variant: "ghost" },
      {
        label: "Zapisz",
        variant: "primary",
        onClick: async () => {
          const text = body.querySelector("#q-text")?.value.trim();
          const type = body.querySelector("#q-type")?.value;
          if (!text) { showToast("Wpisz pytanie", "error"); return; }

          const options = (type === "select" || type === "multiselect")
            ? (body.querySelector("#q-options")?.value || "").split("\n").map(s => s.trim()).filter(Boolean)
            : [];

          if ((type === "select" || type === "multiselect") && options.length < 2) {
            showToast("Dodaj min. 2 opcje", "error");
            return;
          }

          try {
            await saveCustomQuestion(isEdit ? existing.id : null, {
              text, type, options,
              required: state.required,
              order: state.order
            });
            showToast("✅ Zapisano", "success");
            _questions = await loadCustomQuestions();
            const container = document.getElementById("custom-questions-content");
            if (container) render(container);
          } catch (e) {
            console.error(e);
            showToast("Błąd zapisu", "error");
          }
        }
      }
    ]
  });
}
