import test from "node:test";
import assert from "node:assert/strict";
import { searchNasaEvidence, getExperiment, compareExperiments, getSource, analyzeDataset, hasReportedMeasurement, finiteNumericValue } from "../evidence.mjs";

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
  assert.match(r.evidence_state_note, /not an experiment measurement/i);
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

test("numeric parsing rejects null and blank values instead of coercing them to zero", () => {
  assert.equal(finiteNumericValue(null), null);
  assert.equal(finiteNumericValue(undefined), null);
  assert.equal(finiteNumericValue(""), null);
  assert.equal(finiteNumericValue("   "), null);
  assert.equal(finiteNumericValue("not available"), null);
  assert.equal(finiteNumericValue("0"), 0);
  assert.equal(finiteNumericValue(0), 0);
  assert.equal(finiteNumericValue("420"), 420);
});

test("chart-ready dataset values contain finite numeric outcomes only", () => {
  const r = analyzeDataset("distribution", "burn_duration", ["PSI98-S1", "PSI98-S2"]);
  assert.ok(r.rows.length > 0);
  assert.ok(r.rows.every(row => Number.isFinite(row.y)));
  assert.ok(r.visualization.rows.every(row => Number.isFinite(row.y)));
  assert.deepEqual(r.visualization.rows.map(row => row.label), r.rows.map(row => row.label));
});

test("evidence search ranks experiment IDs and scientific fields above incidental text matches", () => {
  const exact = searchNasaEvidence("PSI98-S1", 20).matches;
  assert.equal(exact[0]?.exp_id, "PSI98-S1");
  const burn = searchNasaEvidence("SAFFIRE burn duration", 20).matches;
  assert.equal(burn[0]?.exp_id, "PSI98-S1");
  assert.ok(burn.some(item => item.exp_id === "PSI98-S2"));
});

test("evidence search ignores stop-word-only queries and normalizes separators", () => {
  assert.equal(searchNasaEvidence("why is it in the").matches.length, 0);
  assert.equal(searchNasaEvidence("PSI98 S1", 20).matches[0]?.exp_id, "PSI98-S1");
});
