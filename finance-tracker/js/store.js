/**
 * store.js — Data layer: localStorage CRUD for transactions, categories, budgets.
 * All persistence is handled here; the rest of the app treats this as the source of truth.
 */

import { generateId } from './utils.js';

// ── Storage keys ──────────────────────────────────────────────────────────────

const KEYS = {
  TRANSACTIONS: 'ft_transactions',
  BUDGETS:      'ft_budgets',
  SETTINGS:     'ft_settings',
};

// ── Default categories ────────────────────────────────────────────────────────

export const EXPENSE_CATEGORIES = [
  'Food',
  'Transport',
  'Housing',
  'Entertainment',
  'Health',
  'Shopping',
  'Other',
];

export const INCOME_CATEGORIES = ['Income'];

export const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

// ── Internal helpers ──────────────────────────────────────────────────────────

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error(`[store] Failed to write "${key}" to localStorage:`, e);
    return false;
  }
}

// ── Transactions ──────────────────────────────────────────────────────────────

/**
 * Return all transactions sorted by date descending.
 * @returns {Transaction[]}
 */
export function getTransactions() {
  const txs = readJSON(KEYS.TRANSACTIONS, []);
  return txs.sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Return a single transaction by ID, or null.
 * @param {string} id
 * @returns {Transaction|null}
 */
export function getTransactionById(id) {
  const txs = readJSON(KEYS.TRANSACTIONS, []);
  return txs.find((t) => t.id === id) ?? null;
}

/**
 * Add a new transaction.
 * @param {{ amount: number, category: string, date: string, description: string, type: string }} data
 * @returns {Transaction}
 */
export function addTransaction(data) {
  const txs = readJSON(KEYS.TRANSACTIONS, []);
  const transaction = {
    id:          generateId(),
    amount:      parseFloat(data.amount),
    category:    data.category,
    date:        data.date,
    description: data.description.trim(),
    type:        data.type,
    createdAt:   new Date().toISOString(),
  };
  txs.push(transaction);
  writeJSON(KEYS.TRANSACTIONS, txs);
  return transaction;
}

/**
 * Update an existing transaction by ID.
 * @param {string} id
 * @param {Partial<Transaction>} updates
 * @returns {Transaction|null}
 */
export function updateTransaction(id, updates) {
  const txs = readJSON(KEYS.TRANSACTIONS, []);
  const idx = txs.findIndex((t) => t.id === id);
  if (idx === -1) return null;

  txs[idx] = {
    ...txs[idx],
    ...updates,
    amount:      parseFloat(updates.amount ?? txs[idx].amount),
    description: (updates.description ?? txs[idx].description).trim(),
    updatedAt:   new Date().toISOString(),
  };
  writeJSON(KEYS.TRANSACTIONS, txs);
  return txs[idx];
}

/**
 * Delete a transaction by ID.
 * @param {string} id
 * @returns {boolean}
 */
export function deleteTransaction(id) {
  const txs = readJSON(KEYS.TRANSACTIONS, []);
  const filtered = txs.filter((t) => t.id !== id);
  if (filtered.length === txs.length) return false;
  writeJSON(KEYS.TRANSACTIONS, filtered);
  return true;
}

// ── Budgets ───────────────────────────────────────────────────────────────────

/**
 * Return the budgets object: { [category]: limit }.
 * @returns {Record<string, number>}
 */
export function getBudgets() {
  return readJSON(KEYS.BUDGETS, {});
}

/**
 * Set the monthly budget limit for a category.
 * @param {string} category
 * @param {number} limit
 */
export function setBudget(category, limit) {
  const budgets = getBudgets();
  budgets[category] = parseFloat(limit);
  writeJSON(KEYS.BUDGETS, budgets);
}

/**
 * Remove a budget for a category.
 * @param {string} category
 */
export function removeBudget(category) {
  const budgets = getBudgets();
  delete budgets[category];
  writeJSON(KEYS.BUDGETS, budgets);
}

// ── Computed queries ──────────────────────────────────────────────────────────

/**
 * Return total balance across all transactions (income - expenses).
 * @returns {number}
 */
export function getTotalBalance() {
  return getTransactions().reduce((sum, tx) => {
    return tx.type === 'income' ? sum + tx.amount : sum - tx.amount;
  }, 0);
}

/**
 * Return income and expenses for a given month ("YYYY-MM").
 * @param {string} yearMonth
 * @returns {{ income: number, expenses: number }}
 */
export function getMonthlyTotals(yearMonth) {
  const txs = getTransactions().filter((t) => t.date.startsWith(yearMonth));
  const income   = txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenses = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  return { income, expenses };
}

/**
 * Return total expenses per category for a given month.
 * @param {string} yearMonth
 * @returns {Record<string, number>}
 */
export function getCategoryTotals(yearMonth) {
  const txs = getTransactions().filter(
    (t) => t.type === 'expense' && t.date.startsWith(yearMonth)
  );
  return txs.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] ?? 0) + t.amount;
    return acc;
  }, {});
}

