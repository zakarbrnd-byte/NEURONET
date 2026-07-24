# HYPOTHESES.md — Research Hypotheses

NEURONET is a scientific platform. Claims require questions, predictions, and
experiments. This file tracks the first research hypotheses.

Status vocabulary:

- `proposed` — articulated, not yet testable in-repo
- `ready` — experiment design exists; awaiting implementation substrate
- `active` — experiment running
- `supported` — evidence currently favors the prediction
- `challenged` — evidence currently weakens the prediction
- `falsified` — prediction failed under agreed conditions
- `retired` — no longer pursued (with reason)

---

## H001 — Distributed Memory Produces Resilient Cognition

### Question

Does distributing memory across autonomous cells produce more resilient
functional continuity than concentrating equivalent memory in one place?

### Prediction

A society of cells with local memories will retain usable organization after
random cell loss better than a single cell (or central store) holding the same
total information.

### Status

`proposed`

### Experiment

1. Build a multi-cell network (requires v0.2+).
2. Seed overlapping local memories via repeated local interactions.
3. Randomly remove a percentage of cells.
4. Measure remaining task-relevant organization / recall proxies.
5. Compare against a centralized-memory control that violates Law 1 only inside
   an isolated experiment harness (never in production architecture).

### Results

Not yet available. Substrate incomplete.

---

## H002 — Forgetting Improves Learning

### Question

Does controlled forgetting improve a cell’s ability to form useful future
associations under finite memory and energy?

### Prediction

Cells with decay/forgetting rules will outperform no-forgetting cells on
adaptation benchmarks when memory capacity and energy are constrained.

### Status

`proposed`

### Experiment

1. Implement local forgetting seams (v0.6 Learning Engine).
2. Run matched workloads with and without forgetting.
3. Hold energy/memory caps constant.
4. Compare adaptation latency and interference rates.

### Results

Not yet available. Requires learning dynamics.

---

## H003 — Concepts Emerge from Repeated Associations

### Question

Can concept-like stable patterns arise from repeated local associations without
a predefined ontology?

### Prediction

Repeated co-occurrence of local signals will produce durable higher-order
memory structures that behave like concepts under retrieval and transfer tests,
despite no hardcoded concept table.

### Status

`proposed`

### Experiment

1. Expose cells to repeated associated stimulus pairs (v0.5+ / v0.7).
2. Prohibit explicit concept labels in cell logic.
3. Measure spontaneous clustering / retrieval generalization.
4. Attempt falsification with shuffled controls.

### Results

Not yet available. Requires association metrics and multi-cell interaction.

---

## H004 — Local Interactions Produce Global Organization

### Question

Can global organization arise from purely local interaction rules?

### Prediction

Networks following local messaging and local adaptation rules will exhibit
macroscopic structure (clusters, pathways, specialized roles) that no cell
represents in full.

### Status

`proposed`

### Experiment

1. Instantiate N identical cells with local neighbor rules (v0.2–0.3).
2. Allow extended interaction under controlled energy regimes.
3. Quantify global metrics (modularity, path structure, role differentiation).
4. Verify no cell has access to global state during the run.

### Results

Not yet available. Requires living network substrate.

---

## H005 — Metabolic Cost Shapes Useful Behavior

### Question

Does an energy budget prevent pathological hyperactivity and bias cells toward
selective processing?

### Prediction

Cells with wake/process/remember costs and sleep recovery will show more stable
long-run behavior than equivalent cells with unlimited energy.

### Status

`ready` (design-ready for v0.1 energy model; comparative experiment after baseline cell exists)

### Experiment

1. Implement energy costs in Digital Cell lifecycle (v0.1).
2. Compare capped vs uncapped energy variants in a controlled harness.
3. Measure message thrash, memory growth rate, and survival/continuity.

### Results

Pending v0.1 implementation.

---

## Adding New Hypotheses

1. Use the next free ID (`H006`, …).
2. Include Question, Prediction, Status, Experiment, Results.
3. Link experiments to folders under `docs/experiments/`.
4. Never mark `supported` without recorded methods and data references.
5. If a hypothesis requires violating a Foundational Law in production code,
   reject the hypothesis framing or confine the violation to an explicit
   simulation control that cannot ship as architecture.
