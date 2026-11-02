// ============================================================================
// LOCK IN 2027 — js/modules/medications.js
// Medication Center: katalog + prywatny tracker (tylko dla leków przepisanych).
// Bez dawek. Bez rekomendacji. Z linkami do URPL/EMA.
// ============================================================================

import { $, escapeHtml, dateKey } from "../core/utils.js";
import { localKey } from "../core/storage.js";
import { MED_CATEGORIES, MEDICATIONS_CATALOG, getMedication, getMedCategory } from "../core/medications-catalog.js";
import { state } from "../state.js";
import { showToast } from "../components/toast.js";
import { openModal } from "../components/modal.js";

let _activeTab = "catalog"; // catalog | mine
let _filter = "all";
let _search = "";
let _myMeds = [];

// ============================================================================
// STORAGE (localStorage — prywatne, nie sync do Firestore bez zgody)
// ============================================================================

function loadMyMedications() {
  try {
    const raw = localStorage.getItem(localKey("my-medications"));
    return raw ? JSON.parse(raw) || [] : [];
  } catch (e) { return []; }
}

function saveMyMedications(meds) {
  localStorage.setItem(localKey("my-medications"), JSON.stringify(meds));
}

// ============================================================================
// RENDER
// ============================================================================

export async function render(container) {
  _myMeds = loadMyMedications();

  const profile = state.profile || {};
  const age = profile.age || null;
  const isMinor = age != null && age < 18;

  container.innerHTML = `
    <div class="stack-lg">
      <div class="card card-accent">
        <div class="row-between">
          <div>
            <div class="card-subtitle">MEDICATION CENTER</div>
            <div class="card-title" style="margin-top:4px;">Biblioteka leków</div>
          </div>
          <div style="font-size:32px;">💊</div>
        </div>
        <p class="text-sm text-secondary mt-2" style="line-height:1.5;">
          Edukacja o lekach. Aplikacja NIE przepisuje, NIE doradza dawek, NIE zastępuje lekarza.
        </p>
      </div>

      ${isMinor ? `
        <div class="card" style="background:var(--danger-subtle);border-color:var(--danger);">
          <div class="row" style="gap:10px;align-items:flex-start;">
            <div style="font-size:24px;">🚨</div>
            <div>
              <div class="text-sm font-bold" style="color:var(--danger);">Ważne dla osób niepełnoletnich</div>
              <div class="text-xs text-secondary mt-1" style="line-height:1.5;">
                Nie rozpoczynaj samodzielnie żadnego leczenia ani suplementacji.
                Skonsultuj się z dorosłym opiekunem i lekarzem.
              </div>
            </div>
          </div>
        </div>
      ` : ""}

      <div class="tabs" id="med-tabs">
        <button class="tab ${_activeTab === "catalog" ? "active" : ""}" data-tab="catalog">📚 Katalog</button>
        <button class="tab ${_activeTab === "mine" ? "active" : ""}" data-tab="mine">📋 Moje leki (${_myMeds.length})</button>
        <button class="tab ${_activeTab === "info" ? "active" : ""}" data-tab="info">ℹ️ Info</button>
      </div>

      <div id="med-content"></div>
    </div>
  `;

  renderContent(container);
  bindEvents(container);
}

function renderContent(container) {
  const content = container.querySelector("#med-content");
  if (!content) return;

  if (_activeTab === "catalog") content.innerHTML = renderCatalog();
  else if (_activeTab === "mine") content.innerHTML = renderMine();
  else if (_activeTab === "info") content.innerHTML = renderInfo();

  bindTabEvents(container);
}

// ============================================================================
// TAB: KATALOG
// ============================================================================

