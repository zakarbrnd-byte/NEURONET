//! Directed excitatory connection between two neurons.

use serde::Serialize;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum ConnectionType {
    Excitatory,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Connection {
    pub id: String,
    pub source_neuron_id: String,
    pub target_neuron_id: String,
    pub weight: f64,
    pub connection_type: ConnectionType,
}

impl Connection {
    pub fn excitatory(
        id: impl Into<String>,
        source_neuron_id: impl Into<String>,
        target_neuron_id: impl Into<String>,
        weight: f64,
    ) -> Result<Self, String> {
        let source_neuron_id = source_neuron_id.into();
        let target_neuron_id = target_neuron_id.into();

        if source_neuron_id == target_neuron_id {
            return Err("self-connections are not allowed".to_string());
        }

        if weight <= 0.0 {
            return Err("connection weight must be positive".to_string());
        }

        Ok(Self {
            id: id.into(),
            source_neuron_id,
            target_neuron_id,
            weight,
            connection_type: ConnectionType::Excitatory,
        })
    }
}
