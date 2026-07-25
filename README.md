# NEURONET

**Version 0.1 — Debug Board Foundation**

NEURONET is starting as a simple Chrome debugging dashboard. This milestone shows mock data for one future digital node. There is no backend, networking, or AI yet.

## What it does right now

The **NEURONET Debug Board** is a single React page that displays:

- Project name, version, and mode
- Mock node fields: ID, state, energy, tick, last message
- An energy progress bar
- A short activity feed
- **Send Hello** and **Reset** buttons (local React state only)

All values are mock data in the browser. Nothing is saved to a server.

## Folder structure

```text
NEURONET/
├── src/
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── StatusCard.tsx
│   │   └── ActivityFeed.tsx
│   ├── data/
│   │   └── mockNode.ts
│   ├── types/
│   │   └── node.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── styles.css
├── public/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .github/workflows/deploy-pages.yml
├── README.md
├── ROADMAP.md
├── .gitignore
└── CLAUDE.md
```

## Install dependencies

```bash
npm install
```

## Run the app

```bash
npm run dev
```

Vite prints a local URL, usually:

```text
http://localhost:5173/NEURONET/
```

## Open in Chrome

1. Run `npm run dev`.
2. Open Chrome.
3. Go to `http://localhost:5173/NEURONET/`.
4. On a phone on the same network, use the Network URL Vite prints, plus `/NEURONET/`.

## GitHub Pages

This project deploys from `main` with GitHub Actions (`.github/workflows/deploy-pages.yml`).

After Pages is enabled for the repository (Settings → Pages → Source: **GitHub Actions**), the live Debug Board is:

```text
https://zakarbrnd-byte.github.io/NEURONET/
```

The Vite `base` path is set to `/NEURONET/` so asset URLs work on GitHub Pages.

## Build check

```bash
npm run build
```

## Important notes

- Current data is **mock data** only.
- There is **no backend** yet.
- Buttons update React state in the browser only.
