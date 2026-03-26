# Iteration Task — Fix Parser for Real OpenClaw JSON

## Problem
The normalizeJobs() function assumes `schedule` is a string, but real `openclaw cron list --json` output has `schedule` as an object:

```json
{
  "schedule": {
    "kind": "cron",
    "expr": "0 5 * * *",
    "tz": "America/New_York"
  }
}
```

Also, the real structure has:
- `state.lastRunStatus` (not `last_run_time`)
- `state.nextRunAtMs` (milliseconds timestamp, not ISO string)
- `state.lastRunAtMs` (milliseconds timestamp)
- `history` doesn't exist in real output — we need to infer from `state` fields

## Fix Required

1. Update normalizeJobs() to handle `schedule` as object or string
2. Extract cron expression from `schedule.expr` when `schedule.kind === "cron"`
3. Convert millisecond timestamps (`state.nextRunAtMs`, `state.lastRunAtMs`) to Date objects
4. Use `state.lastRunStatus` for status
5. Remove reliance on `history` array (doesn't exist in real data)
6. Update failure pattern logic to work without history (maybe show "no historical data available" message)

## Test Data
Real export is at `/tmp/real-crons.json` — 50+ jobs from actual fleet.

## Acceptance
- Dashboard loads real-crons.json without errors
- Schedule density heatmap shows jobs in correct time slots based on cron expressions
- Job status grid displays all jobs with correct status indicators
- No JavaScript console errors when loading real data
