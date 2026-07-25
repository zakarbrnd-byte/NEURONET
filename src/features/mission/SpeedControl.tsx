import { useEffect, useId, useRef, useState } from "react";
import {
  SIMULATION_SPEED_PRESETS,
  shortSpeedLabel,
  type SimulationSpeedId,
} from "./simulationSpeed";

interface SpeedControlProps {
  speed: SimulationSpeedId;
  onSpeedChange: (speed: SimulationSpeedId) => void;
  disabled?: boolean;
  compact?: boolean;
}

export function SpeedControl({
  speed,
  onSpeedChange,
  disabled = false,
  compact = true,
}: SpeedControlProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (rootRef.current && target && !rootRef.current.contains(target)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div
      className={`speed-control ${compact ? "is-compact" : ""}`}
      ref={rootRef}
      data-testid="speed-control"
    >
      <button
        type="button"
        className="speed-control-trigger"
        aria-label={`Simulation speed ${shortSpeedLabel(speed)}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        disabled={disabled}
        data-testid="speed-control-trigger"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="speed-control-label">Speed</span>
        <span className="speed-control-value" data-testid="speed-control-value">
          {shortSpeedLabel(speed)}
        </span>
      </button>
      {open ? (
        <ul
          id={listId}
          className="speed-control-menu"
          role="listbox"
          aria-label="Simulation speed presets"
          data-testid="speed-control-menu"
        >
          {SIMULATION_SPEED_PRESETS.map((preset) => {
            const selected = preset.id === speed;
            return (
              <li key={preset.id} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={`speed-control-option ${selected ? "is-selected" : ""}`}
                  data-testid={`speed-option-${preset.id}`}
                  onClick={() => {
                    onSpeedChange(preset.id);
                    setOpen(false);
                  }}
                >
                  {preset.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
