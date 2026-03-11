#!/usr/bin/env python3
"""Parse OpenClaw session JSONL logs and output stats as JSON."""
import json, os, glob, sys
from datetime import datetime, timedelta, timezone
from collections import defaultdict

PRICING = {
    'anthropic/claude-opus-4-6': (15.0, 75.0),
    'claude-opus-4-6': (15.0, 75.0),
    'openrouter/moonshotai/kimi-k2.5': (0.60, 3.00),
    'openai/gpt-4o': (2.50, 10.00),
    'openai/gpt-4o-mini': (0.15, 0.60),
}

def get_pricing(model):
    if model in PRICING:
        return PRICING[model]
    for k, v in PRICING.items():
        if k in model or model in k:
            return v
    if model.startswith('venice/') or model.startswith('google/'):
        return (0, 0)
    return (1.0, 4.0)

sessions = {}
cur_sess = None
cur_model = None

for fpath in sorted(glob.glob(os.path.expanduser('~/.openclaw/agents/main/sessions/*.jsonl'))):
    with open(fpath) as f:
        for line in f:
            try:
                d = json.loads(line.strip())
                if d.get('type') == 'session':
                    cur_sess = d['id']
                    cur_model = None
                    sessions[cur_sess] = {
                        'id': cur_sess, 'model': 'unknown',
                        'timestamp': d.get('timestamp', ''),
                        'tokensIn': 0, 'tokensOut': 0, 'messages': 0,
                        'isCron': 'cron' in cur_sess.lower()
                    }
                elif d.get('type') == 'model_change':
                    p = d.get('provider', '')
                    m = d.get('modelId', '')
                    cur_model = f'{p}/{m}' if p else m
                    if cur_sess and cur_sess in sessions:
                        sessions[cur_sess]['model'] = cur_model
                elif d.get('type') == 'message' and cur_sess and cur_sess in sessions:
                    msg = d.get('message', {})
                    content = msg.get('content', '')
                    if isinstance(content, list):
                        content = ''.join(c.get('text', '') + c.get('input', '') for c in content if isinstance(c, dict))
                    tokens = len(str(content)) // 4
                    role = msg.get('role')
                    if role == 'user':
                        sessions[cur_sess]['tokensIn'] += tokens
                    elif role == 'assistant':
                        sessions[cur_sess]['tokensOut'] += tokens
                    sessions[cur_sess]['messages'] += 1
                    if d.get('timestamp'):
                        sessions[cur_sess]['timestamp'] = d['timestamp']
            except Exception:
                pass

now = datetime.now(timezone.utc)
today = now.strftime('%Y-%m-%d')
seven_ago = (now - timedelta(days=7)).isoformat()

by_model = defaultdict(lambda: {'tokensIn': 0, 'tokensOut': 0, 'cost': 0, 'sessions': 0})
by_day = defaultdict(lambda: {'cost': 0, 'tokens': 0})
total_cost = today_cost = week_cost = 0
cron = {'cost': 0, 'tokens': 0, 'count': 0}
interactive = {'cost': 0, 'tokens': 0, 'count': 0}
all_sessions = []

for s in sessions.values():
    pr = get_pricing(s['model'])
    cost = (s['tokensIn'] * pr[0] + s['tokensOut'] * pr[1]) / 1_000_000
    s['cost'] = round(cost, 4)
    total_cost += cost
    day = s['timestamp'][:10] if s['timestamp'] else 'unknown'
    if day == today: today_cost += cost
    if s['timestamp'] >= seven_ago: week_cost += cost
    by_model[s['model']]['tokensIn'] += s['tokensIn']
    by_model[s['model']]['tokensOut'] += s['tokensOut']
    by_model[s['model']]['cost'] += cost
    by_model[s['model']]['sessions'] += 1
    if day != 'unknown':
        by_day[day]['cost'] += cost
        by_day[day]['tokens'] += s['tokensIn'] + s['tokensOut']
    bucket = cron if s['isCron'] else interactive
    bucket['cost'] += cost
    bucket['tokens'] += s['tokensIn'] + s['tokensOut']
    bucket['count'] += 1
    all_sessions.append(s)

model_list = [{'model': k, **v} for k, v in by_model.items()]
model_list.sort(key=lambda x: -x['cost'])
day_list = [{'day': k, **v} for k, v in sorted(by_day.items())[-7:]]
top_sessions = sorted(all_sessions, key=lambda x: -(x['tokensIn'] + x['tokensOut']))[:15]

print(json.dumps({
    'totalCost': round(total_cost, 2), 'todayCost': round(today_cost, 2),
    'weekCost': round(week_cost, 2),
    'totalIn': sum(s['tokensIn'] for s in all_sessions),
    'totalOut': sum(s['tokensOut'] for s in all_sessions),
    'sessionCount': len(all_sessions),
    'byModel': model_list, 'byDay': day_list, 'topSessions': top_sessions,
    'cron': cron, 'interactive': interactive,
    'generatedAt': now.isoformat()
}))
