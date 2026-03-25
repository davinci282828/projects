const fileInput = document.getElementById('logFile');
const analyzeBtn = document.getElementById('analyzeBtn');
const statusEl = document.getElementById('status');
const heatmapEl = document.getElementById('heatmap');
const repeatedReadsEl = document.getElementById('repeatedReads');
const memoryPatternsEl = document.getElementById('memoryPatterns');
const recommendationsEl = document.getElementById('recommendations');
const exportBtn = document.getElementById('exportBtn');
const contextLimitEl = document.getElementById('contextLimit');
const saturationSummaryEl = document.getElementById('saturationSummary');

let rawText = '';
let analysisCache = null;
let timelineChart = null;
let contextChart = null;

fileInput.addEventListener('change', async (event) => {
  const file = event.target.files?.[0];
  if (!file) {
    analyzeBtn.disabled = true;
    statusEl.textContent = 'No file selected.';
    return;
  }

  rawText = await file.text();
  analyzeBtn.disabled = false;
  statusEl.textContent = `Loaded ${file.name}. Ready to analyze.`;
});

analyzeBtn.addEventListener('click', () => {
  if (!rawText.trim()) {
    statusEl.textContent = 'The selected file is empty.';
    return;
  }

  const parsed = parseJsonl(rawText);
  if (parsed.errors.length > 0) {
    statusEl.textContent = `Parsed with ${parsed.errors.length} malformed line(s) ignored. Entries used: ${parsed.entries.length}.`;
  } else {
    statusEl.textContent = `Parsed ${parsed.entries.length} entries successfully.`;
  }

  if (parsed.entries.length === 0) {
    clearOutputs('No valid entries found in file.');
    return;
  }

  const contextLimit = Number(contextLimitEl.value) || 200000;
  analysisCache = analyzeEntries(parsed.entries, contextLimit);
  renderAll(analysisCache);
  exportBtn.disabled = false;
});

