# Code Style and Formatting Standards

This document defines consistent, maintainable coding conventions for the
PROMETHEUS multi-language codebase. Formatting changes must preserve behavior,
scientific integrity, security controls, and public interfaces.

## 1. General principles

- Prefer readability over cleverness.
- Use descriptive names that communicate domain meaning.
- Keep functions and modules focused on a clear responsibility.
- Make inputs, outputs, assumptions, units, and failure modes explicit.
- Return values from reusable functions; keep printing, logging, and UI output
  at appropriate application boundaries.
- Avoid mutable global state and hidden side effects where practical.
- Comments should explain rationale, scientific assumptions, and non-obvious
  decisions rather than restating the code.
- Do not change behavior, public interfaces, evidence labels, permissions, or
  scientific calculations merely to satisfy a formatter.

## 2. Python

Use PEP 8 and the project Ruff configuration.

- Use four spaces, with imports grouped as standard library, third-party, then
  local imports.
- Use `snake_case` for functions and variables, `PascalCase` for classes, and
  `UPPER_SNAKE_CASE` for constants.
- Keep source lines to 79 characters where practical and wrap expressions with
  parentheses.
- Add type hints to function parameters and return values.
- Use `Final` for constants that should not be reassigned.
- Give public modules, classes, and functions useful docstrings; use NumPy-style
  sections for public APIs when parameters, returns, or exceptions need detail.
- Validate inputs at system boundaries and raise specific, meaningful
  exceptions. Do not swallow exceptions without a clear recovery strategy.
- Prefer small, testable calculation functions over functions that mix
  retrieval, calculation, rendering, and logging.
- Name scientific quantities by meaning and include units in names or typed
  metadata when ambiguity is possible.
- Do not replace missing measurements with zero or guessed values.

## 3. JavaScript, HTML, CSS, JSON, YAML, and configuration

- Use Prettier with `.prettierrc.json` for supported files.
- Use `camelCase` for JavaScript variables and functions.
- Keep API field names, event names, local-storage keys, DOM selectors, and
  serialized data contracts unchanged unless a separately tested migration is
  explicitly intended.
- Split modules only when call sites and loading order are understood.
- Avoid adding dependencies for formatting alone when an existing tool suffices.

## 4. Java, Kotlin, and Android

- Use Google Java Format for Java source.
- Follow established Kotlin, XML, Gradle, and Android conventions for their
  respective files.
- Never change package names, manifest permissions, exported component
  settings, lifecycle behavior, signing configuration, or Capacitor integration
  as part of a formatting-only change.

## 5. Scientific integrity

- Preserve `NASA_OBSERVED`, `NASA_REPORTED`, `DERIVED`,
  `MODEL_INFERRED`, `ANALOGICAL`, and `UNKNOWN` distinctions.
- Preserve source IDs, citations, units, proxy warnings, uncertainty, and
  coverage limitations.
- Do not connect independent experiment records as a time series by default.
- Label similarity visualizations as similarity navigation, not a physical flame
  trajectory, unless a validated physics model supports that claim.
- Keep AI-generated hypotheses separate from sourced facts and derived results.

## 6. Refactoring and validation

- Make changes in small, reviewable groups.
- Separate formatting-only changes from logic changes, renaming, and API
  migrations.
- Test each layer: data/schema validation, agent and server tests, Python tests,
  web validation, Android debug build, then manual device checks.
- Review diffs for changed strings, constants, API contracts, query logic,
  calculations, permissions, and source citations.
- A passing CI run is not proof of correct physical-device behavior.
- Never commit API keys, signing keys, `.env` files, or private user data.
