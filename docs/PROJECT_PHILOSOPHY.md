# NEURONET Project Philosophy

**NEURONET — A Digital Nervous System.**

This document expands the project constitution ([`../NEURONET.md`](../NEURONET.md)).

Every design decision should answer:

> Does this make NEURONET behave more like a living nervous system?

If the answer is no, do not implement it.

---

## Why NEURONET Exists

NEURONET exists to investigate whether cognition can emerge from a digital system organized like a nervous system — built from local electrical dynamics, tissue structure, embodiment, experience, and learning — rather than from a centrally programmed intelligence.

The repository is a research laboratory. It is an experimental **Artificial Nervous System** project.

It is not a product whose success metric is answering user questions.

---

## Why This Is Not Another AI Project

NEURONET is not:

- another chatbot
- another large language model
- a text prediction system
- an LLM wrapper decorated with biological metaphors
- a hardcoded reasoning engine behind a neural skin

Typical AI products optimize for language performance and centralized inference.

NEURONET optimizes for a different question: whether a biologically-inspired digital nervous system can develop meaningful organization through its own dynamics.

The goal is not to imitate existing AI.

The goal is to investigate whether cognition can emerge from a biologically-inspired digital nervous system.

---

## Biological Inspiration

Biology develops nervous systems in stages. NEURONET mirrors that order as an engineering discipline:

```text
Digital Cell
↓
Neuron
↓
Neural Tissue
↓
Plasticity
↓
Body
↓
Sensorimotor Loop
↓
Prediction
↓
Memory
↓
Learning
↓
Emergent Cognition
```

Inspiration is **methodological**, not a claim of biophysical completeness.

Current neuron dynamics use educational millivolt approximations. They make resting potential, depolarization, firing, and recovery visible. They are not Hodgkin–Huxley models, and must not be described as such.

---

## Scientific Assumptions

Working assumptions (to be tested, not treated as proven):

1. **Local dynamics matter.** Membrane potential, threshold, firing, and recovery are first-class.
2. **Structure matters.** Positions, regions, layers, and cell types constrain what activity can mean.
3. **Adaptation matters.** Synaptic and structural plasticity change tissue over time.
4. **Embodiment matters.** Without a body and environment, “experience” remains abstract.
5. **Closed loops matter.** Perception, action, and feedback create conditions for prediction and learning.
6. **Emergence is optional.** Cognition may appear late, weakly, or not at all. That outcome is still science.

Always label work as **Implemented**, **Approximation**, or **Future work**.

---

## Development Strategy

Software feature lists are secondary. Biological development order is primary.

Never skip stages to chase demos.

| Stage | Roadmap |
| --- | --- |
| Neural Tissue | 0.6 (current development target) |
| Plasticity | 0.7–0.8 |
| Body | 0.9 |
| Sensorimotor Loop | 1.0 |
| Prediction | 1.1 |
| Memory | 1.2 |
| Learning | 1.3 |
| Emergent Cognition | 1.4 (observe; do not hard-code) |

Shipped observatory runtime remains **0.5** until later milestones land.

Do not implement learning, memory, plasticity, body, prediction, or cognition in documentation-only foundation commits — or ahead of their milestones.

---

## Research Questions

1. Can a digital neuron be a meaningful scientific object (electrical state, firing, recovery)?
2. Can multiple neurons form observable tissue with propagation and inhibition?
3. Can synaptic and structural plasticity reorganize that tissue over time?
4. Can a body (sensors + actuators) give the tissue a world to inhabit?
5. Can closed sensorimotor loops create persistent patterns of activity?
6. Can prediction and prediction error arise without hardcoding “thinking”?
7. Can memory and learning stabilize useful organization?
8. Can cognition emerge — and how would we know if it did?

Never collapse engineering completion into scientific confirmation.

---

## Long-Term Vision

Build a digital nervous system that can:

- organize as tissue
- adapt connections and structure
- inhabit a body (beginning with a smartphone)
- close sensorimotor loops
- form predictions and memories through experience
- be observed honestly as it develops

Then ask — without marketing claims — whether cognition emerges.

The objective is not high benchmark scores.  
The objective is to study the emergence of cognition.

---

## Limitations

**Implemented (0.5):** deterministic excitatory network; discrete ticks; educational membrane model; Mission Control observatory.

**Approximations:** millivolt units; fixed refractory period; simplified fatigue/energy; instantaneous discrete propagation; electrode-style stimulation as a stand-in for sensory input.

**Not implemented:** inhibition; spatial tissue; plasticity; body; prediction; memory; learning; cognition.

Honesty about these limits is part of the science.

---

## Future Research

Future work should deepen biological plausibility while remaining testable and observable:

- excitatory / inhibitory tissue organization
- measurable plasticity rules with inspectable histories
- smartphone-as-body sensorimotor pathways
- criteria for detecting prediction, memory, and learning without anthropomorphic theater

Related: [`ARCHITECTURE.md`](ARCHITECTURE.md), [`SCIENTIFIC_MODEL.md`](SCIENTIFIC_MODEL.md), [`../ROADMAP.md`](../ROADMAP.md).

---

We are not programming intelligence.

We are cultivating the conditions from which intelligence may emerge.
