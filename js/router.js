// ============================================================================
// LOCK IN 2027 — js/router.js
// Hash routing. Dodano inventory.
// ============================================================================

import { state } from "./state.js";
import { setActiveNav } from "./components/nav.js";

export const ROUTES = [
  "overview", "health", "training", "tasks", "progress", "coach",
  "nutrition", "supplements", "settings", "onboarding",
  "measurements", "fitness", "custom-questions", "social", "achievements",
  "routines", "skincare", "looksmaxxing", "medications", "inventory"
];

const MODULE_MAP = {
  overview: () => import("./modules/overview.js"),
  health: () => import("./modules/health.js"),
  training: () => import("./modules/training.js"),
  tasks: () => import("./modules/tasks.js"),
  progress: () => import("./modules/progress.js"),
  coach: () => import("./modules/coach.js"),
  nutrition: () => import("./modules/nutrition.js"),
  supplements: () => import("./modules/supplements.js"),
  settings: () => import("./modules/settings.js"),
  onboarding: () => import("./modules/onboarding.js"),
  measurements: () => import("./modules/measurements.js"),
  fitness: () => import("./modules/fitness.js"),
  "custom-questions": () => import("./modules/custom-questions.js"),
  social: () => import("./modules/social.js"),
  achievements: () => import("./modules/achievements.js"),
  routines: () => import("./modules/routines.js"),
  skincare: () => import("./modules/skincare.js"),
  looksmaxxing: () => import("./modules/looksmaxxing.js"),
  medications: () => import("./modules/medications.js"),
  inventory: () => import("./modules/inventory.js")
};

let _initialized = false;

export function getCurrentRoute() {
  const hash = (location.hash || "").replace("#", "").trim();
  return ROUTES.includes(hash) ? hash : "overview";
}

export function navigate(route) {
  if (!ROUTES.includes(route)) route = "overview";
  if (location.hash === "#" + route) renderView(route);
  else location.hash = "#" + route;
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
    if (typeof mod.render === "function") await mod.render(container);
    else container.innerHTML = `<div class="empty"><div class="empty-icon">🚧</div><div class="empty-title">Moduł „${route}"</div></div>`;
  } catch (e) {
    console.error("Router render error:", route, e);
    container.innerHTML = `<div class="empty"><div class="empty-icon">⚠️</div><div class="empty-title">Błąd</div><div class="empty-text">${e.message || ""}</div></div>`;
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
