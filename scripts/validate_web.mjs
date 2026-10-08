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

const scripts=[...html.matchAll(/<script(?:\\s[^>]*)?>([\\s\\S]*?)<\\/script>/gi)].map(m=>m[1]);
scripts.forEach((source,index)=>{
  if(/<script type="application\\/json"/i.test(html)) return;
  new vm.Script(source,{filename:`www/index.html#script-${index+1}`});
});
console.log("PROMETHEUS web/data validation passed:", fixture.experiments.length, "experiments;", fixture.sources.length, "sources;");
