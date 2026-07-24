# NEURONET Mission Control (Frontend)

Browser observatory for the Digital Cell.

## Scripts

```bash
npm install
npm run dev      # Vite dev server with /api proxy to :8080
npm run build    # production bundle to dist/
```

The production host is the Rust backend (`./scripts/launch.sh`), which serves
`frontend/dist` alongside the observatory API.
