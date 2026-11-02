// ============================================================================
// LOCK IN 2027 — js/core/supplements-catalog.js
// Statyczny katalog 30+ suplementów z kategorią, dowodami i ostrzeżeniami.
// NIE zawiera dawek — użytkownik wpisuje własne (etykieta / lekarz).
// ============================================================================

export const EVIDENCE_LEVELS = {
  strong:       { label: "Dobrze potwierdzone",   color: "var(--success)", icon: "✅" },
  moderate:     { label: "Umiarkowane dowody",    color: "var(--warning)", icon: "🟡" },
  limited:      { label: "Ograniczone dowody",    color: "var(--warning)", icon: "⚠️" },
  unclear:      { label: "Niejasne dowody",       color: "var(--text-tertiary)", icon: "❓" },
  unsupported:  { label: "Brak potwierdzenia",    color: "var(--danger)", icon: "❌" },
  dangerous:    { label: "Potencjalnie groźne",   color: "var(--danger)", icon: "🚨" }
};

export const CATEGORIES = [
  { id: "vitamins",  icon: "💊", name: "Witaminy" },
  { id: "minerals",  icon: "🧂", name: "Minerały" },
  { id: "fatty",     icon: "🐟", name: "Kwasy tłuszczowe" },
  { id: "sport",     icon: "💪", name: "Sport" },
  { id: "other",     icon: "🌿", name: "Inne" }
];

