# PROMETHEUS Python Research Engine

This package is an additive first step toward a shared Python scientific backend. It does **not** replace the existing Capacitor UI or current agent yet.

## Goals

- Expose a small, versioned API usable by Android, web, iOS, macOS and Windows clients.
- Search the canonical indexed NASA PSI seed corpus while preserving source IDs and evidence limitations.
- Explicitly distinguish indexed measurements from metadata-only investigation records.
- Provide dashboard summaries derived from the currently loaded corpus.
- Keep AI orchestration separate from deterministic retrieval and scientific computation.

## Run locally

From this directory:

```bash
python -m venv .venv
# Activate the environment, then:
pip install -e ".[test]"
uvicorn prometheus_engine.api:app --reload --port 8000
pytest
```

By default, the service reads `../data/prometheus_nasa_psi.json` relative to the repository root. Set `PROMETHEUS_CORPUS_PATH` to override it.

## Initial endpoints

- `GET /health`
- `GET /v1/research/dashboard/summary`
- `GET /v1/research/search?q=flame%20extinction`
- `GET /v1/research/studies/{experiment_id}`

## Safety and scientific integrity

This is a source-grounded research explorer, not a fire-safety certification system. A catalog entry is not proof that raw measurements are available. Numeric values with canonicalization notes must retain those notes. This first slice deliberately does not claim autonomous model training, causal discovery, or comprehensive NASA coverage.

## Deployment and privacy

Do not expose this service publicly until authentication, origin restrictions, request limits, TLS termination, secret handling and deployment-specific privacy terms are reviewed. Do not put API keys or user research uploads in the repository. The public NASA corpus is not private user data; prompts and uploaded files may be.
