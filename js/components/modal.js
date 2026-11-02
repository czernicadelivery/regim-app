// ============================================================================
// LOCK IN 2027 — js/components/modal.js
// API: openModal({ title, body, actions }). body: string HTML lub Node.
// actions: [{ label, variant, onClick }]
// ============================================================================

let _activeModal = null;
let _escBound = false;

export function openModal({ title = "", body = "", actions = [], size = "md" }) {
  closeModal();

  const root = document.getElementById("modal-root");
  if (!root) return;

  const wrap = document.createElement("div");
  wrap.className = "modal-wrap";
  wrap.innerHTML = `
    <div class="modal-backdrop" data-close></div>
    <div class="modal" role="dialog" aria-modal="true">
      <div class="modal-header">
        <h2 class="modal-title">${escapeHtmlSafe(title)}</h2>
        <button class="modal-close" data-close aria-label="Zamknij"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="modal-body"></div>
      <div class="modal-actions" style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap;"></div>
    </div>
  `;

  const bodyEl = wrap.querySelector(".modal-body");
  if (typeof body === "string") bodyEl.innerHTML = body;
  else if (body instanceof Node) bodyEl.appendChild(body);

  const actionsEl = wrap.querySelector(".modal-actions");
  if (actions.length === 0) actionsEl.style.display = "none";
  actions.forEach(a => {
    const btn = document.createElement("button");
    btn.className = `btn btn-${a.variant || "secondary"} btn-block`;
    btn.textContent = a.label || "OK";
    btn.addEventListener("click", () => {
      if (typeof a.onClick === "function") a.onClick();
      if (a.close !== false) closeModal();
    });
    actionsEl.appendChild(btn);
  });

  wrap.querySelectorAll("[data-close]").forEach(el => el.addEventListener("click", closeModal));

  root.appendChild(wrap);
  _activeModal = wrap;

  if (!_escBound) {
    _escBound = true;
    document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });
  }
}

export function closeModal() {
  if (_activeModal && _activeModal.parentNode) {
    _activeModal.parentNode.removeChild(_activeModal);
  }
  _activeModal = null;
  const root = document.getElementById("modal-root");
  if (root) root.innerHTML = "";
}

export function isModalOpen() { return !!_activeModal; }

function escapeHtmlSafe(s) {
  const d = document.createElement("div");
  d.textContent = s || "";
  return d.innerHTML;
}
