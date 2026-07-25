interface HeaderProps {
  version: string;
  mode: string;
}

export function Header({ version, mode }: HeaderProps) {
  return (
    <header className="header">
      <h1 className="brand">NEURONET</h1>
      <p className="tagline">Debug Board</p>
      <div className="meta-row">
        <span>Version {version}</span>
        <span aria-hidden="true">·</span>
        <span>{mode}</span>
      </div>
    </header>
  );
}
