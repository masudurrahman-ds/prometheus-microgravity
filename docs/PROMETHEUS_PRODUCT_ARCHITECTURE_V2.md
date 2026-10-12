# PROMETHEUS Product Architecture v2

Status: proposal for staged implementation  
Scope: Flame in Freefall / spacecraft fire-safety research  
Principle: a quiet interface backed by a rigorous, auditable research engine.

## Product outcome

PROMETHEUS should feel like a scientific research instrument, not a chatbot collection or a collection of unrelated app sections. The main screen should help a researcher discover what NASA's relevant research says, understand which studies are useful for a question, and choose the next investigation.

The application is a research aid. It must not claim to certify spacecraft fire safety or replace mission safety engineering, experimental validation, or NASA review.

## Main screen

Keep the home screen to four primary elements:

1. **Research question** — a single prominent input that accepts a natural-language research objective.
2. **Research brief** — a concise, source-linked summary of current knowledge, disagreements, missing data, and confidence/limitations.
3. **Relevant studies** — a ranked list with short reasons for each rank and direct links to source records.
4. **Research priorities** — a small number of next-step recommendations based on unresolved questions and evidence gaps.

Use plain typography, strong contrast, accessible text sizes, whitespace, and restrained visual styling. Avoid permanently visible Laboratory, Evidence, Universe, Mission, and other parallel sections. Put secondary tools, settings, data refresh, export, citations, analysis details, and advanced views under a single menu. Open a detailed view only when the user asks for it.

Do not hide critical uncertainty or source provenance. Show a compact source/coverage indicator on the main result and reveal full provenance, methods, tables, and charts on demand.

## Study discovery and ranking

Do not collapse all concepts into one opaque "AI score". Maintain separate, inspectable dimensions:

- **Question relevance:** overlap between the user's research objective and study topic, materials, conditions, and phenomena.
- **Evidence availability:** whether the source contains directly accessible measurements, a full-text report, metadata only, or a catalogue reference.
- **Methodological quality:** sample size, experimental design, uncertainty reporting, calibration, and validation, only where source data actually disclose them.
- **Transferability:** how closely the study conditions match the intended scenario; always explain assumptions and domain gaps.
- **Freshness/version:** whether the source has a newer version or correction, without treating newer publication date as automatic scientific superiority.

Show a transparent relevance rank and explanatory reasons. Keep evidence completeness and methodological quality separate. Do not equate relevance with scientific quality, fire risk, or safety severity. A fire-hazard score requires an independently validated and appropriately scoped risk model.

## NASA source strategy

Start with the NASA Physical Sciences Informatics (PSI) Combustion Science area and prioritize investigations relevant to spacecraft fire safety, solid-fuel ignition/spread/extinction, flame extinguishment, soot/smoke, flammability limits, and combustion under reduced gravity. Cross-check related NASA Technical Reports Server (NTRS) records and NASA mission/program pages.

Source pipeline requirements:

1. Discover and record source identifiers, title, source URL, DOI/persistent identifier, publication/version date, data type, license/terms, and retrieval time.
2. Fetch only publicly accessible records and downloads that the source terms permit.
3. Preserve original files and checksums where practical.
4. Extract text, tables, figures, units, experiment conditions, methods, and stated limitations; retain page/table/figure locators.
5. Store raw source, normalized record, and derived record separately.
6. Deduplicate by persistent identifier and content checksum, not title alone.
7. Re-run ingestion idempotently and emit a reviewable change report.
8. Mark unavailable, access-restricted, metadata-only, and not-yet-ingested records explicitly.
9. Cite the original NASA record and its persistent identifier whenever available.

"All relevant NASA data" is a goal for systematic coverage, not a claim that every PSI file has been obtained. PSI data availability is not uniform. A coverage dashboard must report discovered, accessible, ingested, parsed, validated, and blocked records separately.

## Research-agent execution

Use a controlled tool loop:

1. Plan the research tasks from the question.
2. Search the indexed corpus and external approved NASA source connectors.
3. Read relevant source passages/tables and extract candidate measurements with locators.
4. Normalize units only through explicit, tested conversion functions; retain source-reported values alongside normalized values.
5. Select deterministic analysis tools and a chart type appropriate to the variable semantics.
6. Validate the returned calculation, source linkage, units, missingness, and uncertainty.
7. Draft the answer from retrieved evidence and tool results.
8. Run claim-to-source checks and return a concise brief with limitations and suggested next steps.

Retrieved documents are untrusted data, not instructions. The agent must not execute code from documents or allow source text to override system controls.

## Safe evolution instead of uncontrolled self-training

"Autonomous improvement" should mean:

- scheduled discovery of new public sources;
- versioned ingestion and index updates;
- regression evaluations on a fixed scientific benchmark;
- detection of retrieval failures, unsupported claims, and chart/data mismatches;
- generation of proposed fixes and evaluation reports;
- human-approved promotion of changed prompts, retrieval settings, models, or code.

Do not let a production agent silently rewrite its own code, change its own safety policy, train on private conversations, or promote a new model without evaluation and rollback. Model training is not a substitute for current source retrieval and verified tools. Keep an immutable release/version history.

## Shared cross-platform architecture

- Existing Capacitor web UI: retain during migration and use for Android/iOS; keep the responsive web app.
- Python FastAPI service: shared research API, source retrieval, analysis, ranking, job status, and chart specifications.
- Desktop: initially package the shared web UI or use a lightweight desktop shell; a separate native UI is optional, not a prerequisite.
- Database: PostgreSQL for source/experiment metadata, versioning, job state, and user settings; add vector indexing only after evaluating retrieval quality.
- Object storage: original public documents, extracted artifacts, and versioned ingestion outputs.
- Background worker: long-running ingestion and analysis jobs, with idempotency and job status.
- Client contract: stable versioned schemas for research brief, studies, citations, chart data, uncertainty, and errors.

The clients must not contain model provider keys. All network APIs must use TLS, authentication where appropriate, server-side secret management, input validation, rate limiting, and least-privilege access.

## Privacy and deployment

Use public NASA sources for corpus ingestion. Do not send personal or confidential user files to third-party inference without explicit consent and clear disclosure. Minimize stored prompts, disable unnecessary request-body logging, set retention limits, and document each external processor.

A free hosting tier is suitable for a non-sensitive prototype only after reviewing its current terms and limits. Free hosting does not guarantee confidentiality, high availability, persistent storage, or enough compute for large local models. Keep sensitive work local or use a vetted paid/private deployment if required.

## Acceptance gates

- Every displayed study links to a real source record.
- Metadata-only sources never count as numeric experimental measurements.
- Every numeric chart point has a variable, unit, record ID, source ID, and evidence state.
- Unordered independent studies are not joined as a time-series or physical trajectory by default.
- Missing data remain missing; proxies and imputed values are labelled.
- Ranking reasons can be inspected and are not presented as hazard severity.
- Ingestion can run twice without duplicate records.
- Agent answers are evaluated against a fixed, versioned benchmark.
- Android, web, iOS, macOS, and Windows use the same versioned research API.
- A successful CI build is not described as physical-device verification.
