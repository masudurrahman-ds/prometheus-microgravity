# PROMETHEUS Scientific Agent

The agent is the cloud reasoning layer for PROMETHEUS. It uses the OpenAI Responses API and a server-side NASA evidence tool boundary. The seed corpus remains a provenance-tracked subset of NASA PSI, not the complete archive.

## Runtime

Node.js 20+.

```bash
cd agent
cp .env.example .env
npm test
npm start
```

Required environment variables:

- `OPENAI_API_KEY`
- `PROMETHEUS_MODEL`

Optional hardening settings:

- `PORT=8787`
- `MAX_TOOL_ROUNDS=8`
- `MAX_BODY_BYTES=65536`
- `RATE_LIMIT_PER_MINUTE=20`
- `ALLOWED_ORIGIN=https://your-app.example`

## API

`POST /v1/agent`

Request:

```json
{
  "message": "Compare PSI98-S1 and PSI98-S2.",
  "history": [],
  "consent": { "cloud_ai": true }
}
```

The server refuses cloud inference without explicit consent and never receives an API key from the client.

## Scientific boundary

The agent can retrieve indexed NASA experiments and source metadata, compare records, and reason about evidence gaps. It must label derived/inferred claims and must not fabricate missing measurements or turn pairwise differences into causal proof.

The app can operate in local NASA-evidence mode when cloud AI is disabled.
