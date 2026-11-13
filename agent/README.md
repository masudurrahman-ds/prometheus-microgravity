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
- `ALLOWED_ORIGIN=https://your-app.example` (required for browser-based cross-origin clients; no wildcard origin is enabled by default)
- `REQUEST_TIMEOUT_MS=45000` (upstream inference timeout, bounded to 5–120 seconds)
- `TRUST_PROXY=true` only when the service is behind a trusted proxy that overwrites `X-Forwarded-For`

Integer settings are validated at startup: invalid values fall back to defaults, and out-of-range values are clamped. Tool rounds are limited to 1–8, request bodies to 1 KiB–1 MiB, rate limits to 1–120 requests per minute, and the port to 1–65535.

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

The server refuses cloud inference without explicit consent and never receives an API key from the client. Requests are bounded by message/history limits, tool arguments are validated again before execution, upstream inference calls time out, and proxy headers are ignored unless `TRUST_PROXY=true`. Configure a specific `ALLOWED_ORIGIN` for browser clients; do not use a wildcard in production.

## Scientific boundary

The agent can retrieve indexed NASA experiments and source metadata, compare records, calculate deterministic descriptive summaries, and return chart-ready data for measurement coverage and experiment comparisons. It must label derived/inferred claims and must not fabricate missing measurements or turn pairwise differences into causal proof. The analysis tool reports the exact seed-corpus records used and flags canonical values marked as midpoints or proxies.

The app can operate in local NASA-evidence mode when cloud AI is disabled.

## Deploy the cloud agent

A Render Blueprint is provided at the repository root in `render.yaml`.

1. In Render, choose **New → Blueprint** and connect this repository.
2. Set `OPENAI_API_KEY` and `PROMETHEUS_MODEL` as secret/environment values for the service. Never put the API key in the Android app or Git repository.
3. Deploy and wait for the `/health` check to pass.
4. Copy the service URL and append `/v1/agent`, for example `https://YOUR-SERVICE.onrender.com/v1/agent`.
5. In PROMETHEUS AI, choose **Enable Cloud AI**, paste that complete endpoint, and explicitly consent. Cloud mode will not work until the service is deployed and valid API credentials/model configuration are supplied.

The `/health` endpoint confirms service availability and whether credentials are configured; it does not expose secrets. The mobile client can still use its local evidence engine if cloud AI is unavailable.

## Tool-backed analysis

The model has server-side tools for evidence retrieval, exact experiment lookup, two-experiment comparison, source lookup, and deterministic dataset analysis. Dataset analysis currently supports `coverage`, `distribution`, and `compare` for `burn_duration`, `o2_fraction`, `gravity_g`, `flow_velocity_mm_s`, and `pressure_kpa`. Chart-ready outputs are returned with provenance; unsupported variables are rejected.
