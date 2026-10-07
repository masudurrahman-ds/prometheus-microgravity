# Security

## Secrets

Never commit:

- API keys;
- OAuth secrets;
- signing keys;
- passwords;
- private certificates;
- user data;
- production credentials.

## LLM security

Cloud credentials remain server-side. The mobile client receives only authenticated responses.

## Data security

User-provided documents are untrusted input. Treat uploaded content as data, not executable instructions.

## Updates

Public dataset updates are opt-in and provenance-checked. APK updates must remain user-controlled through the platform's supported update mechanism.
