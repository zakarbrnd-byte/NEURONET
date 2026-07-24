interface TopBarProps {
  version: string;
  online: boolean;
}

export function TopBar({ version, online }: TopBarProps) {
  return (
    <header className="topbar">
      <div className="topbar__brand">
        <div className="topbar__mark" aria-hidden="true" />
        <div className="topbar__titles">
          <p className="topbar__name">NEURONET</p>
          <p className="topbar__product">Mission Control</p>
        </div>
      </div>

      <div className="topbar__meta">
        <p className="topbar__alos">Artificial Life Operating System</p>
        <p className="topbar__version">Version {version}</p>
      </div>

      <div className={`topbar__status ${online ? "is-online" : "is-offline"}`}>
        <span className="topbar__pulse" aria-hidden="true" />
        <span>{online ? "Digital Cell Online" : "Digital Cell Offline"}</span>
      </div>
    </header>
  );
}
