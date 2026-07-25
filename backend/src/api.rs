//! HTTP API for the NEURONET neural core.

use std::sync::Arc;

use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::routing::{get, post};
use axum::{Json, Router};
use serde::{Deserialize, Serialize};
use tokio::sync::Mutex;
use tower_http::cors::{AllowOrigin, CorsLayer};

use crate::network::{NetworkSnapshot, NetworkStepTrace, NeuralNetwork};

pub type SharedNetwork = Arc<Mutex<NeuralNetwork>>;

#[derive(Clone)]
pub struct AppState {
    pub network: SharedNetwork,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct HealthResponse {
    status: &'static str,
    version: &'static str,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct SignalRequest {
    amount_mv: f64,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ErrorResponse {
    error: String,
}

pub fn app(state: AppState, cors: CorsLayer) -> Router {
    Router::new()
        .route("/api/health", get(health))
        .route("/api/network", get(get_network))
        .route("/api/events", get(get_events))
        .route("/api/neurons/{id}/signals", post(inject_signal))
        .route("/api/network/step", post(step_network))
        .route("/api/network/reset", post(reset_network))
        .layer(cors)
        .with_state(state)
}

pub fn build_cors(allowed_origins: &[String]) -> CorsLayer {
    if allowed_origins.iter().any(|o| o == "*") {
        return CorsLayer::permissive();
    }

    let origins = allowed_origins
        .iter()
        .filter_map(|value| value.parse().ok())
        .collect::<Vec<_>>();

    CorsLayer::new()
        .allow_origin(AllowOrigin::list(origins))
        .allow_methods([
            axum::http::Method::GET,
            axum::http::Method::POST,
            axum::http::Method::OPTIONS,
        ])
        .allow_headers([axum::http::header::CONTENT_TYPE])
}

async fn health() -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "ok",
        version: "0.5",
    })
}

async fn get_network(State(state): State<AppState>) -> Json<NetworkSnapshot> {
    let network = state.network.lock().await;
    Json(network.snapshot())
}

async fn get_events(State(state): State<AppState>) -> impl IntoResponse {
    let network = state.network.lock().await;
    Json(network.events_newest_first())
}

async fn inject_signal(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(body): Json<SignalRequest>,
) -> impl IntoResponse {
    let mut network = state.network.lock().await;
    match network.inject_signal(&id, body.amount_mv) {
        Ok(()) => (StatusCode::OK, Json(network.snapshot())).into_response(),
        Err(message) => (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse { error: message }),
        )
            .into_response(),
    }
}

async fn step_network(State(state): State<AppState>) -> Json<NetworkStepTrace> {
    let mut network = state.network.lock().await;
    Json(network.step())
}

async fn reset_network(State(state): State<AppState>) -> Json<NetworkSnapshot> {
    let mut network = state.network.lock().await;
    network.reset();
    Json(network.snapshot())
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::body::Body;
    use axum::http::{Request, StatusCode};
    use http_body_util::BodyExt;
    use tower::ServiceExt;

    fn test_app() -> Router {
        let state = AppState {
            network: Arc::new(Mutex::new(NeuralNetwork::initial())),
        };
        app(state, CorsLayer::permissive())
    }

    async fn body_json(response: axum::response::Response) -> serde_json::Value {
        let bytes = response.into_body().collect().await.unwrap().to_bytes();
        serde_json::from_slice(&bytes).unwrap()
    }

    #[tokio::test]
    async fn health_endpoint_reports_version_0_5() {
        let app = test_app();
        let response = app
            .oneshot(
                Request::builder()
                    .uri("/api/health")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);
        let json = body_json(response).await;
        assert_eq!(json["status"], "ok");
        assert_eq!(json["version"], "0.5");
    }

    #[tokio::test]
    async fn network_endpoint_returns_five_neurons_and_connections() {
        let app = test_app();
        let response = app
            .oneshot(
                Request::builder()
                    .uri("/api/network")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);
        let json = body_json(response).await;
        assert_eq!(json["neurons"].as_array().unwrap().len(), 5);
        assert_eq!(json["connections"].as_array().unwrap().len(), 5);
    }

    #[tokio::test]
    async fn valid_signal_injection() {
        let app = test_app();
        let response = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/api/neurons/NEURON-001/signals")
                    .header("content-type", "application/json")
                    .body(Body::from(r#"{"amountMv":5}"#))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);
        let json = body_json(response).await;
        assert_eq!(json["neurons"][0]["membranePotentialMv"], -65.0);
    }

    #[tokio::test]
    async fn invalid_neuron_id_and_signal() {
        let app = test_app();
        let bad_id = app
            .clone()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/api/neurons/NEURON-999/signals")
                    .header("content-type", "application/json")
                    .body(Body::from(r#"{"amountMv":5}"#))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(bad_id.status(), StatusCode::BAD_REQUEST);

        let bad_signal = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/api/neurons/NEURON-001/signals")
                    .header("content-type", "application/json")
                    .body(Body::from(r#"{"amountMv":0}"#))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(bad_signal.status(), StatusCode::BAD_REQUEST);
    }

    #[tokio::test]
    async fn step_returns_structured_trace_and_shared_state_persists() {
        let state = AppState {
            network: Arc::new(Mutex::new(NeuralNetwork::initial())),
        };
        let app = app(state.clone(), CorsLayer::permissive());

        let _ = app
            .clone()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/api/neurons/NEURON-001/signals")
                    .header("content-type", "application/json")
                    .body(Body::from(r#"{"amountMv":20}"#))
                    .unwrap(),
            )
            .await
            .unwrap();

        let step = app
            .clone()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/api/network/step")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(step.status(), StatusCode::OK);
        let trace = body_json(step).await;
        assert_eq!(trace["tick"], 1);
        assert_eq!(trace["firedNeuronIds"][0], "NEURON-001");
        assert_eq!(trace["propagations"][0]["sourceNeuronId"], "NEURON-001");
        assert_eq!(trace["propagations"][0]["targetNeuronId"], "NEURON-002");
        assert_eq!(trace["propagations"][0]["amountMv"], 16.0);
        assert!(trace["propagations"][0]["eventId"].as_str().unwrap().len() > 0);
        assert_eq!(trace["network"]["tick"], 1);

        let events = app
            .clone()
            .oneshot(
                Request::builder()
                    .uri("/api/events")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        let events_json = body_json(events).await;
        let prop = events_json
            .as_array()
            .unwrap()
            .iter()
            .find(|e| e["type"] == "signal_propagated")
            .unwrap();
        assert_eq!(prop["amountMv"], 16.0);
        assert_eq!(prop["sourceNeuronId"], "NEURON-001");

        let network = app
            .oneshot(
                Request::builder()
                    .uri("/api/network")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        let json = body_json(network).await;
        assert_eq!(json["tick"], 1);
    }

    #[tokio::test]
    async fn network_reset_restores_topology() {
        let app = test_app();
        let _ = app
            .clone()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/api/neurons/NEURON-001/signals")
                    .header("content-type", "application/json")
                    .body(Body::from(r#"{"amountMv":20}"#))
                    .unwrap(),
            )
            .await
            .unwrap();

        let reset = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/api/network/reset")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(reset.status(), StatusCode::OK);
        let json = body_json(reset).await;
        assert_eq!(json["tick"], 0);
        assert_eq!(json["neurons"].as_array().unwrap().len(), 5);
        assert_eq!(json["connections"].as_array().unwrap().len(), 5);
    }
}
