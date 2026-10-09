import fs from "node:fs";
import path from "node:path";

const corpus = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "../data/prometheus_nasa_psi.json"), "utf8"));
const experiments = corpus.experiments || [];
const sources = corpus.sources || [];
const sourceMap = new Map(sources.map((s) => [s.source_id, s]));

const sourceView = (s) => s ? ({
  source_id: s.source_id,
  title: s.title,
  citation: s.citation,
  doi: s.doi || null,
  url: s.url || null,
  license: s.license || null
}) : null;

export function finiteNumericValue(raw) {
  if (raw === null || raw === undefined || (typeof raw === "string" && raw.trim() === "")) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

export function hasReportedMeasurement(e) {
  return (e?.observations || []).some((o) => {
    const measurement = o?.measurement;
    if (!measurement) return false;
    return finiteNumericValue(measurement.canonical_value ?? measurement.value) !== null;
  });
}

function classifyExperiment(e) {
  const hasMeasurement = hasReportedMeasurement(e);
  const linkedSources = (e.source_ids || []).map((sourceId) => sourceMap.get(sourceId)).filter(Boolean);
  const metadataOnly = linkedSources.length > 0 && linkedSources.every((s) => s.metadata_only === true);
  const recordClass = hasMeasurement
    ? "reported_measurements"
    : metadataOnly ? "metadata_only" : "documented_configuration";
  return {
    evidence_state: hasMeasurement ? "NASA_REPORTED" : "UNKNOWN",
    record_class: recordClass,
    evidence_state_note: hasMeasurement
      ? "The indexed record contains source-attributed reported measurements; this response does not assert raw instrument-level observation."
      : "This record contains descriptive metadata or documented conditions but no indexed numeric outcome measurement. Do not treat it as a measured result."
  };
}

export function searchNasaEvidence(query, limit = 8) {
  const terms = String(query || "").toLowerCase().split(/\s+/).filter(Boolean);
  const matches = experiments
    .map((e) => ({ e, score: terms.reduce((n, t) => n + (JSON.stringify(e).toLowerCase().includes(t) ? 1 : 0), 0) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.min(20, Math.max(1, limit)));

  return {
    dataset_id: corpus.dataset_id,
    source_policy: "NASA indexed evidence only",
    matches: matches.map(({ e, score }) => ({
      score, exp_id: e.exp_id, title: e.title, fuel: e.fuel, platform: e.platform,
      ...classifyExperiment(e),
      conditions: e.conditions, observations: e.observations, text: e.text,
      sources: (e.source_ids || []).map((id) => sourceView(sourceMap.get(id)))
    }))
  };
}

export function getExperiment(id) {
  const e = experiments.find((x) => x.exp_id === id);
  if (!e) return { error: "Experiment not found in indexed NASA corpus.", exp_id: id };
  const linkedSources = (e.source_ids || []).map((sourceId) => sourceMap.get(sourceId)).filter(Boolean);
  return {
    exp_id: e.exp_id, title: e.title, platform: e.platform, fuel: e.fuel,
    conditions: e.conditions, observations: e.observations, text: e.text,
    ...classifyExperiment(e),
    sources: linkedSources.map(sourceView)
  };
}

export function compareExperiments(aid, bid) {
  const a = experiments.find((x) => x.exp_id === aid);
  const b = experiments.find((x) => x.exp_id === bid);
  if (!a || !b) return { error: "Both experiment IDs must exist in indexed NASA corpus." };
  return {
    experiment_a: getExperiment(aid),
    experiment_b: getExperiment(b),
    causal_warning: "Pairwise differences do not establish causality."
  };
}

export function getSource(id) {
  const s = sourceMap.get(id);
  return s ? {
    ...sourceView(s),
    evidence_state: "UNKNOWN",
    record_class: "source_metadata",
    metadata_only: s.metadata_only === true,
    evidence_state_note: "This is source/catalogue metadata, not an experiment measurement. Follow the linked record and its locator before assigning a claim-level evidence state."
  } : { error: "Source not found in indexed NASA catalogue.", source_id: id };
}


const VARIABLE_LABELS = {
  o2_fraction: {label:"Reported oxygen fraction", unit:"fraction"},
  gravity_g: {label:"Gravity regime proxy", unit:"g (proxy; not measured)"},
  flow_velocity_mm_s: {label:"Flow velocity", unit:"mm/s"},
  pressure_kpa: {label:"Pressure", unit:"kPa"},
  burn_duration: {label:"Burn duration", unit:"s"}
};

function valueFor(e, variable) {
  if (variable === "burn_duration") {
    const o = (e.observations || []).find(x =>
      /burn|duration/i.test((x.phenomenon || "") + " " + (x.description || "")) &&
      x.measurement && finiteNumericValue(x.measurement.canonical_value) !== null);
    return o ? {
      value:finiteNumericValue(o.measurement.canonical_value), raw:o.measurement.value,
      unit:o.measurement.canonical_unit || o.measurement.unit, source_id:o.source_id,
      locator:o.locator, note:""
    } : null;
  }
  const c = e.conditions && e.conditions[variable];
  if (!c || finiteNumericValue(c.canonical_value) === null) return null;
  return {
    value:finiteNumericValue(c.canonical_value), raw:c.value, unit:c.canonical_unit || c.unit,
    source_id:c.source_id, locator:c.locator, note:c.canonical_note || ""
  };
}

export function analyzeDataset(operation = "coverage", variable = "burn_duration", experimentIds = []) {
  const op = String(operation || "coverage").toLowerCase();
  const key = String(variable || "burn_duration");
  const meta = VARIABLE_LABELS[key];
  if (op === "coverage") {
    const variables = Object.keys(VARIABLE_LABELS);
    const rows = variables.map(k => {
      const n = experiments.filter(e => valueFor(e, k)).length;
      return {label:k, y:n, total:experiments.length, missing:experiments.length-n};
    });
    return {
      operation:"coverage", dataset_id:corpus.dataset_id,
      title:"Measurement coverage", evidence_state:"DERIVED",
      summary:"Coverage counts describe the currently indexed seed corpus only; they do not imply full NASA PSI archive coverage.",
      rows, sources:[...new Set(experiments.flatMap(e=>e.source_ids||[]))].map(id=>sourceView(sourceMap.get(id))).filter(Boolean),
      visualization:{type:"bar",title:"Measurement coverage across indexed records",xLabel:"Variable",yLabel:"Records with usable values",rows}
    };
  }
  if (!meta) return {error:"Unsupported variable.", supported_variables:Object.keys(VARIABLE_LABELS)};
  let selected = experiments;
  if (Array.isArray(experimentIds) && experimentIds.length) {
    const wanted = new Set(experimentIds.map(String));
    selected = experiments.filter(e => wanted.has(e.exp_id));
  }
  const rows = selected.map(e => {
    const v = valueFor(e, key);
    return v ? {label:e.exp_id,y:v.value,raw:v.raw,unit:v.unit,source_id:v.source_id,locator:v.locator,note:v.note} : null;
  }).filter(Boolean);
  if (op === "distribution" || op === "compare") {
    const sorted = rows.map(r=>r.y).sort((a,b)=>a-b);
    const mean = sorted.length ? sorted.reduce((a,b)=>a+b,0)/sorted.length : null;
    const median = sorted.length ? (sorted.length%2 ? sorted[(sorted.length-1)/2] : (sorted[sorted.length/2-1]+sorted[sorted.length/2])/2) : null;
    const flags = rows.filter(r=>/proxy|midpoint/i.test(r.note)).map(r=>({experiment:r.label,note:r.note}));
    return {
      operation:op, dataset_id:corpus.dataset_id, variable:key, variable_label:meta.label,
      unit:meta.unit, n:rows.length, summary:rows.length ? {
        min:sorted[0], max:sorted[sorted.length-1], mean, median
      } : null,
      rows, evidence_state:flags.length ? "DERIVED_WITH_PROXY_WARNINGS" : "DERIVED",
      warnings:[
        "Statistics describe only the selected records in the indexed seed corpus.",
        ...(flags.length ? ["Some canonical values are explicitly documented as midpoints or visualization proxies; see proxy_warnings."] : [])
      ],
      proxy_warnings:flags,
      sources:[...new Set(rows.map(r=>r.source_id).filter(Boolean))].map(id=>sourceView(sourceMap.get(id))).filter(Boolean),
      visualization:rows.length ? {type:"bar",title:meta.label+" by experiment",xLabel:"Experiment ID",yLabel:meta.label+" ("+meta.unit+")",rows:rows.map(r=>({label:r.label,y:r.y}))} : null
    };
  }
  return {error:"Unsupported analysis operation.", supported_operations:["coverage","distribution","compare"]};
}
