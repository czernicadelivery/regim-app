// ============================================================================
// LOCK IN 2027 — js/core/constants.js
// Wszystkie dane statyczne: zadania, ćwiczenia, jedzenie, wiedza, cytaty.
// ============================================================================

export const USER_NAME_DEFAULT = "Karol";
export const LOCKIN_TARGET = new Date("2027-01-01T00:00:00");
export const LOCKIN_TOTAL_DAYS = 73;

// --- KATEGORIE ZADAŃ -------------------------------------------------------
export const TASK_CATEGORIES = [
  { id: "suplementy", icon: "💊", name: "Suplementacja", color: "accent", tasks: [] },
  { id: "trening", icon: "🏋️", name: "Trening", color: "accent", tasks: [] },
  { id: "skincare", icon: "✨", name: "Skincare", color: "info", tasks: [] },
  { id: "mental", icon: "🧠", name: "Mental & Regeneracja", color: "warning", tasks: [] },
  { id: "masa", icon: "🥤", name: "Masa & Białko", color: "danger", tasks: [] },
  { id: "pomiary", icon: "📏", name: "Pomiary", color: "accent", tasks: [] },
  { id: "custom", icon: "⭐", name: "Moje zadania", color: "warning", tasks: [] }
];

// --- ĆWICZENIA (baza) ------------------------------------------------------
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

