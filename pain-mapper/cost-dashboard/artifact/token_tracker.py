#!/usr/bin/env python3
"""
Token Cost Estimator Dashboard
OpenClaw/Venice spend visibility — zero dependencies, single file

Run: python3 token_tracker.py
Output: Opens browser with dashboard HTML
"""

import json
import os
import re
import tempfile
import webbrowser
from datetime import datetime, timedelta
from pathlib import Path
from collections import defaultdict
from typing import Dict, List, Tuple, Any

# Venice pricing (per 1M tokens) - approximate from TOOLS.md
VENICE_PRICING = {
    "venice/claude-opus-45": {"input": 15.0, "output": 75.0},
    "venice/claude-sonnet-45": {"input": 3.0, "output": 15.0},
    "venice/gpt-4o": {"input": 2.5, "output": 10.0},
    "venice/grok-41-fast": {"input": 2.0, "output": 10.0},
}

def get_log_path(date: datetime = None) -> Path:
    """Get OpenClaw log path for a given date."""
    if date is None:
        date = datetime.now()
    log_dir = Path.home() / ".openclaw" / "logs"
    tmp_dir = Path("/tmp/openclaw")
    
    p1 = log_dir / f"openclaw-{date.strftime('%Y-%m-%d')}.ndjson"
    if p1.exists():
        return p1
    
    p2 = log_dir / f"openclaw-{date.strftime('%Y-%m-%d')}.jsonl"
    if p2.exists():
        return p2
    
    p3 = tmp_dir / f"openclaw-{date.strftime('%Y-%m-%d')}.log"
    if p3.exists():
        return p3
    
    return p1

def estimate_tokens(text: str) -> int:
    """Rough token estimate: ~4 chars per token for English."""
    if not text:
        return 0
    return len(text) // 4

def parse_model_pricing(model: str) -> Tuple[float, float]:
    """Get input/output pricing for a model."""
    for key, pricing in VENICE_PRICING.items():
        if key in model.lower():
            return pricing["input"], pricing["output"]
    return 0.5, 2.0

def analyze_log_line(line: str) -> Dict[str, Any]:
    """Parse a single log line and extract token/cost info."""
    try:
        data = json.loads(line)
    except json.JSONDecodeError:
        return None
    
    result = {
        "timestamp": data.get("time", ""),
        "model": None,
        "input_tokens": 0,
        "output_tokens": 0,
        "estimated_cost": 0.0,
        "provider": None,
        "session": None,
    }
    
    msg = json.dumps(data)
    
    if "0" in data and isinstance(data["0"], dict):
        inner = data["0"]
        if "model" in inner:
            result["model"] = inner["model"]
        if "provider" in inner:
            result["provider"] = inner["provider"]
    
    if not result["model"]:
        model_match = re.search(r'"model":\s*"([^"]+)"', msg)
        if model_match:
            result["model"] = model_match.group(1)
    
    if "usage" in msg or "tokens" in msg.lower():
        input_match = re.search(r'"input_tokens":\s*(\d+)', msg)
        output_match = re.search(r'"output_tokens":\s*(\d+)', msg)
        
        if input_match:
            result["input_tokens"] = int(input_match.group(1))
        if output_match:
            result["output_tokens"] = int(output_match.group(1))
    
    if result["input_tokens"] == 0 and result["output_tokens"] == 0:
        text_content = data.get("1", "")
        if isinstance(text_content, str):
            result["input_tokens"] = estimate_tokens(text_content)
    
    if result["model"]:
        input_price, output_price = parse_model_pricing(result["model"])
        input_cost = (result["input_tokens"] / 1_000_000) * input_price
        output_cost = (result["output_tokens"] / 1_000_000) * output_price
        result["estimated_cost"] = input_cost + output_cost
    
    session_match = re.search(r'sessionId":\s*"([^"]+)"', msg)
    if session_match:
        result["session"] = session_match.group(1)[:8]
    
    return result