/**
 * Return filtered and sorted transactions based on filter criteria.
 * @param {{ category?: string, type?: string, dateFrom?: string, dateTo?: string, sort?: string }} filters
 * @returns {Transaction[]}
 */
export function getFilteredTransactions(filters = {}) {
  let txs = getTransactions();

  if (filters.category) {
    txs = txs.filter((t) => t.category === filters.category);
  }

  if (filters.type) {
    txs = txs.filter((t) => t.type === filters.type);
  }

  if (filters.dateFrom) {
    txs = txs.filter((t) => t.date >= filters.dateFrom);
  }

  if (filters.dateTo) {
    txs = txs.filter((t) => t.date <= filters.dateTo);
  }

  // Sorting
  switch (filters.sort) {
    case 'date-asc':
      txs.sort((a, b) => a.date.localeCompare(b.date));
      break;
    case 'amount-desc':
      txs.sort((a, b) => b.amount - a.amount);
      break;
    case 'amount-asc':
      txs.sort((a, b) => a.amount - b.amount);
      break;
    case 'date-desc':
    default:
      txs.sort((a, b) => b.date.localeCompare(a.date));
      break;
  }

  return txs;
}

// ── Import / Export ───────────────────────────────────────────────────────────

/**
 * Export all app data as a JSON string.
 * @returns {string}
 */
export function exportData() {
  const data = {
    version:      1,
    exportedAt:   new Date().toISOString(),
    transactions: readJSON(KEYS.TRANSACTIONS, []),
    budgets:      readJSON(KEYS.BUDGETS, {}),
  };
  return JSON.stringify(data, null, 2);
}

/**
 * Import data from a JSON string. Merges or replaces existing data.
 * @param {string} jsonString
 * @param {{ replace?: boolean }} [options]
 * @returns {{ success: boolean, message: string, count?: number }}
 */
export function importData(jsonString, { replace = false } = {}) {
  let parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    return { success: false, message: 'Invalid JSON format.' };
  }

  if (!parsed || typeof parsed !== 'object') {
    return { success: false, message: 'Data must be a JSON object.' };
  }

  const incoming = Array.isArray(parsed)
    ? parsed                          // legacy: raw array of transactions
    : (parsed.transactions ?? []);

  if (!Array.isArray(incoming)) {
    return { success: false, message: 'Transactions must be an array.' };
  }

  // Validate each transaction has minimum required fields
  const valid = incoming.filter(
    (t) => t && t.amount && t.category && t.date && t.type && t.description
  );

  if (valid.length === 0) {
    return { success: false, message: 'No valid transactions found in the file.' };
  }

  // Assign IDs if missing
  const withIds = valid.map((t) => ({
    ...t,
    id:     t.id ?? generateId(),
    amount: parseFloat(t.amount),
  }));

  if (replace) {
    writeJSON(KEYS.TRANSACTIONS, withIds);
  } else {
    const existing = readJSON(KEYS.TRANSACTIONS, []);
    const existingIds = new Set(existing.map((t) => t.id));
    const newOnes = withIds.filter((t) => !existingIds.has(t.id));
    writeJSON(KEYS.TRANSACTIONS, [...existing, ...newOnes]);
  }

  // Import budgets if present
  if (parsed.budgets && typeof parsed.budgets === 'object') {
    writeJSON(KEYS.BUDGETS, parsed.budgets);
  }

  return { success: true, message: `Imported ${withIds.length} transaction(s).`, count: withIds.length };
}

/**
 * Clear all data (for testing / reset).
 */
export function clearAll() {
  localStorage.removeItem(KEYS.TRANSACTIONS);
  localStorage.removeItem(KEYS.BUDGETS);
}
