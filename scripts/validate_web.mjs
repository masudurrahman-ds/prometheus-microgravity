import fs from "node:fs";
import vm from "node:vm";

const html=fs.readFileSync("www/index.html","utf8");
const match=html.match(/<script type="application\/json" id="fixture">([\s\S]*?)<\/script>/);
if(!match) throw new Error("fixture script missing");
const fixture=JSON.parse(match[1]);
if(!fixture.dataset_id || !Array.isArray(fixture.experiments) || !Array.isArray(fixture.sources)) throw new Error("invalid PROMETHEUS fixture schema");
// Validate the restored cosmic interface rather than the later Research Observatory shell.
if(!html.includes('id="stars"') || !html.includes('id="root"')) throw new Error("Cosmic interface shell missing");
if(!html.includes("interactive 3D universe") || !html.includes("Cormorant Garamond")) throw new Error("Cosmic visual identity missing");
if(!html.includes("function resetLabFormToBaseline(ds = S.ds)")) throw new Error("virtual-lab recorded-baseline reset helper missing");
if(!html.includes("window.__prometheusAIOpen")) throw new Error("PROMETHEUS AI entry point is not connected");
if(!html.includes("function viewDashboard(root)")) throw new Error("interactive research dashboard missing");
if(!html.includes("not a physical combustion simulation")) throw new Error("laboratory scientific limitation missing");
if(!fixture.challenge_sources || fixture.challenge_sources.length < 20) throw new Error("challenge source catalog unexpectedly small");
const ids=new Set(fixture.sources.map(s=>s.source_id));
for(const e of fixture.experiments) for(const id of (e.source_ids||[])) if(!ids.has(id)) throw new Error("experiment references unknown source "+id);
const psi98=fixture.experiments.find(e=>e.exp_id==="PSI98-S1");
if(!psi98 || !(psi98.observations||[]).some(o=>o.phenomenon==="burn_duration" && o.measurement?.canonical_value===420)) throw new Error("SAFFIRE S1 burn duration missing");
const data=JSON.parse(fs.readFileSync("data/prometheus_nasa_psi.json","utf8"));
if(data.update_version!=="2026.10.07.3") throw new Error("dataset update version mismatch");

const mlPipeline=fs.readFileSync("ml/train.py","utf8");
if(!mlPipeline.includes("MIN_RECORDS = 60") || !mlPipeline.includes("MIN_SOURCE_GROUPS = 5")) throw new Error("PyTorch pipeline must gate training on corpus size and independent source groups");
if(!mlPipeline.includes("blocked_insufficient_data") || !mlPipeline.includes("source_group")) throw new Error("PyTorch pipeline must report insufficient data and use source-group holdout");
if(!mlPipeline.includes("exploratory_feature_reconstruction_only")) throw new Error("PyTorch model purpose must remain reconstruction-only");
const mlReadme=fs.readFileSync("ml/README.md","utf8");
if(!mlReadme.includes("not a hazard score") || !mlReadme.includes("17-record seed corpus")) throw new Error("PyTorch research limitations must be documented");
const webAi=fs.readFileSync("www/prometheus_ai.js","utf8");
new vm.Script(webAi,{filename:"www/prometheus_ai.js"});
const ai=fs.readFileSync("android/app/src/main/assets/prometheus_ai.js","utf8");
new vm.Script(ai,{filename:"android/app/src/main/assets/prometheus_ai.js"});
if(!html.includes("window, '__prometheusDataset'")) throw new Error("stable local-AI dataset provider missing");
if(!html.includes("function resetLabFormToBaseline(ds = S.ds)")) throw new Error("virtual-lab recorded-baseline reset helper missing");
if(!html.includes("form: {fuel: '', on: {o2: false, p: false, g: false, t: false, f: false}")) throw new Error("virtual-lab initial constraints should not be stale defaults");
if(!html.includes("Scenario reset to a recorded experiment baseline")) throw new Error("virtual-lab baseline reset action missing");
if(!html.includes("RETRIEVED EVIDENCE · '+numericFinding.level")) throw new Error("virtual-lab evidence chart missing");
if(!html.includes("not a physical combustion simulation")) throw new Error("virtual-lab scientific disclosure missing");
if(!ai.includes("window.__prometheusDataset")) throw new Error("local AI does not consume stable dataset provider");
if(!ai.includes("LOCAL ENGINE · NO CLOUD REQUIRED")) throw new Error("offline local engine status missing");
if(!ai.includes("function scientificVisual(q, rs)")) throw new Error("local scientific visualization engine missing");
if(!ai.includes("function pieChartSVG(rows, title)")) throw new Error("pie chart renderer missing");
if(!ai.includes("function heatmapSVG(records)")) throw new Error("heatmap renderer missing");
if(!ai.includes("if(asksForPie)")) throw new Error("pie chart intent routing missing");
if(!ai.includes("if(asksForHeatmap)")) throw new Error("heatmap intent routing missing");

