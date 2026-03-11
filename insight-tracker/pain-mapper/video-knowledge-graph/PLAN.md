# Video Knowledge Graph — Build Plan

_Created: 2026-02-27 01:45 AM ET_
_Status: Building_

## Goal
Turn the YouTube analysis pipeline into compounding intellectual infrastructure. Every video analyzed adds to a connected knowledge base that surfaces contradictions, tracks thesis evolution, and enriches future analyses with past context.

## Architecture

### Layer 1: Video Registry (data store)
**File:** `projects/video-knowledge-graph/registry.json`

Each video entry:
```json
{
  "id": "yt_lUPDZvFf1Is",
  "url": "https://youtu.be/lUPDZvFf1Is",
  "title": "The Dollar Milkshake Theory",
  "speaker": "Brent Johnson",
  "speaker_id": "brent-johnson",
  "date_analyzed": "2026-02-27",
  "duration_min": 75,
  "topics": ["dollar", "gold", "stablecoins", "macro", "BRICS"],
  "theses": [
    {"id": "t1", "claim": "Dollar and gold can rise simultaneously", "confidence": "high"},
    {"id": "t2", "claim": "Stablecoins are the modern Eurodollar system", "confidence": "high"},
    {"id": "t3", "claim": "Bitcoin is a speculative liquidity play, not safe haven", "confidence": "medium"}
  ],
  "contrarian_takes": [
    "BRICS overhyped — US internal shifts matter more",
    "Stablecoins cannibalizing Bitcoin in global south"
  ],
  "quotable": [
    "Universal high income and social unrest. That's my prediction."
  ],
  "drive_transcript_id": "...",
  "drive_summary_id": "...",
  "connections": []  // populated by cross-reference engine
}
```

### Layer 2: Speaker Profiles
**File:** `projects/video-knowledge-graph/speakers.json`

Track recurring speakers, their known frameworks, and thesis evolution over time.

### Layer 3: Thesis Tracker
**File:** `projects/video-knowledge-graph/theses.json`

Central registry of all claims/theses extracted. Each thesis linked to:
- Speaker who made it
- Video where it appeared
- Supporting theses (from other speakers/videos)
- Contradicting theses (flagged automatically)
- Steven's position (if expressed)

### Layer 4: Cross-Reference Engine
On every new video analysis:
1. Extract theses and topics
2. Search existing registry for overlapping topics
3. Flag contradictions (e.g., Johnson: "dollar strengthens" vs. Taleb: "dollar declining")
4. Flag agreements (e.g., both agree on gold)
5. Surface relevant past context in the analysis output

### Layer 5: Enhanced YouTube Protocol
Update `protocols/youtube-analysis.md` to include:
- Auto-register video in registry after analysis
- Include "Connections to Past Videos" section in output
- Append to speaker profile
- Update thesis tracker

## Build Order

### Phase 1: Seed the registry with tonight's 9 videos ← NOW
- Create registry.json with all 9 entries
- Create speakers.json with tonight's speakers
- Create theses.json with key claims + cross-references

### Phase 2: Wire into YouTube protocol
- After each analysis, auto-append to registry
- Before each analysis, search registry for speaker + topic overlap
- Add "Connections" section to deliverables

### Phase 3: Query interface
- Steven can ask "what do my videos say about X?" and get synthesized answer
- "Compare Johnson and Taleb on the dollar"
- "What thesis has the most support across speakers?"

## File Structure
```
projects/video-knowledge-graph/
├── PLAN.md              (this file)
├── registry.json        (all videos)
├── speakers.json        (speaker profiles)
├── theses.json          (claim tracker with cross-refs)
└── README.md            (how to query)
```

## Success Criteria
- Next video Steven sends: I automatically surface connections to past videos
- Steven feels like the knowledge compounds, not just accumulates