exportBtn.addEventListener('click', () => {
  if (!analysisCache) return;

  const body = [
    'Agent Context Visualizer Recommendations',
    `Generated: ${new Date().toISOString()}`,
    '',
    ...analysisCache.recommendations.map((r, i) => `${i + 1}. ${r}`),
  ].join('\n');

  const blob = new Blob([body], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'token-optimization-recommendations.txt';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

function clearOutputs(message) {
  heatmapEl.innerHTML = `<p class="empty">${message}</p>`;
  repeatedReadsEl.innerHTML = `<p class="empty">${message}</p>`;
  memoryPatternsEl.innerHTML = `<p class="empty">${message}</p>`;
  recommendationsEl.innerHTML = '';
  saturationSummaryEl.textContent = '';

  if (timelineChart) {
    timelineChart.destroy();
    timelineChart = null;
  }
  if (contextChart) {
    contextChart.destroy();
    contextChart = null;
  }
}

function parseJsonl(text) {
  const lines = text.split(/\r?\n/);
  const entries = [];
  const errors = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line) continue;
    try {
      const obj = JSON.parse(line);
      entries.push(obj);
    } catch (err) {
      errors.push({ line: i + 1, error: String(err) });
    }
  }

  entries.sort((a, b) => {
    const ta = Date.parse(a.timestamp || 0);
    const tb = Date.parse(b.timestamp || 0);
    return ta - tb;
  });

  return { entries, errors };
}

function analyzeEntries(entries, contextLimit) {
  const tokenSeries = [];
  const contextSeries = [];
  const labels = [];
  const fileStats = new Map();
  const repeatedReads = [];
  const memoryWrites = [];

  let cumulativeTokens = 0;

  entries.forEach((entry, idx) => {
    const inputTokens = Number(entry?.tokens?.input) || 0;
    const outputTokens = Number(entry?.tokens?.output) || 0;
    const eventTokens = inputTokens + outputTokens;
    cumulativeTokens += eventTokens;

    const label = shortLabel(entry, idx);
    labels.push(label);
    tokenSeries.push(eventTokens);

    const contextUsed = inputTokens > 0 ? inputTokens : Math.max(0, Math.round(eventTokens * 0.65));
    contextSeries.push(Math.min(100, (contextUsed / contextLimit) * 100));

    if (isReadEvent(entry)) {
      const path = getPath(entry);
      if (path) {
        const current = fileStats.get(path) || { path, reads: 0, tokens: 0 };
        current.reads += 1;
        current.tokens += eventTokens;
        fileStats.set(path, current);
      }
    }

    if (isWriteEvent(entry)) {
      const path = getPath(entry);
      if (path && /(MEMORY\.md|\.claude\/|memories\/|memory\/)/i.test(path)) {
        memoryWrites.push({ path, timestamp: entry.timestamp || 'unknown time' });
      }
    }
  });

  fileStats.forEach((value) => {
    if (value.reads >= 3) repeatedReads.push(value);
  });

  const spikes = detectSpikes(tokenSeries);
  const cumulativeSeries = buildCumulative(tokenSeries);

  const padded = ensureMinimumPoints({
    labels,
    tokenSeries,
    cumulativeSeries,
    contextSeries,
    spikes,
    minPoints: 10,
  });

  const maxSaturation = Math.max(...padded.contextSeries, 0);
  const saturationText = `Peak estimated saturation: ${maxSaturation.toFixed(1)}% of selected context window (${contextLimit.toLocaleString()} tokens).`;

  const recommendations = generateRecommendations({
    repeatedReads,
    fileStats: [...fileStats.values()],
    spikes,
    maxSaturation,
    memoryWrites,
  });

  return {
    labels: padded.labels,
    tokenSeries: padded.tokenSeries,
    cumulativeSeries: padded.cumulativeSeries,
    contextSeries: padded.contextSeries,
    spikes: padded.spikes,
    files: [...fileStats.values()].sort((a, b) => b.tokens - a.tokens),
    repeatedReads: repeatedReads.sort((a, b) => b.reads - a.reads),
    memoryWrites,
    recommendations,
    saturationText,
  };
}

function renderAll(data) {
  renderTimeline(data);
  renderContextChart(data);
  renderHeatmap(data.files);
  renderRepeatedReads(data.repeatedReads);
  renderMemoryPatterns(data.memoryWrites);
  renderRecommendations(data.recommendations);
  saturationSummaryEl.textContent = data.saturationText;
}

function renderTimeline(data) {
  const ctx = document.getElementById('timelineChart');
  if (timelineChart) timelineChart.destroy();

  const spikePoints = data.spikes.map((idx) => ({ x: data.labels[idx], y: data.tokenSeries[idx] }));

  timelineChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.labels,
      datasets: [
        {
          label: 'Tokens per event',
          data: data.tokenSeries,
          borderColor: '#58a6ff',
          backgroundColor: 'rgba(88, 166, 255, 0.18)',
          fill: true,
          tension: 0.23,
          pointRadius: 2,
        },
        {
          label: 'Cumulative tokens',
          data: data.cumulativeSeries,
          borderColor: '#2ea043',
          backgroundColor: 'rgba(46, 160, 67, 0.10)',
          fill: false,
          tension: 0.15,
          pointRadius: 1,
          yAxisID: 'y1',
        },
        {
          label: 'Major spikes',
          data: spikePoints,
          parsing: false,
          showLine: false,
          pointBackgroundColor: '#ff6b6b',
          pointBorderColor: '#ff6b6b',
          pointRadius: 5,
        },
      ],
    },
    options: {
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { labels: { color: '#e6edf3' } },
      },
      scales: {
        x: { ticks: { color: '#8b949e', maxTicksLimit: 12 }, grid: { color: 'rgba(139,148,158,0.08)' } },
        y: { ticks: { color: '#8b949e' }, grid: { color: 'rgba(139,148,158,0.10)' }, beginAtZero: true },
        y1: {
          position: 'right',
          ticks: { color: '#8b949e' },
          grid: { drawOnChartArea: false },
          beginAtZero: true,
        },
      },
    },
  });
}

