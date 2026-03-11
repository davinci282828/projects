# Session Timeline — Build Notes

## Candidates Considered
1. **Context Dilution Visualizer** — diagnostic tool showing when RAG pulls noise vs signal
   - ELIMINATED: Reactive, not proactive. Shows problems after they happen.
2. **Session Timeline** — visual history of agent knowledge across sessions
   - SELECTED: Proactive value, addresses trust/debugging, fills a real gap.
3. **Memory Leak Detector** — finds stale/redundant memory entries
   - ELIMINATED: Too inward-facing. Only helps operators, not end users.

## Pain Point Validation
- Reddit signal: 9 relevant results
- "I gave Gemini a brain. 1,073 sessions" — 262pts 216 comments
- "four-layer RAG memory system" (multiple posts) — solving context dilution
- Reality signal: 0 (green light — no existing solutions)

## Target User
Agent operators who need to:
- Debug: "Why did it forget X?"
- Audit: "What does it know about me?"
- Trust: "How consistent is its memory across sessions?"

## Core Features (V1)
1. Parse memory/daily/*.md files
2. Extract timestamped entries (supports [TAG] format)
3. Timeline view: chronological, filterable by tag type
4. Search: keyword highlighting
5. Session boundaries: visual markers for each file/session
6. Drag-drop file loading (no server needed)

## Build Plan
1. Codex: Initial build with timeline UI + parser ✅
2. Review: Load actual daily logs, check parsing accuracy (IN PROGRESS)
3. Iterate: Fix the top weakness (likely: tag extraction or timeline UX)

## Build Timeline
- 03:01 AM: Start time
- 03:04 AM: Codex build complete (185s)
- 03:07 AM: Files transferred, browser opened for review

## Codex Invocation
✅ Initial build complete — 1104 lines HTML, 32KB
❌ Explainer generation failed (Venice Llama 3.3 70B + GPT-5.2 both failed)

## Review 1 — Parser Testing (03:10 AM)

**Loaded actual memory files:** `memory/daily/2026-03-03.md`

**Format used in actual logs:**
```
### [2026-03-03 02:15 AM] — Self-Improvement Loop
...
### 08:53 — Correction
[CORRECTION] Suggested switching...
```

**Weakness #1: Heading format mismatch**
- Tool expects: `[YYYY-MM-DD HH:MM] [TAG] text` (bracket-wrapped on same line)
- Actual format: `### [YYYY-MM-DD HH:MM AM/PM] — Section Title` (markdown heading with AM/PM)
- Tags appear inline in body text (`[CORRECTION]`, `[DECISION]`), not in heading
- Tool will likely miss most entries

**Weakness #2: No AM/PM support**
- Parser expects 24-hour time or bare dates
- Logs use 12-hour with AM/PM suffix

**Weakness #3: Session markers based on filename**
- Files are named `YYYY-MM-DD.md`, which is fine
- But entries within a file may span multiple sessions (early morning vs afternoon)
- No visual way to distinguish multiple sessions within one daily file

## Next Iteration Target
Fix parser to handle:
1. Markdown heading format (`###`)
2. AM/PM time parsing
3. Inline tags in body (scan for `[WORD]` patterns after timestamp)
