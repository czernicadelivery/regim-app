// ============================================================================
// LOCK IN 2027 — js/components/nav.js
// Sidebar + bottom nav. Dodano Skincare.
// ============================================================================

export const SECTIONS = [
  { id: "overview",    icon: "fa-house",              label: "Overview" },
  { id: "health",      icon: "fa-heart-pulse",        label: "Health" },
  { id: "training",    icon: "fa-dumbbell",           label: "Training" },
  { id: "tasks",       icon: "fa-circle-check",       label: "Tasks" },
  { id: "progress",    icon: "fa-chart-line",         label: "Progress" },
  { id: "coach",       icon: "fa-comment-dots",       label: "Coach" }
];

export const EXTRA_SECTIONS = [
  { id: "routines",     icon: "fa-list-check",         label: "Rutyny" },
  { id: "skincare",     icon: "fa-spa",                label: "Skincare" },
  { id: "nutrition",    icon: "fa-utensils",           label: "Nutrition" },
  { id: "supplements",  icon: "fa-capsules",           label: "Suplementy" },
  { id: "achievements", icon: "fa-trophy",             label: "Osiągnięcia" },
  { id: "social",       icon: "fa-users",              label: "Social" }
];

let _currentRoute = "overview";

export function renderNav() {
  const sidebar = document.getElementById("sidebar-nav");
  const bottom = document.getElementById("app-bottomnav");

  if (sidebar) {
    sidebar.innerHTML = SECTIONS.concat(EXTRA_SECTIONS).map(s => `
      <a href="#${s.id}" class="sidebar-item" data-route="${s.id}">
        <span class="sidebar-item-icon"><i class="fa-solid ${s.icon}"></i></span>
        <span>${s.label}</span>
      </a>
    `).join("");
  }

  if (bottom) {
    bottom.innerHTML = SECTIONS.map(s => `
      <a href="#${s.id}" class="bottomnav-item" data-route="${s.id}">
        <span class="bottomnav-item-icon"><i class="fa-solid ${s.icon}"></i></span>
        <span>${s.label}</span>
      </a>
    `).join("");
  }

  setActiveNav(_currentRoute);
}

export function setActiveNav(route) {
  _currentRoute = route;
  document.querySelectorAll("[data-route]").forEach(el => {
    if (el.dataset.route === route) el.classList.add("active");
    else el.classList.remove("active");
  });
}
