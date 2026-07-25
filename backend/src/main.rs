use std::net::SocketAddr;
use std::sync::Arc;
use std::time::Instant;

use tokio::sync::Mutex;
use tracing_subscriber::EnvFilter;

use neuronet_backend::api::{app, build_cors, AppState};
use neuronet_backend::network::NeuralNetwork;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::from_default_env().add_directive("info".parse().unwrap()))
        .init();

    // Cloud hosts (Render, Railway, Fly) provide PORT.
    // Local development can use PORT or NEURONET_PORT; default is 3000.
    let port: u16 = std::env::var("PORT")
        .or_else(|_| std::env::var("NEURONET_PORT"))
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(3000);

    // Explicit allow-list only. Do not use wildcard CORS in production.
    let origins = std::env::var("NEURONET_CORS_ORIGINS")
        .unwrap_or_else(|_| {
            [
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "https://zakarbrnd-byte.github.io",
            ]
            .join(",")
        })
        .split(',')
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .collect::<Vec<_>>();

    let state = AppState {
        network: Arc::new(Mutex::new(NeuralNetwork::initial())),
        started_at: Instant::now(),
    };

    let cors = build_cors(&origins);
    let router = app(state, cors);

    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    tracing::info!("NEURONET backend 0.8.1 listening on http://{addr}");
    tracing::info!("CORS origins: {:?}", origins);

    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .expect("failed to bind backend port");

    axum::serve(listener, router)
        .await
        .expect("backend server error");
}
