// ============================================================================
// LOCK IN 2027 — js/components/toast.js
// Prosty toast na dole ekranu.
// ============================================================================

let _t = null;

export function showToast(msg, type = "") {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = msg;
  el.className = "toast show" + (type ? " toast-" + type : "");
  clearTimeout(_t);
  _t = setTimeout(() => { el.className = "toast"; }, 2400);
}
