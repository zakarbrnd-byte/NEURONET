# HYPOTHESES.md — Scientific Hypothesis Tracker

NEURONET registers research claims before celebrating them.

Status vocabulary:

| Status | Meaning |
|--------|---------|
| `proposed` | Articulated; substrate may be incomplete |
| `ready` | Experiment design is complete enough to run when substrate exists |
| `active` | Experiment currently running |
| `supported` | Evidence currently favors the prediction |
| `challenged` | Evidence currently weakens the prediction |
| `falsified` | Prediction failed under agreed conditions |
| `retired` | No longer pursued (reason required) |

Extended writeups may live under `docs/hypotheses/`.

---

## H001 — Distributed Memory Produces Resilient Cognition

**Title:** Distributed memory resilience

**Question:** Does distributing memory across autonomous cells produce more resilient functional continuity than concentrating equivalent memory in one place?

**Prediction:** A society with overlapping local memories will retain usable organization after random cell loss better than a single cell or central store holding the same total information.

**Experiment:** Seed overlapping memories in a multi-cell network; ablate random cells; compare retained organization against centralized controls confined to an isolated harness.

**Result:** Not yet available.

**Status:** `proposed`

---

## H002 — Forgetting Improves Learning Under Constraint

**Title:** Adaptive forgetting

**Question:** Does controlled forgetting improve adaptation when memory capacity and energy are finite?

**Prediction:** Cells with decay/forgetting rules will outperform no-forgetting cells on adaptation benchmarks under fixed memory and energy caps.

**Experiment:** Matched workloads with and without forgetting (v0.6 Learning Engine); compare interference, adaptation latency, and survival of useful associations.

**Result:** Not yet available.

**Status:** `proposed`

---

## H003 — Concepts Emerge from Repeated Associations

**Title:** Association-born concepts

**Question:** Can concept-like stable patterns arise from repeated local associations without a predefined ontology?

**Prediction:** Repeated co-occurrence will produce durable higher-order structures that behave like concepts under retrieval and transfer tests.

**Experiment:** Expose cells to associated stimulus pairs; prohibit concept labels in logic; compare against shuffled controls (v0.7 measurement).

**Result:** Not yet available.

**Status:** `proposed`

---

## H004 — Local Interactions Produce Global Organization

**Title:** Local-to-global organization

**Question:** Can global organization arise from purely local interaction rules?

**Prediction:** Networks using local messaging and local adaptation will exhibit macroscopic structure that no cell fully represents.

**Experiment:** Run N identical cells with neighbor-limited rules; quantify modularity, pathways, and role differentiation; verify no global state access during the run.

**Result:** Not yet available.

**Status:** `proposed`

---

## H005 — Metabolic Cost Shapes Useful Behavior

**Title:** Metabolism as behavioral regularizer

**Question:** Does an energy budget reduce pathological hyperactivity and bias cells toward selective processing?

**Prediction:** Cells with wake/process/remember costs and sleep recovery will show more stable long-run behavior than unlimited-energy variants.

**Experiment:** Compare capped vs uncapped energy regimes after Digital Cell energy model exists (engineering v0.1+).

**Result:** Pending substrate.

**Status:** `ready`

---

## H006 — Neighbor-Limited Communication Prevents Pseudo-Emergence

**Title:** Locality as anti-cheat constraint

**Question:** Does restricting communication to neighbors prevent trivial “global coordination” artifacts that look like emergence?

**Prediction:** Neighbor-limited societies will show slower but more authentic organization than broadcast-everywhere controls, and broadcast controls will inflate false emergent metrics.

**Experiment:** Identical local rules under neighbor graph vs all-to-all broadcast; compare organization metrics and ablation authenticity.

**Result:** Not yet available.

**Status:** `proposed`

---

## H007 — Redundant Encoding Outperforms Unique Encoding After Damage

**Title:** Redundant local encoding

**Question:** Does partial redundancy across cell memories improve post-damage recovery of society-level patterns?

**Prediction:** Societies with controlled redundancy will recover target patterns after ablation better than unique-encoding societies with equal total memory budget.

**Experiment:** Train/seed two societies with equal total memory bits but different redundancy; ablate; measure recovery.

**Result:** Not yet available.

**Status:** `proposed`

---

## H008 — Plasticity Without Reward Still Reorganizes Topology

**Title:** Unsupervised local rewiring

**Question:** Can connection create/prune dynamics reorganize topology using only local co-activity signals, without an external reward channel?

**Prediction:** Local co-activity rules will change graph structure in statistically reliable ways even when no global reward is provided.

**Experiment:** Run adaptive-brain rules with co-activity only; compare topology trajectories to frozen-topology controls.

**Result:** Not yet available.

**Status:** `proposed`

---

## H009 — Observation Load Must Not Alter Endogenous Dynamics

**Title:** Non-perturbing observatory

**Question:** Can Mission Control observe a living society at research granularity without becoming a causal driver of the behavior under study?

**Prediction:** Passive-only observation at designed sampling rates will not significantly change endogenous lifecycle/memory metrics compared with unaugmented runs.

**Experiment:** Twin runs with and without observatory polling/streaming; compare energy, memory growth, and message rates within pre-registered bounds.

**Result:** Not yet available.

**Status:** `proposed`

---

## H010 — Synchronous Global Ticking Suppresses Natural Organization

**Title:** Against the master clock

**Question:** Does imposing a single global tick across all cells reduce the diversity of organization relative to local clocks?

**Prediction:** Local-clock societies will exhibit richer role differentiation than globally synchronized societies under otherwise matched rules.

**Experiment:** Compare local schedulers vs enforced global barrier ticking; measure diversity and modularity.

**Result:** Not yet available.

**Status:** `proposed`

---

## H011 — Prediction Requires Temporal Structure in Local Experience

**Title:** Experience-grounded prediction

**Question:** Can anticipatory behavior appear from local history alone when environmental sequences contain structure?

**Prediction:** Cells exposed to structured temporal sequences will show anticipatory responses above chance; the same cells in unstructured noise will not.

**Experiment:** Structured vs shuffled sequence environments; measure anticipatory local responses without a central forecast service.

**Result:** Not yet available.

**Status:** `proposed`

---

## H012 — Hardcoded Planners Produce Fragile Competence

**Title:** Anti-hardcode competence fragility

**Question:** Do systems that secretly introduce centralized planning appear competent in narrow demos while failing locality/ablation tests required by NEURONET?

**Prediction:** Planner-injected controls will outperform on scripted demos but fail ablation/locality audits that local-only societies can partially survive.

**Experiment:** Maintain an isolated “cheat architecture” harness for comparison only; never ship it as production architecture; publish both demo scores and audit failures.

**Result:** Not yet available.

**Status:** `proposed`

---

## Adding Hypotheses

1. Allocate the next ID (`H013`, …).
2. Include Title, Question, Prediction, Experiment, Result, Status.
3. Link detailed protocols under `docs/hypotheses/` and runs under `docs/experiments/`.
4. Never mark `supported` without methods and data references.
5. If a hypothesis requires violating a Foundational Law in production code, reject that framing or confine the violation to an explicit non-shipping control harness.
