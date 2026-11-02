// ============================================================================
// LOCK IN 2027 — js/components/nav.js
// Sidebar (desktop) + Bottom nav (mobile, 6 + "Więcej") + Drawer (mobile).
// ============================================================================

// 6 głównych sekcji — bottom nav na mobile
export const SECTIONS = [
  { id: "overview",    icon: "fa-house",              label: "Overview" },
  { id: "health",      icon: "fa-heart-pulse",        label: "Health" },
  { id: "training",    icon: "fa-dumbbell",           label: "Training" },
  { id: "tasks",       icon: "fa-circle-check",       label: "Tasks" },
  { id: "progress",    icon: "fa-chart-line",         label: "Progress" },
  { id: "coach",       icon: "fa-comment-dots",       label: "Coach" }
];

// Wszystkie pozostałe sekcje — sidebar + drawer
export const EXTRA_SECTIONS = [
  { id: "routines",     icon: "fa-list-check",         label: "Rutyny",           group: "LIFESTYLE" },
  { id: "skincare",     icon: "fa-spa",                label: "Skincare",         group: "LOOKS" },
  { id: "looksmaxxing", icon: "fa-eye",                label: "Looksmaxxing",     group: "LOOKS" },
  { id: "nutrition",    icon: "fa-utensils",           label: "Nutrition",        group: "LIFESTYLE" },
  { id: "supplements",  icon: "fa-capsules",           label: "Suplementy",       group: "LIFESTYLE" },
  { id: "medications",  icon: "fa-prescription",       label: "Leki",             group: "LIFESTYLE" },
  { id: "inventory",    icon: "fa-box",                label: "Inventory",        group: "MY SPACE" },
  { id: "measurements", icon: "fa-ruler",              label: "Pomiary",          group: "BODY" },
  { id: "fitness",      icon: "fa-trophy",             label: "Rekordy",          group: "BODY" },
  { id: "custom-questions", icon: "fa-question-circle", label: "Pytania",         group: "MY SPACE" },
  { id: "achievements", icon: "fa-medal",              label: "Osiągnięcia",      group: "PROGRESS" },
  { id: "social",       icon: "fa-users",              label: "Social",           group: "SOCIAL" }
];

let _currentRoute = "overview";

export function renderNav() {
  renderSidebar();
  renderBottomNav();
  renderDrawer();
  setActiveNav(_currentRoute);
}

function renderSidebar() {
  const sidebar = document.getElementById("sidebar-nav");
  if (!sidebar) return;
  sidebar.innerHTML = SECTIONS.concat(EXTRA_SECTIONS).map(s => `
    <a href="#${s.id}" class="sidebar-item" data-route="${s.id}">
      <span class="sidebar-item-icon"><i class="fa-solid ${s.icon}"></i></span>
      <span>${s.label}</span>
    </a>
  `).join("");
}

function renderBottomNav() {
  const bottom = document.getElementById("app-bottomnav");
  if (!bottom) return;
  // 6 głównych + "Więcej"
  const items = SECTIONS.map(s => `
    <a href="#${s.id}" class="bottomnav-item" data-route="${s.id}">
      <span class="bottomnav-item-icon"><i class="fa-solid ${s.icon}"></i></span>
      <span>${s.label}</span>
    </a>
  `).join("");
  bottom.innerHTML = items + `
    <button class="bottomnav-item" id="btn-open-drawer" type="button">
      <span class="bottomnav-item-icon"><i class="fa-solid fa-bars"></i></span>
      <span>Więcej</span>
    </button>
  `;
  document.getElementById("btn-open-drawer")?.addEventListener("click", openDrawer);
}

function renderDrawer() {
  let drawer = document.getElementById("mobile-drawer");
  let backdrop = document.getElementById("mobile-drawer-backdrop");

  if (!drawer) {
    drawer = document.createElement("div");
    drawer.id = "mobile-drawer";
    drawer.className = "drawer";
    document.body.appendChild(drawer);
  }
  if (!backdrop) {
    backdrop = document.createElement("div");
    backdrop.id = "mobile-drawer-backdrop";
    backdrop.className = "drawer-backdrop";
    document.body.appendChild(backdrop);
    backdrop.addEventListener("click", closeDrawer);
  }

  // Grupujemy EXTRA_SECTIONS po "group"
  const groups = {};
  EXTRA_SECTIONS.forEach(s => {
    const g = s.group || "INNE";
    if (!groups[g]) groups[g] = [];
    groups[g].push(s);
  });

  const groupedHtml = Object.keys(groups).map(group => `
    <div class="drawer-section">
      <div class="drawer-section-title">${group}</div>
      ${groups[group].map(s => `
        <a href="#${s.id}" class="drawer-item" data-route="${s.id}">
          <span class="drawer-item-icon"><i class="fa-solid ${s.icon}"></i></span>
          <span>${s.label}</span>
        </a>
      `).join("")}
    </div>
  `).join("");

  drawer.innerHTML = `
    <div class="drawer-handle"></div>
    <div class="drawer-header">
      <div class="drawer-title">Menu</div>
      <button class="drawer-close" id="btn-close-drawer"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="drawer-content">
      <div class="drawer-section">
        <div class="drawer-section-title">GŁÓWNE</div>
        ${SECTIONS.map(s => `
          <a href="#${s.id}" class="drawer-item" data-route="${s.id}">
            <span class="drawer-item-icon"><i class="fa-solid ${s.icon}"></i></span>
            <span>${s.label}</span>
          </a>
        `).join("")}
      </div>
      ${groupedHtml}
      <div class="drawer-section">
        <div class="drawer-section-title">KONTO</div>
        <a href="#settings" class="drawer-item" data-route="settings">
          <span class="drawer-item-icon"><i class="fa-solid fa-gear"></i></span>
          <span>Ustawienia</span>
        </a>
      </div>
    </div>
  `;

  document.getElementById("btn-close-drawer")?.addEventListener("click", closeDrawer);
  drawer.querySelectorAll(".drawer-item").forEach(item => {
    item.addEventListener("click", () => closeDrawer());
  });
}

function openDrawer() {
  document.getElementById("mobile-drawer")?.classList.add("open");
  document.getElementById("mobile-drawer-backdrop")?.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeDrawer() {
  document.getElementById("mobile-drawer")?.classList.remove("open");
  document.getElementById("mobile-drawer-backdrop")?.classList.remove("open");
  document.body.style.overflow = "";
}

export function setActiveNav(route) {
  _currentRoute = route;
  document.querySelectorAll("[data-route]").forEach(el => {
    if (el.dataset.route === route) el.classList.add("active");
    else el.classList.remove("active");
  });
}
