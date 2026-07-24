#!/usr/bin/env bash
# Launch NEURONET Mission Control (organism host + browser observatory).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is required to build Mission Control" >&2
  exit 1
fi

if ! command -v cargo >/dev/null 2>&1; then
  echo "cargo is required to run the NEURONET backend" >&2
  exit 1
fi

echo "==> Building Mission Control frontend"
(
  cd frontend
  if [[ ! -d node_modules ]]; then
    npm install
  fi
  npm run build
)

echo "==> Starting NEURONET Mission Control on http://127.0.0.1:8080"
exec cargo run -p neuronet-backend "$@"
