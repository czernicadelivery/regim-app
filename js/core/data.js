import { getFs, getCurrentUser, isCloud } from "../firebase.js";

// --- POMOCNICZE DLA PROFILU ---

export async function saveProfile(profileData) {
  if (!isCloud()) return;
  const { fsMod, db } = getFs();
  const uid = getCurrentUser().uid;
  const data = {
    ...profileData,
    updatedAt: fsMod.serverTimestamp()
  };
  await fsMod.setDoc(fsMod.doc(db, "users", uid, "profile", "main"), data, { merge: true });
}

export async function loadProfile() {
  if (!isCloud()) return null;
  const { fsMod, db } = getFs();
  const uid = getCurrentUser().uid;
  const snap = await fsMod.getDoc(fsMod.doc(db, "users", uid, "profile", "main"));
  return snap.exists() ? snap.data() : null;
}

// --- POMIARY (Measurements) ---

export async function addMeasurement(data) {
  if (!isCloud()) return;
  const { fsMod, db } = getFs();
  const uid = getCurrentUser().uid;
  const ref = fsMod.collection(db, "users", uid, "measurements");
  await fsMod.addDoc(ref, {
    ...data,
    date: data.date || fsMod.serverTimestamp()
  });
}

export async function loadMeasurements() {
  if (!isCloud()) return [];
  const { fsMod, db } = getFs();
  const uid = getCurrentUser().uid;
  const q = fsMod.query(
    fsMod.collection(db, "users", uid, "measurements"),
    fsMod.orderBy("date", "desc"),
    fsMod.limit(100)
  );
  const snap = await fsMod.getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// --- REKORDY SPORTOWE (Fitness Records) ---

export async function addFitnessRecord(data) {
  if (!isCloud()) return;
  const { fsMod, db } = getFs();
  const uid = getCurrentUser().uid;
  const ref = fsMod.collection(db, "users", uid, "fitnessRecords");
  await fsMod.addDoc(ref, {
    ...data,
    date: data.date || fsMod.serverTimestamp()
  });
}

// --- WŁASNE PYTANIA (Custom Questions) ---

export async function saveCustomQuestion(questionId, data) {
  if (!isCloud()) return;
  const { fsMod, db } = getFs();
  const uid = getCurrentUser().uid;
  if (questionId) {
    await fsMod.setDoc(fsMod.doc(db, "users", uid, "customQuestions", questionId), data, { merge: true });
  } else {
    const ref = fsMod.collection(db, "users", uid, "customQuestions");
    await fsMod.addDoc(ref, data);
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

// --- SUPLEMENTY (Supplements) ---

export async function saveSupplement(id, data) {
  if (!isCloud()) return;
  const { fsMod, db } = getFs();
  const uid = getCurrentUser().uid;
  if (id) {
    await fsMod.setDoc(fsMod.doc(db, "users", uid, "supplements", id), data, { merge: true });
  } else {
    const ref = fsMod.collection(db, "users", uid, "supplements");
    await fsMod.addDoc(ref, data);
  }
}

export async function logSupplement(supplementId, taken) {
  if (!isCloud()) return;
  const { fsMod, db } = getFs();
  const uid = getCurrentUser().uid;
  const today = new Date().toISOString().split("T")[0]; 
  // Zapisujemy log z datą dnia (YYYY-MM-DD) jako ID, żeby uniknąć duplikatów
  const docId = `${supplementId}_${today}`;
  await fsMod.setDoc(fsMod.doc(db, "users", uid, "supplementLogs", docId), {
    supplementId,
    date: today,
    taken,
    updatedAt: fsMod.serverTimestamp()
  }, { merge: true });
}
