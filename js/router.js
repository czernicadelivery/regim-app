// ============================================================================
// LOCK IN 2027 — js/router.js
// Hash routing. Lazy import modułów przy pierwszym wejściu na sekcję.
// Konwencja: każdy moduł eksportuje `render(container)`.
// ============================================================================

import { state } from "./state.js";
import { setActiveNav } from "./components/nav.js";

export const ROUTES = ["overview", "health", "training", "tasks", "progress", "coach", "nutrition", "supplements", "settings"];

const MODULE_MAP = {
  overview: () => import("./modules/overview.js"),
  health: () => import("./modules/health.js"),
  training: () => import("./modules/training.js"),
  tasks: () => import("./modules/tasks.js"),
  progress: () => import("./modules/progress.js"),
  coach: () => import("./modules/coach.js"),
  nutrition: () => import("./modules/nutrition.js"),
  supplements: () => import("./modules/supplements.js"),
  settings: () => import("./modules/settings.js")
};

let _initialized = false;

export function getCurrentRoute() {
  const hash = (location.hash || "").replace("#", "").trim();
  return ROUTES.includes(hash) ? hash : "overview";
}

export function navigate(route) {
  if (!ROUTES.includes(route)) route = "overview";
  if (location.hash === "#" + route) {
    renderView(route);
  } else {
    location.hash = "#" + route;
  }
}

async function renderView(route) {
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  const view = document.getElementById("view-" + route);
  if (view) view.classList.add("active");

  state.currentView = route;
  setActiveNav(route);

  const container = document.getElementById(route + "-content");
  if (!container) return;

  const loader = MODULE_MAP[route];
  if (!loader) return;

  try {
    const mod = await loader();
    if (typeof mod.render === "function") {
      await mod.render(container);
    } else {
      container.innerHTML = `<div class="empty"><div class="empty-icon">🚧</div><div class="empty-title">Moduł „${route}"</div><div class="empty-text">Moduł nie eksportuje funkcji render().</div></div>`;
    }
  } catch (e) {
    console.error("Router render error:", route, e);
    container.innerHTML = `<div class="empty"><div class="empty-icon">⚠️</div><div class="empty-title">Nie udało się załadować</div><div class="empty-text">${e.message || "Błąd modułu."}</div></div>`;
  }
}

export function initRouter() {
  if (_initialized) return;
  _initialized = true;
  window.addEventListener("hashchange", () => renderView(getCurrentRoute()));
  renderView(getCurrentRoute());
}

export function refreshCurrent() {
  renderView(state.currentView || getCurrentRoute());
}
