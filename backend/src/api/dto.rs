//! JSON data-transfer objects for the Mission Control REST surface.
//!
//! Field names follow the published observatory contract (camelCase). Keep these
//! aligned with `shared/api-types.ts` so WebSocket payloads can reuse them later.

use axum::http::StatusCode;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use neuronet_core::{ActivityEvent, CellStatus};

/// API error returned to Mission Control.
#[derive(Debug)]
pub struct ApiError {
    pub status: StatusCode,
    pub message: String,
}

/// `GET /api/meta`
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MetaResponse {
    pub name: String,
    pub product: String,
    pub description: String,
    pub version: String,
    pub transport: String,
    pub life_loop_active: bool,
}

/// `GET /api/status`
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StatusResponse {
    pub id: String,
    pub tick: u64,
    pub state: String,
    pub energy: u8,
    pub memory_count: usize,
    pub message_queue: usize,
    pub created_at: String,
    pub uptime_seconds: u64,
}

impl From<CellStatus> for StatusResponse {
    fn from(status: CellStatus) -> Self {
        Self {
            id: status.id.to_string(),
            tick: status.tick,
            state: status.state.to_string(),
            energy: status.energy,
            memory_count: status.memory_count,
            message_queue: status.message_queue,
            created_at: status.created_at.to_rfc3339(),
            uptime_seconds: status.uptime_seconds,
        }
    }
}

/// One activity row in the Mission Control feed.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LogEvent {
    pub id: String,
    pub timestamp: DateTime<Utc>,
    pub cell_id: String,
    pub category: String,
    pub detail: String,
}

impl From<ActivityEvent> for LogEvent {
    fn from(event: ActivityEvent) -> Self {
        Self {
            id: event.id.to_string(),
            timestamp: event.timestamp,
            cell_id: event.cell_id.to_string(),
            category: event.category,
            detail: event.detail,
        }
    }
}

/// `GET /api/logs`
#[derive(Debug, Serialize)]
pub struct LogsResponse {
    pub events: Vec<LogEvent>,
}

/// `POST /api/control`
#[derive(Debug, Deserialize)]
pub struct ControlRequest {
    pub command: String,
}

/// Response after a control command.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ControlResponse {
    pub accepted: bool,
    pub command: String,
    pub status: StatusResponse,
}

/// Response after message injection.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MessageResponse {
    pub accepted: bool,
    pub message_id: Uuid,
}
