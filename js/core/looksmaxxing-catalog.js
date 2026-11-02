// ============================================================================
// LOCK IN 2027 — js/core/looksmaxxing-catalog.js
// Katalog trendów wyglądu + kategorie. Niebezpieczne trendy = OSTRZEŻENIE.
// Bez instrukcji wykonywania ryzykownych procedur.
// ============================================================================

export const LOOKS_CATEGORIES = [
  { id: "face",     icon: "👁️", name: "Twarz" },
  { id: "skincare", icon: "✨", name: "Skincare" },
  { id: "hair",     icon: "💇", name: "Włosy" },
  { id: "grooming", icon: "🧼", name: "Grooming" },
  { id: "teeth",    icon: "🦷", name: "Zęby" },
  { id: "posture",  icon: "🧘", name: "Postawa" },
  { id: "style",    icon: "👔", name: "Styl" },
  { id: "body",     icon: "💪", name: "Sylwetka" }
];

export const TREND_LEVELS = {
  verified:    { label: "Potwierdzone",       color: "var(--success)",       icon: "✅" },
  promising:   { label: "Obiecujące",         color: "var(--info)",          icon: "🔬" },
  limited:     { label: "Ograniczone dowody", color: "var(--warning)",       icon: "🟡" },
  unclear:     { label: "Niejasne",           color: "var(--text-tertiary)", icon: "❓" },
  unsupported: { label: "Bez potwierdzenia",  color: "var(--danger)",        icon: "❌" },
  dangerous:   { label: "NIEBEZPIECZNE",      color: "var(--danger)",        icon: "🚨" }
};

