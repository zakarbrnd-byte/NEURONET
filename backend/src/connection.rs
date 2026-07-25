//! Directed connection between two neurons (excitatory or inhibitory).

use serde::Serialize;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum ConnectionType {
    Excitatory,
    Inhibitory,
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
        Self::new(
            id,
            source_neuron_id,
            target_neuron_id,
            weight,
            ConnectionType::Excitatory,
        )
    }

    pub fn inhibitory(
        id: impl Into<String>,
        source_neuron_id: impl Into<String>,
        target_neuron_id: impl Into<String>,
        weight: f64,
    ) -> Result<Self, String> {
        Self::new(
            id,
            source_neuron_id,
            target_neuron_id,
            weight,
            ConnectionType::Inhibitory,
        )
    }

    fn new(
        id: impl Into<String>,
        source_neuron_id: impl Into<String>,
        target_neuron_id: impl Into<String>,
        weight: f64,
        connection_type: ConnectionType,
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
            connection_type,
        })
    }

    /// Signed millivolts delivered to the target when the source fires.
    pub fn signed_amount_mv(&self) -> f64 {
        match self.connection_type {
            ConnectionType::Excitatory => self.weight,
            ConnectionType::Inhibitory => -self.weight,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn inhibitory_delivers_negative_signed_amount() {
        let connection =
            Connection::inhibitory("CONNECTION-005", "NEURON-004", "NEURON-005", 8.0).unwrap();
        assert_eq!(connection.connection_type, ConnectionType::Inhibitory);
        assert_eq!(connection.signed_amount_mv(), -8.0);
    }
}