// --- PEŁNA BIBLIOTEKA ĆWICZEŃ (nowa, F4) -----------------------------------
export const EXERCISES_LIBRARY = {
  klatka: [
    { id: "pompki-klasyczne", name: "Pompki klasyczne", muscle: "Klatka piersiowa", level: "Średni", equipment: "Własne ciało", desc: "Dłonie na szerokość barków, ciało w linii, opuszczaj klatkę do ziemi.", sets: "3", reps: "10-12", rest: 60, tips: "Łokcie pod kątem 45°, nie rozjeżdżaj ich na boki." },
    { id: "pompki-diamentowe", name: "Pompki diamentowe", muscle: "Klatka / Triceps", level: "Średni", equipment: "Własne ciało", desc: "Dłonie blisko siebie, tworząc trójkąt pod klatką.", sets: "3", reps: "8", rest: 60, tips: "Skup się na tricepsie, nie rozchylaj łokci." },
    { id: "pompki-szerokie", name: "Pompki szerokie", muscle: "Klatka piersiowa", level: "Średni", equipment: "Własne ciało", desc: "Dłonie szerzej niż barki, większy zakres ruchu.", sets: "3", reps: "10", rest: 60, tips: "Nie schodź poniżej linii klatki." }
  ],
  plecy: [
    { id: "superman", name: "Superman", muscle: "Plecy / Pośladki", level: "Łatwy", equipment: "Własne ciało", desc: "Leżysz na brzuchu, unosicie jednocześnie ręce i nogi.", sets: "3", reps: "12", rest: 45, tips: "Nie unoś głowy zbyt wysoko." },
    { id: "wioslowanie-gumy", name: "Wiosłowanie gumą", muscle: "Plecy", level: "Średni", equipment: "Guma", desc: "Usiądź, gumę zaczep o stopy, przyciągaj do klatki.", sets: "3", reps: "12", rest: 60, tips: "Ściągnij łopatki." }
  ],
  barki: [
    { id: "wznosy-bokiem", name: "Wznosy bokiem hantle 1kg", muscle: "Barki (boczne)", level: "Łatwy", equipment: "Hantle 1kg", desc: "Stojąc, unoś hantle na boki do linii barków.", sets: "3", reps: "20-25", rest: 45, tips: "Pauza 1s na górze, nie bujaj ciałem." },
    { id: "wyciskanie-hantli", name: "Wyciskanie hantli nad głowę", muscle: "Barki", level: "Łatwy", equipment: "Hantle 1kg", desc: "Stojąc lub siedząc, wyciskaj hantle nad głowę.", sets: "3", reps: "15", rest: 60, tips: "Nie blokuj łokci na górze." }
  ],
  biceps: [
    { id: "uginnie-hantli", name: "Uginanie ramion hantle 1kg", muscle: "Biceps", level: "Łatwy", equipment: "Hantle 1kg", desc: "Stojąc, uginaj ramiona, łokcie przy tułowiu.", sets: "3", reps: "15", rest: 45, tips: "Powolne opuszczanie — 3s w dół." }
  ],
  triceps: [
    { id: "pompki-diament-tric", name: "Pompki diamentowe", muscle: "Triceps", level: "Średni", equipment: "Własne ciało", desc: "Jak wyżej, skupienie na tricepsie.", sets: "3", reps: "8", rest: 60, tips: "Łokcie blisko tułowia." }
  ],
  brzuch: [
    { id: "deska", name: "Deska (plank)", muscle: "Brzuch (core)", level: "Średni", equipment: "Własne ciało", desc: "Podpora na przedramionach, ciało w linii.", sets: "3", reps: "45s", rest: 45, tips: "Nie wypinaj bioder, nie opuszczaj ich." },
    { id: "unoszenie-nog", name: "Unoszenie nóg leżąc", muscle: "Brzuch (dolny)", level: "Średni", equipment: "Własne ciało", desc: "Leżysz, unosicie proste nogi do 90°.", sets: "3", reps: "12", rest: 45, tips: "Nie odrywaj dolnych pleców." },
    { id: "brzuszki", name: "Brzuszki", muscle: "Brzuch", level: "Łatwy", equipment: "Własne ciało", desc: "Klasyczne brzuszki, ręce przy głowie.", sets: "3", reps: "15", rest: 45, tips: "Nie ciągnij głowy rękami." }
  ],
  nogi: [
    { id: "przysiady", name: "Przysiady z pauzą", muscle: "Nogi (czworogłowe, pośladki)", level: "Łatwy", equipment: "Własne ciało", desc: "Przysiad do kąta 90°, pauza 2s, wstań.", sets: "3", reps: "15", rest: 60, tips: "Kolana nad stopami, plecy proste." },
    { id: "wykroki", name: "Wykroki chodzone", muscle: "Nogi / Pośladki", level: "Średni", equipment: "Własne ciało", desc: "Wykrok do przodu, kolano do ziemi, wróć.", sets: "3", reps: "10/noga", rest: 60, tips: "Kolano przednie nie wychodzi za palce." },
    { id: "wspięcia", name: "Wspięcia na palce", muscle: "Łydki", level: "Łatwy", equipment: "Własne ciało", desc: "Stojąc, unosicie się na palcach.", sets: "3", reps: "20", rest: 45, tips: "Pauza 1s na górze." }
  ],
  posladki: [
    { id: "wznosy-bioder", name: "Wznosy bioder", muscle: "Pośladki", level: "Łatwy", equipment: "Własne ciało", desc: "Leżysz, unosicie biodra do góry, ściskasz pośladki.", sets: "3", reps: "15", rest: 45, tips: "Pauza 2s na górze." },
    { id: "przysiad-bulgarski", name: "Przysiad bułgarski", muscle: "Pośladki / Nogi", level: "Trudny", equipment: "Krzesło", desc: "Tylna noga na krześle, przysiad na przedniej nodze.", sets: "3", reps: "8/noga", rest: 90, tips: "Ciężar na przedniej nodze." }
  ],
  cardio: [
    { id: "pajacyki", name: "Pajacyki", muscle: "Full body", level: "Łatwy", equipment: "Własne ciało", desc: "Wyskok z rozkrokiem i uniesieniem rąk.", sets: "3", reps: "30s", rest: 30, tips: "Miarkuj tempo, oddychaj." },
    { id: "high-knees", name: "High knees", muscle: "Nogi / Cardio", level: "Średni", equipment: "Własne ciało", desc: "Bieg w miejscu z wysokim unoszeniem kolan.", sets: "3", reps: "30s", rest: 30, tips: "Szybkie tempo, ramiona pracują." }
  ],
  fullbody: [
    { id: "burpee", name: "Burpee", muscle: "Full body", level: "Trudny", equipment: "Własne ciało", desc: "Przysiad, pompka, wyskok.", sets: "3", reps: "8", rest: 90, tips: "Umiarkowane tempo, technika > szybkość." }
  ],
  recovery: [
    { id: "spacer", name: "Spacer", muscle: "Regeneracja", level: "Łatwy", equipment: "Brak", desc: "20-30 min spaceru na świeżym powietrzu.", sets: "1", reps: "20-30 min", rest: 0, tips: "Bez pośpiechu, oddech nosem." },
    { id: "oddech478", name: "Oddech 4-7-8", muscle: "Regeneracja", level: "Łatwy", equipment: "Brak", desc: "Wdech 4s, pauza 7s, wydech 8s. 5 min.", sets: "1", reps: "5 min", rest: 0, tips: "Skup się na wydechu." },
    { id: "stretching", name: "Stretching", muscle: "Regeneracja", level: "Łatwy", equipment: "Brak", desc: "Rozciąganie całego ciała 10 min.", sets: "1", reps: "10 min", rest: 0, tips: "Bez bólu, do granicy komfortu." }
  ]
};

