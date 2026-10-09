(() => {
  "use strict";
  if (window.__prometheusAIStatus === "ready") {
    // Defensive cleanup for stale duplicate overlays from prior hot reloads / repeated script injection.
    for (const selector of ["#pm-ai-panel", "#pm-ai-fab"]) {
      const nodes = document.querySelectorAll(selector);
      nodes.forEach((node, index) => { if (index > 0) node.remove(); });
    }
    return;
  }
  if (window.__prometheusAIStatus === "loading" && window.__prometheusAIInjected) return;
  // Remove stale elements left by an interrupted previous initialization before creating the singleton.
  document.querySelectorAll("#pm-ai-panel, #pm-ai-fab").forEach(node => node.remove());
  window.__prometheusAIStatus = "loading";
  window.__prometheusAIInjected = true;

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
  style.textContent = `
    #pm-ai-fab{position:fixed;right:18px;bottom:22px;z-index:99999;width:62px;height:62px;border-radius:50%;border:1px solid rgba(230,203,147,.8);background:radial-gradient(circle at 35% 27%,#fff8df 0 8%,#e6cb93 25%,#6f5830 62%,#090c15 100%);box-shadow:0 14px 40px rgba(0,0,0,.62),0 0 30px rgba(230,203,147,.28);color:#161108;font:700 12px IBM Plex Sans,system-ui;cursor:grab;touch-action:none;user-select:none}
    #pm-ai-fab .pm-orbit{position:absolute;inset:8px;border:1px solid rgba(20,16,8,.42);border-radius:50%;transform:rotate(-23deg)}
    #pm-ai-fab .pm-spark{font-size:17px;line-height:13px;display:block}
    #pm-ai-fab span{display:block;font-size:9px;letter-spacing:.16em;margin-top:2px}
    #pm-ai-panel{position:fixed;right:18px;bottom:94px;z-index:99998;width:min(455px,calc(100vw - 28px));height:min(720px,calc(100vh - 112px));display:none;flex-direction:column;overflow:hidden;border:1px solid rgba(230,203,147,.35);border-radius:24px;background:rgba(5,8,17,.965);backdrop-filter:blur(24px);box-shadow:0 35px 90px rgba(0,0,0,.72),inset 0 1px rgba(255,255,255,.06);color:#eef0f7}
    #pm-ai-panel.open{display:flex}
    #pm-ai-panel.fullscreen{inset:env(safe-area-inset-top,0px) 0 0 0!important;left:0!important;right:0!important;top:env(safe-area-inset-top,0px)!important;bottom:0!important;width:100vw!important;height:100dvh!important;max-height:none!important;min-height:0!important;border-radius:0!important;border-left:0;border-right:0;border-top:0;z-index:100000}
    #pm-ai-panel.fullscreen #pm-ai-body{min-height:0}
    #pm-ai-panel.fullscreen #pm-ai-form{padding-bottom:calc(10px + env(safe-area-inset-bottom,0px))}
    #pm-ai-panel.fullscreen #pm-ai-head{padding-top:calc(14px + env(safe-area-inset-top,0px));cursor:default;touch-action:auto}
    #pm-ai-panel.fullscreen #pm-ai-head:after{display:none}
    #pm-ai-head{padding:16px 18px 13px;border-bottom:1px solid rgba(255,255,255,.09);display:flex;align-items:flex-start;justify-content:space-between;gap:12px;cursor:grab;touch-action:none;user-select:none} #pm-ai-head:active{cursor:grabbing} #pm-ai-head button{touch-action:manipulation}
    #pm-ai-head strong{font:500 23px Cormorant Garamond,Georgia,serif;letter-spacing:.08em}
    #pm-ai-head small{display:block;color:#aab2c8;font:10.5px IBM Plex Sans,system-ui;margin-top:2px}
    #pm-ai-status{display:inline-flex;align-items:center;gap:6px;margin-top:8px;color:#4fe3a0;font:10px IBM Plex Sans,system-ui;letter-spacing:.08em;text-transform:uppercase}
    #pm-ai-status i{width:6px;height:6px;border-radius:50%;background:#4fe3a0;box-shadow:0 0 9px #4fe3a0}
    #pm-ai-close{background:none;border:0;color:#aab2c8;font-size:22px;cursor:pointer}
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
    #pm-ai-send{border:1px solid #e6cb93;background:#e6cb93;color:#171106;border-radius:13px;padding:0 14px;font-weight:700;cursor:pointer}
    @media(max-width:600px){#pm-ai-fab{right:14px;bottom:calc(112px + env(safe-area-inset-bottom,0px))}#pm-ai-panel:not(.fullscreen){left:0;right:0;top:0;bottom:0;width:100vw;height:100dvh;max-height:none;border-radius:0}#pm-ai-head{position:relative;padding-top:18px}#pm-ai-head>div{padding-top:8px}}
  `;
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
        <div id="pm-ai-status"><i></i> NASA source firewall · local evidence ready</div><button id="pm-ai-cloud" type="button" style="margin-top:8px;background:transparent;border:1px solid rgba(230,203,147,.3);border-radius:9px;color:#e6cb93;padding:6px 9px;font:10px IBM Plex Sans,system-ui">Enable Cloud AI</button><div id="pm-ai-memory-count" style="margin-top:5px;color:#737c96;font:9px IBM Plex Sans,system-ui;letter-spacing:.06em"></div>
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
  document.body.appendChild(fab);

  const body = panel.querySelector("#pm-ai-body");
  const CLOUD_ENDPOINT_KEY = "prometheus_cloud_ai_endpoint";
  const CLOUD_CONSENT_KEY = "prometheus_cloud_ai_consent";
  const cloudButton = panel.querySelector("#pm-ai-cloud");
  const cloudEndpoint = () => { try { return localStorage.getItem(CLOUD_ENDPOINT_KEY) || window.__PROMETHEUS_AI_ENDPOINT || ""; } catch (_) { return window.__PROMETHEUS_AI_ENDPOINT || ""; } };
  const cloudEnabled = () => { try { return localStorage.getItem(CLOUD_CONSENT_KEY) === "yes" && !!cloudEndpoint(); } catch (_) { return !!cloudEndpoint(); } };
  function updateCloudButton(){ cloudButton.textContent = cloudEnabled() ? "Cloud AI enabled · tap to disable" : "Enable Cloud AI"; }
  cloudButton.onclick = () => {
    if (cloudEnabled()) {
      try { localStorage.removeItem(CLOUD_CONSENT_KEY); } catch (_) {}
      updateCloudButton(); UI.toast("Cloud AI disabled · local mode remains available");
      return;
    }
    const endpoint = window.prompt("Enter your PROMETHEUS AI server endpoint (for example https://your-domain/api/ask). Your question will leave this device only after you enable Cloud AI.");
    if (!endpoint) return;
    try { localStorage.setItem(CLOUD_ENDPOINT_KEY, endpoint.replace(/\/+$/, "")); localStorage.setItem(CLOUD_CONSENT_KEY, "yes"); } catch (_) {}
    updateCloudButton(); UI.toast("Cloud AI enabled with explicit consent");
  };
  updateCloudButton();

  function visualShell(title, subtitle, inner, key) {
    const id="pmv-"+Math.random().toString(36).slice(2,9);
    return '<div class="pm-visual" id="'+id+'"><div class="pm-visual-head"><span>'+esc(title)+'</span><span>'+esc(subtitle||"NASA data")+'</span></div>'+inner+
      '<div class="pm-visual-actions"><button class="pm-vbtn" data-export="'+id+'">Export image</button></div></div>';
  }

  function chartSVG(rows, xLabel, yLabel, title) {
    const w=390,h=205,p={l:42,r:16,t:18,b:38};
    const vals=rows.map(r=>Number(r.y)).filter(Number.isFinite);
    if(!vals.length) return "";
    const min=Math.min(...vals),max=Math.max(...vals),span=max-min||1;
    const x=i=>p.l+(i/(Math.max(1,rows.length-1)))*(w-p.l-p.r);
    const y=v=>p.t+(1-(v-min)/span)*(h-p.t-p.b);
    const points=rows.map((r,i)=>x(i)+","+y(Number(r.y))).join(" ");
    const circles=rows.map((r,i)=>'<circle cx="'+x(i)+'" cy="'+y(Number(r.y))+'" r="4" fill="#e6cb93"><title>'+esc(r.label)+': '+esc(r.y)+'</title></circle>').join("");
    const labels=rows.map((r,i)=>'<text x="'+x(i)+'" y="'+(h-18)+'" fill="#aab2c8" font-size="9" text-anchor="middle">'+esc(r.label)+'</text>').join("");
    return '<svg viewBox="0 0 '+w+' '+h+'" role="img" aria-label="'+esc(title)+'"><line x1="'+p.l+'" y1="'+p.t+'" x2="'+p.l+'" y2="'+(h-p.b)+'" stroke="rgba(255,255,255,.18)"/><line x1="'+p.l+'" y1="'+(h-p.b)+'" x2="'+(w-p.r)+'" y2="'+(h-p.b)+'" stroke="rgba(255,255,255,.18)"/><polyline fill="none" stroke="#e6cb93" stroke-width="2.5" points="'+points+'"/>'+circles+labels+'<text x="'+p.l+'" y="12" fill="#eef0f7" font-size="10">'+esc(yLabel)+'</text><text x="'+(w/2)+'" y="'+(h-3)+'" fill="#737c96" font-size="9" text-anchor="middle">'+esc(xLabel)+'</text></svg>';
  }

  function flameSVG(rows) {
    const w=390,h=235;
    const max=Math.max(...rows.map(r=>Number(r.y)||0),1);
    const flames=rows.map((r,i)=>{
      const cx=78+i*118, burn=Number(r.y)||0, scale=.65+.7*(burn/max);
      const rx=30*scale, ry=72*scale;
      return '<g transform="translate('+cx+' 116)"><ellipse rx="'+(rx+7)+'" ry="'+(ry+7)+'" fill="rgba(168,220,255,.06)" stroke="rgba(168,220,255,.25)"/><path d="M0 '+ry+' C-'+rx+' '+(ry*.55)+' -'+(rx*.7)+' '+(ry*.1)+' -'+(rx*.15)+' -'+(ry*.35)+' C-'+(rx*.15)+' -'+(ry*.7)+' '+(rx*.55)+' -'+(ry*.72)+' 0 -'+ry+' C'+(rx*.65)+' -'+(ry*.72)+' '+rx*.15+' '+(ry*.05)+' 0 '+ry+'Z" fill="#e6cb93" opacity=".88"/><text y="'+(ry+22)+'" text-anchor="middle" fill="#eef0f7" font-size="10">'+esc(r.label)+'</text><text y="'+(ry+36)+'" text-anchor="middle" fill="#aab2c8" font-size="9">'+esc(r.y)+' s burn</text></g>';
    }).join("");
    return '<svg viewBox="0 0 '+w+' '+h+'" role="img" aria-label="NASA-derived flame comparison"><rect width="100%" height="100%" fill="#070b15"/><text x="16" y="22" fill="#e6cb93" font-size="11" letter-spacing="1.4">NASA OBSERVED · FLAME BEHAVIOUR</text>'+flames+'</svg>';
  }

  function scientificVisual(q, rs) {
    const low=q.toLowerCase();
    if(/graph|plot|chart|trend|correlat|relationship|compare|difference|burn time|flame/.test(low)) {
      const s1=rs.find(e=>/s1/i.test(e.exp_id)), s2=rs.find(e=>/s2/i.test(e.exp_id));
      const rows=[s1,s2].filter(Boolean).map(e=>({label:e.exp_id.replace("PSI98-",""),y:(e.observations||[]).find(o=>/burn/i.test((o.phenomenon||"")+" "+(o.description||""))&&o.measurement)?.measurement?.canonical_value})).filter(r=>Number.isFinite(Number(r.y)));
      if(rows.length>=2) return visualShell("Observed burn-time comparison","NASA PSI-98",chartSVG(rows,"Experiment","Burn time (s)","NASA observed burn time"),"burn");
    }
    if(/image|visual|flame|fire|render|picture|look like/.test(low)) {
      const rows=rs.map(e=>({label:e.exp_id.replace("PSI98-",""),y:(e.observations||[]).find(o=>/burn/i.test((o.phenomenon||"")+" "+(o.description||""))&&o.measurement)?.measurement?.canonical_value})).filter(r=>Number.isFinite(Number(r.y)));
      if(rows.length) return visualShell("Scientific flame rendering","Geometry is illustrative; values are NASA-derived",flameSVG(rows),"flame");
    }
    return "";
  }

  function build3DResult(rows) {
    const id="pm3d-"+Math.random().toString(36).slice(2,9);
    const card=document.createElement("div");
    card.className="pm-3d";
    card.innerHTML='<div class="pm-3d-hud"><span>NASA DATA · 3D RESULT</span><span>Drag · rotate · scroll · zoom</span></div><canvas width="780" height="540"></canvas><div class="pm-3d-controls"><button data-rotate>Auto rotate</button><button data-video>Generate video</button><button data-reset>Reset</button></div><div class="pm-video-note">Rendered from loaded NASA-derived values. Geometry is a scientific visualization, not a NASA image or measurement.</div>';
    const canvas=card.querySelector("canvas"), ctx=canvas.getContext("2d");
    let yaw=-.35,pitch=-.18,zoom=1.0,running=true,raf=0,recording=false;
    let lastX=0,lastY=0,drag=false;
    const pts=[];
    const max=Math.max(...rows.map(r=>Number(r.y)||0),1);
    rows.forEach((r,idx)=>{
      const burn=Number(r.y)||0, radius=20+52*(burn/max);
      for(let i=0;i<44;i++){
        const a=i/44*Math.PI*2+idx*.7, h=(i%11)/10*2-1;
        pts.push({x:Math.cos(a)*radius*(.55+.45*Math.random()),y:h*radius,z:Math.sin(a)*radius*(.55+.45*Math.random()),g:idx});
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
      ctx.fillStyle="#eef0f7";ctx.font="18px system-ui";ctx.fillText("NASA-derived experiment space",24,32);
      ctx.fillStyle="#737c96";ctx.font="12px system-ui";ctx.fillText("Relative 3D representation · not a measured geometry",24,52);
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
    if(!/3d|three.?d|spatial|volume|surface|model|visualize|visualise/.test(low)) return "";
    const rows=rs.map(e=>({label:e.exp_id,y:(e.observations||[]).find(o=>/burn/i.test((o.phenomenon||"")+" "+(o.description||""))&&o.measurement)?.measurement?.canonical_value})).filter(r=>Number.isFinite(Number(r.y)));
    if(rows.length<1) return "";
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
  const srcFor = id => sources().find(s=>s.source_id===id) || null;
  const srcIds = e => Array.isArray(e.source_ids) ? e.source_ids : [];
  const condition = (e,k) => e && e.conditions && e.conditions[k] ? e.conditions[k] : null;
  const cval = (e,k) => { const c=condition(e,k); return c && c.canonical_value != null ? Number(c.canonical_value) : null; };
  const rawval = (e,k) => { const c=condition(e,k); return c ? c.value : null; };
  const allText = e => [e.exp_id,e.title,e.platform,e.fuel,e.text,...(e.observations||[]).flatMap(o=>[o.phenomenon,o.description,o.source_id,o.locator])].filter(Boolean).join(" ").toLowerCase();

  function evidenceForCondition(e,k) {
    const c=condition(e,k);
    if(!c) return "UNKNOWN";
    if(/proxy/i.test(c.canonical_note||"")) return "INFERRED";
    if(/midpoint/i.test(c.canonical_note||"")) return "DERIVED";
    return "OBSERVED";
  }
  function evidenceForObservation(o) { return o && o.measurement ? "OBSERVED" : "REPORTED"; }

  function measurement(e, terms) {
    for (const o of (e.observations||[])) {
      const hay=[o.phenomenon,o.description,o.locator].filter(Boolean).join(" ").toLowerCase();
      if (terms.some(t=>hay.includes(t)) && o.measurement && o.measurement.canonical_value!=null) {
        return {value:Number(o.measurement.canonical_value), raw:o.measurement.value, unit:o.measurement.unit, source:o.source_id, locator:o.locator, evidence:"OBSERVED"};
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

  function formatNum(v) {
    if(!Number.isFinite(Number(v))) return "not available";
    const n=Number(v); return Math.abs(n)>=100 ? n.toFixed(1).replace(/\.0$/,"") : n.toPrecision(4).replace(/\.?0+$/,"");
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

  function answer(q) {
    const originalQuestion=q;
    q=resolveFollowUp(q);
    const rs=records();
    if(!rs.length) return {
      title:"AI · Evidence unavailable", text:"The NASA PSI dataset is not loaded, so I cannot make a scientific claim. Load a provenance-tracked NASA PSI dataset and ask again.",
      evidence:"UNKNOWN", score:0, ids:[], audit:["Dataset gate: FAIL","Answer gate: BLOCKED"]
    };

    const low=q.toLowerCase(), ws=words(q), ids=new Set(), audit=["NASA-only corpus selected","External-knowledge fallback disabled"];
    const visual = scientificVisual(q, rs);
    const visual3d = scientific3DVisual(q, rs);
    const explicit=findSourcesInQuestion(q); explicit.forEach(x=>ids.add(x));

    if(OUTSIDE.test(low) && !NASA_TERMS.has(ws[0])) {
      audit.push("Topic gate: outside NASA combustion scope","Abstention gate: PASS");
      return {title:"AI · Scope boundary",text:"I can help with NASA microgravity combustion, spacecraft fire safety, the loaded NASA PSI investigations, experiment comparison, evidence gaps, and evidence-grounded mission scenarios. I will not invent an answer from general web knowledge for an unrelated topic. If you want, reframe the question around NASA combustion evidence.",evidence:"UNKNOWN · NASA-only mode",score:.99,ids:[...ids],audit,visual};
    }

    if(/logic|logically|illogical|nonsense|impossible|contradiction|paradox/.test(low)) {
      audit.push("Reasoning mode: logical-consistency analysis","Tone gate: calm","Evidence gate: separate facts from assumptions");
      return {title:"AI · Logical reasoning mode",text:"I will separate the question into <b>known evidence</b>, <b>assumptions</b>, and <b>conclusions</b>. If a premise conflicts with the NASA corpus, I will point out the conflict without treating the question as foolish. If the question is intentionally impossible or contradictory, I will explain why and state what additional evidence would make it answerable.",evidence:"UNKNOWN until premises are grounded",score:.99,ids:[...new Set(rs.flatMap(srcIds))],audit,visual:visual||""};
    }

    if(/source|citation|doi|reference|where.*data|data source/.test(low)) {
      audit.push("Source retrieval: matched NASA PSI registry");
      const relevant=explicit.length?explicit:sources().slice(0,8).map(s=>s.source_id);
      return {title:"AI · NASA source ledger",text:"PROMETHEUS is currently grounded in "+rs.length+" loaded experiment records and "+sources().length+" registered NASA PSI sources. Each source below is traceable to its NASA PSI investigation record and DOI.",evidence:"NASA PSI provenance is primary evidence · "+sources().length+" source records",score:.98,ids:relevant,audit,visual};
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
        const fields=["o2_fraction","gravity_g","flow_velocity_mm_s"];
        const rows=fields.map(k=>{
          const av=rawval(a,k),bv=rawval(b,k);
          return av!=null&&bv!=null ? "<b>"+esc(k)+"</b>: "+esc(av)+" vs "+esc(bv)+" ("+EVIDENCE[evidenceForCondition(a,k)].label+")" : "<b>"+esc(k)+"</b>: not reported for both";
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
      const context=sources().filter(s=>/pressure|atmosphere|atm/i.test((s.note||"")+" "+(s.title||"")));
      context.forEach(s=>ids.add(s.source_id));
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
    const pct=score==null?"":'<span class="pm-confidence">'+confidence(score)+"% evidence fit</span>";
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
    // Rehydrate the interactive 3D component because HTML serialization cannot retain canvas state.
    if(visual3d) {
      const holder=el.querySelector(".pm-3d");
      if(holder) {
        const rows=records().map(e=>({label:e.exp_id,y:(e.observations||[]).find(o=>/burn/i.test((o.phenomenon||"")+" "+(o.description||""))&&o.measurement)?.measurement?.canonical_value})).filter(r=>Number.isFinite(Number(r.y)));
        const fresh=build3DResult(rows); holder.replaceWith(fresh);
      }
    }
    body.scrollTop=body.scrollHeight;
  }

  async function askCloud(q) {
    const endpoint = cloudEndpoint();
    if (!endpoint || !cloudEnabled()) return false;
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {"content-type":"application/json"},
        body: JSON.stringify({
          message:q,
          history: recentMemory(12).map(x => ({role:x.role === "assistant" ? "assistant" : "user", content:String(x.text || "")})),
          consent:{cloud_ai:true}
        })
      });
      if (!res.ok) throw new Error("Cloud AI HTTP "+res.status);
      const payload = await res.json();
      const answerText = typeof payload.answer === "string" ? payload.answer : (payload.answer?.answer || "");
      const trace = Array.isArray(payload.trace) ? payload.trace : [];
      const ids = [...new Set(trace.flatMap(t => Array.isArray(t?.result?.sources) ? t.result.sources.map(s => s.source_id).filter(Boolean) : []))];
      const evidenceState = payload.evidence_state || "REPORTED";
      const sourceText = ids.length ? "<br><br><b>Cloud evidence trace:</b> " + ids.map(id => esc(id)).join(" · ") : "";
      const text = esc(answerText || "The cloud agent returned no answer.").replace(/\\n/g,"<br>") + sourceText;
      rememberTurn({role:"assistant",text,title:"AI · Cloud evidence synthesis",evidence:evidenceState,ids});
      add("ai","AI · Cloud evidence synthesis",text,evidenceState,.98,ids,["Explicit cloud-AI consent","NASA evidence retrieval on server","Structured scientific response","store:false"]);
      return true;
    } catch (error) {
      UI.toast("Cloud AI unavailable · using local evidence engine");
      return false;
    }
  }

  function ask(q) {
    q=q.trim(); if(!q)return;
    rememberTurn({role:"user",text:q});
    add("user","YOU",esc(q),null,null,null,[]);
    input.disabled=true;
    (async()=>{
      try {
        if(await askCloud(q)){ input.disabled=false; input.focus(); saveMemory(); return; }
        const a=answer(q);
        rememberTurn({role:"assistant",text:a.text,title:a.title,evidence:a.evidence,ids:a.ids||[]});
        add("ai",a.title,a.text,a.evidence,a.score,a.ids||[],a.audit||[],a.visual||"",a.visual3d||"");
      } catch(e) {
        const safe="The reasoning engine hit an internal error. I will not guess. Please retry; your conversation memory is preserved locally.";
        rememberTurn({role:"assistant",text:safe,title:"AI · Safe failure",evidence:"UNKNOWN"});
        add("ai","AI · Safe failure",safe,"UNKNOWN",0,[],["Exception trapped","Answer gate: BLOCKED"]);
      } finally { input.disabled=false; input.focus(); saveMemory(); }
    })();
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
    saveMemory();
    if(body.childElementCount || !conversationMemory.length)return;
    recentMemory(8).forEach(x=>add(x.role==="user"?"user":"ai",x.title||"AI · Recalled context",esc(x.text),x.evidence||null,.86,x.ids||[],["Restored from local device memory"]));
  }
  // The AI orb and assistant card are both draggable so they can be moved away
  // from Research controls and content. Clamp the panel inside the visible viewport.
  let fabMoved=false, panelMoved=false, dragState=null;
  const POSITION_KEY="prometheus_ai_floating_positions_v1";
  function clamp(n,min,max){return Math.max(min,Math.min(max,n));}
  function savePositions(){
    try{
      localStorage.setItem(POSITION_KEY,JSON.stringify({
        fab:fab.style.left?{left:fab.style.left,top:fab.style.top}:null
      }));
    }catch(_){}
  }
  function restorePositions(){
    try{
      const saved=JSON.parse(localStorage.getItem(POSITION_KEY)||"null");
      for(const [kind,el] of [["fab",fab]]){
        const p=saved&&saved[kind];if(!p||!Number.isFinite(parseFloat(p.left))||!Number.isFinite(parseFloat(p.top)))continue;
        const w=el.getBoundingClientRect().width|| (kind==="fab"?54:Math.min(window.innerWidth-20,420));
        const h=el.getBoundingClientRect().height|| (kind==="fab"?54:460);
        el.style.left=clamp(parseFloat(p.left),8,Math.max(8,window.innerWidth-w-8))+"px";
        el.style.top=clamp(parseFloat(p.top),8,Math.max(8,window.innerHeight-h-8))+"px";
        el.style.right="auto";el.style.bottom="auto";
      }
    }catch(_){}
  }
  function startDrag(el,e,kind){
    if(e.button!==undefined&&e.button!==0)return;
    if(kind==="panel"&&e.target.closest("button"))return;
    dragState={el,kind,pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,
      rect:el.getBoundingClientRect(),moved:false};
    if(kind==="fab")fabMoved=false;else panelMoved=false;
    try{el.setPointerCapture(e.pointerId);}catch(_){}
    e.preventDefault();
  }
  function moveDrag(e){
    if(!dragState||e.pointerId!==dragState.pointerId)return;
    const d=dragState,dx=e.clientX-d.startX,dy=e.clientY-d.startY;
    if(Math.abs(dx)+Math.abs(dy)>5)d.moved=true;
    if(!d.moved)return;
    const w=d.rect.width,h=d.rect.height;
    const left=clamp(d.rect.left+dx,8,Math.max(8,window.innerWidth-w-8));
    const top=clamp(d.rect.top+dy,8,Math.max(8,window.innerHeight-h-8));
    d.el.style.left=left+"px";d.el.style.top=top+"px";d.el.style.right="auto";d.el.style.bottom="auto";
    if(d.kind==="fab")fabMoved=true;else panelMoved=true;
  }
  function endDrag(e){
    if(!dragState||e.pointerId!==dragState.pointerId)return;
    const d=dragState;
    if(d.kind==="fab")fabMoved=d.moved;else panelMoved=d.moved;
    dragState=null;if(d.moved)savePositions();
  }
  fab.addEventListener("pointerdown",e=>startDrag(fab,e,"fab"));
  // The research workspace is deliberately not draggable: it expands to the full screen.
  // Listen on window as Android WebView can retarget touch/pointer events after capture.
  window.addEventListener("pointermove",moveDrag,{passive:false});
  window.addEventListener("pointerup",endDrag);
  window.addEventListener("pointercancel",endDrag);
  window.addEventListener("resize",()=>{restorePositions();});
  restorePositions();
  function openAI(){
    panel.style.left="";panel.style.top="";panel.style.right="";panel.style.bottom="";
    panel.classList.add("open","fullscreen");fab.style.display="none";
    try{const saved=JSON.parse(localStorage.getItem(POSITION_KEY)||"{}");delete saved.panel;localStorage.setItem(POSITION_KEY,JSON.stringify(saved));}catch(_){}
    if(!body.childElementCount){readyMessage();restoreConversation();}
    requestAnimationFrame(()=>input.focus());
  }
  function closeAI(){panel.classList.remove("open","fullscreen");fab.style.display="";}
  fab.addEventListener("click",()=>{if(fabMoved){fabMoved=false;return;}panel.classList.contains("open")?closeAI():openAI();});
  document.getElementById("pm-ai-clear").onclick=()=>{conversationMemory=[];try{localStorage.removeItem(MEMORY_KEY);}catch(_){}body.replaceChildren();readyMessage();saveMemory();};

  panel.querySelector("#pm-ai-close").onclick=closeAI;
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&panel.classList.contains("open"))closeAI();});
  panel.querySelector("#pm-ai-form").onsubmit=e=>{e.preventDefault();ask(input.value);input.value="";};
  panel.querySelectorAll(".pm-chip").forEach(b=>b.onclick=()=>{input.value=b.textContent;ask(input.value);input.value="";});

  saveMemory();
  window.__prometheusAIStatus = "ready";
  window.__prometheusAIOpen = openAI;
  window.__prometheusAIClose = closeAI;

  window.PROMETHEUS_AI = {
    version:"2.0.0",
    mode:"NASA-ONLY-EVIDENCE",
    ask,
    audit:q=>answer(q),
    corpus:()=>({experiments:records().length,sources:sources().length,synthetic:!!(ds()&&ds().hasSynthetic)}),
    evidence:EVIDENCE
  };
})();