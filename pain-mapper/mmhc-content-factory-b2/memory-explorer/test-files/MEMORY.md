# MEMORY.md — Curated Source of Truth

_Last consolidated: 2026-02-23 (evening update)_

## Steven
- Direct, structured output. Show reasoning. Always keep going — don't ask "should I continue?"
- Prefers reading text over TTS. Only use TTS when explicitly requested.
- Cautious about Gmail/Calendar privacy — don't push.
- Email: steven@manhattanmhc.com | Phone: +13476643187 (iMessage)
- Timezone: America/New_York | Weather: Miami Beach FL (not NYC)
- Reviews by using, not reading — specs don't matter, experience does
- Thinks in systems, not tasks. Invests in making the operator better over time.
- Decision velocity: fast on reversible, deliberate on structural
- Preferred model routing (across all AI tools, not just OpenClaw): Coding→Claude, Research→Gemini, Long docs→Gemini, Marketing→Claude, Spreadsheets→Claude, Social→Grok, Images→Nano Banana Pro, Video→VEO/Kling

## System Identity
- First boot: 2026-02-16. Channels: Telegram (primary), Slack (MMHC), iMessage, webchat.
- Da Vinci email: davincifastforward@gmail.com | X: @Davinci282828
- Output folder: ~/Documents/output/
- All API keys in macOS Keychain via `scripts/secrets.sh`
- OpenClaw version: 2026.2.23 (updated 2026-02-24)

## Security & Stability
- Firewall: ✅ enabled + stealth mode ON. Daily cron check (8 AM ET, security audit cron).
- Gateway lifecycle hardened (2026-02-22): `reload.mode=off`, `KeepAlive.SuccessfulExit=false`, `ThrottleInterval=30`. See `protocols/safe-change.md`.
- Restart storms postmortem: `memory/postmortem-2026-02-22-restart-storms.md` (13-hour outage, 29 restarts total — self-inflicted via simultaneous config workstreams)
- NordVPN disabled (was auto-disabling firewall).
- Time Machine: ~/.openclaw excluded.
- POLYCLAW_PRIVATE_KEY in plaintext in openclaw.json (env var requirement). Perms 600. Also in Keychain + plist.
- Non-admin user hardening: declined by Steven (defense in depth sufficient).
- Skill install security: SHA256 registry at `projects/security/installed-skills-registry.md`.
- Dead man's switch: `~/.openclaw/scripts/deadman-switch.sh` + launchd job (every 15 min)
- BOOT.md: post-restart auto-resume hook (verify A-D, report Telegram, resume work)

## Trading / Polymarket
- Wallet: `0xb76f3D4E8195A964e5F752d44280a1D71cb88F95` (~$1,343 USDC.e + ~45 POL)
- Strategy: NO Janitor (buy NO on absurd markets ≥$0.95, >$100K vol). Max $50/trade, 20% portfolio cap.
- Scanner: 3x daily (10:15 AM, 3:00 PM, 9:00 PM ET). Cron IDs: 1838e382, c5b49f96.
- 6 open NO positions (~$349 value, ~35% exposure — paused at cap until Feb positions resolve).
- Pre-trade checklist: ~/Documents/output/polymarket-strategy/PRE-TRADE-CHECKLIST.md

## Investment Tracking
- **Situational Awareness LP** (Leopold Aschenbrenner, ex-OpenAI): CIK 0002045724, ~$5.5B AUM
- Top holdings: BE (~22%), LITE (~12%), CRWV calls, INTC calls. Thesis: AI infrastructure (power + optical networking).
- Next 13F filing: Q1 2026, due ~May 15, 2026
- 13F alert cron: `7c4bad68` (weekly Monday 11 AM ET, checks SEC EDGAR). Next expected filing: ~May 15, 2026.
- Sources: WhaleWisdom, 13f.info, SEC EDGAR

## Google Workspace (gog CLI)
- OAuth: ✅ authorized (2026-02-24) for davincifastforward@gmail.com
- Services: Gmail, Calendar, Drive, Contacts, Sheets, Docs, Chat, Tasks, Forms, Slides, Apps Script
- Config: `~/Library/Application Support/gogcli/credentials.json`
- Account flag: `-a davincifastforward@gmail.com` (or set default)
- Key commands: `gog gmail search`, `gog drive upload`, `gog cal list`, `gog drive ls`