function renderCatalog() {
  const filtered = MEDICATIONS_CATALOG.filter(m => {
    if (_filter !== "all" && m.category !== _filter) return false;
    if (_search && !m.name.toLowerCase().includes(_search.toLowerCase())) return false;
    return true;
  });

  return `
    <div class="card card-padded-sm mb-3">
      <input class="input" id="med-search" placeholder="🔍 Szukaj leku..." value="${escapeHtml(_search)}">
    </div>

    <div style="overflow-x:auto;padding-bottom:4px;margin-bottom:12px;">
      <div class="row" style="gap:6px;flex-wrap:nowrap;">
        <button class="chip ${_filter === "all" ? "active" : ""}" data-filter="all">Wszystkie</button>
        ${MED_CATEGORIES.map(c => `<button class="chip ${_filter === c.id ? "active" : ""}" data-filter="${c.id}">${c.icon} ${c.name}</button>`).join("")}
      </div>
    </div>

    <div class="stack-sm">
      ${filtered.length ? filtered.map(m => renderCatalogItem(m)).join("") : `<div class="empty"><div class="empty-icon">🔍</div><div class="empty-text">Nie znaleziono.</div></div>`}
    </div>

    <div class="card card-flat mt-4">
      <div class="text-xs text-tertiary" style="line-height:1.5;">
        ⚠️ Informacje mają charakter wyłącznie edukacyjny. Zawsze sprawdzaj oficjalną ulotkę i konsultuj się z lekarzem lub farmaceutą.
      </div>
    </div>
  `;
}

function renderCatalogItem(m) {
  const cat = getMedCategory(m.category);
  const prescriptionBadge = m.prescription
    ? `<span class="badge badge-danger" style="font-size:9px;">📋 Na receptę</span>`
    : `<span class="badge badge-neutral" style="font-size:9px;">OTC</span>`;

  return `
    <div class="card card-padded-sm" style="${m.prescription ? "border-color:rgba(248,113,113,.3);" : ""}">
      <div class="row-between">
        <div style="flex:1;min-width:0;">
          <div class="text-sm font-bold">${escapeHtml(m.name)}</div>
          <div class="row" style="gap:6px;margin-top:4px;flex-wrap:wrap;">
            ${cat ? `<span class="badge badge-neutral" style="font-size:9px;">${cat.icon} ${cat.name}</span>` : ""}
            ${prescriptionBadge}
          </div>
          <p class="text-xs text-secondary mt-2" style="line-height:1.5;">${escapeHtml(m.short)}</p>
        </div>
        <button class="btn-icon btn-icon-sm" data-info-med="${m.id}"><i class="fa-solid fa-circle-info"></i></button>
      </div>
    </div>
  `;
}

// ============================================================================
// TAB: MOJE LEKI
// ============================================================================

function renderMine() {
  if (_myMeds.length === 0) {
    return `<div class="empty">
      <div class="empty-icon">📋</div>
      <div class="empty-title">Brak leków w trackerze</div>
      <div class="empty-text">Dodaj leki przepisane przez lekarza, aby śledzić przyjmowanie.</div>
      <button class="btn btn-primary mt-3" id="btn-add-my-med">
        <i class="fa-solid fa-plus"></i> Dodaj lek
      </button>
      <div class="text-xs text-tertiary mt-3" style="max-width:300px;text-align:center;line-height:1.5;">
        ⚠️ Tracker jest prywatny i zapisuje się tylko lokalnie. Nie zawiera dawek ani rekomendacji.
      </div>
    </div>`;
  }

  return `
    <div class="stack-sm">
      ${_myMeds.map(m => renderMyMedItem(m)).join("")}
    </div>
    <button class="btn btn-secondary btn-block mt-3" id="btn-add-my-med">
      <i class="fa-solid fa-plus"></i> Dodaj lek
    </button>
  `;
}

