# Self-Improvement Digest — Deep Research Results & Game Plan
## Feb 24, 2026

Source: ChatGPT Deep Research (19 sources, 15 searches)
URL: https://chatgpt.com/c/699dbf41-9290-8327-a471-aaa57c5019e2

---

## Research Summary

### 1. Conformance-Driven Agentic Coding (Ladybird)
Ladybird ported 25K lines of C++ to Rust using AI agents (Claude Code + Codex) with existing test suites as the guardrail. Every agent step was verified against test262 + Ladybird regression tests. Result: zero regressions.

**Key insight:** The test suite IS the specification. Agents don't need to understand architecture — they need to pass tests.

### 2. "Code is Cheap" (Willison)
With coding agents, writing code costs near-zero tokens. This flips the economics: throwaway prototypes and speculative implementations become viable. "Whenever your gut says 'this isn't worth coding,' go ahead and code it anyway — the worst outcome is wasted tokens."

**Key insight:** The bottleneck shifts from writing to evaluating. Generate many, filter ruthlessly.

### 3. Enveil (Secret Hiding)
Rust CLI that replaces .env values with `ev://KEY` placeholders. Real secrets stored in AES-256-GCM encrypted local file. At runtime, `enveil run -- command` decrypts and injects into process env, then zeroes the key from memory.

**Key insight:** Stops accidental leaks but NOT a malicious agent (it could dump `os.environ`). One layer in defense-in-depth, not a complete solution.

### 4. "Teleporting" (Ghuntley)
AI agents create a "creative psychosis" — everything becomes possible instantly. Builders complete years of backlog in weeks. But after the initial 2-3 month spree, the critical lesson: "what NOT to build now that anything can be built."

**Key insight:** The scarce resource isn't code generation — it's judgment about what's worth generating.

---

## Cross-Cutting Themes

1. **Test-driven validation** — Use existing tests as guardrails for all agent-generated code
2. **Parallel experimentation** — Generate many cheap prototypes, label as WIP, graduate only what proves valuable
3. **Security by design** — Treat secrets as outside the agent's view; inject/proxy, never hardcode
4. **Human-in-the-loop judgment** — Agents generate, humans (or higher-tier agents) filter

---

## Game Plan: Implementation for Our System

### IMMEDIATE (This Week)

#### A. Test-First Gate for Sub-Agent Coding (from Ladybird pattern)
**What:** Add a mandatory step to FRAMEWORK.md's Code Agent role: before any code generation task, the agent must identify existing tests. If tests exist, the done criteria includes "all existing tests pass." If no tests exist, agent must write at least one smoke test before implementation.
**Where:** FRAMEWORK.md § Code Agent role policy
**Effort:** Config change, no code
**Risk:** LOW

#### B. .env Security Scan Hardening (from enveil research)  
**What:** We already scan for stale .env files (added today). Enhance: add a rule that coding sub-agents must NEVER write secrets to files. If a sub-agent needs API access, it gets a scoped env var injected by the orchestrator, not a file it reads.
**Where:** FRAMEWORK.md § Environment Context + AGENTS.md security protocol
**Effort:** Documentation update
**Risk:** LOW
**Note:** Enveil itself is unnecessary for us — we already use macOS Keychain via secrets.sh + openclaw.json with 600 perms. Our threat model is different (single-user system, not team dev environment). But the principle of "secrets outside agent view" should be formalized.

### SHORT-TERM (Next 2 Weeks)

#### C. "Code is Cheap" Experiment Protocol
**What:** Create a new sub-agent task type: "SPIKE" — a throwaway prototype with a 15-minute time cap and a single success criterion. If it works, graduate to real task. If not, discard with zero guilt. Track spike-to-graduation ratio.
**Where:** FRAMEWORK.md § Task Complexity Assessment table (add SPIKE tier below SIMPLE)
**Effort:** Framework update + tracking in daily notes
**Risk:** LOW

#### D. Conformance Suite for Mission Control
**What:** Mission Control dashboard has no tests. Before any new feature work, write a basic test suite (page loads, data renders, search works). Then all future sub-agent work on Mission Control gets gated by these tests.
**Where:** projects/mission-control/app/
**Effort:** ~2 hours coding agent work
**Risk:** LOW

### MEDIUM-TERM (Next Month)

#### E. "Teleporting" Guardrail — Project Scoring Gate
**What:** Before any new project/feature gets assigned to a sub-agent, it must pass a scoring gate: (1) clear user story, (2) defined success metric, (3) estimated value vs. effort. This prevents the "build everything because we can" trap.
**Where:** FRAMEWORK.md § Pre-Implementation Gate (extend existing)
**Effort:** Process change
**Risk:** LOW

#### F. Parallel Prototype Workflow
**What:** For uncertain approaches, spawn 2-3 cheap sub-agents (Kimi tier) with different strategies for the same problem. Compare outputs. Pick winner. This leverages "code is cheap" at the orchestration level.
**Where:** FRAMEWORK.md § new section "Competitive Prototyping"
**Effort:** Framework design + first test run
**Risk:** MEDIUM (token cost if overused)

### DEFERRED (Backlog)

#### G. Enveil Integration
**Why deferred:** Our secret management (Keychain + 600 perms + gateway config) already covers our threat model. Enveil adds value in team/multi-agent-with-file-access scenarios. Revisit if we add coding agents that operate in untrusted directories.

#### H. Agent Output Curation System  
**What:** Automated cleanup of experimental/spike code that didn't graduate within 7 days. Prevents Ghuntley's "bloated codebase" warning.
**Risk:** Need to build, not urgent

---

## Metrics to Track

| Metric | Baseline | Target | How |
|--------|----------|--------|-----|
| Sub-agent test pass rate | Unknown | >95% | Log in artifacts_log.md |
| Spike-to-graduation ratio | N/A | Track for 30 days | Daily notes |
| Secret exposure incidents | 1 (.env.local found today) | 0 | Daily security audit cron |
| Abandoned prototype count | Unknown | <3 active at any time | Weekly workspace audit |

---

## Decision Required

Steven: approve the game plan priority order (A→F), or reorder. Items A and B can start immediately — they're documentation/config only.
