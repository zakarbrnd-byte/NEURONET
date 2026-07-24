interface EnergyBarProps {
  energy: number;
}

export function EnergyBar({ energy }: EnergyBarProps) {
  const clamped = Math.max(0, Math.min(100, energy));
  return (
    <div className="energy">
      <div className="energy__header">
        <span>Energy</span>
        <strong>{clamped}%</strong>
      </div>
      <div
        className="energy__track"
        role="meter"
        aria-label="Cell energy"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={clamped}
      >
        <div className="energy__fill" style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}
