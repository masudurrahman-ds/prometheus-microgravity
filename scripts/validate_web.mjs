import fs from "node:fs";
import vm from "node:vm";

const html=fs.readFileSync("www/index.html","utf8");
const match=html.match(/<script type="application\/json" id="fixture">([\s\S]*?)<\/script>/);
if(!match) throw new Error("fixture script missing");
const fixture=JSON.parse(match[1]);
if(!fixture.dataset_id || !Array.isArray(fixture.experiments) || !Array.isArray(fixture.sources)) throw new Error("invalid PROMETHEUS fixture schema");
if(!fixture.challenge_sources || fixture.challenge_sources.length < 20) throw new Error("challenge source catalog unexpectedly small");
const ids=new Set(fixture.sources.map(s=>s.source_id));
for(const e of fixture.experiments) for(const id of (e.source_ids||[])) if(!ids.has(id)) throw new Error("experiment references unknown source "+id);
const psi98=fixture.experiments.find(e=>e.exp_id==="PSI98-S1");
if(!psi98 || !(psi98.observations||[]).some(o=>o.phenomenon==="burn_duration" && o.measurement?.canonical_value===420)) throw new Error("SAFFIRE S1 burn duration missing");
const data=JSON.parse(fs.readFileSync("data/prometheus_nasa_psi.json","utf8"));
if(data.update_version!=="2026.10.07.3") throw new Error("dataset update version mismatch");

const ai=fs.readFileSync("android/app/src/main/assets/prometheus_ai.js","utf8");
if(!html.includes("window, '__prometheusDataset'")) throw new Error("stable local-AI dataset provider missing");
if(!ai.includes("window.__prometheusDataset")) throw new Error("local AI does not consume stable dataset provider");
if(!ai.includes("if (loaded && Array.isArray(loaded.experiments)) return loaded;")) throw new Error("local AI dataset bridge validation missing");
if(!ai.includes("#pm-ai-panel.fullscreen") || !ai.includes("height:100dvh!important")) throw new Error("full-screen AI workspace styles missing");
if(!ai.includes('window.addEventListener("pointermove",moveDrag')) throw new Error("global touch/pointer drag handling missing");
if(!ai.includes('const POSITION_KEY="prometheus_ai_floating_positions_v1"')) throw new Error("AI launcher position persistence missing");
if(!ai.includes('document.querySelectorAll("#pm-ai-panel, #pm-ai-fab")')) throw new Error("AI overlay singleton cleanup missing");
if(ai.includes("DRAG TO MOVE")) throw new Error("obsolete draggable AI panel affordance remains");
if(!ai.includes('fab.addEventListener("pointerdown"')) throw new Error("movable AI launcher pointer handling missing");
if(!ai.includes('panel.classList.add("open","fullscreen")')) throw new Error("full-screen AI open lifecycle missing");
if(!ai.includes("#pm-ai-panel.fullscreen") || !ai.includes('document.addEventListener("keydown"')) throw new Error("full-screen AI or Escape-close behavior missing");
if(html.includes("top:calc(env(safe-area-inset-top,0px) + 8px)!important;bottom:calc(132px")) throw new Error("old full-height mobile AI override still present");

if(!html.includes("FIRE-SAFETY INTELLIGENCE DASHBOARD")) throw new Error("fire-safety intelligence dashboard missing");
if(!html.includes("Transparent representation score: indexed records")) throw new Error("explainable study ranking criteria missing");
if(!html.includes("Generate cited AI briefing")) throw new Error("interactive AI briefing action missing");
if(!html.includes("No cloud AI required for this dashboard")) throw new Error("local-first dashboard disclosure missing");
if(!html.includes("Strongest coverage") || !html.includes("Thin coverage")) throw new Error("evidence coverage interpretation missing");
if(!html.includes("studies.filter(x=>x.matches(dashboardFilter))")) throw new Error("dashboard study filters missing");
if(!html.includes("Ask local AI ↗")) throw new Error("per-study AI interpretation action missing");
if(!html.includes("ranked NASA studies")) throw new Error("ranked study navigator missing");
if(!html.includes("miniGal.curve = [queryPoint, ...evidencePoints]") || !html.includes("this.curve && this.curve.length > 1")) throw new Error("live scenario-to-evidence 3D trace missing");
if(!html.includes("not a physical prediction")) throw new Error("3D trace scientific limitation disclosure missing");

const scripts=[...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)].map((m,index)=>({attrs:m[1],source:m[2],index}));
scripts.forEach(({attrs,source,index})=>{
  if(/type=["']application\/json["']/i.test(attrs)) return;
  new vm.Script(source,{filename:`www/index.html#script-${index+1}`});
});
console.log("PROMETHEUS web/data validation passed:", fixture.experiments.length, "experiments;", fixture.sources.length, "sources;");
