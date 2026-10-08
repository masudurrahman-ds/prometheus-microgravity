import fs from "node:fs";
import path from "node:path";

const corpus = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "data/prometheus_nasa_psi.json"), "utf8"));
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
      conditions: e.conditions, observations: e.observations, text: e.text,
      sources: (e.source_ids || []).map((id) => sourceView(sourceMap.get(id)))
    }))
  };
}

export function getExperiment(id) {
  const e = experiments.find((x) => x.exp_id === id);
  if (!e) return { error: "Experiment not found in indexed NASA corpus.", exp_id: id };
  return {
    exp_id: e.exp_id, title: e.title, platform: e.platform, fuel: e.fuel,
    conditions: e.conditions, observations: e.observations, text: e.text,
    evidence_state: "NASA_OBSERVED",
    sources: (e.source_ids || []).map((id) => sourceView(sourceMap.get(id)))
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
  return s ? { ...sourceView(s), evidence_state: s.metadata_only ? "NASA_REPORTED" : "NASA_OBSERVED" }
           : { error: "Source not found in indexed NASA catalogue.", source_id: id };
}
