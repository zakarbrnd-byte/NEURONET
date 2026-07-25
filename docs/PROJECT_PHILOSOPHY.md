# NEURONET Project Philosophy

This is the central design document for Project NEURONET.

Every future design decision should answer one question before implementation:

> Does this make NEURONET behave more like a living nervous system?

If the answer is no, do not implement it.

---

## Why NEURONET Exists

NEURONET exists to investigate a scientific question:

Can cognition emerge from a digital system organized like a nervous system —
built from local electrical dynamics, tissue structure, embodiment, experience,
and learning — rather than from a centrally programmed intelligence?

NEURONET is a research laboratory in repository form.

It is an experimental **Artificial Nervous System** project.

It is not a product whose success metric is “answers user questions.”

---

## Why This Is Not an LLM

NEURONET is **not**:

- another chatbot
- another large language model
- a text prediction system
- an LLM wrapper with biological metaphors
- a hardcoded reasoning engine behind a neural skin

Those systems optimize for language performance by training on vast text corpora
and serving centralized inference.

NEURONET optimizes for a different question: whether a biologically-inspired
digital nervous system can develop meaningful organization and, eventually,
cognitive-like behavior through its own dynamics.

The goal is not to imitate existing AI.

The goal is to investigate whether cognition can emerge from a biologically-inspired digital nervous system.

---

## Biological Development Strategy

Software feature lists are secondary.

Biological development order is primary:

```text
Single Cell
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
Cognition
```

Or, in organism terms used by the project principles:

```text
Cells → Neurons → Tissue → Body → Experience → Learning → Cognition
```

We do not jump to cognition because it is fashionable.
We climb the ladder only when the lower rungs are real and observable.

---

## Scientific Assumptions

Working assumptions (to be tested, not treated as proven truths):

1. **Local dynamics matter.** Membrane potential, threshold, firing, and recovery are first-class.
2. **Structure matters.** Positions, regions, layers, and cell types shape what activity can mean.
3. **Adaptation matters.** Synaptic and structural plasticity change the tissue over time.
4. **Embodiment matters.** Without a body and environment, “experience” remains abstract.
5. **Closed loops matter.** Perception, action, and feedback create the conditions for prediction and learning.
6. **Emergence is optional.** Cognition may appear late, weakly, or not at all. That outcome is still science.

Current shipped stage (0.5) models deterministic excitatory neural tissue with observable ticks.
It does not yet model memory, learning, structural plasticity, embodiment, or cognition.

---

## Core Principles

1. **The backend owns reality. The frontend only observes.**  
   Mission Control may inspect and inject stimuli. It may never become the organism’s mind.

2. **Every new feature should become more biologically realistic. Never more computer-like.**  
   Reject designs that make NEURONET feel like a conventional app brain.

3. **Everything must be observable.**  
   Unobservable “intelligence” cannot be validated. Prefer structured events and traces.

4. **Development follows biological development.**  
   Do not skip tissue for chat. Do not skip body for memory slogans.

5. **Intelligence is never programmed directly.**  
   No master controller. No global mind memory. No hardcoded cognition theater.

---

## Long-term Vision

Build a digital nervous system that can:

- organize as tissue
- adapt its connections and structure
- inhabit a body (beginning with a smartphone)
- close sensorimotor loops
- form predictions and memories through experience
- be observed honestly as it develops

Then ask — without marketing claims — whether cognition emerges.

Success is not “NEURONET talks like a person.”  
Success is a coherent, testable artificial nervous system that can be studied.

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

## Development Strategy

Every milestone follows biological development instead of software feature lists.

```text
Single Cell
↓
Neuron
↓
Neural Tissue          ← Version 0.6 (current development target)
↓
Plasticity             ← Versions 0.7–0.8
↓
Body                   ← Version 0.9
↓
Sensorimotor Loop      ← Version 1.0
↓
Prediction             ← Version 1.1
↓
Memory                 ← Version 1.2
↓
Learning               ← Version 1.3
↓
Cognition              ← Version 1.4 (observe; do not hard-code)
```

See [`../ROADMAP.md`](../ROADMAP.md) for milestone detail and [`ARCHITECTURE.md`](ARCHITECTURE.md) for ownership boundaries.

---

## Absolute Don’ts

- Do not replace the architecture with an LLM application.
- Do not introduce a central cognitive service.
- Do not create global mutable “brain state” owned by the UI.
- Do not fake emergence with hardcoded cleverness.
- Do not mark cognition as achieved without evidence.
- Do not implement memory, learning, body, or cognition ahead of their milestones.

---

We are not programming intelligence.

We are cultivating the conditions from which intelligence may emerge.
