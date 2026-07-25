//! Neural network owner — the only place that owns neurons and connections.

use chrono::Utc;
use serde::Serialize;
use uuid::Uuid;

use crate::connection::{Connection, ConnectionType};
use crate::neuron::{CellType, Neuron, NeuronStepResult, Position, TissueSeed};

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
    pub connections: Vec<Connection>,
    pub tissue: TissueInfo,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct PropagationTrace {
    pub event_id: String,
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
    connections: Vec<Connection>,
    tick: u64,
    events: Vec<NetworkEvent>,
    /// Seconds since the backend process started this tissue clock.
    /// Reset recreates cells but does not rewind process age.
    age_seconds: u64,
}

impl NeuralNetwork {
    /// Deterministic five-neuron Artificial Neural Tissue (0.6A).
    ///
    /// Fixed positions, one inhibitory cell (NEURON-004), and fixed morphology.
    /// Reset rebuilds the identical tissue layout.
    pub fn initial() -> Self {
        Self::initial_with_age(0)
    }

    pub fn initial_with_age(age_seconds: u64) -> Self {
        let mut network = Self {
            neurons: Vec::new(),
            connections: Vec::new(),
            tick: 0,
            events: Vec::new(),
            age_seconds,
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
            ("CONNECTION-001", "NEURON-001", "NEURON-002", 16.0),
            ("CONNECTION-002", "NEURON-002", "NEURON-003", 16.0),
            ("CONNECTION-003", "NEURON-002", "NEURON-004", 16.0),
            ("CONNECTION-004", "NEURON-003", "NEURON-005", 8.0),
        ];

        for (id, source, target, weight) in excitatory {
            network
                .add_connection_unchecked(
                    Connection::excitatory(id, source, target, weight)
                        .expect("valid initial connection"),
                )
                .expect("valid initial connection");
        }

        network
            .add_connection_unchecked(
                Connection::inhibitory("CONNECTION-005", "NEURON-004", "NEURON-005", 8.0)
                    .expect("valid inhibitory connection"),
            )
            .expect("valid inhibitory connection");

        network.push_event(
            "network_ready",
            None,
            None,
            None,
            None,
            "Deterministic artificial neural tissue ready",
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

        let mut connections = self.connections.clone();
        connections.sort_by(|a, b| a.id.cmp(&b.id));

        let region = neurons
            .first()
            .map(|n| n.region.clone())
            .unwrap_or_else(|| TISSUE_REGION.to_string());

        NetworkSnapshot {
            tick: self.tick,
            tissue: TissueInfo {
                label: TISSUE_LABEL.to_string(),
                region,
                alive: true,
                cell_count: neurons.len(),
                synapse_count: connections.len(),
                age_seconds: self.age_seconds,
            },
            neurons,
            connections,
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

        let deliveries: Vec<(String, String, f64)> = fired_ids
            .iter()
            .flat_map(|source_id| {
                let mut outs: Vec<_> = self
                    .connections
                    .iter()
                    .filter(|c| c.source_neuron_id == *source_id)
                    .map(|c| {
                        (
                            c.source_neuron_id.clone(),
                            c.target_neuron_id.clone(),
                            c.signed_amount_mv(),
                        )
                    })
                    .collect();
                outs.sort_by(|a, b| a.1.cmp(&b.1));
                outs
            })
            .collect();

        let mut propagations: Vec<PropagationTrace> = Vec::new();

        for (source_id, target_id, amount_mv) in deliveries {
            if let Some(target) = self.neurons.iter_mut().find(|n| n.id == target_id) {
                target.receive_signal(amount_mv);
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
                    source_neuron_id: source_id,
                    target_neuron_id: target_id,
                    amount_mv,
                });
            }
        }

        NetworkStepTrace {
            tick: self.tick,
            fired_neuron_ids: fired_ids,
            propagations,
            event_ids,
            network: self.snapshot(),
        }
    }

    fn add_connection_unchecked(&mut self, connection: Connection) -> Result<(), String> {
        self.validate_connection(&connection)?;
        self.connections.push(connection);
        Ok(())
    }

    pub fn add_connection(&mut self, connection: Connection) -> Result<(), String> {
        self.add_connection_unchecked(connection)
    }

