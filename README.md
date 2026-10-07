# PROMETHEUS

**AI-powered scientific intelligence for microgravity combustion and spacecraft fire safety.**

PROMETHEUS is a research-oriented prototype for NASA Space Apps Challenge 2026. It combines a provenance-tracked NASA Physical Sciences Informatics (PSI) seed corpus with an interactive evidence explorer for comparing combustion experiments, inspecting uncertainty, identifying evidence gaps, and connecting observations to future mission questions.

## Evidence discipline

The current corpus is deliberately small. It contains two row-level measurements from NASA PSI's SAFFIRE-I Experimental Table (PSI-98), plus metadata-only context for BASS-II, FLEX, and SPICE.

PROMETHEUS distinguishes:

- **Observed** — directly represented NASA PSI measurement
- **NASA metadata** — fact reported on an investigation page
- **Derived** — calculated by PROMETHEUS
- **Proxy** — visualization-only value, not a NASA measurement
- **Unknown** — not reported or not inferable

No proxy or model-derived quantity should be presented as NASA-observed evidence.

## Project structure

- `www/` — self-contained PROMETHEUS web application
- `android/` — Capacitor Android wrapper
- `data/` — NASA PSI seed data and provenance documentation
- `docs/` — demonstration and research notes
- `.github/workflows/` — Android debug-build workflow

## NASA sources

Primary investigation records and persistent identifiers are documented in [data/NASA_SOURCES.md](data/NASA_SOURCES.md) and [data/PROMETHEUS_NASA_CITATIONS.md](data/PROMETHEUS_NASA_CITATIONS.md).

NASA PSI requires users to cite publicly available NASA-funded data collections using their persistent identifiers. PROMETHEUS retains those identifiers with the seed records.

## Build

Requires Node.js 20+, Android Studio/Android SDK, and a Java 21 environment.

```bash
npm ci
npx cap sync android
cd android
./gradlew assembleDebug
```

A GitHub Actions workflow builds a debug APK on pushes to `main`.

## Scientific scope

PROMETHEUS is a prototype and does not certify spacecraft fire safety, predict mission outcomes, or replace experimental validation. Its purpose is to make heterogeneous combustion evidence easier to inspect, compare, and reason about while preserving provenance and uncertainty.
