import type { ReactNode } from "react";

interface ContextPanelProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/** Mobile bottom sheet / desktop side panel for Mission Control sections. */
export function ContextPanel({ open, title, onClose, children }: ContextPanelProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="context-panel-root" role="dialog" aria-modal="true" aria-label={title}>
      <button
        type="button"
        className="context-panel-backdrop"
        aria-label="Close panel"
        onClick={onClose}
      />
      <div className="context-panel">
        <div className="context-panel-handle" aria-hidden="true" />
        <div className="context-panel-header">
          <h2 className="context-panel-title">{title}</h2>
          <button type="button" className="btn btn-secondary context-panel-close" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="context-panel-body" data-scroll="internal">
          {children}
        </div>
      </div>
    </div>
  );
}
