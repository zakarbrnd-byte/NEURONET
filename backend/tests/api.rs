use std::sync::atomic::AtomicBool;
use std::sync::Arc;

use axum::body::Body;
use axum::http::{Request, StatusCode};
use http_body_util::BodyExt;
use tempfile::TempDir;
use tokio::sync::Mutex;
use tower::ServiceExt;

use neuronet_backend::{api, AppState};
use neuronet_core::CellRuntime;

fn test_state(dir: &TempDir) -> AppState {
    let db = dir.path().join("mission.db");
    let runtime = CellRuntime::open(db).expect("runtime");
    AppState {
        runtime: Arc::new(Mutex::new(runtime)),
        shutdown: Arc::new(AtomicBool::new(false)),
        version: "0.15.0-test",
    }
}

#[tokio::test]
async fn status_logs_message_and_control() {
    let dir = TempDir::new().expect("tempdir");
    let state = test_state(&dir);
    let app = api::router(state, dir.path().join("missing-dist"));

    let status_response = app
        .clone()
        .oneshot(
            Request::builder()
                .uri("/api/status")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(status_response.status(), StatusCode::OK);
    let status_body = status_response.into_body().collect().await.unwrap().to_bytes();
    let status: serde_json::Value = serde_json::from_slice(&status_body).unwrap();
    assert!(status["id"].as_str().is_some());
    assert_eq!(status["energy"], 100);
    assert_eq!(status["memoryCount"], 0);

    let message_response = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/message")
                .header("content-type", "application/json")
                .body(Body::from(r#"{"payload":"Hello Cell"}"#))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(message_response.status(), StatusCode::OK);

    let control_response = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/control")
                .header("content-type", "application/json")
                .body(Body::from(r#"{"command":"tick"}"#))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(control_response.status(), StatusCode::OK);
    let control_body = control_response.into_body().collect().await.unwrap().to_bytes();
    let control: serde_json::Value = serde_json::from_slice(&control_body).unwrap();
    assert_eq!(control["accepted"], true);
    assert_eq!(control["status"]["tick"], 1);
    assert!(control["status"]["memoryCount"].as_u64().unwrap() >= 2);

    let logs_response = app
        .oneshot(
            Request::builder()
                .uri("/api/logs")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(logs_response.status(), StatusCode::OK);
    let logs_body = logs_response.into_body().collect().await.unwrap().to_bytes();
    let logs: serde_json::Value = serde_json::from_slice(&logs_body).unwrap();
    let events = logs["events"].as_array().unwrap();
    assert!(!events.is_empty());
    assert!(events.iter().any(|event| event["category"] == "Stored Memory"));
    assert!(events.iter().any(|event| event["category"] == "Message Injected"));
}
