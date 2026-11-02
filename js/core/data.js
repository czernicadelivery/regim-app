// ============================================================================
// LOCK IN 2027 — js/core/data.js
// Warstwa danych: Firestore + fallback localStorage.
// Zawiera: dni, migracja, profile, pomiary, rekordy, pytania, suplementy, social.
// ============================================================================

import { dateKey } from "./utils.js";
import { localKey } from "./storage.js";
import { getCurrentUser, isCloud, getFs, setSyncInProgress } from "../firebase.js";

// ============================================================================
// 1. DNI / ZADANIA
// ============================================================================

export async function saveDayDoc(d) {
  localStorage.setItem(localKey(d.date), JSON.stringify(d));
  if (!isCloud()) return;
  const { fsMod, db } = getFs();
  const uid = getCurrentUser().uid;
  setSyncInProgress(true);
  try {
    await fsMod.setDoc(fsMod.doc(db, "users", uid, "days", d.date), d, { merge: true });
  } catch (e) { console.error("saveDayDoc error:", e); }
  finally { setSyncInProgress(false); }
}

export async function loadDayDoc(dateStr) {
  const raw = localStorage.getItem(localKey(dateStr));
  const localDoc = raw ? JSON.parse(raw) : null;
  if (isCloud()) {
    try {
      const { fsMod, db } = getFs();
      const uid = getCurrentUser().uid;
      const snap = await fsMod.getDoc(fsMod.doc(db, "users", uid, "days", dateStr));
      if (snap.exists()) {
        const cloudDoc = snap.data();
        const merged = Object.assign({}, localDoc || {}, cloudDoc);
        localStorage.setItem(localKey(dateStr), JSON.stringify(merged));
        return merged;
      }
    } catch (e) {}
  }
  return localDoc;
}

export async function loadLastNDays(n) {
  const today = new Date();
  const dates = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    dates.push(dateKey(d));
  }
  let cloudDocs = {};
  if (isCloud()) {
    try {
      const { fsMod, db } = getFs();
      const uid = getCurrentUser().uid;
      const start = new Date(today); start.setDate(start.getDate() - (n - 1));
      const q = fsMod.query(
        fsMod.collection(db, "users", uid, "days"),
        fsMod.where("date", ">=", dateKey(start)),
        fsMod.orderBy("date", "asc")
      );
      const snaps = await fsMod.getDocs(q);
      snaps.forEach(s => { cloudDocs[s.id] = s.data(); });
    } catch (e) {}
  }
  const docs = [];
  for (const dk of dates) {
    const raw = localStorage.getItem(localKey(dk));
    const localDoc = raw ? JSON.parse(raw) : null;
    const cloudDoc = cloudDocs[dk];
    const merged = cloudDoc ? Object.assign({}, localDoc || {}, cloudDoc) : localDoc;
    if (merged) docs.push(merged);
  }
  return docs;
}

export async function collectAllDays() {
  const results = {};
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const dk = dateKey(d);
    const raw = localStorage.getItem(localKey(dk));
    if (raw) { try { results[dk] = JSON.parse(raw); } catch (e) {} }
  }
  if (isCloud()) {
    try {
      const { fsMod, db } = getFs();
      const uid = getCurrentUser().uid;
      const snaps = await fsMod.getDocs(fsMod.collection(db, "users", uid, "days"));
      snaps.forEach(s => { results[s.id] = Object.assign({}, results[s.id] || {}, s.data()); });
    } catch (e) {}
  }
  return Object.values(results).sort((a, b) => (a.date || "").localeCompare(b.date || ""));
}

export async function loadDaysRange(n, offset = 0) {
  const today = new Date();
  const promises = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i - offset);
    promises.push(loadDayDoc(dateKey(d)));
  }
  const results = await Promise.all(promises);
  return results.filter(Boolean);
}

