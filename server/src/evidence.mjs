import fs from "node:fs";

let cache = null;

function corpus() {
  if (!cache) cache = JSON.parse(fs.readFileSync(process.env.PROMETHEUS_CORPUS || new URL("../../data/prometheus_nasa_psi.json", import.meta.url), "utf8"));
  return cache;
}

function tokenize(q) {
  return [...new Set(String(q || "").toLowerCase().match(/[a-z0-9₂₃-]{2,}/g) || [])];
}

function searchable(e) {
  const obs = (e.observations || []).flatMap(o => [
    o.phenomenon, o.description, o.locator,
    o.measurement?.value, o.measurement?.unit
  ]);
  const conditions = Object.entries(e.conditions || {}).flatMap(([k, v]) => [k, v.value, v.unit, v.locator]);
  return [e.exp_id, e.title, e.platform, e.fuel, e.text, ...(e.source_ids || []), ...obs, ...conditions]
    .filter(Boolean).join(" ").toLowerCase();
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

export function searchNASAEvidence(query, limit = 8) {
  const c = corpus();
  const terms = tokenize(query);
  const ranked = (c.experiments || []).map(e => {
    const text = searchable(e);
    const score = terms.reduce((n, t) => n + (text.includes(t) ? 1 : 0), 0);
    return { e, score };
  }).filter(x => x.score > 0).sort((a, b) => b.score - a.score).slice(0, limit);

  const evidence = ranked.map(({e, score}) => {
    const observations = e.observations || [];
    const hasReportedMeasurement = observations.some(o =>
      o.measurement && Number.isFinite(Number(o.measurement.canonical_value ?? o.measurement.value))
    );
    const linkedSources = [...new Set(e.source_ids || [])]
      .map(id => sourceRecord(c, id)).filter(Boolean);
    const metadataOnly = linkedSources.length > 0 && linkedSources.every(s => s.metadata_only);
    const recordClass = e.synthetic ? "synthetic"
      : hasReportedMeasurement ? "reported_measurements"
      : metadataOnly ? "metadata_only" : "documented_configuration";
    return {
      exp_id: e.exp_id,
      title: e.title,
      evidence_state: hasReportedMeasurement && !e.synthetic ? "NASA_REPORTED" : "UNKNOWN",
      record_class: recordClass,
      evidence_state_note: hasReportedMeasurement && !e.synthetic
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
