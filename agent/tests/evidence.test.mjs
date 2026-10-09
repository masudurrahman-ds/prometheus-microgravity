import test from "node:test";
import assert from "node:assert/strict";
import { searchNasaEvidence, getExperiment, compareExperiments, getSource, analyzeDataset, hasReportedMeasurement } from "../evidence.mjs";

test("NASA corpus search returns provenance", () => {
  const r = searchNasaEvidence("SAFFIRE S1 burn duration");
  assert.equal(r.dataset_id, "prometheus-nasa-psi-seed-2026-10-06");
  assert.ok(r.matches.length > 0);
  assert.ok(r.matches[0].sources.some(s => s.source_id === "PSI-98"));
});

test("experiment retrieval labels source-attributed measurements without overstating raw observation", () => {
  const r = getExperiment("PSI98-S1");
  assert.equal(r.evidence_state, "NASA_REPORTED");
  assert.equal(r.record_class, "reported_measurements");
  assert.match(r.evidence_state_note, /does not assert raw instrument-level observation/i);
  assert.ok(r.sources.length > 0);
});

test("documented configurations without numeric outcome measurements are not labelled observed", () => {
  const r = getExperiment("PSI107-MET-low");
  assert.equal(r.evidence_state, "UNKNOWN");
  assert.equal(r.record_class, "documented_configuration");
  assert.match(r.evidence_state_note, /no indexed numeric outcome measurement/i);
});

test("search results carry the same evidence classification as exact lookup", () => {
  const r = searchNasaEvidence("PSI107-MET-low SPICE methane", 20);
  const record = r.matches.find(item => item.exp_id === "PSI107-MET-low");
  assert.ok(record);
  assert.equal(record.evidence_state, "UNKNOWN");
  assert.equal(record.record_class, "documented_configuration");
});

test("source lookup is explicitly source metadata, not an observation", () => {
  const r = getSource("NASA-FLARE");
  assert.equal(r.evidence_state, "UNKNOWN");
  assert.equal(r.record_class, "source_metadata");
  assert.equal(r.metadata_only, true);
  assert.match(r.evidence_state_note, /does not make every linked claim/i);
});

test("comparison explicitly blocks causal inference", () => {
  const r = compareExperiments("PSI98-S1", "PSI98-S2");
  assert.match(r.causal_warning, /do not establish causality/i);
});

test("unknown experiment cannot fabricate evidence", () => {
  const r = getExperiment("NOT-A-REAL-EXPERIMENT");
  assert.match(r.error, /not found/i);
});

test("source lookup preserves DOI/URL metadata", () => {
  const r = getSource("PSI-98");
  assert.equal(r.source_id, "PSI-98");
  assert.ok(r.doi || r.url);
});

test("dataset analysis returns reproducible chart-ready values and source metadata", () => {
  const r = analyzeDataset("distribution", "burn_duration", ["PSI98-S1", "PSI98-S2"]);
  assert.equal(r.n, 2);
  assert.equal(r.summary.min, 70);
  assert.equal(r.summary.max, 420);
  assert.equal(r.visualization.type, "bar");
  assert.deepEqual(r.rows.map(x => x.label), ["PSI98-S1", "PSI98-S2"]);
  assert.ok(r.sources.some(x => x.source_id === "PSI-98"));
});

test("coverage analysis reports the selected seed corpus rather than implying archive completeness", () => {
  const r = analyzeDataset("coverage");
  assert.equal(r.operation, "coverage");
  assert.match(r.summary, /seed corpus only/i);
  assert.ok(r.rows.some(x => x.label === "burn_duration"));
});

test("unsupported scientific variable is rejected instead of fabricated", () => {
  const r = analyzeDataset("distribution", "made_up_variable");
  assert.ok(r.error);
  assert.ok(r.supported_variables.includes("burn_duration"));
});

test("null, blank, and non-finite measurement fields are not numeric observations", () => {
  for (const measurement of [
    { canonical_value: null, value: null },
    { canonical_value: "", value: "" },
    { canonical_value: "not available", value: "not available" },
    {}
  ]) {
    assert.equal(hasReportedMeasurement({ observations: [{ measurement }] }), false);
  }
  assert.equal(hasReportedMeasurement({ observations: [{ measurement: { canonical_value: 0 } }] }), true);
});
