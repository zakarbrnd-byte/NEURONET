//! Neural network owner — the only place that owns neurons and living synapses.

use chrono::Utc;
use serde::Serialize;
use uuid::Uuid;

use crate::neuron::{CellType, Neuron, NeuronStepResult, Position, TissueSeed};
use crate::structural::{
    evaluate_growth_candidates, evaluate_pruning_risk, plan_structural_mutations,
    record_coactivations, GrowthCandidate, PairActivity, StructuralHistoryEntry,
    StructuralPlasticityConfig, StructuralSnapshot, TopologySummary, MAX_STRUCTURAL_HISTORY,
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
    #[serde(skip_serializing_if = "Option::is_none")]
    pub synapse_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub candidate_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub connection_type: Option<SynapseType>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub synapse_count_before: Option<usize>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub synapse_count_after: Option<usize>,
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
    /// Next deterministic synapse number (SYNAPSE-0006 …). Reset restores 6.
    next_synapse_number: u64,
    structural_history: Vec<StructuralHistoryEntry>,
    created_this_session: u64,
    pruned_this_session: u64,
}

impl NeuralNetwork {
    /// Deterministic five-neuron tissue with living synapses + structural mutations (0.6D).
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
            next_synapse_number: 6,
            structural_history: Vec::new(),
            created_this_session: 0,
            pruned_this_session: 0,
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

        // Backbone protection: SYNAPSE-001 / SYNAPSE-002 keep the primary cascade
        // intact for the observatory demonstration. SYNAPSE-003/004/005 may prune
        // after sustained evidence if topology constraints still hold.
        let excitatory = [
            (
                "SYNAPSE-001",
                "NEURON-001",
                "NEURON-002",
                16.0,
                Some("backbone_input_pathway"),
            ),
            (
                "SYNAPSE-002",
                "NEURON-002",
                "NEURON-003",
                16.0,
                Some("backbone_cascade"),
            ),
            ("SYNAPSE-003", "NEURON-002", "NEURON-004", 16.0, None),
            ("SYNAPSE-004", "NEURON-003", "NEURON-005", 8.0, None),
        ];

