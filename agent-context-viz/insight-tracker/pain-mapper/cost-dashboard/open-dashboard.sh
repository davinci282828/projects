#!/bin/bash
# Token Cost Dashboard — one command, zero friction
# Usage: ./open-dashboard.sh
set -euo pipefail

TEMPLATE_DIR="$(cd "$(dirname "$0")" && pwd)"
OUT="/tmp/token-dashboard.html"

# Step 1: Parse session logs → JSON
DATA_JSON=$(python3 "$TEMPLATE_DIR/parse-logs.py")

# Step 2: Inject into HTML
python3 "$TEMPLATE_DIR/inject-data.py" "$TEMPLATE_DIR/index.html" "$OUT" <<< "$DATA_JSON"

echo "✅ Dashboard ready"
open "$OUT"
