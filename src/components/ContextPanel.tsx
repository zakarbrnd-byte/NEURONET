import { useEffect, useId, useRef, type ReactNode } from "react";

interface ContextPanelProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/** Mobile bottom sheet / desktop side panel for Mission Control sections. */
export function ContextPanel({ open, title, onClose, children }: ContextPanelProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    closeRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="context-panel-root"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-label={title}
    >
      <button
        type="button"
        className="context-panel-backdrop"
        aria-label="Close panel"
        onClick={onClose}
      />
      <div className="context-panel">
        <div className="context-panel-handle" aria-hidden="true" />
        <div className="context-panel-header">
          <h2 id={titleId} className="context-panel-title">
            {title}
          </h2>
          <button
            ref={closeRef}
            type="button"
            className="btn btn-secondary context-panel-close"
            onClick={onClose}
          >
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
