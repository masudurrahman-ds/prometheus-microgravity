# PROMETHEUS

**Scientific intelligence for microgravity combustion and spacecraft fire safety.**

PROMETHEUS is a research-oriented NASA Space Apps Challenge 2026 project by **The Crown Council**. The system is being developed as an evidence-grounded scientific agent: NASA evidence is retrieved and structured, deterministic analysis tools are invoked, an LLM can reason over the evidence, and a validation layer checks claims, uncertainty, causality, and citations before an answer is presented.

## Core principle

> **PROMETHEUS does not ask users to trust the AI. It shows them why the AI reached its conclusion.**

NASA is the source of the scientific evidence. PROMETHEUS is the computational analysis and interface layer. PROMETHEUS does not imply NASA endorsement.

## Evidence discipline

Every scientific claim is assigned an evidence state:

- **NASA OBSERVED** — directly represented measurement/observation
- **NASA REPORTED** — explicitly reported NASA statement or metadata
- **DERIVED** — reproducible calculation from sourced values
- **MODEL-INFERRED** — model/analysis interpretation
- **ANALOGICAL** — reasoning transferred from related evidence
- **UNKNOWN** — unsupported or unreported

The system must never present derived, inferred, analogical, proxy, or synthetic values as NASA observations.

## Repository structure

```
prometheus-microgravity/
├── android/                 # Capacitor Android application
├── ios/                     # iOS integration
├── www/                     # PROMETHEUS application UI
├── ai/                      # scientific agent, retrieval, tools, validators
├── ingestion/               # NASA/source ingestion and normalization
├── analysis/                # deterministic scientific analysis
├── data/
│   ├── schema/              # versioned evidence schemas
│   ├── provenance/          # source-to-record mappings
│   └── manifests/           # versioned dataset manifests
├── docs/                    # architecture, AI, science, privacy and security
├── tests/                   # scientific, AI, provenance and privacy tests
├── scripts/                 # reproducibility and maintenance scripts
├── .github/workflows/       # CI/build automation
├── CITATION.cff             # software citation metadata
└── NOTICE                   # ownership, NASA attribution and credits
```

## Scientific architecture

```
NASA PSI / NTRS
      ↓
Source ingestion + provenance
      ↓
Evidence graph / structured experiments
      ↓
Scientific analysis tools
      ↓
LLM Scientific Agent
      ↓
Claim + causal + uncertainty validation
      ↓
Citation / Evidence Ledger
      ↓
Auditable scientific answer
```

## Current evidence corpus

The application contains a provenance-tracked NASA PSI seed corpus and an expanded source catalogue. Investigation catalogue entries are deliberately distinguished from directly ingested measurements; listing a NASA investigation does **not** imply that all of its raw files have been reconstructed.

Primary source identifiers and citation metadata are maintained under `data/` and `docs/NASA_SOURCES.md`.

## Trust and privacy

PROMETHEUS follows data minimization:

- local conversation memory stays on-device;
- user-selected research files are processed only after selection;
- core research does not require location, contacts, microphone, camera, SMS, or call-log access;
- optional cloud AI requires explicit disclosure and affirmative acknowledgement;
- public dataset refreshes are provenance-checked;
- APK installation/update remains user-controlled.

See `docs/PRIVACY.md`, `docs/USER_AGREEMENT.md`, and `docs/AI_SAFETY.md`.

## Build

Requires Node.js, Android Studio/Android SDK, and the project Java/Gradle toolchain.

```bash
npm ci
npx cap sync android
cd android
./gradlew assembleDebug
```

GitHub Actions builds the Android debug application on pushes to `main`.

## Research limitations

PROMETHEUS is research software and does not certify spacecraft fire safety, predict mission outcomes, or replace experimental validation. The full NASA PSI corpus is larger and more heterogeneous than the currently structured evidence snapshot. Small samples, missing variables, source heterogeneity, retrieval errors, and model uncertainty are explicitly treated as limitations.

## Credits

**Software:** © 2026 The Crown Council

**Scientific data:** NASA Physical Sciences Informatics and other original NASA sources as individually cited.

NASA data and documentation remain subject to their original source attribution and applicable licenses. NASA is not an endorser of PROMETHEUS or The Crown Council.
