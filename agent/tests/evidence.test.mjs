import test from "node:test";
import assert from "node:assert/strict";
import { searchNasaEvidence, getExperiment, compareExperiments, getSource } from "../evidence.mjs";

test("NASA corpus search returns provenance", () => {
  const r = searchNasaEvidence("SAFFIRE S1 burn duration");
  assert.equal(r.dataset_id, "prometheus-nasa-psi-seed-2026-10-06");
  assert.ok(r.matches.length > 0);
  assert.ok(r.matches[0].sources.some(s => s.source_id === "PSI-98"));
});

test("experiment retrieval preserves evidence state", () => {
  const r = getExperiment("PSI98-S1");
  assert.equal(r.evidence_state, "NASA_OBSERVED");
  assert.ok(r.sources.length > 0);
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
