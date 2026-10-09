import fs from "node:fs";

let cache = null;

function corpus() {
  if (!cache) cache = JSON.parse(fs.readFileSync(process.env.PROMETHEUS_CORPUS || new URL("../../data/prometheus_nasa_psi.json", import.meta.url), "utf8"));
  return cache;
}

const STOP_WORDS = new Set(["a","an","and","are","as","at","be","by","does","for","from","how","in","into","is","it","of","on","or","that","the","this","to","was","what","when","where","which","why","with"]);

function tokenize(query) {
  return [...new Set((String(query || "").toLowerCase().replace(/[_-]+/g, " ").match(/[a-z0-9₂₃]+/g) || [])
    .filter(term => term.length > 1 && !STOP_WORDS.has(term)))];
}

function scoreFields(fields, queryTokens, queryPhrase, experimentId) {
  if (!queryTokens.length) return 0;
  let score = 0;
  for (const term of queryTokens) {
    const best = fields.reduce((max, field) => {
      const tokens = new Set(tokenize(field.text));
      return tokens.has(term) ? Math.max(max, field.weight) : max;
    }, 0);
    score += best;
  }
  const normalizedPhrase = String(queryPhrase || "").toLowerCase().replace(/[_-]+/g, " ").replace(/[^a-z0-9₂₃]+/g, " ").trim();
  const title = fields.find(f => f.name === "title")?.text || "";
  const body = fields.find(f => f.name === "body")?.text || "";
  const normalize = value => String(value || "").toLowerCase().replace(/[_-]+/g, " ").replace(/[^a-z0-9₂₃]+/g, " ").trim();
  if (normalizedPhrase.length >= 5 && (normalize(title).includes(normalizedPhrase) || normalize(body).includes(normalizedPhrase))) score += 5;
  const idNorm = normalize(experimentId);
  if (idNorm && normalize(queryPhrase).includes(idNorm)) score += 20;
  return score;
}


function searchFields(e, c) {
  const observations = (e.observations || []).flatMap(o => [
    o.phenomenon, o.description, o.locator, o.measurement?.value, o.measurement?.unit
  ]);
  const conditions = Object.entries(e.conditions || {}).flatMap(([key, value]) => [key, value.value, value.unit, value.locator]);
  const sourceTitles = (e.source_ids || []).map(id => c.sources?.find(s => s.source_id === id)?.title || id);
  return [
    {name:"id", text:e.exp_id || "", weight:8},
    {name:"title", text:e.title || "", weight:5},
    {name:"phenomena", text:(e.observations || []).flatMap(o => [o.phenomenon,o.description]).filter(Boolean).join(" "), weight:4},
    {name:"fuel-platform", text:[e.fuel,e.platform].filter(Boolean).join(" "), weight:3},
    {name:"body", text:[e.text,...observations,...sourceTitles].filter(Boolean).join(" "), weight:2},
    {name:"metadata", text:[...(e.source_ids || []),...conditions].filter(Boolean).join(" "), weight:1}
  ];
}

function sourceRecord(c, id) {
  const s = (c.sources || []).find(x => x.source_id === id);
  if (!s) return null;
  return {
    source_id: s.source_id,
    title: s.title || s.name || s.source_id,
    url: s.url || null,
    doi: s.doi || null,
    publisher: s.publisher || "NASA",
    metadata_only: !!s.metadata_only
  };
}

export function finiteNumericValue(raw) {
  if (raw === null || raw === undefined || (typeof raw === "string" && raw.trim() === "")) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

export function hasReportedMeasurement(e) {
  return (e?.observations || []).some(o => {
    const measurement = o?.measurement;
    if (!measurement) return false;
    return finiteNumericValue(measurement.canonical_value ?? measurement.value) !== null;
  });
}

export function searchNASAEvidence(query, limit = 8) {
  const c = corpus();
  const terms = tokenize(query);
  const ranked = (c.experiments || []).map(e => ({
    e, score:scoreFields(searchFields(e,c),terms,query,e.exp_id)
  })).filter(x => x.score > 0)
    .sort((a,b) => b.score-a.score || String(a.e.exp_id).localeCompare(String(b.e.exp_id)))
    .slice(0, Math.min(20, Math.max(1, Number(limit) || 8)));

  const evidence = ranked.map(({e, score}) => {
    const observations = e.observations || [];
    const hasMeasurement = hasReportedMeasurement(e);
    const linkedSources = [...new Set(e.source_ids || [])]
      .map(id => sourceRecord(c, id)).filter(Boolean);
    const metadataOnly = linkedSources.length > 0 && linkedSources.every(s => s.metadata_only);
    const recordClass = e.synthetic ? "synthetic"
      : hasMeasurement ? "reported_measurements"
      : metadataOnly ? "metadata_only" : "documented_configuration";
    return {
      exp_id: e.exp_id,
      title: e.title,
      evidence_state: hasMeasurement && !e.synthetic ? "NASA_REPORTED" : "UNKNOWN",
      record_class: recordClass,
      evidence_state_note: hasMeasurement && !e.synthetic
        ? "The indexed record contains source-attributed reported measurements; raw instrument-level observation is not asserted."
        : "No indexed numeric outcome measurement is available for this record. Treat any listed conditions as documented metadata, not a measured outcome.",
      relevance: score,
      platform: e.platform,
      fuel: e.fuel || null,
      conditions: e.conditions || {},
      observations,
      source_ids: e.source_ids || [],
      text: e.text || "",
      sources: linkedSources
    };
  });

  return {
    corpus_id: c.dataset_id || "prometheus-nasa-psi",
    update_version: c.update_version || null,
    count: evidence.length,
    evidence
  };
}

export function corpusSummary() {
  const c = corpus();
  return {
    dataset_id: c.dataset_id,
    update_version: c.update_version,
    experiments: (c.experiments || []).length,
    sources: (c.sources || []).length,
    challenge_sources: c.challenge_sources || []
  };
}