let _migrateDone = false;
export async function migrateLocalToCloud() {
  if (_migrateDone || !isCloud()) return;
  _migrateDone = true;
  try {
    const { fsMod, db } = getFs();
    const uid = getCurrentUser().uid;
    const metaRef = fsMod.doc(db, "users", uid, "meta", "migration");
    const metaSnap = await fsMod.getDoc(metaRef);
    if (metaSnap.exists() && metaSnap.data().done) return;
    const localDays = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k.startsWith("regim:local:")) continue;
      const ds = k.slice("regim:local:".length);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(ds)) continue;
      try { const p = JSON.parse(localStorage.getItem(k)); if (p) localDays.push(p); } catch (e) {}
    }
    if (localDays.length === 0) {
      await fsMod.setDoc(metaRef, { done: true, at: Date.now(), count: 0 });
      return;
    }
    for (let i = 0; i < localDays.length; i += 400) {
      const chunk = localDays.slice(i, i + 400);
      const batch = fsMod.writeBatch(db);
      chunk.forEach(day => batch.set(fsMod.doc(db, "users", uid, "days", day.date), day, { merge: true }));
      await batch.commit();
    }
    await fsMod.setDoc(metaRef, { done: true, at: Date.now(), count: localDays.length });
  } catch (e) { console.error("migrateLocalToCloud error:", e); }
}

export function loadCustomTasks() {
  try {
    const raw = localStorage.getItem(localKey("custom-tasks"));
    return raw ? JSON.parse(raw) || [] : [];
  } catch (e) { return []; }
}

export async function saveCustomTasks(tasks) {
  localStorage.setItem(localKey("custom-tasks"), JSON.stringify(tasks));
  if (isCloud()) {
    try {
      const { fsMod, db } = getFs();
      const uid = getCurrentUser().uid;
      await fsMod.setDoc(fsMod.doc(db, "users", uid, "meta", "customTasks"), { tasks, updatedAt: Date.now() }, { merge: true });
    } catch (e) {}
  }
}

export function loadMealPlan(todayK) {
  try {
    const raw = localStorage.getItem(localKey("mealplan-" + todayK));
    if (raw) return Object.assign({ breakfast: [], breakfast2: [], lunch: [], dinner: [], snacks: [] }, JSON.parse(raw));
  } catch (e) {}
  return { breakfast: [], breakfast2: [], lunch: [], dinner: [], snacks: [] };
}

export function saveMealPlan(todayK, plan) {
  localStorage.setItem(localKey("mealplan-" + todayK), JSON.stringify(plan));
}

export function saveAnalysisToHistory(html) {
  try {
    const today = dateKey(new Date());
    const key = localKey("analysis-history");
    const history = JSON.parse(localStorage.getItem(key) || "[]");
    const filtered = history.filter(h => h.date !== today);
    filtered.unshift({ date: today, html, at: Date.now() });
    localStorage.setItem(key, JSON.stringify(filtered.slice(0, 30)));
  } catch (e) {}
}

export function loadAnalysisHistory() {
  try {
    return JSON.parse(localStorage.getItem(localKey("analysis-history")) || "[]");
  } catch (e) { return []; }
}

// ============================================================================
// 2. PROFIL + PUBLICZNY
// ============================================================================

export async function saveProfile(profileData) {
  if (!isCloud()) return;
  const { fsMod, db } = getFs();
  const uid = getCurrentUser().uid;
  const data = { ...profileData, updatedAt: fsMod.serverTimestamp() };
  await fsMod.setDoc(fsMod.doc(db, "users", uid, "profile", "main"), data, { merge: true });
  if (profileData.displayName) {
    await fsMod.setDoc(fsMod.doc(db, "users", uid, "public", "main"), {
      displayName: profileData.displayName,
      shareProfile: false
    }, { merge: true });
  }
}

export async function loadProfile() {
  if (!isCloud()) return null;
  const { fsMod, db } = getFs();
  const uid = getCurrentUser().uid;
  const snap = await fsMod.getDoc(fsMod.doc(db, "users", uid, "profile", "main"));
  return snap.exists() ? snap.data() : null;
}

export async function loadPublicProfile(userId) {
  if (!isCloud()) return null;
  const { fsMod, db } = getFs();
  try {
    const snap = await fsMod.getDoc(fsMod.doc(db, "users", userId, "public", "main"));
    return snap.exists() ? snap.data() : null;
  } catch (e) { return null; }
}

// ============================================================================
// 3. POMIARY
// ============================================================================

export async function addMeasurement(data) {
  if (!isCloud()) return;
  const { fsMod, db } = getFs();
  const uid = getCurrentUser().uid;
  const ref = fsMod.collection(db, "users", uid, "measurements");
  await fsMod.addDoc(ref, { ...data, date: data.date || fsMod.serverTimestamp() });
}

