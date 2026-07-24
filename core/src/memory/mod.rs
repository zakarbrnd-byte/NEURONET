//! Local memory owned by a single cell.
//!
//! Memory and computation are inseparable: each cell stores its own experiences.
//! No global memory plane exists. Future learning, forgetting, and confidence
//! decay can evolve inside this module without changing the cell boundary.

mod entry;
mod store;

pub use entry::MemoryEntry;
pub use store::MemoryStore;
