// ============================================================================
// LOCK IN 2027 — js/core/medications-catalog.js
// Katalog leków: edukacja + linki do oficjalnych źródeł.
// BEZ dawek. BEZ rekomendacji. BEZ leczenia.
// Źródła: URPL (urpl.gov.pl), EMA (ema.europa.eu).
// ============================================================================

export const MED_CATEGORIES = [
  { id: "otc",         icon: "🛒", name: "Bez recepty (OTC)" },
  { id: "rx",          icon: "📋", name: "Na receptę" },
  { id: "derma",       icon: "✨", name: "Dermatologia" },
  { id: "allergy",     icon: "🤧", name: "Alergologia" },
  { id: "pain",        icon: "💊", name: "Przeciwbólowe" },
  { id: "cold",        icon: "🤒", name: "Przeziębienie" },
  { id: "other",       icon: "📦", name: "Inne" }
];

export const MEDICATIONS_CATALOG = [
  {
    id: "paracetamol",
    name: "Paracetamol",
    category: "pain",
    prescription: false,
    class: "Przeciwbólowy i przeciwgorączkowy",
    short: "Substancja czynna stosowana w bólu i gorączce.",
    warnings: [
      "Przedawkowanie może trwale uszkodzić wątrobę.",
      "Nie łączyć z innymi lekami zawierającymi paracetamol.",
      "Ostrożnie przy problemach z wątrobą.",
      "Nie stosować u dzieci bez konsultacji z lekarzem."
    ],
    minAge: "Dla młodszych niż 12 lat — konsultacja z lekarzem.",
    source: "https://www.urpl.gov.pl/"
  },
  {
    id: "ibuprofen",
    name: "Ibuprofen",
    category: "pain",
    prescription: false,
    class: "Niesteroidowy lek przeciwzapalny (NLPZ)",
    short: "Substancja czynna o działaniu przeciwbólowym i przeciwzapalnym.",
    warnings: [
      "Może podrażniać żołądek — przyjmować z posiłkiem.",
      "Nie łączyć z innymi NLPZ (np. naproksenem, diklofenakiem).",
      "Ostrożnie przy problemach z nerkami lub wrzodach żołądka.",
      "Nie stosować u dzieci poniżej 12 lat bez konsultacji."
    ],
    minAge: "Dla młodszych niż 12 lat — konsultacja z lekarzem.",
    source: "https://www.urpl.gov.pl/"
  },
  {
    id: "isotretinoin",
    name: "Izotretynoina",
    category: "derma",
    prescription: true,
    class: "Retinoid doustny (na receptę)",
    short: "Lek na receptę stosowany w ciężkim trądziku, przepisywany przez dermatologa.",
    warnings: [
      "🚨 LEK NA RECEPTĘ. Nie stosuj bez nadzoru dermatologa.",
      "Silnie teratogenny (uszkadza płód) — kobiety w ciąży nie mogą go przyjmować.",
      "Wymaga regularnych badań krwi (wątroba, lipidy).",
      "Może powodować suchość skóry, oczu, ust, bóle mięśni.",
      "Nie łączyć z suplementami witaminy A ani retinoidami miejscowymi."
    ],
    minAge: "Tylko na receptę — decyduje lekarz.",
    source: "https://www.ema.europa.eu/"
  },
  {
    id: "tretynoina",
    name: "Tretynoina (miejscowa)",
    category: "derma",
    prescription: true,
    class: "Retinoid miejscowy (na receptę)",
    short: "Lek na receptę do stosowania miejscowego w trądziku.",
    warnings: [
      "🚨 LEK NA RECEPTĘ. Nie kupuj bez recepty — to nie kosmetyk.",
      "Może silnie podrażniać skórę przy pierwszych użyciach.",
      "Zawsze SPF — skóra wrażliwsza na słońce.",
      "Nie stosować w ciąży ani podczas karmienia.",
      "Nie łączyć z kwasami (AHA, BHA) tego samego wieczoru."
    ],
    minAge: "Tylko na receptę — decyzja dermatologa.",
    source: "https://www.urpl.gov.pl/"
  },
  {
    id: "loratadyna",
    name: "Loratadyna",
    category: "allergy",
    prescription: false,
    class: "Lek przeciwhistaminowy (OTC)",
    short: "Substancja czynna stosowana w alergiach (katar sienny, pokrzywka).",
    warnings: [
      "Może powodować senność u niektórych osób.",
      "Ostrożnie przy problemach z wątrobą.",
      "Nie stosować u dzieci poniżej 2 lat bez konsultacji."
    ],
    minAge: "Dla młodszych niż 2 lata — konsultacja z lekarzem.",
    source: "https://www.urpl.gov.pl/"
  },
  {
    id: "ceteryzyna",
    name: "Ceteryzyna",
    category: "allergy",
    prescription: false,
    class: "Lek przeciwhistaminowy (OTC)",
    short: "Substancja czynna stosowana w alergiach (katar, pokrzywka).",
    warnings: [
      "Może powodować senność.",
      "Ostrożnie przy problemach z nerkami.",
      "Nie stosować u dzieci poniżej 6 lat bez konsultacji."
    ],
    minAge: "Dla młodszych niż 6 lat — konsultacja z lekarzem.",
    source: "https://www.urpl.gov.pl/"
  },
  {
    id: "pseudoefedryna",
    name: "Pseudoefedryna",
    category: "cold",
    prescription: false,
    class: "Lek udrożniający nos (OTC, z ograniczeniami)",
    short: "Substancja czynna stosowana w katarze i zapaleniu zatok.",
    warnings: [
      "Może podnosić ciśnienie krwi i przyspieszać akcję serca.",
      "Nie stosować przy nadciśnieniu, arytmii, nadczynności tarczycy.",
      "Może powodować bezsenność — nie przyjmować wieczorem.",
      "W Polsce dostępna z ograniczeniami wiekowymi."
    ],
    minAge: "Zgodnie z ulotką — często 12+.",
    source: "https://www.urpl.gov.pl/"
  }
];

export function getMedication(id) {
  return MEDICATIONS_CATALOG.find(m => m.id === id);
}

export function getMedCategory(id) {
  return MED_CATEGORIES.find(c => c.id === id);
}
