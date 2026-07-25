import { useState } from "react";
import { Header } from "./components/Header";
import { StatusCard } from "./components/StatusCard";
import { ActivityFeed } from "./components/ActivityFeed";
import { INITIAL_ACTIVITY } from "./data/initialActivity";
import {
  BiologicalNode,
  STRONG_SIGNAL,
  WEAK_SIGNAL,
} from "./models/BiologicalNode";
import type { NeuronData, StepResult } from "./types/neuron";

// One neuron for this Debug Board session.
// Refreshing the browser creates a new neuron from scratch.
const biologicalNode = new BiologicalNode();

function stepMessage(result: StepResult): string {
  if (result === "fired") {
    return "Neuron fired";
  }
  if (result === "resting") {
    return "Neuron resting";
  }
  return "Recovery";
}

export default function App() {
  const [neuron, setNeuron] = useState<NeuronData>(() => biologicalNode.getData());
  const [activity, setActivity] = useState<string[]>(INITIAL_ACTIVITY);

  function refreshNeuron() {
    setNeuron(biologicalNode.getData());
  }

  function prependActivity(message: string) {
    // Newest activity appears first.
    setActivity((current) => [message, ...current]);
  }

  function handleInjectSignal() {
    biologicalNode.receiveSignal(WEAK_SIGNAL);
    refreshNeuron();
    prependActivity("Signal received");
  }

  function handleStrongSignal() {
    biologicalNode.receiveSignal(STRONG_SIGNAL);
    refreshNeuron();
    prependActivity("Signal received");
  }

  function handleNextTick() {
    const result = biologicalNode.step();
    refreshNeuron();
    prependActivity(stepMessage(result));
  }

  function handleReset() {
    biologicalNode.reset();
    refreshNeuron();
    setActivity(["Reset", ...INITIAL_ACTIVITY]);
  }

  return (
    <div className="page">
      <Header version="0.3" mode="Biological Neuron" />

      <main className="main">
        <StatusCard neuron={neuron} />
        <ActivityFeed items={activity} />

        <section className="actions" aria-label="Controls">
          <button type="button" className="btn btn-primary" onClick={handleInjectSignal}>
            Inject Signal
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleStrongSignal}>
            Strong Signal
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleNextTick}>
            Next Tick
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleReset}>
            Reset
          </button>
        </section>
      </main>
    </div>
  );
}
