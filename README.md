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
http://localhost:5173
```

## Open in Chrome

1. Run `npm run dev`.
2. Open Chrome.
3. Go to `http://localhost:5173`.
4. On a phone on the same network, use the Network URL Vite prints (for example `http://192.168.x.x:5173`), or any preview URL your host environment exposes.

## Build check

```bash
npm run build
```

## Important notes

- Current data is **mock data** only.
- There is **no backend** yet.
- Buttons update React state in the browser only.