if(!ai.includes("pending3DResult=rows")) throw new Error("3D evidence visualization ignores the requested scientific variable");
if(!ai.includes("function finiteNumericValue(raw)")) throw new Error("strict chart numeric parser missing");
if(ai.includes("chart.rows.filter(r=>r&&Number.isFinite(Number(r.y)))")) throw new Error("cloud chart renderer must reject null/blank values before numeric coercion");
if(ai.includes("filter(r=>Number.isFinite(Number(r.y)))")) throw new Error("3D evidence fallback must reject null/blank values before numeric coercion");
if(ai.includes("<polyline")) throw new Error("scientific chart must not connect independent experiments with a line");
if(!ai.includes("Categorical experiment values; not a time series")) throw new Error("chart must disclose categorical comparison semantics");
if(!ai.includes('Variable coverage: "+requestedLabel')) throw new Error("specific-variable missingness requests must not fall through to global coverage");
if(!ai.includes("What the indexed records establish:")) throw new Error("substantive evidence questions with citation requests must produce an interpretation");
if(!ai.includes('DERIVED PLOTTING VALUE: '+String.fromCharCode(34)+'+notes.join')) throw new Error("chart must disclose derived canonical plotting values");
if(!ai.includes('note:c.canonical_note||""')) throw new Error("chart rows must retain canonical-value caveats");
const agentServer=fs.readFileSync("agent/server.mjs","utf8");
const agentEvidence=fs.readFileSync("agent/evidence.mjs","utf8");
if(!agentServer.includes('name:"analyze_dataset"') || !agentServer.includes("analyzeDataset(args.operation")) throw new Error("scientific analysis tool is not wired into the LLM agent");
if(!agentEvidence.includes("export function analyzeDataset")) throw new Error("deterministic chart-ready evidence analysis is missing");
if(!fs.existsSync("render.yaml")) throw new Error("cloud agent deployment blueprint missing");
if(!ai.includes("if (loaded && Array.isArray(loaded.experiments)) return loaded;")) throw new Error("local AI dataset bridge validation missing");
if(!ai.includes("#pm-ai-panel{position:relative!important;inset:auto!important")) throw new Error("AI assistant must be mounted inline, not as a floating overlay");
if(!ai.includes("width:min(calc(100% - 28px),1100px)!important")) throw new Error("inline AI panel responsive width missing");
if(!ai.includes("LOCAL ENGINE · NO CLOUD REQUIRED")) throw new Error("AI local-only status missing");
if(!ai.includes("min-width:48px;min-height:48px")) throw new Error("AI close control must have a reliable touch target");
if(!ai.includes("window.__prometheusBack = function()")) throw new Error("Android Back must close the AI chat before navigating or exiting");
if(!ai.includes("#pm-ai-fab{display:none!important}")) throw new Error("floating AI launcher must be removed");
if(!ai.includes("window.__prometheusAIOpen = openAI")) throw new Error("external dashboard action does not open the inline assistant");
if(ai.includes('window.addEventListener("pointermove",moveDrag')) throw new Error("obsolete floating AI drag handling remains");
if(ai.includes('fab.addEventListener("pointerdown"')) throw new Error("obsolete floating AI launcher remains");
if(ai.includes("DRAG TO MOVE")) throw new Error("full-screen chat must not show obsolete draggable-panel affordance");
if(ai.includes("DRAG TO MOVE")) throw new Error("obsolete floating chat drag label remains");
if(html.includes("top:calc(env(safe-area-inset-top,0px) + 8px)!important;bottom:calc(132px")) throw new Error("old full-height mobile AI override still present");

