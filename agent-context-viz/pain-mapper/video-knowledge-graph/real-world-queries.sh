#!/bin/bash

echo "=== REAL-WORLD QUERY TESTS ==="
echo

# Scenario 1: Steven asks "What have I watched about energy?"
echo "QUERY 1: What videos discuss energy?"
jq -r '.[] | select(.topics[] | contains("energy")) | "• \(.speaker): \(.title)"' registry.json
echo

# Scenario 2: Steven sends a new DeFi video
echo "QUERY 2: What other videos discuss DeFi or crypto?"
jq -r '.[] | select(.topics[] | test("DeFi|crypto"; "i")) | "• \(.speaker): \(.title) [Topics: \(.topics | join(", "))]"' registry.json
echo

# Scenario 3: Steven asks "What's the consensus on AI timelines?"
echo "QUERY 3: AI timeline predictions"
jq -r '.[] | select(.theses[].claim | test("AGI|timeline|year|2026|2028|2030"; "i")) | "• \(.speaker): \(.theses[] | select(.claim | test("AGI|timeline|year|2026|2028|2030"; "i")) | .claim)"' registry.json
echo

# Scenario 4: Steven asks "What disagreements exist between speakers?"
echo "QUERY 4: All contradictions (with resolution)"
jq -r '.contradictions[] | "• \(.speaker_a) vs \(.speaker_b):\n  A: \(.thesis_a) | B: \(.thesis_b)\n  Resolution: \(.resolution)\n"' theses.json
echo

# Scenario 5: Follow-up video about robotics
echo "QUERY 5: Prior robotics videos (for context)"
jq -r '.[] | select(.topics[] | contains("robotics")) | "• \(.speaker) [\(.date_analyzed)]: \(.title)\n  Key theses: \(.theses | map(.claim) | join(" | "))\n"' registry.json
echo

# Scenario 6: Steven says "Remind me what Musk said about education"
echo "QUERY 6: Elon Musk on education"
jq -r '.[] | select(.speaker_id == "elon-musk") | select(.topics[] | contains("education") or (.theses[].claim | test("education"; "i"))) | "Video: \(.title)\nTheses:\n\(.theses[] | select(.claim | test("education"; "i")) | "  • \(.claim)")"' registry.json
echo "(No direct match — but contradiction c-2 shows Musk's education thesis conflicts with Po-Shen Loh)"
echo

# Scenario 7: Verify we can retrieve Drive transcripts
echo "QUERY 7: Sample Drive transcript lookup"
SAMPLE_ID=$(jq -r '.[0].id' registry.json)
DRIVE_ID=$(jq -r --arg id "$SAMPLE_ID" '.[] | select(.id == $id) | .drive_transcript_id' registry.json)
echo "Video ID: $SAMPLE_ID"
echo "Drive transcript: https://drive.google.com/file/d/$DRIVE_ID/view"
echo

# Scenario 8: Check if a prediction can be tested now
echo "QUERY 8: Upcoming testable predictions"
jq -r '.testable_predictions[] | select(.test_date >= "2026-02-27") | "• \(.claim) — Test date: \(.test_date) [\(.status)]"' theses.json
echo

echo "=== REAL-WORLD TESTS COMPLETE ==="
