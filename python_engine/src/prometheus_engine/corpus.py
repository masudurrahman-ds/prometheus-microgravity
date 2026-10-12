"""Deterministic, provenance-preserving access to the indexed NASA corpus."""
from __future__ import annotations

import json
import os
import re
from functools import lru_cache
from pathlib import Path
from typing import Any

STOP_WORDS = {
    "a", "an", "and", "are", "as", "at", "be", "by", "does", "for",
    "from", "how", "in", "into", "is", "it", "of", "on", "or", "that",
    "the", "this", "to", "was", "what", "when", "where", "which", "why", "with",
}


def _default_corpus_path() -> Path:
    configured = os.getenv("PROMETHEUS_CORPUS_PATH")
    if configured:
        return Path(configured).expanduser().resolve()
    # .../repo/python_engine/src/prometheus_engine/corpus.py -> .../repo/data/...
    return Path(__file__).resolve().parents[3] / "data" / "prometheus_nasa_psi.json"


@lru_cache(maxsize=2)
def load_corpus(path_string: str | None = None) -> dict[str, Any]:
    path = Path(path_string).resolve() if path_string else _default_corpus_path()
    with path.open("r", encoding="utf-8") as handle:
        payload = json.load(handle)
    if not isinstance(payload.get("experiments"), list) or not isinstance(payload.get("sources"), list):
        raise ValueError("NASA corpus must contain 'experiments' and 'sources' arrays.")
    return payload


def _tokens(value: Any) -> set[str]:
    text = str(value or "").lower().replace("_", " ").replace("-", " ")
    return {
        token for token in re.findall(r"[a-z0-9]+", text)
        if len(token) > 1 and token not in STOP_WORDS
    }


def _source_map(corpus: dict[str, Any]) -> dict[str, dict[str, Any]]:
    return {str(source.get("source_id")): source for source in corpus["sources"]}


def _source_view(source: dict[str, Any] | None) -> dict[str, Any] | None:
    if not source:
        return None
    return {
        "source_id": source.get("source_id"),
        "title": source.get("title"),
        "citation": source.get("citation"),
        "doi": source.get("doi"),
        "url": source.get("url"),
        "license": source.get("license"),
        "metadata_only": source.get("metadata_only") is True,
    }


def classify_record(experiment: dict[str, Any], sources: dict[str, dict[str, Any]]) -> dict[str, str]:
    """Classify record availability without overclaiming instrument-level observation."""
    linked = [sources[sid] for sid in experiment.get("source_ids", []) if sid in sources]
    has_measurement = any(
        isinstance(obs, dict)
        and isinstance(obs.get("measurement"), dict)
        and obs["measurement"].get("value") not in (None, "")
        for obs in experiment.get("observations", [])
    )
    if has_measurement:
        return {
            "record_class": "reported_measurements",
            "evidence_state": "NASA_REPORTED",
            "evidence_note": (
                "The indexed record contains source-attributed reported measurements; "
                "this does not independently verify raw instrument-level observations."
            ),
        }
    if linked and all(source.get("metadata_only") is True for source in linked):
        return {
            "record_class": "metadata_only",
            "evidence_state": "UNKNOWN",
            "evidence_note": "Catalogue metadata is not a measured experimental outcome.",
        }
    return {
        "record_class": "documented_configuration",
        "evidence_state": "UNKNOWN",
        "evidence_note": "No indexed numeric outcome measurement is available for this record.",
    }