// --- PLAN TYGODNIOWY ------------------------------------------------------
export const WORKOUT_PLAN = {
  1: { type: "basen", label: "Basen 1.5h", exercises: [], note: "Basen — regeneracja + cardio" },
  2: { type: "upper", label: "Góra ciała + brzuch", exercises: ["pompki-klasyczne", "pompki-diamentowe", "wznosy-bokiem", "uginnie-hantli", "deska", "unoszenie-nog"] },
  3: { type: "lower", label: "Nogi", exercises: ["przysiady", "wykroki", "wznosy-bioder", "wspięcia"] },
  4: { type: "full", label: "Full body", exercises: ["pompki-klasyczne", "przysiady", "wykroki", "wznosy-bokiem", "deska"] },
  5: { type: "recovery", label: "Regeneracja", exercises: ["spacer", "oddech478", "stretching"] },
  6: { type: "rest", label: "Odpoczynek", exercises: [] },
  0: { type: "rest", label: "Odpoczynek", exercises: [] }
};

// --- CZARNA LISTA ---------------------------------------------------------
export const BLACK_LIST = [
  { num: "01", title: "VAPE / E-PETY — NIE.", body: "Nie jesteś małą owcą. Palić może każdy frajer. Ty budujesz ciało, twarz i mózg." },
  { num: "02", title: "PORNOGRAFIA", body: "Niszczy dopaminę, motywację i testosteron. Zero tolerancji." },
  { num: "03", title: "ALKOHOL", body: "Piwo = -12% testosteronu. Nie ma opcji. Kropka." },
  { num: "04", title: "SŁODKIE NAPOJE", body: "Cola = 40g cukru = trądzik + tłuszcz. Woda, mleko, kawa." },
  { num: "05", title: "NIEBIESKIE ŚWIATŁO", body: "Telefon 1h przed snem = kasacja melatoniny. OFF i do łóżka." },
  { num: "06", title: "LENISTWO / GRY NON-STOP", body: "Konsola i TikTok kradną czas. Najpierw trening, potem rozrywka." },
  { num: "07", title: "BRAK POSTAWY", body: "Garb = -2 cm wizualnie. Postawa = darmowy wzrost." }
];

// --- CYTATY RAGE ----------------------------------------------------------
export const RAGE_QUOTES = [
  "WSTAWAJ! Owce śpią, wilki trenują!",
  "Ból jest tymczasowy. Słabość wieczna. Wybieraj.",
  "Nie jesteś zmęczony, jesteś słaby. RUSZ DUPE!",
  "73 dni. Potem albo nowy człowiek, albo stary tchórz.",
  "Chcesz być przeciętny? Przeciętni mają przeciętne ciała.",
  "Nikt za ciebie nie zbuduje tego ciała. NIKT.",
  "Ostatni raz kiedy byłeś tak silny? Nigdy. Idziemy dalej.",
  "Nie czekaj na motywację. Rusz dupe, motywacja przyjdzie w trakcie."
];

// --- GUIDE / BAZA WIEDZY / FACTS ------------------------------------------
export const GUIDE_SECTIONS = [
  { icon: "🌙", title: "Sen", body: "GH wydziela się w 70% w głębokim śnie. Spać przed 22:30, telefon off 1h wcześniej. 8-9h = wzrost + masa." },
  { icon: "🍽️", title: "Jedzenie", body: "2800-3000 kcal/dzień, białko ~80g. Szejk masowy 700 kcal po szkole. Twaróg przed snem." },
  { icon: "💪", title: "Trening", body: "Pompki tempo 3s, przysiady z pauzą, wznosy bokiem 20-25 powtórzeń. Progresja > intensywność." },
  { icon: "✨", title: "Skincare", body: "Zimna woda rano i wieczorem, krem nawilżający. Delikatnie, bez przesady." },
  { icon: "🧠", title: "Mental", body: "Oddech 4-7-8 (wdech 4s, pauza 7s, wydech 8s) 5 min dziennie. Stres obniża testosteron." },
  { icon: "💊", title: "Suplementacja", body: "D3 max 4000 IU dla nastolatka. Kreatyna 3-5g. Z tłuszczem." }
];

