# Decisions Ledger
# Append-only. Never delete or overwrite entries.
# If a decision is reversed, add a NEW entry referencing the old one.

<!-- TEMPLATE:
### [TIMESTAMP]
- **Decision:** [what was decided]
- **Rationale:** [why]
- **Owner:** [who made it]
- **Reversal conditions:** [when to revisit]
- **Supersedes:** [prior decision ID, or "none"]
-->

### 2026-02-18 00:06 ET
- **Decision:** Implement full memory hardening protocol per Steven's Google Drive directive
- **Rationale:** Persistent memory loss during compaction — agent repeatedly listed completed tasks as pending
- **Owner:** Steven (authored directive), Da Vinci (implementing)
- **Reversal conditions:** If memoryFlush causes performance issues or file bloat
- **Supersedes:** Previous ad-hoc write-first rule in AGENTS.md

### 2026-02-18 00:10 ET (TEST)
- **Decision:** Primary database will be PostgreSQL (VERIFICATION TEST)
- **Rationale:** Step 5A test — confirming write-first protocol works
- **Owner:** Da Vinci
- **Reversal conditions:** This is a test entry
- **Supersedes:** none

### 2026-02-19 12:20 — Memory Gap Fix
[DECISION] Added immediate-write rule for decisions: any approval/confirmation from Steven gets written to disk in the same turn, before responding. No more batching.
[DECISION] Context pruning settings (6h TTL, softTrim 0.7) may need adjustment if memory gaps recur. Monitor over next 2-3 days.
[LESSON] Three decisions lost in single compaction gap (SOUL.md activation, OpenAI key status, design approach). Root cause: decisions existed only in conversation context, pruned before flush.

## [2026-02-19] Mem0 Integration Audit Failure — Process Fix
**Decision:** Added mandatory Integration Audit checklist to AGENTS.md (alongside existing security audit). Security audit catches malware; integration audit catches redundancy.
**Rationale:** Installed Mem0 with vendor defaults (autoRecall+autoCapture both ON) without mapping features against existing 6-layer memory stack. Created dual-injection redundancy: two vector search systems, two context injection paths, overlapping fact storage. Steven caught it.
**Root cause:** Sub-agent research was feature-comparison level, not feature-overlap level. Security audit has no integration check. Vendor defaults accepted uncritically.
**Fix applied:** autoRecall=OFF, autoCapture=ON (safety net only). Files remain primary. Added integration audit checklist to AGENTS.md, learned-lesson to SOUL.md.

## [2026-02-19] Three Operational Cron Jobs Added
**Decision:** Added 3 new cron jobs after integration assessment against existing systems.

1. **Daily security audit** (8 AM ET) — Firewall, open ports, SSH config, failed logins, gateway status, disk space, macOS updates. Report-only, no changes. Consolidated firewall check out of heartbeat rotation to avoid duplication.

2. **Session cleanup** (every 5 days) — Deletes `.deleted` session files older than 5 days. Reports browser/media size if large. Low priority, fills gap where no cleanup existed.

3. **Silent backups** (every 2h) — git push workspace to private GitHub repo. BLOCKED pending GitHub auth. Critical — zero off-machine backup exists today. Single point of failure.

**Integration assessment:** Each job checked for overlap with existing systems (contextPruning, compaction, heartbeat checks). Firewall moved from heartbeat to daily audit to avoid duplication. Session cleanup scoped to `.deleted` files only. Backups fill a gap nothing else covers.

## [2026-02-19] Model Tier Architecture Update
[DECISION] Added Gemini 2.5 Pro and GPT-4o to gateway config.
Updated model tiers:
- **Tier 1 (Judgment):** Opus 4.6 — main session, complex decisions, quality gates
- **Tier 2 (Execution):** Sonnet 4 | Gemini 2.5 Pro | GPT-4o — sub-agents, agentic tasks, browser automation
- **Tier 3 (Labor):** Kimi K2.5 | Gemini 2.0 Flash | GPT-4o Mini — heartbeats, simple tasks, data processing
Rationale: Gemini 2.5 Pro dominates agentic benchmarks (BrowseComp 85.9%, MCP Atlas 69.2%). GPT-4o added as backup Tier 2. No OpenAI subscription needed — API covers all use cases.

