import type { NetworkStepTrace } from "../../types/neural";
import { explainStep } from "../../types/neural";

interface CausalPanelProps {
  lastTrace: NetworkStepTrace | null;
}

export function CausalPanel({ lastTrace }: CausalPanelProps) {
  const lines = lastTrace ? explainStep(lastTrace) : ["Stimulate a neuron, then step the network."];

  return (
    <section className="card" aria-labelledby="causal-heading">
      <h2 id="causal-heading" className="card-title">
        What Happened This Tick?
      </h2>
      <p className="hint">
        Explanation generated only from the structured backend step trace.
      </p>
      {lastTrace ? <p className="timeline-title">Tick {lastTrace.tick}</p> : null}
      <ul className="causal-list">
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </section>
  );
}
