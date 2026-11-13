# PROMETHEUS web deployment

The browser application is maintained in `www/index.html`.

## Hosting

GitHub Actions publishes the contents of `www/` to GitHub Pages using
`.github/workflows/deploy-pages.yml`.

Expected public URL:
https://masudurrahman-ds.github.io/prometheus-microgravity/

The deployment workflow can also be started manually from the repository's
Actions tab using **Deploy PROMETHEUS web application**.

## Scope and limitations

- GitHub Pages hosts the static web client only.
- The Node.js scientific agent is a separate service defined in `render.yaml`.
- Cloud AI requires the backend to be deployed and its secret environment
  variables to be configured on the backend host. Never put API keys in this
  repository or browser JavaScript.
- NASA PSI connector availability and complete raw-archive ingestion are not
  implied by publishing the web interface.