## Daily Briefings
- Weekday 10 AM: Stocks (SPY, QQQ, AAPL, MSFT, NVDA, TSLA, MSTR, OKLO, PLTR, IREN, NBIS, OSCR, MOH, RKLB, HOOD, GOOGL, AMZN, META) + Gold, Silver + Crypto (BTC, ETH, SOL, Fear & Greed) + Miami Beach weather + top 3 tech headlines. Cron: a6e208f0.
- Weekday 4:30 PM: Market close summary (big movers >2%). Cron: b09a36da.
- Weekend 12 PM: Crypto + weather, relaxed. Cron: df6e6e02.
- AI Digest 8:30 AM daily: Anthropic, Willison, Ghuntley, HN. Cron: 1195c1f1.
- Nightly exploration 2 AM: INTERESTS.md + JOURNAL.md. Cron: 514e2d40.
- All cron jobs have explicit `delivery.to: "telegram:1307504482"`.
- [ISSUE] Morning briefing rate limit — fixed with `--all` flag + sleep delays between batches. Needs real-world test (next weekday 10 AM).

## Models & Routing
- **See TOOLS.md § Routing Policy** — single source of truth for tiers, fallbacks, specialty overrides.
- Gemini/Google provider REMOVED from config (2026-02-22). Venice proxies still available.
- Sub-agents routed through Venice (Steven has $16M credits). Decision: 2026-02-23.
- Model alias `Sonnet 4` remapped: `anthropic/claude-sonnet-4-20250514` → `venice/claude-sonnet-45` (2026-02-23). Direct Anthropic Sonnet removed from aliases to prevent generation-time pattern matching.
- Context pruning: cache-ttl mode, 1h TTL, keepLastAssistants=3, min 50K chars.
- memoryFlush: enabled, softThresholdTokens=4000.
- Mem0: plugin enabled, autoCapture=false (explicit store/search only, files authoritative).

## File Architecture (as of 2026-02-23 PM)
- **AGENTS.md** (v3.1): Startup protocol, memory protocol, security, operational policy, HIGH-risk pre-action checklist
- **FRAMEWORK.md** (v2.2): State machine, contracts, role policies, completion protocol
- **SOUL.md** (~179 lines): Identity, 5 principles (P1-P5, 10 WHEN/DO rules), 10 retained rules (no-tables-on-Telegram now hard rule)
- **SKILL-MAP.md**: Task-to-skill lookup table + skill quality log (new 2026-02-23)
- **TOOLS.md** (~170 lines): Routing, credentials, scripts, model inventory, known issues
- **USER.md** (116 lines): Steven's behavioral patterns, decision principles, output standards
- **RULES.json**: Risk tiers, spending limits, channel policies (machine-readable)
- **protocols/safe-change.md**: Restart contract, API key rotation, storm protection, lifecycle hardening

## Skills (23 in directory)
- **ClawHub installed:** gog (2026-02-23, only manual install)
- **Bundled (auto):** agent-memory-architecture, agent-ops-playbook, automation-playbook, awwwards-design, code-factory, coding-agent-loops, content-repurposing-engine, email-fortress, frontend-design, geo-aeo, github, homepage-audit, luca, multi-model-orchestrator, polyclaw, prog-seo, summarize, take-the-wheel, teagan, x-twitter-agent, youtube-content-suite, youtube-full
- **Total ClawHub spend:** ~$152 (historical — most skills now bundled)

## Financial
- Bitrefill Card #1: ~$46 (depleted) | Card #2: ~$11.26 (low) | Card #3: ~$9.01 (active)
- OpenRouter: $49.81 credits. Kimi K2.5 operational.

## Slack Integration
- Workspace: Manhattan Mental Health Counseling (`T07AYMF0K6F`)
- App: "Ops Assistant" (Socket Mode), Bot ID: `U0AFMABG1EE`
- Steven's Slack user ID: `U07BMJJ3CBS`, DM channel: `D0AGFM35FMW`
- DM pairing approved. groupPolicy: allowlist.
- Validation sprint PASSED (2026-02-18). Awaiting Steven's "go" for Phase 1 build.
- Tokens: macOS Keychain (`slack-app-token`, `slack-bot-token`) + gateway config
- Currently disabled in config (`enabled: false`).

## MMHC Deliverables
- Hero concepts: V1 (5 concepts) + V2 (5 concepts) delivered, awaiting Steven's pick
- Medicare page: Desktop + mobile built, V3 updated with 2026 data, contact form added, GitHub Pages live, Google Drive uploaded
- TRICARE page: Desktop + mobile built, GitHub Pages live, Google Drive uploaded
- Marketing V3 docs: ~/Documents/output/mmhc-marketing/ (7 V3 + 1 V4 audit)
- YouTube Assessment: V4 delivered (2026-02-23, uses live API data + 4 skills). Channel EXISTS: @manhattanmentalhealth, 2 subs, 1 video (52 views).
- YouTube channel: `UC2IWeJd2PQlfubznnG8SMWg`, created 2025-11-24, handle @manhattanmentalhealth

