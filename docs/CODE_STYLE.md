# PROMETHEUS Code Style Guide

This guide keeps the repository approachable for contributors who are learning,
reviewing, or maintaining the app. Formatting changes must not change behavior.

## Python — PEP 8

- Use four spaces for indentation and `snake_case` for functions and variables.
- Use `PascalCase` for classes and `UPPER_SNAKE_CASE` for constants.
- Group standard-library, third-party, and local imports separately.
- Prefer short, focused functions, explicit names, type hints where useful, and
  docstrings for public modules and functions.
- Keep scientific assumptions, units, evidence states, and provenance explicit.
- Use Ruff to format Python consistently and check style.

## JavaScript, HTML, CSS, JSON, and YAML

- Use Prettier with the repository configuration in `.prettierrc.json`.
- Prefer descriptive `camelCase` names for JavaScript functions and variables.
- Keep modules focused; avoid unrelated refactors during formatting-only work.
- Preserve existing public request/response contracts and browser compatibility.

## Java / Android

- Use Google Java Format for Java source files.
- Do not change Android package names, manifest permissions, exported component
  settings, lifecycle behavior, or Capacitor integration as part of formatting.

## Scientific and safety requirements

- Never re-label evidence, infer missing measurements, or alter numerical
  calculations in a formatting-only change.
- Keep `NASA_OBSERVED`, `NASA_REPORTED`, `DERIVED`, `MODEL_INFERRED`,
  `ANALOGICAL`, and `UNKNOWN` distinctions intact.
- Preserve units, source identifiers, citations, proxy warnings, and limitations.
- Do not connect independent experiments as a trend merely to make a chart look
  smoother. Formatting is not permission to change scientific behavior.

## Review and validation

- Keep formatting changes isolated from functional changes where possible.
- Run the repository's web/data validation, agent tests, server tests, Python
  tests, and Android debug build before merging.
- A passing build does not replace physical-device layout and interaction checks.
- Never commit credentials, signing keys, `.env` files, or private user data.
