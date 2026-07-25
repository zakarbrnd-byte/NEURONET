//! Educational biological neuron model (millivolt approximation).
//!
//! This is NOT a complete biophysical simulation. It is a beginner-friendly
//! model that makes resting potential, depolarization, firing, and recovery
//! visible and testable.

use serde::Serialize;

/// Membrane potential moves this many mV toward rest each recovery step.
pub const RECOVERY_MV: f64 = 2.0;

/// Fatigue recovered toward zero each recovery/resting step.
pub const FATIGUE_RECOVERY: f64 = 0.05;

/// Fatigue gained when the neuron fires.
pub const FIRE_FATIGUE: f64 = 0.2;

/// Maximum fatigue allowed in this educational model.
pub const MAX_FATIGUE: f64 = 10.0;

/// Refractory period after firing, in ticks.
pub const REFRACTORY_PERIOD: u32 = 2;

/// Safe membrane potential range (mV).
pub const MIN_MEMBRANE_MV: f64 = -90.0;
pub const MAX_MEMBRANE_MV: f64 = 40.0;

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Neuron {
    pub id: String,
    pub resting_potential_mv: f64,
    pub membrane_potential_mv: f64,
    pub threshold_mv: f64,
    pub energy: f64,
    pub fatigue: f64,
    pub refractory_ticks: u32,
    pub fired: bool,
    pub tick: u64,
}

impl Neuron {
    pub fn new(id: impl Into<String>) -> Self {
        Self {
            id: id.into(),
            resting_potential_mv: -70.0,
            membrane_potential_mv: -70.0,
            threshold_mv: -55.0,
            energy: 100.0,
            fatigue: 0.0,
            refractory_ticks: 0,
            fired: false,
            tick: 0,
        }
    }

    /// Positive signals depolarize (raise) membrane potential.
    /// Zero and negative input are ignored in Version 0.4.
    pub fn receive_signal(&mut self, amount_mv: f64) {
        if amount_mv <= 0.0 {
            return;
        }

        self.membrane_potential_mv += amount_mv;
        self.clamp();
    }

    /// Advance this neuron by exactly one tick.
    ///
    /// Returns a simple outcome label for event logging.
    pub fn step(&mut self) -> NeuronStepResult {
        self.tick = self.tick.saturating_add(1);

        if self.refractory_ticks > 0 {
            self.refractory_ticks -= 1;
            self.fired = false;
            self.move_toward_rest();
            self.recover_fatigue();
            self.clamp();
            return NeuronStepResult::Resting;
        }

        if self.membrane_potential_mv >= self.threshold_mv {
            self.fire();
            self.clamp();
            return NeuronStepResult::Fired;
        }

        self.fired = false;
        self.move_toward_rest();
        self.recover_fatigue();
        self.clamp();
        NeuronStepResult::Recovered
    }

    fn fire(&mut self) {
        self.fired = true;
        self.membrane_potential_mv = self.resting_potential_mv;
        self.energy = (self.energy - 1.0).max(0.0);
        self.fatigue += FIRE_FATIGUE;
        self.refractory_ticks = REFRACTORY_PERIOD;
    }

    fn move_toward_rest(&mut self) {
        let rest = self.resting_potential_mv;
        let current = self.membrane_potential_mv;

        if (current - rest).abs() <= RECOVERY_MV {
            self.membrane_potential_mv = rest;
            return;
        }

        if current > rest {
            self.membrane_potential_mv = current - RECOVERY_MV;
        } else {
            self.membrane_potential_mv = current + RECOVERY_MV;
        }
    }

    fn recover_fatigue(&mut self) {
        self.fatigue = (self.fatigue - FATIGUE_RECOVERY).max(0.0);
    }

    fn clamp(&mut self) {
        self.membrane_potential_mv = self
            .membrane_potential_mv
            .clamp(MIN_MEMBRANE_MV, MAX_MEMBRANE_MV);
        self.energy = self.energy.clamp(0.0, 100.0);
        self.fatigue = self.fatigue.clamp(0.0, MAX_FATIGUE);
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum NeuronStepResult {
    Fired,
    Resting,
    Recovered,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn starts_at_resting_potential() {
        let neuron = Neuron::new("NEURON-001");
        assert_eq!(neuron.membrane_potential_mv, -70.0);
        assert_eq!(neuron.resting_potential_mv, -70.0);
        assert_eq!(neuron.threshold_mv, -55.0);
        assert_eq!(neuron.energy, 100.0);
        assert_eq!(neuron.fatigue, 0.0);
        assert_eq!(neuron.refractory_ticks, 0);
        assert!(!neuron.fired);
        assert_eq!(neuron.tick, 0);
    }

    #[test]
    fn weak_signal_changes_membrane_potential() {
        let mut neuron = Neuron::new("NEURON-001");
        neuron.receive_signal(5.0);
        assert_eq!(neuron.membrane_potential_mv, -65.0);
    }

    #[test]
    fn ignores_zero_and_negative_signals() {
        let mut neuron = Neuron::new("NEURON-001");
        neuron.receive_signal(0.0);
        neuron.receive_signal(-3.0);
        assert_eq!(neuron.membrane_potential_mv, -70.0);
    }

    #[test]
    fn threshold_crossing_causes_firing() {
        let mut neuron = Neuron::new("NEURON-001");
        neuron.receive_signal(20.0); // -50 mV, above -55
        let result = neuron.step();
        assert_eq!(result, NeuronStepResult::Fired);
        assert!(neuron.fired);
        assert_eq!(neuron.membrane_potential_mv, -70.0);
        assert_eq!(neuron.energy, 99.0);
        assert!((neuron.fatigue - 0.2).abs() < f64::EPSILON);
        assert_eq!(neuron.refractory_ticks, 2);
        assert_eq!(neuron.tick, 1);
    }

    #[test]
    fn firing_resets_membrane_potential() {
        let mut neuron = Neuron::new("NEURON-001");
        neuron.receive_signal(20.0);
        neuron.step();
        assert_eq!(neuron.membrane_potential_mv, neuron.resting_potential_mv);
    }

    #[test]
    fn refractory_prevents_immediate_refiring() {
        let mut neuron = Neuron::new("NEURON-001");
        neuron.receive_signal(20.0);
        neuron.step();
        neuron.receive_signal(20.0);
        let result = neuron.step();
        assert_eq!(result, NeuronStepResult::Resting);
        assert!(!neuron.fired);
        assert_eq!(neuron.refractory_ticks, 1);
        assert_eq!(neuron.energy, 99.0);
    }

    #[test]
    fn recovery_moves_potential_toward_rest() {
        let mut neuron = Neuron::new("NEURON-001");
        neuron.receive_signal(5.0); // -65
        let result = neuron.step();
        assert_eq!(result, NeuronStepResult::Recovered);
        assert!(!neuron.fired);
        assert_eq!(neuron.membrane_potential_mv, -67.0);
    }

    #[test]
    fn energy_never_becomes_negative() {
        let mut neuron = Neuron::new("NEURON-001");
        for _ in 0..120 {
            while neuron.refractory_ticks > 0 {
                neuron.step();
            }
            neuron.receive_signal(20.0);
            neuron.step();
        }
        assert_eq!(neuron.energy, 0.0);
        assert!(neuron.energy >= 0.0);
    }
}
