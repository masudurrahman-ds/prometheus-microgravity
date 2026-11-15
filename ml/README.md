# PROMETHEUS PyTorch research pipeline

This pipeline is an **exploratory, unsupervised reconstruction baseline** for the provenance-tracked NASA PSI seed corpus. It does not predict ignition, extinction, flame spread, spacecraft fire risk, or any operational safety outcome. There are no defensible target labels for those tasks in the current indexed corpus.

## Run

```bash
python -m venv .venv
. .venv/bin/activate  # Windows: .venv\\Scripts\\activate
pip install -r ml/requirements.txt
python ml/train.py --data data/prometheus_nasa_psi.json --output ml/artifacts
```

The script only trains when there are at least 60 usable experiment records spanning at least 5 independent source groups. It groups the holdout by source to reduce source leakage, fits normalization on training groups only, and evaluates masked reconstruction error on held-out groups. Missing values are masked, never converted to zero. The current 17-record seed corpus is expected to fail the sufficiency gate and produce a machine-readable `training_status.json` explaining why; that is intentional and scientifically preferable to reporting a meaningless model.

The output model is a compact autoencoder for exploratory representation/reconstruction only. Reconstruction error is not an anomaly diagnosis or hazard score. No labels, synthetic targets, or invented observations are used.

## Outputs

- `training_status.json`: gate result, sample counts, source-group counts, and limitations.
- `model.pt`: only created after all sufficiency gates pass.
- `evaluation.json`: held-out reconstruction metrics and exact feature definitions.

All numeric features must retain a source ID and locator and must come from a non-metadata-only source. Canonical plotting proxies/midpoints remain explicitly marked in the feature metadata; they are not promoted to direct observations.
