"""Versioned HTTP API for the PROMETHEUS scientific research engine."""
from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field

from .corpus import dashboard_summary, get_study, search_evidence

app = FastAPI(
    title="PROMETHEUS Research API",
    version="0.1.0",
    description=(
        "Source-grounded access to the indexed NASA combustion corpus. "
        "This API does not certify spacecraft fire safety."
    ),
)


class SearchResponse(BaseModel):
    dataset_id: str | None
    dataset_title: str | None
    indexed_experiment_count: int
    coverage_note: str
    query: str
    results: list[dict]


class SearchRequest(BaseModel):
    query: str = Field(min_length=1, max_length=500)
    limit: int = Field(default=10, ge=1, le=50)


@app.get("/health")
def health() -> dict:
    return {"ok": True, "service": "prometheus-python-research-engine", "version": "0.1.0"}


@app.get("/v1/research/dashboard/summary")
def summary() -> dict:
    try:
        return dashboard_summary()
    except (OSError, ValueError) as exc:
        raise HTTPException(status_code=503, detail="Research corpus is unavailable.") from exc


@app.get("/v1/research/search", response_model=SearchResponse)
def search(
    q: str = Query(min_length=1, max_length=500),
    limit: int = Query(default=10, ge=1, le=50),
) -> dict:
    try:
        return search_evidence(q, limit)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except (OSError, ValueError) as exc:
        raise HTTPException(status_code=503, detail="Research corpus is unavailable.") from exc


@app.get("/v1/research/studies/{experiment_id}")
def study(experiment_id: str) -> dict:
    result = get_study(experiment_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Study not found in the indexed corpus.")
    return result
