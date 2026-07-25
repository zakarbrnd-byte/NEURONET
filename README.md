# NEURONET

**Version 0.2 — Basic Digital Node**

NEURONET is a beginner-friendly Chrome Debug Board for one Digital Node. This milestone moves node rules out of the React UI and into a simple `DigitalNode` class. There is still no backend, networking, or AI.

## What it does right now

The **NEURONET Debug Board** displays one local node:

- Project name, version `0.2`, and mode `Local DigitalNode`
- Node fields: ID, state, energy, tick, last message
- An energy progress bar
- An activity feed
- Buttons: **Send Hello**, **Wake**, **Sleep**, **Reset**

## What DigitalNode is

`src/models/DigitalNode.ts` is a plain TypeScript class that owns:

- `id`, `state`, `energy`, `tick`, `lastMessage`
- Methods: `receiveMessage`, `wake`, `sleep`, `reset`, `getData`

Node logic (energy, state changes, ticks, message storage) lives in that class, not in the React components.

The UI calls a method, then reads a snapshot with `getData()` and shows it.

## Why node logic is separate from the UI

Keeping rules inside `DigitalNode` makes the project easier to understand:

- The Debug Board draws the current values.
- The DigitalNode decides how values change.
- Later milestones can grow the node without rewriting the whole page.

## Browser-only memory

- The node exists only in browser memory.
- There is no backend and no persistence.
- Refreshing the browser resets the node.

## Folder structure

```text
NEURONET/
├── src/
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── StatusCard.tsx
│   │   └── ActivityFeed.tsx
│   ├── data/
│   │   └── initialActivity.ts
│   ├── models/
│   │   └── DigitalNode.ts
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

Open:

```text
http://localhost:5173/NEURONET/
```

## GitHub Pages

Live Debug Board:

```text
https://zakarbrnd-byte.github.io/NEURONET/
```

Deployed from `main` by `.github/workflows/deploy-pages.yml`.  
Vite `base` is `/NEURONET/`.

## Build check

```bash
npm run build
```
