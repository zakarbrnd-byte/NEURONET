//! Integration tests for NEURONET v0.1 Digital Cell.

use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Duration;

use neuronet_core::{
    Cell, CellRuntime, CellState, DigitalCell, Energy, MemoryEntry, MemoryStore, Message,
    MessageQueue,
};
use tempfile::TempDir;
use uuid::Uuid;

#[test]
fn node_creation() {
    let cell = DigitalCell::birth();
    assert_ne!(cell.id(), Uuid::nil());
    assert_eq!(cell.energy(), 100);
    assert_eq!(cell.state(), CellState::Sleeping);
    assert_eq!(cell.tick_count(), 0);
    assert!(cell.memory().is_empty());
    assert!(cell.inbox().is_empty());
}

#[test]
fn energy_costs_and_clamping() {
    let mut energy = Energy::new();
    assert_eq!(energy.level(), 100);

    energy.on_wake();
    energy.on_process();
    energy.on_remember();
    energy.on_sleep();
    assert_eq!(energy.level(), 98);

    let mut depleted = Energy::with_level(1);
    depleted.spend(50);
    assert_eq!(depleted.level(), 0);
    depleted.recover(250);
    assert_eq!(depleted.level(), 100);
}

#[test]
fn lifecycle_sequence() {
    let mut cell = DigitalCell::birth();

    cell.wake().expect("wake");
    assert_eq!(cell.state(), CellState::Awake);
    assert_eq!(cell.energy(), 99);

    let received = cell.receive().expect("receive");
    assert_eq!(received, 0);

    cell.process().expect("process");
    assert_eq!(cell.state(), CellState::Processing);
    assert_eq!(cell.energy(), 97);

    cell.remember().expect("remember");
    assert_eq!(cell.memory().len(), 1);
    assert_eq!(cell.energy(), 96);

    cell.sleep().expect("sleep");
    assert_eq!(cell.state(), CellState::Sleeping);
    assert_eq!(cell.energy(), 98);

    cell.tick().expect("tick");
    assert_eq!(cell.tick_count(), 1);
}

#[test]
fn memory_store_retains_payload_and_confidence() {
    let mut store = MemoryStore::new();
    let entry = MemoryEntry::new("pattern-alpha", 0.75);
    let id = entry.id;
    store.remember(entry);

    assert_eq!(store.len(), 1);
    assert_eq!(store.entries()[0].payload, "pattern-alpha");
    assert!((store.entries()[0].confidence - 0.75).abs() < f64::EPSILON);
    assert!(store.forget(id));
    assert!(store.is_empty());
}

#[test]
fn message_queue_fifo() {
    let sender = Uuid::new_v4();
    let mut queue = MessageQueue::new();
    queue.enqueue(Message::new(sender, "first"));
    queue.enqueue(Message::new(sender, "second"));

    assert_eq!(queue.len(), 2);
    let drained = queue.drain();
    assert_eq!(drained[0].payload, "first");
    assert_eq!(drained[1].payload, "second");
    assert!(queue.is_empty());
}

#[test]
fn persistence_restores_identity_energy_and_memory() {
    let dir = TempDir::new().expect("tempdir");
    let db = dir.path().join("neuronet.db");

    let mut runtime = CellRuntime::open(&db).expect("open");
    let cell = runtime.primary_mut().expect("cell");
    let id = cell.id();
    cell.deliver(Message::new(id, "encode this"));
    runtime.advance_all().expect("advance");

    let snapshot_ticks = runtime.primary().expect("cell").tick_count();
    let snapshot_energy = runtime.primary().expect("cell").energy();
    let snapshot_memories = runtime.primary().expect("cell").memory().len();
    assert!(snapshot_memories >= 2);
    drop(runtime);

    let restored = CellRuntime::open(&db).expect("reopen");
    let cell = restored.primary().expect("cell");
    assert_eq!(cell.id(), id);
    assert_eq!(cell.tick_count(), snapshot_ticks);
    assert_eq!(cell.energy(), snapshot_energy);
    assert_eq!(cell.memory().len(), snapshot_memories);
    assert!(cell
        .memory()
        .entries()
        .iter()
        .any(|m| m.payload.contains("encode this")));
}

#[test]
fn trait_object_vector_is_architecturally_valid() {
    let mut colony: Vec<Box<dyn Cell>> = vec![
        Box::new(DigitalCell::birth()),
        Box::new(DigitalCell::birth()),
    ];

    for cell in &mut colony {
        cell.advance().expect("advance");
    }

    assert_eq!(colony.len(), 2);
}

#[tokio::test]
async fn runtime_advances_under_local_scheduler() {
    let dir = TempDir::new().expect("tempdir");
    let db = dir.path().join("scheduled.db");
    let runtime = CellRuntime::open(&db).expect("open");
    let shutdown = Arc::new(AtomicBool::new(false));
    let flag = Arc::clone(&shutdown);

    let handle = tokio::spawn(async move { runtime.run(flag).await });

    tokio::time::sleep(Duration::from_millis(1200)).await;
    shutdown.store(true, Ordering::SeqCst);

    // Allow the scheduler to observe the flag on the next tick boundary.
    tokio::time::sleep(Duration::from_millis(1200)).await;
    let result = tokio::time::timeout(Duration::from_secs(3), handle)
        .await
        .expect("join timeout")
        .expect("task join");
    assert!(result.is_ok());

    let restored = CellRuntime::open(&db).expect("reopen");
    assert!(restored.primary().expect("cell").tick_count() >= 1);
}