## [2026-02-19] INTERESTS.md + Nightly Exploration Cron
[DECISION] Created INTERESTS.md (self-evolving curiosity file) and JOURNAL.md (nightly reflections).
Nightly exploration cron (514e2d40) runs at 2 AM ET daily — autonomous creative/research work.
Inspired by @chrysb's OpenClaw setup. Agent picks an interest, builds something, updates the file.
This is NOT productivity time — it's genuine exploration. Artifacts saved to projects/nightly/.

## [2026-02-19] Design Frameworks from X Review
[DECISION] Extracted 2 useful frameworks from @Whizz_ai's prompt collection:
1. Design System Template (projects/design-frameworks/design-system-template.md) — structured attribute checklist
2. Design Critique Checklist (projects/design-frameworks/design-critique-checklist.md) — 10-category /50 point review
Stripped role-play padding, enhanced with our MMHC experience. Use these as standard process, not one-off prompts.

## 2026-02-19 — Excalidraw & aitmpl.com Skills: Skip All
[DECISION] After methodical audit, decided NOT to install any of the following:
- Excalidraw skill (Ryan Quinn's, Yee Fei's, or MCP server) — 80% overlap with HTML+Canvas+Mermaid stack, no active use case, rendering requires excalidraw.com (friction for Steven/Michelle)
- aitmpl.com Claude Code Templates (Analytics, Health Check, Conversation Monitor, Plugin Dashboard) — all Claude Code-specific, incompatible with OpenClaw
- VoltAgent/awesome-openclaw-skills collection — Claude Code conventions, needs adaptation work per skill
Rationale: No capability gaps in current stack. Compatibility check should come before feature comparison. Revisit Excalidraw only if architecture documentation needs grow.

## 2026-02-19 — Two-Timescale Learning Validation
[DECISION] Our experiential SOUL.md approach is theoretically validated by multi-agent cooperation research. The mechanism: fast in-context adaptation (within-session pattern matching) + slow persistent updates (SOUL.md anti-patterns across sessions) = two-timescale learning that produces optimal cooperation. Every Steven correction → anti-pattern entry is the "slow timescale." Every within-session adaptation is the "fast timescale." This isn't just a good practice — it's the theoretically optimal structure for human-agent cooperation.

## 2026-02-19 — Cross-Model Verification (OPEN — NOT YET IMPLEMENTED)
[TASK] Implement cross-model verification for critical sub-agent outputs. The one net-positive architectural change from the OpenClaw hot take analysis. Concept: when a sub-agent completes a HIGH-tier or quality-critical deliverable, run a verification pass through a different model (e.g., sub-agent runs on Sonnet → verification on Gemini 2.5 Pro or GPT-4o). Catches model-specific blind spots. Need to design: trigger criteria, verification prompt template, pass/fail thresholds, cost budget.

## 2026-02-19 — Link/Tool Evaluation Protocol Adopted
[DECISION] Merged Steven's evaluation framework with existing security protocol into a hybrid at `protocols/link-tool-evaluation.md`. Key additions over old approach: (1) Platform compatibility as Step 0 gate, (2) forced NET-NEW/MARGINAL/REDUNDANT verdicts with redundancy %, (3) FILE FOR LATER classification with trigger conditions, (4) integration cost quantified, (5) box-drawing table formatting for Telegram/Slack. Security depth retained from AGENTS.md checklist.

