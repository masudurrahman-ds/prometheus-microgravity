# Data Provenance

Every imported scientific record should preserve:

- source identifier;
- investigation identifier;
- source URL;
- DOI/persistent identifier when available;
- source version/date when available;
- license;
- extraction method;
- locator (table, row, page, figure, file, or section);
- evidence state;
- transformation/calculation history;
- ingestion timestamp;
- dataset version.

## Provenance chain

`NASA source → extracted record → normalized record → analysis → claim → citation`

A user should be able to move backwards from an AI claim to the exact source record used to support it.

NASA PSI investigation pages expose persistent identifiers, versions, files, and publications; PROMETHEUS should preserve those identifiers instead of reducing provenance to a generic “NASA” label.
