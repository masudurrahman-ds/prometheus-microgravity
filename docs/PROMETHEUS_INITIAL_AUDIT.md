# PROMETHEUS Initial Repository Audit
**Audit scope:** static review of selected files on `main`  
**Date:** 2026-10-27  
**Status:** Preliminary findings; runtime tests not yet executed in this audit.  
**Safety:** This report does not modify or delete any files on `main`.

## Inspected components

- Root `package.json`
- `agent/package.json`
- `agent/server.mjs`
- `agent/evidence.mjs`
- `agent/evals.json`
- `data/prometheus_nasa_psi.json` (header/source catalogue inspected; full corpus validation pending)
- `android/app/src/main/AndroidManifest.xml`
- `.github/workflows/build-android.yml`
- Root and agent READMEs
- `www/index.html` (initial UI/style inspection only)

## Strengths to preserve

1. Agent-side tool boundary separates search, exact experiment lookup, pairwise comparison, source lookup, and descriptive dataset analysis.
2. The system prompt explicitly forbids invented measurements/citations, causal claims from pairwise differences, and treating retrieved documents as instructions.
3. Evidence records distinguish a seed corpus from the full NASA PSI archive.
4. The corpus records official NASA PSI source metadata and explicitly documents that some canonical values are proxies or midpoints.
5. A small evaluation set already covers source use, unsupported causality, missing values, and unrelated questions.
6. Android CI checks several JavaScript files, runs the agent tests and a second server test suite, syncs Capacitor, and builds a debug APK.
7. The Android manifest currently declares INTERNET permission but no microphone permission. That is appropriate until voice is deliberately implemented; do not add microphone access merely to advertise voice support.

## Preliminary findings

### P1 — Agent request validation is incomplete
**Evidence:** `agent/server.mjs` checks that `message` is a non-empty string and that history is an array of at most 24 items. The model call then passes up to the last 12 history entries directly into the Responses API.  
**Risk:** malformed history entries, unexpected roles/content shapes, or oversized individual strings may cause failures or unintended model context.  
**Recommended repair:** validate every history item against a strict allowlist of roles and content formats; cap per-message and aggregate characters/tokens; reject unsupported fields rather than silently forwarding arbitrary structures. Add tests for malformed entries, unsupported roles, huge strings, and empty history.

### P1 — Tool arguments are not validated again at execution time
**Evidence:** tool JSON parse failures are caught and replaced with an empty object; `runTool` dispatches parsed arguments directly to the evidence functions. The tool definitions describe schemas for the model but server-side validation is not visible.  
**Risk:** relying on model/provider schema enforcement alone leaves a fragile trust boundary and can create odd behavior for malformed arguments.  
**Recommended repair:** parse strictly; validate each tool's arguments on the server; return a structured tool error for invalid input; bound strings and arrays; do not execute when parsing fails. Add direct unit tests for every tool contract.

### P1 — Wildcard CORS is the default
**Evidence:** `ALLOWED_ORIGIN` defaults to `"*"` and is reflected in API responses.  
**Risk:** any website can make browser-readable requests to the API. CORS is not authentication, and wildcard origin may be inappropriate for a hosted agent.  
**Recommended repair:** use a secure production default (deny browser origins unless configured); allow exact origins from a normalized allowlist; keep local development configuration explicit. Test allowed, disallowed, absent, and preflight origins.

### P1 — Model fetch has no explicit timeout or cancellation
**Evidence:** `callLLM` calls `fetch` without an AbortSignal or timeout; tool rounds can make repeated calls.  
**Risk:** requests can occupy server resources for an extended time if upstream stalls.  
**Recommended repair:** apply per-request timeout and abort handling, a total agent deadline, and bounded tool rounds. Return a generic safe error to the client while keeping detailed diagnostic information out of responses. Test upstream timeout and cancellation behavior.

### P1 — Rate-limit identity trusts the first forwarded IP
**Evidence:** client identity is derived from `x-forwarded-for` when present, otherwise socket address.  
**Risk:** in deployments that do not sanitize forwarding headers at a trusted proxy, a client may spoof the header and evade per-IP limits.  
**Recommended repair:** only honor forwarding headers behind a known proxy that overwrites/sanitizes them; otherwise use the socket address. Use a deployment-aware shared rate limiter if the service scales horizontally. Test spoofed header behavior under both proxy and direct deployment configurations.

### P2 — Rate limiter uses process-local memory
**Evidence:** counters are stored in a local `Map` and expired by minute bucket.  
**Risk:** restarts reset counters; multiple instances do not share limits; high-cardinality requests can create short-lived map entries.  
**Recommended repair:** add a maximum map size/periodic cleanup and document the single-instance limitation, or use a shared store when deploying multiple replicas. Keep limits configurable and validate their environment-variable values.