        for (id, source, target, weight, protection) in excitatory {
            let mut synapse =
                Synapse::excitatory(id, source, target, weight, 0).expect("valid initial synapse");
            if let Some(reason) = protection {
                synapse = synapse.with_structural_protection(reason);
            }
            network
                .add_synapse_unchecked(synapse)
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
            "Deterministic artificial neural tissue with structural birth/pruning ready",
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
                topology: TopologySummary {
                    cell_count: neurons.len(),
                    synapse_count: synapses.len(),
                    candidate_count: self.growth_candidates.len(),
                    at_risk_synapse_count: at_risk,
                    created_this_session: self.created_this_session,
                    pruned_this_session: self.pruned_this_session,
                    max_synapse_capacity: self.structural_config.max_total_synapses,
                    min_synapse_floor: self.structural_config.min_total_synapses,
                },
                history: self.structural_history.clone(),
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

        let current_tick = self.tick;
        let deliveries: Vec<(String, String, String, f64)> = fired_ids
            .iter()
            .flat_map(|source_id| {
                let mut outs: Vec<_> = self
                    .synapses
                    .iter()
                    .filter(|s| {
                        s.source_neuron_id == *source_id && s.is_propagation_eligible(current_tick)
                    })
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

        // Structural plasticity (0.6D): evaluate, plan mutations, then commit.
        // Semantics: births are eligible only from the *next* tick; prunes that
        // already propagated this tick remain valid for this completed delivery,
        // then are removed in the commit phase below.
        let previous = std::mem::take(&mut self.previous_fired);
        record_coactivations(&mut self.pair_activity, &previous, &fired_ids, self.tick);
        self.previous_fired = fired_ids.clone();

        let interval = self.structural_config.evaluation_interval_ticks.max(1);
        if self.structural_config.enabled && self.tick % interval == 0 {
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

            let planned = plan_structural_mutations(
                &self.structural_config,
                &self.neurons,
                &self.synapses,
                &self.growth_candidates,
                self.tick,
                self.next_synapse_number,
            );
            let planned_events = planned.events.clone();
            for event in planned_events {
                event_ids.push(self.push_structural_event(event));
            }
            event_ids.extend(self.commit_structural_mutations(planned));
        }

        NetworkStepTrace {
            tick: self.tick,
            fired_neuron_ids: fired_ids,
            propagations,
            event_ids,
            network: self.snapshot(),
        }
    }

    fn commit_structural_mutations(
        &mut self,
        planned: crate::structural::PlannedMutations,
    ) -> Vec<String> {
        let mut event_ids = Vec::new();
        self.next_synapse_number = planned.next_synapse_number;

        // Commit births first (stable ID order already applied).
        for birth in planned.births {
            let before = self.synapses.len();
            let synapse_id = birth.synapse.id.clone();
            let source = birth.synapse.source_neuron_id.clone();
            let target = birth.synapse.target_neuron_id.clone();
            let connection_type = birth.synapse.synapse_type;
            let weight = birth.synapse.weight;
            let candidate_id = birth.candidate_id.clone();

            if let Err(err) = self.add_synapse_unchecked(birth.synapse) {
                event_ids.push(self.push_structural_mutation_event(
                    "candidate_creation_blocked",
                    Some(synapse_id),
                    Some(candidate_id),
                    Some(source),
                    Some(target),
                    Some(connection_type),
                    None,
                    before,
                    before,
                    vec!["commit_validation_failed".into()],
                    format!("Birth commit failed: {err}"),
                ));
                continue;
            }

            self.growth_candidates.retain(|c| {
                c.id != candidate_id
                    && !(c.source_neuron_id == source && c.target_neuron_id == target)
            });
            self.created_this_session = self.created_this_session.saturating_add(1);
            let after = self.synapses.len();
            self.push_history(StructuralHistoryEntry {
                tick: self.tick,
                kind: "created".into(),
                synapse_id: Some(synapse_id.clone()),
                candidate_id: Some(candidate_id.clone()),
                source_neuron_id: Some(source.clone()),
                target_neuron_id: Some(target.clone()),
                connection_type: Some(connection_type),
                weight: Some(weight),
                reason_codes: vec![
                    "repeated_coactivation".into(),
                    "within_structural_reach".into(),
                    "maturation_complete".into(),
                ],
                synapse_count_before: before,
                synapse_count_after: after,
            });
            event_ids.push(self.push_structural_mutation_event(
                "synapse_created",
                Some(synapse_id),
                Some(candidate_id),
                Some(source.clone()),
                Some(target.clone()),
                Some(connection_type),
                Some(weight),
                before,
                after,
                vec![
                    "repeated_coactivation".into(),
                    "within_structural_reach".into(),
                    "maturation_complete".into(),
                ],
                format!("Synapse born {source} → {target}"),
            ));
        }

        // Then prunes in stable ID order.
        for prune in planned.prunes {
            let before = self.synapses.len();
            let existed = self.synapses.iter().any(|s| s.id == prune.synapse_id);
            if !existed {
                continue;
            }
            self.synapses.retain(|s| s.id != prune.synapse_id);
            self.pending_hebbian.retain(|id| id != &prune.synapse_id);
            self.pruned_this_session = self.pruned_this_session.saturating_add(1);
            let after = self.synapses.len();
            let reasons: Vec<String> = prune
                .reason_codes
                .iter()
                .map(|r| (*r).to_string())
                .collect();
            self.push_history(StructuralHistoryEntry {
                tick: self.tick,
                kind: "pruned".into(),
                synapse_id: Some(prune.synapse_id.clone()),
                candidate_id: None,
                source_neuron_id: Some(prune.source_neuron_id.clone()),
                target_neuron_id: Some(prune.target_neuron_id.clone()),
                connection_type: Some(prune.synapse_type),
                weight: Some(prune.final_weight),
                reason_codes: reasons.clone(),
                synapse_count_before: before,
                synapse_count_after: after,
            });
            event_ids.push(self.push_structural_mutation_event(
                "synapse_pruned",
                Some(prune.synapse_id),
                None,
                Some(prune.source_neuron_id),
                Some(prune.target_neuron_id),
                Some(prune.synapse_type),
                Some(prune.final_weight),
                before,
                after,
                reasons,
                "Synapse pruned after sustained pruning evidence",
            ));
        }

        self.synapses.sort_by(|a, b| a.id.cmp(&b.id));
        event_ids
    }

    fn push_history(&mut self, entry: StructuralHistoryEntry) {
        self.structural_history.push(entry);
        while self.structural_history.len() > MAX_STRUCTURAL_HISTORY {
            self.structural_history.remove(0);
        }
    }

    #[allow(clippy::too_many_arguments)]
    fn push_structural_mutation_event(
        &mut self,
        event_type: &str,
        synapse_id: Option<String>,
        candidate_id: Option<String>,
        source_neuron_id: Option<String>,
        target_neuron_id: Option<String>,
        connection_type: Option<SynapseType>,
        weight: Option<f64>,
        synapse_count_before: usize,
        synapse_count_after: usize,
        reason_codes: Vec<String>,
        message: impl Into<String>,
    ) -> String {
        let id = Uuid::new_v4().to_string();
        self.events.push(NetworkEvent {
            id: id.clone(),
            timestamp: Utc::now().to_rfc3339(),
            network_tick: self.tick,
            event_type: event_type.to_string(),
            neuron_id: None,
            source_neuron_id,
            target_neuron_id,
            amount_mv: weight,
            entity_id: synapse_id.clone().or_else(|| candidate_id.clone()),
            previous_status: None,
            new_status: Some(event_type.to_string()),
            readiness_or_risk: weight,
            reason_codes: Some(reason_codes),
            synapse_id,
            candidate_id,
            connection_type,
            synapse_count_before: Some(synapse_count_before),
            synapse_count_after: Some(synapse_count_after),
            message: message.into(),
        });
        while self.events.len() > MAX_EVENTS {
            self.events.remove(0);
        }
        id
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
            synapse_id: None,
            candidate_id: None,
            connection_type: None,
            synapse_count_before: None,
            synapse_count_after: None,
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

    #[cfg(test)]
    pub fn next_synapse_number_for_test(&self) -> u64 {
        self.next_synapse_number
    }

    #[cfg(test)]
    pub fn set_structural_config_for_test(&mut self, config: StructuralPlasticityConfig) {
        self.structural_config = config;
    }

    #[cfg(test)]
    pub fn force_growth_candidates_for_test(&mut self, candidates: Vec<GrowthCandidate>) {
        self.growth_candidates = candidates;
    }

    #[cfg(test)]
    pub fn commit_structural_mutations_for_test(
        &mut self,
        planned: crate::structural::PlannedMutations,
    ) {
        let _ = self.commit_structural_mutations(planned);
    }

    #[cfg(test)]
    pub fn set_tick_for_test(&mut self, tick: u64) {
        self.tick = tick;
    }

    #[cfg(test)]
    pub fn synapses_mut_for_test(&mut self) -> &mut Vec<Synapse> {
        &mut self.synapses
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

    fn maturing_candidate(
        source: &str,
        target: &str,
        readiness: f64,
        maturation: u64,
    ) -> GrowthCandidate {
        GrowthCandidate {
            id: format!("CANDIDATE-{source}-{target}"),
            source_neuron_id: source.into(),
            target_neuron_id: target.into(),
            proposed_connection_type: SynapseType::Excitatory,
            distance: 0.2,
            coactivation_score: 8.0,
            structural_compatibility: 0.8,
            readiness,
            status: crate::structural::CandidateStatus::Maturing,
            created_tick: 1,
            last_evaluated_tick: 10,
            maturation_ticks: maturation,
            supporting_reasons: vec!["repeated_coactivation", "within_structural_reach"],
            blocking_reasons: vec![],
        }
    }

    #[test]
    fn candidate_cannot_create_before_maturation() {
        let mut network = NeuralNetwork::initial();
        let candidates = vec![maturing_candidate(
            "NEURON-002",
            "NEURON-001",
            0.95,
            1, // below required maturation + hold
        )];
        network.force_growth_candidates_for_test(candidates.clone());
        let snap = network.snapshot();
        let planned = crate::structural::plan_structural_mutations(
            &StructuralPlasticityConfig::default(),
            &snap.neurons,
            &snap.synapses,
            &candidates,
            5,
            6,
        );
        assert!(planned.births.is_empty());
        assert!(planned
            .events
            .iter()
            .any(|e| e.event_type == "candidate_creation_blocked"));
    }

    #[test]
    fn matured_candidate_creates_exactly_one_deterministic_synapse() {
        let mut network = NeuralNetwork::initial();
        let config = StructuralPlasticityConfig::default();
        let required = config.candidate_maturation_ticks + config.creation_hold_evals;
        let candidates = vec![maturing_candidate(
            "NEURON-002",
            "NEURON-001",
            0.95,
            required,
        )];
        network.force_growth_candidates_for_test(candidates.clone());
        let snap = network.snapshot();
        let planned = crate::structural::plan_structural_mutations(
            &config,
            &snap.neurons,
            &snap.synapses,
            &candidates,
            10,
            network.next_synapse_number_for_test(),
        );
        assert_eq!(planned.births.len(), 1);
        assert_eq!(planned.births[0].synapse.id, "SYNAPSE-0006");
        network.set_tick_for_test(10);
        network.commit_structural_mutations_for_test(planned);
        assert_eq!(network.snapshot().synapses.len(), 6);
        let born = synapse(&network, "SYNAPSE-0006");
        assert_eq!(born.source_neuron_id, "NEURON-002");
        assert_eq!(born.target_neuron_id, "NEURON-001");
        assert_eq!(born.weight, crate::structural::BIRTH_INITIAL_WEIGHT);
        assert_eq!(born.usage_count, 0);
        assert_eq!(born.eligible_from_tick, 11);
        assert_eq!(
            born.origin_candidate_id.as_deref(),
            Some("CANDIDATE-NEURON-002-NEURON-001")
        );
        // Duplicate birth impossible.
        let dup = vec![maturing_candidate(
            "NEURON-002",
            "NEURON-001",
            0.99,
            required,
        )];
        network.force_growth_candidates_for_test(dup.clone());
        let snap2 = network.snapshot();
        let planned2 = crate::structural::plan_structural_mutations(
            &config,
            &snap2.neurons,
            &snap2.synapses,
            &dup,
            15,
            network.next_synapse_number_for_test(),
        );
        assert!(planned2.births.is_empty());
    }

    #[test]
    fn new_synapse_active_only_on_next_tick() {
        let mut network = NeuralNetwork::initial();
        let config = StructuralPlasticityConfig::default();
        let required = config.candidate_maturation_ticks + config.creation_hold_evals;
        let candidates = vec![maturing_candidate(
            "NEURON-002",
            "NEURON-001",
            0.95,
            required,
        )];
        let snap = network.snapshot();
        let planned = crate::structural::plan_structural_mutations(
            &config,
            &snap.neurons,
            &snap.synapses,
            &candidates,
            10,
            6,
        );
        network.set_tick_for_test(10);
        network.commit_structural_mutations_for_test(planned);
        assert!(!synapse(&network, "SYNAPSE-0006").is_propagation_eligible(10));
        assert!(synapse(&network, "SYNAPSE-0006").is_propagation_eligible(11));
    }

    #[test]
    fn global_max_and_degree_limits_block_birth() {
        let mut network = NeuralNetwork::initial();
        let mut config = StructuralPlasticityConfig::default();
        config.max_total_synapses = 5;
        let required = config.candidate_maturation_ticks + config.creation_hold_evals;
        let candidates = vec![maturing_candidate(
            "NEURON-002",
            "NEURON-001",
            0.99,
            required,
        )];
        let snap = network.snapshot();
        let planned = crate::structural::plan_structural_mutations(
            &config,
            &snap.neurons,
            &snap.synapses,
            &candidates,
            20,
            6,
        );
        assert!(planned.births.is_empty());
        assert!(planned
            .events
            .iter()
            .any(|e| e.reason_codes.iter().any(|r| *r == "max_total_synapses")));

        config.max_total_synapses = 12;
        config.max_outgoing_per_neuron = 2; // N-002 already has 2 outgoing
        let planned2 = crate::structural::plan_structural_mutations(
            &config,
            &snap.neurons,
            &snap.synapses,
            &candidates,
            20,
            6,
        );
        assert!(planned2.births.is_empty());
        assert!(planned2
            .events
            .iter()
            .any(|e| e.reason_codes.iter().any(|r| *r == "max_outgoing")));
        let _ = network;
    }

    #[test]
    fn one_low_quality_tick_never_prunes_but_sustained_evidence_can() {
        let config = StructuralPlasticityConfig {
            pruning_grace_ticks: 1,
            pruning_sustained_at_risk_evals: 2,
            pruning_commit_risk_threshold: 0.55,
            pruning_low_weight_duration: 2,
            pruning_low_health_duration: 2,
            pruning_inactivity_ticks: 2,
            preserve_demo_path: false,
            min_total_synapses: 1,
            ..StructuralPlasticityConfig::default()
        };
        let mut network = NeuralNetwork::initial();
        network.set_structural_config_for_test(config.clone());
        // Prepare SYNAPSE-005 as a weak idle synapse past grace.
        {
            let s = network
                .synapses_mut_for_test()
                .iter_mut()
                .find(|s| s.id == "SYNAPSE-005")
                .unwrap();
            s.structurally_protected = false;
            s.age = 20;
            s.weight = 4.0;
            s.health = 0.2;
            s.stability = 0.1;
            s.last_activated_tick = Some(1);
            s.low_weight_ticks = 1;
            s.low_health_ticks = 1;
            s.inactivity_ticks = 10;
            s.pruning_status = crate::synapse::PruningStatus::AtRisk;
            s.pruning_risk = 0.8;
            s.at_risk_evals = 1; // only one eval — not enough
            s.pruning_reasons = vec!["low_weight", "low_health", "prolonged_inactivity"];
        }
        let snap = network.snapshot();
        let planned = crate::structural::plan_structural_mutations(
            &config,
            &snap.neurons,
            &snap.synapses,
            &[],
            25,
            6,
        );
        assert!(planned.prunes.is_empty());

        {
            let s = network
                .synapses_mut_for_test()
                .iter_mut()
                .find(|s| s.id == "SYNAPSE-005")
                .unwrap();
            s.at_risk_evals = 2;
            s.low_weight_ticks = 4;
            s.low_health_ticks = 4;
        }
        let snap2 = network.snapshot();
        let planned2 = crate::structural::plan_structural_mutations(
            &config,
            &snap2.neurons,
            &snap2.synapses,
            &[],
            30,
            6,
        );
        assert_eq!(planned2.prunes.len(), 1);
        assert_eq!(planned2.prunes[0].synapse_id, "SYNAPSE-005");
        network.commit_structural_mutations_for_test(planned2);
        assert!(!network
            .snapshot()
            .synapses
            .iter()
            .any(|s| s.id == "SYNAPSE-005"));
    }

    #[test]
    fn protected_backbone_and_grace_block_pruning() {
        let config = StructuralPlasticityConfig {
            pruning_grace_ticks: 1,
            pruning_sustained_at_risk_evals: 1,
            pruning_commit_risk_threshold: 0.5,
            pruning_low_weight_duration: 1,
            pruning_low_health_duration: 1,
            pruning_inactivity_ticks: 1,
            preserve_demo_path: false,
            min_total_synapses: 1,
            ..StructuralPlasticityConfig::default()
        };
        let network = NeuralNetwork::initial();
        let snap = network.snapshot();
        assert!(
            snap.synapses
                .iter()
                .find(|s| s.id == "SYNAPSE-001")
                .unwrap()
                .structurally_protected
        );
        let planned = crate::structural::plan_structural_mutations(
            &config,
            &snap.neurons,
            &snap.synapses,
            &[],
            50,
            6,
        );
        assert!(!planned.prunes.iter().any(|p| p.synapse_id == "SYNAPSE-001"));
        assert!(!planned.prunes.iter().any(|p| p.synapse_id == "SYNAPSE-002"));
    }

    #[test]
    fn reset_restores_topology_and_id_counter() {
        let mut network = NeuralNetwork::initial();
        let config = StructuralPlasticityConfig::default();
        let required = config.candidate_maturation_ticks + config.creation_hold_evals;
        let candidates = vec![maturing_candidate(
            "NEURON-002",
            "NEURON-001",
            0.95,
            required,
        )];
        let snap = network.snapshot();
        let planned = crate::structural::plan_structural_mutations(
            &config,
            &snap.neurons,
            &snap.synapses,
            &candidates,
            10,
            6,
        );
        network.commit_structural_mutations_for_test(planned);
        assert_eq!(network.next_synapse_number_for_test(), 7);
        assert_eq!(network.snapshot().synapses.len(), 6);
        network.reset();
        let snap = network.snapshot();
        assert_eq!(snap.synapses.len(), 5);
        assert_eq!(network.next_synapse_number_for_test(), 6);
        assert_eq!(snap.structural.topology.created_this_session, 0);
        assert_eq!(snap.structural.topology.pruned_this_session, 0);
        assert!(snap.structural.history.is_empty());
        assert!(snap.structural.growth_candidates.is_empty());
    }

    #[test]
    fn identical_sequences_yield_identical_topology_after_birth() {
        let mut a = NeuralNetwork::initial();
        let mut b = NeuralNetwork::initial();
        let config = StructuralPlasticityConfig::default();
        let required = config.candidate_maturation_ticks + config.creation_hold_evals;
        let candidates = vec![maturing_candidate(
            "NEURON-002",
            "NEURON-001",
            0.95,
            required,
        )];
        for network in [&mut a, &mut b] {
            let snap = network.snapshot();
            let planned = crate::structural::plan_structural_mutations(
                &config,
                &snap.neurons,
                &snap.synapses,
                &candidates,
                10,
                6,
            );
            network.set_tick_for_test(10);
            network.commit_structural_mutations_for_test(planned);
        }
        assert_eq!(a.snapshot().synapses, b.snapshot().synapses);
        assert_eq!(
            a.snapshot().structural.topology,
            b.snapshot().structural.topology
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
