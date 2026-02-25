/**
 * app.js — Main application module.
 *
 * Imports from store.js, charts.js, utils.js, and modal.js.
 * Wires up all event listeners and initializes the dashboard.
 */

import {
  getTransactionById,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  getTotalBalance,
  getMonthlyTotals,
  getCategoryTotals,
  getFilteredTransactions,
  getBudgets,
  setBudget,
  removeBudget,
  exportData,
  importData,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
} from './store.js';

import { renderPieChart, renderBarChart } from './charts.js';

import {
  formatCurrency,
  formatDate,
  todayISO,
  getCurrentMonth,
  getMonthsBack,
  formatYearMonth,
  validateTransaction,
  validateBudget,
  showToast,
  escapeHtml,
} from './utils.js';

import { Modal } from '../components/modal.js';

// ── App state ─────────────────────────────────────────────────────────────────

let activeSection = 'dashboard';
let editingTransactionId = null;

const filters = {
  category: '',
  type:     '',
  dateFrom: '',
  dateTo:   '',
  sort:     'date-desc',
};

// ── Modal instances ───────────────────────────────────────────────────────────

const transactionModal = new Modal('modal-transaction');
const budgetModal      = new Modal('modal-budget');

// ── Category helpers ──────────────────────────────────────────────────────────

function populateCategorySelect(selectEl, type) {
  const cats = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  selectEl.innerHTML = cats.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
}

function populateFilterCategories() {
  const sel = document.getElementById('filter-category');
  const all = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];
  sel.innerHTML =
    `<option value="">All Categories</option>` +
    all.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
}