const scripts=[...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)].map((m,index)=>({attrs:m[1],source:m[2],index}));
scripts.forEach(({attrs,source,index})=>{
  if(/type=["']application\/json["']/i.test(attrs)) return;
  new vm.Script(source,{filename:`www/index.html#script-${index+1}`});
});
console.log("PROMETHEUS web/data validation passed:", fixture.experiments.length, "experiments;", fixture.sources.length, "sources;");

if(!html.includes("function viewDashboard(root)")) throw new Error("interactive AI fire-safety dashboard missing");
if(!html.includes("EVIDENCE COVERAGE RANKING")) throw new Error("dashboard evidence ranking missing");
if(!html.includes("not fire danger")) throw new Error("dashboard must disclose that coverage is not hazard severity");
if(!html.includes("Measured phenomenon")) throw new Error("dashboard phenomenon filter missing");
if(!html.includes("Inspect in Evidence Universe")) throw new Error("dashboard study drill-down missing");
if(!html.includes("Interpret this selection with PROMETHEUS AI")) throw new Error("dashboard-to-agent action missing");
if(!html.includes("ai.ask(question)")) throw new Error("dashboard does not dispatch its current selection to the AI agent");
if(!ai.includes("window.PROMETHEUS_AI = {") || !ai.includes("    ask,")) throw new Error("local evidence agent ask API is not exported");
const mainActivity=fs.readFileSync("android/app/src/main/java/org/crowncouncil/prometheus/MainActivity.java","utf8");
if((mainActivity.match(/postDelayed\(this::injectPrometheusAI/g)||[]).length!==1) throw new Error("AI script should be injected only once per Android startup");
if(mainActivity.includes("window.__prometheusAIStatus='injecting'")) throw new Error("Android injection must not reset the AI singleton guard");

if(!ai.includes("if(asksForVisual && metric)")) throw new Error("scientific charts must require an explicit visualization request");
if(!ai.includes("if(asksForVisual && asksForComparison)")) throw new Error("comparison fallback must not attach unsolicited charts");
if(!ai.includes('String(r.label).length>12?String(r.label).slice(0,11)+"…"')) throw new Error("categorical chart labels must be abbreviated for narrow screens while preserving full labels in title");

if(!ai.includes('const fields=["pressure_kpa","o2_fraction","gravity_g","flow_velocity_mm_s"]')) throw new Error("controlled comparison must explicitly check pressure alongside shared conditions");
if(!ai.includes('return c.source_id && c.value!=null && c.value!=="" ? "REPORTED" : "UNKNOWN"')) throw new Error("raw source-reported condition text must remain NASA REPORTED even when canonical plotting values are derived");
if(!ai.includes('compactValue.endsWith(compactUnit)')) throw new Error("comparison must avoid duplicating source-reported units");
if(!ai.includes('flow_velocity_mm_s:"Flow velocity"')) throw new Error("condition fields must use readable variable labels");
if(!ai.includes('" ("+ea.label+" / "+eb.label+")"')) throw new Error("comparison must classify each record's condition evidence separately");

if(!ai.includes('const normalizedQuestion=low.replace(/[^a-z0-9]/g,"")')) throw new Error("explicitly named experiment IDs must scope scientific charts");
if(!ai.includes('if(namedRecords.length) rs=namedRecords;')) throw new Error("chart records must be narrowed to named experiment IDs when present");

if(!ai.includes("const hasNamedExperimentScope=namedRecords.length>0;")) throw new Error("named experiment IDs must scope the complete scientific answer");
if(!ai.includes("const rs=hasNamedExperimentScope ? namedRecords : allRecords;")) throw new Error("answer retrieval must not mix unrelated experiments into a named-record question");
if(!ai.includes("if(hasNamedExperimentScope) rs.forEach(e=>srcIds(e).forEach(x=>ids.add(x)));")) throw new Error("named-record evidence gaps must cite the named experiment's source, not unrelated pressure context");

if(!ai.includes("function localIntentAnswer(question, rs)")) throw new Error("offline intent engine missing");
if(!ai.includes("OFFLINE-FIRST-NASA-RULE-ENGINE")) throw new Error("AI is not configured for offline-first operation");
if(!ai.includes("const a=answer(q);")) throw new Error("user questions must route to the local rule engine");
if(ai.includes("if(await askCloud(q))")) throw new Error("automatic cloud AI request must be disabled");
if(!ai.includes('id:"judge_pitch"')) throw new Error("judge-presentation intent missing");
if(!ai.includes('id:"methodology"')) throw new Error("methodology intent missing");
if(!ai.includes('id:"limitations"')) throw new Error("limitations intent missing");
if(!html.includes('UI.toast("PROMETHEUS local engine is loading. Please try again in a moment.")')) throw new Error("inline assistant fallback message missing");
if(html.includes("pm-ai-emergency")) throw new Error("floating emergency AI overlay must be removed");

if(!ai.includes("function expandQuestionAliases(question)")) throw new Error("scientific query alias expansion missing");
if(!ai.includes("hello gemini)([, ]+(are you (there|working)")) throw new Error("Gemini greeting test phrase must be handled offline");
if(!ai.includes("queryAliasGroups:()=>QUERY_ALIASES.length")) throw new Error("offline query alias coverage metric missing");

if(!ai.includes('id:"why_microgravity"')) throw new Error("microgravity motivation intent missing");
if(!ai.includes('id:"safety_boundary"')) throw new Error("safety prediction boundary intent missing");
if(!ai.includes('id:"applications"')) throw new Error("applications intent missing");
if(!ai.includes('id:"validation"')) throw new Error("validation intent missing");
