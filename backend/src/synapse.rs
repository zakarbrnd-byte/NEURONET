//! Living synapse model (Version 0.6B).
//!
//! Synapses are first-class biological objects with weight, usage, health,
//! stability, and age. Plasticity is deterministic — never random.
//!
//! Propagation delivers `±weight` millivolts (excitatory / inhibitory).
//! Educational approximation only — not biophysical STDP.

use serde::Serialize;

/// Minimum excitatory/inhibitory weight magnitude (mV).
pub const MIN_WEIGHT: f64 = 4.0;
/// Maximum weight magnitude (mV).
pub const MAX_WEIGHT: f64 = 24.0;
/// Hebbian increment when source→target co-activate across consecutive ticks.
pub const HEBBIAN_DELTA: f64 = 0.1;
/// Weight decay when unused for many ticks.
pub const WEIGHT_DECAY: f64 = 0.05;
/// Idle ticks before unused weight/health/stability decay applies.
pub const UNUSED_TICKS_BEFORE_DECAY: u64 = 8;
pub const STABILITY_USE_DELTA: f64 = 0.02;
pub const STABILITY_IDLE_DELTA: f64 = 0.005;
pub const HEALTH_USE_DELTA: f64 = 0.03;
pub const HEALTH_IDLE_DELTA: f64 = 0.01;
pub const MAX_WEIGHT_HISTORY: usize = 8;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum SynapseType {
    Excitatory,
    Inhibitory,
}

/// Observational pruning classification (0.6C — no deletion).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum PruningStatus {
    Stable,
    Monitoring,
    AtRisk,
    Protected,
}

/// Recent weight sample for Mission Control history.
#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct WeightHistoryEntry {
    pub tick: u64,
    pub weight: f64,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Synapse {
    pub id: String,
    pub source_neuron_id: String,
    pub target_neuron_id: String,
    pub weight: f64,
    #[serde(rename = "type")]
    pub synapse_type: SynapseType,
    pub usage_count: u64,
    pub last_activated_tick: Option<u64>,
    pub stability: f64,
    pub health: f64,
    pub age: u64,
    pub creation_tick: u64,
    pub weight_history: Vec<WeightHistoryEntry>,
    /// Signed delta applied on the most recent weight change (0 if none this tick).
    pub last_weight_delta: f64,
    // --- Structural pruning observation (0.6C; no deletion) ---
    pub pruning_risk: f64,
    pub inactivity_ticks: u64,
    pub low_weight_ticks: u64,
    pub low_health_ticks: u64,
    pub protected_until_tick: u64,
    pub pruning_status: PruningStatus,
    pub pruning_reasons: Vec<&'static str>,
}

impl Synapse {
    pub fn excitatory(
        id: impl Into<String>,
        source_neuron_id: impl Into<String>,
        target_neuron_id: impl Into<String>,
        weight: f64,
        creation_tick: u64,
    ) -> Result<Self, String> {
        Self::new(
            id,
            source_neuron_id,
            target_neuron_id,
            weight,
            SynapseType::Excitatory,
            creation_tick,
        )
    }

    pub fn inhibitory(
        id: impl Into<String>,
        source_neuron_id: impl Into<String>,
        target_neuron_id: impl Into<String>,
        weight: f64,
        creation_tick: u64,
    ) -> Result<Self, String> {
        Self::new(
            id,
            source_neuron_id,
            target_neuron_id,
            weight,
            SynapseType::Inhibitory,
            creation_tick,
        )
    }

    fn new(
        id: impl Into<String>,
        source_neuron_id: impl Into<String>,
        target_neuron_id: impl Into<String>,
        weight: f64,
        synapse_type: SynapseType,
        creation_tick: u64,
    ) -> Result<Self, String> {
        let source_neuron_id = source_neuron_id.into();
        let target_neuron_id = target_neuron_id.into();

        if source_neuron_id == target_neuron_id {
            return Err("self-connections are not allowed".to_string());
        }

        if weight < MIN_WEIGHT || weight > MAX_WEIGHT {
            return Err(format!(
                "synapse weight must be between {MIN_WEIGHT} and {MAX_WEIGHT}"
            ));
        }

        let weight = (weight * 1000.0).round() / 1000.0;

        Ok(Self {
            id: id.into(),
            source_neuron_id,
            target_neuron_id,
            weight,
            synapse_type,
            usage_count: 0,
            last_activated_tick: None,
            stability: 0.5,
            health: 0.9,
            age: 0,
            creation_tick,
            weight_history: vec![WeightHistoryEntry {
                tick: creation_tick,
                weight,
            }],
            last_weight_delta: 0.0,
            pruning_risk: 0.0,
            inactivity_ticks: 0,
            low_weight_ticks: 0,
            low_health_ticks: 0,
            protected_until_tick: 0,
            pruning_status: PruningStatus::Protected,
            pruning_reasons: vec!["grace_period"],
        })
    }