function renderMyMedItem(m) {
  const today = dateKey(new Date());
  const takenToday = m.log && m.log[today];
  return `
    <div class="card card-padded-sm" style="${takenToday ? "background:var(--accent-subtle);border-color:var(--accent-medium);" : ""}">
      <div class="row-between">
        <div style="flex:1;min-width:0;">
          <div class="text-sm font-bold">${escapeHtml(m.name)}</div>
          ${m.prescribedBy ? `<div class="text-xs text-tertiary mt-1">Przepisany przez: ${escapeHtml(m.prescribedBy)}</div>` : ""}
          ${m.notes ? `<div class="text-xs text-secondary mt-1" style="line-height:1.4;">${escapeHtml(m.notes)}</div>` : ""}
        </div>
        <div class="row" style="gap:6px;">
          <button class="btn-icon btn-icon-sm" data-toggle-taken="${m.id}" title="${takenToday ? "Cofnij" : "Przyjęte dziś"}">
            <i class="fa-solid fa-${takenToday ? "check" : "plus"}" style="color:${takenToday ? "var(--accent)" : "var(--text-secondary)"};"></i>
          </button>
          <button class="btn-icon btn-icon-sm" data-edit-med="${m.id}" title="Edytuj"><i class="fa-solid fa-pen"></i></button>
          <button class="btn-icon btn-icon-sm" data-del-med="${m.id}" title="Usuń" style="color:var(--danger);"><i class="fa-solid fa-xmark"></i></button>
        </div>
      </div>
    </div>
  `;
}

// ============================================================================
// TAB: INFO
// ============================================================================

function renderInfo() {
  return `
    <div class="stack">
      <div class="card">
        <div class="card-header"><div class="card-title">⚠️ Ważne informacje</div></div>
        <ul class="text-sm text-secondary" style="line-height:1.7;padding-left:20px;">
          <li>Ta sekcja jest <strong>edukacyjna</strong> — nie zastępuje porady lekarza.</li>
          <li>Aplikacja <strong>nie przepisuje</strong> leków ani dawek.</li>
          <li>Aplikacja <strong>nie diagnozuje</strong> chorób.</li>
          <li>Tracker leków jest <strong>prywatny</strong> — zapisuje się tylko lokalnie.</li>
          <li>Przed przyjęciem jakiegokolwiek leku przeczytaj <strong>oficjalną ulotkę</strong>.</li>
          <li>W razie wątpliwości skonsultuj się z <strong>lekarzem lub farmaceutą</strong>.</li>
        </ul>
      </div>

      <div class="card">
        <div class="card-header"><div class="card-title">📚 Oficjalne źródła</div></div>
        <div class="stack-sm">
          <a href="https://www.urpl.gov.pl/" target="_blank" rel="noopener" class="list-item list-item-clickable" style="text-decoration:none;color:inherit;">
            <div class="list-item-body">
              <div class="list-item-title">URPL — Urząd Rejestracji Produktów Leczniczych</div>
              <div class="list-item-subtitle">Oficjalna baza leków w Polsce</div>
            </div>
            <i class="fa-solid fa-external-link-alt text-tertiary"></i>
          </a>
          <a href="https://www.ema.europa.eu/" target="_blank" rel="noopener" class="list-item list-item-clickable" style="text-decoration:none;color:inherit;">
            <div class="list-item-body">
              <div class="list-item-title">EMA — European Medicines Agency</div>
              <div class="list-item-subtitle">Europejska agencja leków</div>
            </div>
            <i class="fa-solid fa-external-link-alt text-tertiary"></i>
          </a>
          <a href="https://www.who.int/" target="_blank" rel="noopener" class="list-item list-item-clickable" style="text-decoration:none;color:inherit;">
            <div class="list-item-body">
              <div class="list-item-title">WHO — World Health Organization</div>
              <div class="list-item-subtitle">Światowa Organizacja Zdrowia</div>
            </div>
            <i class="fa-solid fa-external-link-alt text-tertiary"></i>
          </a>
        </div>
      </div>

      <div class="card" style="background:var(--danger-subtle);border-color:var(--danger);">
        <div class="card-header"><div class="card-title" style="color:var(--danger);">🚨 W sytuacjach nagłych</div></div>
        <div class="text-sm text-secondary" style="line-height:1.6;">
          W przypadku zatrucia lub reakcji alergicznej dzwoń na <strong>112</strong> lub skontaktuj się z najbliższym oddziałem ratunkowym.
        </div>
      </div>
    </div>
  `;
}