def _search_text(experiment: dict[str, Any], sources: dict[str, dict[str, Any]]) -> str:
    source_titles = [
        sources[sid].get("title", "")
        for sid in experiment.get("source_ids", [])
        if sid in sources
    ]
    observations = []
    for obs in experiment.get("observations", []):
        observations.extend([
            obs.get("phenomenon", ""),
            obs.get("description", ""),
            obs.get("locator", ""),
        ])
        measurement = obs.get("measurement") or {}
        observations.extend([measurement.get("value", ""), measurement.get("unit", "")])
    conditions = []
    for name, condition in (experiment.get("conditions") or {}).items():
        conditions.extend([name, condition.get("value", ""), condition.get("unit", ""), condition.get("locator", "")])
    return " ".join(str(value) for value in [
        experiment.get("exp_id", ""), experiment.get("title", ""),
        experiment.get("fuel", ""), experiment.get("platform", ""),
        experiment.get("text", ""), *observations, *conditions, *source_titles,
    ] if value is not None)


def search_evidence(query: str, limit: int = 10, corpus: dict[str, Any] | None = None) -> dict[str, Any]:
    if not query.strip():
        raise ValueError("A non-empty query is required.")
    if limit < 1 or limit > 50:
        raise ValueError("limit must be between 1 and 50.")
    corpus = corpus or load_corpus()
    sources = _source_map(corpus)
    query_tokens = _tokens(query)
    if not query_tokens:
        query_tokens = {query.strip().lower()}
    ranked = []
    for experiment in corpus["experiments"]:
        searchable = _search_text(experiment, sources)
        terms = _tokens(searchable)
        score = sum(1 for term in query_tokens if term in terms)
        title_tokens = _tokens(experiment.get("title", ""))
        score += 3 * sum(1 for term in query_tokens if term in title_tokens)
        if score:
            ranked.append((score, str(experiment.get("exp_id", "")), experiment))
    ranked.sort(key=lambda row: (-row[0], row[1]))
    results = []
    for score, _, experiment in ranked[:limit]:
        linked_sources = [
            _source_view(sources.get(source_id))
            for source_id in experiment.get("source_ids", [])
        ]
        results.append({
            "relevance_score": score,
            "experiment_id": experiment.get("exp_id"),
            "title": experiment.get("title"),
            "fuel": experiment.get("fuel"),
            "platform": experiment.get("platform"),
            **classify_record(experiment, sources),
            "conditions": experiment.get("conditions", {}),
            "observations": experiment.get("observations", []),
            "sources": [source for source in linked_sources if source],
        })
    return {
        "dataset_id": corpus.get("dataset_id"),
        "dataset_title": corpus.get("title"),
        "indexed_experiment_count": len(corpus["experiments"]),
        "coverage_note": "Search covers the currently indexed corpus only, not the full NASA PSI archive.",
        "query": query,
        "results": results,
    }


def get_study(experiment_id: str, corpus: dict[str, Any] | None = None) -> dict[str, Any] | None:
    corpus = corpus or load_corpus()
    sources = _source_map(corpus)
    for experiment in corpus["experiments"]:
        if experiment.get("exp_id") == experiment_id:
            linked = [_source_view(sources.get(sid)) for sid in experiment.get("source_ids", [])]
            return {
                **experiment,
                **classify_record(experiment, sources),
                "sources": [source for source in linked if source],
            }
    return None


def dashboard_summary(corpus: dict[str, Any] | None = None) -> dict[str, Any]:
    corpus = corpus or load_corpus()
    sources = _source_map(corpus)
    experiments = corpus["experiments"]
    classes = [classify_record(experiment, sources)["record_class"] for experiment in experiments]
    fuels = sorted({str(e.get("fuel")) for e in experiments if e.get("fuel")})
    platforms = sorted({str(e.get("platform")) for e in experiments if e.get("platform")})
    return {
        "dataset_id": corpus.get("dataset_id"),
        "dataset_title": corpus.get("title"),
        "indexed_experiment_count": len(experiments),
        "indexed_source_count": len(corpus["sources"]),
        "record_classes": {name: classes.count(name) for name in sorted(set(classes))},
        "fuels": fuels,
        "platforms": platforms,
        "coverage_note": (
            "Counts describe the locally indexed corpus only. A catalogue entry is not proof "
            "that the underlying raw dataset is ingested."
        ),
    }
