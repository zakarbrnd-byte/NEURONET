import type { ConnectionStatus } from "../types/neural";

interface ConnectionBannerProps {
  status: ConnectionStatus;
  error: string | null;
  onRetry: () => void;
}

export function ConnectionBanner({ status, error, onRetry }: ConnectionBannerProps) {
  if (status === "connected") {
    return (
      <div className="banner banner-ok" role="status">
        Backend Connected
      </div>
    );
  }

  if (status === "connecting") {
    return (
      <div className="banner banner-warn" role="status">
        Connecting…
      </div>
    );
  }

  return (
    <div className="banner banner-error" role="alert">
      <strong>Backend Unavailable</strong>
      <p>
        {error ??
          "The observatory cannot reach the Rust neural core. GitHub Pages hosts only the frontend."}
      </p>
      <button type="button" className="btn btn-secondary" onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}