// ============================================================================
// MODAL: SZCZEGÓŁY LEKU
// ============================================================================

function openMedInfoModal(id) {
  const m = getMedication(id);
  if (!m) return;

  const cat = getMedCategory(m.category);

  const body = document.createElement("div");
  body.innerHTML = `
    <div class="stack">
      <div class="row" style="gap:6px;flex-wrap:wrap;">
        ${cat ? `<span class="badge badge-neutral">${cat.icon} ${cat.name}</span>` : ""}
        ${m.prescription ? `<span class="badge badge-danger">📋 Na receptę</span>` : `<span class="badge badge-neutral">OTC</span>`}
      </div>

      <div>
        <div class="text-xs text-tertiary uppercase font-bold mb-1">Klasa</div>
        <p class="text-sm text-secondary">${escapeHtml(m.class)}</p>
      </div>

      <div>
        <div class="text-xs text-tertiary uppercase font-bold mb-1">Co to jest</div>
        <p class="text-sm text-secondary" style="line-height:1.5;">${escapeHtml(m.short)}</p>
      </div>

      ${m.warnings && m.warnings.length ? `
        <div class="card card-flat" style="background:var(--danger-subtle);border-color:var(--danger);">
          <div class="text-xs uppercase font-bold mb-2" style="color:var(--danger);">🚨 Ostrzeżenia</div>
          <ul class="text-sm text-secondary" style="padding-left:18px;line-height:1.6;">
            ${m.warnings.map(w => `<li>${escapeHtml(w)}</li>`).join("")}
          </ul>
        </div>
      ` : ""}

      ${m.minAge ? `
        <div class="card card-flat" style="background:var(--warning-subtle);">
          <div class="text-xs uppercase font-bold mb-1" style="color:var(--warning);">👶 Wiek</div>
          <p class="text-sm text-secondary">${escapeHtml(m.minAge)}</p>
        </div>
      ` : ""}

      <div class="card card-flat">
        <div class="text-xs text-tertiary uppercase font-bold mb-1">Oficjalne źródło</div>
        <a href="${m.source}" target="_blank" rel="noopener" class="text-sm text-accent" style="word-break:break-all;">${escapeHtml(m.source)}</a>
      </div>

      <div class="text-xs text-tertiary" style="line-height:1.5;">
        ℹ️ Aplikacja nie dostarcza informacji o dawkowaniu. Dawkę ustala wyłącznie lekarz lub zgodnie z ulotką.
      </div>
    </div>
  `;

  openModal({
    title: m.name,
    body,
    actions: [{ label: "Zamknij", variant: "ghost" }]
  });
}

// ============================================================================
// DODAWANIE / EDYCJA MOJEGO LEKU
// ============================================================================

