# NASA PSI experimental-table additions

This corpus expansion adds raw experimental-table CSV exports for six NASA PSI investigations. The original CSV contents are preserved byte-for-byte as received from the public data mirror repository listed below; each source entry records its upstream Git blob SHA and path. NASA PSI landing pages are the authoritative investigation and DOI citations. Before scientific publication, verify each raw CSV byte-for-byte against a fresh direct download from the NASA PSI page.

| Investigation | NASA DOI | NASA PSI page | Indexed rows |
|---|---|---|---:|
| PSI-69 FLEX | 10.60555/mbq8-0451 | https://psi.nasa.gov/physci/repo/data/investigations/PSI-69 | 274 |
| PSI-99 SAFFIRE-II | 10.60555/2chp-m469 | https://psi.nasa.gov/physci/repo/data/investigations/PSI-99 | 15 |
| PSI-100 SAFFIRE-III | 10.60555/040q-4h36 | https://psi.nasa.gov/physci/repo/data/investigations/PSI-100 | 2 |
| PSI-101 SAME-R | 10.60555/2np7-jv14 | https://psi.nasa.gov/physci/repo/data/investigations/PSI-101 | 109 |
| PSI-102 SAME | 10.60555/gd4k-8h62 | https://psi.nasa.gov/physci/repo/data/investigations/PSI-102 | 8 |
| PSI-107 SPICE | 10.60555/9kbh-e962 | https://psi.nasa.gov/physci/repo/data/investigations/PSI-107 | 469 |

## Provenance of mirror copies

Public raw CSV table copies were retrieved from `https://github.com/Krypton-N/NASA-SPACE-APPS-8` at the paths and blob SHAs stored in the `sources[]` entries of `prometheus_nasa_psi.json`. The mirror README identifies these as NASA PSI investigation experimental tables and reports that the underlying NASA PSI dataset files are CC0. NASA PSI source records remain the primary citations; the mirror is disclosed as the retrieval path, not represented as NASA's host.

## Normalization rules

- Every normalized experiment has a stable ID, investigation source ID, source table row locator, and original row text.
- Original strings and units remain in `conditions[].value`; canonical numeric values are added only for strictly parseable values.
- Unit conversions are explicit in `canonical_note` (cm/s to mm/s; mmHg to kPa).
- Ranges, qualitative entries, blanks, dashes, and approximate values are not silently converted to exact measurements.
- PSI-101 duration is a test-duration field, not a flame-burn duration.
- PSI-107 ignition/flame-off timestamps are retained as text; elapsed times are not inferred from irregular timestamp strings.
- PSI-102 "same conditions as 1-4" entries remain missing rather than inheriting values from other rows.
- Duplicate table rows are preserved and identified by source row locator; they are not assumed to be independent physical experiments.

Mirror: `Krypton-N/NASA-SPACE-APPS-8`
