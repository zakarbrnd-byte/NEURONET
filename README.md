# NEURONET

**Version 0.3 — Biological Neuron**

NEURONET is an experimental project exploring whether cognition can emerge from biologically-inspired computational principles.

It is **not** a chatbot, **not** an LLM, and **not** trying to imitate ChatGPT.

This milestone introduces one biological principle: a single simplified neuron that can receive signals, accumulate activation, fire, rest, and recover.

## What it does right now

The Chrome **Debug Board** lets you observe one local `BiologicalNode`:

- Version `0.3`, mode `Biological Neuron`
- Neuron ID, Activation, Threshold, Energy, Fatigue, Refractory, Tick, Fired
- Activity feed (newest first)
- Buttons: **Inject Signal**, **Strong Signal**, **Next Tick**, **Reset**

The neuron exists only in browser memory. Refreshing the page resets it. There is no backend.

## What a Biological Neuron is

`src/models/BiologicalNode.ts` is a beginner-friendly educational model of one neuron.

It owns its own values and behavior. The React UI only displays snapshots from `getData()`.

### Activation

Current accumulated electrical potential. Signals raise activation. Each tick, unused activation decays slightly toward zero.

### Threshold

The activation level required to fire. Starts at `1.0`.

### Fatigue

Temporary exhaustion after firing. Fatigue recovers gradually during resting and recovery steps.

### Refractory

After firing, the neuron enters a short refractory period (`2` ticks). It cannot fire again until that countdown reaches zero.

### Energy

A simple visual indicator. Firing reduces energy by `1`. Energy never goes below `0`.

## Important educational note

This is only an **educational approximation** of a biological neuron.

It is **not** intended to simulate all neuron biology. It is the minimum model that makes firing, resting, and recovery understandable in Chrome.

## Try this sequence

1. **Inject Signal** → activation becomes `0.35`
2. **Next Tick** → activation decays; neuron does not fire
3. **Strong Signal** → activation becomes `1.25`
4. **Next Tick** → neuron fires; activation returns to `0`, energy `99`, fatigue `0.2`, refractory `2`

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
│   │   ├── BiologicalNode.ts
│   │   └── BiologicalNode.test.ts
│   ├── types/
│   │   └── neuron.ts
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

## Install

```bash
npm install
```

## Run locally

```bash
npm run dev
```

Open:

```text
http://localhost:5173/NEURONET/
```

## Test

```bash
npm test
```

## Build

```bash
npm run build
```

## GitHub Pages

```text
https://zakarbrnd-byte.github.io/NEURONET/
```

Deployed from `main` by `.github/workflows/deploy-pages.yml`.  
Vite `base` remains `/NEURONET/`.
