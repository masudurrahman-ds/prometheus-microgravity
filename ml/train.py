#!/usr/bin/env python3
"""Train a source-grouped exploratory PyTorch autoencoder on NASA PSI records.

This is not a combustion-risk predictor. It learns reconstruction of the
available numeric feature representation and reports held-out reconstruction
error only. Missing measurements are masked, not fabricated.
"""
from __future__ import annotations

import argparse
import json
import math
from pathlib import Path
from typing import Any

FEATURES = (
    "o2_fraction",
    "gravity_g",
    "flow_velocity_mm_s",
    "pressure_kpa",
    "burn_duration",
)
MIN_RECORDS = 60
MIN_SOURCE_GROUPS = 5
SEED = 42


def finite_number(value: Any) -> float | None:
    if value is None or (isinstance(value, str) and not value.strip()):
        return None
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return number if math.isfinite(number) else None


def usable_measurement(value: dict[str, Any], sources: dict[str, dict]) -> bool:
    source = sources.get(str(value.get("source_id") or ""))
    return bool(
        source
        and source.get("metadata_only") is not True
        and isinstance(value.get("locator"), str)
        and value["locator"].strip()
    )


def extract_record(record: dict[str, Any], sources: dict[str, dict]) -> dict[str, Any]:
    values: list[float | None] = []
    provenance: list[dict[str, str]] = []
    for feature in FEATURES:
        candidate = None
        if feature == "burn_duration":
            for observation in record.get("observations", []):
                text = " ".join(
                    str(observation.get(key) or "")
                    for key in ("phenomenon", "description")
                )
                measurement = observation.get("measurement") or {}
                raw = measurement.get("canonical_value", measurement.get("value"))
                if "burn" in text.lower() or "duration" in text.lower():
                    if finite_number(raw) is not None and usable_measurement(observation, sources):
                        candidate = {
                            "value": finite_number(raw),
                            "source_id": str(observation["source_id"]),
                            "locator": str(observation["locator"]),
                            "note": "",
                        }
                        break
        else:
            condition = (record.get("conditions") or {}).get(feature) or {}
            raw = condition.get("canonical_value", condition.get("value"))
            if finite_number(raw) is not None and usable_measurement(condition, sources):
                candidate = {
                    "value": finite_number(raw),
                    "source_id": str(condition["source_id"]),
                    "locator": str(condition["locator"]),
                    "note": str(condition.get("canonical_note") or ""),
                }
        values.append(candidate["value"] if candidate else None)
        provenance.append(
            {
                "source_id": candidate["source_id"],
                "locator": candidate["locator"],
                "note": candidate["note"],
            }
            if candidate
            else {}
        )
    return {
        "exp_id": str(record.get("exp_id") or ""),
        "source_group": "|".join(sorted(set(record.get("source_ids") or []))),
        "values": values,
        "provenance": provenance,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data", type=Path, default=Path("data/prometheus_nasa_psi.json"))
    parser.add_argument("--output", type=Path, default=Path("ml/artifacts"))
    args = parser.parse_args()

    corpus = json.loads(args.data.read_text(encoding="utf-8"))
    sources = {str(item["source_id"]): item for item in corpus.get("sources", [])}
    rows = [
        extract_record(record, sources)
        for record in corpus.get("experiments", [])
    ]
    usable = [row for row in rows if any(value is not None for value in row["values"])]
    groups = sorted({row["source_group"] for row in usable if row["source_group"]})
    complete_feature_count = sum(
        all(value is not None for value in row["values"]) for row in usable
    )

    args.output.mkdir(parents=True, exist_ok=True)
    status = {
        "status": "blocked_insufficient_data",
        "dataset_id": corpus.get("dataset_id"),
        "indexed_experiment_records": len(rows),
        "records_with_at_least_one_provenanced_numeric_feature": len(usable),
        "records_with_all_features": complete_feature_count,
        "independent_source_groups": len(groups),
        "required_minimum_records": MIN_RECORDS,
        "required_minimum_source_groups": MIN_SOURCE_GROUPS,
        "features": list(FEATURES),
        "limitations": [
            "No supervised target labels exist for operational combustion or fire-risk prediction.",
            "The exploratory model reconstructs a feature representation only; its error is not a hazard score.",
            "Canonical midpoints and gravity proxies remain marked as derived values in the source corpus.",
            "A source-group holdout is required to reduce leakage between records from the same investigation.",
        ],
    }
    if len(usable) < MIN_RECORDS or len(groups) < MIN_SOURCE_GROUPS:
        status["reason"] = (
            "Training withheld: the indexed corpus does not meet the minimum "
            "record-count and independent-source-group requirements."
        )
        (args.output / "training_status.json").write_text(
            json.dumps(status, indent=2), encoding="utf-8"
        )
        print(json.dumps(status, indent=2))
        return 0

    # Import torch only after the scientific sufficiency gate passes.
    import numpy as np
    import torch
    from torch import nn

    torch.manual_seed(SEED)
    np.random.seed(SEED)

    # Deterministic source-group holdout: keep all records from a source together.
    test_groups = set(groups[-max(1, math.ceil(len(groups) * 0.2)):])
    train_rows = [row for row in usable if row["source_group"] not in test_groups]
    test_rows = [row for row in usable if row["source_group"] in test_groups]
    train_groups = {row["source_group"] for row in train_rows}
    if len(train_rows) < 30 or len(train_groups) < 3 or not test_rows:
        status["reason"] = "Training withheld: grouped split leaves too few independent training records or no held-out source group."
        status["status"] = "blocked_grouped_split"
        (args.output / "training_status.json").write_text(json.dumps(status, indent=2), encoding="utf-8")
        print(json.dumps(status, indent=2))
        return 0

    train_values = np.array([[np.nan if v is None else v for v in row["values"]] for row in train_rows], dtype=np.float32)
    test_values = np.array([[np.nan if v is None else v for v in row["values"]] for row in test_rows], dtype=np.float32)
    medians = np.nanmedian(train_values, axis=0)
    medians = np.where(np.isfinite(medians), medians, 0.0)
    train_mask = np.isfinite(train_values).astype(np.float32)
    test_mask = np.isfinite(test_values).astype(np.float32)
    train_filled = np.where(np.isfinite(train_values), train_values, medians)
    test_filled = np.where(np.isfinite(test_values), test_values, medians)
    means = train_filled.mean(axis=0)
    scales = train_filled.std(axis=0)
    scales = np.where(scales > 1e-8, scales, 1.0)
    train_x = np.concatenate(((train_filled - means) / scales, train_mask), axis=1).astype(np.float32)
    test_x = np.concatenate(((test_filled - means) / scales, test_mask), axis=1).astype(np.float32)
    train_target = torch.tensor(((train_filled - means) / scales), dtype=torch.float32)
    train_observed = torch.tensor(train_mask, dtype=torch.float32)
    test_target = torch.tensor(((test_filled - means) / scales), dtype=torch.float32)
    test_observed = torch.tensor(test_mask, dtype=torch.float32)
    train_input = torch.tensor(train_x, dtype=torch.float32)
    test_input = torch.tensor(test_x, dtype=torch.float32)

    model = nn.Sequential(
        nn.Linear(len(FEATURES) * 2, 16),
        nn.ReLU(),
        nn.Linear(16, 8),
        nn.ReLU(),
        nn.Linear(8, len(FEATURES)),
    )
    optimizer = torch.optim.Adam(model.parameters(), lr=0.003, weight_decay=1e-4)
    for _ in range(250):
        model.train()
        optimizer.zero_grad()
        prediction = model(train_input)
        squared = (prediction - train_target).pow(2) * train_observed
        loss = squared.sum() / train_observed.sum().clamp_min(1.0)
        loss.backward()
        optimizer.step()

    model.eval()
    with torch.no_grad():
        prediction = model(test_input)
        squared = (prediction - test_target).pow(2) * test_observed
        observed_count = float(test_observed.sum().item())
        rmse = math.sqrt(float(squared.sum().item()) / max(observed_count, 1.0))

    torch.save(
        {
            "state_dict": model.state_dict(),
            "features": list(FEATURES),
            "medians": medians.tolist(),
            "means": means.tolist(),
            "scales": scales.tolist(),
            "dataset_id": corpus.get("dataset_id"),
            "model_purpose": "exploratory_feature_reconstruction_only",
            "seed": SEED,
        },
        args.output / "model.pt",
    )
    evaluation = {
        "status": "trained_exploratory_baseline",
        "dataset_id": corpus.get("dataset_id"),
        "train_records": len(train_rows),
        "test_records": len(test_rows),
        "train_source_groups": sorted(train_groups),
        "held_out_source_groups": sorted(test_groups),
        "held_out_masked_reconstruction_rmse": rmse,
        "observed_test_feature_values": int(observed_count),
        "feature_names": list(FEATURES),
        "interpretation": "Reconstruction error only; not a prediction, anomaly diagnosis, or fire-risk score.",
    }
    (args.output / "evaluation.json").write_text(json.dumps(evaluation, indent=2), encoding="utf-8")
    status.update({"status": "trained_exploratory_baseline", "reason": "All record-count and grouped-split gates passed."})
    (args.output / "training_status.json").write_text(json.dumps(status, indent=2), encoding="utf-8")
    print(json.dumps(evaluation, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
