#!/bin/bash

echo "=== SIMULATING NEW VIDEO ARRIVAL ==="
echo
echo "Scenario: Steven sends a new video about 'DeFi regulation and AI agents'"
echo

echo "STEP 1: Check if speaker has appeared before"
SPEAKER="Jeff Yan"
echo "Speaker: $SPEAKER"
jq --arg speaker "$SPEAKER" '.[] | select(.name == $speaker) | "✅ Found prior appearance: \(.appearances | join(", "))\nFramework: \(.framework)\nKey topics: \(.key_topics | join(", "))"' speakers.json
echo

echo "STEP 2: Find related theses in existing videos"
TOPICS=("DeFi" "AI" "regulation")
echo "Topics to search: ${TOPICS[@]}"
for topic in "${TOPICS[@]}"; do
  echo "--- Videos discussing $topic ---"
  jq -r --arg topic "$topic" '.[] | select(.topics[] | ascii_downcase | contains($topic | ascii_downcase)) | "• \(.speaker): \(.title)"' registry.json
done
echo

echo "STEP 3: Find contradictions that might apply"
echo "Checking if new video topic intersects with existing contradictions..."
jq -r '.contradictions[] | "• \(.speaker_a) vs \(.speaker_b): \(.description)"' theses.json | head -5
echo

echo "STEP 4: Check for meta-themes overlap"
echo "Meta-themes that might connect:"
jq -r '.meta_theses[] | select(.description | test("DeFi|AI|regulation"; "i")) | "• \(.theme): \(.description)"' theses.json
echo

echo "=== OUTPUT TEMPLATE FOR NEW VIDEO ==="
echo "
## Connections to Past Videos

### Direct Speaker History
[Jeff Yan appeared previously in: Hyperliquid video]
His core framework: [pull from speakers.json]

### Thematic Overlap
This video discusses DeFi + AI, which connects to:
- **Dario Amodei (Anthropic):** Application layer moats > model moats
- **Elon Musk (Energy/AI):** Race against time theme
- Meta-theme: 'Race against time' — DeFi before AI takes over

### Existing Contradictions
If this video takes a stance on AI timelines or decentralization trade-offs, check against:
- Taleb vs Amodei: Current AI leaders viability
- Musk vs Loh: AI as tool vs dependency

[Analysis continues with standard deliverables...]
"

echo "=== SIMULATION COMPLETE ==="
