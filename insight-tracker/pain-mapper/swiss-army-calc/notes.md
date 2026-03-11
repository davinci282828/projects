# Swiss Army Calc — Build Notes

## Candidates Considered
1. **Swiss Army Calc** ✅ — Multi-tool: crypto converter, Polymarket EV/odds calc, position sizer, meeting cost timer. Daily micro-utility.
2. **Status Board** ❌ — GitHub Pages are static (always up or GitHub is down). Low signal, low utility.
3. **Cron Output Reader** ❌ — Steven already reads cron output in Telegram on mobile. Solving a non-problem.

## Build Plan
- Single HTML file, zero deps
- 4 tools: Crypto Converter, Polymarket Calculator, Position Sizer, Meeting Cost Timer
- Live crypto prices via CoinGecko free API
- Dark theme, tab-based navigation, mobile-first
- Keyboard shortcuts for power users
