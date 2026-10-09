import test from "node:test";
import assert from "node:assert/strict";
import { searchNASAEvidence, hasReportedMeasurement, finiteNumericValue } from "../src/evidence.mjs";

test("reported measurement records are distinguished from documented configurations", () => {
  const measured = searchNASAEvidence("PSI98-S1 SAFFIRE burn duration", 20).evidence
    .find(record => record.exp_id === "PSI98-S1");
  assert.ok(measured, "expected the indexed SAFFIRE S1 record");
  assert.equal(measured.evidence_state, "NASA_REPORTED");
  assert.equal(measured.record_class, "reported_measurements");
  assert.ok(measured.observations.some(o => o.measurement && Number.isFinite(Number(o.measurement.canonical_value))));
});

test("configuration-only records do not receive a reported-measurement state", () => {
  const record = searchNASAEvidence("PSI107-MET-low SPICE methane", 20).evidence
    .find(item => item.exp_id === "PSI107-MET-low");
  assert.ok(record, "expected the indexed SPICE configuration record");
  assert.equal(record.evidence_state, "UNKNOWN");
  assert.equal(record.record_class, "documented_configuration");
  assert.match(record.evidence_state_note, /No indexed numeric outcome measurement/i);
});

test("metadata-only sources stay visibly marked as metadata", () => {
  const record = searchNASAEvidence("NASA-NTRS-20170000230 SAFFIREII", 20).evidence
    .find(item => item.source_ids.includes("NASA-NTRS-20170000230"));
  assert.ok(record, "expected the FLARE metadata record");
  assert.ok(record.sources.some(source => source.source_id === "NASA-NTRS-20170000230" && source.metadata_only === true));
  assert.notEqual(record.evidence_state, "NASA_OBSERVED");
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