### P2 — Environment configuration is not visibly range-validated
**Evidence:** `PORT`, `MAX_TOOL_ROUNDS`, `MAX_BODY_BYTES`, and `RATE_LIMIT_PER_MINUTE` are parsed with `Number(...)`.  
**Risk:** invalid, negative, zero, or unexpectedly large values may produce confusing behavior.  
**Recommended repair:** validate at startup with safe integer ranges; fail fast with a non-secret configuration error.

### P2 — Corpus loading depends on process working directory
**Evidence:** `agent/evidence.mjs` resolves `../data/prometheus_nasa_psi.json` from `process.cwd()`.  
**Risk:** importing the module or launching it from a different working directory can fail to locate the corpus. The documented `cd agent && npm test/start` flow should be checked.  
**Recommended repair:** resolve the corpus path relative to the module file (for example, using `import.meta.url`) and add a test that runs from a different working directory.

### P2 — Claim labels are inconsistent across layers
**Evidence:** the system prompt uses `NASA_OBSERVED` / `NASA_REPORTED` underscore labels, while README-facing labels use spaces/hyphens. The experiment classifier labels any record with a numeric observation as `NASA_REPORTED`, with a note that it is not asserting raw instrument-level observation.  
**Risk:** the UI, API, tests, and generated responses may display inconsistent terminology; numeric presence alone should not be the only criterion for assigning provenance status.  
**Recommended repair:** define a canonical enum and separate claim-level evidence status from record class and measurement origin. Add schema validation and render-friendly labels at the UI boundary only.

### P2 — Tool-call traces may retain more data than needed
**Evidence:** trace entries include tool arguments and full tool results. The current server returns trace data with the final answer.  
**Risk:** larger responses, unnecessary exposure of raw retrieved content, and possible accidental client-side display of internals.  
**Recommended repair:** define a public trace schema that contains tool name, safe summary, source IDs, and duration; keep sensitive/raw details in redacted server logs only when necessary. Confirm that no secrets or unneeded content enter traces.

### P2 — Cloud consent is a boolean in the request
**Evidence:** server checks `body.consent.cloud_ai === true`.  
**Risk:** this proves only that the request body contains a boolean; it is not authentication or durable evidence of user consent. A client can set it programmatically.  
**Recommended repair:** retain explicit UI disclosure and affirmative action, transmit the result only after consent, and document the limits of this check. Do not treat the flag as an authorization control.

### P3 — Voice is not yet represented in Android permissions
**Evidence:** manifest currently requests INTERNET and REQUEST_INSTALL_PACKAGES, but not RECORD_AUDIO.  
**Risk/opportunity:** voice input is not currently enabled through this manifest. This is not a defect unless voice is part of the selected release scope.  
**Recommended repair:** implement push-to-talk deliberately with runtime permission, visible recording state, transcript/cloud disclosure, denial fallback, and tests before adding microphone permission. Background wake-word listening should remain a separate milestone.

## Data validation still required

- Parse the entire JSON and validate against an explicit schema.
- Confirm unique experiment IDs and source IDs.
- Confirm every experiment source reference resolves.
- Check duplicate observations and duplicate records.
- Check unit consistency and canonical-value provenance.
- Check each numeric value for original value/unit, canonical value/unit, locator, evidence status, and proxy/midpoint note where relevant.
- Validate supported analysis variables against the actual corpus and UI.
- Verify the measurement coverage output against independently computed counts.
- Confirm that a numeric condition/configuration does not get treated as an outcome measurement.

## Runtime validation still required

No test or Android build result is asserted by this preliminary static report. Next run the documented workflow in a clean checkout/environment:
1. `npm install --no-audit --no-fund`
2. `node scripts/validate_web.mjs`
3. `node --check android/app/src/main/assets/prometheus_ai.js`
4. `cd agent && node --check server.mjs && node --check evidence.mjs && npm test`
5. `cd ../server && node --check src/evidence.mjs && node --test tests/evidence.test.mjs`
6. `npx cap sync android`
7. `gradle -p android assembleDebug --no-daemon`

Capture failures exactly and distinguish pre-existing issues from changes introduced on the rebuild branch.

## Priority order

1. Reproduce baseline tests and build.
2. Add strict schemas and tests for corpus and agent tool inputs.
3. Harden CORS, timeout, configuration validation, and deployment-aware rate limiting.
4. Validate scientific labels, data coverage, source locators, and proxy handling.
5. Implement UI/voice changes only after core evidence contracts pass.
6. Remove legacy code only after dependency mapping, replacement tests, and review.

## Limitations of this report

This is a preliminary static audit based on selected files, not a full security assessment, complete code audit, scientific validation, or proof that the current application builds. Findings must be confirmed through execution and additional file inspection.
