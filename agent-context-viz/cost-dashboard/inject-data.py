#!/usr/bin/env python3
"""Inject precomputed JSON data into the dashboard HTML template."""
import sys, json

template_path = sys.argv[1]
output_path = sys.argv[2]
data_json = sys.stdin.read().strip()

# Validate JSON
data = json.loads(data_json)

with open(template_path) as f:
    html = f.read()

# Build the auto-render script
SCRIPT = """<script>
(function(){
  var d = %s;
  function go(){
    var dash = document.getElementById('dashboard');
    var empty = document.getElementById('empty-state');
    if(!dash||!empty){setTimeout(go,50);return;}
    empty.style.display='none';
    dash.style.display='block';

    function fc(c){return c<0.01?'$0.00':'$'+c.toFixed(2);}
    function ft(t){return t>1e6?(t/1e6).toFixed(1)+'M':t>1e3?(t/1e3).toFixed(1)+'k':String(t);}
    function sm(m){return m.replace('anthropic/','').replace('venice/','').replace('openrouter/moonshotai/','').replace('openai/','');}
    function mc(m){m=m.toLowerCase();if(m.indexOf('opus')>=0)return'bar-opus';if(m.indexOf('sonnet')>=0)return'bar-sonnet';if(m.indexOf('kimi')>=0)return'bar-kimi';return'bar-other';}

    document.getElementById('status-bar').textContent='Parsed '+d.sessionCount+' sessions | Generated: '+new Date(d.generatedAt).toLocaleString();

    document.getElementById('stats-row').innerHTML=
      '<div class="stat-card"><div class="stat-label">Today</div><div class="stat-value '+(d.todayCost>1?'cost-high':'cost')+'">'+fc(d.todayCost)+'</div><div class="stat-sub">'+ft(d.totalIn)+' in / '+ft(d.totalOut)+' out</div></div>'+
      '<div class="stat-card"><div class="stat-label">7-Day</div><div class="stat-value">'+fc(d.weekCost)+'</div><div class="stat-sub">avg '+fc(d.weekCost/7)+'/day</div></div>'+
      '<div class="stat-card"><div class="stat-label">All Time</div><div class="stat-value">'+fc(d.totalCost)+'</div><div class="stat-sub">'+d.sessionCount+' sessions</div></div>'+
      '<div class="stat-card"><div class="stat-label">Total Tokens</div><div class="stat-value">'+ft(d.totalIn+d.totalOut)+'</div><div class="stat-sub">'+ft(d.totalIn)+' in / '+ft(d.totalOut)+' out</div></div>';

    var mx=0.01;d.byModel.forEach(function(m){if(m.cost>mx)mx=m.cost;});
    document.getElementById('model-table').innerHTML=
      '<table><tr><th>Model</th><th>Sessions</th><th>Tokens In</th><th>Tokens Out</th><th>Cost</th><th style="width:30%%">Share</th></tr>'+
      d.byModel.map(function(m){return'<tr><td class="mono">'+sm(m.model)+'</td><td>'+m.sessions+'</td><td class="mono">'+ft(m.tokensIn)+'</td><td class="mono">'+ft(m.tokensOut)+'</td><td class="mono '+(m.cost>1?'cost-high':m.cost===0?'cost-zero':'cost')+'">'+fc(m.cost)+'</td><td><div class="bar-container"><div class="bar '+mc(m.model)+'" style="width:'+Math.max(m.cost/mx*100,2)+'%%"></div></div></td></tr>';}).join('')+
      '</table>';

    if(d.byDay.length){
      var md=0.01;d.byDay.forEach(function(x){if(x.cost>md)md=x.cost;});
      document.getElementById('daily-chart').innerHTML=
        '<div class="chart-row">'+d.byDay.map(function(x){return'<div class="chart-bar" style="height:'+Math.max(x.cost/md*100,3)+'%%;background:var(--blue)"><div class="tooltip">'+x.day+'<br>'+fc(x.cost)+' · '+ft(x.tokens)+' tokens</div></div>';}).join('')+'</div>'+
        '<div class="chart-labels">'+d.byDay.map(function(x){return'<span>'+x.day.slice(5)+'</span>';}).join('')+'</div>';
    }

    document.getElementById('session-table').innerHTML=
      '<table><tr><th>Session</th><th>Type</th><th>Model</th><th>Tokens</th><th>Cost</th></tr>'+
      d.topSessions.map(function(s){return'<tr><td class="mono">'+(s.id||'').slice(0,20)+'…</td><td>'+(s.isCron?'<span class="tag tag-cron">CRON</span>':'<span class="tag tag-interactive">INT</span>')+'</td><td class="mono">'+sm(s.model)+'</td><td class="mono">'+ft(s.tokensIn+s.tokensOut)+'</td><td class="mono '+(s.cost>0.5?'cost-high':'cost')+'">'+fc(s.cost)+'</td></tr>';}).join('')+
      '</table>';

    var ts=d.cron.cost+d.interactive.cost||1;
    document.getElementById('cron-split').innerHTML=
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px"><div><div class="stat-label">Cron Jobs</div><div style="font-size:1.4rem;font-weight:700;color:var(--purple);font-family:var(--mono)">'+fc(d.cron.cost)+'</div><div style="font-size:.8rem;color:var(--muted)">'+d.cron.count+' sessions</div></div><div><div class="stat-label">Interactive</div><div style="font-size:1.4rem;font-weight:700;color:var(--blue);font-family:var(--mono)">'+fc(d.interactive.cost)+'</div><div style="font-size:.8rem;color:var(--muted)">'+d.interactive.count+' sessions</div></div></div>'+
      '<div style="margin-top:16px;height:24px;border-radius:12px;overflow:hidden;display:flex;background:rgba(148,163,184,.1)"><div style="width:'+(d.cron.cost/ts*100)+'%%;background:var(--purple)"></div><div style="width:'+(d.interactive.cost/ts*100)+'%%;background:var(--blue)"></div></div>';
  }
  go();
})();
</script>""" % data_json

html = html.replace('</body>', SCRIPT + '\n</body>')

with open(output_path, 'w') as f:
    f.write(html)
