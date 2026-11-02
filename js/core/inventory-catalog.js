// ============================================================================
// LOCK IN 2027 — js/core/inventory-catalog.js
// Kategorie magazynu + budżetu.
// ============================================================================

export const INVENTORY_CATEGORIES = [
  { id: "supplements", icon: "💊", name: "Suplementy" },
  { id: "cosmetics",   icon: "🧴", name: "Kosmetyki" },
  { id: "hair",        icon: "💇", name: "Włosy" },
  { id: "equipment",   icon: "🏋️", name: "Sprzęt" },
  { id: "clothes",     icon: "👕", name: "Ubrania" },
  { id: "food",        icon: "🍽️", name: "Spożywcze" },
  { id: "other",       icon: "📦", name: "Inne" }
];

export const INVENTORY_STATUS = [
  { id: "owned",    icon: "✅", name: "Posiadam",     color: "var(--success)" },
  { id: "wishlist", icon: "⭐", name: "Wishlist",     color: "var(--warning)" },
  { id: "used",     icon: "📭", name: "Zużyte",       color: "var(--text-tertiary)" }
];

export const BUDGET_CATEGORIES = [
  { id: "skincare",    icon: "✨", name: "Skincare" },
  { id: "supplements", icon: "💊", name: "Suplementy" },
  { id: "fitness",     icon: "💪", name: "Fitness" },
  { id: "nutrition",   icon: "🍽️", name: "Odżywianie" },
  { id: "style",       icon: "👔", name: "Styl" },
  { id: "equipment",   icon: "🏋️", name: "Sprzęt" },
  { id: "other",       icon: "📦", name: "Inne" }
];

export function getInventoryCategory(id) {
  return INVENTORY_CATEGORIES.find(c => c.id === id);
}

export function getInventoryStatus(id) {
  return INVENTORY_STATUS.find(s => s.id === id);
}

export function getBudgetCategory(id) {
  return BUDGET_CATEGORIES.find(c => c.id === id);
}
