(() => {
  "use strict";
  // Enforce a DOM-level singleton as well as a script-level singleton.
  // WebView lifecycle callbacks can evaluate the same asset more than once;
  // a status flag alone does not remove duplicate nodes left by older runs.
  function dedupeAIInstances() {
    ["#pm-ai-fab", "#pm-ai-panel", "#pm-ai-style"].forEach(selector => {
      const nodes = document.querySelectorAll(selector);
      for (let i = 1; i < nodes.length; i++) nodes[i].remove();
    });
  }
  dedupeAIInstances();
  if (window.__prometheusAIStatus === "ready") return;
  if (window.__prometheusAIStatus === "loading" && window.__prometheusAIInjected) return;
  window.__prometheusAIStatus = "loading";
  window.__prometheusAIInjected = true;

  // Defend against duplicate nodes introduced by another WebView lifecycle hook.
  if (!window.__prometheusAIDedupeObserver && document.documentElement) {
    window.__prometheusAIDedupeObserver = new MutationObserver(() => dedupeAIInstances());
    window.__prometheusAIDedupeObserver.observe(document.documentElement, {childList:true, subtree:true});
  }

  /*
   * PROMETHEUS AI — NASA-only scientific intelligence layer.
   * Design rule: retrieval first, computation second, answer last.
   * No network calls. No general-knowledge fallback. No fabricated values.
   */

  const EVIDENCE = {
    OBSERVED:   {label:"NASA OBSERVED", color:"#4FE3A0", rank:4},
    REPORTED:   {label:"NASA REPORTED", color:"#A8DCFF", rank:3},
    DERIVED:    {label:"DERIVED", color:"#E6CB93", rank:2},
    INFERRED:   {label:"MODEL-INFERRED", color:"#6FB1FF", rank:1},
    ANALOGICAL: {label:"ANALOGICAL", color:"#FFB067", rank:1},
    UNKNOWN:    {label:"UNKNOWN", color:"#FF6B7A", rank:0}
  };

  const STOP = new Set(("the a an and or of to in on for is are was were what which how does do did can could would should about from with this that it as by be i we you your our they their tell me show me please explain give find identify compare").split(" "));
  const NASA_TERMS = new Set(("nasa psi microgravity combustion flame fire spacecraft saffi­re saffire bass bass-ii flex spice smoke extinction ignition flame-spread flammability droplet solid fuel gaseous lunar mars habitat iss spaceflight").replace("saffi­re","saffire").split(" "));
  const OUTSIDE = /\b(stock|crypto|bitcoin|recipe|football|soccer|celebrity|politics|election|weather|password|homework|joke|poem|dating|relationship|medical diagnosis|medicine|restaurant|shopping|travel|programming|javascript|android|python|linux|gaming|movie|music|lyrics|religion|news)\b/i;

  const style = document.createElement("style");
  style.id = "pm-ai-style";
  style.textContent = `
    #pm-ai-fab{position:fixed;right:18px;bottom:22px;z-index:99999;width:62px;height:62px;border-radius:50%;border:1px solid rgba(230,203,147,.8);background:radial-gradient(circle at 35% 27%,#fff8df 0 8%,#e6cb93 25%,#6f5830 62%,#090c15 100%);box-shadow:0 14px 40px rgba(0,0,0,.62),0 0 30px rgba(230,203,147,.28);color:#161108;font:700 12px IBM Plex Sans,system-ui;cursor:grab;touch-action:none;user-select:none}
    #pm-ai-fab .pm-orbit{position:absolute;inset:8px;border:1px solid rgba(20,16,8,.42);border-radius:50%;transform:rotate(-23deg)}
    #pm-ai-fab .pm-spark{font-size:17px;line-height:13px;display:block}
    #pm-ai-fab span{display:block;font-size:9px;letter-spacing:.16em;margin-top:2px}
    #pm-ai-panel{position:fixed;right:18px;bottom:94px;z-index:99998;width:min(455px,calc(100vw - 28px));height:min(720px,calc(100vh - 112px));display:none;flex-direction:column;overflow:hidden;border:1px solid rgba(230,203,147,.35);border-radius:24px;background:rgba(5,8,17,.965);backdrop-filter:blur(24px);box-shadow:0 35px 90px rgba(0,0,0,.72),inset 0 1px rgba(255,255,255,.06);color:#eef0f7}
    #pm-ai-panel.open{display:flex}
    #pm-ai-head{padding:16px 18px 13px;border-bottom:1px solid rgba(255,255,255,.09);display:flex;align-items:flex-start;justify-content:space-between;gap:12px;cursor:grab;touch-action:none;user-select:none} #pm-ai-head:active{cursor:grabbing} #pm-ai-head button{touch-action:manipulation}
    #pm-ai-head strong{font:500 23px Cormorant Garamond,Georgia,serif;letter-spacing:.08em}
    #pm-ai-head small{display:block;color:#aab2c8;font:10.5px IBM Plex Sans,system-ui;margin-top:2px}
    #pm-ai-status{display:inline-flex;align-items:center;gap:6px;margin-top:8px;color:#4fe3a0;font:10px IBM Plex Sans,system-ui;letter-spacing:.08em;text-transform:uppercase}
    #pm-ai-status i{width:6px;height:6px;border-radius:50%;background:#4fe3a0;box-shadow:0 0 9px #4fe3a0}
    #pm-ai-close{background:none;border:0;color:#aab2c8;font-size:28px;cursor:pointer;min-width:48px;min-height:48px;display:inline-flex;align-items:center;justify-content:center;border-radius:12px;touch-action:manipulation;position:relative;z-index:2}
    #pm-ai-body{padding:15px;overflow:auto;display:flex;flex-direction:column;gap:11px;flex:1}
    .pm-visual{margin-top:11px;border:1px solid rgba(255,255,255,.10);border-radius:14px;overflow:hidden;background:rgba(0,0,0,.22)}
    .pm-visual-head{padding:9px 11px;border-bottom:1px solid rgba(255,255,255,.07);display:flex;justify-content:space-between;gap:8px;font-size:10px;color:#aab2c8;letter-spacing:.08em;text-transform:uppercase}
    .pm-visual svg{display:block;width:100%;height:auto}
    .pm-visual-actions{display:flex;gap:6px;padding:8px;border-top:1px solid rgba(255,255,255,.07)}
    .pm-vbtn{border:1px solid rgba(230,203,147,.28);background:rgba(230,203,147,.06);color:#e6cb93;border-radius:8px;padding:5px 8px;font-size:10px;cursor:pointer}
    .pm-logic{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:9px}
    .pm-logic div{padding:7px;border-radius:9px;background:rgba(255,255,255,.035);font-size:9px;color:#aab2c8}
    .pm-logic b{display:block;color:#e6cb93;margin-bottom:2px}
    .pm-3d{position:relative;background:#03060d;border-radius:13px;overflow:hidden}
    .pm-3d canvas{display:block;width:100%;height:clamp(205px,52vw,270px);touch-action:none;background:#03060d}
    .pm-3d-hud{position:absolute;left:10px;top:9px;right:10px;display:flex;justify-content:space-between;pointer-events:none;color:#aab2c8;font-size:9px;letter-spacing:.08em;text-transform:uppercase}
    .pm-3d-controls{display:flex;gap:6px;padding:8px;border-top:1px solid rgba(255,255,255,.07);flex-wrap:wrap}
    .pm-3d-controls button{border:1px solid rgba(230,203,147,.28);background:rgba(230,203,147,.06);color:#e6cb93;border-radius:8px;padding:5px 8px;font-size:10px;cursor:pointer}
    .pm-video-note{color:#737c96;font-size:9.5px;margin:7px 0 0}


    .pm-msg{border:1px solid rgba(255,255,255,.09);border-radius:15px;padding:12px 13px;font:13px/1.58 IBM Plex Sans,system-ui}
    .pm-msg.ai{background:linear-gradient(180deg,rgba(230,203,147,.085),rgba(255,255,255,.022));border-color:rgba(230,203,147,.20)}
    .pm-msg.user{background:rgba(168,220,255,.07);align-self:flex-end;max-width:91%}
    .pm-meta{font-size:9.5px;letter-spacing:.13em;text-transform:uppercase;color:#e6cb93;margin-bottom:6px}
    .pm-confidence{float:right;border:1px solid rgba(255,255,255,.12);border-radius:999px;padding:2px 6px;color:#cbd2e3;font-size:9px;letter-spacing:.04em}
    .pm-answer{white-space:normal}
    .pm-answer strong{color:#fff}
    .pm-evidence{margin-top:10px;padding-top:9px;border-top:1px solid rgba(255,255,255,.08);color:#aab2c8;font-size:10.5px}
    .pm-source{display:block;margin-top:6px;padding:7px 8px;border-radius:9px;background:rgba(255,255,255,.035);color:#cbd2e3;text-decoration:none}
    .pm-source:hover{background:rgba(255,255,255,.07)}
    .pm-source b{color:#e6cb93;font-weight:600}
    .pm-audit{margin-top:8px;color:#737c96;font-size:9.5px}
    #pm-ai-suggest{display:flex;gap:6px;overflow:auto;padding:0 15px 10px;scrollbar-width:none}
    .pm-chip{white-space:nowrap;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.04);color:#cbd2e3;border-radius:999px;padding:6px 9px;font:10.5px IBM Plex Sans,system-ui;cursor:pointer}
    .pm-chip:hover{border-color:rgba(230,203,147,.45)}
    #pm-ai-form{display:flex;gap:7px;padding:12px 15px;border-top:1px solid rgba(255,255,255,.09)}
    #pm-ai-input{flex:1;min-width:0;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.15);border-radius:13px;padding:10px 12px;color:#eef0f7;outline:none}
    #pm-ai-input:focus{border-color:rgba(230,203,147,.55)}
    #pm-ai-send{border:1px solid #e6cb93;background:#e6cb93;color:#171106;border-radius:13px;padding:0 14px;font-weight:700;cursor:pointer}\n    .pm-pipeline{display:grid;gap:8px;color:#aab2c8;font-size:11px;letter-spacing:.02em}.pm-pipeline b{color:#e6cb93;letter-spacing:.08em}.pm-loading:after{content:"";display:inline-block;width:1.1em;text-align:left;animation:pmDots 1.2s steps(4,end) infinite}@keyframes pmDots{0%{content:""}25%{content:"."}50%{content:".."}75%{content:"..."}}
    /* Full-screen conversational workspace: no floating mini-window. */
    /* Keep the app-owned chat below Android status icons and above navigation controls. Android WebView often reports zero CSS safe-area insets, so use a conservative status-bar fallback. */
    #pm-ai-panel{position:fixed!important;inset:28px 0 0 0!important;right:0!important;bottom:0!important;left:0!important;top:max(28px,env(safe-area-inset-top,0px))!important;width:100vw!important;height:calc(100vh - 28px)!important;height:calc(100dvh - max(28px,env(safe-area-inset-top,0px)))!important;max-height:none!important;min-height:0!important;border-radius:0!important;border:0!important;z-index:100000!important;padding-top:0;padding-bottom:env(safe-area-inset-bottom,0px);background:#050812;}
    #pm-ai-panel.open{display:flex;}
    #pm-ai-panel #pm-ai-head{flex:none;padding:8px 14px 12px;min-height:64px;align-items:center;cursor:default;touch-action:manipulation;}
    #pm-ai-panel #pm-ai-head:after{content:none!important}
    #pm-ai-body{min-height:0;overscroll-behavior:contain;padding:18px clamp(14px,4vw,36px);}
    #pm-ai-suggest{flex:none;padding:8px clamp(14px,4vw,36px) 10px;}
    #pm-ai-form{flex:none;padding:12px clamp(14px,4vw,36px) calc(12px + env(safe-area-inset-bottom,0px));}
    #pm-ai-clear{touch-action:manipulation}
    #pm-ai-fab{transition:opacity .15s ease}
    body.pm-ai-fullscreen-open{overflow:hidden!important;touch-action:pan-y;}
    body.pm-ai-fullscreen-open #pm-ai-fab{display:none!important;}
    @media(min-width:760px){#pm-ai-panel #pm-ai-body{padding-left:max(24px,calc((100vw - 900px)/2));padding-right:max(24px,calc((100vw - 900px)/2));}#pm-ai-panel #pm-ai-head{padding-left:max(24px,calc((100vw - 980px)/2));padding-right:max(24px,calc((100vw - 980px)/2));}#pm-ai-panel #pm-ai-form,#pm-ai-panel #pm-ai-suggest{padding-left:max(24px,calc((100vw - 900px)/2));padding-right:max(24px,calc((100vw - 900px)/2));}}
  `;
  style.textContent += "\n" + [
    "#pm-ai-fab{display:none!important}",
    "#pm-ai-panel{position:fixed!important;inset:max(28px,env(safe-area-inset-top,0px)) 0 0 0!important;width:100vw!important;height:auto!important;min-height:0!important;max-height:none!important;margin:0!important;border-radius:0!important;border:0!important;border-top:1px solid rgba(230,203,147,.28)!important;z-index:100000!important;background:#050812!important;box-shadow:none!important}",
    "#pm-ai-panel.open{display:flex!important;position:fixed!important}",
    "#pm-ai-close{display:none!important}",
    "#pm-ai-head{cursor:default!important;touch-action:pan-y!important}",
    "#pm-ai-body{width:100%;max-width:980px;margin:0 auto;}",
    "#pm-ai-form,#pm-ai-suggest{width:100%;max-width:980px;margin-left:auto!important;margin-right:auto!important;}",
    "#pm-ai-clear{margin-left:max(14px,calc((100vw - 980px)/2))!important}",
    "body.pm-ai-fullscreen-open{overflow:hidden!important}",
    "@media(min-width:760px){#pm-ai-panel{inset:0!important}#pm-ai-panel #pm-ai-head{padding-top:24px!important}}"
  ].join("\n");
  document.head.appendChild(style);

  const fab = document.createElement("button");
  fab.id = "pm-ai-fab";
  fab.setAttribute("aria-label","Open PROMETHEUS AI");
  fab.innerHTML = '<i class="pm-orbit"></i><b class="pm-spark">✦</b><span>AI</span>';

  const panel = document.createElement("section");
  panel.id = "pm-ai-panel";
  panel.setAttribute("aria-label","PROMETHEUS AI scientific intelligence");
  panel.innerHTML = `
    <div id="pm-ai-head">
      <div>
        <strong>PROMETHEUS AI</strong>
        <small>NASA-evidence-grounded combustion intelligence</small>
        <div id="pm-ai-status"><i></i> NASA source firewall · local evidence ready</div><div id="pm-ai-cloud-status" style="margin-top:8px;color:#4fe3a0;font:10px IBM Plex Sans,system-ui;letter-spacing:.08em">LOCAL ENGINE · NO CLOUD REQUIRED</div><div id="pm-ai-memory-count" style="margin-top:5px;color:#737c96;font:9px IBM Plex Sans,system-ui;letter-spacing:.06em"></div>
      </div>
      <button id="pm-ai-close" aria-label="Close">×</button>
    </div>
    <div id="pm-ai-body"></div>
    <div style="padding:7px 15px 0"><button id="pm-ai-clear" type="button" style="background:transparent;border:1px solid rgba(255,255,255,.1);border-radius:9px;color:#aab2c8;padding:6px 9px;font:10px IBM Plex Sans,system-ui">Clear memory</button></div><div id="pm-ai-suggest">
      <button class="pm-chip">What does NASA actually observe about oxygen?</button>
      <button class="pm-chip">Compare S1 and S2 scientifically</button>
      <button class="pm-chip">What does NASA not know here?</button>
      <button class="pm-chip">Can I claim pressure causes the difference?</button>
      <button class="pm-chip">Show the NASA sources</button>
    </div>
    <form id="pm-ai-form">
      <input id="pm-ai-input" placeholder="Ask a NASA combustion question…" autocomplete="off" />
      <button id="pm-ai-send" type="submit">Ask</button>
    </form>
  `;
  document.body.appendChild(panel);

  const body = panel.querySelector("#pm-ai-body");
  function visualShell(title, subtitle, inner, key) {
    const id="pmv-"+Math.random().toString(36).slice(2,9);
    return '<div class="pm-visual" id="'+id+'"><div class="pm-visual-head"><span>'+esc(title)+'</span><span>'+esc(subtitle||"NASA data")+'</span></div>'+inner+
      '<div class="pm-visual-actions"><button class="pm-vbtn" data-export="'+id+'">Export image</button></div></div>';
  }

  function chartSVG(rows, xLabel, yLabel, title) {
    // Independent experiment records are categories, not a temporal series.
    // Delegate to a bar chart; never connect unrelated records with a line.
    const valid=(rows||[]).map(r=>{
      const y=finiteNumericValue(r?.y);
      return y===null?null:{...r,y};
    }).filter(Boolean);
    return valid.length ? barChartSVG(valid,yLabel,title) : "";
  }

  function pieChartSVG(rows, title) {
    const total=(rows||[]).reduce((sum,row)=>sum+Math.max(0,finiteNumericValue(row.y)||0),0);
    if(!total) return "";
    const colors=["#e6cb93","#83c7f2","#75d6a7","#c49be8","#f09a83","#9ba8c7"];
    const cx=112,cy=120,r=78;
    let angle=-Math.PI/2;
    const slices=rows.map((row,index)=>{
      const value=Math.max(0,finiteNumericValue(row.y)||0);
      if(!value) return "";
      const next=angle+value/total*Math.PI*2;
      const x1=cx+r*Math.cos(angle),y1=cy+r*Math.sin(angle);
      const x2=cx+r*Math.cos(next),y2=cy+r*Math.sin(next);
      const large=next-angle>Math.PI?1:0;
      const path=value===total
        ? '<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="'+colors[index%colors.length]+'"/>'
        : '<path d="M '+cx+' '+cy+' L '+x1+' '+y1+' A '+r+' '+r+' 0 '+large+' 1 '+x2+' '+y2+' Z" fill="'+colors[index%colors.length]+'"><title>'+esc(row.label)+': '+value+' ('+(value/total*100).toFixed(1)+'%)</title></path>';
      angle=next;
      const y=34+index*30;
      return path+'<rect x="225" y="'+(y-10)+'" width="10" height="10" rx="2" fill="'+colors[index%colors.length]+'"/><text x="242" y="'+y+'" fill="#eef0f7" font-size="11">'+esc(row.label)+'</text><text x="470" y="'+y+'" fill="#aab2c8" font-size="10" text-anchor="end">'+value+' · '+(value/total*100).toFixed(1)+'%</text>';
    }).join("");
    return '<svg viewBox="0 0 490 250" role="img" aria-label="'+esc(title)+'"><text x="16" y="18" fill="#aab2c8" font-size="10">'+esc(title)+'</text>'+slices+'<circle cx="'+cx+'" cy="'+cy+'" r="34" fill="#070b15"/><text x="'+cx+'" y="'+(cy-2)+'" text-anchor="middle" fill="#e6cb93" font-size="20">'+total+'</text><text x="'+cx+'" y="'+(cy+14)+'" text-anchor="middle" fill="#aab2c8" font-size="9">records</text></svg>';
  }

  function heatmapSVG(records) {
    const columns=[
      {key:"o2_fraction",label:"O₂ fraction"},
      {key:"flow_velocity_mm_s",label:"Flow (mm/s)"},
      {key:"pressure_kpa",label:"Pressure (kPa)"},
      {key:"droplet_initial_diameter_mm",label:"Droplet (mm)"},
      {key:"weight_loss_rate_mg_min",label:"Weight loss"},
      {key:"fuel_rate_mg_s",label:"Fuel rate"},
      {key:"nozzle_diameter_mm",label:"Nozzle (mm)"},
      {key:"burn_duration",label:"Burn (s)"}
    ];
    const rows=(records||[]).map(record=>{
      const values=columns.map(column=>{
        let item=null;
        if(column.key==="burn_duration") {
          item=(record.observations||[]).find(o=>/burn|duration/i.test((o.phenomenon||"")+" "+(o.description||""))&&o.measurement&&finiteNumericValue(o.measurement.canonical_value??o.measurement.value)!==null);
          if(item) return {value:finiteNumericValue(item.measurement.canonical_value??item.measurement.value),raw:item.measurement.value,unit:item.measurement.canonical_unit||item.measurement.unit,note:"",source:item.source_id,locator:item.locator};
        } else {
          item=record.conditions&&record.conditions[column.key];
          if(item&&finiteNumericValue(item.canonical_value??item.value)!==null) return {value:finiteNumericValue(item.canonical_value??item.value),raw:item.value,unit:item.canonical_unit||item.unit,note:item.canonical_note||"",source:item.source_id,locator:item.locator};
          if(column.key==="burn_duration") {
            const observation=(record.observations||[]).find(o=>/burn|duration/i.test((o.phenomenon||"")+" "+(o.description||""))&&o.measurement&&finiteNumericValue(o.measurement.canonical_value??o.measurement.value)!==null);
            if(observation)return {value:finiteNumericValue(observation.measurement.canonical_value??observation.measurement.value),raw:observation.measurement.value,unit:observation.measurement.canonical_unit||observation.measurement.unit,note:"",source:observation.source_id,locator:observation.locator};
          }
        }
        return null;
      });
      return {id:record.exp_id,values};
    }).filter(row=>row.values.some(Boolean));
    if(!rows.length) return "";
    const left=152,top=58,cellW=91,rowH=25,width=left+columns.length*cellW+12,height=top+rows.length*rowH+34;
    const ranges=columns.map((_,i)=>{
      const values=rows.map(row=>row.values[i]?.value).filter(Number.isFinite);
      return values.length?{min:Math.min(...values),max:Math.max(...values)}:null;
    });
    const cells=rows.map((row,ri)=>{
      const y=top+ri*rowH;
      const label='<text x="'+(left-9)+'" y="'+(y+16)+'" text-anchor="end" fill="#cbd2e3" font-size="9">'+esc(row.id)+'</text>';
      const tiles=row.values.map((item,ci)=>{
        const x=left+ci*cellW,range=ranges[ci];
        if(!item) return '<rect x="'+x+'" y="'+y+'" width="'+(cellW-4)+'" height="21" rx="3" fill="#343b4b"><title>'+esc(row.id)+' · '+esc(columns[ci].label)+': missing in indexed record</title></rect><text x="'+(x+(cellW-4)/2)+'" y="'+(y+14)+'" text-anchor="middle" fill="#aab2c8" font-size="9">—</text>';
        const span=range.max-range.min||1,normalized=(item.value-range.min)/span;
        const red=Math.round(35+normalized*185),green=Math.round(72+normalized*95),blue=Math.round(112-normalized*65);
        const color='rgb('+red+','+green+','+blue+')';
        return '<rect x="'+x+'" y="'+y+'" width="'+(cellW-4)+'" height="21" rx="3" fill="'+color+'"><title>'+esc(row.id)+' · '+esc(columns[ci].label)+': '+esc(item.raw)+' '+esc(item.unit)+' · '+esc(item.source)+' · '+esc(item.locator)+(item.note?' · '+esc(item.note):'')+'</title></rect><text x="'+(x+(cellW-4)/2)+'" y="'+(y+14)+'" text-anchor="middle" fill="#07101a" font-size="9" font-weight="600">'+esc(formatNum(item.value))+'</text>';
      }).join("");
      return label+tiles;
    }).join("");
    const headers=columns.map((column,i)=>'<text x="'+(left+i*cellW+(cellW-4)/2)+'" y="43" text-anchor="middle" fill="#e6cb93" font-size="9">'+esc(column.label)+'</text>').join("");
    return '<svg viewBox="0 0 '+width+' '+height+'" role="img" aria-label="NASA indexed experiment measurement coverage heatmap"><text x="12" y="18" fill="#aab2c8" font-size="10">COLOR IS NORMALIZED WITHIN EACH COLUMN · — = MISSING</text>'+headers+cells+'</svg>';
  }

  function flameSVG(rows) {
    const w=390,h=235;
    rows=(rows||[]).map(r=>{const y=finiteNumericValue(r?.y);return y===null?null:{...r,y};}).filter(Boolean);
    const max=Math.max(...rows.map(r=>r.y),1);
    const flames=rows.map((r,i)=>{
      const cx=78+i*118, burn=r.y, scale=.65+.7*(burn/max);
      const rx=30*scale, ry=72*scale;
      return '<g transform="translate('+cx+' 116)"><ellipse rx="'+(rx+7)+'" ry="'+(ry+7)+'" fill="rgba(168,220,255,.06)" stroke="rgba(168,220,255,.25)"/><path d="M0 '+ry+' C-'+rx+' '+(ry*.55)+' -'+(rx*.7)+' '+(ry*.1)+' -'+(rx*.15)+' -'+(ry*.35)+' C-'+(rx*.15)+' -'+(ry*.7)+' '+(rx*.55)+' -'+(ry*.72)+' 0 -'+ry+' C'+(rx*.65)+' -'+(ry*.72)+' '+rx*.15+' '+(ry*.05)+' 0 '+ry+'Z" fill="#e6cb93" opacity=".88"/><text y="'+(ry+22)+'" text-anchor="middle" fill="#eef0f7" font-size="10">'+esc(r.label)+'</text><text y="'+(ry+36)+'" text-anchor="middle" fill="#aab2c8" font-size="9">'+esc(r.y)+' s burn</text></g>';
    }).join("");
    return '<svg viewBox="0 0 '+w+' '+h+'" role="img" aria-label="NASA-derived flame comparison"><rect width="100%" height="100%" fill="#070b15"/><text x="16" y="22" fill="#e6cb93" font-size="11" letter-spacing="1.4">NASA OBSERVED · FLAME BEHAVIOUR</text>'+flames+'</svg>';
  }

  function barChartSVG(rows, yLabel, title) {
    const w=390,h=220,p={l:42,r:16,t:24,b:48};
    rows=(rows||[]).map(r=>{const y=finiteNumericValue(r?.y);return y===null?null:{...r,y};}).filter(Boolean);
    const vals=rows.map(r=>r.y);
    if(!vals.length) return "";
    const max=Math.max(...vals,0), min=Math.min(...vals,0), span=max-min||1;
    const plotH=h-p.t-p.b, base=p.t+(max/span)*plotH;
    const slot=(w-p.l-p.r)/rows.length, bw=Math.min(42,slot*.58);
    const bars=rows.map((r,i)=>{
      const v=finiteNumericValue(r.y), bh=Math.abs(v/span*plotH), x=p.l+i*slot+(slot-bw)/2, y=v>=0?base-bh:base;
      return '<rect x="'+x+'" y="'+y+'" width="'+bw+'" height="'+Math.max(1,bh)+'" rx="3" fill="#e6cb93" opacity=".9"><title>'+esc(r.label)+': '+esc(v)+'</title></rect>'+
        '<text x="'+(x+bw/2)+'" y="'+Math.max(14,y-5)+'" fill="#eef0f7" font-size="9" text-anchor="middle">'+esc(formatNum(v))+'</text>'+
        '<text x="'+(p.l+i*slot+slot/2)+'" y="'+(h-28)+'" fill="#aab2c8" font-size="9" text-anchor="middle"><title>'+esc(r.label)+'</title>'+esc(String(r.label).length>12?String(r.label).slice(0,11)+"…":r.label)+'</text>';
    }).join("");
    return '<svg viewBox="0 0 '+w+' '+h+'" role="img" aria-label="'+esc(title)+'"><line x1="'+p.l+'" y1="'+p.t+'" x2="'+p.l+'" y2="'+(h-p.b)+'" stroke="rgba(255,255,255,.18)"/><line x1="'+p.l+'" y1="'+base+'" x2="'+(w-p.r)+'" y2="'+base+'" stroke="rgba(255,255,255,.24)"/>'+bars+'<text x="'+p.l+'" y="14" fill="#eef0f7" font-size="10">'+esc(yLabel)+'</text><text x="'+(w/2)+'" y="'+(h-6)+'" fill="#737c96" font-size="9" text-anchor="middle">Experiment record · categorical comparison</text></svg>';
  }

  function scientificVisual(q, rs) {
    const low=q.toLowerCase();
    // If the question names indexed experiment IDs, scope every plotted value
    // to those records. Never attach a dataset-wide chart to a two-record claim.
    const normalizedQuestion=low.replace(/[^a-z0-9]/g,"");
    const namedRecords=rs.filter(e=>normalizedQuestion.includes(String(e.exp_id||"").toLowerCase().replace(/[^a-z0-9]/g,"")));
    if(namedRecords.length) rs=namedRecords;
    const asksForVisual=/(graph|plot|chart|visuali[sz](?:e|ation)|visual|image|picture|render|show me a flame|bar chart|pie chart|heat ?map|line graph)/.test(low);
    const asksForComparison=/(compare|comparison|difference|versus|\bvs\b)/.test(low);
    const asksForTrend=/(trend|over time|time series|correlat|relationship|association)/.test(low);
    const asksForPie=/\b(pie|donut)\b/.test(low);
    const asksForHeatmap=/\b(heat ?map|heatmap)\b/.test(low);
    if(asksForPie) {
      const field=/platform|spacecraft|iss/.test(low)?"platform":"fuel";
      const counts=new Map();
      rs.forEach(record=>{const label=String(record[field]||record.source_id||"Source not recorded");counts.set(label,(counts.get(label)||0)+1);});
      const ranked=[...counts.entries()].map(([label,y])=>({label,y})).sort((a,b)=>b.y-a.y);
      const rows=ranked.length>6?[...ranked.slice(0,5),{label:"Other",y:ranked.slice(5).reduce((sum,row)=>sum+row.y,0)}]:ranked;
      if(rows.length) return visualShell("Retrieved record composition by "+field,"DERIVED · counts of retrieved records, not combustion outcomes",pieChartSVG(rows,"NASA indexed records by "+field),"pie");
      return "";
    }
    if(asksForHeatmap) {
      const chart=heatmapSVG(rs);
      if(chart) return visualShell("NASA indexed experiment feature heatmap","DERIVED · column-normalized values; gray cells are missing · proxy notes in cell tooltips",chart,"heatmap");
      return "";
    }
    // The corpus is experiment-level, not a temporal sequence. Never connect
    // unrelated experiments with a line and label it a trend.
    if(asksForTrend) return "";

    let metric=null, label="";
    if(/burn|duration|burn time|time taken/.test(low)) { metric="burn"; label="Burn duration (s)"; }
    else if(/oxygen|o2_fraction|o2 concentration/.test(low)) { metric="o2_fraction"; label="Reported oxygen fraction"; }
    else if(/pressure|pressur/.test(low)) { metric="pressure_kpa"; label="Pressure (kPa)"; }
    else if(/flow|velocity|co-flow|airflow/.test(low)) { metric="flow_velocity_mm_s"; label="Flow velocity (mm/s)"; }
    else if(/droplet.*diameter|initial diameter/.test(low)) { metric="droplet_initial_diameter_mm"; label="Initial droplet diameter (mm)"; }
    else if(/weight loss/.test(low)) { metric="weight_loss_rate_mg_min"; label="Weight-loss rate (mg/min)"; }
    else if(/fuel rate|fuel flow/.test(low)) { metric="fuel_rate_mg_s"; label="Fuel rate (mg/s)"; }

    // A comparison or causal question alone is not a request for a chart.
    // Only attach visual output when the user explicitly asks to plot/graph/chart.
    if(asksForVisual && metric) {
      const rows=rs.map(e=>{
        if(metric==="burn") {
          const o=(e.observations||[]).find(x=>/burn|duration/i.test((x.phenomenon||"")+" "+(x.description||""))&&x.measurement&&finiteNumericValue(x.measurement.canonical_value)!==null);
          return o?{label:e.exp_id,y:finiteNumericValue(o.measurement.canonical_value),source:o.source_id,locator:o.locator}:null;
        }
        const c=e.conditions&&e.conditions[metric];
        return c&&finiteNumericValue(c.canonical_value)!==null?{label:e.exp_id,y:finiteNumericValue(c.canonical_value),source:c.source_id,locator:c.locator,note:c.canonical_note||""}:null;
      }).filter(r=>r&&finiteNumericValue(r.y)!==null);
      if(rows.length>=2) {
        const chart=barChartSVG(rows.slice(0,8),label,"Evidence-backed experiment comparison");
        const notes=[...new Set(rows.map(r=>r.note).filter(Boolean))];
        const disclosure="Categorical experiment values; not a time series"+(notes.length?" · DERIVED PLOTTING VALUE: "+notes.join("; "):"");
        return visualShell(label+" · evidence-backed comparison",disclosure,chart,metric);
      }
      return "";
    }

    if(asksForVisual && !metric && !asksForComparison) {
      const field=/platform|spacecraft|iss/.test(low)?"platform":"source_id";
      const counts=new Map();
      rs.forEach(record=>{const label=String(record[field]||"Not specified");counts.set(label,(counts.get(label)||0)+1);});
      const rows=[...counts.entries()].map(([label,y])=>({label,y})).sort((a,b)=>b.y-a.y).slice(0,12);
      if(rows.length) return visualShell("NASA indexed experiments by investigation source","DERIVED · count of retrieved records by NASA PSI source; not combustion outcomes",barChartSVG(rows,"Experiment records","NASA PSI investigation distribution"),"count");
    }

    if(asksForVisual && asksForComparison) {
      const rows=rs.map(e=>{
        const o=(e.observations||[]).find(x=>/burn|duration/i.test((x.phenomenon||"")+" "+(x.description||""))&&x.measurement&&finiteNumericValue(x.measurement.canonical_value)!==null);
        return o?{label:e.exp_id,y:finiteNumericValue(o.measurement.canonical_value),source:o.source_id,locator:o.locator}:null;
      }).filter(r=>r&&finiteNumericValue(r.y)!==null);
      if(rows.length>=2) return visualShell("Observed burn-duration comparison","NASA PSI · categorical comparison, not a trend",barChartSVG(rows.slice(0,8),"Burn duration (s)","NASA-observed burn duration"),"burn");
    }

    if(/image|visual|render|picture|look like|show me a flame/.test(low)) {
      const rows=rs.map(e=>{
        const o=(e.observations||[]).find(x=>/burn|duration/i.test((x.phenomenon||"")+" "+(x.description||""))&&x.measurement&&finiteNumericValue(x.measurement.canonical_value)!==null);
        return o?{label:e.exp_id,y:finiteNumericValue(o.measurement.canonical_value)}:null;
      }).filter(r=>r&&finiteNumericValue(r.y)!==null);
      if(rows.length) return visualShell("Illustrative flame geometry","Size is scaled from reported burn duration; not a NASA image or measured flame shape",flameSVG(rows.slice(0,3)),"flame");
    }
    return "";
  }

  let pending3DResult = null;

  function build3DResult(rows) {
    const id="pm3d-"+Math.random().toString(36).slice(2,9);
    const card=document.createElement("div");
    card.className="pm-3d";
    card.innerHTML='<div class="pm-3d-hud"><span>DERIVED · 3D VISUALIZATION</span><span>Not NASA footage · drag / rotate / zoom</span></div><canvas width="780" height="540"></canvas><div class="pm-3d-controls"><button data-rotate>Auto rotate</button><button data-video>Generate video</button><button data-reset>Reset</button></div><div class="pm-video-note">Reproducible illustrative geometry scaled from available reported values; not experimental footage, a NASA image, or a measured flame shape.</div>';
    const canvas=card.querySelector("canvas"), ctx=canvas.getContext("2d");
    let yaw=-.35,pitch=-.18,zoom=1.0,running=true,raf=0,recording=false;
    let lastX=0,lastY=0,drag=false;
    const pts=[];
    const max=Math.max(...rows.map(r=>Number(r.y)||0),1);
    rows.forEach((r,idx)=>{
      const burn=Number(r.y)||0, radius=20+52*(burn/max);
      for(let i=0;i<44;i++){
        const a=i/44*Math.PI*2+idx*.7, h=(i%11)/10*2-1;
        const radial=.72+.28*Math.sin((i+1)*(idx+2)*1.618);
        pts.push({x:Math.cos(a)*radius*radial,y:h*radius,z:Math.sin(a)*radius*radial,g:idx});
      }
    });
    function project(p) {
      let x=p.x*Math.cos(yaw)-p.z*Math.sin(yaw), z=p.x*Math.sin(yaw)+p.z*Math.cos(yaw);
      let y=p.y*Math.cos(pitch)-z*Math.sin(pitch); z=p.y*Math.sin(pitch)+z*Math.cos(pitch);
      const d=260/(260+z), cx=canvas.width/2+x*d*zoom, cy=canvas.height/2-y*d*zoom;
      return {x:cx,y:cy,s:Math.max(.7,5*d),z};
    }
    function frame(t) {
      ctx.fillStyle="#03060d";ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.strokeStyle="rgba(168,220,255,.12)";ctx.lineWidth=1;
      for(let i=-3;i<=3;i++){const y=canvas.height/2+i*55;ctx.beginPath();ctx.moveTo(80,y);ctx.lineTo(canvas.width-80,y);ctx.stroke();}
      pts.forEach((p,i)=>{if(running&&!drag)p.z+=Math.sin(t/900+i)*.03;});
      const pp=pts.map(project).sort((a,b)=>a.z-b.z);
      pp.forEach(p=>{ctx.beginPath();ctx.arc(p.x,p.y,p.s,0,Math.PI*2);ctx.fillStyle="rgba(230,203,147,.82)";ctx.fill();});
      ctx.fillStyle="#eef0f7";ctx.font="18px system-ui";ctx.fillText("PROMETHEUS · evidence-derived visualization",24,32);
      ctx.fillStyle="#737c96";ctx.font="12px system-ui";ctx.fillText("Selected numeric values mapped to illustrative geometry · not measured shape",24,52);
      if(running)raf=requestAnimationFrame(frame);
    }
    function start(){cancelAnimationFrame(raf);running=true;raf=requestAnimationFrame(frame);}
    function stop(){running=false;cancelAnimationFrame(raf);frame(performance.now());}
    canvas.addEventListener("pointerdown",e=>{drag=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId);});
    canvas.addEventListener("pointermove",e=>{if(!drag)return;yaw+=(e.clientX-lastX)*.008;pitch+=(e.clientY-lastY)*.008;pitch=Math.max(-1.2,Math.min(1.2,pitch));lastX=e.clientX;lastY=e.clientY;frame(performance.now());});
    canvas.addEventListener("pointerup",()=>{drag=false;});
    canvas.addEventListener("wheel",e=>{e.preventDefault();zoom*=e.deltaY>0?.9:1.1;zoom=Math.max(.45,Math.min(2.4,zoom));frame(performance.now());},{passive:false});
    card.querySelector("[data-rotate]").onclick=()=>{running=!running;running?start():stop();};
    card.querySelector("[data-reset]").onclick=()=>{yaw=-.35;pitch=-.18;zoom=1;frame(performance.now());};
    card.querySelector("[data-video]").onclick=()=>{
      const btn=card.querySelector("[data-video]");
      if(recording)return;
      if(!canvas.captureStream||typeof MediaRecorder==="undefined"){
        btn.textContent="Recorder unavailable";
        setTimeout(()=>btn.textContent="Generate video",2200);
        return;
      }
      recording=true; btn.textContent="Recording…";
      const stream=canvas.captureStream(30), chunks=[];
      const mime=MediaRecorder.isTypeSupported("video/webm;codecs=vp9")?"video/webm;codecs=vp9":"video/webm";
      let rec;
      try{ rec=new MediaRecorder(stream,{mimeType:mime}); }
      catch(e){ recording=false; btn.textContent="Generate video"; return; }
      rec.ondataavailable=e=>e.data.size&&chunks.push(e.data);
      rec.onstop=()=>{
        recording=false; btn.textContent="Generate video";
        const blob=new Blob(chunks,{type:mime}), url=URL.createObjectURL(blob);
        let preview=card.querySelector("[data-video-preview]");
        if(!preview){
          preview=document.createElement("div");
          preview.dataset.videoPreview="1";
          preview.style.cssText="padding:0 8px 8px";
          card.appendChild(preview);
        }
        preview.innerHTML="";
        const v=document.createElement("video");
        v.controls=true; v.playsInline=true; v.muted=true; v.src=url;
        v.style.cssText="display:block;width:100%;border-radius:10px;background:#000";
        const dl=document.createElement("a");
        dl.href=url; dl.download="prometheus-nasa-3d-result.webm"; dl.textContent="Save generated video";
        dl.style.cssText="display:inline-block;margin-top:7px;color:#e6cb93;font:600 11px system-ui;text-decoration:none";
        preview.append(v,dl);
      };
      const old=running; running=true; rec.start();
      setTimeout(()=>{if(rec.state!=="inactive")rec.stop();running=old;stream.getTracks().forEach(t=>t.stop());},8000);
    };
    start(); return card;
  }

  function scientific3DVisual(q, rs) {
    const low=q.toLowerCase();
    if(!/3d|three.?d|spatial|volume|surface|model|visualize|visualise|video|animate|animation|motion/.test(low)) return "";
    let key="burn_duration";
    if(/oxygen|o2_fraction|o2 concentration/.test(low)) key="o2_fraction";
    else if(/pressure|pressur/.test(low)) key="pressure_kpa";
    else if(/flow|velocity|co-flow/.test(low)) key="flow_velocity_mm_s";
    else if(/gravity/.test(low)) key="gravity_g";
    const rows=rs.map(e=>{
      if(key==="burn_duration"){
        const o=(e.observations||[]).find(o=>/burn|duration/i.test((o.phenomenon||"")+" "+(o.description||""))&&o.measurement);
        return o?{label:e.exp_id,y:finiteNumericValue(o.measurement.canonical_value)}:null;
      }
      const c=e.conditions&&e.conditions[key];
      return c&&finiteNumericValue(c.canonical_value)!==null?{label:e.exp_id,y:finiteNumericValue(c.canonical_value)}:null;
    }).filter(r=>r&&finiteNumericValue(r.y)!==null);
    if(rows.length<1) return "";
    pending3DResult=rows;
    return build3DResult(rows).outerHTML;
  }

  function bindVisuals(root) {
    (root||body).querySelectorAll("[data-export]").forEach(btn=>{
      if(btn.dataset.bound) return; btn.dataset.bound="1";
      btn.onclick=()=>{
        const card=document.getElementById(btn.dataset.export), svg=card&&card.querySelector("svg");
        if(!svg) return;
        const blob=new Blob([new XMLSerializer().serializeToString(svg)],{type:"image/svg+xml"});
        const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="prometheus-nasa-visual.svg"; a.click(); URL.revokeObjectURL(a.href);
      };
    });
  }

  const input = panel.querySelector("#pm-ai-input");

  const ds = () => {
    // Prefer the stable provider published by the application state, so AI works
    // from Home, Lab, Evidence, and Research—not only after opening the universe.
    try {
      if (typeof window.__prometheusDataset === "function") {
        const loaded = window.__prometheusDataset();
        if (loaded && Array.isArray(loaded.experiments)) return loaded;
      }
    } catch (_) {}
    // Backward-compatible fallback for older app shells.
    try { return window.__flare && window.__flare.S && window.__flare.S.ds ? window.__flare.S.ds : null; }
    catch (_) { return null; }
  };
  const records = () => {
    const d = ds(); return d && Array.isArray(d.experiments) ? d.experiments : [];
  };
  const raw = () => {
    const d = ds(); return d && d.raw ? d.raw : null;
  };
  const sources = () => {
    const d = raw(); return d && Array.isArray(d.sources) ? d.sources : [];
  };
  const esc = s => String(s == null ? "" : s).replace(/[&<>\"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c]));
  const words = q => q.toLowerCase().replace(/[^a-z0-9_\-./% ]/g," ").split(/\s+/).filter(w=>w && !STOP.has(w));
  const QUERY_ALIASES = [
    [/\\b(?:o2|oxygen|oxidizer|oxidant)\\b/i, "oxygen o2 oxygen_fraction oxidizer"],
    [/\\b(?:microgravity|low.?g|reduced gravity|freefall|weightless)\\b/i, "microgravity gravity_g freefall low-g"],
    [/\\b(?:pressure|pressur|atm|atmosphere|kpa)\\b/i, "pressure pressure_kpa atmosphere atm"],
    [/\\b(?:flow|velocity|co.?flow|airflow)\\b/i, "flow flow_velocity_mm_s velocity coflow"],
    [/\\b(?:burn|burning|combustion|flame|ignition|extinction|extinguish)\\b/i, "burn combustion flame burn_duration ignition extinction"],
    [/\\b(?:spread|propagation|flame front)\\b/i, "flame spread propagation flame_spread"],
    [/\\b(?:smoke|soot|smoke point)\\b/i, "smoke soot smoke_point"],
    [/\\b(?:pmma|polymethyl methacrylate|solid fuel)\\b/i, "pmma solid fuel polymethyl methacrylate"],
    [/\\b(?:droplet|liquid fuel|fuel droplet)\\b/i, "droplet liquid fuel droplet burning"],
    [/\\b(?:saffire|saffire.?i|spacecraft fire safety)\\b/i, "saffire spacecraft fire safety psi98"],
    [/\\b(?:flex|flame extinguishment experiment)\\b/i, "flex flame extinguishment droplet extinction"],
    [/\\b(?:bass.?ii|burning and suppression of solids)\\b/i, "bass bass-ii solid burning suppression"]
  ];
  function expandQuestionAliases(question) {
    const text=String(question||"");
    const extra=[];
    QUERY_ALIASES.forEach(([pattern,terms])=>{if(pattern.test(text))extra.push(terms);});
    return extra.length ? text+" "+extra.join(" ") : text;
  }

  const srcFor = id => sources().find(s=>s.source_id===id) || null;
  const srcIds = e => Array.isArray(e.source_ids) ? e.source_ids : [];
  const condition = (e,k) => e && e.conditions && e.conditions[k] ? e.conditions[k] : null;
  const cval = (e,k) => { const c=condition(e,k); return c && c.canonical_value != null ? finiteNumericValue(c.canonical_value) : null; };
  const rawval = (e,k) => { const c=condition(e,k); return c ? c.value : null; };
  const allText = e => [e.exp_id,e.title,e.platform,e.fuel,e.text,...(e.observations||[]).flatMap(o=>[o.phenomenon,o.description,o.source_id,o.locator])].filter(Boolean).join(" ").toLowerCase();

  function evidenceForCondition(e,k) {
    const c=condition(e,k);
    if(!c) return "UNKNOWN";
    // This labels the source's original textual condition, not its canonical
    // numeric plotting field. Midpoint/proxy notes apply only to canonical plots.
    return c.source_id && c.value!=null && c.value!=="" ? "REPORTED" : "UNKNOWN";
  }
  function conditionLabel(k) {
    const labels={
      pressure_kpa:"Pressure",
      o2_fraction:"Oxygen concentration",
      gravity_g:"Gravity condition",
      flow_velocity_mm_s:"Flow velocity"
    };
    return labels[k] || String(k).replace(/_/g," ");
  }
  function formatCondition(e,k) {
    const c=condition(e,k);
    if(!c || c.value==null || c.value==="") return "not reported";
    const value=String(c.value).trim();
    const unit=String(c.unit||"").trim();
    // Source text sometimes already contains its unit (e.g. 21.5–21.7%).
    // Preserve the source text and append only a unit that is actually absent.
    const compactValue=value.toLowerCase().replace(/\s+/g,"");
    const compactUnit=unit.toLowerCase().replace(/\s+/g,"");
    if(!unit || compactValue.endsWith(compactUnit)) return value;
    return value+" "+unit;
  }
  function evidenceForObservation(o) { return o && o.measurement ? "OBSERVED" : "REPORTED"; }

  function measurement(e, terms) {
    for (const o of (e.observations||[])) {
      const hay=[o.phenomenon,o.description,o.locator].filter(Boolean).join(" ").toLowerCase();
      if (terms.some(t=>hay.includes(t)) && o.measurement && o.measurement.canonical_value!=null) {
        return {value:finiteNumericValue(o.measurement.canonical_value), raw:o.measurement.value, unit:o.measurement.unit, source:o.source_id, locator:o.locator, evidence:"OBSERVED"};
      }
    }
    return null;
  }

  function sourceCards(ids) {
    const seen=new Set(), out=[];
    ids.filter(Boolean).forEach(id=>{
      const s=srcFor(id); if(!s || seen.has(id)) return;
      seen.add(id);
      out.push('<a class="pm-source" target="_blank" rel="noopener" href="'+esc(s.url||"#")+'"><b>'+esc(s.source_id)+'</b> · '+esc(s.title)+'<br><span>'+esc(s.citation||"NASA PSI source")+'</span></a>');
    });
    return out.join("");
  }

  function confidence(score) {
    const p=Math.max(0,Math.min(0.99,score));
    return Math.round(p*100);
  }

  function tokenizeScore(q, e) {
    const text=allText(e), ws=words(q);
    if(!ws.length) return 0;
    let score=0;
    ws.forEach(w=>{
      if(text.includes(w)) score += 1;
      if((e.fuel||"").toLowerCase()===w) score += 2;
      if((e.exp_id||"").toLowerCase()===w) score += 4;
    });
    return score/ws.length;
  }

  function retrieve(q, limit=5) {
    const rs=records();
    return rs.map(e=>({e,score:tokenizeScore(q,e)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,limit);
  }

  function numericPairs(keyX,keyY) {
    return records().map(e=>({e,x:cval(e,keyX),y:cval(e,keyY)})).filter(r=>Number.isFinite(r.x)&&Number.isFinite(r.y));
  }

  function pearson(pairs) {
    const n=pairs.length; if(n<3) return null;
    const mx=pairs.reduce((a,p)=>a+p.x,0)/n, my=pairs.reduce((a,p)=>a+p.y,0)/n;
    let a=0,b=0,c=0;
    pairs.forEach(p=>{const x=p.x-mx,y=p.y-my;a+=x*y;b+=x*x;c+=y*y;});
    return b&&c ? a/Math.sqrt(b*c) : null;
  }

  function rank(arr) {
    const sorted=arr.map((v,i)=>({v,i})).sort((a,b)=>a.v-b.v), out=new Array(arr.length);
    let i=0;
    while(i<sorted.length){let j=i+1;while(j<sorted.length&&sorted[j].v===sorted[i].v)j++;const r=(i+j-1)/2+1;for(let k=i;k<j;k++)out[sorted[k].i]=r;i=j;}
    return out;
  }
  function spearman(pairs) {
    if(pairs.length<3) return null;
    const rx=rank(pairs.map(p=>p.x)), ry=rank(pairs.map(p=>p.y));
    return pearson(rx.map((x,i)=>({x,y:ry[i]})));
  }

  function rangeFor(key) {
    const rows=records().map(e=>({e,v:cval(e,key),raw:rawval(e,key),ev:evidenceForCondition(e,key)})).filter(r=>Number.isFinite(r.v));
    if(!rows.length) return null;
    return {n:rows.length,min:Math.min(...rows.map(r=>r.v)),max:Math.max(...rows.map(r=>r.v)),rows};
  }

  function missingness() {
    const rs=records(), keys=[...new Set(rs.flatMap(e=>Object.keys(e.conditions||{})))];
    return keys.map(k=>({key:k,n:rs.filter(e=>condition(e,k)).length,total:rs.length})).sort((a,b)=>(a.n/a.total)-(b.n/b.total));
  }

  function findSourcesInQuestion(q) {
    const low=q.toLowerCase(), found=[];
    sources().forEach(s=>{
      if(low.includes(s.source_id.toLowerCase()) || low.includes((s.title||"").toLowerCase().replace(/[^a-z0-9]/g," ").trim())) found.push(s.source_id);
    });
    return found;
  }

  function finiteNumericValue(raw) {
    if(raw===null || raw===undefined || (typeof raw==="string" && raw.trim()==="")) return null;
    const value=Number(raw);
    return Number.isFinite(value) ? value : null;
  }

  function formatNum(v) {
    const n=finiteNumericValue(v);
    if(n===null) return "not available";
    return Math.abs(n)>=100 ? n.toFixed(1).replace(/\.0$/,"") : n.toPrecision(4).replace(/\.?0+$/,"");
  }

  // Persistent local conversation memory: survives app restarts and stays on-device.
  const MEMORY_KEY = "prometheus.ai.conversation.v3";
  const MEMORY_LIMIT = 30;
  let conversationMemory = [];
  try { const saved=JSON.parse(localStorage.getItem(MEMORY_KEY)||"[]"); if(Array.isArray(saved)) conversationMemory=saved.slice(-MEMORY_LIMIT); } catch(_){}

  function saveMemory(){
    try{localStorage.setItem(MEMORY_KEY,JSON.stringify(conversationMemory.slice(-MEMORY_LIMIT)));}catch(_){}
    const c=document.getElementById("pm-ai-memory-count"); if(c)c.textContent=conversationMemory.length+" remembered turns";
  }
  function rememberTurn(x){
    conversationMemory.push({role:x.role,text:String(x.text||"").replace(/<[^>]+>/g," ").slice(0,1800),title:x.title||"",evidence:x.evidence||"UNKNOWN",ids:(x.ids||[]).slice(0,8),time:Date.now()});
    conversationMemory=conversationMemory.slice(-MEMORY_LIMIT); saveMemory();
  }
  function recentMemory(n=8){return conversationMemory.slice(-n);}
  function resolveFollowUp(q){
    const prev=recentMemory(10).filter(x=>x.role==="user"); if(!prev.length)return q;
    if(/^(why|why\?|how so\?|explain that|tell me more|more detail|what about it|compare them|compare those)\s*$/i.test(q.trim()))
      return prev[prev.length-1].text+" | FOLLOW-UP: "+q;
    return q;
  }
  function relatedPrevious(q){
    const terms=words(q); return recentMemory(10).filter(x=>x.role==="user").map(x=>({x,score:terms.filter(t=>t.length>2&&x.text.toLowerCase().includes(t)).length})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,3).map(x=>x.x);
  }
  function intelligentSynthesis(q,hits,previous){
    const ids=new Set(); hits.forEach(h=>srcIds(h.e).forEach(id=>ids.add(id)));
    const evidence=hits.slice(0,4).map(h=>{
      const e=h.e, obs=(e.observations||[]).slice(0,2).map(o=>o.description||o.phenomenon).filter(Boolean);
      return "<b>"+esc(e.exp_id)+"</b> — "+esc(e.title||e.fuel||"NASA experiment")+"<br><span style='color:#aab2c8'>"+esc(obs.join(" · ")||e.text||"Relevant NASA record")+"</span>";
    }).join("<br><br>");
    const continuity=previous.length?"<br><br><b>Context linked:</b> I connected this with your earlier question about <i>"+esc(previous[previous.length-1].text.slice(0,160))+"</i>.":"";
    return {title:"AI · Evidence synthesis",text:"I ranked the loaded NASA records against your question and built the answer from the strongest matching evidence:<br><br>"+evidence+continuity+"<br><br><b>Scientific judgment:</b> the records support descriptive interpretation. I will not turn association into causation or extrapolation into an observed NASA result.",evidence:"REPORTED",score:Math.min(.96,.72+hits.length*.06),ids:[...ids],audit:["Intent + entity resolution","Conversation memory consulted","NASA retrieval","Evidence hierarchy applied","Causal/extrapolation gate applied"]};
  }

  // Offline-first intent layer. Phrase aliases compose into broad coverage without a brittle prompt dump.
  const LOCAL_INTENTS = [
    {id:"greeting",test:q=>/^(hi|hello|hey|good morning|good afternoon|good evening|are you there|are you working|hello prometheus|hello gemini)([, ]+(are you (there|working)|can you hear me))?[!.? ]*$/i.test(q.trim())},
    {id:"capabilities",test:q=>/(what can you do|what questions can you answer|how can you help|your capabilities|help me use prometheus|how do i use you)/i.test(q)},
    {id:"overview",test:q=>/(what is prometheus|explain prometheus|introduce prometheus|project overview|what does this project do|tell me about this project)/i.test(q)},
    {id:"judge_pitch",test:q=>/(judge|judges|elevator pitch|project pitch|demo presentation|present this project|explain this project to)/i.test(q)},
    {id:"novelty",test:q=>/(novelty|what is new|what makes.*different|unique contribution|innovation|original contribution)/i.test(q)},
    {id:"methodology",test:q=>/(methodology|how does.*work|working principle|workflow|pipeline|how is.*analysed|how do you analyse)/i.test(q)},
    {id:"why_microgravity",test:q=>/(why.*microgravity|importance.*microgravity|why study.*space|what.*microgravity.*teach)/i.test(q)},
    {id:"applications",test:q=>/(real.?world|application|crew safety|spacecraft safety|practical use|fire safety.*use)/i.test(q)},
    {id:"safety_boundary",test:q=>/(predict|prediction|fire risk|risk score|guarantee|engineering recommendation|real.?time.*risk)/i.test(q)},
    {id:"validation",test:q=>/(validate|validation|verify|reproducible|audit trail|how.*trust|how.*check.*answer)/i.test(q)},
    {id:"sources",test:q=>/(why nasa|why use nasa|data source|which sources|source provenance|where.*data.*come from|dataset source)/i.test(q)},
    {id:"dataset",test:q=>/(dataset|corpus|how many experiments|how many records|how much data|what data.*loaded|data coverage)/i.test(q)},
    {id:"limitations",test:q=>/(limitation|weakness|what.*cannot|known gaps|research gap|what is missing|future work|next steps)/i.test(q)},
    {id:"evidence_policy",test:q=>/(evidence hierarchy|evidence level|observed versus reported|how.*avoid.*hallucination|hallucination|causal claim|prove causation)/i.test(q)},
    {id:"offline",test:q=>/(offline|without internet|without cloud|without gemini|cloud ai|local engine|rule.?based)/i.test(q)}
  ];

  function localIntentAnswer(question, rs) {
    const q=String(question||"").trim();
    const intent=LOCAL_INTENTS.find(rule=>rule.test(q));
    if(!intent) return null;
    const count=rs.length, sourceCount=sources().length;
    const ids=[...new Set(rs.flatMap(srcIds))];
    const sourceList=sources().slice(0,8).map(s=>"<b>"+esc(s.source_id)+"</b> — "+esc(s.title||"NASA PSI source")).join("<br>");
    const base={evidence:"NASA PSI corpus · local deterministic response",score:.98,ids,audit:["Offline intent engine: "+intent.id,"No cloud request issued","NASA indexed corpus consulted","Unsupported claims gated"]};
    if(intent.id==="greeting") return {...base,title:"PROMETHEUS · Local engine ready",text:"Yes — PROMETHEUS is responding locally. The offline scientific engine is active with <b>"+count+"</b> indexed experiment records and <b>"+sourceCount+"</b> NASA PSI source records. No Gemini request is needed."};
    if(intent.id==="capabilities") return {...base,title:"PROMETHEUS · Offline capabilities",text:"I can search indexed NASA experiments; compare named records such as S1/S2; retrieve oxygen, pressure, gravity and flow conditions; summarize observations; calculate coverage and descriptive statistics; identify missing evidence; trace source citations; and explain the project's methodology and limitations.<br><br>I do not invent measurements or infer causation from descriptive comparisons."};
    if(intent.id==="overview"||intent.id==="judge_pitch") return {...base,title:"PROMETHEUS · Project briefing",text:"<b>PROMETHEUS</b> is an evidence-grounded scientific exploration system for NASA microgravity-combustion research. It organizes provenance-tracked NASA Physical Sciences Informatics (PSI) records, lets users search and compare experiments, summarizes reported conditions and observations, and computes reproducible statistics from indexed data.<br><br><b>Core value:</b> every scientific claim is traceable to its source, with NASA-reported facts separated from derived statistics, interpretation and unknowns.<br><br><b>Current corpus:</b> "+count+" indexed experiment records across "+sourceCount+" registered sources. This is a curated seed corpus, not the complete NASA PSI archive."};
    if(intent.id==="novelty") return {...base,title:"PROMETHEUS · Research contribution",text:"The contribution is a transparent research workflow combining provenance-preserving NASA PSI evidence, experiment-level comparison, deterministic analysis, evidence-state labels and explicit abstention when indexed data cannot support a conclusion. It does not claim to discover a new combustion law. Its distinction is traceability: users can inspect which record supports a statement, what was reported versus derived, and which variables remain missing."};
    if(intent.id==="methodology") return {...base,title:"PROMETHEUS · Methodology",text:"<b>1. Ingest:</b> load a curated NASA PSI seed corpus while retaining experiment IDs, source IDs and reported wording.<br><b>2. Retrieve:</b> match questions to experiment metadata, conditions, observations and source records.<br><b>3. Validate:</b> distinguish observed measurements, source-reported context, derived values and unknown fields.<br><b>4. Analyze:</b> compute reproducible summaries, coverage and comparisons from usable numeric records.<br><b>5. Explain:</b> return a synthesis with source trace, caveats and an audit trail.<br><br>The current assistant uses deterministic rules and calculations; supported answers do not require a remote language model."};
    if(intent.id==="why_microgravity") return {...base,title:"PROMETHEUS · Why study combustion in microgravity?",text:"On Earth, buoyancy strongly influences hot-gas motion around a flame. In microgravity, buoyancy-driven convection is greatly reduced, so transport, flame shape and extinction behaviour can differ from familiar terrestrial cases. Studying these conditions helps researchers understand spacecraft fire behaviour and the limits of applying Earth-based intuition in space. This is the scientific motivation; a specific outcome must still be checked against the cited NASA experiment records."};
    if(intent.id==="applications") return {...base,title:"PROMETHEUS · Potential applications",text:"The research can inform questions relevant to crewed-spacecraft fire safety: material flammability screening, understanding flame spread and extinction, interpreting smoke-related experiments, and identifying which conditions deserve further testing. PROMETHEUS helps inspect and compare the underlying evidence. It is not a certified spacecraft safety system and does not issue operational fire-suppression instructions."};
    if(intent.id==="safety_boundary") return {...base,title:"PROMETHEUS · Prediction and safety boundary",text:"PROMETHEUS is an evidence explorer, not a validated fire-risk predictor, certified engineering tool or physical combustion simulator. It does not produce an operational probability of ignition, crew-hazard score or guaranteed suppression recommendation. Such outputs would require a validated physical model, representative full-scale data, uncertainty calibration and independent verification. The current system reports only what its indexed NASA records and transparent calculations support."};
    if(intent.id==="validation") return {...base,title:"PROMETHEUS · How answers are checked",text:"Each response is produced from local rules and the indexed dataset. Experiment IDs and source IDs are retained; numeric summaries use deterministic calculations; missing fields stay unknown; derived values carry caveats; and an audit trail records the retrieval and evidence gates. This makes the process inspectable and repeatable. It does not by itself prove that the seed corpus is complete or that every scientific conclusion has been independently peer-reviewed."};
    if(intent.id==="sources") return {...base,title:"PROMETHEUS · NASA source provenance",text:"PROMETHEUS uses NASA Physical Sciences Informatics investigation records. Each indexed record retains source identifiers and citation metadata for traceability. Registered sources include:<br><br>"+sourceList+"<br><br>Only sources loaded into this build are represented; the seed corpus is not the complete NASA archive."};
    if(intent.id==="dataset") return {...base,title:"PROMETHEUS · Dataset status",text:"The loaded corpus contains <b>"+count+"</b> experiment records and <b>"+sourceCount+"</b> registered NASA PSI sources. It is a provenance-tracked seed corpus assembled from investigation metadata and experimental-table entries. Missing values remain missing; canonical midpoints or proxies are disclosed as derived plotting aids, not direct measurements."};
    if(intent.id==="limitations") return {...base,title:"PROMETHEUS · Limitations and next steps",text:"<b>Current limitations:</b><br>• The indexed NASA PSI seed corpus is small and is not the complete archive.<br>• Some investigations expose metadata or reported ranges rather than raw instrument-level observations.<br>• Missing fields reduce valid comparisons and paired statistical observations.<br>• Descriptive association does not establish causation.<br>• The local rule engine is specialized for PROMETHEUS combustion research, not a general-purpose chatbot.<br><br><b>Next steps:</b> expand the provenance-checked corpus, add source-level validation, broaden tested question patterns, and evaluate answers against a judge-style question set."};
    if(intent.id==="evidence_policy") return {...base,title:"PROMETHEUS · Evidence policy",text:"<b>NASA OBSERVED:</b> a measurement explicitly present in an indexed observation.<br><b>NASA REPORTED:</b> a condition or value stated by source metadata or tables.<br><b>DERIVED:</b> a reproducible calculation from indexed values, with method disclosed.<br><b>MODEL-INFERRED:</b> an interpretation that is not itself a NASA observation.<br><b>UNKNOWN:</b> the corpus does not support the requested claim.<br><br>A missing value is never treated as zero. A difference between two experiments is not automatically causal."};
    return {...base,title:"PROMETHEUS · Offline mode",text:"PROMETHEUS answers locally first. Questions are matched against compositional intent rules and the indexed NASA corpus; comparisons and statistics are computed on-device. This local path sends no question to Gemini. Unsupported questions receive an honest limitation instead of a fabricated answer."};
  }

  function answer(q) {
    const originalQuestion=q;
    q=expandQuestionAliases(resolveFollowUp(q));
    const allRecords=records();
    const normalizedQuestion=q.toLowerCase().replace(/[^a-z0-9]/g,"");
    const namedRecords=allRecords.filter(e=>normalizedQuestion.includes(String(e.exp_id||"").toLowerCase().replace(/[^a-z0-9]/g,"")));
    const hasNamedExperimentScope=namedRecords.length>0;
    // An explicit experiment ID scopes the entire answer, not just its chart.
    // Otherwise broad variable retrieval can answer a PSI-98 question using
    // unrelated PMMA/NTRS records with the same variable name.
    const rs=hasNamedExperimentScope ? namedRecords : allRecords;
    if(!rs.length) return {
      title:"AI · Evidence unavailable", text:"The NASA PSI dataset is not loaded, so I cannot make a scientific claim. Load a provenance-tracked NASA PSI dataset and ask again.",
      evidence:"UNKNOWN", score:0, ids:[], audit:["Dataset gate: FAIL","Answer gate: BLOCKED"]
    };

    const low=q.toLowerCase(), ws=words(q), ids=new Set(), audit=["NASA-only corpus selected","External-knowledge fallback disabled"];
    const visual = scientificVisual(q, rs);
    const visual3d = scientific3DVisual(q, rs);
    const localIntent=localIntentAnswer(q,rs);
    // Preserve generated visual output when a short local intent also matches
    // the same question (e.g. "show a pie chart of the dataset").
    if(localIntent) return {...localIntent,visual:visual||localIntent.visual||"",visual3d:visual3d||localIntent.visual3d||""};
    const explicit=findSourcesInQuestion(q); explicit.forEach(x=>ids.add(x));

    if(OUTSIDE.test(low) && !NASA_TERMS.has(ws[0])) {
      audit.push("Topic gate: outside NASA combustion scope","Offline general-knowledge model: not configured","Abstention gate: PASS");
      return {title:"AI · General question",text:"This build's offline brain is specialized for NASA microgravity-combustion evidence, so it cannot reliably answer an unrelated question by itself. <b>I can help connect an unrelated question to this project when a scientific link exists, but I will not invent general facts or present unsupported claims as verified evidence. Try asking about an experiment, fuel, flame behaviour, oxygen, pressure, microgravity, evidence quality, research methodology or mission-safety implications. If you want to stay fully offline, I can still help with experiment comparisons, source tracing, definitions grounded in the loaded corpus, evidence gaps, and research planning. I won't present unrelated or guessed information as verified fact.",evidence:"UNKNOWN · general answer unavailable offline",score:.99,ids:[...ids],audit,visual};
    }

    if(/logic|logically|illogical|nonsense|impossible|contradiction|paradox/.test(low)) {
      audit.push("Reasoning mode: logical-consistency analysis","Tone gate: calm","Evidence gate: separate facts from assumptions");
      return {title:"AI · Logical reasoning mode",text:"I will separate the question into <b>known evidence</b>, <b>assumptions</b>, and <b>conclusions</b>. If a premise conflicts with the NASA corpus, I will point out the conflict without treating the question as foolish. If the question is intentionally impossible or contradictory, I will explain why and state what additional evidence would make it answerable.",evidence:"UNKNOWN until premises are grounded",score:.99,ids:[...new Set(rs.flatMap(srcIds))],audit,visual:visual||""};
    }

    if(/what.*establish|what.*do not establish|establish.*do not|explain.*(records|evidence)|what.*(support|show).*(flame|microgravity)|what.*records.*establish/.test(low)) {
      const s1=rs.find(e=>e.exp_id==="PSI98-S1"), s2=rs.find(e=>e.exp_id==="PSI98-S2");
      const m1=s1&&measurement(s1,["burn","duration","time"]), m2=s2&&measurement(s2,["burn","duration","time"]);
      if(s1&&s2) {
        [...srcIds(s1),...srcIds(s2)].forEach(id=>ids.add(id));
        const oxygen1=rawval(s1,"o2_fraction"), oxygen2=rawval(s2,"o2_fraction");
        audit.push("Evidence synthesis: PSI-98 S1/S2","Reported outcomes separated from conditions","Generalization and causal gates applied");
        return {title:"AI · What the indexed evidence establishes",
          text:"<b>What the indexed records establish:</b><br>"+
          "• PSI98-S1 and PSI98-S2 are separate NASA PSI-98 SAFFIRE-I experiment records.<br>"+
          (m1&&m2?"• The indexed corpus attributes burn-duration values of "+formatNum(m1.value)+" "+esc(m1.unit||"s")+" (S1) and "+formatNum(m2.value)+" "+esc(m2.unit||"s")+" (S2) to their NASA source records. These are source-attributed reported values, not a claim that raw instrument files were independently reprocessed.<br>":"")+
          (oxygen1!=null&&oxygen2!=null?"• The indexed oxygen-condition fields are S1: "+esc(oxygen1)+" and S2: "+esc(oxygen2)+". Where a chart uses a canonical midpoint of a reported range, that value is a derived plotting value and must not be read as a more precise NASA measurement.<br>":"")+
          "<br><b>What they do not establish:</b><br>• Two records do not establish a general trend across all microgravity combustion experiments.<br>• A difference between S1 and S2 alone does not prove which condition caused an outcome difference.<br>• This small indexed seed corpus is not the complete NASA PSI archive, and its source metadata is not a substitute for raw experimental data.<br><br>These conclusions are limited to the records and source attributions currently indexed in PROMETHEUS.",
          evidence:"NASA-reported context · limited indexed evidence",score:null,ids:[...ids],audit,visual};
      }
    }

    if(/source|citation|doi|reference|where.*data|data source/.test(low) && !/explain|establish|what.*(show|support|mean)|evidence.*(establish|show)|flame behavior|flame behaviour/.test(low)) {
      audit.push("Source retrieval: matched NASA PSI registry");
      const relevant=explicit.length?explicit:sources().slice(0,8).map(s=>s.source_id);
      return {title:"AI · NASA source ledger",text:"PROMETHEUS is currently grounded in "+rs.length+" loaded experiment records and "+sources().length+" registered NASA PSI sources. Each source below is traceable to its NASA PSI investigation record and DOI.",evidence:"NASA PSI provenance is primary evidence · "+sources().length+" source records",score:.98,ids:relevant,audit,visual};
    }

    // A missingness request naming a specific variable must report that
    // variable's coverage, not the globally sparsest field. Otherwise the
    // narrative can describe gravity while the attached graph plots oxygen.
    if(/missing|gap|unknown|not know|insufficient|coverage/.test(low)) {
      let requestedKey=null, requestedLabel=null;
      if(/oxygen|o2(?:_fraction)?|oxygen concentration/.test(low)) { requestedKey="o2_fraction"; requestedLabel="oxygen fraction"; }
      else if(/gravity|microgravity level|g[- ]?level/.test(low)) { requestedKey="gravity_g"; requestedLabel="gravity level"; }
      else if(/pressure|pressur/.test(low)) { requestedKey="pressure_kpa"; requestedLabel="pressure"; }
      else if(/flow velocity|velocity|co-flow/.test(low)) { requestedKey="flow_velocity_mm_s"; requestedLabel="flow velocity"; }
      if(requestedKey) {
        const available=rs.filter(e=>condition(e,requestedKey));
        const missing=rs.filter(e=>!condition(e,requestedKey));
        const lines=available.slice(0,10).map(e=>{
          const value=rawval(e,requestedKey);
          return esc(e.exp_id)+": "+esc(value==null?"reported, value unavailable":value);
        }).join("<br>");
        const idsForVariable=[...new Set(available.flatMap(srcIds))];
        audit.push("Variable-specific coverage: "+requestedKey,"Missing values remain unknown");
        return {title:"AI · Variable coverage: "+requestedLabel,
          text:"The requested variable is <b>"+esc(requestedLabel)+"</b> ("+esc(requestedKey)+"). It is present in "+available.length+" of "+rs.length+" loaded experiment records; "+missing.length+" records do not have a usable value in this field."+
          (lines?"<br><br><b>Available indexed values:</b><br>"+lines:"")+
          (missing.length?"<br><br><b>Records with no usable value:</b> "+missing.slice(0,12).map(e=>esc(e.exp_id)).join(", ")+(missing.length>12?" …":""):"")+
          "<br><br>Coverage counts describe this variable only. A missing field is not a measured zero. Any canonical plotting value derived from a reported range is disclosed in the attached chart.",
          evidence:"UNKNOWN for missing fields · source-backed values for available fields",score:null,ids:idsForVariable,audit,visual};
      }
    }

    if(/missing|gap|unknown|not know|insufficient|coverage/.test(low)) {
      const gaps=missingness().slice(0,5);
      const lines=gaps.map(g=>esc(g.key)+": "+g.n+"/"+g.total+" records report this variable").join("<br>");
      audit.push("Coverage analysis: variable-level missingness");
      return {title:"AI · Evidence-gap analysis",text:"The strongest current limitation is incomplete measurement coverage. PROMETHEUS treats missing variables as unknown rather than assuming that an unreported quantity was zero, constant, or irrelevant.<br><br>"+lines,evidence:"UNKNOWN is an explicit result, not a failure",score:.97,ids:[...new Set(rs.flatMap(srcIds))],audit,visual};
    }

    if(/compare|difference|versus|vs\\.?/.test(low) || /\\bs1\\b/.test(low) || /\\bs2\\b/.test(low)) {
      const a=rs.find(e=>/s1/i.test(e.exp_id)), b=rs.find(e=>/s2/i.test(e.exp_id));
      if(a&&b) {
        [...srcIds(a),...srcIds(b)].forEach(x=>ids.add(x));
        const fields=["pressure_kpa","o2_fraction","gravity_g","flow_velocity_mm_s"];
        const rows=fields.map(k=>{
          const av=condition(a,k),bv=condition(b,k);
          if(!av || av.value==null || !bv || bv.value==null) {
            return "<b>"+esc(k)+"</b>: not reported for both records";
          }
          const ea=EVIDENCE[evidenceForCondition(a,k)]||EVIDENCE.UNKNOWN;
          const eb=EVIDENCE[evidenceForCondition(b,k)]||EVIDENCE.UNKNOWN;
          return "<b>"+esc(conditionLabel(k))+"</b>: "+esc(formatCondition(a,k))+" vs "+esc(formatCondition(b,k))+
            " ("+ea.label+" / "+eb.label+")";
        }).join("<br>");
        const am=measurement(a,["burn","duration","time"]), bm=measurement(b,["burn","duration","time"]);
        let extra="";
        if(am&&bm) extra="<br><br><b>Observed outcome:</b> "+formatNum(am.value)+" "+esc(am.unit||"")+
          " vs "+formatNum(bm.value)+" "+esc(bm.unit||"")+".";
        audit.push("Entity resolution: PSI98-S1 + PSI98-S2","Condition alignment: complete for reported shared variables","Causal gate: BLOCKED");
        return {title:"AI · Controlled experiment comparison",text:"S1 and S2 are both NASA PSI-98 SIBAL-fabric records. The comparison below separates shared conditions from differences; it does not assume that an outcome difference proves causation.<br><br>"+rows+extra+"<br><br><b>Scientific interpretation:</b> the records can support a descriptive comparison, but this pair alone cannot isolate a causal effect unless the relevant confounders are controlled.",evidence:"NASA OBSERVED/REPORTED · causal claim withheld",score:.95,ids:[...ids],audit,visual};
      }
    }

    if(/oxygen|o2/.test(low)) {
      const rows=rs.map(e=>({e,v:rawval(e,"o2_fraction"),ev:evidenceForCondition(e,"o2_fraction")})).filter(r=>r.v!=null);
      rows.forEach(r=>srcIds(r.e).forEach(x=>ids.add(x)));
      if(!rows.length) return {title:"AI · Oxygen evidence gap",text:"No loaded experiment record reports oxygen concentration in a directly usable form. I therefore cannot supply an oxygen value.",evidence:"UNKNOWN",score:.98,ids:[...ids],audit:["Variable retrieval: O2","Observation gate: no usable records","Answer gate: abstain"],visual};
      const list=rows.slice(0,8).map(r=>esc(r.e.exp_id)+": "+esc(r.v)+" · "+EVIDENCE[r.ev].label).join("<br>");
      audit.push("Variable retrieval: o2_fraction","Reported values preserved verbatim");
      return {title:"AI · Oxygen evidence",text:"NASA PSI reports the following oxygen values in the loaded corpus. I preserve NASA's reported wording instead of replacing a range with a made-up precise measurement:<br><br>"+list+"<br><br>These records are not, by themselves, enough to claim that oxygen concentration caused a specific flame outcome. PROMETHEUS would require comparable experiments spanning oxygen conditions and a measured outcome.",evidence:"NASA source-backed values · no causal extrapolation",score:.97,ids:[...ids],audit,visual};
    }

    if(/pressure|pressur/.test(low)) {
      const rows=rs.map(e=>({e,v:rawval(e,"pressure_kpa"),ev:evidenceForCondition(e,"pressure_kpa")})).filter(r=>r.v!=null);
      rows.forEach(r=>srcIds(r.e).forEach(x=>ids.add(x)));
      // Broad pressure context is useful for corpus-wide questions, but
      // must not attach unrelated investigations to an explicitly named pair.
      if(hasNamedExperimentScope) rs.forEach(e=>srcIds(e).forEach(x=>ids.add(x)));
      else {
        const context=sources().filter(s=>/pressure|atmosphere|atm/i.test((s.note||"")+" "+(s.title||"")));
        context.forEach(s=>ids.add(s.source_id));
      }
      audit.push("Variable retrieval: pressure","Measurement-vs-metadata separation applied");
      if(!rows.length) return {title:"AI · Pressure evidence gap",text:"The loaded measurement rows do not contain a pressure field. PROMETHEUS will not manufacture one from the investigation-level metadata. Some NASA PSI investigation context may describe pressure ranges, but that is not equivalent to a pressure measurement for these S1/S2 rows.",evidence:"UNKNOWN for loaded measurement rows",score:.99,ids:[...ids],audit,visual};
      return {title:"AI · Pressure evidence",text:"The loaded corpus contains pressure-bearing records. They must be analyzed within their investigation and experimental context; a pressure range in a NASA investigation description is not automatically a measured value for every experiment.",evidence:"NASA REPORTED / NASA OBSERVED depending on record",score:.94,ids:[...ids],audit};
    }

    if(/correlat|relationship|association|affect|impact|cause|causal/.test(low)) {
      const pairs=numericPairs("o2_fraction","flow_velocity_mm_s");
      if(pairs.length<3) {
        audit.push("Statistical gate: n<3","Causal gate: BLOCKED");
        return {title:"AI · Statistical abstention",text:"I do not have enough paired observations in the loaded corpus to support a meaningful correlation or causal statement for this request. A sophisticated system should report insufficient evidence rather than produce a visually convincing but scientifically weak number.",evidence:"UNKNOWN / INSUFFICIENT SAMPLE",score:.99,ids:[...new Set(rs.flatMap(srcIds))],audit,visual};
      }
      const r=spearman(pairs);
      audit.push("Statistical method: Spearman rank correlation","Causal gate: BLOCKED");
      return {title:"AI · Association analysis",text:"For the requested relationship, the loaded records provide n="+pairs.length+" paired observations. Spearman's rho is "+formatNum(r)+". This is descriptive association only; it does not establish causation, especially when the corpus is small or confounded.",evidence:"DERIVED statistic from NASA-loaded observations",score:.86,ids:[...new Set(pairs.flatMap(p=>srcIds(p.e)))],audit,visual};
    }

    if(/what if|scenario|mars|lunar|habitat|spacecraft|mission|safety/.test(low)) {
      const retrieved=retrieve(q,4);
      retrieved.forEach(x=>srcIds(x.e).forEach(id=>ids.add(id)));
      const names=retrieved.length?retrieved.map(x=>x.e.exp_id).join(", "):"none";
      audit.push("Scenario retrieval: nearest textual evidence","Extrapolation gate: model-inferred/unknown","Safety gate: no unsupported recommendation");
      return {title:"AI · Mission scenario reasoning",text:"I can map this scenario to the closest NASA-loaded evidence, but I will not present an extrapolation as a NASA observation. The strongest retrieved records are: <b>"+esc(names)+"</b>.<br><br>For spacecraft, lunar, or Mars questions, PROMETHEUS should distinguish measured microgravity evidence from any change in gravity, pressure, atmosphere, geometry, or fuel that falls outside the observed range. The safe output is therefore an evidence map plus explicit uncertainty—not a fabricated engineering guarantee.",evidence:"MODEL-INFERRED/UNKNOWN outside measured conditions",score:.90,ids:[...ids],audit,visual};
    }

    if(/flame|fire|combust|microgravity|freefall|fuel|ignition|extinction|spread|smoke|droplet/.test(low)) {
      const hits=retrieve(q,4);
      hits.forEach(x=>srcIds(x.e).forEach(id=>ids.add(id)));
      const top=hits.length?hits.map(x=>"<b>"+esc(x.e.exp_id)+"</b> — "+esc(x.e.title||x.e.fuel||"NASA PSI record")).join("<br>"):"No matching loaded record.";
      audit.push("Semantic-lite retrieval: experiment text + metadata","Evidence synthesis: source-preserving");
      return {title:"AI · NASA combustion synthesis",text:"I found the following NASA-loaded evidence records most relevant to the question:<br><br>"+top+"<br><br>PROMETHEUS can compare their reported conditions, observations, provenance, and missing variables. It will not silently import general combustion knowledge to fill gaps.",evidence:"NASA PSI corpus · retrieval confidence "+confidence(Math.min(.95,.55+(hits.length*.1)))+"%",score:.91,ids:[...ids],audit,visual};
    }

    const hits=retrieve(q,5);
    hits.forEach(x=>srcIds(x.e).forEach(id=>ids.add(id)));
    const previous=relatedPrevious(originalQuestion);
    if(hits.length) return intelligentSynthesis(originalQuestion,hits,previous);
    audit.push("Intent classifier: unresolved","Retrieval: no sufficiently relevant records","Abstention gate: active");
    return {title:"AI · Need a more specific scientific question",text:"I understand the question, but I could not confidently map it to the loaded NASA evidence. Name an experiment, variable, outcome, or ask for comparison, explanation, source tracing, statistics, or an evidence gap. I will remember this conversation so the next question can continue from the same context.",evidence:"UNKNOWN",score:.98,ids:[...ids],audit};
  }

  function add(role,title,text,evidence,score,ids,audit,visual,visual3d) {
    const el=document.createElement("div");
    el.className="pm-msg "+role;
    const pct=""; // Heuristic scores are not calibrated evidence-confidence estimates; do not display them.
    const ev=EVIDENCE[evidence]||EVIDENCE.UNKNOWN;
    const sourcesHtml=ids&&ids.length?sourceCards(ids):"";
    const visualHtml=visual||"";
    const visual3dHtml=visual3d||"";
    el.innerHTML='<div class="pm-meta">'+esc(title)+pct+'</div><div class="pm-answer">'+text+visualHtml+visual3dHtml+'</div>'+
      (evidence?'<div class="pm-evidence"><b style="color:'+ev.color+'">'+ev.label+'</b> · '+(evidence==="OBSERVED"?"directly represented NASA measurement":evidence==="REPORTED"?"NASA investigation-level statement":evidence==="DERIVED"?"computed from loaded NASA values":evidence==="INFERRED"?"model/extrapolation, not direct observation":"not established by the loaded evidence")+
      sourcesHtml+"</div>":"")+
      (audit&&audit.length?'<div class="pm-audit">Audit trail · '+audit.map(esc).join(" → ")+"</div>":"");
    body.appendChild(el);
    bindVisuals(el);
    // Rehydrate canvas state after the 3D card HTML is inserted into the DOM.
    if(visual3d) {
      const holder=el.querySelector(".pm-3d");
      if(holder) {
        const rows=pending3DResult||[];
        if(rows.length) {
          const fresh=build3DResult(rows);
          holder.replaceWith(fresh);
          pending3DResult=null;
        }
      }
    }
    body.scrollTop=body.scrollHeight;
    return el;
  }

  async function ask(q) {
    q=String(q||"").trim(); if(!q)return;
    if(window.__prometheusDatasetReady && !window.__prometheusDatasetReadyComplete) {
      input.disabled=true;
      window.__prometheusDatasetReady.then(()=>{input.disabled=false;ask(q);});
      return;
    }
    rememberTurn({role:"user",text:q});
    add("user","YOU",esc(q),null,null,null,[]);
    input.disabled=true;
    const send=panel.querySelector("#pm-ai-send");
    if(send)send.disabled=true;
    const stage=document.createElement("div");
    stage.className="pm-msg ai";
    stage.innerHTML='<div class="pm-meta">PROMETHEUS · RESEARCH PIPELINE</div><div class="pm-answer"><div class="pm-pipeline"><div>① <b>THINK</b> · classify the question and identify the required evidence</div><div class="pm-loading">② <b>FETCH NASA DATA</b> · querying the locally cached, provenance-linked NASA PSI corpus</div><div>③ <b>RESPONSE</b> · waiting for evidence synthesis and visualization</div></div></div>';
    body.appendChild(stage);
    body.scrollTop=body.scrollHeight;
    try {
      await new Promise(resolve=>setTimeout(resolve,90));
      const rs=records(), ss=sources();
      stage.querySelector(".pm-pipeline").innerHTML=
        '<div>✓ <b>THINK</b> · question classified; NASA combustion scope selected</div>'+
        '<div class="pm-loading">② <b>FETCH NASA DATA</b> · searching '+rs.length+' indexed records across '+ss.length+' source entries</div>'+
        '<div>③ <b>RESPONSE</b> · synthesizing evidence and rendering requested visuals</div>';
      await new Promise(resolve=>setTimeout(resolve,90));
      const a=answer(q);
      stage.remove();
      rememberTurn({role:"assistant",text:a.text,title:a.title,evidence:a.evidence,ids:a.ids||[]});
      add("ai",a.title,a.text,a.evidence,a.score,a.ids||[],a.audit||[],a.visual||"",a.visual3d||"");
    } catch(e) {
      stage.remove();
      const safe="The local reasoning engine encountered an internal error. No unsupported answer was generated. Please rephrase the question; your conversation memory is preserved locally.";
      rememberTurn({role:"assistant",text:safe,title:"AI · Safe failure",evidence:"UNKNOWN"});
      add("ai","AI · Safe failure",safe,"UNKNOWN",0,[],["Exception trapped","Local answer gate: BLOCKED"]);
    } finally {
      input.disabled=false;
      if(send)send.disabled=false;
      input.focus();
      saveMemory();
    }
  }

  function readyMessage() {
    const rs=records(), ss=sources();
    add("ai","AI · NASA evidence firewall",
      rs.length
        ? "Ready. I can retrieve and reason over <b>"+rs.length+"</b> loaded experiment records linked to <b>"+ss.length+"</b> NASA PSI sources. The engine is designed to separate observed measurements, NASA-reported context, derived statistics, model inference, analogy, and unknowns. If the corpus cannot support a claim, I will say so."
        : "The NASA dataset is not loaded yet. I will not answer from general knowledge until a provenance-tracked NASA PSI dataset is available.",
      rs.length?"REPORTED":"UNKNOWN",rs.length?.98:.99,[...new Set(rs.flatMap(srcIds))],
      ["Dataset gate: "+(rs.length?"PASS":"WAITING"),"Source firewall: NASA PSI only","Causal claims require evidence"]);
  }

  function restoreConversation(){
    // Keep prior turns available to follow-up resolution, but never inject an old
    // transcript into a fresh chat view. This avoids stale/prompt-like answers
    // appearing before the user asks a new question.
    saveMemory();
  }
  // The AI orb and assistant card are both draggable so they can be moved away
  // from Research controls and content. Clamp the panel inside the visible viewport.
  function openAI(){
    panel.classList.add("open");
    if(!body.childElementCount) {
      const ready=window.__prometheusDatasetReady;
      if(ready && !window.__prometheusDatasetReadyComplete) {
        body.innerHTML='<div class="pm-meta">PROMETHEUS · Loading NASA PSI data</div><div class="pm-answer">Loading the expanded experimental tables locally. The assistant will be ready in a moment.</div>';
        input.disabled=true;
        const send=panel.querySelector("#pm-ai-send");if(send)send.disabled=true;
        ready.then(()=>{
          input.disabled=false;if(send)send.disabled=false;
          body.replaceChildren();readyMessage();
        });
      } else readyMessage();
    }
    panel.scrollIntoView({behavior:"smooth",block:"start"});
  }
  function closeAI(){panel.classList.remove("open");}
  // Native Android Back asks this handler first. Return true only when chat consumes Back.
  window.__prometheusBack = function(){if(panel.classList.contains("open")){closeAI();return true;}return false;};
  document.getElementById("pm-ai-clear").onclick=()=>{conversationMemory=[];try{localStorage.removeItem(MEMORY_KEY);}catch(_){}body.replaceChildren();readyMessage();saveMemory();};

  panel.querySelector("#pm-ai-close").onclick=closeAI;
  window.addEventListener("keydown",e=>{if(e.key==="Escape"&&panel.classList.contains("open"))closeAI();});
  panel.querySelector("#pm-ai-form").onsubmit=e=>{e.preventDefault();ask(input.value);input.value="";};
  panel.querySelectorAll(".pm-chip").forEach(b=>b.onclick=()=>{input.value=b.textContent;ask(input.value);input.value="";});

  saveMemory();
  window.__prometheusAIStatus = "ready";
  window.__prometheusAIOpen = openAI;

  window.PROMETHEUS_AI = {
    version:"3.0.0",
    mode:"OFFLINE-FIRST-NASA-RULE-ENGINE",
    ask,
    audit:q=>answer(q),
    corpus:()=>({experiments:records().length,sources:sources().length,synthetic:!!(ds()&&ds().hasSynthetic)}),
    intents:()=>LOCAL_INTENTS.map(x=>x.id),
    queryAliasGroups:()=>QUERY_ALIASES.length,
    evidence:EVIDENCE
  };
})();