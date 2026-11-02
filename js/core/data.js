import { dateKey } from "./utils.js";
import { localKey } from "./storage.js";
import { getCurrentUser, isCloud, getFs, setSyncInProgress } from "../firebase.js";

export async function saveDayDoc(d) {
  localStorage.setItem(localKey(d.date), JSON.stringify(d));
  if (!isCloud()) return;
  const { fsMod, db } = getFs();
  const uid = getCurrentUser().uid;
  setSyncInProgress(true);
  try {
    await fsMod.setDoc(fsMod.doc(db, "users", uid, "days", d.date), d, { merge: true });
  } catch (e) {
    console.error("saveDayDoc error:", e);
  } finally {
    setSyncInProgress(false);
  }
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
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(dateKey(d));
  }
  let cloudDocs = {};
  if (isCloud()) {
    try {
      const { fsMod, db } = getFs();
      const uid = getCurrentUser().uid;
      const start = new Date(today);
      start.setDate(start.getDate() - (n - 1));
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
    const d = new Date(today);
    d.setDate(d.getDate() - i);
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
    const d = new Date(today);
    d.setDate(d.getDate() - i - offset);
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
    if (raw) {
      const parsed = JSON.parse(raw);
      return Object.assign({ breakfast: [], breakfast2: [], lunch: [], dinner: [], snacks: [] }, parsed);
    }
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
