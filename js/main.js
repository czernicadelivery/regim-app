// ============================================================================
// LOCK IN 2027 — js/main.js
// Entry point: init Firebase → auth listener → reset state → router → nav.
// Wbudowane poprawki A+B+C+D z Etapu 1d:
//   A) resetAppState na starcie handleUserChange
//   B) formularze zawsze czyszczone (w modułach health/settings)
//   C) try/catch + booted flag + safety net 3s
//   D) jeden listener (onAuthStateChanged), jeden router, jeden nav
// ============================================================================

import { initFirebase, getAuthMod, setCurrentUser, updateAuthUI, updateSyncUI, attachSigninHandler } from "./firebase.js";
import { migrateLocalToCloud } from "./core/data.js";
import { resetAppState, state } from "./state.js";
import { initRouter, refreshCurrent } from "./router.js";
import { renderNav } from "./components/nav.js";
import { showToast } from "./components/toast.js";

// Wewnętrzne pola stanu (nie w state.js, żeby nie modyfikować już wgranych plików)
state._currentUid = undefined;
state._routerInitialized = false;
state._booted = false;
state._streak = 0;

// --- Handle user change (auth listener callback) ------------------------
async function handleUserChange(user) {
  const prevUid = state._currentUid;
  const nextUid = user ? user.uid : "local";

  // Tylko jeśli user się zmienił (lub pierwszy boot)
  if (prevUid === nextUid && state._booted) return;

  state._currentUid = nextUid;
  state._booted = true;

  setCurrentUser(user || { uid: "local" });
  resetAppState(); // (A) reset stanu — zero wycieku między userami

  if (user) {
    updateAuthUI(user);
    try {
      await migrateLocalToCloud();
    } catch (e) {
      console.error("Migration error:", e);
    }
  } else {
    updateAuthUI(null);
  }
  updateSyncUI();

  renderNav();

  if (!state._routerInitialized) {
    initRouter();
    state._routerInitialized = true;
  } else {
    refreshCurrent();
  }
}

// --- Bootstrap ----------------------------------------------------------
async function bootstrap() {
  console.log("%c[LOCK IN 2027] bootstrap()", "color:#b6f05a;font-weight:bold;");

  try {
    const ok = await initFirebase();
    if (!ok) {
      console.warn("[LOCK IN 2027] Firebase niedostępny — tryb lokalny");
    }

    const { authMod, auth } = getAuthMod();

    if (authMod && auth) {
      authMod.onAuthStateChanged(auth, async (user) => {
        try {
          await handleUserChange(user);
        } catch (e) {
          console.error("[LOCK IN 2027] handleUserChange error:", e);
          showToast("Błąd inicjalizacji aplikacji", "error");
        }
      });
    } else {
      await handleUserChange(null);
    }

    attachButtons();
    startSafetyNet();
  } catch (e) {
    // (C) try/catch — bezpieczny fallback w trybie lokalnym
    console.error("[LOCK IN 2027] bootstrap fatal error:", e);
    showToast("Błąd ładowania — odśwież stronę", "error");
    state._booted = false;
    try {
      await handleUserChange(null);
    } catch (e2) {
      console.error("[LOCK IN 2027] fallback also failed:", e2);
    }
  }
}

// --- Attach buttons -----------------------------------------------------
function attachButtons() {
  // Signin: sidebar
  const sidebarSignin = document.querySelector('[data-action="signin"]');
  if (sidebarSignin) {
    attachSigninHandler(sidebarSignin);
  }

  // Signin: topbar (na mobile sidebar jest ukryty — dodajemy przycisk w topbar przez JS)
  const topbarRight = document.querySelector(".topbar-right");
  if (topbarRight && !topbarRight.querySelector('[data-action="signin"]')) {
    const btn = document.createElement("button");
    btn.className = "btn-icon";
    btn.dataset.action = "signin";
    btn.title = "Zaloguj / Wyloguj";
    btn.innerHTML = '<i class="fa-solid fa-user"></i>';
    topbarRight.insertBefore(btn, topbarRight.firstChild);
    attachSigninHandler(btn);
  }

  // Settings buttons (sidebar + topbar) → nawigacja do #settings
  document.querySelectorAll('[data-action="settings"]').forEach(btn => {
    if (btn.dataset.bound === "1") return;
    btn.dataset.bound = "1";
    btn.addEventListener("click", () => {
      location.hash = "#settings";
    });
  });
}

// --- Safety net --------------------------------------------------------
function startSafetyNet() {
  setTimeout(() => {
    if (!state._booted) {
      console.warn("[LOCK IN 2027] Auth listener timeout (3s) — awaryjny tryb lokalny");
      handleUserChange(null).catch(e => {
        console.error("[LOCK IN 2027] safety net failed:", e);
      });
    }
  }, 3000);
}

// --- Start --------------------------------------------------------------
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrap);
} else {
  bootstrap();
}