## 2026-02-19 — Link/Tool Evaluation Protocol v2 (5 patches applied)
[DECISION] Self-evaluated 5 proposed patches against the existing protocol. All 5 passed as NET-NEW additions:
1. Version self-check clause (prevents uncritical future upgrades)
2. Workflow friction comparison in Step 2 (templates the ad-hoc analysis that made Excalidraw teardown sharp)
3. Impact ranking CRITICAL/NICE-TO-HAVE/THEORETICAL in Step 1 (prevents 5 theoretical problems outweighing 1 critical)
4. FILE FOR LATER gets 90-day review date + owner (prevents FILE FOREVER)
5. INSTALL gets 7-day trial checkpoint with success/failure criteria + rollback plan (Mem0 would have been caught)
One mod: Patch 4 review date fixed at 90 days (not variable) to reduce decision fatigue.

## 2026-02-19 — Link Assessment Protocol (unified, replaces link-tool-evaluation.md)
[DECISION] Adopted unified protocol at `protocols/link-assessment.md` that handles ALL links (articles, tweets, repos, tools, videos) in one pass. Steps 1-5 run strategic analysis on every link. Step 6 fires conditionally only when something installable surfaces. This replaces the tool-only `link-tool-evaluation.md` (retired).
Key additions over previous protocol: Non-Obvious Angle (Step 2), Conviction Level rating (Step 5), conditional install eval trigger, separation of intel value vs install verdict.
Previous protocol preserved at `link-tool-evaluation.md.retired` for audit trail.

### [2026-02-19] Resilience Protocol v3.2 — Cherry-Pick Only
[DECISION] Steven proposed full Resilience Protocol v3.2 (3 scripts, behavioral doctrine, full health checks). Assessed and narrowed scope:
- **KEPT**: Watchdog/cooldown (crash loop protection), config backup on clean pass, restart JSONL logging, rollback command
- **SKIPPED**: Allowlist enforcement script (redundant — native `plugins.allow` already set), health checks (covered by mac-error-recovery.md + daily security cron), Telegram alert script (OpenClaw routes natively), model check (wrong architecture — our models are per-session not per-config), Mem0 log grep (would false-positive on known sqlite issue)
- **Rationale**: One source of truth per capability. Don't duplicate native features in shell scripts.
- **Script**: `scripts/restart_watchdog.sh` — 4 commands: check, log-restart, rollback, status

### [2026-02-20] Venice AI Research + OpenAI Codex + Claude Code
[DECISION] Three new integrations being evaluated:
1. **OpenAI Codex via subscription** — `openclaw onboard --auth-choice openai-codex` connects ChatGPT Plus ($20/mo) for GPT-5.3 Codex access. Requires Steven's OAuth login (interactive). OpenAI explicitly allows this, unlike Anthropic which bans subscription use in third-party tools.
2. **Venice AI** — Privacy-tier provider for sensitive data. Three access paths: Free (10 prompts/day), Pro ($18/mo), or DIEM token (1 DIEM = $1/day perpetual API credit, currently ~$290/token on Base chain). Steven has some DIEM already.
3. **Claude Code** — Installed (v2.1.49), uses existing Anthropic API key at Sonnet rates.

### 2026-02-20 — Phase 1: Executor State Machine (Architecture v2)

[DECISION] Implemented runtime-enforced state machine for Executor sub-agents per Multi-Model Framework v2 doctrine.
- **Merged** improvements #1 (Agent Loop) and #4 (Step-by-Step Execution) into unified state machine
- **Added** Inter-Agent Contract object for every spawn (objective, constraints, definition of done, rollback policy)
- **Added** token budget ceilings per agent role (Executor ≤1200, Verifier ≤800, Planner ≤2500, Content ≤3000)
- **Scope:** Executor only. Planner/Verifier/Content Agent unchanged until Phase 1 targets met.
- **Enforcement:** Prompt-level + orchestrator post-hoc validation (not true runtime — documented as limitation)
- **Success criteria:** ≥10% success rate, ≥15% cost reduction, ≥25% multi-tool misuse reduction
- **Baseline:** 73% success rate, ~18% retry rate, ~9% escalation rate (from 11 observed sub-agent tasks)
- **Design doc:** `projects/architecture/phase1-executor-state-machine.md`

### 2026-02-20 — Phase 2: SC Chain Refinements + Role-Specific Policies