export async function loadMeasurements() {
  if (!isCloud()) return [];
  const { fsMod, db } = getFs();
  const uid = getCurrentUser().uid;
  const q = fsMod.query(
    fsMod.collection(db, "users", uid, "measurements"),
    fsMod.orderBy("date", "desc"), fsMod.limit(100)
  );
  const snap = await fsMod.getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function deleteMeasurement(id) {
  if (!isCloud()) return;
  const { fsMod, db } = getFs();
  const uid = getCurrentUser().uid;
  await fsMod.deleteDoc(fsMod.doc(db, "users", uid, "measurements", id));
}

// ============================================================================
// 4. REKORDY
// ============================================================================

export async function addFitnessRecord(data) {
  if (!isCloud()) return;
  const { fsMod, db } = getFs();
  const uid = getCurrentUser().uid;
  const ref = fsMod.collection(db, "users", uid, "fitnessRecords");
  await fsMod.addDoc(ref, { ...data, date: data.date || fsMod.serverTimestamp() });
}

// ============================================================================
// 5. WŁASNE PYTANIA
// ============================================================================

export async function saveCustomQuestion(questionId, data) {
  if (!isCloud()) return;
  const { fsMod, db } = getFs();
  const uid = getCurrentUser().uid;
  if (questionId) {
    await fsMod.setDoc(fsMod.doc(db, "users", uid, "customQuestions", questionId), data, { merge: true });
  } else {
    await fsMod.addDoc(fsMod.collection(db, "users", uid, "customQuestions"), data);
  }
}

export async function loadCustomQuestions() {
  if (!isCloud()) return [];
  const { fsMod, db } = getFs();
  const uid = getCurrentUser().uid;
  const q = fsMod.query(fsMod.collection(db, "users", uid, "customQuestions"), fsMod.orderBy("order", "asc"));
  const snap = await fsMod.getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ============================================================================
// 6. SUPLEMENTY
// ============================================================================

export async function saveSupplement(id, data) {
  if (!isCloud()) return;
  const { fsMod, db } = getFs();
  const uid = getCurrentUser().uid;
  if (id) {
    await fsMod.setDoc(fsMod.doc(db, "users", uid, "supplements", id), data, { merge: true });
  } else {
    await fsMod.addDoc(fsMod.collection(db, "users", uid, "supplements"), data);
  }
}

export async function loadSupplements() {
  if (!isCloud()) return [];
  const { fsMod, db } = getFs();
  const uid = getCurrentUser().uid;
  const snap = await fsMod.getDocs(fsMod.collection(db, "users", uid, "supplements"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function deleteSupplement(id) {
  if (!isCloud()) return;
  const { fsMod, db } = getFs();
  const uid = getCurrentUser().uid;
  await fsMod.deleteDoc(fsMod.doc(db, "users", uid, "supplements", id));
}

export async function loadSupplementLogs(supplementIds) {
  if (!isCloud() || !supplementIds.length) return {};
  const { fsMod, db } = getFs();
  const uid = getCurrentUser().uid;
  const today = dateKey(new Date());
  const results = {};
  await Promise.all(supplementIds.map(async (sid) => {
    try {
      const snap = await fsMod.getDoc(fsMod.doc(db, "users", uid, "supplementLogs", `${sid}_${today}`));
      results[sid] = snap.exists() ? snap.data().taken : false;
    } catch (e) { results[sid] = false; }
  }));
  return results;
}

export async function logSupplement(supplementId, taken) {
  if (!isCloud()) return;
  const { fsMod, db } = getFs();
  const uid = getCurrentUser().uid;
  const today = dateKey(new Date());
  await fsMod.setDoc(fsMod.doc(db, "users", uid, "supplementLogs", `${supplementId}_${today}`), {
    supplementId, date: today, taken, updatedAt: fsMod.serverTimestamp()
  }, { merge: true });
}

// ============================================================================
// 7. SOCIAL — Zaproszenia, Znajomi
// ============================================================================

export function generateInviteToken() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
}

export function computeFriendshipId(uid1, uid2) {
  return [uid1, uid2].sort().join("_");
}

export async function createInvite() {
  if (!isCloud()) throw new Error("Wymaga logowania");
  const { fsMod, db } = getFs();
  const uid = getCurrentUser().uid;
  const profile = await loadProfile();
  const token = generateInviteToken();
  const now = new Date();
  const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  await fsMod.setDoc(fsMod.doc(db, "invites", token), {
    createdBy: uid,
    createdByName: profile?.displayName || "Użytkownik",
    createdAt: fsMod.serverTimestamp(),
    expiresAt: fsMod.Timestamp.fromDate(expires)
  });
  return { token, expiresAt: expires };
}

export async function redeemInvite(token) {
  if (!isCloud()) throw new Error("Wymaga logowania");
  const { fsMod, db } = getFs();
  const uid = getCurrentUser().uid;
  const invSnap = await fsMod.getDoc(fsMod.doc(db, "invites", token));
  if (!invSnap.exists()) throw new Error("Nieprawidłowy kod zaproszenia");
  const inv = invSnap.data();
  const expiresAt = inv.expiresAt?.toDate ? inv.expiresAt.toDate() : null;
  if (!expiresAt || expiresAt < new Date()) throw new Error("Kod wygasł");
  if (inv.createdBy === uid) throw new Error("Nie możesz dodać samego siebie");

  const profile = await loadProfile();
  await fsMod.addDoc(fsMod.collection(db, "friend_requests"), {
    fromUid: uid,
    toUid: inv.createdBy,
    fromName: profile?.displayName || "Użytkownik",
    status: "pending",
    createdAt: fsMod.serverTimestamp(),
    inviteToken: token
  });

  return { toUid: inv.createdBy, toName: inv.createdByName || "Znajomy" };
}

export async function loadIncomingRequests() {
  if (!isCloud()) return [];
  const { fsMod, db } = getFs();
  const uid = getCurrentUser().uid;
  const q = fsMod.query(
    fsMod.collection(db, "friend_requests"),
    fsMod.where("toUid", "==", uid),
    fsMod.where("status", "==", "pending")
  );
  const snap = await fsMod.getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function loadOutgoingRequests() {
  if (!isCloud()) return [];
  const { fsMod, db } = getFs();
  const uid = getCurrentUser().uid;
  const q = fsMod.query(
    fsMod.collection(db, "friend_requests"),
    fsMod.where("fromUid", "==", uid),
    fsMod.where("status", "==", "pending")
  );
  const snap = await fsMod.getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function acceptFriendRequest(requestId) {
  if (!isCloud()) return;
  const { fsMod, db } = getFs();
  const uid = getCurrentUser().uid;
  const reqRef = fsMod.doc(db, "friend_requests", requestId);
  const reqSnap = await fsMod.getDoc(reqRef);
  if (!reqSnap.exists()) throw new Error("Prośba nie istnieje");
  const req = reqSnap.data();
  if (req.toUid !== uid || req.status !== "pending") throw new Error("Nie możesz zaakceptować");

  await fsMod.updateDoc(reqRef, { status: "accepted", respondedAt: fsMod.serverTimestamp() });

  const profile = await loadProfile();
  const fid = computeFriendshipId(req.fromUid, req.toUid);
  const names = {};
  names[req.fromUid] = req.fromName || "Znajomy";
  names[req.toUid] = profile?.displayName || "Ja";

  await fsMod.setDoc(fsMod.doc(db, "friendships", fid), {
    users: [req.fromUid, req.toUid],
    names,
    requestId,
    createdAt: fsMod.serverTimestamp()
  });
}

export async function rejectFriendRequest(requestId) {
  if (!isCloud()) return;
  const { fsMod, db } = getFs();
  const uid = getCurrentUser().uid;
  await fsMod.updateDoc(fsMod.doc(db, "friend_requests", requestId), {
    status: "rejected",
    respondedAt: fsMod.serverTimestamp()
  });
}

export async function loadFriends() {
  if (!isCloud()) return [];
  const { fsMod, db } = getFs();
  const uid = getCurrentUser().uid;
  const q = fsMod.query(fsMod.collection(db, "friendships"), fsMod.where("users", "array-contains", uid));
  const snap = await fsMod.getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function deleteFriend(friendshipId) {
  if (!isCloud()) return;
  const { fsMod, db } = getFs();
  await fsMod.deleteDoc(fsMod.doc(db, "friendships", friendshipId));
}
