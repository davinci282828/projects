#!/bin/bash

# Video Knowledge Graph Query Interface
# Usage: ./query.sh [command] [args]

CMD=$1
shift

case $CMD in
  speaker)
    # Find videos by speaker name (case-insensitive)
    jq -r --arg name "$1" '.[] | select(.speaker | ascii_downcase | contains($name | ascii_downcase)) | "[\(.date_analyzed)] \(.speaker): \(.title)\n  Topics: \(.topics | join(", "))"' registry.json
    ;;
  
  topic)
    # Find videos by topic keyword
    jq -r --arg topic "$1" '.[] | select(.topics[] | ascii_downcase | contains($topic | ascii_downcase)) | "• \(.speaker): \(.title)"' registry.json
    ;;
  
  thesis)
    # Search theses by keyword
    jq -r --arg kw "$1" '.[] | {speaker, theses: [.theses[] | select(.claim | ascii_downcase | contains($kw | ascii_downcase))]} | select(.theses | length > 0) | "=== \(.speaker) ===\n\(.theses[] | "• \(.claim)")\n"' registry.json
    ;;
  
  contradictions)
    # List all contradictions
    jq -r '.contradictions[] | "[\(.id)] \(.speaker_a) vs \(.speaker_b)\n  \(.description)\n  Resolution: \(.resolution)\n"' theses.json
    ;;
  
  predictions)
    # Show testable predictions
    jq -r '.testable_predictions[] | "[\(.status | ascii_upcase)] \(.test_date): \(.claim)\n  Speaker: \(.speaker) | Source: \(.source)\n"' theses.json
    ;;
  
  themes)
    # Show meta-themes
    jq -r '.meta_theses[] | "=== \(.theme | ascii_upcase) ===\n\(.description)\nSpeakers: \(.speakers | join(", "))\nSupported by: \(.supported_by | join(", "))\n"' theses.json
    ;;
  
  recent)
    # Show N most recent videos
    N=${1:-5}
    jq -r --argjson n "$N" 'sort_by(.date_analyzed) | reverse | .[:$n] | .[] | "[\(.date_analyzed)] \(.speaker): \(.title)"' registry.json
    ;;
  
  stats)
    # Show collection statistics
    echo "=== VIDEO KNOWLEDGE GRAPH STATISTICS ==="
    echo "Videos analyzed: $(jq 'length' registry.json)"
    echo "Unique speakers: $(jq 'length' speakers.json)"
    echo "Total theses: $(jq '[.[] | .theses | length] | add' registry.json)"
    echo "Meta-themes: $(jq '.meta_theses | length' theses.json)"
    echo "Contradictions mapped: $(jq '.contradictions | length' theses.json)"
    echo "Testable predictions: $(jq '.testable_predictions | length' theses.json)"
    echo "Date range: $(jq -r '[.[] | .date_analyzed] | sort | [first, last] | join(" → ")' registry.json)"
    ;;
  
  transcript)
    # Get Drive transcript link for a video
    jq -r --arg id "$1" '.[] | select(.id == $id or .url | contains($id)) | "Title: \(.title)\nSpeaker: \(.speaker)\nTranscript: https://drive.google.com/file/d/\(.drive_transcript_id)/view"' registry.json
    ;;
  
  help|*)
    echo "Video Knowledge Graph Query Interface"
    echo
    echo "Usage: ./query.sh [command] [args]"
    echo
    echo "Commands:"
    echo "  speaker <name>        Find all videos by speaker (partial match)"
    echo "  topic <keyword>       Find videos discussing a topic"
    echo "  thesis <keyword>      Search theses by keyword"
    echo "  contradictions        List all documented contradictions"
    echo "  predictions           Show testable predictions with dates"
    echo "  themes                Show cross-video meta-themes"
    echo "  recent [N]            Show N most recent videos (default 5)"
    echo "  stats                 Show collection statistics"
    echo "  transcript <id>       Get Drive transcript link for video ID"
    echo "  help                  Show this help"
    echo
    echo "Examples:"
    echo "  ./query.sh speaker musk"
    echo "  ./query.sh topic energy"
    echo "  ./query.sh thesis dollar"
    echo "  ./query.sh recent 3"
    ;;
esac