def analyze_day(date: datetime) -> Dict[str, Any]:
    """Analyze logs for a single day."""
    log_path = get_log_path(date)
    
    if not log_path.exists():
        return {"date": date.strftime("%Y-%m-%d"), "error": "No log file"}
    
    entries = []
    model_counts = defaultdict(lambda: {"calls": 0, "tokens": 0, "cost": 0.0})
    hourly_spend = defaultdict(float)
    
    try:
        with open(log_path, 'r', encoding='utf-8', errors='ignore') as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                parsed = analyze_log_line(line)
                if parsed and parsed.get("model"):
                    entries.append(parsed)
                    
                    model = parsed["model"]
                    tokens = parsed["input_tokens"] + parsed["output_tokens"]
                    cost = parsed["estimated_cost"]
                    
                    model_counts[model]["calls"] += 1
                    model_counts[model]["tokens"] += tokens
                    model_counts[model]["cost"] += cost
                    
                    if parsed["timestamp"]:
                        try:
                            hour = parsed["timestamp"][11:13] if len(parsed["timestamp"]) >= 13 else "00"
                            hourly_spend[hour] += cost
                        except:
                            pass
    except Exception as e:
        return {"date": date.strftime("%Y-%m-%d"), "error": str(e)}
    
    total_cost = sum(m["cost"] for m in model_counts.values())
    total_tokens = sum(m["tokens"] for m in model_counts.values())
    
    return {
        "date": date.strftime("%Y-%m-%d"),
        "entries": len(entries),
        "total_cost": total_cost,
        "total_tokens": total_tokens,
        "models": dict(model_counts),
        "hourly": dict(hourly_spend),
    }

