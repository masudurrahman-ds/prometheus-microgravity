# PROMETHEUS Repository Audit — Phase 1 Baseline

**Audit date:** 2026-10-10  
**Baseline branch:** `main`  
**Baseline commit:** `4ff8f09f050e8ec2a2c4bce0d8e6ffc6d99be860`  
**Purpose:** establish a reproducible engineering baseline before major AI, data, visualization, or interface changes.

## Executive decision

Do not perform a wholesale rewrite and do not continue stacking unisolated patches. Preserve the Android/Capacitor shell and evidence/provenance foundations where verified; isolate and refactor the UI, AI routing, analysis, and visualization layers behind testable contracts. Remove redundant implementations only after callers, configuration, and unique behavior have been mapped.

## Verified baseline

- The mainline Android workflow passed at run [#245](https://github.com/masudurrahman-ds/prometheus-microgravity/actions/runs/37951749542), for commit `4ff8f09f050e8ec2a2c4bce0d8e6ffc6d99be860`. Its steps include repository validation, Capacitor sync, debug APK build, and artifact upload.
- The app uses Capacitor with a native Android `MainActivity`; the native activity injects `android/app/src/main/assets/prometheus_ai.js` into the WebView.
- The main UI is concentrated in `www/index.html`; AI overlay behavior is implemented separately in the injected Android asset.
- Two backend areas exist: `agent/` and `server/`. Their entry points and API contracts must be traced before either is removed or designated canonical.
- Dataset `data/prometheus_nasa_psi.json` declares dataset ID `prometheus-nasa-psi-seed-2026-10-06`, 17 experiment records, and 23 source records. Eighteen source records are marked metadata-only. This is a curated seed, not a complete NASA corpus.
- The seed file `data/prometheus_nasa_psi_seed.json` separately includes a small number of PSI experimental-table examples and metadata-only investigation summaries. Dataset files must be reconciled so users cannot mistake one for the other.
- `data/schema/evidence-record.schema.json` already distinguishes `NASA_OBSERVED`, `NASA_REPORTED`, `DERIVED`, `MODEL_INFERRED`, `ANALOGICAL`, and `UNKNOWN`.
- The Android manifest requests internet access and package-install permission. Update publication is separately controlled by `.github/workflows/publish-android-update.yml`; production signing secrets are required. Audit the user-consent and update flow before adding permissions or changing installation behavior.
- Open PR #5 (AI launcher/3D label changes) and PR #6 (dashboard changes) overlap with current mainline concerns. Do not merge either wholesale. Compare their file-level changes with current main and reapply only verified, non-conflicting behavior.

## Main risks

| ID | Severity | Risk | Required control |
|---|---|---|---|
| R1 | Critical | More than one AI backend may produce divergent answers or tools | Trace all callers, endpoints, configuration, and tests; then select one canonical contract |
| R2 | Critical | A metadata-rich catalogue can be mistaken for measured experimental coverage | Label record classes explicitly; compute coverage from actual records and observations |
| R3 | Critical | A graph can look scientific while plotting unrelated or proxy values | Typed chart contract with units, source IDs, evidence state, and valid chart-type rules |
| R4 | High | Main UI and injected AI script are large, tightly coupled files | Extract bounded modules incrementally; keep stable interfaces and regression tests |
| R5 | High | Scenario selection/reset can leave stale laboratory state | Define one scenario-state lifecycle and test switch/reset/empty-data transitions |
| R6 | High | Text-only CI checks can pass while the Android screen remains broken | Add behavioral/render tests where possible and keep physical-device verification explicit |
| R7 | High | Competing open PRs may reintroduce obsolete styles or behavior | Review patches against current main; do not merge blindly |
| R8 | High | Release/update workflow changes could affect installation or signing | Keep debug and release lanes separate; validate signing and manifest before publication |
| R9 | Medium | Data schema/version drift between seed files | Define a canonical corpus and versioned manifest; validate every shipped dataset |
| R10 | Medium | Permissions and data collection may outgrow the consent text | Least privilege, explicit purpose, no undisclosed collection, auditable consent |

## Retain / refactor / replace decisions

### Retain (strengthen, do not rewrite without cause)
- Native Android + Capacitor wrapper and package identity.
- Evidence-state vocabulary and provenance/source records.
- Versioned data manifests and scientific-disclosure principles.
- Existing CI debug build as a baseline gate.
- Existing functional UI flows until equivalent replacements pass acceptance tests.

### Refactor behind explicit contracts
- AI entry-point, backend selection, and local/cloud routing.
- Corpus loading, normalization, retrieval, and citation assembly.
- Scenario state, reset behavior, and nearest-evidence matching.
- Chart data preparation and 2D/3D rendering.
- Dashboard navigation and responsive layout.
- Validation scripts into behavior-oriented tests instead of string-only assertions where practical.

### Replace only after proof of non-use or superior tested replacement
- Duplicate backend paths and overlapping UI implementations.
- Any generic line-graph fallback that connects independent experiments without a justified ordered independent variable.
- Synthetic/default values presented as NASA observations.
- Features that cannot meet an explicit acceptance test and block core workflows.

No feature is to be deleted solely because it is inconvenient to maintain. Delete when it is redundant, misleading, unsafe, unreferenced, or demonstrably inferior to a tested replacement.

## Phase gates

1. **G1 — Baseline map:** inventory runtime entry points, call graph, endpoints, data consumers, and current tests.
2. **G2 — Data integrity:** reconcile the two dataset files; validate counts, provenance, evidence state, units, and metadata-only handling.
3. **G3 — Agent contract:** choose one canonical request/response/tool interface; preserve local/offline behavior that is actually implemented and tested.
4. **G4 — Visualization contract:** define chart types and provenance-bearing series; independent experiment records must not be connected as a trend by default.
5. **G5 — UI refactor:** apply screen hierarchy and responsive layout behind stable navigation/state contracts.
6. **G6 — Device/release validation:** CI, regression checks, APK artifact, and documented physical-device checks before claiming the experience is verified.

## Non-negotiable scientific and release rules

- Never fabricate a NASA measurement, citation, DOI, or experiment result.
- Keep observed/reported data distinct from derived values, model inference, analogy, and unknowns.
- A metadata-only source is not an experimental observation.
- A visual simulation is not a physical combustion simulation unless a validated physics model supports that claim.
- CI success proves the tested workflow passed; it does not prove all screen layouts work on a physical phone.
- Do not commit secrets, API keys, keystores, `.env` files, or private user data.
- Keep risky architectural work on a branch and review it before merging to `main`.

## Immediate next investigation

Trace:
1. Which AI backend and endpoint the Android app actually invokes in each mode.
2. Which dataset file is loaded by each screen, the lab, and the AI.
3. Which calculations generate the 3D curve and other graphs, including the ordering and provenance of each plotted point.
4. What PR #5 and PR #6 add that is not already present in main.
5. Whether current tests execute behavior or mostly assert source-code strings.

The output of this investigation should update this document with file paths, call sites, and test evidence before major implementation begins.
