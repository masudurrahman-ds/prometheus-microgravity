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
if(!ai.includes("height:min(48dvh,460px)")) throw new Error("compact mobile AI panel height missing");
if(!ai.includes('window.addEventListener("pointermove",moveDrag')) throw new Error("global touch/pointer drag handling missing");
if(!ai.includes('const POSITION_KEY="prometheus_ai_floating_positions_v1"')) throw new Error("AI floating position persistence missing");
if(!ai.includes("DRAG TO MOVE")) throw new Error("visible AI panel drag affordance missing");
if(!ai.includes('fab.addEventListener("pointerdown"')) throw new Error("movable AI launcher pointer handling missing");
if(!ai.includes('panel.querySelector("#pm-ai-head").addEventListener("pointerdown"')) throw new Error("movable AI panel header handling missing");
if(!ai.includes("height:min(48dvh,460px)")) throw new Error("compact mobile AI panel sizing missing");
if(html.includes("top:calc(env(safe-area-inset-top,0px) + 8px)!important;bottom:calc(132px")) throw new Error("old full-height mobile AI override still present");

const scripts=[...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)].map((m,index)=>({attrs:m[1],source:m[2],index}));
scripts.forEach(({attrs,source,index})=>{
  if(/type=["']application\/json["']/i.test(attrs)) return;
  new vm.Script(source,{filename:`www/index.html#script-${index+1}`});
});
console.log("PROMETHEUS web/data validation passed:", fixture.experiments.length, "experiments;", fixture.sources.length, "sources;");