function renderContextChart(data) {
  const ctx = document.getElementById('contextChart');
  if (contextChart) contextChart.destroy();

  contextChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.labels,
      datasets: [
        {
          label: 'Context saturation %',
          data: data.contextSeries,
          borderColor: '#f2cc60',
          backgroundColor: 'rgba(242, 204, 96, 0.15)',
          fill: true,
          tension: 0.2,
          pointRadius: 1.8,
        },
      ],
    },
    options: {
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#e6edf3' } },
      },
      scales: {
        x: {
          ticks: { color: '#8b949e', maxTicksLimit: 12 },
          grid: { color: 'rgba(139,148,158,0.08)' },
        },
        y: {
          min: 0,
          max: 100,
          ticks: {
            color: '#8b949e',
            callback: (value) => `${value}%`,
          },
          grid: { color: 'rgba(139,148,158,0.10)' },
        },
      },
    },
  });
}

function renderHeatmap(files) {
  if (files.length === 0) {
    heatmapEl.innerHTML = '<p class="empty">No file read events detected.</p>';
    return;
  }

  const maxReads = Math.max(...files.map((f) => f.reads), 1);

  heatmapEl.innerHTML = files
    .map((f) => {
      const intensity = Math.max(8, Math.round((f.reads / maxReads) * 100));
      return `
      <article class="heat-cell" style="box-shadow: inset 0 0 0 1px rgba(88,166,255,0.25), 0 0 0 1px rgba(88,166,255,${intensity / 300});">
        <div class="file-path">${escapeHtml(f.path)}</div>
        <div class="meter"><div class="fill" style="width:${intensity}%;"></div></div>
        <div class="meta">Reads: ${f.reads} • Token cost: ${f.tokens.toLocaleString()}</div>
      </article>`;
    })
    .join('');
}

function renderRepeatedReads(repeated) {
  if (repeated.length === 0) {
    repeatedReadsEl.innerHTML = '<p class="empty">No files crossed the repeated-read threshold (3+ reads).</p>';
    return;
  }

  repeatedReadsEl.innerHTML = `
    <ul class="repeated-list">
      ${repeated
        .map(
          (f) =>
            `<li><strong>${escapeHtml(f.path)}</strong> <span class="flag">repeated read</span> — ${f.reads} reads, ${f.tokens.toLocaleString()} tokens</li>`
        )
        .join('')}
    </ul>
  `;
}

function renderMemoryPatterns(writes) {
  if (writes.length === 0) {
    memoryPatternsEl.innerHTML = '<p class="memory-none">No persistent memory detected</p><p class="subtle">No writes to MEMORY.md or .claude/ paths were found, so the agent likely relied only on transient in-session context.</p>';
    return;
  }

  memoryPatternsEl.innerHTML = `
    <p>Persistent memory writes detected (${writes.length}):</p>
    <ul class="memory-list">
      ${writes.map((w) => `<li>${escapeHtml(w.path)} at ${escapeHtml(w.timestamp)}</li>`).join('')}
    </ul>
  `;
}

function renderRecommendations(recommendations) {
  recommendationsEl.innerHTML = recommendations.map((r) => `<li>${escapeHtml(r)}</li>`).join('');
}

function generateRecommendations({ repeatedReads, fileStats, spikes, maxSaturation, memoryWrites }) {
  const recs = [];

  if (repeatedReads.length > 0) {
    const top = repeatedReads[0];
    recs.push(
      `Cache and summarize ${top.path} once per session, then reference the summary; it was re-read ${top.reads} times for ${top.tokens.toLocaleString()} tokens.`
    );
  }

  if (spikes.length > 0) {
    recs.push(
      'Investigate spike events and replace full-file reads with targeted range reads or symbol-level retrieval to flatten token bursts.'
    );
  }

  if (maxSaturation >= 85) {
    recs.push(
      `Your context pressure peaked at ${maxSaturation.toFixed(1)}%; prune stale conversation turns and pin concise working notes to avoid truncation risk.`
    );
  }

  if (memoryWrites.length === 0) {
    recs.push(
      'Enable persistent memory writes (for example MEMORY.md or .claude/ notes) so future sessions start with stable project context instead of re-reading core files.'
    );
  }

  if (fileStats.length > 10) {
    recs.push(
      `You touched ${fileStats.length} files via read tools; introduce a project map file (entry points, ownership, key exports) to reduce exploratory reads.`
    );
  }

  const fallback = [
    'Batch related changes per prompt and ask the agent to produce a plan before opening files to minimize backtracking token spend.',
    'When a large file is necessary, request a compact synopsis first, then drill into only the relevant sections.',
    'Create a small session brief after each milestone (files touched, decisions made, pending tasks) so the next prompt can reuse concise context.',
  ];

  for (const item of fallback) {
    if (recs.length >= 3) break;
    if (!recs.includes(item)) recs.push(item);
  }

  while (recs.length < 3) {
    recs.push('Track token-heavy tools per run and set a read budget before starting implementation.');
  }

  return recs.slice(0, 3);
}

