import { useEffect, useId, useRef, useState, type ElementType } from "react";
import {
  METRIC_EXPLANATIONS,
  type MetricKey,
} from "../content/metricExplanations";

interface MetricLabelProps {
  metric: MetricKey;
  /** Defaults to `<dt>` for status rows. */
  as?: "dt" | "span";
}

/**
 * Technical metric label with a small info control.
 * - Mobile: tap toggles a compact explanation.
 * - Desktop: hover and keyboard focus can show the tooltip; tap also works.
 */
export function MetricLabel({ metric, as = "dt" }: MetricLabelProps) {
  const { label, explanation } = METRIC_EXPLANATIONS[metric];
  const tooltipId = useId();
  const rootRef = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const Tag = as as ElementType;

  useEffect(() => {
    if (!open) {
      return;
    }

    function onPointerDown(event: PointerEvent) {
      const root = rootRef.current;
      if (!root) {
        return;
      }
      if (event.target instanceof Node && !root.contains(event.target)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <Tag className={`metric-label ${open ? "is-open" : ""}`} ref={rootRef}>
      <span className="metric-label-text">{label}</span>
      <span className="metric-hint">
        <button
          type="button"
          className="metric-hint-trigger"
          aria-label={`Explain ${label}`}
          aria-expanded={open}
          aria-controls={tooltipId}
          aria-describedby={tooltipId}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setOpen((current) => !current);
          }}
        >
          <span className="metric-hint-icon" aria-hidden="true">
            i
          </span>
        </button>
        <span
          id={tooltipId}
          role="tooltip"
          className="metric-hint-tooltip"
          data-metric={metric}
        >
          {explanation}
        </span>
      </span>
    </Tag>
  );
}
