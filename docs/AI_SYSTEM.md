# PROMETHEUS Scientific AI System

## Objective

Build an agentic scientific assistant that can retrieve NASA evidence, select appropriate analytical tools, reason over structured observations and documents, validate its own claims, and return traceable citations.

## Agent loop

`question → intent → plan → retrieve → analyze → reason → critique → cite → answer`

### Tool categories

- NASA/source retrieval
- experiment lookup and comparison
- unit conversion and normalization
- statistical analysis
- correlation and permutation testing
- clustering and similarity
- anomaly and contradiction analysis
- evidence-gap analysis
- knowledge-graph traversal
- document/image evidence inspection
- citation/provenance lookup

## Hallucination controls

The agent must:

- refuse unsupported numerical claims;
- distinguish observations from inference;
- report sample size and missingness;
- block causal language when the design cannot support causality;
- block extrapolation from untested conditions;
- attach primary-source citations to factual scientific claims;
- explicitly state when evidence is insufficient.

## LLM policy

A production LLM must be connected through a secure backend. The repository must never contain provider API keys, personal tokens, or private credentials.
