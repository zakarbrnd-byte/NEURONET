//! NEURONET v0.15 — Mission Control backend.
//!
//! Launches the local Digital Cell organism host and exposes Mission Control,
//! the permanent observatory console for the artificial life operating system.

use std::env;
use std::net::SocketAddr;
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

use anyhow::{Context, Result};
use tokio::sync::Mutex;
use tracing::info;
use tracing_subscriber::EnvFilter;

use neuronet_backend::{api, observatory, AppState};
use neuronet_core::CellRuntime;

fn default_db_path() -> PathBuf {
    env::var_os("NEURONET_DB")
        .map(PathBuf::from)
        .unwrap_or_else(|| PathBuf::from("neuronet_cell.db"))
}

fn listen_addr() -> SocketAddr {
    env::var("NEURONET_LISTEN")
        .ok()
        .and_then(|value| value.parse().ok())
        .unwrap_or_else(|| SocketAddr::from(([127, 0, 0, 1], 8080)))
}

fn frontend_dist_dir() -> PathBuf {
    env::var_os("NEURONET_FRONTEND_DIST")
        .map(PathBuf::from)
        .unwrap_or_else(|| PathBuf::from("frontend/dist"))
}

fn init_tracing() {
    let filter =
        EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info"));

    tracing_subscriber::fmt()
        .with_env_filter(filter)
        .with_target(false)
        .with_level(true)
        .compact()
        .init();
}

#[tokio::main]
async fn main() -> Result<()> {
    init_tracing();

    let db_path = default_db_path();
    let addr = listen_addr();
    let frontend_dist = frontend_dist_dir();

    info!(
        version = env!("CARGO_PKG_VERSION"),
        db = %db_path.display(),
        listen = %addr,
        frontend = %frontend_dist.display(),
        "NEURONET Mission Control"
    );

    let runtime = CellRuntime::open(&db_path)
        .with_context(|| format!("failed to open cell runtime at {}", db_path.display()))?;

    if let Ok(status) = runtime.primary_status() {
        info!(
            cell_id = %status.id,
            energy = status.energy,
            tick = status.tick,
            memories = status.memory_count,
            "Primary digital cell online"
        );
    }

    let shutdown = Arc::new(AtomicBool::new(false));
    let state = AppState {
        runtime: Arc::new(Mutex::new(runtime)),
        shutdown: Arc::clone(&shutdown),
        version: env!("CARGO_PKG_VERSION"),
    };

    let autonomous = Arc::clone(&state.runtime);
    let auto_shutdown = Arc::clone(&shutdown);
    let life_loop = tokio::spawn(async move {
        observatory::run_autonomous_life(autonomous, auto_shutdown).await
    });

    let app = api::router(state, frontend_dist.clone());
    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .with_context(|| format!("failed to bind Mission Control on {addr}"))?;

    info!(
        url = %format!("http://{addr}"),
        "Mission Control ready — open the browser observatory"
    );

    let server = axum::serve(listener, app).with_graceful_shutdown(async move {
        tokio::signal::ctrl_c()
            .await
            .expect("failed to install ctrl+c handler");
        info!("Shutdown signal received");
        shutdown.store(true, Ordering::SeqCst);
    });

    server.await.context("Mission Control server error")?;
    let _ = life_loop.await;

    info!("NEURONET Mission Control halted cleanly");
    Ok(())
}