function populateBudgetCategorySelect() {
  const sel = document.getElementById('budget-category');
  sel.innerHTML = EXPENSE_CATEGORIES
    .map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`)
    .join('');
}

// ── Section navigation ────────────────────────────────────────────────────────

function showSection(name) {
  document.querySelectorAll('.section').forEach((s) => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach((b) => b.classList.remove('active'));

  const section = document.getElementById(`section-${name}`);
  if (section) section.classList.add('active');

  const navBtn = document.querySelector(`.nav-btn[data-section="${name}"]`);
  if (navBtn) navBtn.classList.add('active');

  activeSection = name;
  renderSection(name);
}

function renderSection(name) {
  switch (name) {
    case 'dashboard':    renderDashboard();    break;
    case 'transactions': renderTransactions(); break;
    case 'charts':       renderCharts();       break;
    case 'budgets':      renderBudgets();      break;
  }
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

function renderDashboard() {
  const ym = getCurrentMonth();
  const { income, expenses } = getMonthlyTotals(ym);
  const balance = getTotalBalance();
  const savings = income > 0 ? Math.round(((income - expenses) / income) * 100) : 0;

  const balanceEl = document.getElementById('summary-balance');
  balanceEl.textContent = formatCurrency(balance);
  balanceEl.classList.toggle('negative', balance < 0);

  document.getElementById('summary-income').textContent   = formatCurrency(income);
  document.getElementById('summary-expenses').textContent = formatCurrency(expenses);
  document.getElementById('summary-savings').textContent  = `${savings}%`;

  renderRecentTransactions();
  renderDashboardPie(ym);
}

function renderRecentTransactions() {
  const list = document.getElementById('recent-transactions-list');
  const txs  = getFilteredTransactions({ sort: 'date-desc' }).slice(0, 5);

  if (txs.length === 0) {
    list.innerHTML = '<div class="empty-state">No transactions yet. Add your first one!</div>';
    return;
  }

  list.innerHTML = txs
    .map(
      (tx) => `
      <div class="transaction-item">
        <div class="tx-info">
          <span class="tx-description">${escapeHtml(tx.description)}</span>
          <span class="tx-meta">${escapeHtml(tx.category)} &middot; ${formatDate(tx.date)}</span>
        </div>
        <span class="tx-amount ${tx.type}">
          ${tx.type === 'income' ? '+' : '-'}${formatCurrency(tx.amount)}
        </span>
      </div>`
    )
    .join('');
}

function renderDashboardPie(ym) {
  const canvas = document.getElementById('dashboard-pie-chart');
  const legend = document.getElementById('dashboard-pie-legend');
  const totals = getCategoryTotals(ym);
  const data   = Object.entries(totals).map(([label, value]) => ({ label, value }));
  renderPieChart(canvas, data, legend);
}

// ── Transactions ──────────────────────────────────────────────────────────────

function renderTransactions() {
  const txs   = getFilteredTransactions(filters);
  const tbody = document.getElementById('transactions-tbody');
  const count = document.getElementById('transactions-count');

  count.textContent = `${txs.length} transaction${txs.length !== 1 ? 's' : ''}`;

  if (txs.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="6" class="empty-state">No transactions match your filters.</td></tr>';
    return;
  }

  tbody.innerHTML = txs
    .map(
      (tx) => `
      <tr>
        <td data-label="Date">${escapeHtml(formatDate(tx.date))}</td>
        <td data-label="Description">${escapeHtml(tx.description)}</td>
        <td data-label="Category"><span class="badge">${escapeHtml(tx.category)}</span></td>
        <td data-label="Type"><span class="badge ${tx.type}">${escapeHtml(tx.type)}</span></td>
        <td data-label="Amount" class="text-right ${tx.type}">
          ${tx.type === 'income' ? '+' : '-'}${formatCurrency(tx.amount)}
        </td>
        <td class="text-center actions-cell">
          <button class="btn btn-ghost btn-sm btn-edit"
                  data-id="${escapeHtml(tx.id)}" aria-label="Edit transaction">Edit</button>
          <button class="btn btn-danger btn-sm btn-delete"
                  data-id="${escapeHtml(tx.id)}" aria-label="Delete transaction">Delete</button>
        </td>
      </tr>`
    )
    .join('');
}

// ── Charts ────────────────────────────────────────────────────────────────────

function renderCharts() {
  // Bar chart: last 6 months
  const barCanvas = document.getElementById('bar-chart');
  const barLegend = document.getElementById('bar-chart-legend');
  const months    = getMonthsBack(6);
  const barData   = months.map((ym) => {
    const { income, expenses } = getMonthlyTotals(ym);
    return { month: formatYearMonth(ym), income, expenses };
  });
  renderBarChart(barCanvas, barData, barLegend);

  // Pie chart: current month category breakdown
  const pieCanvas = document.getElementById('pie-chart');
  const pieLegend = document.getElementById('pie-chart-legend');
  const totals    = getCategoryTotals(getCurrentMonth());
  const pieData   = Object.entries(totals).map(([label, value]) => ({ label, value }));
  renderPieChart(pieCanvas, pieData, pieLegend);
}

// ── Budgets ───────────────────────────────────────────────────────────────────

function renderBudgets() {
  const budgets       = getBudgets();
  const categorySpend = getCategoryTotals(getCurrentMonth());
  const grid          = document.getElementById('budgets-grid');

  if (Object.keys(budgets).length === 0) {
    grid.innerHTML =
      '<div class="empty-state card">No budgets set. Click "Set Budget" to add one.</div>';
    return;
  }

  grid.innerHTML = Object.entries(budgets)
    .map(([category, limit]) => {
      const spent     = categorySpend[category] ?? 0;
      const pct       = Math.min((spent / limit) * 100, 100).toFixed(1);
      const over      = spent > limit;
      const remaining = limit - spent;

      return `
      <div class="card budget-card">
        <div class="budget-header">
          <h3 class="budget-category">${escapeHtml(category)}</h3>
          <button class="btn btn-ghost btn-sm btn-remove-budget"
                  data-category="${escapeHtml(category)}"
                  aria-label="Remove budget for ${escapeHtml(category)}">Remove</button>
        </div>
        <div class="budget-amounts">
          <span class="budget-spent${over ? ' over' : ''}">${formatCurrency(spent)} spent</span>
          <span class="budget-limit">of ${formatCurrency(limit)}</span>
        </div>
        <div class="progress-bar-track">
          <div class="progress-bar-fill${over ? ' over' : ''}" style="width:${pct}%"></div>
        </div>
        <div class="budget-remaining${over ? ' over' : ''}">
          ${over
            ? `${formatCurrency(spent - limit)} over budget`
            : `${formatCurrency(remaining)} remaining`}
        </div>
      </div>`;
    })
    .join('');
}

// ── Transaction modal helpers ─────────────────────────────────────────────────

function updateTxCategorySelect(type) {
  const typeEl = document.getElementById('tx-type');
  const catEl  = document.getElementById('tx-category');
  populateCategorySelect(catEl, type ?? typeEl.value);
}

function openAddTransactionModal(triggerEl) {
  editingTransactionId = null;
  transactionModal.setTitle('Add Transaction');

  // Reset form, then set sensible defaults
  document.getElementById('form-transaction').reset();
  document.getElementById('edit-transaction-id').value = '';
  document.getElementById('tx-date').value = todayISO();
  updateTxCategorySelect('expense');
  transactionModal.clearErrors('form-errors');

  transactionModal.open(triggerEl);
}

function openEditTransactionModal(id, triggerEl) {
  const tx = getTransactionById(id);
  if (!tx) {
    showToast('Transaction not found.', 'error');
    return;
  }

  editingTransactionId = id;
  transactionModal.setTitle('Edit Transaction');
  transactionModal.clearErrors('form-errors');

  document.getElementById('edit-transaction-id').value = tx.id;
  document.getElementById('tx-type').value             = tx.type;
  updateTxCategorySelect(tx.type);
  document.getElementById('tx-category').value    = tx.category;
  document.getElementById('tx-amount').value      = tx.amount;
  document.getElementById('tx-description').value = tx.description;
  document.getElementById('tx-date').value         = tx.date;

  transactionModal.open(triggerEl);
}

function handleTransactionSubmit(e) {
  e.preventDefault();

  const data = {
    type:        document.getElementById('tx-type').value,
    amount:      document.getElementById('tx-amount').value,
    description: document.getElementById('tx-description').value,
    category:    document.getElementById('tx-category').value,
    date:        document.getElementById('tx-date').value,
  };

  const { valid, errors } = validateTransaction(data);
  if (!valid) {
    transactionModal.showErrors(errors, 'form-errors');
    return;
  }

  if (editingTransactionId) {
    updateTransaction(editingTransactionId, data);
    showToast('Transaction updated.', 'success');
  } else {
    addTransaction(data);
    showToast('Transaction added.', 'success');
  }

  transactionModal.close();
  refresh();
}

// ── Budget modal helpers ──────────────────────────────────────────────────────

function openBudgetModal(triggerEl) {
  document.getElementById('form-budget').reset();
  populateBudgetCategorySelect();
  budgetModal.clearErrors('budget-form-errors');
  budgetModal.open(triggerEl);
}

function handleBudgetSubmit(e) {
  e.preventDefault();

  const data = {
    category: document.getElementById('budget-category').value,
    limit:    document.getElementById('budget-limit').value,
  };

  const { valid, errors } = validateBudget(data);
  if (!valid) {
    budgetModal.showErrors(errors, 'budget-form-errors');
    return;
  }

  setBudget(data.category, parseFloat(data.limit));
  showToast(`Budget set for ${data.category}.`, 'success');
  budgetModal.close();
  renderBudgets();
}

// ── Export / Import ───────────────────────────────────────────────────────────

function handleExport() {
  const json = exportData();
  const blob = new Blob([json], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `finance-tracker-${getCurrentMonth()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Data exported successfully.', 'success');
}

function handleImport(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (evt) => {
    const result = importData(evt.target.result);
    if (result.success) {
      showToast(result.message, 'success');
      refresh();
    } else {
      showToast(result.message, 'error');
    }
  };
  reader.readAsText(file);

  // Reset input so the same file can be re-imported
  e.target.value = '';
}

// ── Filter helpers ────────────────────────────────────────────────────────────

function syncFiltersFromDOM() {
  filters.category = document.getElementById('filter-category').value;
  filters.type     = document.getElementById('filter-type').value;
  filters.dateFrom = document.getElementById('filter-date-from').value;
  filters.dateTo   = document.getElementById('filter-date-to').value;
  filters.sort     = document.getElementById('filter-sort').value;
}

function clearFilters() {
  filters.category = '';
  filters.type     = '';
  filters.dateFrom = '';
  filters.dateTo   = '';
  filters.sort     = 'date-desc';

  document.getElementById('filter-category').value  = '';
  document.getElementById('filter-type').value      = '';
  document.getElementById('filter-date-from').value = '';
  document.getElementById('filter-date-to').value   = '';
  document.getElementById('filter-sort').value      = 'date-desc';

  renderTransactions();
}

// ── Refresh active section ────────────────────────────────────────────────────

function refresh() {
  renderSection(activeSection);
}

// ── Initialization ────────────────────────────────────────────────────────────

function init() {
  // Populate category dropdowns
  populateFilterCategories();
  populateBudgetCategorySelect();
  updateTxCategorySelect('expense');

  // ── Navigation ──────────────────────────────────────────────────────────────
  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => showSection(btn.dataset.section));
  });

  document.getElementById('view-all-btn').addEventListener('click', () => {
    showSection('transactions');
  });

  // ── Transaction modal triggers ───────────────────────────────────────────────
  document.getElementById('btn-add-transaction').addEventListener('click', (e) => {
    openAddTransactionModal(e.currentTarget);
  });

  document.getElementById('btn-add-transaction-2').addEventListener('click', (e) => {
    openAddTransactionModal(e.currentTarget);
  });

  // Update category options when transaction type changes
  document.getElementById('tx-type').addEventListener('change', () => updateTxCategorySelect());

  // Transaction form submit
  document.getElementById('form-transaction').addEventListener('submit', handleTransactionSubmit);

  // ── Transaction table: edit / delete (event delegation) ─────────────────────
  document.getElementById('transactions-tbody').addEventListener('click', (e) => {
    const editBtn   = e.target.closest('.btn-edit');
    const deleteBtn = e.target.closest('.btn-delete');

    if (editBtn) {
      openEditTransactionModal(editBtn.dataset.id, editBtn);
    } else if (deleteBtn) {
      const id = deleteBtn.dataset.id;
      if (window.confirm('Delete this transaction? This cannot be undone.')) {
        deleteTransaction(id);
        showToast('Transaction deleted.', 'info');
        renderTransactions();
      }
    }
  });

  // ── Filter controls ─────────────────────────────────────────────────────────
  ['filter-category', 'filter-type', 'filter-date-from', 'filter-date-to', 'filter-sort'].forEach((id) => {
    document.getElementById(id).addEventListener('change', () => {
      syncFiltersFromDOM();
      renderTransactions();
    });
  });

  document.getElementById('btn-clear-filters').addEventListener('click', clearFilters);

  // ── Budget modal trigger ─────────────────────────────────────────────────────
  document.getElementById('btn-set-budget').addEventListener('click', (e) => {
    openBudgetModal(e.currentTarget);
  });

  document.getElementById('form-budget').addEventListener('submit', handleBudgetSubmit);

  // Budget removal (event delegation on the budgets grid)
  document.getElementById('budgets-grid').addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-remove-budget');
    if (!btn) return;
    const category = btn.dataset.category;
    if (window.confirm(`Remove the budget for "${category}"?`)) {
      removeBudget(category);
      showToast(`Budget for ${category} removed.`, 'info');
      renderBudgets();
    }
  });

  // ── Export / Import ─────────────────────────────────────────────────────────
  document.getElementById('btn-export').addEventListener('click', handleExport);

  document.getElementById('btn-import-trigger').addEventListener('click', () => {
    document.getElementById('import-file').click();
  });

  document.getElementById('import-file').addEventListener('change', handleImport);

  // ── Initial render ──────────────────────────────────────────────────────────
  renderDashboard();
}

document.addEventListener('DOMContentLoaded', init);
