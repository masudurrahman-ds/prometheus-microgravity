# PROMETHEUS — NASA PSI Data & Citation Manifest

PROMETHEUS uses NASA Physical Sciences Informatics (PSI) as its primary combustion-data source.

## Row-level measurements

The seed package contains the two records shown in NASA PSI's **SAFFIRE-I Experimental Table**:

- PSI-98 / S1 — SIBAL Fabric, concurrent flow, 20 cm/s, 21.5–21.7% O2, 182 W ignition, 8 s ignition, 420 s burn.
- PSI-98 / S2 — SIBAL Fabric, opposed flow, 20 cm/s, approximately 21.5% O2, 182 W ignition, 8 s ignition, 70 s burn.

Persistent identifier: DOI `10.60555/0t15-1z43`  
NASA PSI: https://psi.nasa.gov/physci/repo/data/investigations/PSI-98  
License shown by NASA PSI: CC0-1.0

## Context investigations

- PSI-25 BASS-II — DOI `10.60555/4qc4-de67`
- PSI-69 FLEX — DOI `10.60555/mbq8-0451`
- PSI-107 SPICE — DOI `10.60555/9kbh-e962`

These context records are **metadata only** in this seed package. They are not represented as row-level measurements.

## Evidence labels

Use:
- `Observed` = directly represented NASA PSI measurement
- `NASA metadata` = investigation-page fact
- `Derived` = calculated by PROMETHEUS
- `Proxy` = visualization-only value, not a NASA measurement
- `Unknown` = not reported / not inferable

Never label a proxy or derived value as NASA-observed data.

NASA PSI requires users to cite publicly available NASA-funded data collections using their persistent identifiers. Retain the investigation DOI and source URL with every exported record.