    fn validate_connection(&self, connection: &Connection) -> Result<(), String> {
        if connection.source_neuron_id == connection.target_neuron_id {
            return Err("self-connections are not allowed".to_string());
        }

        if connection.weight <= 0.0 {
            return Err("connection weight must be positive".to_string());
        }

        if !matches!(
            connection.connection_type,
            ConnectionType::Excitatory | ConnectionType::Inhibitory
        ) {
            return Err("unsupported connection type".to_string());
        }

        if !self
            .neurons
            .iter()
            .any(|n| n.id == connection.source_neuron_id)
        {
            return Err(format!(
                "missing source neuron: {}",
                connection.source_neuron_id
            ));
        }

        if !self
            .neurons
            .iter()
            .any(|n| n.id == connection.target_neuron_id)
        {
            return Err(format!(
                "missing target neuron: {}",
                connection.target_neuron_id
            ));
        }

        let duplicate = self.connections.iter().any(|c| {
            c.source_neuron_id == connection.source_neuron_id
                && c.target_neuron_id == connection.target_neuron_id
        });

        if duplicate {
            return Err("duplicate directed connection is not allowed".to_string());
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

    #[test]
    fn initial_network_has_five_neurons_and_five_connections() {
        let network = NeuralNetwork::initial();
        let snap = network.snapshot();
        assert_eq!(snap.neurons.len(), 5);
        assert_eq!(snap.connections.len(), 5);
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
    }

    #[test]
    fn reset_restores_identical_topology() {
        let mut network = NeuralNetwork::initial();
        network.inject_signal("NEURON-001", 20.0).unwrap();
        network.step();
        network.reset();

        let snap = network.snapshot();
        assert_eq!(snap.tick, 0);
        assert_eq!(snap.neurons.len(), 5);
        assert_eq!(snap.connections.len(), 5);
        assert!(snap.neurons.iter().all(|n| n.membrane_potential_mv == -70.0));
        assert_eq!(snap.connections[0].source_neuron_id, "NEURON-001");
        assert_eq!(snap.connections[0].target_neuron_id, "NEURON-002");
        assert_eq!(snap.connections[0].weight, 16.0);
        assert_eq!(
            snap.neurons
                .iter()
                .find(|n| n.id == "NEURON-001")
                .unwrap()
                .position
                .x,
            0.12
        );
        assert_eq!(
            snap.neurons
                .iter()
                .find(|n| n.id == "NEURON-004")
                .unwrap()
                .cell_type,
            CellType::Inhibitory
        );
        assert_eq!(
            snap.connections
                .iter()
                .find(|c| c.id == "CONNECTION-005")
                .unwrap()
                .connection_type,
            ConnectionType::Inhibitory
        );
    }

    #[test]
    fn tissue_positions_are_deterministic() {
        let a = NeuralNetwork::initial().snapshot();
        let b = NeuralNetwork::initial().snapshot();
        for (na, nb) in a.neurons.iter().zip(b.neurons.iter()) {
            assert_eq!(na.position, nb.position);
            assert_eq!(na.cell_type, nb.cell_type);
            assert_eq!(na.dna_id, nb.dna_id);
            assert_eq!(na.soma_radius, nb.soma_radius);
        }
        assert_eq!(a.tissue.region, "Observatory Cortex");
        assert_eq!(a.tissue.cell_count, 5);
        assert_eq!(a.tissue.synapse_count, 5);
        assert!(a.tissue.alive);
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
        assert_eq!(n1.position.y, 0.50);
    }

    #[test]
    fn rejects_self_and_duplicate_connections() {
        let mut network = NeuralNetwork::initial();
        assert!(Connection::excitatory("BAD", "NEURON-001", "NEURON-001", 5.0).is_err());
        let duplicate =
            Connection::excitatory("CONNECTION-DUP", "NEURON-001", "NEURON-002", 16.0).unwrap();
        assert!(network.add_connection(duplicate).unwrap_err().contains("duplicate"));
        assert!(network
            .connections
            .iter()
            .all(|c| c.source_neuron_id != c.target_neuron_id));
    }

    #[test]
    fn deterministic_cascade_by_tick() {
        let mut network = NeuralNetwork::initial();
        network.inject_signal("NEURON-001", 20.0).unwrap();
        assert_eq!(membrane_of(&network, "NEURON-001"), -50.0);

        // Tick 1: N-001 fires → +16 mV to N-002
        let t1 = network.step();
        assert_eq!(t1.tick, 1);
        assert_eq!(t1.fired_neuron_ids, vec!["NEURON-001"]);
        assert_eq!(t1.propagations.len(), 1);
        assert_eq!(t1.propagations[0].source_neuron_id, "NEURON-001");
        assert_eq!(t1.propagations[0].target_neuron_id, "NEURON-002");
        assert_eq!(t1.propagations[0].amount_mv, 16.0);
        assert_eq!(membrane_of(&network, "NEURON-002"), -54.0);
        assert_eq!(membrane_of(&network, "NEURON-005"), -70.0);

        // Tick 2: N-002 fires and branches
        let t2 = network.step();
        assert_eq!(t2.fired_neuron_ids, vec!["NEURON-002"]);
        assert_eq!(t2.propagations.len(), 2);
        assert_eq!(t2.propagations[0].target_neuron_id, "NEURON-003");
        assert_eq!(t2.propagations[1].target_neuron_id, "NEURON-004");
        assert_eq!(membrane_of(&network, "NEURON-003"), -54.0);
        assert_eq!(membrane_of(&network, "NEURON-004"), -54.0);
        assert!(!t2.fired_neuron_ids.contains(&"NEURON-005".to_string()));

        // Tick 3: N-003 (excitatory +8) and N-004 (inhibitory -8) converge on N-005
        let t3 = network.step();
        assert_eq!(t3.fired_neuron_ids, vec!["NEURON-003", "NEURON-004"]);
        assert_eq!(t3.propagations.len(), 2);
        let to_005: Vec<_> = t3
            .propagations
            .iter()
            .filter(|p| p.target_neuron_id == "NEURON-005")
            .collect();
        assert_eq!(to_005.len(), 2);
        assert!(to_005.iter().any(|p| p.source_neuron_id == "NEURON-003" && p.amount_mv == 8.0));
        assert!(to_005.iter().any(|p| p.source_neuron_id == "NEURON-004" && p.amount_mv == -8.0));
        // Excitation and inhibition cancel — N-005 stays at rest
        assert_eq!(membrane_of(&network, "NEURON-005"), -70.0);
        assert!(!t3.fired_neuron_ids.contains(&"NEURON-005".to_string()));

        // Tick 4: N-005 does not fire without net excitatory drive
        let t4 = network.step();
        assert!(!t4.fired_neuron_ids.contains(&"NEURON-005".to_string()));
    }

    #[test]
    fn step_trace_lists_unique_propagation_once() {
        let mut network = NeuralNetwork::initial();
        network.inject_signal("NEURON-001", 20.0).unwrap();
        let t1 = network.step();
        assert_eq!(t1.propagations.len(), 1);
        let ids: Vec<_> = t1.propagations.iter().map(|p| p.event_id.clone()).collect();
        let mut unique = ids.clone();
        unique.sort();
        unique.dedup();
        assert_eq!(ids.len(), unique.len());
    }

    #[test]
    fn refractory_still_blocks_immediate_refire() {
        let mut network = NeuralNetwork::initial();
        network.inject_signal("NEURON-001", 20.0).unwrap();
        network.step();
        network.inject_signal("NEURON-001", 20.0).unwrap();
        let t2 = network.step();
        assert!(!t2.fired_neuron_ids.contains(&"NEURON-001".to_string()));
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
    fn identical_inputs_produce_identical_snapshots_and_structural_traces() {
        let mut a = NeuralNetwork::initial();
        let mut b = NeuralNetwork::initial();
        a.inject_signal("NEURON-001", 20.0).unwrap();
        b.inject_signal("NEURON-001", 20.0).unwrap();

        for _ in 0..4 {
            let ta = a.step();
            let tb = b.step();
            assert_eq!(ta.fired_neuron_ids, tb.fired_neuron_ids);
            assert_eq!(ta.propagations.len(), tb.propagations.len());
            for (pa, pb) in ta.propagations.iter().zip(tb.propagations.iter()) {
                assert_eq!(pa.source_neuron_id, pb.source_neuron_id);
                assert_eq!(pa.target_neuron_id, pb.target_neuron_id);
                assert_eq!(pa.amount_mv, pb.amount_mv);
            }
            assert_eq!(ta.network, tb.network);
        }
    }

    #[test]
    fn propagation_events_include_structured_amount() {
        let mut network = NeuralNetwork::initial();
        network.inject_signal("NEURON-001", 20.0).unwrap();
        network.step();
        let event = network
            .events_newest_first()
            .into_iter()
            .find(|e| e.event_type == "signal_propagated")
            .unwrap();
        assert_eq!(event.source_neuron_id.as_deref(), Some("NEURON-001"));
        assert_eq!(event.target_neuron_id.as_deref(), Some("NEURON-002"));
        assert_eq!(event.amount_mv, Some(16.0));
    }
}
