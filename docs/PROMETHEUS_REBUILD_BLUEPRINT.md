# PROMETHEUS Rebuild Blueprint
**Status:** Planning baseline — no legacy files removed and no production behavior changed.  
**Branch:** `rebuild/implementation-blueprint`  
**Goal:** Evolve PROMETHEUS into an evidence-grounded research agent for microgravity combustion while preserving the existing repository URL and scientific traceability.

## 1. Product contract

PROMETHEUS helps researchers explore and compare microgravity-combustion evidence. It is a research assistant, not a certified fire-safety system, flight decision system, or substitute for domain-expert review.

Every material scientific claim must be one of:
- **NASA OBSERVED** — a value directly present in a clearly identified primary data record.
- **NASA REPORTED** — a result or measurement described by a NASA-authored/repository record, but not independently reprocessed from raw instrument data.
- **DERIVED** — a reproducible calculation with equation, inputs, units, and method recorded.
- **MODEL-INFERRED** — a model output with model/version, inputs, assumptions, and limitations disclosed.
- **ANALOGICAL** — a conceptual comparison, not evidence that the same behavior occurred in the cited experiment.
- **UNKNOWN / INSUFFICIENT EVIDENCE** — evidence is absent, ambiguous, or incompatible.

Do not silently upgrade metadata, a test configuration, or a reported range into a measured observation. Never invent missing values, citations, confidence percentages, experiment details, or validation results.

## 2. Repository safety and rollout

1. Keep the current repository identity and history. Do not delete the existing implementation during discovery.
2. Work on a feature branch and preserve `main` as the recovery baseline.
3. Inventory the real file tree, package manifests, tests, CI workflows, platform targets, and data schemas before deciding what to replace.
4. Establish a baseline: install dependencies, run existing tests, run static checks, build the web/mobile targets that are actually supported, and record failures separately from new regressions.
5. Build new vertical slices alongside the existing application. Remove legacy files only after references are mapped, replacement parity is demonstrated, and the team approves the deletion list.
6. Merge to `main` only after the acceptance gates in this document pass. A branch or draft PR is not evidence that the product builds or is scientifically validated.

## 3. Proposed system boundaries

### Client
- Responsive research workspace with evidence search, experiment details, side-by-side comparisons, data plots, and an optional 3D explorer.
- Voice input is an alternate input/output mode for the same agent—not a separate answer engine.
- Text remains available if microphone permission, speech recognition, network, or TTS fails.
- Display provenance inline and expose source details, units, missing fields, and limitations.
- Explicitly label illustrative visualizations separately from evidence-backed reconstructions.

### Agent API
Retain the current Node agent provisionally until its behavior is tested against a written evaluation set. Avoid adding a second backend framework without a benchmark showing a concrete advantage.

Expected request lifecycle:
1. Validate request shape, size, and consent.
2. Normalize and bound user input and conversation history.
3. Retrieve candidate evidence from the local corpus.
4. Execute deterministic, schema-validated tools for exact lookup and calculations.
5. Ask the model to synthesize only from tool-returned evidence.
6. Validate output claims and citations against retrieved source IDs.
7. Return answer, evidence items, uncertainty/limitations, and a trace of tools used.
8. Apply safe timeouts, rate limits, redacted logs, and predictable error responses.

### Evidence/data layer
Use a versioned canonical record schema. Suggested minimum fields:

```json
{
  "record_id": "stable-unique-id",
  "investigation_id": "PSI-98",
  "title": "source-provided title",
  "source_url": "https://...",
  "source_doi": "10....",
  "source_locator": "file/table/page/row where available",
  "evidence_class": "NASA_REPORTED",
  "record_kind": "reported_result",
  "variables": [
    {
      "name": "flow_velocity",
      "value": 20,
      "unit": "cm/s",
      "measurement_status": "reported",
      "uncertainty": null
    }
  ],
  "fuel": null,
  "gravity_regime": "microgravity",
  "method_notes": [],
  "limitations": [],
  "license": null,
  "ingested_at": "ISO-8601 timestamp",
  "schema_version": 1
}
```

This is a target schema, not a claim that all current records already satisfy it. Keep raw source artifacts immutable where licensing permits; preserve source identifiers and record transformation steps. Validate uniqueness, units, required source fields, allowed evidence classes, and provenance during ingestion.

### Analysis layer
- Prefer deterministic calculations for counts, ranges, filtering, unit conversions, and comparisons.
- Only compare variables when definitions, units, experimental context, and evidence status are compatible.
- A correlation or pairwise difference is not causal evidence.
- Missing values stay missing; do not fill them with plausible-looking defaults.
- Dataset coverage must disclose the corpus size, filters, exclusions, and whether values are raw, reported, or derived.

### Visualization layer
- Charts must state variable, unit, source record(s), filtering, and missing-data behavior.
- The 3D viewer has two distinct modes: **Evidence-linked** (all displayed parameters trace to sources) and **Conceptual** (explicitly illustrative).
- Do not call a canvas animation a validated physical simulation.
- A scientific simulation requires a documented model, boundary conditions, material properties, solver/version, validation dataset, and error/uncertainty reporting.

## 4. NASA evidence ingestion order

Start narrow; do not combine unlike investigations into one undifferentiated dataset.

1. **SAFFIRE-I / PSI-98** — initial end-to-end ingestion and provenance demonstration.
2. **BASS-II / PSI-25** — add a separate investigation with its own experimental context and compatibility rules.
3. **SPICE / PSI-107** — treat as a specialized flame dataset with distinct fuels, burner sizes, and flow conditions; add only after its source files and schema are inspected.

