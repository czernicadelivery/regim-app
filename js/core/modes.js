// ============================================================================
// LOCK IN 2027 — js/core/modes.js
// 6 kategorii wyboru. Każda ma ikonę, opis i zadania z kategoriami.
// Deduplikacja po ID zadania (np. sleep-8h wspólne dla kilku trybów).
// ============================================================================

export const MODES = [
  {
    id: "weight-loss",
    icon: "🔥",
    name: "Schudnięcie",
    desc: "Zdrowe chudnięcie — bez głodzenia",
    tasks: [
      { id: "train-cardio",    label: "Cardio 20 min",         hint: "Spacer, rower, bieg",     category: "training" },
      { id: "meal-log",        label: "Zapis posiłków",         hint: "Świadome jedzenie",       category: "nutrition" },
      { id: "steps-8k",        label: "Kroki 8k+",              hint: "Aktywność w ciągu dnia",  category: "health" },
      { id: "water-2l",        label: "Woda 2L",                hint: "Nawodnienie",             category: "health" }
    ]
  },
  {
    id: "gain-weight",
    icon: "📈",
    name: "Przytycie",
    desc: "Zdrowe przybieranie masy",
    tasks: [
      { id: "train-strength",  label: "Trening siłowy",         hint: "Progresja",               category: "training" },
      { id: "protein-4x",      label: "Białko w 4 posiłkach",   hint: "Równomiernie w ciągu dnia", category: "nutrition" },
      { id: "calorie-surplus", label: "Surplus kaloryczny",     hint: "+300–500 kcal",           category: "nutrition" },
      { id: "sleep-8h",        label: "Sen 8h+",                hint: "Wzrost w spoczynku",      category: "health" }
    ]
  },
  {
    id: "muscle",
    icon: "💪",
    name: "Mięśnie",
    desc: "Budowa masy i siły",
    tasks: [
      { id: "train-strength",  label: "Trening siłowy",         hint: "Progresja obciążeń",      category: "training" },
      { id: "protein-4x",      label: "Białko w 4 posiłkach",   hint: "Min. 1.6g/kg",            category: "nutrition" },
      { id: "sleep-8h",        label: "Sen 8h+",                hint: "Wzrost w spoczynku",      category: "health" }
    ]
  },
  {
    id: "looksmaxxing",
    icon: "👁️",
    name: "Looksmaxxing",
    desc: "Wygląd, styl, postura",
    tasks: [
      { id: "skincare-am",     label: "Rutyna poranna",         hint: "Oczyszczanie + krem + SPF", category: "skincare" },
      { id: "skincare-pm",     label: "Rutyna wieczorna",       hint: "Oczyszczanie + serum",    category: "skincare" },
      { id: "teeth-2x",        label: "Mycie zębów 2×",         hint: "Rano i wieczorem",        category: "hygiene" },
      { id: "posture-10",      label: "Postura 10 min",         hint: "Ćwiczenia korekcyjne",    category: "mobility" },
      { id: "grooming",        label: "Grooming",               hint: "Broda, włosy, paznokcie", category: "hygiene" }
    ]
  },
  {
    id: "all",
    icon: "⚡",
    name: "Wszystko",
    desc: "Pełny rozwój — trening, zdrowie, wygląd",
    tasks: [
      { id: "train-strength",  label: "Trening",                hint: "Siłowy lub cardio",       category: "training" },
      { id: "sleep-8h",        label: "Sen 8h+",                hint: "Fundament",               category: "health" },
      { id: "skincare-am",     label: "Rutyna poranna",         hint: "Podstawowa pielęgnacja",  category: "skincare" },
      { id: "water-2l",        label: "Woda 2L",                hint: "Nawodnienie",             category: "health" },
      { id: "focus-25",        label: "Focus 25 min",           hint: "Nauka / praca",           category: "focus" }
    ]
  },
  {
    id: "health",
    icon: "❤️",
    name: "Zdrowie",
    desc: "Sen, ruch, regeneracja",
    tasks: [
      { id: "sleep-8h",        label: "Sen 8h+",                hint: "Regeneracja",             category: "health" },
      { id: "water-2l",        label: "Woda 2L",                hint: "Nawodnienie",             category: "health" },
      { id: "walk-20",         label: "Spacer 20 min",          hint: "Ruch na powietrzu",       category: "health" },
      { id: "stretch-10",      label: "Stretching 10 min",      hint: "Elastyczność",            category: "mobility" }
    ]
  }
];

export const CATEGORY_META = {
  training:  { icon: "🏋️", name: "Trening",     order: 10 },
  nutrition: { icon: "🍽️", name: "Odżywianie",   order: 20 },
  health:    { icon: "❤️", name: "Zdrowie",      order: 30 },
  skincare:  { icon: "✨", name: "Skincare",     order: 40 },
  hygiene:   { icon: "🧼", name: "Higiena",      order: 50 },
  mobility:  { icon: "🧘", name: "Mobility",     order: 60 },
  focus:     { icon: "🧠", name: "Focus",        order: 70 },
  study:     { icon: "📚", name: "Nauka",        order: 80 },
  supplements: { icon: "💊", name: "Suplementy", order: 90 },
  custom:    { icon: "⭐", name: "Moje zadania", order: 999 }
};

export function getModeById(id) {
  return MODES.find(m => m.id === id);
}

// Zbiera unikalne zadania z wybranych trybów (dedupe po ID)
export function getTasksFromModes(modeIds) {
  const map = new Map();
  (modeIds || []).forEach(id => {
    const mode = MODES.find(m => m.id === id);
    if (!mode) return;
    mode.tasks.forEach(t => {
      if (!map.has(t.id)) map.set(t.id, { ...t, done: false });
    });
  });
  return Array.from(map.values());
}

// Zwraca listę unikalnych kategorii z wybranych trybów
export function getCategoriesFromModes(modeIds) {
  const set = new Set();
  (modeIds || []).forEach(id => {
    const mode = MODES.find(m => m.id === id);
    if (!mode) return;
    mode.tasks.forEach(t => set.add(t.category));
  });
  return Array.from(set);
}

// Buduje strukturę kategorii z listy zadań (dla renderowania)
export function buildCategoriesFromTasks(tasks) {
  const byCategory = new Map();
  tasks.forEach(t => {
    const cat = t.category || "custom";
    if (!byCategory.has(cat)) {
      const meta = CATEGORY_META[cat] || { icon: "📋", name: cat, order: 500 };
      byCategory.set(cat, { id: cat, icon: meta.icon, name: meta.name, order: meta.order, tasks: [] });
    }
    byCategory.get(cat).tasks.push(t);
  });
  return Array.from(byCategory.values()).sort((a, b) => a.order - b.order);
}
