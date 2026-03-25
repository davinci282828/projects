/**
 * charts.js — Canvas-based chart rendering.
 * Implements a pie chart for category breakdown and a grouped bar chart
 * for monthly income vs expenses. No external libraries used.
 */

// ── Color palette ─────────────────────────────────────────────────────────────

const PALETTE = [
  '#4FC3F7', // accent blue
  '#EF5350', // red
  '#66BB6A', // green
  '#FFA726', // orange
  '#AB47BC', // purple
  '#26C6DA', // teal
  '#FF7043', // deep orange
  '#8D6E63', // brown
  '#78909C', // blue grey
  '#EC407A', // pink
];

const INCOME_COLOR  = '#66BB6A';
const EXPENSE_COLOR = '#EF5350';

// ── Shared drawing utilities ──────────────────────────────────────────────────

/**
 * Set up a canvas for high-DPI (retina) rendering.
 * @param {HTMLCanvasElement} canvas
 * @param {number} width  - CSS width in px
 * @param {number} height - CSS height in px
 * @returns {CanvasRenderingContext2D}
 */
function setupCanvas(canvas, width, height) {
  const dpr = window.devicePixelRatio || 1;
  canvas.width  = width  * dpr;
  canvas.height = height * dpr;
  canvas.style.width  = `${width}px`;
  canvas.style.height = `${height}px`;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  return ctx;
}

/**
 * Draw rounded rectangle.
 */
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ── Pie / Donut Chart ─────────────────────────────────────────────────────────

/**
 * Render a donut chart on the given canvas element.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {Array<{ label: string, value: number }>} data
 * @param {HTMLElement|null} legendContainer - optional element to render legend
 * @param {{ width?: number, height?: number }} [opts]
 */