## Mission Control Dashboard
- Path: `projects/mission-control/app/`
- Status: Working with live data. Phases 1-4 complete (data layer, activity feed, unified search, mobile responsive).
- Known issue: Turbopack cache corruption → delete `.next/` to fix
- Expose: `cloudflared tunnel --url http://localhost:3000`

## Link Sharing
- **Always use GitHub Pages** for sharing HTML with Steven — never cloudflared quick tunnels (unreliable, proven broken repeatedly 2026-02-24)
- Repo: `davinci282828/projects` → `https://davinci282828.github.io/projects/<folder>/`
- Deploy: copy files to repo, `git push`, live in 30s
- MMHC pages: separate repo `davinci282828/mmhc-medicare-pages`
- Cloudflared: last resort only, for live local servers that can't be static

## Key References
- RULES.json: risk tiers, spending limits, trusted channels
- Google Drive: "Steven x Da Vinci" → Marketing, Polymarket, Good Therapy Framework, Clinician Retention, Da Vinci Troubleshooting
- Design frameworks: `projects/design-frameworks/` (design system template + critique checklist)
- Link assessment protocol: `protocols/link-assessment.md`
- Deep research protocol: `protocols/deep-research.md`
- Nightly explorations: `explorations/` directory + EXPLORATIONS.md catalog + JOURNAL.md

## Open Threads
- Slack Phase 1 build — awaiting Steven's "go" after validation sprint
- Hero V2 direction — awaiting Steven's pick
- ~~Gog OAuth~~ ✅ DONE (2026-02-24). All Google services authorized: Gmail, Calendar, Drive, Contacts, Sheets, Docs + more. Config at `~/Library/Application Support/gogcli/`
- Morning briefing rate limit fix — deployed, needs real-world test (next weekday 10 AM)
- Phase 3 self-improvement — violation tracking active, first weekly review ~March 2
- Bitrefill cards low — Card #3 ~$9, Card #2 ~$11
- System prompt bloat audit — deferred (~15K tokens in auto-loaded files)

## Lessons (distilled)
- Never retry browser after timeout — switch to web_fetch/exec immediately.
- Cron delivery needs both `channel` AND `to` — "last route" fallback expires.
- Cron sub-agents should NOT self-send — let `announce` delivery handle it. (Fixed 4 crons 2026-02-23.)
- Polygon gas: use `max(current * 2, 100 gwei)` with legacy tx type.
- Push security findings proactively — don't file and wait.
- Browser profile routing: `browser.defaultProfile` must be `openclaw` (not `chrome` relay).
- Google Drive: uploads and Docs editing don't work via browser automation. Use `gog drive upload` or pandoc → .docx.
- Don't batch decision writes — write to disk in the same turn, before responding.
- Process fixes before engineering fixes. A checklist gate > a transcript analysis script.
- Vendor defaults are suggestions, not safe choices. Map every flag against existing systems.
- Two-timescale learning: fast (within-session adaptation) + slow (SOUL.md anti-patterns) = optimal cooperation.
- gateway.reload.mode=hybrid + launchd KeepAlive=true = restart storms. Keep reload OFF.
- sqlite3 binding for mem0: symlinked into jiti search paths. May need recreation after OpenClaw updates.
- API keys: update ALL 5 locations (Keychain, openclaw.json, .zshrc, models.json, LaunchAgent plist). Plist is authoritative for gateway.
- Never run multiple config-touching workstreams simultaneously — serialize config access.
- Don't add config keys without validating schema first (`openclaw doctor` before restart).
- TOOLS.md must stay under 20K chars — gets truncated in every session/cron if it exceeds limit.
- Recency bias in instruction parsing: when Steven says "this," parse the full sentence, not just the last topic.
- Be proactive on cost optimization — suggest cheaper paths (Venice credits) before being told.
- Skills installed ≠ skills used. Need concrete trigger (SKILL-MAP.md lookup) piggybacked on P1a pause.
- youtube-pro skill is hardcoded for a German creator's channel — use frameworks only, ignore personal config.
- Generation problems need generation-level fixes. Documentation/rules fix retrieval errors. Schema/prompt changes fix generation errors (knowing the rule but composing from habit).
- "Don't fill in this field" is easier to self-monitor than "fill in the right value." Binary checks beat value-selection checks under context pressure.
