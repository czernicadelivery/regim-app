const firebaseConfig = {
  apiKey: "AIzaSyChzU-QWJ_lyE7kLePHCvYltIayMZuXlL8",
  authDomain: "regim-web.firebaseapp.com",
  projectId: "regim-web",
  storageBucket: "regim-web.firebasestorage.app",
  messagingSenderId: "1025631760665",
  appId: "1:1025631760665:web:93c5b62295bd8b0b675588"
};

let _firebaseReady = false;
let _currentUser = { uid: "local" };
let _authMod = null, _fsMod = null, _db = null, _auth = null;
let _syncInProgress = false;

export function getCurrentUser() { return _currentUser; }
export function isFirebaseReady() { return _firebaseReady; }
export function isCloud() { return _firebaseReady && _currentUser && _currentUser.uid !== "local"; }
export function getFs() { return { fsMod: _fsMod, db: _db }; }
export function getAuthMod() { return { authMod: _authMod, auth: _auth }; }
export function setCurrentUser(u) { _currentUser = u; window.__currentUser = u; }
export function setSyncInProgress(v) { _syncInProgress = v; updateSyncUI(); }

export function setSyncStatus(mode, label) {
  const el = document.getElementById("sync-status");
  if (!el) return;
  el.className = `badge badge-${mode === "synced" ? "success" : mode === "syncing" ? "warning" : "neutral"}`;
  el.textContent = label;
}

export function updateSyncUI() {
  if (!_firebaseReady) return setSyncStatus("offline", "Lokalnie");
  if (_currentUser && _currentUser.uid === "local") return setSyncStatus("offline", "Lokalnie");
  if (_syncInProgress) return setSyncStatus("syncing", "Sync...");
  setSyncStatus("synced", "Chmura");
}

export function updateAuthUI(user) {
  const badge = document.getElementById("user-badge");
  const label = document.querySelector("[data-signin-label]");
  if (badge) {
    if (user) {
      badge.textContent = user.displayName || (user.email ? user.email.split("@")[0] : user.uid.slice(0, 8));
      badge.classList.remove("hidden");
    } else {
      badge.classList.add("hidden");
    }
  }
  if (label) label.textContent = user ? "Wyloguj" : "Zaloguj";
}

export async function initFirebase() {
  if (_firebaseReady) return true;
  try {
    const appMod = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js");
    const authMod = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js");
    const fsMod = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js");
    const app = appMod.initializeApp(firebaseConfig);
    const auth = authMod.getAuth(app);
    const db = fsMod.getFirestore(app);
    try { await authMod.setPersistence(auth, authMod.browserLocalPersistence); } catch (e) {}
    _firebaseReady = true;
    _authMod = authMod; _fsMod = fsMod; _db = db; _auth = auth;
    window.__fb = { authMod, fsMod, db, auth, app };
    return true;
  } catch (e) {
    console.error("Firebase init error:", e);
    _firebaseReady = false;
    return false;
  }
}

export function attachSigninHandler(btn) {
  if (!btn || btn.dataset.bound === "1") return;
  btn.dataset.bound = "1";
  btn.addEventListener("click", async () => {
    if (!_firebaseReady) {
      const ok = await initFirebase();
      if (!ok) return;
    }
    const user = _auth.currentUser;
    if (user) {
      if (confirm("Wylogować się?")) {
        try { await _authMod.signOut(_auth); } catch (e) {}
      }
      return;
    }
    try {
      const provider = new _authMod.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await _authMod.signInWithPopup(_auth, provider);
    } catch (err) {
      try { await _authMod.signInAnonymously(_auth); } catch (e) {}
    }
  });
}
