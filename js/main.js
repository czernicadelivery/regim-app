// ============================================================================
// LOCK IN 2027 — js/main.js
// Entry point: init Firebase → auth listener → reset state → router → nav.
// Podetap 1A: Ładowanie profilu z Firestore + opcjonalna migracja z localStorage.
// Podetap 1B: Przekierowanie do onboardingu dla nowych użytkowników.
// ============================================================================

import { initFirebase, getAuthMod, setCurrentUser, updateAuthUI, updateSyncUI, attachSigninHandler } from "./firebase.js";
import { migrateLocalToCloud, loadProfile, saveProfile } from "./core/data.js";
import { resetAppState, state } from "./state.js";
import { initRouter, refreshCurrent } from "./router.js";
import { renderNav } from "./components/nav.js";
import { showToast } from "./components/toast.js";
import { getSettings } from "./core/storage.js";
import { openModal } from "./components/modal.js";

// Wewnętrzne pola stanu
state._currentUid = undefined;
state._routerInitialized = false;
state._booted = false;
state._streak = 0;

// --- Handle user change (auth listener callback) ------------------------
async function handleUserChange(user) {
  const prevUid = state._currentUid;
  const nextUid = user ? user.uid : "local";

  if (prevUid === nextUid && state._booted) return;

  state._currentUid = nextUid;
  state._booted = true;

  setCurrentUser(user || { uid: "local" });
  resetAppState();

  let redirectToOnboarding = false;

  if (user) {
    updateAuthUI(user);

    try {
      await migrateLocalToCloud();
      state.profile = await loadProfile();

      if (!state.profile) {
        const hasLocalSettings = localStorage.getItem("regim:name");

        if (hasLocalSettings) {
          const localSettings = getSettings();
          openModal({
            title: "Wykryto stare dane",
            body: "Znaleźliśmy dane profilu z poprzedniej wersji aplikacji na tym urządzeniu. Czy chcesz je bezpiecznie przenieść na to konto w chmurze?",
            actions: [
              {
                label: "Nie, pomiń",
                variant: "secondary",
                onClick: () => { redirectToOnboarding = true; }
              },
              {
                label: "Tak, przenieś",
                variant: "primary",
                onClick: async () => {
                  await saveProfile({
                    displayName: localSettings.name,
                    goalWeight: localSettings.goalWeight,
                    startWeight: localSettings.startWeight,
                    age: localSettings.age,
                    height: localSettings.height,
                    onboardingCompleted: true
                  });
                  showToast("Dane przeniesione do chmury", "success");
                  setTimeout(() => window.location.reload(), 1000);
                }
              }
            ]
          });
        } else {
          redirectToOnboarding = true;
        }
      } else if (!state.profile.onboardingCompleted) {
        redirectToOnboarding = true;
      }
    } catch (e) {
      console.error("Błąd podczas ładowania profilu:", e);
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

  if (redirectToOnboarding) {
    setTimeout(() => { location.hash = "#onboarding"; }, 100);
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
  const sidebarSignin = document.querySelector('[data-action="signin"]');
  if (sidebarSignin) {
    attachSigninHandler(sidebarSignin);
  }

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
