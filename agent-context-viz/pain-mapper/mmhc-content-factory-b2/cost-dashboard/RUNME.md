# Token Cost Dashboard

## Run This (1 step)

```bash
python3 artifact/token_tracker.py
```

That's it. Opens browser automatically with spend dashboard.

## What You See

- Today's estimated Venice spend
- Model breakdown (which models cost what)
- Hourly spend pattern
- 7-day trend sparkline

## How It Works

Parses OpenClaw logs, estimates tokens (~4 chars/token), applies Venice pricing tiers from TOOLS.md. Not exact but gives directional visibility.

## Requirements

- Python 3 (built-in, no pip install needed)
- OpenClaw logs at `~/.openclaw/logs/` or `/tmp/openclaw/`
