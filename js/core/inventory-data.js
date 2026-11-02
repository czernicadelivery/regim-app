// ============================================================================
// LOCK IN 2027 — js/core/inventory-data.js
// CRUD dla Inventory i Budget. Wszystko w localStorage (prywatne).
// ============================================================================

import { localKey } from "./storage.js";
import { dateKey } from "./utils.js";

// ============================================================================
// INVENTORY
// ============================================================================

export function loadInventory() {
  try {
    const raw = localStorage.getItem(localKey("inventory"));
    return raw ? JSON.parse(raw) || [] : [];
  } catch (e) { return []; }
}

export function saveInventory(items) {
  localStorage.setItem(localKey("inventory"), JSON.stringify(items));
}

export function addInventoryItem(item) {
  const list = loadInventory();
  list.unshift({ ...item, id: "inv-" + Date.now(), createdAt: Date.now() });
  saveInventory(list);
  return list[0];
}

export function updateInventoryItem(id, updates) {
  const list = loadInventory();
  const idx = list.findIndex(i => i.id === id);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], ...updates };
  saveInventory(list);
  return list[idx];
}

export function deleteInventoryItem(id) {
  const list = loadInventory().filter(i => i.id !== id);
  saveInventory(list);
  return list;
}

// ============================================================================
// BUDGET
// ============================================================================

const DEFAULT_BUDGET = {
  monthlyLimit: 0,
  transactions: []
};

export function loadBudget() {
  try {
    const raw = localStorage.getItem(localKey("budget"));
    if (raw) return { ...DEFAULT_BUDGET, ...JSON.parse(raw) };
  } catch (e) {}
  return { ...DEFAULT_BUDGET };
}

export function saveBudget(budget) {
  localStorage.setItem(localKey("budget"), JSON.stringify(budget));
}

export function addTransaction(tx) {
  const budget = loadBudget();
  budget.transactions.unshift({
    ...tx,
    id: "tx-" + Date.now(),
    date: tx.date || dateKey(new Date()),
    createdAt: Date.now()
  });
  saveBudget(budget);
  return budget.transactions[0];
}

export function deleteTransaction(id) {
  const budget = loadBudget();
  budget.transactions = budget.transactions.filter(t => t.id !== id);
  saveBudget(budget);
  return budget;
}

export function getMonthSpend(budget, year, month) {
  // year np. 2026, month 0-11
  const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  return budget.transactions
    .filter(t => t.date && t.date.startsWith(prefix))
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
}

export function getTotalSpend(budget) {
  return budget.transactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
}

export function getTransactionsByMonth(budget, year, month) {
  const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  return budget.transactions.filter(t => t.date && t.date.startsWith(prefix));
}
