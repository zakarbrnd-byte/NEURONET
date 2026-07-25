//! Neural network owner — the only place that owns neurons and connections.

use chrono::Utc;
use serde::Serialize;
use uuid::Uuid;

use crate::connection::{Connection, ConnectionType};
use crate::neuron::{Neuron, NeuronStepResult};

const MAX_EVENTS: usize = 200;

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
    pub message: String,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct NetworkSnapshot {
    pub tick: u64,
    pub neurons: Vec<Neuron>,
    pub connections: Vec<Connection>,
}

#[derive(Debug)]
pub struct NeuralNetwork {
    neurons: Vec<Neuron>,
    connections: Vec<Connection>,
    tick: u64,
    events: Vec<NetworkEvent>,
}

impl NeuralNetwork {
    /// Deterministic three-neuron starter network.
    pub fn initial() -> Self {
        let mut network = Self {
            neurons: Vec::new(),
            connections: Vec::new(),
            tick: 0,
            events: Vec::new(),
        };

        network.neurons.push(Neuron::new("NEURON-001"));
        network.neurons.push(Neuron::new("NEURON-002"));
        network.neurons.push(Neuron::new("NEURON-003"));

        network
            .add_connection_unchecked(
                Connection::excitatory("CONNECTION-001", "NEURON-001", "NEURON-002", 5.0)
                    .expect("valid initial connection"),
            )
            .expect("valid initial connection");
        network
            .add_connection_unchecked(
                Connection::excitatory("CONNECTION-002", "NEURON-002", "NEURON-003", 5.0)
                    .expect("valid initial connection"),
            )
            .expect("valid initial connection");

        network.push_event(
            "network_ready",
            None,
            None,
            None,
            "Deterministic three-neuron network ready",
        );

        network
    }

    pub fn reset(&mut self) {
        *self = Self::initial();
        // Replace the ready event with an explicit reset event as the newest.
        self.events.clear();
        self.push_event(
            "network_reset",
            None,
            None,
            None,
            "Network reset to deterministic initial state",
        );
    }

    pub fn snapshot(&self) -> NetworkSnapshot {
        let mut neurons = self.neurons.clone();
        neurons.sort_by(|a, b| a.id.cmp(&b.id));

        let mut connections = self.connections.clone();
        connections.sort_by(|a, b| a.id.cmp(&b.id));

        NetworkSnapshot {
            tick: self.tick,
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
            format!("Injected +{amount_mv} mV into {neuron_id}"),
        );

        Ok(())
    }