function openMyMedModal(existing) {
  const isEdit = !!existing;
  const data = existing ? { ...existing } : { name: "", prescribedBy: "", notes: "", log: {} };

  const body = document.createElement("div");
  body.innerHTML = `
    <div class="stack">
      <div class="card card-flat" style="background:var(--danger-subtle);border-color:var(--danger);">
        <div class="text-xs text-secondary" style="line-height:1.5;">
          🚨 Dodawaj TYLKO leki przepisane przez lekarza. Ten tracker NIE zawiera dawek — trzymaj je na recepcie lub w notatce od lekarza.
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Nazwa leku</label>
        <input class="input" id="mm-name" value="${escapeHtml(data.name)}" placeholder="np. Metformina 500mg">
      </div>

      <div class="form-group">
        <label class="form-label">Przepisany przez (opcjonalnie)</label>
        <input class="input" id="mm-by" value="${escapeHtml(data.prescribedBy || "")}" placeholder="np. dr Anna Kowalska">
      </div>

      <div class="form-group">
        <label class="form-label">Notatka od lekarza (opcjonalnie)</label>
        <textarea class="textarea" id="mm-notes" placeholder="np. przyjmować rano z posiłkiem">${escapeHtml(data.notes || "")}</textarea>
      </div>

      <div class="text-xs text-tertiary" style="line-height:1.5;">
        ℹ️ Wszystkie dane zapisują się tylko lokalnie (localStorage). Nie są wysyłane do chmury bez Twojej zgody.
      </div>
    </div>
  `;

  openModal({
    title: isEdit ? "Edytuj lek" : "Nowy lek",
    body,
    actions: [
      { label: "Anuluj", variant: "ghost" },
      {
        label: isEdit ? "Zapisz" : "Dodaj",
        variant: "primary",
        onClick: () => {
          const name = body.querySelector("#mm-name").value.trim();
          if (!name) { showToast("Podaj nazwę leku", "error"); return; }

          const item = {
            id: isEdit ? existing.id : "med-" + Date.now(),
            name,
            prescribedBy: body.querySelector("#mm-by").value.trim(),
            notes: body.querySelector("#mm-notes").value.trim(),
            log: isEdit ? (existing.log || {}) : {},
            createdAt: isEdit ? existing.createdAt : Date.now()
          };

          const idx = _myMeds.findIndex(m => m.id === item.id);
          if (idx >= 0) _myMeds[idx] = item;
          else _myMeds.push(item);

          saveMyMedications(_myMeds);
          showToast("✅ Zapisano", "success");
          const container = document.getElementById("medications-content");
          if (container) render(container);
        }
      }
    ]
  });
}

// ============================================================================
// EVENTY
// ============================================================================

function bindEvents(container) {
  container.querySelectorAll("#med-tabs [data-tab]").forEach(tab => {
    tab.addEventListener("click", () => {
      _activeTab = tab.dataset.tab;
      container.querySelectorAll("#med-tabs [data-tab]").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      renderContent(container);
    });
  });
}

function bindTabEvents(container) {
  // Katalog: filtry
  container.querySelectorAll("[data-filter]").forEach(chip => {
    chip.addEventListener("click", () => {
      _filter = chip.dataset.filter;
      renderContent(container);
    });
  });

  // Katalog: search
  const searchEl = container.querySelector("#med-search");
  if (searchEl) {
    searchEl.addEventListener("input", (e) => {
      _search = e.target.value;
      renderContent(container);
      const newSearch = container.querySelector("#med-search");
      if (newSearch) { newSearch.focus(); newSearch.setSelectionRange(_search.length, _search.length); }
    });
  }

  // Katalog: info
  container.querySelectorAll("[data-info-med]").forEach(btn => {
    btn.addEventListener("click", () => openMedInfoModal(btn.dataset.infoMed));
  });

  // Moje leki: add
  container.querySelector("#btn-add-my-med")?.addEventListener("click", () => openMyMedModal(null));

  // Moje leki: toggle taken
  container.querySelectorAll("[data-toggle-taken]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.toggleTaken;
      const med = _myMeds.find(m => m.id === id);
      if (!med) return;
      const today = dateKey(new Date());
      if (!med.log) med.log = {};
      med.log[today] = !med.log[today];
      saveMyMedications(_myMeds);
      renderContent(container);
      if (med.log[today]) showToast("✅ Przyjęte", "success");
    });
  });

  // Moje leki: edit
  container.querySelectorAll("[data-edit-med]").forEach(btn => {
    btn.addEventListener("click", () => {
      const med = _myMeds.find(m => m.id === btn.dataset.editMed);
      if (med) openMyMedModal(med);
    });
  });

  // Moje leki: delete
  container.querySelectorAll("[data-del-med]").forEach(btn => {
    btn.addEventListener("click", () => {
      if (!confirm("Usunąć lek z trackera?")) return;
      _myMeds = _myMeds.filter(m => m.id !== btn.dataset.delMed);
      saveMyMedications(_myMeds);
      renderContent(container);
      showToast("Usunięto", "");
    });
  });
}