export const SUPPLEMENTS_CATALOG = [
  // --- WITAMINY ---
  {
    id: "vit-a",
    category: "vitamins",
    name: "Witamina A",
    desc: "Rozpuszczalna w tłuszczach, ważna dla wzroku, skóry i odporności.",
    sources: "Wątroba, jaja, mleko, marchew (beta-karoten)",
    evidence: "strong",
    warnings: "Przedawkowanie w ciąży grozi wadami płodu. Nie łączyć z izotretynoiną bez konsultacji.",
    interactions: ["Izotretynoina", "Retinoidy miejscowe (nasilenie podrażnień)"]
  },
  {
    id: "vit-b12",
    category: "vitamins",
    name: "Witamina B12 (kobalamina)",
    desc: "Niezbędna dla układu nerwowego i produkcji czerwonych krwinek.",
    sources: "Mięso, ryby, jaja, nabiał. Weganie powinni suplementować.",
    evidence: "strong",
    warnings: "U osób z niedoborem wskazana diagnostyka (badanie krwi) przed suplementacją.",
    interactions: []
  },
  {
    id: "vit-c",
    category: "vitamins",
    name: "Witamina C (kwas askorbinowy)",
    desc: "Antyoksydant, wspiera syntezę kolagenu i wchłanianie żelaza.",
    sources: "Cytrusy, papryka, kiwi, czarna porzeczka",
    evidence: "strong",
    warnings: "Wysokie dawki mogą powodować biegunkę. U osób z kamicą nerkową — konsultacja.",
    interactions: ["Żelazo (zwiększa wchłanianie)"]
  },
  {
    id: "vit-d3",
    category: "vitamins",
    name: "Witamina D3 (cholekalcyferol)",
    desc: "Kluczowa dla kości, odporności i nastroju. Syntezowana w skórze pod wpływem słońca.",
    sources: "Tłuste ryby, żółtko jaja. Synteza słoneczna.",
    evidence: "strong",
    warnings: "W Polsce powszechny niedobór. Zalecane badanie 25(OH)D przed suplementacją. Nie przekraczać górnego limitu (ustal z lekarzem).",
    interactions: ["Tiazydy (hiperkalcemia)", "Orlistat (zmniejsza wchłanianie)"]
  },
  {
    id: "vit-e",
    category: "vitamins",
    name: "Witamina E (tokoferol)",
    desc: "Antyoksydant, ochrona błon komórkowych.",
    sources: "Oleje roślinne, orzechy, nasiona, awokado",
    evidence: "moderate",
    warnings: "Wysokie dawki mogą zwiększać ryzyko krwawień. Konsultacja przy lekach przeciwzakrzepowych.",
    interactions: ["Leki przeciwzakrzepowe (warfaryna, aspiryna)"]
  },
  {
    id: "vit-k",
    category: "vitamins",
    name: "Witamina K",
    desc: "Niezbędna dla krzepnięcia krwi i zdrowia kości.",
    sources: "Zielone warzywa liściaste, brokuły, jarmuż",
    evidence: "strong",
    warnings: "Ostrożnie przy lekach przeciwzakrzepowych — może osłabiać ich działanie.",
    interactions: ["Warfaryna (znaczne osłabienie działania)"]
  },

  // --- MINERAŁY ---
  {
    id: "magnesium",
    category: "minerals",
    name: "Magnez",
    desc: "Wspiera pracę mięśni, układ nerwowy i metabolizm energetyczny.",
    sources: "Orzechy, nasiona, kasza, ciemna czekolada, banany",
    evidence: "strong",
    warnings: "Formy: cytrynian, glicynian (lepsze wchłanianie). Tlenek — słabo przyswajalny, może przeczyszczać.",
    interactions: ["Antybiotyki (fluorochinolony, tetracykliny) — 2h odstęp"]
  },
  {
    id: "zinc",
    category: "minerals",
    name: "Cynk",
    desc: "Wspiera odporność, gojenie ran, zdrowie skóry i produkcję testosteronu.",
    sources: "Mięso, ostrygi, dynia (pestki), kasza",
    evidence: "strong",
    warnings: "Długotrwałe wysokie dawki mogą zaburzać wchłanianie miedzi. Cykl 8-12 tyg. z przerwami.",
    interactions: ["Miedź (rywalizacja o wchłanianie)", "Antybiotyki (tetracykliny)"]
  },
  {
    id: "iron",
    category: "minerals",
    name: "Żelazo",
    desc: "Niezbędne dla transportu tlenu (hemoglobina).",
    sources: "Mięso czerwone, wątroba, rośliny strączkowe (z witaminą C)",
    evidence: "strong",
    warnings: "Suplementacja TYLKO po badaniu ferrytyny. Nadmiar żelaza jest toksyczny.",
    interactions: ["Herbata, kawa (zmniejszają wchłanianie)", "Wapń (zmniejsza wchłanianie)"]
  },
  {
    id: "calcium",
    category: "minerals",
    name: "Wapń",
    desc: "Budulec kości i zębów, uczestniczy w krzepnięciu krwi.",
    sources: "Nabiał, mleko roślinne wzbogacane, brokuły, migdały",
    evidence: "strong",
    warnings: "Suplementacja rzadko konieczna przy zbilansowanej diecie. Wchłanianie wymaga witaminy D.",
    interactions: ["Żelazo (zmniejsza wchłanianie)", "Tyreoidyna (2h odstęp)"]
  },
  {
    id: "potassium",
    category: "minerals",
    name: "Potas",
    desc: "Reguluje ciśnienie, pracę serca i równowagę wodną.",
    sources: "Banany, ziemniaki, pomidory, awokado, fasola",
    evidence: "strong",
    warnings: "Suplementacja niebezpieczna u osób z chorobami nerek. Najlepiej z diety.",
    interactions: ["Leki moczopędne, inhibitory ACE (hiperkaliemia)"]
  },
  {
    id: "selenium",
    category: "minerals",
    name: "Selen",
    desc: "Antyoksydant, wspiera tarczycę i odporność.",
    sources: "Orzechy brazylijskie (1-2 dziennie wystarczą!), ryby, jaja",
    evidence: "strong",
    warnings: "Łatwo przedawkować — 1 orzech brazylijski dziennie pokrywa dzienne zapotrzebowanie.",
    interactions: ["Witamina C (zmniejsza wchłanianie)"]
  },
  {
    id: "iodine",
    category: "minerals",
    name: "Jod",
    desc: "Niezbędny dla produkcji hormonów tarczycy.",
    sources: "Sól jodowana, ryby morskie, wodorosty",
    evidence: "strong",
    warnings: "Nadmiar jodu zaburza pracę tarczycy (zarówno Hashimoto jak i nadczynność). Bez badań — nie suplementować.",
    interactions: ["Leki na tarczycę (metimazol, propylotiouracyl)"]
  },

  // --- KWASY TŁUSZCZOWE ---
  {
    id: "omega3",
    category: "fatty",
    name: "Omega-3 (EPA + DHA)",
    desc: "Niezbędne nienasycone kwasy tłuszczowe, ważne dla serca i mózgu.",
    sources: "Tłuste ryby (łosoś, makrela, sardynki), siemię lniane (ALA)",
    evidence: "strong",
    warnings: "Wysokie dawki mogą rozrzedzać krew. Konsultacja przy lekach przeciwzakrzepowych.",
    interactions: ["Leki przeciwzakrzepowe (nasilenie ryzyka krwawień)"]
  },
  {
    id: "epa-dha",
    category: "fatty",
    name: "EPA / DHA (izolowane)",
    desc: "Skoncentrowane formy kwasów omega-3. EPA — działanie przeciwzapalne, DHA — mózg i wzrok.",
    sources: "Suplementy z oleju rybnego lub algowego",
    evidence: "strong",
    warnings: "Formy wegańskie: olej z alg. Sprawdź zawartość EPA+DHA na etykiecie (nie tylko 'olej rybny').",
    interactions: ["Leki przeciwzakrzepowe"]
  },

  // --- SPORT ---
  {
    id: "creatine",
    category: "sport",
    name: "Kreatyna (monohydrat)",
    desc: "Zwiększa siłę, masę mięśniową i wydolność w krótkich, intensywnych wysiłkach.",
    sources: "Mięso, ryby (niewielkie ilości). Suplementacja standardowa dla sportowców.",
    evidence: "strong",
    warnings: "Wymaga 2.5-3L wody dziennie. Forma monohydratu jest najlepiej przebadana. Konsultacja przy chorobach nerek.",
    interactions: ["Kofeina (możliwe zmniejszenie efektu)", "Leki nefrotoksyczne"]
  },
  {
    id: "protein-whey",
    category: "sport",
    name: "Białko serwatkowe (whey)",
    desc: "Szybko wchłanialne białko, wspiera regenerację i wzrost mięśni.",
    sources: "Suplement diety. Naturalnie: mleko, twaróg.",
    evidence: "strong",
    warnings: "Osoby z nietolerancją laktozy — wybrać izolat lub hydrolizat. Niewskazane przy alergii na mleko.",
    interactions: []
  },
  {
    id: "electrolytes",
    category: "sport",
    name: "Elektrolity",
    desc: "Sód, potas, magnez, chlorki — niezbędne przy intensywnym poceniu.",
    sources: "Suplementy, napoje izotoniczne, woda kokosowa",
    evidence: "moderate",
    warnings: "Potrzebne głównie przy treningach >1h lub w upale. Przy normalnej diecie — rzadko konieczne.",
    interactions: ["Leki moczopędne"]
  },
  {
    id: "beta-alanine",
    category: "sport",
    name: "Beta-alanina",
    desc: "Buforuje kwas mlekowy, poprawia wydolność w wysiłkach 1-4 min.",
    sources: "Suplement diety",
    evidence: "moderate",
    warnings: "Może powodować parestezje (mrowienie skóry) — normalne, niegroźne. Efekt po 4-6 tyg. regularnego stosowania.",
    interactions: []
  },
  {
    id: "caffeine",
    category: "sport",
    name: "Kofeina",
    desc: "Poprawia koncentrację, wydolność i zmniejsza odczucie zmęczenia.",
    sources: "Kawa, herbata, guarana, suplementy",
    evidence: "strong",
    warnings: "Nie łączyć z dużymi dawkami przed snem (6h+). Ostrożnie przy nadciśnieniu, arytmii, lękach.",
    interactions: ["Leki nasercowe", "Leki przeciwlękowe", "Alkohol (nasilenie efektów)"]
  },

  // --- INNE ---
  {
    id: "fiber",
    category: "other",
    name: "Błonnik",
    desc: "Wspiera trawienie, reguluje poziom cukru i cholesterolu.",
    sources: "Warzywa, owoce, pełne ziarna, rośliny strączkowe",
    evidence: "strong",
    warnings: "Zwiększać stopniowo + dużo wody. Nagłe zwiększenie może powodować wzdęcia.",
    interactions: ["Leki (spowalnia wchłanianie — 2h odstęp)"]
  },
  {
    id: "probiotics",
    category: "other",
    name: "Probiotyki",
    desc: "Żywe kultury bakterii wspierające mikrobiotę jelitową.",
    sources: "Jogurt, kefir, kiszonki (naturalnie)",
    evidence: "moderate",
    warnings: "Skuteczność zależy od szczepu. Osoby z obniżoną odpornością — konsultacja z lekarzem.",
    interactions: ["Antybiotyki (2h odstęp)"]
  },
  {
    id: "collagen",
    category: "other",
    name: "Kolagen",
    desc: "Białko strukturalne skóry, stawów i kości. Suplementacja może wspierać elastyczność skóry.",
    sources: "Wywar z kości, galarety, suplementy",
    evidence: "limited",
    warnings: "Dowody umiarkowane, głównie dla skóry i stawów. Efekty po 8-12 tyg. Nie zastępuje diety bogatej w białko.",
    interactions: []
  },
  {
    id: "melatonin",
    category: "other",
    name: "Melatonina",
    desc: "Hormon snu, reguluje rytm okołodobowy.",
    sources: "Naturalnie produkowana przez szyszynkę",
    evidence: "moderate",
    warnings: "Najlepiej krótkotrwale (podróże, jet lag). Długotrwałe stosowanie — konsultacja. Nie dla dzieci bez zalecenia lekarza.",
    interactions: ["Leki immunosupresyjne", "Leki przeciwzakrzepowe", "Alkohol"]
  },
  {
    id: "ashwagandha",
    category: "other",
    name: "Ashwagandha (Witanja somnifera)",
    desc: "Adaptogen, może wspierać redukcję stresu i jakość snu.",
    sources: "Korzeń, suplementy",
    evidence: "limited",
    warnings: "Może wpływać na tarczycę i wątrobę. Konsultacja przy chorobach autoimmunologicznych. Nie dla kobiet w ciąży.",
    interactions: ["Leki na tarczycę", "Leki immunosupresyjne", "Leki nasenne"]
  }
];

export function getSupplementById(id) {
  return SUPPLEMENTS_CATALOG.find(s => s.id === id);
}

export function getCategoryById(id) {
  return CATEGORIES.find(c => c.id === id);
}
