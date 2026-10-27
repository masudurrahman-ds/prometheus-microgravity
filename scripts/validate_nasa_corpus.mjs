import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const corpusPath = path.resolve(here, "../data/prometheus_nasa_psi.json");
const corpus = JSON.parse(fs.readFileSync(corpusPath, "utf8"));

const errors = [];
const warnings = [];
const isObject = value => value !== null && typeof value === "object" && !Array.isArray(value);
const nonEmpty = value => typeof value === "string" && value.trim().length > 0;
const finite = value => value !== null && value !== undefined && !(typeof value === "string" && value.trim() === "") && Number.isFinite(Number(value));

if (!isObject(corpus)) errors.push("Corpus root must be a JSON object.");
if (!nonEmpty(corpus.dataset_id)) errors.push("dataset_id must be a non-empty string.");
if (!Array.isArray(corpus.sources)) errors.push("sources must be an array.");
if (!Array.isArray(corpus.experiments)) errors.push("experiments must be an array.");

const sources = Array.isArray(corpus.sources) ? corpus.sources : [];
const experiments = Array.isArray(corpus.experiments) ? corpus.experiments : [];
const sourceIds = new Set();
const experimentIds = new Set();
const duplicateSourceIds = new Set();
const duplicateExperimentIds = new Set();
let numericMeasurements = 0;
let canonicalValues = 0;

for (const [index, source] of sources.entries()) {
  if (!isObject(source)) {
    errors.push(`sources[${index}] must be an object.`);
    continue;
  }
  if (!nonEmpty(source.source_id)) errors.push(`sources[${index}] is missing source_id.`);
  else if (sourceIds.has(source.source_id)) duplicateSourceIds.add(source.source_id);
  else sourceIds.add(source.source_id);
  if (!nonEmpty(source.title)) warnings.push(`Source ${source.source_id || index} has no title.`);
  if (!nonEmpty(source.url) && !nonEmpty(source.doi)) warnings.push(`Source ${source.source_id || index} has neither URL nor DOI.`);
}
for (const id of duplicateSourceIds) errors.push(`Duplicate source_id: ${id}`);

for (const [index, experiment] of experiments.entries()) {
  if (!isObject(experiment)) {
    errors.push(`experiments[${index}] must be an object.`);
    continue;
  }
  const id = experiment.exp_id;
  if (!nonEmpty(id)) errors.push(`experiments[${index}] is missing exp_id.`);
  else if (experimentIds.has(id)) duplicateExperimentIds.add(id);
  else experimentIds.add(id);

  if (!Array.isArray(experiment.source_ids)) {
    errors.push(`Experiment ${id || index} must have source_ids array.`);
  } else {
    for (const sourceId of experiment.source_ids) {
      if (!sourceIds.has(sourceId)) errors.push(`Experiment ${id || index} references unknown source_id: ${sourceId}`);
    }
    if (new Set(experiment.source_ids).size !== experiment.source_ids.length) {
      errors.push(`Experiment ${id || index} contains duplicate source_ids.`);
    }
  }

  if (experiment.observations != null && !Array.isArray(experiment.observations)) {
    errors.push(`Experiment ${id || index} observations must be an array when present.`);
  }
  for (const [observationIndex, observation] of (Array.isArray(experiment.observations) ? experiment.observations : []).entries()) {
    if (!isObject(observation)) {
      errors.push(`Experiment ${id || index} observation ${observationIndex} must be an object.`);
      continue;
    }
    const measurement = observation.measurement;
    if (!isObject(measurement)) continue;
    const raw = measurement.canonical_value ?? measurement.value;
    if (finite(raw)) numericMeasurements++;
    if (measurement.canonical_value !== null && measurement.canonical_value !== undefined) {
      if (!finite(measurement.canonical_value)) {
        errors.push(`Experiment ${id || index} observation ${observationIndex} has non-finite canonical_value.`);
      } else {
        canonicalValues++;
        if (!nonEmpty(measurement.canonical_unit)) {
          warnings.push(`Experiment ${id || index} observation ${observationIndex} has canonical_value but no canonical_unit.`);
        }
      }
    }
    if (finite(raw) && !nonEmpty(measurement.unit) && !nonEmpty(measurement.canonical_unit)) {
      warnings.push(`Experiment ${id || index} observation ${observationIndex} has a numeric value without a unit.`);
    }
    if (measurement.canonical_note && !nonEmpty(measurement.canonical_note)) {
      warnings.push(`Experiment ${id || index} observation ${observationIndex} has an empty canonical_note.`);
    }
  }

  if (isObject(experiment.conditions)) {
    for (const [key, condition] of Object.entries(experiment.conditions)) {
      if (!isObject(condition)) {
        warnings.push(`Experiment ${id || index} condition ${key} is not an object.`);
        continue;
      }
      if (condition.canonical_value !== null && condition.canonical_value !== undefined && !finite(condition.canonical_value)) {
        errors.push(`Experiment ${id || index} condition ${key} has non-finite canonical_value.`);
      }
      if (finite(condition.canonical_value) && !nonEmpty(condition.canonical_unit)) {
        warnings.push(`Experiment ${id || index} condition ${key} has canonical_value but no canonical_unit.`);
      }
      if (finite(condition.value) && !nonEmpty(condition.unit) && !nonEmpty(condition.canonical_unit)) {
        warnings.push(`Experiment ${id || index} condition ${key} has a numeric value without a unit.`);
      }
    }
  }
}
for (const id of duplicateExperimentIds) errors.push(`Duplicate exp_id: ${id}`);

const summary = {
  dataset_id: corpus.dataset_id || null,
  sources: sources.length,
  experiments: experiments.length,
  numericObservationValues: numericMeasurements,
  canonicalObservationValues: canonicalValues,
  errors: errors.length,
  warnings: warnings.length
};
console.log("PROMETHEUS NASA corpus validation");
console.log(JSON.stringify(summary, null, 2));
for (const warning of warnings) console.warn("WARN:", warning);
for (const error of errors) console.error("ERROR:", error);
if (errors.length) process.exitCode = 1;
else console.log("Corpus structural validation passed. Warnings require scientific review; this is not source-level scientific validation.");