[DECISION] Implemented Phase 2 per test results analysis.
- **SC chain exemptions:** Registry writes, browser navigate/snapshot, mkdir setup — all validated as structural, not logical violations.
- **Role-specific policies:** Executor (strict, concise), Planner (reasoning only, no tools), Verifier (read-only, structured verdicts), Content Agent (creative latitude, must receive quality framework), Code Agent (conventions-first, verify after changes).
- **Skipped:** Inline tool schemas (low ROI — errors are routing/context, not schema), XML reorg (cosmetic), anti-pattern expansion (already covered in SOUL.md).

### 2026-02-20 — Executor Tool Budget Rule

[LESSON] Verification task burned all tool calls on research, never wrote deliverable. Root cause: no budget allocation in PLAN step. Fix: Executor must reserve minimum 4 calls (write + verify + 2 registry) for completion, allocate remainder to task work.

### 2026-02-20 — Operationalizing Post-Mortem Lessons (Steven's assessment)

[DECISION] Three fixes per Steven's feedback on post-mortem:
1. Contract > state machine priority line added to AGENTS.md — prevents future drift when resource-constrained
2. Pre-implementation instrumentation gate (4-checkbox checklist) — blocks Phase 3+ changes without measured baselines and A/B method
3. Standing adversarial test in projects/test-suite/adversarial/ — 6-call budget regression test, must run before any AGENTS.md change
[LESSON] Process fixes before engineering fixes. A checklist gate costs 15 minutes and prevents the same class of error that a transcript analysis script would take hours to build.
[LESSON] Document priority hierarchies explicitly. "I'd keep contracts over state labels" is useless as a thought — it needs to be a written line in the file that governs behavior.

### 2026-02-20 — AGENTS.md v3.0 Restructuring (Claude assessment)

[DECISION] Split AGENTS.md into two files per external review:
- **AGENTS.md** (v3.0): Session startup, memory protocol, security, operational policy. Every agent reads this.
- **FRAMEWORK.md** (v2.1): State machine, contracts, role policies, token budgets, gates. Orchestrator + sub-agents read this.

Changes made per 6-point assessment:
1. **Split file** — 9 concerns in one file → 2 focused files. Sub-agents no longer burn tokens on Slack monitoring and group chat etiquette.
2. **Token budget measured** — Executor task prompt = ~390 tokens. Ceiling is 1200. No structural contradiction.
3. **Versioning added** — Both files have version headers and changelogs.
4. **Pre-implementation gate enforcement** — Added orchestrator verification requirement (not just self-report).
5. **Spending limits moved** — Now reference RULES.json only. No duplication.
6. **"Make It Yours" removed** — Framework is the framework, not a suggestion.

### 2026-02-20 — Non-Admin User Hardening: Declined

[DECISION] Steven reviewed the recommendation to demote `davinci` to non-admin and declined. Rationale: existing mitigations (firewall + stealth, skill vetting with SHA256, memory sanitization, RULES.json FORBIDDEN tier, daily security audit cron) provide sufficient defense in depth. The break risk (brew, system config) outweighs the marginal security gain given our current threat model.

### 2026-02-20 — Model Routing: Defer Decision, Measure First

[DECISION] Steven reviewed deep model routing analysis ($1,088 in 5 days, 97% Opus). Decision: no changes now. Reassess after 1 week of continuous use (Feb 27). I will ask the 4 strategic questions then:
1. Monthly AI infrastructure budget ceiling
2. Which 3 outputs Steven values most
3. Would he accept a quality dip test (1 day on Sonnet)
4. Is sub-agent latency acceptable for mechanical work

Meanwhile: start Phase 0 measurement (tag conversations by category A-F in daily logs).
Design doc: `projects/architecture/model-routing-strategy.md`