export function renderPieChart(canvas, data, legendContainer = null, opts = {}) {
  const W = opts.width  ?? parseInt(canvas.getAttribute('width'))  ?? 300;
  const H = opts.height ?? parseInt(canvas.getAttribute('height')) ?? 220;
  const ctx = setupCanvas(canvas, W, H);

  ctx.clearRect(0, 0, W, H);

  const total = data.reduce((s, d) => s + d.value, 0);

  if (!data.length || total === 0) {
    ctx.fillStyle = '#606080';
    ctx.font = '14px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('No expense data this month', W / 2, H / 2);
    if (legendContainer) legendContainer.innerHTML = '';
    return;
  }

  const cx = W / 2;
  const cy = H / 2;
  const outerR = Math.min(cx, cy) - 10;
  const innerR = outerR * 0.52; // donut hole

  // Draw slices
  let startAngle = -Math.PI / 2;

  data.forEach((slice, i) => {
    const sweep = (slice.value / total) * 2 * Math.PI;
    const color = PALETTE[i % PALETTE.length];

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, outerR, startAngle, startAngle + sweep);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    // subtle gap between slices
    ctx.strokeStyle = '#0f0f23';
    ctx.lineWidth = 2;
    ctx.stroke();

    startAngle += sweep;
  });

  // Draw inner circle (donut hole)
  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, 2 * Math.PI);
  ctx.fillStyle = '#1e1e40';
  ctx.fill();

  // Center text: total
  ctx.fillStyle = '#e0e0e0';
  ctx.font = `bold 15px -apple-system, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(total),
    cx,
    cy - 6
  );
  ctx.fillStyle = '#a0a0c0';
  ctx.font = '10px -apple-system, sans-serif';
  ctx.fillText('Total Expenses', cx, cy + 10);

  // Render legend
  if (legendContainer) {
    legendContainer.innerHTML = data
      .map((slice, i) => {
        const color = PALETTE[i % PALETTE.length];
        const pct   = ((slice.value / total) * 100).toFixed(1);
        const fmt   = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(slice.value);
        return `
          <div class="legend-item">
            <span class="legend-dot" style="background:${color}"></span>
            <span class="legend-label">${slice.label}</span>
            <span class="legend-value">${fmt} <span style="color:#606080">(${pct}%)</span></span>
          </div>`;
      })
      .join('');
  }
}

// ── Bar Chart ─────────────────────────────────────────────────────────────────

/**
 * Render a grouped bar chart for monthly income vs expenses.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {Array<{ month: string, income: number, expenses: number }>} data
 *   month is a display string like "Jan '24"
 * @param {HTMLElement|null} legendContainer
 * @param {{ width?: number, height?: number }} [opts]
 */
export function renderBarChart(canvas, data, legendContainer = null, opts = {}) {
  const W = opts.width  ?? parseInt(canvas.getAttribute('width'))  ?? 560;
  const H = opts.height ?? parseInt(canvas.getAttribute('height')) ?? 300;
  const ctx = setupCanvas(canvas, W, H);

  ctx.clearRect(0, 0, W, H);

  if (!data || data.length === 0) {
    ctx.fillStyle = '#606080';
    ctx.font = '14px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('No data to display', W / 2, H / 2);
    return;
  }

  const PADDING_LEFT   = 70;
  const PADDING_RIGHT  = 20;
  const PADDING_TOP    = 20;
  const PADDING_BOTTOM = 55;

  const chartW = W - PADDING_LEFT - PADDING_RIGHT;
  const chartH = H - PADDING_TOP  - PADDING_BOTTOM;

  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.income, d.expenses)),
    1
  );

  // Nice round ceiling for Y-axis
  const yMax   = niceMax(maxVal);
  const ySteps = 5;
  const yStep  = yMax / ySteps;

  // Draw gridlines and Y-axis labels
  ctx.strokeStyle = '#2a2a55';
  ctx.lineWidth   = 1;
  ctx.fillStyle   = '#606080';
  ctx.font        = '11px -apple-system, sans-serif';
  ctx.textAlign   = 'right';
  ctx.textBaseline = 'middle';

  for (let i = 0; i <= ySteps; i++) {
    const val = i * yStep;
    const y   = PADDING_TOP + chartH - (val / yMax) * chartH;

    ctx.beginPath();
    ctx.moveTo(PADDING_LEFT, y);
    ctx.lineTo(PADDING_LEFT + chartW, y);
    ctx.stroke();

    ctx.fillText(
      formatK(val),
      PADDING_LEFT - 8,
      y
    );
  }

  // Draw bars
  const groupW    = chartW / data.length;
  const barPad    = groupW * 0.12;
  const barW      = (groupW - barPad * 2 - 4) / 2;

  data.forEach((d, i) => {
    const gx = PADDING_LEFT + i * groupW + barPad;

    // Income bar
    const incomeH = (d.income / yMax) * chartH;
    const incomeX = gx;
    const incomeY = PADDING_TOP + chartH - incomeH;

    ctx.fillStyle = INCOME_COLOR;
    roundRect(ctx, incomeX, incomeY, barW, incomeH, 3);
    ctx.fill();

    // Expense bar
    const expH = (d.expenses / yMax) * chartH;
    const expX = gx + barW + 4;
    const expY = PADDING_TOP + chartH - expH;

    ctx.fillStyle = EXPENSE_COLOR;
    roundRect(ctx, expX, expY, barW, expH, 3);
    ctx.fill();

    // X-axis label (month)
    ctx.fillStyle   = '#a0a0c0';
    ctx.font        = '11px -apple-system, sans-serif';
    ctx.textAlign   = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(d.month, PADDING_LEFT + i * groupW + groupW / 2, PADDING_TOP + chartH + 10);
  });

  // X-axis baseline
  ctx.beginPath();
  ctx.strokeStyle = '#333366';
  ctx.lineWidth   = 1;
  ctx.moveTo(PADDING_LEFT, PADDING_TOP + chartH);
  ctx.lineTo(PADDING_LEFT + chartW, PADDING_TOP + chartH);
  ctx.stroke();

  // Legend
  if (legendContainer) {
    legendContainer.innerHTML = `
      <div class="legend-item">
        <span class="legend-dot" style="background:${INCOME_COLOR}"></span>
        <span class="legend-label">Income</span>
      </div>
      <div class="legend-item">
        <span class="legend-dot" style="background:${EXPENSE_COLOR}"></span>
        <span class="legend-label">Expenses</span>
      </div>`;
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Round up to a "nice" ceiling for chart Y-axis.
 * @param {number} val
 * @returns {number}
 */
function niceMax(val) {
  if (val <= 0) return 100;
  const magnitude = Math.pow(10, Math.floor(Math.log10(val)));
  const ratio = val / magnitude;
  let nice;
  if      (ratio <= 1)  nice = 1;
  else if (ratio <= 2)  nice = 2;
  else if (ratio <= 5)  nice = 5;
  else                  nice = 10;
  return nice * magnitude * 1.1; // add 10% headroom
}

/**
 * Format large numbers compactly for axis labels.
 * @param {number} val
 * @returns {string}
 */
function formatK(val) {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000)     return `$${(val / 1_000).toFixed(val % 1000 === 0 ? 0 : 1)}k`;
  return `$${Math.round(val)}`;
}

/**
 * Export the PALETTE so other modules can use category colors consistently.
 */
export { PALETTE };