For each ingestion batch:
- Record the official NASA PSI investigation URL, DOI when available, license, source filename, and access date.
- Separate observations, NASA-reported results, experiment configuration/metadata, derived quantities, and conceptual interpretation.
- Normalize units without discarding original values/units.
- Keep source-row or page/table locators wherever possible.
- Run duplicate-ID, duplicate-content, missingness, unit, and provenance checks.
- Produce an ingestion report with counts by evidence class and unresolved issues.

Official starting points:
- PSI-98: https://psi.nasa.gov/physci/repo/data/investigations/PSI-98
- PSI-25: https://psi.nasa.gov/physci/repo/data/investigations/PSI-25
- PSI-107: https://psi.nasa.gov/physci/repo/data/investigations/PSI-107

NASA data availability or a repository description does not by itself mean the full underlying raw data has been downloaded, parsed, or validated.

## 5. Voice plan

### First release
- Push-to-talk while the app is visible.
- Clear microphone permission explanation and visible recording state.
- Speech-to-text adapter with capability detection; gracefully fall back to typing.
- Spoken answer through platform TTS where available.
- Read concise answer aloud; keep source citations and detailed evidence visible on screen.
- Stop/cancel control, interruption handling, and transcript review before sending if the user prefers.
- Explicit cloud-processing consent before sending transcript content to a hosted model.

### Background invocation
Prefer a notification action, app shortcut/widget, or supported assistant/App Actions integration. These can invoke a deliberate user action without claiming that the app continuously listens.

Always-on custom wake-word support is a separate milestone. On modern Android, background microphone use and foreground-service starts are restricted; a normal app cannot safely promise arbitrary continuous listening. A system-level voice-interaction integration, where eligible and appropriate, requires separate permission, privacy, battery, false-trigger, and device testing. Do not fake always-on behavior by repeatedly restarting speech recognition.

Offline speech recognition does not equal offline reasoning. A genuinely offline agent also needs an on-device model, local retrieval corpus, and a device-performance evaluation.

## 6. Security and privacy checklist

- Keep provider API keys only on the server; never bundle them in Android/iOS/web assets.
- Set restrictive production CORS origins; avoid a wildcard default in production.
- Bound request body, history length, tool rounds, execution time, and output size.
- Validate all tool arguments against explicit schemas and allowlisted variables/operations.
- Treat retrieved documents and user-provided files as untrusted data; never let source text override system policy or authorize tool actions.
- Validate citations against source IDs actually returned by retrieval.
- Make cloud consent explicit, scoped, and revocable; consent is not authentication.
- Redact sensitive prompt/transcript content from logs by default.
- Add deployment-aware rate limiting, abuse monitoring, and predictable failure behavior.
- Do not trust client-supplied IP forwarding headers unless the deployment proxy is configured to sanitize them.
- Provide health checks without exposing secrets or sensitive configuration.
- Document data retention, deletion, telemetry, and whether audio or transcripts leave the device.

## 7. Evaluation and acceptance gates

### Existing-system baseline
- Install/build commands work in a clean environment, or known failures are documented.
- Existing tests and CI status are recorded before changes.
- All app entry points and runtime targets are identified.

### Scientific correctness
- Every answer that makes a factual experimental claim includes a resolvable source reference or states that evidence is insufficient.
- Citations never point to sources not returned by retrieval.
- Missing values are not fabricated.
- Derived values can be reproduced from displayed inputs and equations.
- Incompatible investigations are not compared without an explicit compatibility rationale.
- A human reviewer checks a small, versioned set of gold questions and expected source records.

### Reliability and UX
- Empty corpus, malformed input, provider timeout, offline state, and tool errors produce understandable responses.
- Keyboard-only and mobile layouts remain usable.
- Voice denial/unavailability does not block research.
- Charts explain units and data gaps.
- Conceptual 3D scenes are visibly marked as illustrative.

### Security
- No client bundle or committed file contains a real secret.
- Invalid and oversized requests are rejected.
- Tool arguments are validated.
- CORS, rate limits, timeouts, and consent paths are tested.
- Prompt-injection test cases cannot change evidence labels, fabricate citations, or bypass tool constraints.

## 8. Implementation sequence

**Phase 0 — Baseline audit:** inventory tree and manifests; run current tests/build; inspect the current evidence corpus and tool contracts; produce a defect list with severity and evidence.

**Phase 1 — Trustworthy evidence core:** define schema and validators; clean duplicate/malformed records; add ingestion report; write retrieval and citation-integrity tests.

**Phase 2 — Agent hardening:** request validation, bounded history/tool rounds, timeouts, restrictive CORS configuration, deployment-aware rate limits, structured errors, and source-grounded answer validation.

**Phase 3 — Research UX:** search, experiment detail, comparison, evidence drawer, accessible charts, empty/error/loading states.

**Phase 4 — Voice:** visible-app push-to-talk and TTS first; then shortcut/notification invocation; assess wake-word integration separately.

**Phase 5 — 3D and analysis:** evidence-linked visualizations first; conceptual scenes labeled clearly; validated simulation only if time and data support it.

**Phase 6 — Release gates:** clean install/build, regression tests, scientific review, security review, device test, updated README/demo, then merge.

## 9. Immediate next actions

1. Capture the current `main` baseline and inventory every tracked path.
2. Inspect `package.json`, Android/iOS manifests, CI workflows, test files, and the full current corpus.
3. Run or reproduce the documented test/build commands before editing runtime behavior.
4. Convert findings into prioritized, testable issues.
5. Start with the smallest high-value slice: source-backed lookup + citation validation + tests.
6. Do not delete or replace app directories until dependencies and working features have been mapped.

**Non-goal:** generating a large amount of synthetic prompts or records to simulate scientific knowledge. Quality comes from traceable sources, robust retrieval, deterministic analysis, and measured evaluation—not prompt volume.