## [2026-02-20] Steven's Model Routing Map
[DECISION] Steven defined preferred model routing by task type:
- Coding & technical writing → Claude
- Research requiring current information → Gemini
- Long document analysis → Gemini (context window advantage)
- Marketing copy & brand voice → Claude
- Spreadsheet / Excel work → Claude
- Social media analysis → Grok
- Image generation → Nano Banana Pro
- Video generation → VEO 3.1 or Kling 2.6
Note: This is Steven's preferred routing across all his AI tools, not just OpenClaw. Some of these (Grok, Nano Banana Pro, VEO/Kling) are external tools not in our gateway config.

## [2026-02-20] Task-Specific Model Routing Layer
[DECISION] Implemented a task-specific routing layer on top of the existing 3-tier system. Core tiers (Opus/Sonnet/Kimi) unchanged. Specialized routes added:
- Long document analysis (>150K tokens) → google/gemini-2.5-pro (1M context, $1.25/$10)
- Research (current events) → google/gemini-2.5-pro (search grounding)
- Social media/X analysis → venice/grok-41-fast ($0.50/$1.25)
- Image generation → Venice Nano Banana Pro (API, $0.18-$0.35/img)
- Cross-model verification → openai/gpt-4o ($2.50/$10)
- Video generation → Google VEO 3.1 (pending billing)
Rationale: Additive, not replacement. Core working system stays. Specialized models used only where they have a clear advantage.

## 2026-02-22: API Key Rotation Protocol
- [DECISION] API keys must be updated in ALL 5 locations: Keychain, openclaw.json, .zshrc, models.json, LaunchAgent plist
- [DECISION] LaunchAgent plist is the authoritative env source for the gateway process
- [FACT] Gateway does NOT read .zshrc — only the plist EnvironmentVariables
- [LESSON] Python heredocs with unquoted delimiters interpolate shell vars incorrectly — use sed or single-quoted heredocs

### 2026-02-23 00:18 ET
- **Decision:** Switch sub-agent model from `anthropic/claude-sonnet-4-20250514` (direct) to `venice/claude-sonnet-45` (Venice proxy)
- **Rationale:** Steven has $16M Venice credits. Use them instead of paying direct Anthropic rates.
- **Owner:** Steven
- **Reversal conditions:** If Venice proxy has quality/latency issues vs. direct Anthropic
- **Supersedes:** Previous direct Anthropic sub-agent routing

### 2026-02-23 00:15 ET
- **Decision:** "Deep research [topic]" = ChatGPT Deep Research via browser automation
- **Rationale:** Steven wants a reusable command trigger. Protocol at `protocols/deep-research.md`.
- **Owner:** Steven
- **Reversal conditions:** If ChatGPT changes Deep Research access/UI significantly
- **Supersedes:** none

### 2026-02-23 11:10 ET — System Prompt Restructuring
- **Decision:** Replace 47 scattered anti-patterns with 5 behavioral principles + 10 concrete WHEN/DO rules
- **Rationale:** Rule violations caused by cognitive overload and ambiguity, not positional attention. At 15K tokens / 7.5% of Opus window, everything is in high-attention zone.
- **Governance:** da Vinci proposes, Steven approves. Max 12 rules. New rule only for new violation patterns. Removal after 60 days zero violations.
- **Plan:** `protocols/rule-restructuring-plan.md`
- **Owner:** Both (da Vinci executes, Steven has final authority)
- **Supersedes:** Original positional-optimization plan

## 2026-02-24 — Self-Improvement Game Plan Reorder (Steven approved)
**Original:** A → B → C → D → E → F
**Approved:** A → B → D → E → C → F
**Rationale:** D (Mission Control tests) and E (Project Scoring Gate) are foundations — tests gate code quality, scoring gates project quality. C (SPIKE) and F (parallel prototyping) depend on those foundations existing. E bumped from MEDIUM-TERM to SHORT-TERM.
**Steven's refinements:**
- A: Define what counts as a valid smoke test (no trivial assertions) ✅ implemented
- C: "Discard with zero guilt" must be operationalized — ties into H (cleanup)
- E: Simple 3-question rubric, 20 min to write, prevents biggest risk
- F: Needs per-experiment budget cap given $18K/month API projection
**Status:** A ✅ implemented, B ✅ implemented, D–F pending
