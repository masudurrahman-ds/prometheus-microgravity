# PROMETHEUS Signature Coding Standard

This is the project's human-readable coding standard. It combines the user's
formal, educational Python style with language-appropriate conventions for the
existing multi-language app. Code should explain its purpose and preserve
scientific integrity without becoming verbose for its own sake.

## 1. Core principles

- Prefer readability over cleverness.
- Use descriptive names that explain domain meaning.
- Keep each function focused on one responsibility.
- Make inputs, outputs, assumptions, units, and failure modes explicit.
- Return values from reusable functions; keep printing and UI output at the
  application boundary.
- Avoid mutable global state and hidden side effects where practical.
- Comments explain why a decision exists, not what obvious syntax does.
- Do not change behavior, public interfaces, evidence labels, permissions, or
  scientific calculations merely to satisfy a formatter.

## Signature header for learning scripts

For standalone Python learning exercises, use the author's exact heading style
and separator pattern:

```python
# Author: Masudur Rahman
# Day 02 - Area of Rectangle Program

print("=" * 40)
print("Data Science Journey")
print("=" * 40)
```

- Keep the author line and day/title at the top of each learning exercise.
- Use the same separator width and journey label consistently.
- Follow the heading with readable, fully explained code and expected output.
- Use the day/title header for lessons and exercises, not every production
  module; production files should use an accurate module docstring instead.
- Preserve the same readable spirit in JavaScript, Kotlin, Java, and other
  languages while using their normal comment and naming conventions.

## 2. Python — PEP 8 plus the signature standard

- Use four spaces, imports grouped as standard library, third-party, then local.
- Use `snake_case` for functions and variables, `PascalCase` for classes, and
  `UPPER_SNAKE_CASE` for constants.
- Keep source lines to 79 characters where practical; wrap expressions using
  parentheses rather than backslashes.
- Add type hints to function parameters and return values. Use `Final` for
  constants that should not be reassigned.
- Give every public module, class, and function a useful NumPy-style docstring.
- Validate inputs at system boundaries and raise specific, meaningful
  exceptions. Do not swallow exceptions without a clear recovery strategy.
- Prefer a small pure calculation function over a large function that mixes
  retrieval, calculation, rendering, and logging.
- Name scientific quantities by meaning and include units in names or typed
  metadata when ambiguity is possible. Do not use unexplained numeric literals.
- Comments should explain scientific assumptions, equations, edge cases, and
  evidence limitations. Do not add comments that merely repeat the code.
- Keep logging, console output, and UI rendering outside reusable core logic.

### Preferred function pattern

```python
from typing import Final

MAX_SEARCH_RESULTS: Final[int] = 20


def calculate_mean(values: list[float]) -> float:
    """Calculate the arithmetic mean of numeric values.

    Parameters
    ----------
    values : list[float]
        Non-empty sequence of numeric observations.

    Returns
    -------
    float
        Arithmetic mean of the supplied observations.

    Raises
    ------
    ValueError
        If no observations are provided.
    """
    if not values:
        raise ValueError("At least one observation is required.")

    return sum(values) / len(values)


def main() -> None:
    """Run a small example of the calculation."""
    observations = [2.0, 4.0, 6.0]
    mean_value = calculate_mean(observations)
    print(f"Mean value: {mean_value:.2f}")


if __name__ == "__main__":
    main()
```

Expected output:

```text
Mean value: 4.00
```

This is an illustrative example, not a requirement to create a `main()`
function in every module. Library code should expose reusable functions and
avoid running examples at import time.

## 3. Python teaching and scientific documentation

For tutorials, notebooks, research examples, and the educational parts of the
documentation, use this order where applicable:

1. **Purpose** — what the example solves.
2. **Mathematical Background** — equations, definitions, assumptions, and units.
3. **Python Implementation** — the readable, reusable implementation.
4. **Expected Output** — a representative output or validation result.

Do not force this four-part structure into every production source file.
Production code should use focused module/function docstrings and concise
scientific comments instead.

## 4. JavaScript, HTML, CSS, JSON, YAML, and configuration

- Use Prettier with `.prettierrc.json` for supported files.
- Use `camelCase` for JavaScript variables and functions, and descriptive
  names rather than single-letter identifiers except for clear local math.
- Keep API field names, event names, local-storage keys, DOM selectors, and
  serialized data contracts unchanged unless a separately tested migration is
  explicitly intended.
- Split modules only when call sites and loading order are understood.
- Avoid adding dependencies for formatting alone when an existing tool suffices.

## 5. Java and Android

- Use Google Java Format for Java source.
- Follow existing Android and Gradle conventions for Kotlin, XML, and build
  scripts; do not apply Python naming conventions to other languages.
- Never change package names, manifest permissions, exported component settings,
  lifecycle behavior, signing configuration, or Capacitor integration as part
  of a formatting-only change.

## 6. Scientific integrity

- Preserve `NASA_OBSERVED`, `NASA_REPORTED`, `DERIVED`,
  `MODEL_INFERRED`, `ANALOGICAL`, and `UNKNOWN` distinctions.
- Preserve source IDs, citations, units, proxy warnings, uncertainty, and
  coverage limitations.
- Never turn missing data into a numeric zero or a guessed measurement.
- Do not connect independent experiment records as a time series by default.
- Label similarity visualizations as similarity navigation, not a physical flame
  trajectory, unless a validated physics model supports that claim.
- Keep AI-generated hypotheses separate from sourced facts and derived results.

## 7. Safe refactoring and validation

- Make the migration in small, reviewable groups; avoid a single opaque rewrite.
- First format code, then add types/docstrings and improve names in separate,
  tested changes. Do not mix logic changes into formatting-only commits.
- Test each layer: data/schema validation, agent and server tests, Python tests,
  web validation, Android debug build, then manual device checks.
- Review large diffs for changed strings, constants, API contracts, query logic,
  calculations, permissions, and source citations.
- A passing CI run is not proof of correct physical-device behavior.
- Never commit API keys, signing keys, `.env` files, or private user data.
