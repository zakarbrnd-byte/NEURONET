import { useId, useState } from "react";
import {
  METRIC_EXPLANATIONS,
  type MetricExplanationKey,
} from "../content/metricExplanations";

interface MetricHintProps {
  metric: MetricExplanationKey;
  label: string;
}

/** Compact label with a tap/focus explanation toggle for technical metrics. */
export function MetricHint({ metric, label }: MetricHintProps) {
  const tooltipId = useId();
  const [open, setOpen] = useState(false);
  const explanation = METRIC_EXPLANATIONS[metric];

  return (
    <div className={`metric-hint-block ${open ? "is-open" : ""}`}>
      <div className="metric-hint-label-row">
        <span className="metric-hint-label">{label}</span>
        <button
          type="button"
          className="metric-hint-trigger"
          aria-label={`Explain ${label}`}
          aria-expanded={open}
          aria-controls={tooltipId}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setOpen((current) => !current);
          }}
        >
          <span aria-hidden="true">i</span>
        </button>
      </div>
      {open ? (
        <p id={tooltipId} className="metric-hint-text" role="note">
          {explanation}
        </p>
      ) : (
        <span id={tooltipId} className="sr-only">
          {explanation}
        </span>
      )}
    </div>
  );
}
