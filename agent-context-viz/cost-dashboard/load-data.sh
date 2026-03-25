#!/bin/bash
# Concatenate OpenClaw session logs for the token dashboard
OUT="/tmp/token-data.jsonl"
cat ~/.openclaw/agents/main/sessions/*.jsonl 2>/dev/null | grep -E '"type":"(message|model_change|session)"' > "$OUT"
LINES=$(wc -l < "$OUT" | tr -d ' ')
echo "Exported $LINES entries to $OUT"
echo "Open index.html and use 'Load File' to import $OUT"
