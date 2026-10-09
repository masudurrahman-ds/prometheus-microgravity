# PROMETHEUS Engineering Roadmap — Award-Ready, Evidence-First

This roadmap prioritizes demonstrable scientific value, correctness, reproducibility, and a polished live demonstration over feature count. Work proceeds in small reviewable changes. Each phase has an exit gate; failing a gate blocks dependent work.

## Product thesis

PROMETHEUS should help a researcher ask a question about microgravity combustion and fire safety, find the relevant NASA evidence, distinguish what is measured from what is merely documented, compute defensible comparisons, and produce charts and an auditable answer. The differentiator is not an AI chat window; it is a transparent scientific workflow with reproducible evidence and meaningful visual analysis.

## Priority order

### P0 — Correctness and trust
- Establish a canonical dataset loader and corpus manifest.
- Audit source links, DOI metadata, record IDs, units, provenance, and license fields.
- Explicitly mark metadata-only sources and missing values.
- Ensure every AI factual claim can be linked to a source record or is labeled as a hypothesis/unknown.
- Add known-answer tests for all numerical calculations.
- Remove chart fallbacks that make a straight line from independent experiments or mix incompatible units.

### P1 — Core demo reliability
- One AI entry point and one documented backend contract.
- Clear loading, empty, error, offline, and unsupported-request states.
- Laboratory scenario selection, parameter changes, reset, and comparison must produce consistent results.
- Every graph must be driven by selected data and explain its x/y/z variables, units, evidence class, sample count, and limitations.
- Mobile layout: safe areas, keyboard, rotation, touch targets, readable graph labels, and no duplicate overlay.
- A reproducible demonstration script and seeded scenarios that do not pretend synthetic results are NASA observations.

### P2 — Award-differentiating capabilities
Build only after P0/P1 pass:
- Evidence-grounded question answering with citations at claim level.
- Research explorer that compares investigations and clearly surfaces gaps in coverage.
- Dynamic chart selection: time series only for valid ordered time data; scatter for relationships; bars for categorical comparisons; distributions only when enough compatible observations exist.
- A provenance panel showing source, locator, measurement unit, transformation, and confidence/limitation.
- Exportable evidence report (question, data subset, calculations, citations, and caveats) for reproducibility.
- A graph/experiment comparison workflow that highlights matched conditions and differences.
- Optional video/evidence storyboard only if the underlying frames or simulation outputs are real and their origin is clearly disclosed. Do not generate fabricated footage and present it as experimental evidence.

### P3 — Advanced features (conditional)
- Retrieval-augmented generation over validated source text and structured records.
- Local model integration if model size, device performance, licenses, and actual offline operation are tested.
- Cloud model support only with explicit user choice, disclosure of data sent, secure server-side credentials, and safe failure behavior.
- Validated physical simulation only if equations, assumptions, numerical methods, and validation references are available. Otherwise retain evidence matching and label it correctly.

## Engineering sequence

1. Inventory runtime call graph and dataset consumers.
2. Add contract tests around current interfaces before changing them.
3. Reconcile corpus/schema and add validation for every shipped data file.
4. Consolidate the AI request path behind an adapter; migrate callers before removing obsolete paths.
5. Extract calculation and chart preparation from UI rendering.
6. Add visualization tests and fix graph semantics.
7. Refactor UI modules and state lifecycle incrementally.
8. Run CI and manual device acceptance checks.
9. Merge only a reviewed, tested pull request; publish APK with version and SHA-256.
10. Record known limitations and rehearse the demo against the exact release build.

## Definition of done for a feature

A feature is not done because it compiles or looks convincing. It must have:
- a clearly named user/research purpose;
- explicit input/output contracts;
- correct evidence labels and citations where relevant;
- tests for normal, empty, invalid, and boundary cases;
- a graceful failure mode;
- a responsive interaction path on Android;
- no regressions in navigation, scenario reset, or existing critical flows;
- documentation of limitations.

## Release scorecard

Do not merge a milestone unless all applicable items pass:
- [ ] Web/data validation passes.
- [ ] Unit and integration tests pass.
- [ ] AI evaluation examples have expected grounded behavior.
- [ ] Every plotted series has valid units and source provenance.
- [ ] Empty/missing/metadata-only data is handled honestly.
- [ ] No regression in AI overlay uniqueness, safe areas, or Android back handling.
- [ ] Lab scenario switch and reset are tested.
- [ ] APK build succeeds and artifact corresponds to the exact reviewed commit.
- [ ] Physical-device checks are recorded separately from CI.
- [ ] README and demo narrative match the actual implementation.

## Strategy

Do not maximize the number of features. Maximize the number of defensible claims the team can demonstrate live. A smaller, reliable system with traceable evidence and meaningful visualizations is stronger than an expansive interface that returns generic answers or the same graph for every request.
