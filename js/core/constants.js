export const USER_NAME_DEFAULT = "Karol";
export const LOCKIN_TARGET = new Date("2027-01-01T00:00:00");
export const LOCKIN_TOTAL_DAYS = 73;

export const TASK_CATEGORIES = [
  { id: "suplementy", icon: "💊", name: "Suplementacja", color: "accent", tasks: [] },
  { id: "trening", icon: "🏋️", name: "Trening", color: "accent", tasks: [] },
  { id: "skincare", icon: "✨", name: "Skincare", color: "info", tasks: [] },
  { id: "mental", icon: "🧠", name: "Mental & Regeneracja", color: "warning", tasks: [] },
  { id: "masa", icon: "🥤", name: "Masa & Białko", color: "danger", tasks: [] },
  { id: "pomiary", icon: "📏", name: "Pomiary", color: "accent", tasks: [] },
  { id: "custom", icon: "⭐", name: "Moje zadania", color: "warning", tasks: [] }
];

export const BASE_CALISTHENICS = [
  { id: "pompki", label: "Pompki klasyczne", series: "3×10-12", muscle: "Klatka", level: "Średni", equipment: "Własne ciało" },
  { id: "pompki-diament", label: "Pompki diamentowe", series: "3×8", muscle: "Triceps", level: "Średni", equipment: "Własne ciało" },
  { id: "pompki-szerokie", label: "Pompki szerokie", series: "3×10", muscle: "Klatka", level: "Średni", equipment: "Własne ciało" },
  { id: "przysiady", label: "Przysiady z pauzą", series: "3×15", muscle: "Nogi", level: "Łatwy", equipment: "Własne ciało" },
  { id: "wykroki", label: "Wykroki chodzone", series: "3×10/noga", muscle: "Nogi", level: "Średni", equipment: "Własne ciało" },
  { id: "wznosy-barki", label: "Wznosy bokiem hantle 1kg", series: "3×20-25", muscle: "Barki", level: "Łatwy", equipment: "Hantle 1kg" },
  { id: "wyciskanie-1kg", label: "Wyciskanie hantli 1kg", series: "3×15", muscle: "Barki", level: "Łatwy", equipment: "Hantle 1kg" },
  { id: "biceps-1kg", label: "Uginanie ramion 1kg", series: "3×15", muscle: "Biceps", level: "Łatwy", equipment: "Hantle 1kg" },
  { id: "wznosy-bioder", label: "Wznosy bioder", series: "3×15", muscle: "Pośladki", level: "Łatwy", equipment: "Własne ciało" },
  { id: "deska", label: "Deska (plank)", series: "3×45s", muscle: "Brzuch", level: "Średni", equipment: "Własne ciało" },
  { id: "unoszenie-nog", label: "Unoszenie nóg leżąc", series: "3×12", muscle: "Brzuch", level: "Średni", equipment: "Własne ciało" }
];

export const LIGHT_CALISTHENICS = [
  { id: "pompki", label: "Pompki klasyczne", series: "2×6", muscle: "Klatka", level: "Łatwy", equipment: "Własne ciało" },
  { id: "przysiady", label: "Przysiady", series: "2×10", muscle: "Nogi", level: "Łatwy", equipment: "Własne ciało" },
  { id: "wznosy-barki", label: "Wznosy bokiem 1kg", series: "2×15", muscle: "Barki", level: "Łatwy", equipment: "Hantle 1kg" },
  { id: "deska", label: "Deska", series: "2×20s", muscle: "Brzuch", level: "Łatwy", equipment: "Własne ciało" },
  { id: "wznosy-bioder", label: "Wznosy bioder", series: "2×10", muscle: "Pośladki", level: "Łatwy", equipment: "Własne ciało" }
];

export const EXERCISES_LIBRARY = {
  klatka: [{ id: "pompki-klasyczne", name: "Pompki klasyczne", muscle: "Klatka piersiowa", level: "Średni", equipment: "Własne ciało", desc: "Dłonie na szerokość barków.", sets: "3", reps: "10-12", rest: 60, tips: "Łokcie pod kątem 45°." }],
  plecy: [{ id: "superman", name: "Superman", muscle: "Plecy", level: "Łatwy", equipment: "Własne ciało", desc: "Leżysz na brzuchu, unosicie ręce i nogi.", sets: "3", reps: "12", rest: 45, tips: "Nie unoś głowy zbyt wysoko." }],
  barki: [{ id: "wznosy-bokiem", name: "Wznosy bokiem", muscle: "Barki", level: "Łatwy", equipment: "Hantle 1kg", desc: "Unoś hantle na boki do linii barków.", sets: "3", reps: "20-25", rest: 45, tips: "Pauza 1s na górze." }],
  biceps: [{ id: "uginnie-hantli", name: "Uginanie ramion", muscle: "Biceps", level: "Łatwy", equipment: "Hantle 1kg", desc: "Uginaj ramiona, łokcie przy tułowiu.", sets: "3", reps: "15", rest: 45, tips: "Powolne opuszczanie." }],
  triceps: [{ id: "pompki-diament-tric", name: "Pompki diamentowe", muscle: "Triceps", level: "Średni", equipment: "Własne ciało", desc: "Dłonie blisko siebie.", sets: "3", reps: "8", rest: 60, tips: "Łokcie blisko tułowia." }],
  brzuch: [{ id: "deska", name: "Deska (plank)", muscle: "Brzuch", level: "Średni", equipment: "Własne ciało", desc: "Podpora na przedramionach.", sets: "3", reps: "45s", rest: 45, tips: "Nie wypinaj bioder." }],
  nogi: [{ id: "przysiady", name: "Przysiady z pauzą", muscle: "Nogi", level: "Łatwy", equipment: "Własne ciało", desc: "Przysiad do kąta 90°.", sets: "3", reps: "15", rest: 60, tips: "Kolana nad stopami." }],
  posladki: [{ id: "wznosy-bioder", name: "Wznosy bioder", muscle: "Pośladki", level: "Łatwy", equipment: "Własne ciało", desc: "Unosisz biodra do góry.", sets: "3", reps: "15", rest: 45, tips: "Pauza 2s na górze." }],
  cardio: [{ id: "pajacyki", name: "Pajacyki", muscle: "Full body", level: "Łatwy", equipment: "Własne ciało", desc: "Wyskok z rozkrokiem.", sets: "3", reps: "30s", rest: 30, tips: "Miarkuj tempo." }],
  fullbody: [{ id: "burpee", name: "Burpee", muscle: "Full body", level: "Trudny", equipment: "Własne ciało", desc: "Przysiad, pompka, wyskok.", sets: "3", reps: "8", rest: 90, tips: "Technika > szybkość." }],
  recovery: [{ id: "spacer", name: "Spacer", muscle: "Regeneracja", level: "Łatwy", equipment: "Brak", desc: "20-30 min spaceru.", sets: "1", reps: "30 min", rest: 0, tips: "Bez pośpiechu." }]
};

