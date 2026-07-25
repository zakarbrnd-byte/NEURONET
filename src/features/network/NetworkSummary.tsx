import { MetricLabel } from "../../components/MetricLabel";
import type { ConnectionStatus, NetworkSnapshot, NetworkStepTrace } from "../../types/neural";
import { countDepolarized, countRefractory } from "../../types/neural";

interface NetworkSummaryProps {
  network: NetworkSnapshot | null;
  lastTrace: NetworkStepTrace | null;
  status: ConnectionStatus;
  sequenceStatus: string;
}

export function NetworkSummary({
  network,
  lastTrace,
  status,
  sequenceStatus,
}: NetworkSummaryProps) {
  const fired = lastTrace?.firedNeuronIds.length ?? 0;
  const propagated = lastTrace?.propagations.length ?? 0;

  return (
    <section className="card" aria-labelledby="summary-heading">
      <h2 id="summary-heading" className="card-title">
        Network Summary
      </h2>
      <dl className="status-list">
        <div className="status-row">
          <MetricLabel metric="networkTick" />
          <dd>{network?.tick ?? 0}</dd>
        </div>
        <div className="status-row">
          <dt>Total Neurons</dt>
          <dd>{network?.neurons.length ?? 0}</dd>
        </div>
        <div className="status-row">
          <dt>Total Connections</dt>
          <dd>{network?.connections.length ?? 0}</dd>
        </div>
        <div className="status-row">
          <dt>Fired This Tick</dt>
          <dd>{fired}</dd>
        </div>
        <div className="status-row">
          <dt>Depolarized Neurons</dt>
          <dd>{network ? countDepolarized(network.neurons) : 0}</dd>
        </div>
        <div className="status-row">
          <dt>Refractory Neurons</dt>
          <dd>{network ? countRefractory(network.neurons) : 0}</dd>
        </div>
        <div className="status-row">
          <dt>Signals Propagated</dt>
          <dd>{propagated}</dd>
        </div>
        <div className="status-row">
          <dt>Backend Status</dt>
          <dd>{status}</dd>
        </div>
        <div className="status-row">
          <dt>Sequence Status</dt>
          <dd>{sequenceStatus}</dd>
        </div>
      </dl>
    </section>
  );
}