export const KNOWLEDGE_BASE = [
  { title: "Hormon wzrostu (GH)", body: "Głównie w głębokim śnie. Stymulują: sen 8h+, trening siłowy, post. Hamują: cukier, alkohol, stres." },
  { title: "Testosteron", body: "Rośnie: sen 7-9h, trening siłowy, tłuszcze zwierzęce, witamina D. Spada: stres, alkohol, brak snu." },
  { title: "Białko", body: "1.7g/kg = ~77-80g. 4-5 posiłków po 25-40g. Twaróg przed snem = kazeina." },
  { title: "Hantle 1kg", body: "Wznosy bokiem 20-25 powtórzeń z pauzą 1s na górze = szerokość barków." },
  { title: "Zimna woda", body: "Rano: obrzęk, czerwony nos. Wieczorem: zamyka pory. 30 sekund, delikatnie osusz." },
  { title: "Witamina D3", body: "Max 4000 IU dla nastolatka. Z tłuszczem. Twój stack: 4000 IU (2 tabl. × 2000)." },
  { title: "Kreatyna", body: "3-5g dziennie. Zwiększa siłę, masę, uwodnienie mięśni. Wymaga 2.5-3L wody." }
];

export const FACTS = [
  "GH wydziela się w 70% w fazie N3.",
  "Witamina D3 z tłuszczem wchłania się 3× lepiej.",
  "Wznosy bokiem hantlami 1kg 20-25 powtórzeń = szerokość barków.",
  "Burnout set = pobudzenie włókien typu II.",
  "16-17 lat to szczyt skoku wzrostowego.",
  "Białko 4-5 posiłków = lepsza synteza.",
  "Dobra postawa dodaje 1-2 cm wizualnie.",
  "Zimna woda rano redukuje obrzęk twarzy."
];

// --- JEDZENIE ------------------------------------------------------------
export const STORE_MEALS = [
  { name: "Zestaw 1 — Klasyk Masowy", items: ["Serek wiejski 200g", "Kabanosy 2 szt", "Bułka grahamka"], kcal: 520, prot: 32 },
  { name: "Zestaw 2 — Słodki Boost", items: ["Pudding Ehrmann Protein", "Rogalik maślany", "Banan"], kcal: 505, prot: 22 },
  { name: "Zestaw 3 — Protein Beast", items: ["Skyr 150g", "Garść orzechów włoskich", "Pieczywo chrupkie 2 szt"], kcal: 420, prot: 26 }
];

export const FOOD_INGREDIENTS = {
  pieczywo: [
    { name: "Chleb razowy (kromka 40g)", kcal: 95, prot: 3 },
    { name: "Chleb pszenny (kromka 40g)", kcal: 110, prot: 3 },
    { name: "Bułka kajzerka", kcal: 145, prot: 5 },
    { name: "Bułka grahamka", kcal: 160, prot: 6 },
    { name: "Rogalik maślany", kcal: 220, prot: 4 },
    { name: "Pieczywo chrupkie (2 szt)", kcal: 70, prot: 2 }
  ],
  wedliny: [
    { name: "Szynka wiejska (2 plastry)", kcal: 50, prot: 6 },
    { name: "Kiełbasa śląska (2 plastry)", kcal: 90, prot: 5 },
    { name: "Kabanosy (2 szt)", kcal: 160, prot: 10 },
    { name: "Salami (3 plastry)", kcal: 100, prot: 5 },
    { name: "Polędwica sopocka (3 plastry)", kcal: 45, prot: 6 }
  ],
  sery: [
    { name: "Ser żółty gouda (2 plastry)", kcal: 110, prot: 7 },
    { name: "Twaróg półtłusty (100g)", kcal: 130, prot: 18 },
    { name: "Serek wiejski 200g", kcal: 160, prot: 20 },
    { name: "Mozzarella (50g)", kcal: 120, prot: 8 },
    { name: "Skyr 150g", kcal: 90, prot: 17 }
  ],
  jajka: [
    { name: "Jajko gotowane (1)", kcal: 78, prot: 6 },
    { name: "Jajecznica z 2 jaj", kcal: 180, prot: 13 },
    { name: "Omlet z 3 jaj", kcal: 260, prot: 19 }
  ],
  dodatki: [
    { name: "Masło (10g)", kcal: 75, prot: 0 },
    { name: "Masło orzechowe (1 łyżka)", kcal: 95, prot: 3 },
    { name: "Miód (1 łyżka)", kcal: 65, prot: 0 },
    { name: "Płatki owsiane (40g)", kcal: 150, prot: 5 },
    { name: "Awokado (½)", kcal: 130, prot: 2 }
  ],
  przekaski: [
    { name: "Lays zielona cebulka (mała)", kcal: 160, prot: 2 },
    { name: "Snickers (50g)", kcal: 245, prot: 4 },
    { name: "Orzeszki solone (garść 30g)", kcal: 180, prot: 6 }
  ],
  owoce: [
    { name: "Banan (1)", kcal: 