export const WORKOUT_PLAN = {
  1: { type: "basen", label: "Basen 1.5h", exercises: [] },
  2: { type: "upper", label: "Góra ciała + brzuch", exercises: ["pompki-klasyczne", "wznosy-bokiem", "deska"] },
  3: { type: "lower", label: "Nogi", exercises: ["przysiady", "wznosy-bioder"] },
  4: { type: "full", label: "Full body", exercises: ["pompki-klasyczne", "przysiady", "deska"] },
  5: { type: "recovery", label: "Regeneracja", exercises: ["spacer"] },
  6: { type: "rest", label: "Odpoczynek", exercises: [] },
  0: { type: "rest", label: "Odpoczynek", exercises: [] }
};

export const BLACK_LIST = [
  { num: "01", title: "VAPE / E-PETY — NIE.", body: "Nie jesteś małą owcą. Palić może każdy frajer. Ty budujesz ciało, twarz i mózg." },
  { num: "02", title: "PORNOGRAFIA", body: "Niszczy dopaminę, motywację i testosteron. Zero tolerancji." },
  { num: "03", title: "ALKOHOL", body: "Piwo = -12% testosteronu. Nie ma opcji. Kropka." }
];

export const RAGE_QUOTES = [
  "WSTAWAJ! Owce śpią, wilki trenują!",
  "Ból jest tymczasowy. Słabość wieczna. Wybieraj.",
  "Nie jesteś zmęczony, jesteś słaby. RUSZ DUPE!"
];

export const GUIDE_SECTIONS = [
  { icon: "🌙", title: "Sen", body: "GH wydziela się w 70% w głębokim śnie. 8-9h = wzrost + masa." },
  { icon: "🍽️", title: "Jedzenie", body: "2800-3000 kcal/dzień, białko ~80g." }
];

export const KNOWLEDGE_BASE = [
  { title: "Hormon wzrostu", body: "Głównie w głębokim śnie. Stymulują: sen 8h+, trening." },
  { title: "Testosteron", body: "Rośnie: sen, trening, witamina D. Spada: stres, alkohol." }
];

export const FACTS = [
  "GH wydziela się w 70% w fazie N3.",
  "Witamina D3 z tłuszczem wchłania się 3× lepiej."
];

export const STORE_MEALS = [
  { name: "Zestaw 1 — Klasyk", items: ["Serek wiejski", "Kabanosy", "Bułka"], kcal: 520, prot: 32 }
];

export const FOOD_INGREDIENTS = {
  pieczywo: [{ name: "Chleb razowy", kcal: 95, prot: 3 }],
  wedliny: [{ name: "Szynka", kcal: 50, prot: 6 }],
  sery: [{ name: "Twaróg", kcal: 130, prot: 18 }],
  jajka: [{ name: "Jajko", kcal: 78, prot: 6 }],
  dodatki: [{ name: "Masło orzechowe", kcal: 95, prot: 3 }],
  przekaski: [{ name: "Orzeszki", kcal: 180, prot: 6 }],
  owoce: [{ name: "Banan", kcal: 105, prot: 1 }],
  napoje: [{ name: "Mleko", kcal: 155, prot: 8 }],
  obiady: [{ name: "Kurczak + ryż", kcal: 700, prot: 45 }]
};

export const FOOD_DB = {
  breakfast: [{ name: "Jajecznica", kcal: 620, prot: 32 }],
  lunch: [{ name: "Spaghetti", kcal: 820, prot: 42 }],
  snack: [{ name: "Twaróg", kcal: 400, prot: 28 }],
  dinner: [{ name: "Omlet", kcal: 480, prot: 28 }],
  shake: [{ name: "Szejk masowy", kcal: 700, prot: 22 }]
};

export const KEYWORDS = {
  sick: ["chory", "gorączka"], alcohol: ["piwo", "wódka"], vape: ["fajki", "vape"],
  stress: ["stres", "egzamin"], happy: ["dobry", "super"], tired: ["zmęczony"],
  lazy: ["leniwy", "nie chciało"], injury: ["kontuzja", "uraz"], girl: ["dziewczyna"],
  school: ["szkoła", "nauka"], game: ["gry", "konsola"], junkfood: ["chipsy", "pizza"]
};
