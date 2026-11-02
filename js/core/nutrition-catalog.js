// ============================================================================
// LOCK IN 2027 — js/core/nutrition-catalog.js
// Przepisy, kategorie, cele nawodnienia.
// ============================================================================

export const WATER_GOALS = [
  { id: "1.5",  label: "1.5 L", ml: 1500 },
  { id: "2.0",  label: "2.0 L", ml: 2000 },
  { id: "2.5",  label: "2.5 L", ml: 2500 },
  { id: "3.0",  label: "3.0 L", ml: 3000 },
  { id: "custom", label: "Własny", ml: 0 }
];

export const WATER_UNITS = [
  { id: "glass",   label: "Szklanka", ml: 250, icon: "🥛" },
  { id: "bottle",  label: "Butelka",  ml: 500, icon: "🍶" },
  { id: "large",   label: "Duża",     ml: 750, icon: "🥤" }
];

export const RECIPE_CATEGORIES = [
  { id: "breakfast",  icon: "🍳", name: "Śniadania" },
  { id: "lunch",      icon: "🍝", name: "Obiady" },
  { id: "dinner",     icon: "🥗", name: "Kolacje" },
  { id: "snack",      icon: "🥜", name: "Przekąski" },
  { id: "shake",      icon: "🥤", name: "Szejki" }
];

export const RECIPES_CATALOG = [
  {
    id: "r-omlet",
    category: "breakfast",
    name: "Omlet proteinowy",
    kcal: 520,
    prot: 38,
    time: "10 min",
    ingredients: [
      "4 jajka",
      "30 g sera żółtego",
      "2 plastry szynki",
      "1 łyżka masła",
      "Sól, pieprz"
    ],
    steps: [
      "Roztrzep jajka z solą i pieprzem.",
      "Rozgrzej masło na patelni.",
      "Wlej jajka, dodaj szynkę i ser.",
      "Smaż 2-3 min pod przykryciem."
    ]
  },
  {
    id: "r-owsianka",
    category: "breakfast",
    name: "Owsianka z bananem i orzechami",
    kcal: 640,
    prot: 22,
    time: "5 min",
    ingredients: [
      "60 g płatków owsianych",
      "250 ml mleka 3.2%",
      "1 banan",
      "15 g orzechów włoskich",
      "1 łyżka miodu"
    ],
    steps: [
      "Zagotuj mleko.",
      "Dodaj płatki, gotuj 3 min.",
      "Dodaj pokrojonego banana, orzechy i miód."
    ]
  },
  {
    id: "r-spaghetti",
    category: "lunch",
    name: "Spaghetti bolognese",
    kcal: 780,
    prot: 42,
    time: "30 min",
    ingredients: [
      "100 g makaronu",
      "150 g mięsa mielonego",
      "200 ml passaty pomidorowej",
      "1 ząbek czosnku",
      "Cebula, oliwa, przyprawy"
    ],
    steps: [
      "Ugotuj makaron al dente.",
      "Podsmaż cebulę i czosnek.",
      "Dodaj mięso, smaż do zrumienienia.",
      "Dodaj passatę, gotuj 10 min.",
      "Wymieszaj z makaronem."
    ]
  },
  {
    id: "r-kurczak",
    category: "lunch",
    name: "Kurczak z ryżem i warzywami",
    kcal: 720,
    prot: 45,
    time: "25 min",
    ingredients: [
      "150 g piersi kurczaka",
      "80 g ryżu (suchy)",
      "200 g warzyw (mieszanka)",
      "1 łyżka oliwy",
      "Przyprawy"
    ],
    steps: [
      "Ugotuj ryż.",
      "Pokrój kurczaka, oprósz przyprawami.",
      "Smaż na oliwie 8-10 min.",
      "Dodaj warzywa, smaż 5 min.",
      "Podawaj z ryżem."
    ]
  },
  {
    id: "r-tunczyk",
    category: "dinner",
    name: "Sałatka z tuńczykiem",
    kcal: 480,
    prot: 36,
    time: "10 min",
    ingredients: [
      "1 puszka tuńczyka (120 g)",
      "Mix sałat",
      "1 jajko gotowane",
      "Pomidorki koktajlowe",
      "Oliwa, cytryna"
    ],
    steps: [
      "Umyj i pokrój warzywa.",
      "Dodaj tuńczyka i jajko.",
      "Skrop oliwą i cytryną, wymieszaj."
    ]
  },
  {
    id: "r-szejk",
    category: "shake",
    name: "Szejk masowy 700 kcal",
    kcal: 700,
    prot: 24,
    time: "3 min",
    ingredients: [
      "300 ml mleka 3.2%",
      "40 g płatków owsianych",
      "1 banan",
      "2 łyżki masła orzechowego"
    ],
    steps: [
      "Włóż wszystko do blendera.",
      "Blenduj 30-40 sekund.",
      "Wypij od razu."
    ]
  }
];

export function getRecipe(id) {
  return RECIPES_CATALOG.find(r => r.id === id);
}

export function getRecipeCategory(id) {
  return RECIPE_CATEGORIES.find(c => c.id === id);
}