// Katalog trendów — edukacyjny, BEZ instrukcji ryzykownych metod
export const TRENDS_CATALOG = [
  // --- POTWIERDZONE / BEZPIECZNE ---
  {
    id: "mewing",
    category: "face",
    name: "Mewing (prawidłowa pozycja języka)",
    level: "limited",
    what: "Utrzymywanie języka na podniebieniu, usta zamknięte, oddychanie przez nos.",
    claim: "Może poprawić napięcie mięśni twarzy i postawę głowy. Brak mocnych dowodów na trwałą zmianę struktury kości u dorosłych.",
    risk: "Niskie. Jeśli powoduje ból szczęki lub zgrzytanie — przerwij.",
    safer: "Prawidłowa higiena nosa, oddychanie przez nos, dobra postawa głowy.",
    evidence: "Umiarkowane w logopedii (pozycja spoczynkowa języka), słabe dla zmian wyglądu u dorosłych."
  },
  {
    id: "posture-training",
    category: "posture",
    name: "Trening postawy",
    level: "verified",
    what: "Ćwiczenia wzmacniające mięśnie grzbietu, karku i core. Ćwiczenia antagonistyczne.",
    claim: "Poprawia sylwetkę, redukuje ból pleców. Ma potwierdzone działanie fizjoterapeutyczne.",
    risk: "Niskie przy prawidłowej technice. Konsultacja przy istniejących schorzeniach kręgosłupa.",
    safer: "Zacznij od ćwiczeń izometrycznych. Rozciąganie + wzmacnianie.",
    evidence: "Silne — potwierdzone w fizjoterapii."
  },
  {
    id: "sun-protection",
    category: "skincare",
    name: "Ochrona przeciwsłoneczna (SPF)",
    level: "verified",
    what: "Codzienne stosowanie SPF 30+ na odsłonięte partie skóry.",
    claim: "Najskuteczniejsza profilaktyka anti-aging. Chroni przed fotostarzeniem, przebarwieniami, rakiem skóry.",
    risk: "Brak. Unikaj tylko alergenów w filtrach chemicznych (test na małym fragmencie).",
    safer: "Filtry mineralne (tlenek cynku, dwutlenek tytanu) dla skóry wrażliwej.",
    evidence: "Silne — potwierdzone dermatologicznie."
  },
  {
    id: "retinoids-skincare",
    category: "skincare",
    name: "Retinoidy (retinol, retinal)",
    level: "verified",
    what: "Pochodne witaminy A w kosmetykach. Przyspieszają odnowę komórkową.",
    claim: "Redukują zmarszczki, poprawiają koloryt, działają przeciwtrądzikowo.",
    risk: "Podrażnienia przy zbyt szybkim wprowadzaniu. Zawsze SPF (skóra wrażliwsza na słońce). Retinol NIE jest tym samym co tretynoina (ta jest na receptę).",
    safer: "Zacznij od 0.2-0.3% retinolu, 2x w tygodniu. Buduj tolerancję.",
    evidence: "Silne — potwierdzone dermatologicznie."
  },
  {
    id: "niacinamide",
    category: "skincare",
    name: "Niacynamid (witamina B3)",
    level: "verified",
    what: "Reguluje sebum, rozjaśnia przebarwienia, wzmacnia barierę skórną.",
    claim: "Bezpieczny składnik dla większości typów skóry. Wspiera leczenie trądziku.",
    risk: "Może podrażniać przy 10%+ stężeniu. Zaczynaj od 2-5%.",
    safer: "2-5% to złoty środek dla większości.",
    evidence: "Silne — potwierdzone dermatologicznie."
  },
  {
    id: "teeth-brushing",
    category: "teeth",
    name: "Prawidłowa higiena jamy ustnej",
    level: "verified",
    what: "Mycie zębów 2x dziennie (2 min), nitkowanie, regularne wizyty u dentysty.",
    claim: "Zapobiega próchnicy, chorobom dziąseł, poprawia wygląd uśmiechu.",
    risk: "Brak.",
    safer: "Miękka szczoteczka, pasta z fluorem.",
    evidence: "Silne — potwierdzone stomatologicznie."
  },
  {
    id: "grooming-basics",
    category: "grooming",
    name: "Podstawowy grooming",
    level: "verified",
    what: "Regularne golenie/strzyżenie, pielęgnacja skóry, czyste paznokcie.",
    claim: "Poprawia wrażenie zadbanego wyglądu.",
    risk: "Brak. Uważaj tylko na podrażnienia po goleniu.",
    safer: "Żel do golenia, krem po goleniu bez alkoholu.",
    evidence: "Oczywiste dla percepcji wyglądu."
  },

  // --- OGRANICZONE / NIEJASNE ---
  {
    id: "jawline-exercise",
    category: "face",
    name: "Ćwiczenia linii żuchwy",
    level: "limited",
    what: "Różne ćwiczenia mięśni twarzy i żuchwy w celu poprawy konturu.",
    claim: "Niektóre ćwiczenia mogą poprawić napięcie mięśni, ale nie zmieniają struktury kości u dorosłych.",
    risk: "Może powodować ból stawu skroniowo-żuchwowego (TMJ) przy nadmiernym ćwiczeniu.",
    safer: "Prawidłowa postawa głowy, mewing, redukcja nadmiaru tkanki tłuszczowej (dieta + trening).",
    evidence: "Słabe — brak badań dla większości ćwiczeń."
  },
  {
    id: "cold-therapy",
    category: "skincare",
    name: "Zimna woda / okłady",
    level: "limited",
    what: "Przemywanie twarzy zimną wodą, okłady z lodu (owinięte w ręcznik).",
    claim: "Może tymczasowo redukować obrzęk i zwężać naczynia krwionośne.",
    risk: "Bezpośredni lód na skórę — ryzyko poparzenia. Zawsze owijaj.",
    safer: "Chłodna (nie lodowata) woda. Okłady max 1-2 min.",
    evidence: "Ograniczone — efekt głównie tymczasowy."
  },
  {
    id: "derma-rolling",
    category: "skincare",
    name: "Derma rolling (wałek mikroigłowy)",
    level: "limited",
    what: "Wałek z mikroigłami nakłuwający skórę.",
    claim: "Może stymulować produkcję kolagenu, poprawiać blizny.",
    risk: "Wysokie ryzyko infekcji, blizn, uszkodzeń przy nieprawidłowym użyciu. Igły domowe (0.2-0.5mm) — bezpieczniejsze, ale i tak ryzykowne.",
    safer: "Profesjonalne zabiegi u kosmetologa/dermatologa. Domowe wałki <0.3mm, sterylne, regularna wymiana.",
    evidence: "Umiarkowane dla zabiegów profesjonalnych, słabe dla domowych."
  },
  {
    id: "hair-oils",
    category: "hair",
    name: "Olejki na włosy (rozmaryn, rycyna)",
    level: "limited",
    what: "Masaż skóry głowy olejkami (rozmarynowy, rycynowy).",
    claim: "Mogą wspierać krążenie i odżywienie mieszków włosowych. Efekty indywidualne.",
    risk: "Zatykanie mieszków przy nadmiarze. Test na małym fragmencie (alergie).",
    safer: "Rozmaryn w stężeniu 1-2% rozpuszczony w oleju nośnikowym (np. jojoba). Masaż 5 min.",
    evidence: "Ograniczone — jedno badanie na rozmaryn vs minoxidil (słabsze efekty)."
  },

  // --- NIEBEZPIECZNE / NIEUZASADNIONE ---
  {
    id: "bonesmashing",
    category: "face",
    name: "Bonesmashing",
    level: "dangerous",
    what: "Celowe uderzanie w kości twarzy (żuchwa, kości jarzmowe) w celu stymulacji wzrostu kości.",
    claim: "Twierdzenie, że mikrourazy powodują wzrost kości (na podstawie koncepcji Wolffa) jest BŁĘDNE w tym kontekście. Nie ma wiarygodnych dowodów, że uderzanie twarzy poprawia jej wygląd.",
    risk: "🚨 WYSOKIE RYZYKO: pęknięcia kości, uszkodzenia nerwów (paraliż twarzy), uszkodzenia zębów i stawu skroniowo-żuchwowego (TMJ), trwałe blizny, krwiaki, infekcje. Może powodować trwałe uszkodzenia wymagające operacji.",
    safer: "✅ BEZPIECZNE ALTERNATYWY: trening postawy (unoszenie głowy), redukcja tkanki tłuszczowej (dieta + trening), pielęgnacja skóry (SPF, retinoidy), prawidłowe nawodnienie, mewing (język na podniebieniu), konsultacja z chirurgiem szczękowym w przypadku realnych wad zgryzu.",
    evidence: "BRAK POTWIERDZENIA. Praktyka niebezpieczna — nie stosuj."
  },
  {
    id: "steroids",
    category: "body",
    name: "Sterydy anaboliczne",
    level: "dangerous",
    what: "Syntetyczne pochodne testosteronu.",
    claim: "Zwiększają masę mięśniową i siłę, ale kosztem zdrowia.",
    risk: "🚨 WYSOKIE RYZYKO: uszkodzenie wątroby, serca, zaburzenia hormonalne (ginekomastia, impotencja), trądzik, agresja, choroby psychiczne. NIELEGALNE bez recepty w Polsce.",
    safer: "✅ BEZPIECZNE ALTERNATYWY: trening siłowy, dieta bogata w białko, kreatyna (suplement bezpieczny), odpowiedni sen, konsultacja z dietetykiem sportowym.",
    evidence: "Dowody na działanie SĄ, ale ryzyko zdrowotne i nielegalność wykluczają stosowanie."
  },
  {
    id: "sunbeds",
    category: "body",
    name: "Solarium",
    level: "dangerous",
    what: "Sztuczne opalanie w solarium.",
    claim: "Niektóre osoby wierzą, że daje 'zdrowy' wygląd i witaminę D.",
    risk: "🚨 WYSOKIE RYZYKO: nowotwory skóry (czerniak, rak podstawnokomórkowy), fotostarzenie (zmarszczki, plamy), uszkodzenie oczu. Solarium jest rakotwórcze (WHO, IARC grupa 1).",
    safer: "✅ BEZPIECZNE ALTERNATYWY: suplementacja witaminy D3 (po badaniu 25(OH)D), samoopalacze (DHA — bezpieczne), SPF + naturalne światło słoneczne w rozsądnych dawkach.",
    evidence: "Silne dowody na szkodliwość. Unikaj."
  },
  {
    id: "extreme-diet",
    category: "body",
    name: "Skrajne diety / głodówki",
    level: "dangerous",
    what: "Diety <1200 kcal, głodówki >24h, restrykcyjne eliminacje bez wskazań medycznych.",
    claim: "Szybka utrata wagi.",
    risk: "🚨 WYSOKIE RYZYKO: utrata masy mięśniowej, zaburzenia hormonalne, wypadanie włosów, osłabienie kości, zaburzenia odżywiania (anoreksja, bulimia), problemy z sercem.",
    safer: "✅ BEZPIECZNE ALTERNATYWY: deficyt 300-500 kcal, konsultacja z dietetykiem, regularne posiłki, trening siłowy + cardio.",
    evidence: "Skuteczność krótkoterminowa, ale ryzyko zdrowotne wysokie."
  }
];

export function getTrend(id) {
  return TRENDS_CATALOG.find(t => t.id === id);
}

export function getCategory(id) {
  return LOOKS_CATEGORIES.find(c => c.id === id);
}

export function getLevel(id) {
  return TREND_LEVELS[id] || TREND_LEVELS.unclear;
}
