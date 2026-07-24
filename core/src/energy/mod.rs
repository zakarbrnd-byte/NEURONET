//! Metabolic energy owned exclusively by a cell.
//!
//! Energy is local state. No shared pool exists. Costs and recovery are applied
//! during the cell lifecycle so future adaptive metabolism can plug in here
//! without restructuring the runtime.

use serde::{Deserialize, Serialize};

/// Minimum energy a cell may hold.
pub const ENERGY_MIN: u8 = 0;

/// Maximum energy a cell may hold.
pub const ENERGY_MAX: u8 = 100;

/// Energy spent when waking.
pub const COST_WAKE: u8 = 1;

/// Energy spent when processing.
pub const COST_PROCESS: u8 = 2;

/// Energy spent when remembering.
pub const COST_REMEMBER: u8 = 1;

/// Energy recovered when sleeping.
pub const RECOVERY_SLEEP: u8 = 2;

/// Local metabolic budget for a single autonomous cell.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct Energy {
    level: u8,
}

impl Default for Energy {
    fn default() -> Self {
        Self::new()
    }
}

impl Energy {
    /// Create a new energy reserve at the initial maximum (100).
    pub fn new() -> Self {
        Self {
            level: ENERGY_MAX,
        }
    }

    /// Create energy at an explicit level, clamped to `0..=100`.
    pub fn with_level(level: u8) -> Self {
        Self {
            level: level.min(ENERGY_MAX),
        }
    }

    /// Current energy level.
    pub fn level(&self) -> u8 {
        self.level
    }

    /// Whether the cell has any remaining energy.
    pub fn is_depleted(&self) -> bool {
        self.level == ENERGY_MIN
    }

    /// Spend energy, clamping at zero.
    pub fn spend(&mut self, amount: u8) {
        self.level = self.level.saturating_sub(amount);
    }

    /// Recover energy, clamping at [`ENERGY_MAX`].
    pub fn recover(&mut self, amount: u8) {
        self.level = self.level.saturating_add(amount).min(ENERGY_MAX);
    }

    /// Apply the wake cost.
    pub fn on_wake(&mut self) {
        self.spend(COST_WAKE);
    }

    /// Apply the process cost.
    pub fn on_process(&mut self) {
        self.spend(COST_PROCESS);
    }

    /// Apply the remember cost.
    pub fn on_remember(&mut self) {
        self.spend(COST_REMEMBER);
    }

    /// Apply sleep recovery.
    pub fn on_sleep(&mut self) {
        self.recover(RECOVERY_SLEEP);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn starts_at_maximum() {
        let energy = Energy::new();
        assert_eq!(energy.level(), ENERGY_MAX);
    }

    #[test]
    fn spend_and_recover_clamp() {
        let mut energy = Energy::with_level(1);
        energy.spend(10);
        assert_eq!(energy.level(), 0);
        assert!(energy.is_depleted());

        energy.recover(200);
        assert_eq!(energy.level(), ENERGY_MAX);
    }

    #[test]
    fn lifecycle_costs_net_negative_per_tick() {
        // Wake -1, Process -2, Remember -1, Sleep +2 => net -2 per full cycle.
        let mut energy = Energy::new();
        energy.on_wake();
        energy.on_process();
        energy.on_remember();
        energy.on_sleep();
        assert_eq!(energy.level(), 98);
    }
}
