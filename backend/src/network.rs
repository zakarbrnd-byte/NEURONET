//! Neural network owner — the only place that owns neurons and living synapses.

use chrono::Utc;
use serde::Serialize;
use uuid::Uuid;

use crate::neuron::{CellType, Neuron, NeuronStepResult, Position, TissueSeed};
use crate::structural::{
    evaluate_growth_candidates, evaluate_pruning_risk, record_coactivations, GrowthCandidate,
    PairActivity, StructuralPlasticityConfig, StructuralSnapshot,
};
use crate::synapse::{Synapse, SynapseType};

const MAX_EVENTS: usize = 200;
const TISSUE_REGION: &str = "Observatory Cortex";
const TISSUE_LABEL: &str = "Artificial Neural Tissue";

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct NetworkEvent {
    pub id: String,
    pub timestamp: String,
    pub network_tick: u64,
    #[serde(rename = "type")]
    pub event_type: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub neuron_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub source_neuron_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub target_neuron_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub amount_mv: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub entity_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub previous_status: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub new_status: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub readiness_or_risk: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reason_codes: Option<Vec<String>>,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct TissueInfo {
    pub label: String,
    pub region: String,
    pub alive: bool,
    pub cell_count: usize,
    pub synapse_count: usize,
    pub age_seconds: u64,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct NetworkSnapshot {
    pub tick: u64,
    pub neurons: Vec<Neuron>,
    pub synapses: Vec<Synapse>,
    pub tissue: TissueInfo,
    pub structural: StructuralSnapshot,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct PropagationTrace {
    pub event_id: String,
    pub synapse_id: String,
    pub source_neuron_id: String,
    pub target_neuron_id: String,
    pub amount_mv: f64,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct NetworkStepTrace {
    pub tick: u64,
    pub fired_neuron_ids: Vec<String>,
    pub propagations: Vec<PropagationTrace>,
    pub event_ids: Vec<String>,
    pub network: NetworkSnapshot,
}

#[derive(Debug)]
pub struct NeuralNetwork {
    neurons: Vec<Neuron>,
    synapses: Vec<Synapse>,
    tick: u64,
    events: Vec<NetworkEvent>,
    age_seconds: u64,
    /// Synapses that delivered last tick — Hebbian candidates if target fires now.
    pending_hebbian: Vec<String>,
    structural_config: StructuralPlasticityConfig,
    pair_activity: Vec<PairActivity>,
    growth_candidates: Vec<GrowthCandidate>,
    previous_fired: Vec<String>,
    latest_structural_evaluation_tick: Option<u64>,
}

impl NeuralNetwork {
    /// Deterministic five-neuron tissue with living synapses + structural observation (0.6C).
    pub fn initial() -> Self {
        Self::initial_with_age(0)
    }

    pub fn initial_with_age(age_seconds: u64) -> Self {
        let mut network = Self {
            neurons: Vec::new(),
            synapses: Vec::new(),
            tick: 0,
            events: Vec::new(),
            age_seconds,
            pending_hebbian: Vec::new(),
            structural_config: StructuralPlasticityConfig::default(),
            pair_activity: Vec::new(),
            growth_candidates: Vec::new(),
            previous_fired: Vec::new(),
            latest_structural_evaluation_tick: None,
        };

        let seeds = [
            (
                "NEURON-001",
                TissueSeed {
                    position: Position { x: 0.12, y: 0.50 },
                    region: TISSUE_REGION,
                    layer: 1,
                    cell_type: CellType::Excitatory,
                    dna_id: "DNA-001",
                    soma_radius: 0.036,
                    dendrite_radius: 0.092,
                    axon_length: 0.22,
                },
            ),
            (
                "NEURON-002",
                TissueSeed {
                    position: Position { x: 0.32, y: 0.50 },
                    region: TISSUE_REGION,
                    layer: 1,
                    cell_type: CellType::Excitatory,
                    dna_id: "DNA-002",
                    soma_radius: 0.038,
                    dendrite_radius: 0.095,
                    axon_length: 0.30,
                },
            ),
            (
                "NEURON-003",
                TissueSeed {
                    position: Position { x: 0.60, y: 0.28 },
                    region: TISSUE_REGION,
                    layer: 2,
                    cell_type: CellType::Excitatory,
                    dna_id: "DNA-003",
                    soma_radius: 0.034,
                    dendrite_radius: 0.088,
                    axon_length: 0.28,
                },
            ),
            (
                "NEURON-004",
                TissueSeed {
                    position: Position { x: 0.60, y: 0.72 },
                    region: TISSUE_REGION,
                    layer: 2,
                    cell_type: CellType::Inhibitory,
                    dna_id: "DNA-004",
                    soma_radius: 0.032,
                    dendrite_radius: 0.084,
                    axon_length: 0.28,
                },
            ),
            (
                "NEURON-005",
                TissueSeed {
                    position: Position { x: 0.88, y: 0.50 },
                    region: TISSUE_REGION,
                    layer: 3,
                    cell_type: CellType::Excitatory,
                    dna_id: "DNA-005",
                    soma_radius: 0.037,
                    dendrite_radius: 0.090,
                    axon_length: 0.12,
                },
            ),
        ];

        for (id, seed) in seeds {
            network.neurons.push(Neuron::with_tissue(id, seed));
        }

        let excitatory = [
            ("SYNAPSE-001", "NEURON-001", "NEURON-002", 16.0),
            ("SYNAPSE-002", "NEURON-002", "NEURON-003", 16.0),
            ("SYNAPSE-003", "NEURON-002", "NEURON-004", 16.0),
            ("SYNAPSE-004", "NEURON-003", "NEURON-005", 8.0),
        ];

        for (id, source, target, weight) in excitatory {
            network
                .add_synapse_unchecked(
                    Synapse::excitatory(id, source, target, weight, 0)
                        .expect("valid initial synapse"),
                )
                .expect("valid initial synapse");
        }

        network
            .add_synapse_unchecked(
                Synapse::inhibitory("SYNAPSE-005", "NEURON-004", "NEURON-005", 8.0, 0)
                    .expect("valid inhibitory synapse"),
            )
            .expect("valid inhibitory synapse");

        network.push_event(
            "network_ready",
            None,
            None,
            None,
            None,
            "Deterministic artificial neural tissue with living synapses ready",
        );

        network
    }

    pub fn set_age_seconds(&mut self, age_seconds: u64) {
        self.age_seconds = age_seconds;
    }

    pub fn age_seconds(&self) -> u64 {
        self.age_seconds
    }

    pub fn reset(&mut self) {
        let age = self.age_seconds;
        *self = Self::initial_with_age(age);
        self.events.clear();
        self.push_event(
            "network_reset",
            None,
            None,
            None,
            None,
            "Tissue reset to deterministic initial state",
        );
    }

    pub fn snapshot(&self) -> NetworkSnapshot {
        let mut neurons = self.neurons.clone();
        neurons.sort_by(|a, b| a.id.cmp(&b.id));

        let mut synapses = self.synapses.clone();
        synapses.sort_by(|a, b| a.id.cmp(&b.id));

        let region = neurons
            .first()
            .map(|n| n.region.clone())
            .unwrap_or_else(|| TISSUE_REGION.to_string());

        let at_risk = synapses
            .iter()
            .filter(|s| matches!(s.pruning_status, crate::synapse::PruningStatus::AtRisk))
            .count();

        NetworkSnapshot {
            tick: self.tick,
            tissue: TissueInfo {
                label: TISSUE_LABEL.to_string(),
                region,
                alive: true,
                cell_count: neurons.len(),
                synapse_count: synapses.len(),
                age_seconds: self.age_seconds,
            },
            structural: StructuralSnapshot {
                config: (&self.structural_config).into(),
                growth_candidates: {
                    let mut c = self.growth_candidates.clone();
                    c.sort_by(|a, b| a.id.cmp(&b.id));
                    c
                },
                latest_evaluation_tick: self.latest_structural_evaluation_tick,
                candidate_count: self.growth_candidates.len(),
                at_risk_synapse_count: at_risk,
            },
            neurons,
            synapses,
        }
    }

    pub fn events_newest_first(&self) -> Vec<NetworkEvent> {
        let mut events = self.events.clone();
        events.reverse();
        events
    }

    pub fn inject_signal(&mut self, neuron_id: &str, amount_mv: f64) -> Result<(), String> {
        if amount_mv <= 0.0 {
            return Err("amountMv must be greater than zero".to_string());
        }

        let neuron = self
            .neurons
            .iter_mut()
            .find(|n| n.id == neuron_id)
            .ok_or_else(|| format!("unknown neuron id: {neuron_id}"))?;

        neuron.receive_signal(amount_mv);

        self.push_event(
            "signal_injected",
            Some(neuron_id.to_string()),
            None,
            None,
            Some(amount_mv),
            format!("Injected +{amount_mv} mV into {neuron_id}"),
        );

        Ok(())
    }

    /// Advance the whole network by exactly one tick using two-phase updates.
    pub fn step(&mut self) -> NetworkStepTrace {
        self.tick = self.tick.saturating_add(1);
        let mut event_ids: Vec<String> = Vec::new();

        for synapse in &mut self.synapses {
            synapse.advance_age();
        }

        let mut ordered_indexes: Vec<usize> = (0..self.neurons.len()).collect();
        ordered_indexes.sort_by(|&a, &b| self.neurons[a].id.cmp(&self.neurons[b].id));

        let mut fired_ids: Vec<String> = Vec::new();

        for index in ordered_indexes {
            let neuron_id = self.neurons[index].id.clone();
            let result = self.neurons[index].step();

            match result {
                NeuronStepResult::Fired => {
                    fired_ids.push(neuron_id.clone());
                    event_ids.push(self.push_event(
                        "neuron_fired",
                        Some(neuron_id.clone()),
                        None,
                        None,
                        None,
                        format!("{neuron_id} fired"),
                    ));
                    event_ids.push(self.push_event(
                        "neuron_refractory",
                        Some(neuron_id),
                        None,
                        None,
                        None,
                        "Neuron entered refractory state",
                    ));
                }
                NeuronStepResult::Resting => {
                    event_ids.push(self.push_event(
                        "neuron_resting",
                        Some(neuron_id),
                        None,
                        None,
                        None,
                        "Neuron resting in refractory period",
                    ));
                }
                NeuronStepResult::Recovered => {
                    event_ids.push(self.push_event(
                        "neuron_recovered",
                        Some(neuron_id),
                        None,
                        None,
                        None,
                        "Neuron recovered toward resting potential",
                    ));
                }
            }
        }

        fired_ids.sort();

        // Hebbian: prior delivery + target firing in this activation sequence.
        let pending = std::mem::take(&mut self.pending_hebbian);
        let mut strength_events: Vec<(String, String, String, f64, f64)> = Vec::new();
        for synapse_id in pending {
            if let Some(synapse) = self.synapses.iter_mut().find(|s| s.id == synapse_id) {
                if fired_ids.iter().any(|id| id == &synapse.target_neuron_id) {
                    let before = synapse.weight;
                    synapse.apply_hebbian_increase(self.tick);
                    if (synapse.weight - before).abs() > f64::EPSILON {
                        strength_events.push((
                            synapse.id.clone(),
                            synapse.source_neuron_id.clone(),
                            synapse.target_neuron_id.clone(),
                            before,
                            synapse.weight,
                        ));
                    }
                }
            }
        }
        for (_id, source, target, before, after) in strength_events {
            event_ids.push(self.push_event(
                "synapse_strengthened",
                None,
                Some(source),
                Some(target),
                Some(after),
                format!("synapse weight {before:.3} → {after:.3}"),
            ));
        }

        let deliveries: Vec<(String, String, String, f64)> = fired_ids
            .iter()
            .flat_map(|source_id| {
                let mut outs: Vec<_> = self
                    .synapses
                    .iter()
                    .filter(|s| s.source_neuron_id == *source_id)
                    .map(|s| {
                        (
                            s.id.clone(),
                            s.source_neuron_id.clone(),
                            s.target_neuron_id.clone(),
                            s.signed_amount_mv(),
                        )
                    })
                    .collect();
                outs.sort_by(|a, b| a.2.cmp(&b.2));
                outs
            })
            .collect();

        let mut propagations: Vec<PropagationTrace> = Vec::new();
        let mut activated_ids: Vec<String> = Vec::new();

        for (synapse_id, source_id, target_id, amount_mv) in deliveries {
            if let Some(target) = self.neurons.iter_mut().find(|n| n.id == target_id) {
                target.receive_signal(amount_mv);
            }

            if let Some(synapse) = self.synapses.iter_mut().find(|s| s.id == synapse_id) {
                synapse.record_activation(self.tick);
            }

            activated_ids.push(synapse_id.clone());
            self.pending_hebbian.push(synapse_id.clone());

            let sign = if amount_mv >= 0.0 { "+" } else { "" };
            let event_id = self.push_event(
                "signal_propagated",
                Some(target_id.clone()),
                Some(source_id.clone()),
                Some(target_id.clone()),
                Some(amount_mv),
                format!("{source_id} → {target_id} ({sign}{amount_mv} mV)"),
            );
            event_ids.push(event_id.clone());
            propagations.push(PropagationTrace {
                event_id,
                synapse_id,
                source_neuron_id: source_id,
                target_neuron_id: target_id,
                amount_mv,
            });
        }

        // Idle decay for synapses that did not activate this tick.
        let activated: std::collections::HashSet<String> = activated_ids.iter().cloned().collect();
        let mut weaken_events: Vec<(String, String, f64, f64)> = Vec::new();
        for synapse in &mut self.synapses {
            if !activated.contains(&synapse.id) {
                let before = synapse.weight;
                synapse.apply_idle_decay(self.tick);
                if synapse.weight < before {
                    weaken_events.push((
                        synapse.source_neuron_id.clone(),
                        synapse.target_neuron_id.clone(),
                        before,
                        synapse.weight,
                    ));
                }
            }
        }
        for (source, target, before, after) in weaken_events {
            event_ids.push(self.push_event(
                "synapse_weakened",
                None,
                Some(source),
                Some(target),
                Some(after),
                format!("synapse weight {before:.3} → {after:.3}"),
            ));
        }

        // Structural plasticity foundations (0.6C): observe only — no create/delete.
        let previous = std::mem::take(&mut self.previous_fired);
        record_coactivations(&mut self.pair_activity, &previous, &fired_ids, self.tick);
        self.previous_fired = fired_ids.clone();

        let interval = self.structural_config.evaluation_interval_ticks.max(1);
        if self.structural_config.enabled && self.tick % interval == 0 {
            let synapse_count_before = self.synapses.len();
            let growth_events = evaluate_growth_candidates(
                &self.structural_config,
                &self.neurons,
                &self.synapses,
                &mut self.pair_activity,
                &mut self.growth_candidates,
                self.tick,
            );
            let pruning_events =
                evaluate_pruning_risk(&self.structural_config, &mut self.synapses, self.tick);
            self.latest_structural_evaluation_tick = Some(self.tick);

            for event in growth_events.into_iter().chain(pruning_events) {
                event_ids.push(self.push_structural_event(event));
            }

            // Hard invariant for 0.6C: structure observation never mutates topology.
            debug_assert_eq!(self.synapses.len(), synapse_count_before);
        }

        NetworkStepTrace {
            tick: self.tick,
            fired_neuron_ids: fired_ids,
            propagations,
            event_ids,
            network: self.snapshot(),
        }
    }

    fn add_synapse_unchecked(&mut self, synapse: Synapse) -> Result<(), String> {
        self.validate_synapse(&synapse)?;
        self.synapses.push(synapse);
        Ok(())
    }

    pub fn add_synapse(&mut self, synapse: Synapse) -> Result<(), String> {
        self.add_synapse_unchecked(synapse)
    }

    fn validate_synapse(&self, synapse: &Synapse) -> Result<(), String> {
        if synapse.source_neuron_id == synapse.target_neuron_id {
            return Err("self-connections are not allowed".to_string());
        }

        if !matches!(
            synapse.synapse_type,
            SynapseType::Excitatory | SynapseType::Inhibitory
        ) {
            return Err("unsupported synapse type".to_string());
        }

        if !self
            .neurons
            .iter()
            .any(|n| n.id == synapse.source_neuron_id)
        {
            return Err(format!(
                "missing source neuron: {}",
                synapse.source_neuron_id
            ));
        }

        if !self
            .neurons
            .iter()
            .any(|n| n.id == synapse.target_neuron_id)
        {
            return Err(format!(
                "missing target neuron: {}",
                synapse.target_neuron_id
            ));
        }

        let duplicate = self.synapses.iter().any(|s| {
            s.source_neuron_id == synapse.source_neuron_id
                && s.target_neuron_id == synapse.target_neuron_id
        });

        if duplicate {
            return Err("duplicate directed synapse is not allowed".to_string());
        }

        Ok(())
    }

    fn push_event(
        &mut self,
        event_type: &str,
        neuron_id: Option<String>,
        source_neuron_id: Option<String>,
        target_neuron_id: Option<String>,
        amount_mv: Option<f64>,
        message: impl Into<String>,
    ) -> String {
        self.push_event_full(
            event_type,
            neuron_id,
            source_neuron_id,
            target_neuron_id,
            amount_mv,
            None,
            None,
            None,
            None,
            None,
            message,
        )
    }

    fn push_structural_event(&mut self, event: crate::structural::StructuralEvent) -> String {
        self.push_event_full(
            event.event_type,
            None,
            event.source_neuron_id,
            event.target_neuron_id,
            None,
            Some(event.entity_id),
            event.previous_status,
            event.new_status,
            event.metric,
            Some(event.reason_codes.into_iter().map(str::to_string).collect()),
            event.message,
        )
    }

    #[allow(clippy::too_many_arguments)]
    fn push_event_full(
        &mut self,
        event_type: &str,
        neuron_id: Option<String>,
        source_neuron_id: Option<String>,
        target_neuron_id: Option<String>,
        amount_mv: Option<f64>,
        entity_id: Option<String>,
        previous_status: Option<String>,
        new_status: Option<String>,
        readiness_or_risk: Option<f64>,
        reason_codes: Option<Vec<String>>,
        message: impl Into<String>,
    ) -> String {
        let id = Uuid::new_v4().to_string();
        self.events.push(NetworkEvent {
            id: id.clone(),
            timestamp: Utc::now().to_rfc3339(),
            network_tick: self.tick,
            event_type: event_type.to_string(),
            neuron_id,
            source_neuron_id,
            target_neuron_id,
            amount_mv,
            entity_id,
            previous_status,
            new_status,
            readiness_or_risk,
            reason_codes,
            message: message.into(),
        });

        while self.events.len() > MAX_EVENTS {
            self.events.remove(0);
        }

        id
    }

    pub fn event_count(&self) -> usize {
        self.events.len()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::synapse::{MAX_WEIGHT, MIN_WEIGHT};

    fn ids(snapshot: &NetworkSnapshot) -> Vec<String> {
        snapshot.neurons.iter().map(|n| n.id.clone()).collect()
    }

    fn membrane_of(network: &NeuralNetwork, id: &str) -> f64 {
        network
            .neurons
            .iter()
            .find(|n| n.id == id)
            .map(|n| n.membrane_potential_mv)
            .expect("neuron exists")
    }

    fn synapse<'a>(network: &'a NeuralNetwork, id: &str) -> &'a Synapse {
        network
            .synapses
            .iter()
            .find(|s| s.id == id)
            .expect("synapse exists")
    }

    #[test]
    fn initial_network_has_five_neurons_and_five_synapses() {
        let network = NeuralNetwork::initial();
        let snap = network.snapshot();
        assert_eq!(snap.neurons.len(), 5);
        assert_eq!(snap.synapses.len(), 5);
        assert_eq!(
            ids(&snap),
            vec![
                "NEURON-001",
                "NEURON-002",
                "NEURON-003",
                "NEURON-004",
                "NEURON-005"
            ]
        );
        assert!(snap.synapses.iter().all(|s| s.usage_count == 0));
        assert!(snap.synapses.iter().all(|s| s.age == 0));
        assert!(snap.synapses.iter().all(|s| (s.health - 0.9).abs() < 1e-9));
    }

    #[test]
    fn reset_restores_identical_topology_and_synapse_state() {
        let mut network = NeuralNetwork::initial();
        network.inject_signal("NEURON-001", 20.0).unwrap();
        network.step();
        network.reset();

        let snap = network.snapshot();
        assert_eq!(snap.tick, 0);
        assert_eq!(snap.synapses.len(), 5);
        assert!(snap
            .neurons
            .iter()
            .all(|n| n.membrane_potential_mv == -70.0));
        let s1 = snap
            .synapses
            .iter()
            .find(|s| s.id == "SYNAPSE-001")
            .unwrap();
        assert_eq!(s1.weight, 16.0);
        assert_eq!(s1.usage_count, 0);
        assert_eq!(s1.age, 0);
        assert_eq!(
            snap.synapses
                .iter()
                .find(|s| s.id == "SYNAPSE-005")
                .unwrap()
                .synapse_type,
            SynapseType::Inhibitory
        );
    }

    #[test]
    fn tissue_positions_are_deterministic() {
        let a = NeuralNetwork::initial().snapshot();
        let b = NeuralNetwork::initial().snapshot();
        for (na, nb) in a.neurons.iter().zip(b.neurons.iter()) {
            assert_eq!(na.position, nb.position);
        }
        assert_eq!(a.synapses, b.synapses);
        assert_eq!(a.tissue.synapse_count, 5);
    }

    #[test]
    fn reset_preserves_process_age_and_restores_positions() {
        let mut network = NeuralNetwork::initial_with_age(42);
        network.inject_signal("NEURON-001", 20.0).unwrap();
        network.step();
        network.reset();
        assert_eq!(network.age_seconds(), 42);
        let n1 = network
            .snapshot()
            .neurons
            .into_iter()
            .find(|n| n.id == "NEURON-001")
            .unwrap();
        assert_eq!(n1.position.x, 0.12);
    }

    #[test]
    fn rejects_self_and_duplicate_synapses() {
        let mut network = NeuralNetwork::initial();
        assert!(Synapse::excitatory("BAD", "NEURON-001", "NEURON-001", 5.0, 0).is_err());
        let duplicate =
            Synapse::excitatory("SYNAPSE-DUP", "NEURON-001", "NEURON-002", 16.0, 0).unwrap();
        assert!(network
            .add_synapse(duplicate)
            .unwrap_err()
            .contains("duplicate"));
    }

    #[test]
    fn propagation_increments_usage_and_age() {
        let mut network = NeuralNetwork::initial();
        network.inject_signal("NEURON-001", 20.0).unwrap();
        network.step();
        let s1 = synapse(&network, "SYNAPSE-001");
        assert_eq!(s1.usage_count, 1);
        assert_eq!(s1.last_activated_tick, Some(1));
        assert_eq!(s1.age, 1);
        assert!(s1.health > 0.9);
        assert!(s1.stability > 0.5);
    }

    #[test]
    fn hebbian_strengthens_when_target_fires_next_tick() {
        let mut network = NeuralNetwork::initial();
        network.inject_signal("NEURON-001", 20.0).unwrap();
        network.step(); // SYNAPSE-001 delivers
        assert_eq!(synapse(&network, "SYNAPSE-001").weight, 16.0);
        network.step(); // NEURON-002 fires → Hebbian on SYNAPSE-001
        let s1 = synapse(&network, "SYNAPSE-001");
        assert!((s1.weight - 16.1).abs() < 1e-9);
        assert!((s1.last_weight_delta - 0.1).abs() < 1e-9);
        assert!(s1.weight_history.len() >= 2);
    }

    #[test]
    fn unused_synapses_decay_weight_health_stability_after_idle_window() {
        let mut network = NeuralNetwork::initial();
        // Quiet steps — no firings.
        for _ in 0..10 {
            network.step();
        }
        let s1 = synapse(&network, "SYNAPSE-001");
        assert_eq!(s1.age, 10);
        assert!(s1.weight < 16.0);
        assert!(s1.health < 1.0);
        assert!(s1.stability < 0.5);
        assert!(s1.weight >= MIN_WEIGHT);
    }

    #[test]
    fn weight_clamps_are_enforced_deterministically() {
        let mut network = NeuralNetwork::initial();
        // Drive SYNAPSE-001 many Hebbian cycles via repeated cascade starts.
        for _ in 0..300 {
            network.reset();
            network.inject_signal("NEURON-001", 20.0).unwrap();
            network.step();
            network.step();
            // Manually push weight toward max via repeated Hebbian on same pending pattern
            if let Some(s) = network.synapses.iter_mut().find(|s| s.id == "SYNAPSE-001") {
                s.apply_hebbian_increase(network.tick);
            }
        }
        assert!(synapse(&network, "SYNAPSE-001").weight <= MAX_WEIGHT);

        let mut idle = NeuralNetwork::initial();
        for _ in 0..500 {
            idle.step();
        }
        assert!(synapse(&idle, "SYNAPSE-001").weight >= MIN_WEIGHT);
    }

    #[test]
    fn deterministic_cascade_by_tick() {
        let mut network = NeuralNetwork::initial();
        network.inject_signal("NEURON-001", 20.0).unwrap();

        let t1 = network.step();
        assert_eq!(t1.fired_neuron_ids, vec!["NEURON-001"]);
        assert_eq!(t1.propagations[0].amount_mv, 16.0);
        assert_eq!(t1.propagations[0].synapse_id, "SYNAPSE-001");

        let t2 = network.step();
        assert_eq!(t2.fired_neuron_ids, vec!["NEURON-002"]);
        assert_eq!(t2.propagations.len(), 2);

        let t3 = network.step();
        assert_eq!(t3.fired_neuron_ids, vec!["NEURON-003", "NEURON-004"]);
        let to_005: Vec<_> = t3
            .propagations
            .iter()
            .filter(|p| p.target_neuron_id == "NEURON-005")
            .collect();
        assert_eq!(to_005.len(), 2);
        assert!(to_005.iter().any(|p| p.amount_mv == 8.0));
        assert!(to_005.iter().any(|p| p.amount_mv == -8.0));
        assert_eq!(membrane_of(&network, "NEURON-005"), -70.0);
    }

    #[test]
    fn identical_inputs_produce_identical_snapshots_and_structural_traces() {
        let mut a = NeuralNetwork::initial();
        let mut b = NeuralNetwork::initial();
        a.inject_signal("NEURON-001", 20.0).unwrap();
        b.inject_signal("NEURON-001", 20.0).unwrap();

        for _ in 0..6 {
            let ta = a.step();
            let tb = b.step();
            assert_eq!(ta.fired_neuron_ids, tb.fired_neuron_ids);
            assert_eq!(ta.propagations.len(), tb.propagations.len());
            for (pa, pb) in ta.propagations.iter().zip(tb.propagations.iter()) {
                assert_eq!(pa.synapse_id, pb.synapse_id);
                assert_eq!(pa.source_neuron_id, pb.source_neuron_id);
                assert_eq!(pa.target_neuron_id, pb.target_neuron_id);
                assert_eq!(pa.amount_mv, pb.amount_mv);
            }
            assert_eq!(ta.network.synapses, tb.network.synapses);
        }
    }

    #[test]
    fn event_buffer_never_exceeds_200() {
        let mut network = NeuralNetwork::initial();
        for _ in 0..300 {
            network.inject_signal("NEURON-001", 1.0).unwrap();
            network.step();
        }
        assert!(network.event_count() <= 200);
    }

    #[test]
    fn structural_evaluation_never_creates_or_deletes_synapses() {
        let mut network = NeuralNetwork::initial();
        let before = network.snapshot().synapses.len();
        for _ in 0..40 {
            network.inject_signal("NEURON-001", 20.0).unwrap();
            network.step();
            network.step();
            network.step();
        }
        let snap = network.snapshot();
        assert_eq!(snap.synapses.len(), before);
        assert_eq!(
            snap.synapses
                .iter()
                .map(|s| s.id.clone())
                .collect::<Vec<_>>(),
            vec![
                "SYNAPSE-001",
                "SYNAPSE-002",
                "SYNAPSE-003",
                "SYNAPSE-004",
                "SYNAPSE-005"
            ]
        );
    }

    #[test]
    fn repeated_coactivation_can_produce_growth_candidates() {
        let mut network = NeuralNetwork::initial();
        // Drive NEURON-001 and NEURON-005 which have no directed synapse either way.
        for _ in 0..30 {
            network.inject_signal("NEURON-001", 20.0).unwrap();
            network.inject_signal("NEURON-005", 20.0).unwrap();
            network.step();
        }
        let snap = network.snapshot();
        assert!(
            snap.structural.candidate_count > 0
                || snap
                    .structural
                    .growth_candidates
                    .iter()
                    .any(|c| c.source_neuron_id == "NEURON-001"
                        || c.target_neuron_id == "NEURON-005"),
            "expected at least one observed growth candidate after coactivation"
        );
        // No duplicate of existing directed edges.
        for c in &snap.structural.growth_candidates {
            assert!(!(c.source_neuron_id == "NEURON-001" && c.target_neuron_id == "NEURON-002"));
        }
    }

    #[test]
    fn candidate_positions_match_backend_neuron_positions() {
        let mut network = NeuralNetwork::initial();
        for _ in 0..25 {
            network.inject_signal("NEURON-001", 20.0).unwrap();
            network.inject_signal("NEURON-005", 20.0).unwrap();
            network.step();
        }
        let snap = network.snapshot();
        for c in &snap.structural.growth_candidates {
            let source = snap
                .neurons
                .iter()
                .find(|n| n.id == c.source_neuron_id)
                .unwrap();
            let target = snap
                .neurons
                .iter()
                .find(|n| n.id == c.target_neuron_id)
                .unwrap();
            let expected = ((source.position.x - target.position.x).powi(2)
                + (source.position.y - target.position.y).powi(2))
            .sqrt();
            assert!((c.distance - expected).abs() < 0.002);
        }
    }

    #[test]
    fn grace_period_keeps_initial_synapses_protected() {
        let mut network = NeuralNetwork::initial();
        // Evaluate within grace window.
        for _ in 0..5 {
            network.step();
        }
        let snap = network.snapshot();
        assert!(snap
            .synapses
            .iter()
            .all(|s| s.pruning_status == crate::synapse::PruningStatus::Protected));
    }

    #[test]
    fn idle_synapses_accumulate_pruning_evidence_after_grace() {
        let mut network = NeuralNetwork::initial();
        for _ in 0..40 {
            network.step();
        }
        let snap = network.snapshot();
        let s4 = snap
            .synapses
            .iter()
            .find(|s| s.id == "SYNAPSE-004")
            .unwrap();
        assert!(matches!(
            s4.pruning_status,
            crate::synapse::PruningStatus::Monitoring | crate::synapse::PruningStatus::AtRisk
        ));
        assert!(s4.pruning_risk > 0.0);
        assert!(!s4.pruning_reasons.is_empty());
    }

    #[test]
    fn active_synapses_avoid_high_pruning_risk() {
        let mut network = NeuralNetwork::initial();
        for _ in 0..20 {
            network.inject_signal("NEURON-001", 20.0).unwrap();
            network.step();
            network.step();
            network.step();
        }
        let s1 = synapse(&network, "SYNAPSE-001");
        assert!(s1.pruning_risk < 0.55);
        assert_ne!(s1.pruning_status, crate::synapse::PruningStatus::AtRisk);
    }

    #[test]
    fn reset_clears_candidates_and_pair_history() {
        let mut network = NeuralNetwork::initial();
        for _ in 0..30 {
            network.inject_signal("NEURON-001", 20.0).unwrap();
            network.inject_signal("NEURON-005", 20.0).unwrap();
            network.step();
        }
        assert!(
            !network.snapshot().structural.growth_candidates.is_empty()
                || network.pair_activity_len_for_test() > 0
        );
        network.reset();
        let snap = network.snapshot();
        assert!(snap.structural.growth_candidates.is_empty());
        assert_eq!(snap.structural.candidate_count, 0);
        assert_eq!(snap.structural.latest_evaluation_tick, None);
        assert_eq!(network.pair_activity_len_for_test(), 0);
        assert!(snap.synapses.iter().all(|s| s.pruning_status
            == crate::synapse::PruningStatus::Protected
            || s.pruning_risk == 0.0));
    }

    #[test]
    fn identical_sequences_yield_identical_structural_state() {
        let mut a = NeuralNetwork::initial();
        let mut b = NeuralNetwork::initial();
        for _ in 0..20 {
            a.inject_signal("NEURON-001", 20.0).unwrap();
            b.inject_signal("NEURON-001", 20.0).unwrap();
            a.inject_signal("NEURON-005", 20.0).unwrap();
            b.inject_signal("NEURON-005", 20.0).unwrap();
            let ta = a.step();
            let tb = b.step();
            assert_eq!(ta.network.structural, tb.network.structural);
            assert_eq!(ta.network.synapses, tb.network.synapses);
        }
    }

    #[test]
    fn structural_events_include_reason_codes() {
        let mut network = NeuralNetwork::initial();
        let mut saw_structural = false;
        for _ in 0..20 {
            let trace = network.step();
            if trace.tick % 5 != 0 {
                continue;
            }
            let events = network.events_newest_first();
            for event_id in &trace.event_ids {
                if let Some(event) = events.iter().find(|e| e.id == *event_id) {
                    if event.event_type.starts_with("growth_candidate_")
                        || event.event_type.starts_with("synapse_pruning_")
                    {
                        saw_structural = true;
                        assert!(event
                            .reason_codes
                            .as_ref()
                            .map(|r| !r.is_empty())
                            .unwrap_or(false));
                    }
                }
            }
        }
        assert!(saw_structural);
    }
}

impl NeuralNetwork {
    #[cfg(test)]
    fn pair_activity_len_for_test(&self) -> usize {
        self.pair_activity.len()
    }
}