    /// Advance the whole network by exactly one tick using two-phase updates.
    pub fn step(&mut self) {
        self.tick = self.tick.saturating_add(1);

        // Phase 1: decide firing from the state at the beginning of the tick.
        // Iterate neurons in stable ID order so results are deterministic.
        let mut ordered_indexes: Vec<usize> = (0..self.neurons.len()).collect();
        ordered_indexes.sort_by(|&a, &b| self.neurons[a].id.cmp(&self.neurons[b].id));

        let mut fired_ids: Vec<String> = Vec::new();

        for index in ordered_indexes {
            let neuron_id = self.neurons[index].id.clone();
            let result = self.neurons[index].step();

            match result {
                NeuronStepResult::Fired => {
                    fired_ids.push(neuron_id.clone());
                    self.push_event(
                        "neuron_fired",
                        Some(neuron_id.clone()),
                        None,
                        None,
                        format!("{neuron_id} fired"),
                    );
                    self.push_event(
                        "neuron_refractory",
                        Some(neuron_id),
                        None,
                        None,
                        "Neuron entered refractory state",
                    );
                }
                NeuronStepResult::Resting => {
                    self.push_event(
                        "neuron_resting",
                        Some(neuron_id),
                        None,
                        None,
                        "Neuron resting in refractory period",
                    );
                }
                NeuronStepResult::Recovered => {
                    self.push_event(
                        "neuron_recovered",
                        Some(neuron_id),
                        None,
                        None,
                        "Neuron recovered toward resting potential",
                    );
                }
            }
        }

        // Phase 2: deliver outgoing signals after all fire decisions.
        fired_ids.sort();

        let deliveries: Vec<(String, String, f64)> = fired_ids
            .iter()
            .flat_map(|source_id| {
                self.connections
                    .iter()
                    .filter(|c| c.source_neuron_id == *source_id)
                    .map(|c| {
                        (
                            c.source_neuron_id.clone(),
                            c.target_neuron_id.clone(),
                            c.weight,
                        )
                    })
                    .collect::<Vec<_>>()
            })
            .collect();

        for (source_id, target_id, weight) in deliveries {
            if let Some(target) = self.neurons.iter_mut().find(|n| n.id == target_id) {
                target.receive_signal(weight);
                self.push_event(
                    "signal_propagated",
                    Some(target_id.clone()),
                    Some(source_id.clone()),
                    Some(target_id.clone()),
                    format!("{source_id} → {target_id} (+{weight} mV)"),
                );
            }
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

        if !matches!(connection.connection_type, ConnectionType::Excitatory) {
            return Err("only excitatory connections are supported in 0.4".to_string());
        }

        if !self.neurons.iter().any(|n| n.id == connection.source_neuron_id) {
            return Err(format!(
                "missing source neuron: {}",
                connection.source_neuron_id
            ));
        }

        if !self.neurons.iter().any(|n| n.id == connection.target_neuron_id) {
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
        message: impl Into<String>,
    ) {
        self.events.push(NetworkEvent {
            id: Uuid::new_v4().to_string(),
            timestamp: Utc::now().to_rfc3339(),
            network_tick: self.tick,
            event_type: event_type.to_string(),
            neuron_id,
            source_neuron_id,
            target_neuron_id,
            message: message.into(),
        });

        while self.events.len() > MAX_EVENTS {
            self.events.remove(0);
        }
    }

    pub fn event_count(&self) -> usize {
        self.events.len()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rejects_self_connections() {
        let mut network = NeuralNetwork::initial();
        let result = Connection::excitatory("BAD", "NEURON-001", "NEURON-001", 5.0);
        assert!(result.is_err());

        let ok = Connection::excitatory("CONNECTION-X", "NEURON-001", "NEURON-003", 5.0).unwrap();
        // First add is fine; duplicate directed later is tested separately.
        assert!(network.add_connection(ok).is_ok());
    }

    #[test]
    fn rejects_duplicate_connections() {
        let mut network = NeuralNetwork::initial();
        let duplicate =
            Connection::excitatory("CONNECTION-DUP", "NEURON-001", "NEURON-002", 5.0).unwrap();
        let err = network.add_connection(duplicate).unwrap_err();
        assert!(err.contains("duplicate"));
    }

    #[test]
    fn reset_is_deterministic() {
        let mut network = NeuralNetwork::initial();
        network.inject_signal("NEURON-001", 20.0).unwrap();
        network.step();
        network.reset();

        let snap = network.snapshot();
        assert_eq!(snap.tick, 0);
        assert_eq!(snap.neurons.len(), 3);
        assert_eq!(snap.connections.len(), 2);
        assert_eq!(snap.neurons[0].id, "NEURON-001");
        assert_eq!(snap.neurons[0].membrane_potential_mv, -70.0);
        assert_eq!(snap.connections[0].source_neuron_id, "NEURON-001");
        assert_eq!(snap.connections[0].target_neuron_id, "NEURON-002");
        assert_eq!(snap.connections[1].source_neuron_id, "NEURON-002");
        assert_eq!(snap.connections[1].target_neuron_id, "NEURON-003");
    }

    #[test]
    fn two_phase_propagation_is_deterministic() {
        let mut a = NeuralNetwork::initial();
        let mut b = NeuralNetwork::initial();

        a.inject_signal("NEURON-001", 20.0).unwrap();
        b.inject_signal("NEURON-001", 20.0).unwrap();
        a.step();
        b.step();

        assert_eq!(a.snapshot(), b.snapshot());

        // NEURON-001 fired and delivered +5 mV to NEURON-002.
        let n2 = a
            .snapshot()
            .neurons
            .into_iter()
            .find(|n| n.id == "NEURON-002")
            .unwrap();
        assert_eq!(n2.membrane_potential_mv, -65.0);
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
}