    /// Signed millivolts delivered when the source fires (`± weight`).
    pub fn signed_amount_mv(&self) -> f64 {
        match self.synapse_type {
            SynapseType::Excitatory => self.weight,
            SynapseType::Inhibitory => -self.weight,
        }
    }

    pub fn advance_age(&mut self) {
        self.age = self.age.saturating_add(1);
        self.last_weight_delta = 0.0;
    }

    /// Record activation after a successful propagation.
    pub fn record_activation(&mut self, tick: u64) {
        self.usage_count = self.usage_count.saturating_add(1);
        self.last_activated_tick = Some(tick);
        self.health = (self.health + HEALTH_USE_DELTA).clamp(0.0, 1.0);
        self.stability = (self.stability + STABILITY_USE_DELTA).clamp(0.0, 1.0);
    }

    pub fn apply_hebbian_increase(&mut self, tick: u64) {
        self.set_weight(self.weight + HEBBIAN_DELTA, tick);
    }

    /// Idle decay for weight / health / stability when unused long enough.
    pub fn apply_idle_decay(&mut self, tick: u64) {
        let idle = match self.last_activated_tick {
            Some(last) => tick.saturating_sub(last),
            None => tick.saturating_sub(self.creation_tick),
        };

        if idle < UNUSED_TICKS_BEFORE_DECAY {
            return;
        }

        // Apply once per tick while idle beyond threshold.
        self.health = (self.health - HEALTH_IDLE_DELTA).clamp(0.0, 1.0);
        self.stability = (self.stability - STABILITY_IDLE_DELTA).clamp(0.0, 1.0);
        self.set_weight(self.weight - WEIGHT_DECAY, tick);
    }

    fn set_weight(&mut self, next: f64, tick: u64) {
        let clamped = next.clamp(MIN_WEIGHT, MAX_WEIGHT);
        let rounded = (clamped * 1000.0).round() / 1000.0;
        let delta = ((rounded - self.weight) * 1000.0).round() / 1000.0;
        if (delta).abs() < f64::EPSILON {
            return;
        }
        self.weight = rounded;
        self.last_weight_delta = delta;
        self.weight_history.push(WeightHistoryEntry {
            tick,
            weight: rounded,
        });
        while self.weight_history.len() > MAX_WEIGHT_HISTORY {
            self.weight_history.remove(0);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn inhibitory_delivers_negative_signed_amount() {
        let synapse =
            Synapse::inhibitory("SYNAPSE-005", "NEURON-004", "NEURON-005", 8.0, 0).unwrap();
        assert_eq!(synapse.synapse_type, SynapseType::Inhibitory);
        assert_eq!(synapse.signed_amount_mv(), -8.0);
    }

    #[test]
    fn hebbian_increase_respects_maximum() {
        let mut synapse =
            Synapse::excitatory("SYNAPSE-001", "NEURON-001", "NEURON-002", MAX_WEIGHT, 0)
                .unwrap();
        synapse.apply_hebbian_increase(1);
        assert_eq!(synapse.weight, MAX_WEIGHT);
        assert_eq!(synapse.last_weight_delta, 0.0);
    }

    #[test]
    fn idle_decay_respects_minimum() {
        let mut synapse =
            Synapse::excitatory("SYNAPSE-001", "NEURON-001", "NEURON-002", MIN_WEIGHT, 0)
                .unwrap();
        for tick in 1..=20 {
            synapse.advance_age();
            synapse.apply_idle_decay(tick);
        }
        assert_eq!(synapse.weight, MIN_WEIGHT);
    }

    #[test]
    fn activation_increments_usage_and_improves_health() {
        let mut synapse =
            Synapse::excitatory("SYNAPSE-001", "NEURON-001", "NEURON-002", 16.0, 0).unwrap();
        let before_health = synapse.health;
        let before_stability = synapse.stability;
        synapse.record_activation(3);
        assert_eq!(synapse.usage_count, 1);
        assert_eq!(synapse.last_activated_tick, Some(3));
        assert!(synapse.health > before_health);
        assert!(synapse.stability > before_stability);
    }
}
