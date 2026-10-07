# Limitations

PROMETHEUS is a research prototype.

The full NASA PSI corpus is much larger than the structured records currently embedded in the application. A source catalog entry does not imply that every underlying raw file has been ingested.

Important limitations include:

- heterogeneous NASA source formats;
- incomplete variable coverage;
- small sample sizes;
- observational rather than causal evidence;
- uncertainty in model-derived results;
- incomplete multimodal ingestion;
- potential LLM retrieval/reasoning errors.

The application must prefer an explicit “insufficient evidence” response over an unsupported scientific claim.
