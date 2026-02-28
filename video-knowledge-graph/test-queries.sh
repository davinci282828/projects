#!/bin/bash

echo "=== VIDEO KNOWLEDGE GRAPH TEST SUITE ==="
echo

# Test 1: Speaker search
echo "TEST 1: Find all Elon Musk videos"
jq '[.[] | select(.speaker_id == "elon-musk") | {title, topics}]' registry.json
echo

# Test 2: Topic search
echo "TEST 2: Find all videos discussing AI"
jq '[.[] | select(.topics[] | contains("AI")) | {speaker, title}]' registry.json
echo

# Test 3: Thesis search by keyword
echo "TEST 3: Find theses mentioning 'dollar'"
jq '[.[] | {speaker, theses: [.theses[] | select(.claim | ascii_downcase | contains("dollar"))]}] | .[] | select(.theses | length > 0)' registry.json
echo

# Test 4: Find contradictions
echo "TEST 4: All documented contradictions"
jq '.contradictions' theses.json
echo

# Test 5: Testable predictions with dates
echo "TEST 5: Testable predictions"
jq '.testable_predictions' theses.json
echo

# Test 6: Meta-themes
echo "TEST 6: Cross-video meta-themes"
jq '.meta_theses | .[] | {theme, speakers}' theses.json
echo

# Test 7: Speaker by framework
echo "TEST 7: Speaker framework search (energy)"
jq '[.[] | select(.framework | ascii_downcase | contains("energy")) | {name, framework}]' speakers.json
echo

# Test 8: Videos with Drive IDs
echo "TEST 8: Verify all videos have Drive transcript IDs"
jq '[.[] | {id, has_transcript: (.drive_transcript_id != null)}]' registry.json
echo

# Test 9: Count stats
echo "TEST 9: Collection statistics"
echo "Videos: $(jq 'length' registry.json)"
echo "Speakers: $(jq 'length' speakers.json)"
echo "Total theses: $(jq '[.[] | .theses | length] | add' registry.json)"
echo "Meta-themes: $(jq '.meta_theses | length' theses.json)"
echo "Contradictions: $(jq '.contradictions | length' theses.json)"
echo "Testable predictions: $(jq '.testable_predictions | length' theses.json)"
echo

# Test 10: Cross-reference integrity
echo "TEST 10: Cross-reference integrity check"
echo "Checking if all speaker_ids in registry exist in speakers.json..."
MISSING_SPEAKERS=$(jq -r '[.[] | .speaker_id] | unique | .[]' registry.json | while read sid; do
  EXISTS=$(jq --arg sid "$sid" '.[] | select(.id == $sid)' speakers.json)
  if [ -z "$EXISTS" ]; then
    echo "  MISSING: $sid"
  fi
done)
if [ -z "$MISSING_SPEAKERS" ]; then
  echo "  ✅ All speaker_ids valid"
else
  echo "$MISSING_SPEAKERS"
fi

echo "Checking if all thesis IDs in theses.json exist in registry.json..."
MISSING_THESES=$(jq -r '.meta_theses[].supported_by[]' theses.json | sort -u | while read tid; do
  EXISTS=$(jq --arg tid "$tid" '[.[] | .theses[] | select(.id == $tid)] | length' registry.json)
  if [ "$EXISTS" = "0" ]; then
    echo "  MISSING: $tid"
  fi
done)
if [ -z "$MISSING_THESES" ]; then
  echo "  ✅ All thesis references valid"
else
  echo "$MISSING_THESES"
fi

echo
echo "=== TEST SUITE COMPLETE ==="
