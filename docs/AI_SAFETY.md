# AI Safety and Reliability

PROMETHEUS uses layered controls rather than trusting a single model.

### Required controls

- source allowlist;
- retrieval-first planning;
- deterministic calculation tools;
- claim/evidence matching;
- citation validation;
- uncertainty reporting;
- causal inference gates;
- unsupported-claim abstention;
- prompt-injection isolation for retrieved documents;
- audit trail for tool calls and evidence IDs.

### Prompt injection

Retrieved documents are untrusted scientific content. Instructions found inside a document must never override system policies, evidence rules, privacy controls, or tool permissions.
