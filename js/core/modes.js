// ============================================================================
// LOCK IN 2027 — js/core/modes.js
// 8 niezależnych trybów + task templates per mode. Bez hardkodowania zadań.
// ============================================================================

export const MODES = [
  { id: "balanced",        icon: "⚖️",  label: "Balanced",        desc: "Zdrowy styl życia, sen, regularność" },
  { id: "fitness",         icon: "🏋️", label: "Fitness",         desc: "Trening, siła, kondycja" },
  { id: "weight-loss",     icon: "🔥",  label: "Weight Loss",     desc: "Zdrowe chudnięcie, bez skrajności" },
  { id: "muscle-building", icon: "💪",  label: "Muscle Building", desc: "Budowa masy i siły" },
  { id: "self-care",       icon: "✨",  label: "Self Care",       desc: "Skincare, higiena, rutyny" },
  { id: "looksmaxxing",    icon: "👁️",  label: "Looksmaxxing",    desc: "Wygląd, styl, postura" },
  { id: "ascend",          icon: "🔺",  label: "Ascend",          desc: "Intensywny profil rozwoju" },
  { id: "focus",           icon: "🧠",  label: "Focus & Study",   desc: "Nauka, koncentracja, Pomodoro" }
];

export function getMode(id) {
  return MODES.find(m => m.id === id);
}

export function hasMode(id) {
  const profile = (typeof window !== "undefined" && window.__state) ? window.__state.profile : null;
  return profile && Array.isArray(profile.modes) && profile.modes.includes(id);
}

// Task templates per mode — id musi być unikalne w obrębie całej aplikacji (dedupe)
export const MODE_TASK_TEMPLATES = {
  "balanced": [
    { id: "sleep-8h",   label: "Sen 8h+",           hint: "Kluczowy dla regeneracji", category: "health" },
    { id: "hydration",  label: "Nawodnienie 2L",     hint: "Woda przez cały dzień",    category: "nutrition" },
    { id: "walk-20",    label: "Spacer 20 min",      hint: "Ruch na powietrzu",        category: "health" }
  ],
  "fitness": [
    { id: "workout",    label: "Trening",            hint: "Zgodnie z planem",         category: "training" },
    { id: "stretch-10", label: "Rozciąganie 10 min", hint: "Po treningu lub wieczorem",category: "mobility" }
  ],
  "weight-loss": [
    { id: "steps-8k",   label: "Kroki 8k+",          hint: "Aktywność w ciągu dnia",   category: "health" },
    { id: "meals-log",  label: "Zapis posiłków",     hint: "Świadome jedzenie",        category: "nutrition" },
    { id: "no-sugar",   label: "Bez cukru po 18:00", hint: "Kontrola insuliny",        category: "nutrition" }
  ],
  "muscle-building": [
    { id: "workout",    label: "Trening siłowy",     hint: "Progresja obciążeń",       category: "training" },
    { id: "protein-4x", label: "Białko w 4 posiłkach",hint: "Rozłóż na dzień",         category: "nutrition" },
    { id: "sleep-8h",   label: "Sen 8h+",            hint: "Wzrost = regeneracja",     category: "health" }
  ],
  "self-care": [
    { id: "am-routine", label: "Rutyna poranna",     hint: "Oczyszczanie + krem + SPF",category: "skincare" },
    { id: "pm-routine", label: "Rutyna wieczorna",   hint: "Oczyszczanie + serum",     category: "skincare" },
    { id: "teeth-2x",   label: "Mycie zębów 2×",     hint: "Rano i wieczorem",         category: "hygiene" },
    { id: "shower",     label: "Prysznic",           hint: "Codzienna higiena",        category: "hygiene" }
  ],
  "looksmaxxing": [
    { id: "am-routine", label: "Rutyna poranna",     hint: "Skincare + stylizacja",    category: "skincare" },
    { id: "pm-routine", label: "Rutyna wieczorna",   hint: "Skincare + regeneracja",   category: "skincare" },
    { id: "posture-10", label: "Postawa 10 min",     hint: "Ćwiczenia korekcyjne",     category: "mobility" },
    { id: "grooming",   label: "Grooming",           hint: "Broda, włosy, paznokcie",  category: "hygiene" }
  ],
  "ascend": [
    { id: "workout",    label: "Trening",            hint: "Intensywny trening",       category: "training" },
    { id: "am-routine", label: "Rutyna poranna",     hint: "Pełna rutyna AM",          category: "skincare" },
    { id: "pm-routine", label: "Rutyna wieczorna",   hint: "Pełna rutyna PM",          category: "skincare" },
    { id: "posture-10", label: "Postawa i mobilność",hint: "Mewing + stretching",      category: "mobility" },
    { id: "grooming",   label: "Grooming",           hint: "Broda, włosy",             category: "hygiene" }
  ],
  "focus": [
    { id: "pomodoro-1", label: "Pomodoro 25 min",    hint: "Jedna sesja skupienia",    category: "focus" },
    { id: "study-60",   label: "Nauka 60 min",       hint: "Bez rozpraszaczy",         category: "study" }
  ]
};

// Mapowanie kategorii → icon + nazwa wyświetlana
export const CATEGORY_META = {
  training:  { icon: "🏋️", name: "Trening",       order: 10 },
  skincare:  { icon: "✨", name: "Skincare",       order: 20 },
  hygiene:   { icon: "🧼", name: "Higiena",        order: 30 },
  nutrition: { icon: "🍽️", name: "Odżywianie",     order: 40 },
  health:    { icon: "❤️", name: "Zdrowie",        order: 50 },
  mobility:  { icon: "🧘", name: "Mobility",       order: 60 },
  focus:     { icon: "🧠", name: "Focus",          order: 70 },
  study:     { icon: "📚", name: "Nauka",          order: 80 },
  supplements: { icon: "💊", name: "Suplementy",   order: 90 },
  custom:    { icon: "⭐", name: "Moje zadania",   order: 999 }
};

// Zbiera unikalne zadania z listy modów (dedupe by id)
export function getTasksFromModes(modes) {
  const map = new Map();
  (modes || []).forEach(modeId => {
    const templates = MODE_TASK_TEMPLATES[modeId] || [];
    templates.forEach(t => {
      if (!map.has(t.id)) map.set(t.id, { ...t, done: false });
    });
  });
  return Array.from(map.values());
}

// Buduje strukturę kategorii z listy zadań (dla renderowania jak dotąd)
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
