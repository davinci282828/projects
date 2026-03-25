# Deep Research Results: Lost in the Middle — 2026-02-23

Source: ChatGPT Deep Research (22 sources, 90 searches)
URL: chatgpt.com/c/699be16f-5dc0-8329-a7d9-6af174ab6cdf

## Key Findings

### The Science
- U-shaped attention curve confirmed (Liu et al. 2023): models recall well from start/end, poorly from middle
- 80%+ accuracy at position 0/end, below 40% in middle (GPT-3.5 Turbo benchmark)
- Effect persists even with massive context windows (Claude Sonnet 4, GPT-4 Turbo 128K)
- "Opus starts dropping after 50% context window is used" — practitioner observation

### Actionable Mitigations (by effort/impact)

| Technique | Effort | Impact |
|-----------|--------|--------|
| Place rules at start/end | Low | **High** |
| Duplicate key rules (sandwich) | Low | Medium |
| Format as lists/headings | Low | Medium |
| Periodic rule reminders | Medium | Medium |
| Pre-action checklist (CoT) | Medium | **High** |
| Modular/dynamic prompts | Medium-High | **High** |
| Retrieval (tools/RAG) | High | **High** |
| Context compaction/reset | Medium | **High** |
| LLM-as-judge validator | Medium-High | **High** |

### Quick Wins for Our System
1. **Reorder system prompt**: critical rules first 1-5KB, reiterate at end
2. **Sandwich defense**: duplicate top 5 rules at both start AND end
3. **Use XML/Markdown delimiters**: `<rule>` tags, headers, fenced blocks
4. **Pre-action checklist**: "Before acting, list applicable rules"
5. **Periodic reminders**: every N turns, inject rule summary

### Architecture-Level (Longer Term)
- Dynamic rule injection per mode (heartbeat vs chat vs sub-agent)
- Rule-as-tool pattern (agent calls "rulebook" tool before major decisions)
- Compaction at 70-80% context usage (we already have this configured)
- LLM-as-judge post-generation compliance check

### Key Sources
- Liu et al. 2023 "Lost in the Middle" (ar5iv.labs.arxiv.org/html/2307.03172)
- Anthropic context engineering guide (anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- George Davis "Still Lost in the Middle" (gcdavis.substack.com)
- Sean Wallbridge static-vs-dynamic prompts (abovo.co)
