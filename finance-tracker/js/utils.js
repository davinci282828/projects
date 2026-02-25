/**
 * utils.js — Date formatting, currency formatting, validation helpers
 */

// ── Currency ──────────────────────────────────────────────────────────────────

/**
 * Format a number as a USD currency string.
 * @param {number} amount
 * @param {boolean} [showSign=false] - prefix "+" for positive values
 * @returns {string}
 */
export function formatCurrency(amount, showSign = false) {
  const abs = Math.abs(amount);
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(abs);

  if (showSign && amount > 0) return `+${formatted}`;
  if (amount < 0) return `-${formatted}`;
  return formatted;
}

/**
 * Parse a currency string to a float.
 * @param {string} str
 * @returns {number}
 */
export function parseCurrency(str) {
  const cleaned = String(str).replace(/[^0-9.-]/g, '');
  const value = parseFloat(cleaned);
  return isNaN(value) ? 0 : value;
}

// ── Dates ─────────────────────────────────────────────────────────────────────

/**
 * Format an ISO date string (YYYY-MM-DD) to a human-readable date.
 * @param {string} dateStr  e.g. "2024-01-15"
 * @returns {string}        e.g. "Jan 15, 2024"
 */
export function formatDate(dateStr) {
  if (!dateStr) return '';
  // Parse as local time to avoid timezone shift
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * Return current date as ISO string (YYYY-MM-DD).
 * @returns {string}
 */
export function todayISO() {
  const d = new Date();
  return toISO(d);
}

/**
 * Convert a Date object to ISO date string.
 * @param {Date} date
 * @returns {string}
 */
export function toISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Return the current month as "YYYY-MM".
 * @returns {string}
 */
export function getCurrentMonth() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Return the year-month string for a date.
 * @param {string} dateStr  ISO date "YYYY-MM-DD"
 * @returns {string}        "YYYY-MM"
 */
export function getYearMonth(dateStr) {
  return dateStr ? dateStr.slice(0, 7) : '';
}

/**
 * Return an array of the last `n` months as "YYYY-MM" strings,
 * ordered oldest-first, ending with the current month.
 * @param {number} n
 * @returns {string[]}
 */
export function getMonthsBack(n) {
  const result = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    result.push(`${y}-${m}`);
  }
  return result;
}

/**
 * Format a "YYYY-MM" string to a short label like "Jan '24".
 * @param {string} ym
 * @returns {string}
 */
export function formatYearMonth(ym) {
  if (!ym) return '';
  const [year, month] = ym.split('-').map(Number);
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

// ── ID Generation ─────────────────────────────────────────────────────────────

/**
 * Generate a unique ID string.
 * Uses crypto.randomUUID when available, falls back to a simple generator.
 * @returns {string}
 */
export function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older environments
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ── Validation ────────────────────────────────────────────────────────────────

/**
 * Validate transaction form data.
 * @param {{ amount: string, description: string, category: string, date: string, type: string }} data
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateTransaction(data) {
  const errors = [];

  const amount = parseFloat(data.amount);
  if (!data.amount || isNaN(amount) || amount <= 0) {
    errors.push('Amount must be a positive number.');
  }
  if (amount > 1_000_000_000) {
    errors.push('Amount is unrealistically large.');
  }

  if (!data.description || data.description.trim().length === 0) {
    errors.push('Description is required.');
  } else if (data.description.trim().length > 100) {
    errors.push('Description must be 100 characters or fewer.');
  }

  if (!data.category) {
    errors.push('Please select a category.');
  }

  if (!data.date) {
    errors.push('Date is required.');
  } else {
    const dateObj = new Date(data.date);
    if (isNaN(dateObj.getTime())) {
      errors.push('Date is invalid.');
    }
  }

  if (!['income', 'expense'].includes(data.type)) {
    errors.push('Type must be income or expense.');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate budget form data.
 * @param {{ category: string, limit: string }} data
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateBudget(data) {
  const errors = [];
  if (!data.category) errors.push('Please select a category.');
  const limit = parseFloat(data.limit);
  if (!data.limit || isNaN(limit) || limit <= 0) {
    errors.push('Budget limit must be a positive number.');
  }
  return { valid: errors.length === 0, errors };
}

// ── DOM Helpers ───────────────────────────────────────────────────────────────

/**
 * Show a toast notification.
 * @param {string} message
 * @param {'success'|'error'|'info'} [type='info']
 * @param {number} [duration=3000]
 */
export function showToast(message, type = 'info', duration = 3000) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 0.3s ease';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * Escape HTML special characters to prevent XSS.
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Clamp a number between min and max.
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
