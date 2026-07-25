//! Local messaging primitives.
//!
//! In v0.1 a cell only sees messages that have already arrived in its own queue.
//! Neighbor discovery and network transport come later; the envelope and queue
//! remain stable so those features can attach without redesign.

mod message;
mod queue;

pub use message::Message;
pub use queue::MessageQueue;
