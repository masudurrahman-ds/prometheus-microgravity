# PROMETHEUS PyTorch research pipeline

This pipeline trains an **exploratory, unsupervised reconstruction baseline** over provenance-qualified NASA PSI experimental-table records. It does not predict ignition, extinction, flame spread, spacecraft fire risk, or any operational safety outcome. There are no defensible target labels for those tasks in this corpus.

## Run

```bash
python -m venv .venv
. .venv/bin/activate  # Windows: .venv\\Scripts\\activate
pip install -r ml/requirements.txt
python ml/train.py --data data/prometheus_nasa_psi.json --extra-dir www/data/psi_records --output ml/artifacts
```

The expanded corpus contains 892 indexed experiment/table-row records across 27 registered source records: the original 17-record seed plus 875 rows from NASA PSI investigations PSI-69, PSI-99, PSI-100, PSI-101, PSI-102 and PSI-107. Raw source CSVs and their retrieval-mirror provenance are preserved under `data/raw/psi/`; normalized local app records are in `www/data/psi_records/`.

Training requires at least 60 usable records and 5 independent source groups. The split groups every record from the same PSI investigation together, fits normalization on training groups only, and evaluates masked reconstruction error on held-out investigations. Missing values are masked, never converted to zero. The pipeline excludes proxy, midpoint and approximate canonical values from model inputs. The current dataset should pass the sufficiency gate, but actual training and held-out metrics must still be verified by the training workflow.

The output model is a compact autoencoder for exploratory feature reconstruction only. Reconstruction error is not an anomaly diagnosis or hazard score. No labels, synthetic targets, or invented observations are used. The training workflow must not be described as an operational fire-risk predictor.

## Model inputs

- NASA-reported oxygen fraction
- NASA-reported air-flow velocity, normalized to mm/s
- NASA-reported ambient pressure, normalized to kPa where explicitly convertible
- NASA-reported initial droplet diameter in mm
- NASA-reported burn duration in seconds

Each included numeric value must retain a source ID and table-row locator. PSI-101 test/aging durations are not relabeled as burn durations; PSI-107 ignition and flame-off strings are not converted into elapsed time. Cross-investigation features are exploratory and do not establish causal relationships.

## Outputs

- `training_status.json`: sufficiency-gate result, record counts, source-group counts and limitations.
- `model.pt`: created only after all sufficiency gates pass.
- `evaluation.json`: held-out reconstruction metrics and exact feature definitions.
