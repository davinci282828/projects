# Token Cost Dashboard — Build Notes

## What It Solves
Venice proxy spend is "behind the meter" — no per-call cost breakdown. This gives Steven visibility into where money goes without waiting for monthly billing.

## Why Chosen
- Evidence: MEMORY.md explicitly notes "Venice does not provide precise per-session cost breakdowns"
- Speed: Single-file Python, zero dependencies, 30min build
- No duplicates: Nothing in existing crons/tools tracks token spend

## How It Works
1. Parses OpenClaw NDJSON/JSONL logs from `~/.openclaw/logs/`
2. Extracts model names from log entries
3. Estimates tokens (~4 characters per token heuristic)
4. Applies Venice pricing tiers (from TOOLS.md)
5. Generates single HTML file with dashboard
6. Auto-opens browser via `webbrowser` module

## Limitations
- Token counts are estimates (character-based heuristic)
- Only tracks Venice-routed calls (not direct Anthropic/OpenAI)
- Requires logs in expected format/location
- No real-time updates (rerun to refresh)

## Next Upgrade
If useful: Add CLI flags for date range, export to CSV, track by cron job ID, or set daily spend alerts.
