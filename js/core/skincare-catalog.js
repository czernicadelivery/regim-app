// ============================================================================
// LOCK IN 2027 — js/core/skincare-catalog.js
// Katalog składników kosmetycznych + kategorie produktów.
// Wszystko edukacyjne. Nie zastępuje porady dermatologa.
// ============================================================================

export const SKIN_TYPES = [
  { id: "normal",      label: "Normalna",    icon: "⚪" },
  { id: "dry",         label: "Sucha",       icon: "🏜️" },
  { id: "oily",        label: "Tłusta",      icon: "💧" },
  { id: "combination", label: "Mieszana",    icon: "🎭" },
  { id: "sensitive",   label: "Wrażliwa",    icon: "🌸" },
  { id: "acne",        label: "Trądzikowa",  icon: "🔴" },
  { id: "unknown",     label: "Nie wiem",    icon: "❓" }
];

export const PRODUCT_CATEGORIES = [
  { id: "cleanser",     icon: "🧼", name: "Oczyszczanie" },
  { id: "toner",        icon: "💦", name: "Tonik" },
  { id: "serum",        icon: "💧", name: "Serum" },
  { id: "moisturizer",  icon: "🧴", name: "Nawilżanie" },
  { id: "spf",          icon: "☀️", name: "SPF" },
  { id: "treatment",    icon: "🎯", name: "Kuracja punktowa" },
  { id: "exfoliant",    icon: "✨", name: "Złuszczanie" },
  { id: "eye",          icon: "👁️", name: "Okolice oczu" },
  { id: "lip",          icon: "💋", name: "Usta" },
  { id: "mask",         icon: "🎭", name: "Maska" }
];

// Katalog składników — wszystkie opisy edukacyjne
export const INGREDIENTS_CATALOG = [
  {
    id: "niacinamide",
    name: "Niacynamid (witamina B3)",
    category: "aktywne",
    what: "Rozjaśnia przebarwienia, reguluje sebum, wzmacnia barierę skórną.",
    evidence: "strong",
    concentration: "2-10%",
    warnings: "Przy 10%+ może podrażniać. Wprowadzaj stopniowo.",
    pairs: ["Kwas hialuronowy", "SPF"],
    avoid: []
  },
  {
    id: "hyaluronic",
    name: "Kwas hialuronowy",
    category: "nawilżanie",
    what: "Silnie nawilża, wiąże wodę w naskórku. Nie uczula.",
    evidence: "strong",
    concentration: "0.1-2%",
    warnings: "Nakładaj na wilgotną skórę i przykryj kremem — inaczej może wysuszać w suchym klimacie.",
    pairs: ["Ceramidy", "Niacynamid"],
    avoid: []
  },
  {
    id: "salicylic",
    name: "Kwas salicylowy (BHA)",
    category: "aktywne",
    what: "Złuszcza wnętrze porów, działa przeciwtrądzikowo i przeciwzapalnie.",
    evidence: "strong",
    concentration: "0.5-2%",
    warnings: "Może podrażniać przy stosowaniu codziennie. Zaczynaj od 2-3x w tygodniu. Zawsze SPF.",
    pairs: ["Niacynamid"],
    avoid: ["Retinoidy (nasilone podrażnienie przy łączeniu)"]
  },
  {
    id: "azelaic",
    name: "Kwas azelainowy",
    category: "aktywne",
    what: "Działa przeciwtrądzikowo, rozjaśnia przebarwienia (w tym potrądzikowe).",
    evidence: "strong",
    concentration: "10-20%",
    warnings: "Może powodować pieczenie przy pierwszych użyciach. Bezpieczny w ciąży.",
    pairs: ["Niacynamid"],
    avoid: []
  },
  {
    id: "retinoids",
    name: "Retinoidy (retinol, retinal, tretynoina)",
    category: "aktywne",
    what: "Przyspieszają odnowę komórkową, redukują zmarszczki i trądzik.",
    evidence: "strong",
    concentration: "Retinol 0.1-1%, retinal 0.05-0.1%, tretynoina tylko na receptę",
    warnings: "⚠️ Tretynoina to LEK na receptę — nie stosuj bez nadzoru dermatologa. Zawsze SPF. Nie łączyć z kwasami (AHA/BHA) tego samego wieczoru.",
    pairs: ["Nawilżanie", "SPF"],
    avoid: ["Kwasy AHA/BHA", "Tretynoina doustna (izotretynoina)"]
  },
  {
    id: "ceramides",
    name: "Ceramidy",
    category: "nawilżanie",
    what: "Odbudowują barierę skórną, chronią przed utratą wody.",
    evidence: "strong",
    concentration: "1-5%",
    warnings: "Bardzo bezpieczne. Idealne przy cerze suchej i wrażliwej.",
    pairs: ["Kwas hialuronowy", "Skwalan"],
    avoid: []
  },
  {
    id: "vitamin-c",
    name: "Witamina C (kwas askorbinowy)",
    category: "antyoksydanty",
    what: "Antyoksydant, rozjaśnia skórę, wspiera produkcję kolagenu.",
    evidence: "strong",
    concentration: "10-20%",
    warnings: "Nietrwała (utlenia się w świetle). Przechowuj w ciemnej butelce. Może podrażniać przy 20%. Stosuj rano + SPF.",
    pairs: ["Witamina E", "Ferulic acid"],
    avoid: ["Retinoidy (w tym samym kroku)"]
  },
  {
    id: "panthenol",
    name: "Pantenol (prowitamina B5)",
    category: "nawilżanie",
    what: "Koi podrażnienia, wspiera regenerację naskórka.",
    evidence: "moderate",
    concentration: "1-5%",
    warnings: "Bardzo bezpieczny. Idealny po złuszczaniu.",
    pairs: ["Ceramidy", "Alantoina"],
    avoid: []
  },
  {
    id: "spf",
    name: "SPF (filtr UV)",
    category: "ochrona",
    what: "Ochrona przed UVA/UVB. Najważniejszy krok anti-aging.",
    evidence: "strong",
    concentration: "SPF 30+ codziennie",
    warnings: "Aplikuj codziennie rano, nawet zimą i w pochmurne dni. Nakładaj ponownie co 2-3h na słońcu.",
    pairs: ["Wszystko"],
    avoid: []
  }
];

export function getSkinType(id) {
  return SKIN_TYPES.find(s => s.id === id);
}

export function getProductCategory(id) {
  return PRODUCT_CATEGORIES.find(c => c.id === id);
}

export function getIngredient(id) {
  return INGREDIENTS_CATALOG.find(i => i.id === id);
}