def generate_html(data: Dict[str, Any], history: List[Dict] = None) -> str:
    """Generate HTML dashboard."""
    
    history = history or []
    all_dates = [h["date"] for h in history if "error" not in h]
    all_costs = [h["total_cost"] * 100 for h in history if "error" not in h]
    
    model_rows = ""
    if data and "models" in data:
        sorted_models = sorted(data["models"].items(), key=lambda x: x[1]["cost"], reverse=True)
        for model, stats in sorted_models:
            cost_class = "high" if stats["cost"] > 1.0 else "medium" if stats["cost"] > 0.5 else "low"
            model_rows += f"""
                <tr>
                    <td>{model[:40]}</td>
                    <td>{stats["calls"]}</td>
                    <td>{stats["tokens"]:,}</td>
                    <td class="{cost_class}">${stats["cost"]:.4f}</td>
                </tr>
            """
    
    hourly_bars = ""
    if data and "hourly" in data:
        max_cost = max(data["hourly"].values()) if data["hourly"] else 1
        for hour in range(24):
            h = f"{hour:02d}"
            cost = data["hourly"].get(h, 0)
            height = (cost / max_cost * 100) if max_cost > 0 else 0
            hourly_bars += f"""
                <div class="bar" style="height: {max(height, 4)}%" title="{h}:00 - ${cost:.3f}">
                    <span class="bar-label">{h}</span>
                </div>
            """
    
    sparkline = ""
    if len(all_costs) > 1:
        max_val = max(all_costs) if all_costs else 1
        min_val = min(all_costs) if all_costs else 0
        range_val = max(max_val - min_val, 0.01)
        
        points = ""
        width = 300
        height = 60
        n = len(all_costs)
        
        for i, cost in enumerate(all_costs):
            x = (i / (n - 1)) * width if n > 1 else width / 2
            y = height - ((cost - min_val) / range_val * height)
            points += f"{x:.1f},{y:.1f} "
        
        sparkline = f"""
            <svg width="{width}" height="{height}" class="sparkline">
                <polyline points="{points}" fill="none" stroke="#4CAF50" stroke-width="2"/>
            </svg>
        """
    
    today_cost = data.get("total_cost", 0) if data else 0
    today_tokens = data.get("total_tokens", 0) if data else 0
    
    html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Token Cost Dashboard</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0f172a;
            color: #e2e8f0;
            padding: 2rem;
            line-height: 1.6;
        }}
        h1 {{ color: #4CAF50; margin-bottom: 0.5rem; }}
        .subtitle {{ color: #64748b; margin-bottom: 2rem; }}
        .grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }}
        .card {{ 
            background: #1e293b; 
            border-radius: 12px; 
            padding: 1.5rem;
            border: 1px solid #334155;
        }}
        .card h3 {{ color: #94a3b8; font-size: 0.875rem; text-transform: uppercase; margin-bottom: 0.5rem; }}
        .big-number {{ font-size: 2.5rem; font-weight: 700; color: #4CAF50; }}
        .medium-number {{ font-size: 1.5rem; font-weight: 600; color: #60a5fa; }}
        table {{ width: 100%; border-collapse: collapse; margin-top: 1rem; }}
        th, td {{ padding: 0.75rem; text-align: left; border-bottom: 1px solid #334155; }}
        th {{ color: #94a3b8; font-weight: 600; }}
        .high {{ color: #ef4444; }}
        .medium {{ color: #f59e0b; }}
        .low {{ color: #4CAF50; }}
        .hourly-chart {{ display: flex; align-items: flex-end; height: 120px; gap: 2px; margin-top: 1rem; }}
        .bar {{ flex: 1; background: #4CAF50; min-height: 4px; border-radius: 2px 2px 0 0; position: relative; }}
        .bar-label {{ position: absolute; bottom: -20px; left: 50%; transform: translateX(-50%); font-size: 0.625rem; color: #64748b; }}
        .sparkline-container {{ margin-top: 1rem; }}
    </style>
</head>
<body>
    <h1>🔺 Token Cost Dashboard</h1>
    <p class="subtitle">Venice/OpenClaw spend visibility — {data.get("date", "today") if data else "today"}</p>
    
    <div class="grid">
        <div class="card">
            <h3>Today's Estimated Cost</h3>
            <div class="big-number">${today_cost:.2f}</div>
        </div>
        <div class="card">
            <h3>Total Tokens</h3>
            <div class="medium-number">{today_tokens:,}</div>
        </div>
        <div class="card">
            <h3>API Calls</h3>
            <div class="medium-number">{data.get("entries", 0) if data else 0}</div>
        </div>
    </div>
    
    <div class="card">
        <h3>Model Breakdown</h3>
        <table>
            <tr><th>Model</th><th>Calls</th><th>Tokens</th><th>Est. Cost</th></tr>
            {model_rows if model_rows else '<tr><td colspan="4">No model data found</td></tr>'}
        </table>
    </div>
    
    <div class="card">
        <h3>Hourly Spend Pattern</h3>
        <div class="hourly-chart">
            {hourly_bars if hourly_bars else '<div style="color: #64748b; padding: 2rem;">No hourly data</div>'}
        </div>
    </div>
    
    <div class="card">
        <h3>7-Day Trend (cents)</h3>
        <div class="sparkline-container">
            {sparkline if sparkline else '<div style="color: #64748b;">Need more data for trend</div>'}
        </div>
        <p style="margin-top: 1rem; color: #64748b; font-size: 0.875rem;">
            Dates: {', '.join(all_dates[-7:]) if all_dates else 'N/A'}
        </p>
    </div>
    
    <div class="card" style="margin-top: 2rem;">
        <h3>How This Works</h3>
        <p style="color: #94a3b8; font-size: 0.875rem; line-height: 1.6;">
            This dashboard parses OpenClaw's NDJSON logs and estimates token usage based on character counts 
            (~4 chars/token) and Venice pricing tiers. It's not exact but gives directional visibility into spend patterns.
            <br><br>
            <strong>Data source:</strong> <code>~/.openclaw/logs/openclaw-YYYY-MM-DD.ndjson</code><br>
            <strong>Pricing:</strong> Venice proxy rates (see TOOLS.md)<br>
            <strong>Limitations:</strong> Token counts are estimates; actual billing may vary
        </p>
    </div>
</body>
</html>"""
    
    return html

def main():
    """Main entry point."""
    print("🔺 Token Cost Dashboard Generator")
    print("=" * 40)
    
    today = datetime.now()
    print(f"\nAnalyzing {today.strftime('%Y-%m-%d')}...")
    
    data = analyze_day(today)
    
    if data and "error" in data:
        print(f"⚠️  Error: {data['error']}")
        data = None
    elif not data:
        print("⚠️  No log file found for today")
        data = {"date": today.strftime("%Y-%m-%d"), "entries": 0, "total_cost": 0, "total_tokens": 0, "models": {}, "hourly": {}}
    else:
        print(f"✓ Found {data['entries']} API calls")
        print(f"✓ Estimated cost: ${data['total_cost']:.2f}")
    
    print("\nFetching 7-day history...")
    history = []
    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        h = analyze_day(d)
        if h and "error" not in h:
            history.append(h)
    
    print(f"✓ Found {len(history)} days of data")
    
    print("\nGenerating dashboard...")
    html = generate_html(data, history)
    
    with tempfile.NamedTemporaryFile(mode='w', suffix='.html', delete=False) as f:
        f.write(html)
        temp_path = f.name
    
    print(f"✓ Dashboard saved to: {temp_path}")
    print("\n🚀 Opening in browser...")
    
    webbrowser.open(f"file://{temp_path}")
    
    print("\n" + "=" * 40)
    print("Done! Dashboard shows:")
    print("  • Today's estimated spend")
    print("  • Model breakdown by cost")
    print("  • Hourly spend pattern")
    print("  • 7-day trend sparkline")
    print("=" * 40)

if __name__ == "__main__":
    main()