function detectSpikes(series) {
  if (!series.length) return [];
  const mean = series.reduce((sum, n) => sum + n, 0) / series.length;
  const variance = series.reduce((sum, n) => sum + (n - mean) ** 2, 0) / series.length;
  const stdDev = Math.sqrt(variance);
  const threshold = mean + stdDev * 1.5;

  const spikes = [];
  series.forEach((value, idx) => {
    if (value >= threshold && value > 0) spikes.push(idx);
  });

  return spikes;
}

function ensureMinimumPoints({ labels, tokenSeries, cumulativeSeries, contextSeries, spikes, minPoints }) {
  if (labels.length >= minPoints) {
    return { labels, tokenSeries, cumulativeSeries, contextSeries, spikes };
  }

  if (labels.length === 0) {
    const emptyLabels = Array.from({ length: minPoints }, (_, i) => `P${i + 1}`);
    const zeros = Array(minPoints).fill(0);
    return { labels: emptyLabels, tokenSeries: zeros, cumulativeSeries: zeros, contextSeries: zeros, spikes: [] };
  }

  const newLabels = [];
  const newToken = [];
  const newCum = [];
  const newContext = [];

  for (let i = 0; i < minPoints; i += 1) {
    const position = (i * (labels.length - 1)) / (minPoints - 1);
    const low = Math.floor(position);
    const high = Math.ceil(position);
    const t = position - low;

    const token = interpolate(tokenSeries[low], tokenSeries[high], t);
    const cum = interpolate(cumulativeSeries[low], cumulativeSeries[high], t);
    const context = interpolate(contextSeries[low], contextSeries[high], t);

    newLabels.push(labels[low] === labels[high] ? labels[low] : `${labels[low]}→${labels[high]}`);
    newToken.push(Math.round(token));
    newCum.push(Math.round(cum));
    newContext.push(context);
  }

  const remappedSpikes = [];
  if (spikes.length > 0) {
    for (let i = 0; i < minPoints; i += 1) {
      const sourceIndex = Math.round((i * (labels.length - 1)) / (minPoints - 1));
      if (spikes.includes(sourceIndex)) remappedSpikes.push(i);
    }
  }

  return {
    labels: newLabels,
    tokenSeries: newToken,
    cumulativeSeries: newCum,
    contextSeries: newContext,
    spikes: remappedSpikes,
  };
}

function buildCumulative(series) {
  const cumulative = [];
  let run = 0;
  for (const n of series) {
    run += n;
    cumulative.push(run);
  }
  return cumulative;
}

function interpolate(a, b, t) {
  return a + (b - a) * t;
}

function shortLabel(entry, idx) {
  const ts = entry?.timestamp ? new Date(entry.timestamp) : null;
  if (ts && !Number.isNaN(ts.getTime())) {
    const hh = String(ts.getHours()).padStart(2, '0');
    const mm = String(ts.getMinutes()).padStart(2, '0');
    const ss = String(ts.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }

  return `E${idx + 1}`;
}

function isReadEvent(entry) {
  const role = String(entry?.role || '').toLowerCase();
  const name = String(entry?.name || '').toLowerCase();
  return role === 'tool' && /(read|cat|open)/.test(name);
}

function isWriteEvent(entry) {
  const role = String(entry?.role || '').toLowerCase();
  const name = String(entry?.name || '').toLowerCase();
  return role === 'tool' && /(write|edit|append|save)/.test(name);
}

function getPath(entry) {
  return entry?.input?.path || entry?.path || '';
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
