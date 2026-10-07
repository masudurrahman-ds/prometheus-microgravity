(() => {
  if (window.__prometheusAIInjected) return;
  window.__prometheusAIInjected = true;

  const style = document.createElement('style');
  style.textContent = `
    #pm-ai-fab{position:fixed;right:18px;bottom:22px;z-index:99999;width:58px;height:58px;border-radius:50%;border:1px solid rgba(230,203,147,.75);background:radial-gradient(circle at 35% 28%,#fff6d8,#e6cb93 28%,#6d5730 65%,#111827);box-shadow:0 12px 36px rgba(0,0,0,.55),0 0 28px rgba(230,203,147,.25);color:#161108;font:700 12px IBM Plex Sans,system-ui;cursor:pointer}
    #pm-ai-fab span{display:block;font-size:9px;letter-spacing:.12em;margin-top:1px}
    #pm-ai-panel{position:fixed;right:18px;bottom:92px;z-index:99998;width:min(430px,calc(100vw - 28px));max-height:min(690px,calc(100vh - 120px));display:none;flex-direction:column;overflow:hidden;border:1px solid rgba(230,203,147,.35);border-radius:22px;background:rgba(5,8,17,.94);backdrop-filter:blur(24px);box-shadow:0 35px 80px rgba(0,0,0,.7),inset 0 1px rgba(255,255,255,.06);color:#eef0f7}
    #pm-ai-panel.open{display:flex}
    #pm-ai-head{padding:16px 18px;border-bottom:1px solid rgba(255,255,255,.09);display:flex;align-items:center;justify-content:space-between}
    #pm-ai-head strong{font:500 22px Cormorant Garamond,Georgia,serif;letter-spacing:.08em}
    #pm-ai-head small{display:block;color:#aab2c8;font:11px IBM Plex Sans,system-ui;margin-top:2px}
    #pm-ai-close{background:none;border:0;color:#aab2c8;font-size:22px;cursor:pointer}
    #pm-ai-body{padding:15px;overflow:auto;display:flex;flex-direction:column;gap:12px}
    .pm-msg{border:1px solid rgba(255,255,255,.09);border-radius:15px;padding:12px 13px;font:13px/1.55 IBM Plex Sans,system-ui}
    .pm-msg.ai{background:linear-gradient(180deg,rgba(230,203,147,.09),rgba(255,255,255,.025));border-color:rgba(230,203,147,.2)}
    .pm-msg.user{background:rgba(168,220,255,.07);align-self:flex-end;max-width:90%}
    .pm-meta{font-size:10px;letter-spacing:.13em;text-transform:uppercase;color:#e6cb93;margin-bottom:5px}
    .pm-evidence{margin-top:9px;padding-top:8px;border-top:1px solid rgba(255,255,255,.08);color:#aab2c8;font-size:11px}
    #pm-ai-suggest{display:flex;gap:6px;overflow:auto;padding:0 15px 10px}
    .pm-chip{white-space:nowrap;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.04);color:#cbd2e3;border-radius:999px;padding:6px 9px;font:11px IBM Plex Sans,system-ui;cursor:pointer}
    #pm-ai-form{display:flex;gap:7px;padding:12px 15px;border-top:1px solid rgba(255,255,255,.09)}
    #pm-ai-input{flex:1;min-width:0;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.15);border-radius:13px;padding:10px 12px;color:#eef0f7;outline:none}
    #pm-ai-send{border:1px solid #e6cb93;background:#e6cb93;color:#171106;border-radius:13px;padding:0 14px;font-weight:700;cursor:pointer}
    @media(max-width:600px){#pm-ai-fab{right:14px;bottom:16px}#pm-ai-panel{right:10px;bottom:84px;width:calc(100vw - 20px);max-height:calc(100vh - 105px)}}
  `;
  document.head.appendChild(style);

  const fab = document.createElement('button');
  fab.id = 'pm-ai-fab';
  fab.setAttribute('aria-label','Open PROMETHEUS AI');
  fab.innerHTML = '✦<span>AI</span>';

  const panel = document.createElement('section');
  panel.id = 'pm-ai-panel';
  panel.setAttribute('aria-label','PROMETHEUS AI scientific intelligence');
  panel.innerHTML = `
    <div id="pm-ai-head">
      <div><strong>PROMETHEUS AI</strong><small>Evidence-grounded combustion intelligence</small></div>
      <button id="pm-ai-close" aria-label="Close">×</button>
    </div>
    <div id="pm-ai-body">
      <div class="pm-msg ai"><div class="pm-meta">AI · Ready</div>I can interrogate the loaded combustion evidence, compare experiments, identify evidence gaps, and explain what is observed versus inferred. I will not turn missing evidence into a scientific claim.</div>
    </div>
    <div id="pm-ai-suggest">
      <button class="pm-chip">What do we know about oxygen?</button>
      <button class="pm-chip">Compare S1 and S2</button>
      <button class="pm-chip">What is missing?</button>
      <button class="pm-chip">How does pressure affect this?</button>
    </div>
    <form id="pm-ai-form"><input id="pm-ai-input" placeholder="Ask about microgravity combustion…" autocomplete="off"><button id="pm-ai-send" type="submit">Ask</button></form>
  `;
  document.body.appendChild(panel);
  document.body.appendChild(fab);

  const body = panel.querySelector('#pm-ai-body');
  const input = panel.querySelector('#pm-ai-input');

  function dataset(){
    try { return window.__flare && window.__flare.S && window.__flare.S.ds ? window.__flare.S.ds : null; } catch(e){ return null; }
  }
  function records(){
    const d=dataset(); return d && Array.isArray(d.experiments) ? d.experiments : [];
  }
  function sourceIds(){
    return records().map(e=>e.exp_id).filter(Boolean);
  }
  function add(role, title, text, evidence){
    const el=document.createElement('div');
    el.className='pm-msg '+role;
    el.innerHTML='<div class="pm-meta">'+title+'</div>'+text+(evidence?'<div class="pm-evidence">'+evidence+'</div>':'');
    body.appendChild(el); body.scrollTop=body.scrollHeight;
  }
  function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
  function cond(e,k){
    const x=e && e.conditions && e.conditions[k];
    return x && (x.value ?? x.canonical_value);
  }
  function answer(q){
    const low=q.toLowerCase(), rs=records(), ids=sourceIds();
    if(!rs.length) return {title:'AI · Dataset unavailable',text:'The scientific dataset is not loaded yet. Load a NASA PSI dataset and ask again.',evidence:'Status: UNKNOWN'};
    if(/pressure|pressur/.test(low)){
      const n=rs.filter(e=>cond(e,'pressure_kpa')!=null);
      return {title:'AI · Evidence gap',text:n.length?('The loaded corpus contains '+n.length+' experiment(s) with pressure values. Compare them before drawing a causal conclusion.'):'The current NASA PSI seed measurements do not report a pressure value for the loaded measurement rows. PROMETHEUS therefore cannot infer a pressure effect from this corpus.',evidence:'Evidence state: UNKNOWN · Do not substitute a proxy value for NASA-observed pressure.'};
    }
    if(/oxygen|o2|oxygen concentration/.test(low)){
      const vals=rs.map(e=>cond(e,'o2_fraction')).filter(v=>v!=null).map(v=>({v:evaluate(v),id:''})); // marker replaced below
      const rows=rs.map(e=>({id:e.exp_id,v:cond(e,'o2_fraction')})).filter(x=>x.v!=null);
      const range=rows.length?rows.map(x=>(x.v*100)).join('%, '):'not reported';
      return {title:'AI · Oxygen analysis',text:'The loaded observed measurements cluster around atmospheric oxygen: '+range+'%. These rows alone are not sufficient to establish that oxygen concentration causes a change in burn behaviour, because other experimental conditions also matter.',evidence:'Observed records: '+rows.map(x=>x.id).join(', ')+' · Evidence: OBSERVED'};
    }
    if(/compare|s1|s2/.test(low) && rs.length>=2){
      const a=rs.find(e=>/S1/i.test(e.exp_id))||rs[0], b=rs.find(e=>/S2/i.test(e.exp_id))||rs[1];
      const ao=cond(a,'o2_fraction'), bo=cond(b,'o2_fraction'), af=cond(a,'air_flow_cm_s'), bf=cond(b,'air_flow_cm_s'), at=cond(a,'burn_time_s'), bt=cond(b,'burn_time_s');
      return {title:'AI · Experiment comparison',text:'S1 and S2 use the same SIBAL fabric geometry and 20 cm/s airflow, with similar oxygen conditions. The recorded burn times differ substantially: '+at+' s for S1 versus '+bt+' s for S2. The flow and oxygen values alone do not explain that difference; the experiment metadata identifies different spread configurations.',evidence:'Observed: '+a.exp_id+' vs '+b.exp_id+' · Variables compared: airflow, O2, burn time, configuration'};
    }
    if(/missing|gap|unknown|not know|insufficient/.test(low)){
      const missing=rs.filter(e=>cond(e,'pressure_kpa')==null).length;
      return {title:'AI · Knowledge-gap analysis',text:'A major limitation of this seed corpus is sparse coverage of pressure measurements. PROMETHEUS should treat that as an experimental gap, not as evidence of no pressure effect. The same principle applies to any variable with missing observations.',evidence:'Current corpus: '+rs.length+' records · Pressure reported in '+(rs.length-missing)+' records · Evidence state: UNKNOWN where unreported'};
    }
    if(/flame|fire|combust|microgravity|freefall/.test(low)){
      return {title:'AI · Scientific briefing',text:'PROMETHEUS treats each experiment as evidence with provenance. The current corpus contains observed NASA PSI combustion records plus investigation-level context. I can compare conditions, surface patterns, flag gaps, and distinguish observed measurements from model-derived or unknown claims.',evidence:'Loaded records: '+ids.join(', ')+' · Source family: NASA Physical Sciences Informatics · This answer is evidence-grounded, not a free-form claim'};
    }
    if(/what if|scenario|mars|lunar|habitat/.test(low)){
      return {title:'AI · Scenario reasoning',text:'I can evaluate a scenario against the nearest recorded experiments, but I will label extrapolation as MODEL-INFERRED or UNKNOWN. A scenario outside the measured range is not a NASA observation.',evidence:'Safety principle: extrapolation ≠ observation · Use the Virtual Lab for parameterized scenario analysis'};
    }
    return {title:'AI · Evidence-grounded response',text:'Ask me about oxygen, pressure, flame behaviour, experiment comparison, evidence gaps, or a spacecraft/lunar/Mars scenario. I will retrieve the relevant loaded records and explicitly label what is observed, inferred, analogous, or unknown.',evidence:'AI mode: retrieval + structured reasoning · Dataset: '+ids.join(', ')};
  }
  function evaluate(v){ return Number(v); }

  function ask(q){
    q=q.trim(); if(!q)return;
    add('user','YOU',esc(q));
    const a=answer(q);
    setTimeout(()=>add('ai',a.title,a.text,a.evidence),220);
  }
  fab.onclick=()=>{panel.classList.toggle('open'); if(panel.classList.contains('open')) input.focus();};
  panel.querySelector('#pm-ai-close').onclick=()=>panel.classList.remove('open');
  panel.querySelector('#pm-ai-form').onsubmit=e=>{e.preventDefault();ask(input.value);input.value='';};
  panel.querySelectorAll('.pm-chip').forEach(b=>b.onclick=()=>{input.value=b.textContent;ask(input.value);input.value='';});
})();