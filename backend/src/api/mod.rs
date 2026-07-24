//! REST observatory API for Mission Control.
//!
//! REST is the v0.15 transport. Handlers depend on [`AppState`] operations so a
//! future WebSocket layer can call the same observatory methods with minimal change.

mod dto;

use std::path::PathBuf;

use axum::extract::State;
use axum::http::{header, StatusCode};
use axum::response::{IntoResponse, Response};
use axum::routing::{get, post};
use axum::{Json, Router};
use tower_http::cors::{Any, CorsLayer};
use tower_http::services::{ServeDir, ServeFile};
use tower_http::trace::TraceLayer;
use tracing::warn;

use neuronet_core::{ControlCommand, MessageInjection};

use crate::observatory::AppState;

use self::dto::{
    ApiError, ControlRequest, ControlResponse, LogsResponse, MessageResponse, MetaResponse,
    StatusResponse,
};

/// Build the Mission Control HTTP router.
pub fn router(state: AppState, frontend_dist: PathBuf) -> Router {
    let api = Router::new()
        .route("/status", get(get_status))
        .route("/logs", get(get_logs))
        .route("/message", post(post_message))
        .route("/control", post(post_control))
        .route("/meta", get(get_meta));

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let index = frontend_dist.join("index.html");
    let static_files = ServeDir::new(&frontend_dist)
        .append_index_html_on_directories(true)
        .not_found_service(ServeFile::new(index));

    Router::new()
        .nest("/api", api)
        .fallback_service(static_files)
        .layer(TraceLayer::new_for_http())
        .layer(cors)
        .with_state(state)
}

async fn get_meta(State(state): State<AppState>) -> Json<MetaResponse> {
    use std::sync::atomic::Ordering;

    Json(MetaResponse {
        name: "NEURONET".into(),
        product: "Mission Control".into(),
        description: "Artificial Life Operating System".into(),
        version: state.version.to_string(),
        transport: "rest".into(),
        life_loop_active: !state.shutdown.load(Ordering::SeqCst),
    })
}

async fn get_status(State(state): State<AppState>) -> Result<Json<StatusResponse>, ApiError> {
    let runtime = state.runtime.lock().await;
    let status = runtime.primary_status().map_err(ApiError::from)?;
    Ok(Json(StatusResponse::from(status)))
}

async fn get_logs(State(state): State<AppState>) -> Json<LogsResponse> {
    let runtime = state.runtime.lock().await;
    Json(LogsResponse {
        events: runtime
            .recent_activity_limited(200)
            .into_iter()
            .map(Into::into)
            .collect(),
    })
}

async fn post_message(
    State(state): State<AppState>,
    Json(body): Json<MessageInjection>,
) -> Result<Json<MessageResponse>, ApiError> {
    if body.payload.trim().is_empty() {
        return Err(ApiError::bad_request("payload must not be empty"));
    }

    let mut runtime = state.runtime.lock().await;
    let message_id = runtime
        .inject_message(body.payload)
        .map_err(ApiError::from)?;
    Ok(Json(MessageResponse {
        accepted: true,
        message_id,
    }))
}

async fn post_control(
    State(state): State<AppState>,
    Json(body): Json<ControlRequest>,
) -> Result<Json<ControlResponse>, ApiError> {
    let command = parse_command(&body.command)?;
    let mut runtime = state.runtime.lock().await;
    runtime.control(command).map_err(ApiError::from)?;
    let status = runtime.primary_status().map_err(ApiError::from)?;
    Ok(Json(ControlResponse {
        accepted: true,
        command: body.command,
        status: StatusResponse::from(status),
    }))
}

fn parse_command(raw: &str) -> Result<ControlCommand, ApiError> {
    match raw.trim().to_ascii_lowercase().as_str() {
        "wake" => Ok(ControlCommand::Wake),
        "sleep" => Ok(ControlCommand::Sleep),
        "tick" => Ok(ControlCommand::Tick),
        other => Err(ApiError::bad_request(format!(
            "unknown command '{other}'; expected wake, sleep, or tick"
        ))),
    }
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        if self.status.is_server_error() {
            warn!(error = %self.message, "Mission Control API error");
        }
        let body = Json(serde_json::json!({
            "error": self.message,
        }));
        (self.status, [(header::CONTENT_TYPE, "application/json")], body).into_response()
    }
}

impl ApiError {
    fn bad_request(message: impl Into<String>) -> Self {
        Self {
            status: StatusCode::BAD_REQUEST,
            message: message.into(),
        }
    }
}

impl From<neuronet_core::RuntimeError> for ApiError {
    fn from(value: neuronet_core::RuntimeError) -> Self {
        Self {
            status: StatusCode::INTERNAL_SERVER_ERROR,
            message: value.to_string(),
        }
    }
}
