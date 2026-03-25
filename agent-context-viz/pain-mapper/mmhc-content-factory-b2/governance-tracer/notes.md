# Governance Tracer — Build Notes

## Candidates Considered
1. **Visual Decision Tracer** [SELECTED] — Map risk tier decisions through governance stack, show velocity/gates/effectiveness
2. **Polymarket Position Flow** — Timeline of 5 merged positions. Eliminated: one-time retrospective, trading paused, low reuse
3. **Sub-Agent Spawn Tracker** — Parse session spawns by model/cost/outcome. Eliminated: overlaps Decision Analyzer built March 5

## Build Plan
- Parse `logs/actions.log` for all LOW/MED/HIGH entries
- Parse `logs/gates/` for APPROVE gate records
- Timeline visualization: X=date, Y=tier, size=duration/cost
- Metrics: decision velocity by tier, gate utilization rate, failure correlation
- Interactive filters: tier, date range, file changed

## Initial Output Review (3:13 AM)
- ✅ Dashboard renders in browser (dark theme, responsive)
- ✅ Demo mode works — 120 synthetic records with proper distribution
- ✅ Parser handles real actions.log (50 entries) correctly
- ✅ Timeline visualization displays bubbles by tier with color coding
- ✅ Metrics panel calculates velocity, gate rate, failure correlation
- ✅ Filters functional (date range, tier checkboxes, outcome, search)
- ✅ Cost histogram renders (though most entries missing cost field)

**Evidence:** Loaded actual actions.log (50 entries) via file picker. Timeline populated, metrics calculated (3.17 decisions/day overall, LOW 2.05/day, MED 0.95/day, HIGH 0.16/day over 15.78 days). No JavaScript errors in console.

## Weaknesses Identified
1. **Gate effectiveness unmeasured** — Dashboard shows gate RATE (% of HIGH actions hitting APPROVE) but not EFFECTIVENESS (did gates prevent bad outcomes?). Need: cross-reference gated actions with actual gate approval records + show "prevented failures" metric.

2. **No approval latency insight** — Metrics show decision velocity but not WHERE the time goes. For HIGH decisions with APPROVE gate: request timestamp vs approval timestamp = Steven's review time. This is the bottleneck metric that matters.

3. **Cost histogram low signal** — Most actions lack cost field. Histogram is sparse. Better: remove cost histogram, replace with "actions by hour of day" heatmap (when do decisions cluster?).

## Iterate Cycle 1 (starting 3:15 AM)
**Target weakness:** #2 (approval latency). Add metric showing gate approval time.

**Approach:** Parse gates/ directory, match request-HASH.json with approval-HASH.json by hash, calculate time delta, show in metrics panel as "Avg gate approval time" with min/max/p50/p95.

**Why this one:** Actionable. If avg approval time is 48 hours, Steven knows the system is blocking work. If it's 12 minutes, gates are effective and low-friction. This is the "am I slowing things down?" question the dashboard should answer.
