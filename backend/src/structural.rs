//! Structural plasticity (Versions 0.6C–0.6D).
//!
//! 0.6C: observe growth candidates and pruning risk.
//! 0.6D: deterministic synapse birth and pruning via a structural-commit phase.
//!
//! Educational developmental approximation — not biological growth.

use serde::Serialize;

use crate::neuron::{CellType, Neuron};
use crate::synapse::{PruningStatus, Synapse, SynapseType};

/// Initial weight for newly born synapses (mV).
pub const BIRTH_INITIAL_WEIGHT: f64 = 8.0;
pub const MAX_STRUCTURAL_HISTORY: usize = 48;
pub const DEMO_SOURCE_NEURON: &str = "NEURON-001";
pub const DEMO_TARGET_NEURON: &str = "NEURON-005";

/// Backend-owned structural plasticity configuration.
#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct StructuralPlasticityConfig {
    pub enabled: bool,
    pub evaluation_interval_ticks: u64,
    /// Max normalized Euclidean distance for candidate pairs.
    pub max_candidate_distance: f64,
    pub minimum_coactivation_score: f64,
    /// Consecutive evaluations above threshold before `maturing`.
    pub candidate_maturation_ticks: u64,
    /// Readiness required before a maturing candidate may birth a synapse.
    pub creation_readiness_threshold: f64,
    /// Extra maturing evaluations required after first entering `maturing`.
    pub creation_hold_evals: u64,
    pub pruning_weight_threshold: f64,
    pub pruning_health_threshold: f64,
    pub pruning_inactivity_ticks: u64,
    /// Synapses younger than this (age) stay `protected`.
    pub pruning_grace_ticks: u64,
    /// Risk required before a prune mutation may be planned.
    pub pruning_commit_risk_threshold: f64,
    pub pruning_low_weight_duration: u64,
    pub pruning_low_health_duration: u64,
    /// Consecutive at-risk evaluations required before prune commit.
    pub pruning_sustained_at_risk_evals: u64,
    pub max_candidates: usize,
    pub min_total_synapses: usize,
    pub max_total_synapses: usize,
    pub max_outgoing_per_neuron: usize,
    pub max_incoming_per_neuron: usize,
    /// Preserve at least one directed path from demo input → output neuron.
    pub preserve_demo_path: bool,
}

impl Default for StructuralPlasticityConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            evaluation_interval_ticks: 5,
            max_candidate_distance: 0.55,
            minimum_coactivation_score: 2.0,
            candidate_maturation_ticks: 3,
            creation_readiness_threshold: 0.90,
            creation_hold_evals: 1,
            pruning_weight_threshold: 6.0,
            pruning_health_threshold: 0.55,
            pruning_inactivity_ticks: 12,
            pruning_grace_ticks: 10,
            pruning_commit_risk_threshold: 0.70,
            pruning_low_weight_duration: 4,
            pruning_low_health_duration: 4,
            pruning_sustained_at_risk_evals: 2,
            max_candidates: 8,
            min_total_synapses: 3,
            max_total_synapses: 12,
            max_outgoing_per_neuron: 3,
            max_incoming_per_neuron: 3,
            preserve_demo_path: true,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum CandidateStatus {
    Observing,
    Eligible,
    Maturing,
    Blocked,
}

/// Directed pair activity (A→B ≠ B→A). Bounded history via score decay.
#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct PairActivity {
    pub source_neuron_id: String,
    pub target_neuron_id: String,
    pub coactivation_count: u64,
    pub recent_coactivation_score: f64,
    pub last_coactivated_tick: Option<u64>,
    pub evaluation_count: u64,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct GrowthCandidate {
    pub id: String,
    pub source_neuron_id: String,
    pub target_neuron_id: String,
    pub proposed_connection_type: SynapseType,
    pub distance: f64,
    pub coactivation_score: f64,
    pub structural_compatibility: f64,
    pub readiness: f64,
    pub status: CandidateStatus,
    pub created_tick: u64,
    pub last_evaluated_tick: u64,
    pub maturation_ticks: u64,
    pub supporting_reasons: Vec<&'static str>,
    pub blocking_reasons: Vec<&'static str>,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct StructuralConfigSummary {
    pub enabled: bool,
    pub evaluation_interval_ticks: u64,
    pub max_candidate_distance: f64,
    pub minimum_coactivation_score: f64,
    pub candidate_maturation_ticks: u64,
    pub creation_readiness_threshold: f64,
    pub creation_hold_evals: u64,
    pub pruning_weight_threshold: f64,
    pub pruning_health_threshold: f64,
    pub pruning_inactivity_ticks: u64,
    pub pruning_grace_ticks: u64,
    pub pruning_commit_risk_threshold: f64,
    pub pruning_low_weight_duration: u64,
    pub pruning_low_health_duration: u64,
    pub pruning_sustained_at_risk_evals: u64,
    pub max_candidates: usize,
    pub min_total_synapses: usize,
    pub max_total_synapses: usize,
    pub max_outgoing_per_neuron: usize,
    pub max_incoming_per_neuron: usize,
    pub preserve_demo_path: bool,
}

impl From<&StructuralPlasticityConfig> for StructuralConfigSummary {
    fn from(config: &StructuralPlasticityConfig) -> Self {
        Self {
            enabled: config.enabled,
            evaluation_interval_ticks: config.evaluation_interval_ticks,
            max_candidate_distance: config.max_candidate_distance,
            minimum_coactivation_score: config.minimum_coactivation_score,
            candidate_maturation_ticks: config.candidate_maturation_ticks,
            creation_readiness_threshold: config.creation_readiness_threshold,
            creation_hold_evals: config.creation_hold_evals,
            pruning_weight_threshold: config.pruning_weight_threshold,
            pruning_health_threshold: config.pruning_health_threshold,
            pruning_inactivity_ticks: config.pruning_inactivity_ticks,
            pruning_grace_ticks: config.pruning_grace_ticks,
            pruning_commit_risk_threshold: config.pruning_commit_risk_threshold,
            pruning_low_weight_duration: config.pruning_low_weight_duration,
            pruning_low_health_duration: config.pruning_low_health_duration,
            pruning_sustained_at_risk_evals: config.pruning_sustained_at_risk_evals,
            max_candidates: config.max_candidates,
            min_total_synapses: config.min_total_synapses,
            max_total_synapses: config.max_total_synapses,
            max_outgoing_per_neuron: config.max_outgoing_per_neuron,
            max_incoming_per_neuron: config.max_incoming_per_neuron,
            preserve_demo_path: config.preserve_demo_path,
        }
    }
}

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct TopologySummary {
    pub cell_count: usize,
    pub synapse_count: usize,
    pub candidate_count: usize,
    pub at_risk_synapse_count: usize,
    pub created_this_session: u64,
    pub pruned_this_session: u64,
    pub max_synapse_capacity: usize,
    pub min_synapse_floor: usize,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct StructuralHistoryEntry {
    pub tick: u64,
    pub kind: String,
    pub synapse_id: Option<String>,
    pub candidate_id: Option<String>,
    pub source_neuron_id: Option<String>,
    pub target_neuron_id: Option<String>,
    pub connection_type: Option<SynapseType>,
    pub weight: Option<f64>,
    pub reason_codes: Vec<String>,
    pub synapse_count_before: usize,
    pub synapse_count_after: usize,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct StructuralSnapshot {
    pub config: StructuralConfigSummary,
    pub growth_candidates: Vec<GrowthCandidate>,
    pub latest_evaluation_tick: Option<u64>,
    pub candidate_count: usize,
    pub at_risk_synapse_count: usize,
    pub topology: TopologySummary,
    pub history: Vec<StructuralHistoryEntry>,
}

/// Discrete coactivation rule (documented):
/// Directed pair A→B receives evidence when A fires and B fires on the same tick
/// or on the immediately following tick. Not STDP; not wall-clock based.
pub fn record_coactivations(
    pairs: &mut Vec<PairActivity>,
    previous_fired: &[String],
    current_fired: &[String],
    tick: u64,
) {
    // Same-tick pairs among current firers (all directed permutations).
    for source in current_fired {
        for target in current_fired {
            if source != target {
                bump_pair(pairs, source, target, tick);
            }
        }
    }
    // Cross-tick: previous A → current B
    for source in previous_fired {
        for target in current_fired {
            if source != target {
                bump_pair(pairs, source, target, tick);
            }
        }
    }
}

fn bump_pair(pairs: &mut Vec<PairActivity>, source: &str, target: &str, tick: u64) {
    if let Some(pair) = pairs
        .iter_mut()
        .find(|p| p.source_neuron_id == source && p.target_neuron_id == target)
    {
        pair.coactivation_count = pair.coactivation_count.saturating_add(1);
        pair.recent_coactivation_score = (pair.recent_coactivation_score + 1.0).min(20.0);
        pair.last_coactivated_tick = Some(tick);
        return;
    }
    pairs.push(PairActivity {
        source_neuron_id: source.to_string(),
        target_neuron_id: target.to_string(),
        coactivation_count: 1,
        recent_coactivation_score: 1.0,
        last_coactivated_tick: Some(tick),
        evaluation_count: 0,
    });
    // Bound pair list
    if pairs.len() > 64 {
        pairs.sort_by(|a, b| {
            b.recent_coactivation_score
                .partial_cmp(&a.recent_coactivation_score)
                .unwrap_or(std::cmp::Ordering::Equal)
        });
        pairs.truncate(64);
    }
}

/// Normalized Euclidean distance in tissue position space [0,1]².
pub fn normalized_distance(a: &Neuron, b: &Neuron) -> f64 {
    let dx = a.position.x - b.position.x;
    let dy = a.position.y - b.position.y;
    (dx * dx + dy * dy).sqrt()
}

/// Morphology values (`axon_length`, `dendrite_radius`) are already normalized
/// in the same unit space as positions. Reach = axon_length + dendrite_radius.
pub fn within_structural_reach(source: &Neuron, target: &Neuron, distance: f64) -> bool {
    let reach = source.axon_length + target.dendrite_radius;
    distance <= reach + 1e-9
}

pub fn proposed_type_from_source(source: &Neuron) -> SynapseType {
    match source.cell_type {
        CellType::Excitatory => SynapseType::Excitatory,
        CellType::Inhibitory => SynapseType::Inhibitory,
    }
}

fn synapse_exists(synapses: &[Synapse], source: &str, target: &str) -> bool {
    synapses
        .iter()
        .any(|s| s.source_neuron_id == source && s.target_neuron_id == target)
}

/// Compatibility in [0,1] from distance, reach margin, and cell-type presence.
pub fn structural_compatibility(
    source: &Neuron,
    target: &Neuron,
    distance: f64,
    max_distance: f64,
) -> f64 {
    if distance > max_distance {
        return 0.0;
    }
    let reach = source.axon_length + target.dendrite_radius;
    let reach_factor = if reach <= 0.0 {
        0.0
    } else {
        (1.0 - (distance / reach).min(1.0)).clamp(0.0, 1.0)
    };
    let distance_factor = (1.0 - (distance / max_distance).min(1.0)).clamp(0.0, 1.0);
    // Both excitatory or mixed E→I / I→E remain allowed; self already excluded.
    let type_factor = 1.0;
    (0.45 * distance_factor + 0.45 * reach_factor + 0.10 * type_factor).clamp(0.0, 1.0)
}

fn readiness_from_evidence(coactivation: f64, compatibility: f64, min_score: f64) -> f64 {
    if coactivation < min_score || compatibility <= 0.0 {
        return (coactivation / (min_score * 2.0)).clamp(0.0, 0.49) * compatibility;
    }
    let coact_norm = ((coactivation - min_score) / 8.0).clamp(0.0, 1.0);
    (0.55 + 0.45 * coact_norm * compatibility).clamp(0.0, 1.0)
}

#[derive(Debug, Clone, PartialEq)]
pub struct StructuralEvent {
    pub event_type: &'static str,
    pub entity_id: String,
    pub source_neuron_id: Option<String>,
    pub target_neuron_id: Option<String>,
    pub previous_status: Option<String>,
    pub new_status: Option<String>,
    pub metric: Option<f64>,
    pub reason_codes: Vec<&'static str>,
    pub message: String,
}

pub fn evaluate_growth_candidates(
    config: &StructuralPlasticityConfig,
    neurons: &[Neuron],
    synapses: &[Synapse],
    pairs: &mut [PairActivity],
    existing: &mut Vec<GrowthCandidate>,
    tick: u64,
) -> Vec<StructuralEvent> {
    let mut events = Vec::new();
    if !config.enabled {
        return events;
    }

    let mut neuron_ids: Vec<&str> = neurons.iter().map(|n| n.id.as_str()).collect();
    neuron_ids.sort();

    // Decay unused pair scores slightly each evaluation.
    for pair in pairs.iter_mut() {
        pair.evaluation_count = pair.evaluation_count.saturating_add(1);
        if pair
            .last_coactivated_tick
            .map(|t| tick.saturating_sub(t))
            .unwrap_or(tick)
            > 5
        {
            pair.recent_coactivation_score = (pair.recent_coactivation_score * 0.85).max(0.0);
        }
    }

    let mut next_candidates: Vec<GrowthCandidate> = Vec::new();

    for &source_id in &neuron_ids {
        for &target_id in &neuron_ids {
            if source_id == target_id {
                continue;
            }
            if synapse_exists(synapses, source_id, target_id) {
                continue;
            }

            let source = neurons.iter().find(|n| n.id == source_id).unwrap();
            let target = neurons.iter().find(|n| n.id == target_id).unwrap();
            // Version 0.7: developing / not-yet-eligible cells cannot form candidates.
            if !source.is_structurally_eligible(tick) || !target.is_structurally_eligible(tick) {
                continue;
            }
            let distance = normalized_distance(source, target);
            let pair = pairs
                .iter()
                .find(|p| p.source_neuron_id == source_id && p.target_neuron_id == target_id);
            let coactivation = pair.map(|p| p.recent_coactivation_score).unwrap_or(0.0);
            let proposed = proposed_type_from_source(source);
            let compatibility =
                structural_compatibility(source, target, distance, config.max_candidate_distance);

            let mut supporting = Vec::new();
            let mut blocking = Vec::new();

            if distance > config.max_candidate_distance {
                blocking.push("outside_structural_reach");
            } else {
                supporting.push("within_structural_reach");
            }
            if !within_structural_reach(source, target, distance) {
                if !blocking.contains(&"outside_structural_reach") {
                    blocking.push("outside_structural_reach");
                }
            }
            if coactivation >= config.minimum_coactivation_score {
                supporting.push("repeated_coactivation");
            } else {
                blocking.push("insufficient_coactivation");
            }

            let prior = existing
                .iter()
                .find(|c| c.source_neuron_id == source_id && c.target_neuron_id == target_id);

            let mut maturation_ticks = prior.map(|c| c.maturation_ticks).unwrap_or(0);
            let created_tick = prior.map(|c| c.created_tick).unwrap_or(tick);

            let status = if !blocking.is_empty() && coactivation < config.minimum_coactivation_score
            {
                // Evidence fell: reset maturation.
                if prior
                    .map(|c| {
                        matches!(
                            c.status,
                            CandidateStatus::Eligible | CandidateStatus::Maturing
                        )
                    })
                    .unwrap_or(false)
                {
                    maturation_ticks = 0;
                }
                if distance > config.max_candidate_distance
                    || !within_structural_reach(source, target, distance)
                {
                    CandidateStatus::Blocked
                } else {
                    CandidateStatus::Observing
                }
            } else if blocking.is_empty() {
                maturation_ticks = maturation_ticks.saturating_add(1);
                if maturation_ticks >= config.candidate_maturation_ticks {
                    CandidateStatus::Maturing
                } else {
                    CandidateStatus::Eligible
                }
            } else {
                maturation_ticks = 0;
                CandidateStatus::Blocked
            };

            // Skip cold pairs with no history and no prior candidate.
            if coactivation <= 0.0 && prior.is_none() && status == CandidateStatus::Blocked {
                continue;
            }
            if coactivation <= 0.0 && prior.is_none() && status == CandidateStatus::Observing {
                continue;
            }

            let readiness = readiness_from_evidence(
                coactivation,
                compatibility,
                config.minimum_coactivation_score,
            );

            let id = prior
                .map(|c| c.id.clone())
                .unwrap_or_else(|| format!("CANDIDATE-{source_id}-{target_id}"));

            let previous_status = prior.map(|c| format!("{:?}", c.status).to_ascii_lowercase());
            let new_status = format!("{:?}", status).to_ascii_lowercase();

            if let Some(prev) = prior {
                if prev.status != status {
                    let event_type = match status {
                        CandidateStatus::Eligible => "growth_candidate_eligible",
                        CandidateStatus::Maturing => "growth_candidate_maturing",
                        CandidateStatus::Observing | CandidateStatus::Blocked => {
                            "growth_candidate_weakened"
                        }
                    };
                    events.push(StructuralEvent {
                        event_type,
                        entity_id: id.clone(),
                        source_neuron_id: Some(source_id.to_string()),
                        target_neuron_id: Some(target_id.to_string()),
                        previous_status: previous_status.clone(),
                        new_status: Some(new_status.clone()),
                        metric: Some(readiness),
                        reason_codes: if supporting.is_empty() {
                            blocking.clone()
                        } else {
                            supporting.clone()
                        },
                        message: format!(
                            "{id} status {:?} → {:?} (readiness {:.2})",
                            prev.status, status, readiness
                        ),
                    });
                }
            } else if coactivation > 0.0 {
                events.push(StructuralEvent {
                    event_type: "growth_candidate_observed",
                    entity_id: id.clone(),
                    source_neuron_id: Some(source_id.to_string()),
                    target_neuron_id: Some(target_id.to_string()),
                    previous_status: None,
                    new_status: Some(new_status),
                    metric: Some(readiness),
                    reason_codes: supporting.clone(),
                    message: format!(
                        "{id} observed {source_id} → {target_id} (score {coactivation:.1})"
                    ),
                });
            }

            next_candidates.push(GrowthCandidate {
                id,
                source_neuron_id: source_id.to_string(),
                target_neuron_id: target_id.to_string(),
                proposed_connection_type: proposed,
                distance: (distance * 1000.0).round() / 1000.0,
                coactivation_score: (coactivation * 1000.0).round() / 1000.0,
                structural_compatibility: (compatibility * 1000.0).round() / 1000.0,
                readiness: (readiness * 1000.0).round() / 1000.0,
                status,
                created_tick,
                last_evaluated_tick: tick,
                maturation_ticks,
                supporting_reasons: supporting,
                blocking_reasons: blocking,
            });
        }
    }

    // Keep top candidates by readiness then id.
    next_candidates.sort_by(|a, b| {
        b.readiness
            .partial_cmp(&a.readiness)
            .unwrap_or(std::cmp::Ordering::Equal)
            .then_with(|| a.id.cmp(&b.id))
    });
    next_candidates.truncate(config.max_candidates);
    next_candidates.sort_by(|a, b| a.id.cmp(&b.id));
    *existing = next_candidates;
    events
}

pub fn evaluate_pruning_risk(
    config: &StructuralPlasticityConfig,
    synapses: &mut [Synapse],
    tick: u64,
) -> Vec<StructuralEvent> {
    let mut events = Vec::new();
    if !config.enabled {
        return events;
    }

    for synapse in synapses.iter_mut() {
        let previous = synapse.pruning_status;
        let inactivity = match synapse.last_activated_tick {
            Some(last) => tick.saturating_sub(last),
            None => synapse.age,
        };
        synapse.inactivity_ticks = inactivity;

        if synapse.structurally_protected {
            synapse.pruning_status = PruningStatus::Protected;
            synapse.pruning_risk = 0.0;
            synapse.pruning_reasons = vec!["structurally_protected"];
            synapse.at_risk_evals = 0;
            if previous != PruningStatus::Protected {
                events.push(StructuralEvent {
                    event_type: "synapse_pruning_monitored",
                    entity_id: synapse.id.clone(),
                    source_neuron_id: Some(synapse.source_neuron_id.clone()),
                    target_neuron_id: Some(synapse.target_neuron_id.clone()),
                    previous_status: Some(format!("{:?}", previous).to_ascii_lowercase()),
                    new_status: Some("protected".into()),
                    metric: Some(0.0),
                    reason_codes: vec!["structurally_protected"],
                    message: format!("{} structurally protected", synapse.id),
                });
            }
            continue;
        }

        if synapse.age < config.pruning_grace_ticks {
            synapse.protected_until_tick =
                tick + config.pruning_grace_ticks.saturating_sub(synapse.age);
            synapse.pruning_status = PruningStatus::Protected;
            synapse.pruning_risk = 0.0;
            synapse.pruning_reasons = vec!["grace_period"];
            synapse.low_weight_ticks = 0;
            synapse.low_health_ticks = 0;
            synapse.at_risk_evals = 0;
            if previous != PruningStatus::Protected {
                events.push(StructuralEvent {
                    event_type: "synapse_pruning_monitored",
                    entity_id: synapse.id.clone(),
                    source_neuron_id: Some(synapse.source_neuron_id.clone()),
                    target_neuron_id: Some(synapse.target_neuron_id.clone()),
                    previous_status: Some(format!("{:?}", previous).to_ascii_lowercase()),
                    new_status: Some("protected".into()),
                    metric: Some(0.0),
                    reason_codes: vec!["grace_period"],
                    message: format!("{} protected by grace period", synapse.id),
                });
            }
            continue;
        }

        let mut reasons: Vec<&'static str> = Vec::new();
        if synapse.weight < config.pruning_weight_threshold {
            synapse.low_weight_ticks = synapse.low_weight_ticks.saturating_add(1);
            reasons.push("low_weight");
        } else {
            synapse.low_weight_ticks = 0;
        }
        if synapse.health < config.pruning_health_threshold {
            synapse.low_health_ticks = synapse.low_health_ticks.saturating_add(1);
            reasons.push("low_health");
        } else {
            synapse.low_health_ticks = 0;
        }
        if inactivity >= config.pruning_inactivity_ticks {
            reasons.push("prolonged_inactivity");
        }

        let mut risk = 0.0;
        if synapse.low_weight_ticks > 0 {
            risk += 0.35 * (synapse.low_weight_ticks as f64 / 8.0).min(1.0);
        }
        if synapse.low_health_ticks > 0 {
            risk += 0.35 * (synapse.low_health_ticks as f64 / 8.0).min(1.0);
        }
        if inactivity >= config.pruning_inactivity_ticks {
            risk += 0.30 * ((inactivity - config.pruning_inactivity_ticks) as f64 / 12.0).min(1.0);
        }
        if synapse.stability < 0.35 {
            risk += 0.10;
            if !reasons.iter().any(|r| *r == "low_health") {
                // stability cue as supporting evidence text via low_health family
            }
        }
        risk = risk.clamp(0.0, 1.0);
        synapse.pruning_risk = (risk * 1000.0).round() / 1000.0;
        synapse.pruning_reasons = reasons.clone();

        let status = if risk >= 0.55 {
            PruningStatus::AtRisk
        } else if risk >= 0.25 || !reasons.is_empty() {
            PruningStatus::Monitoring
        } else {
            PruningStatus::Stable
        };
        if status == PruningStatus::AtRisk {
            synapse.at_risk_evals = synapse.at_risk_evals.saturating_add(1);
        } else {
            synapse.at_risk_evals = 0;
        }
        synapse.pruning_status = status;

        let should_emit = previous != status
            || matches!(status, PruningStatus::Monitoring | PruningStatus::AtRisk);
        if should_emit {
            let event_type = if risk_increased(previous, status) {
                "synapse_pruning_risk_increased"
            } else if matches!(status, PruningStatus::Stable) && previous != status {
                "synapse_pruning_risk_decreased"
            } else {
                "synapse_pruning_monitored"
            };
            events.push(StructuralEvent {
                event_type,
                entity_id: synapse.id.clone(),
                source_neuron_id: Some(synapse.source_neuron_id.clone()),
                target_neuron_id: Some(synapse.target_neuron_id.clone()),
                previous_status: Some(format!("{:?}", previous).to_ascii_lowercase()),
                new_status: Some(format!("{:?}", status).to_ascii_lowercase()),
                metric: Some(synapse.pruning_risk),
                reason_codes: if reasons.is_empty() {
                    vec!["prolonged_inactivity"]
                } else {
                    reasons
                },
                message: format!(
                    "{} pruning {:?} → {:?} (risk {:.2})",
                    synapse.id, previous, status, synapse.pruning_risk
                ),
            });
        }
    }

    events
}

fn risk_increased(previous: PruningStatus, next: PruningStatus) -> bool {
    use PruningStatus::*;
    matches!(
        (previous, next),
        (Stable, Monitoring)
            | (Stable, AtRisk)
            | (Monitoring, AtRisk)
            | (Protected, Monitoring)
            | (Protected, AtRisk)
    )
}

#[derive(Debug, Clone)]
pub struct PlannedBirth {
    pub candidate_id: String,
    pub synapse: Synapse,
}

#[derive(Debug, Clone)]
pub struct PlannedPrune {
    pub synapse_id: String,
    pub source_neuron_id: String,
    pub target_neuron_id: String,
    pub synapse_type: SynapseType,
    pub final_weight: f64,
    pub reason_codes: Vec<&'static str>,
}

#[derive(Debug, Clone, Default)]
pub struct PlannedMutations {
    pub births: Vec<PlannedBirth>,
    pub prunes: Vec<PlannedPrune>,
    pub events: Vec<StructuralEvent>,
    pub next_synapse_number: u64,
}

pub fn format_synapse_id(number: u64) -> String {
    format!("SYNAPSE-{number:04}")
}

fn count_outgoing(synapses: &[Synapse], neuron_id: &str) -> usize {
    synapses
        .iter()
        .filter(|s| s.source_neuron_id == neuron_id)
        .count()
}

fn count_incoming(synapses: &[Synapse], neuron_id: &str) -> usize {
    synapses
        .iter()
        .filter(|s| s.target_neuron_id == neuron_id)
        .count()
}

/// True if a directed path exists from `start` to `goal` using `synapses`.
pub fn has_directed_path(synapses: &[Synapse], start: &str, goal: &str) -> bool {
    if start == goal {
        return true;
    }
    let mut stack = vec![start.to_string()];
    let mut seen = std::collections::HashSet::new();
    while let Some(node) = stack.pop() {
        if !seen.insert(node.clone()) {
            continue;
        }
        for synapse in synapses.iter().filter(|s| s.source_neuron_id == node) {
            if synapse.target_neuron_id == goal {
                return true;
            }
            stack.push(synapse.target_neuron_id.clone());
        }
    }
    false
}

fn birth_block_reasons(
    config: &StructuralPlasticityConfig,
    neurons: &[Neuron],
    synapses: &[Synapse],
    candidate: &GrowthCandidate,
    pending_births: usize,
) -> Vec<&'static str> {
    let mut reasons = Vec::new();
    if candidate.status != CandidateStatus::Maturing {
        reasons.push("insufficient_maturation");
    }
    if candidate.readiness < config.creation_readiness_threshold {
        reasons.push("insufficient_readiness");
    }
    let required_maturation = config
        .candidate_maturation_ticks
        .saturating_add(config.creation_hold_evals);
    if candidate.maturation_ticks < required_maturation {
        reasons.push("insufficient_maturation");
    }
    if candidate.source_neuron_id == candidate.target_neuron_id {
        reasons.push("self_connection");
    }
    if synapse_exists(
        synapses,
        &candidate.source_neuron_id,
        &candidate.target_neuron_id,
    ) {
        reasons.push("duplicate_connection");
    }
    let Some(source) = neurons.iter().find(|n| n.id == candidate.source_neuron_id) else {
        reasons.push("missing_neuron");
        return reasons;
    };
    let Some(target) = neurons.iter().find(|n| n.id == candidate.target_neuron_id) else {
        reasons.push("missing_neuron");
        return reasons;
    };
    let distance = normalized_distance(source, target);
    if distance > config.max_candidate_distance
        || !within_structural_reach(source, target, distance)
    {
        reasons.push("outside_structural_reach");
    }
    if synapses.len() + pending_births >= config.max_total_synapses {
        reasons.push("max_total_synapses");
    }
    if count_outgoing(synapses, &candidate.source_neuron_id) >= config.max_outgoing_per_neuron {
        reasons.push("max_outgoing");
    }
    if count_incoming(synapses, &candidate.target_neuron_id) >= config.max_incoming_per_neuron {
        reasons.push("max_incoming");
    }
    reasons.sort();
    reasons.dedup();
    reasons
}

fn prune_block_reasons(
    config: &StructuralPlasticityConfig,
    synapse: &Synapse,
    synapses: &[Synapse],
    pending_prunes: usize,
) -> Vec<&'static str> {
    let mut reasons = Vec::new();
    if synapse.structurally_protected {
        reasons.push("structurally_protected");
    }
    if synapse.age < config.pruning_grace_ticks {
        reasons.push("grace_period");
    }
    if synapse.pruning_status != PruningStatus::AtRisk {
        reasons.push("not_at_risk");
    }
    if synapse.pruning_risk < config.pruning_commit_risk_threshold {
        reasons.push("insufficient_risk");
    }
    if synapse.inactivity_ticks < config.pruning_inactivity_ticks {
        reasons.push("insufficient_inactivity");
    }
    if synapse.low_weight_ticks < config.pruning_low_weight_duration {
        reasons.push("insufficient_low_weight_duration");
    }
    if synapse.low_health_ticks < config.pruning_low_health_duration {
        reasons.push("insufficient_low_health_duration");
    }
    if synapse.at_risk_evals < config.pruning_sustained_at_risk_evals {
        reasons.push("insufficient_sustained_evidence");
    }
    let remaining = synapses.len().saturating_sub(pending_prunes + 1);
    if remaining < config.min_total_synapses {
        reasons.push("min_total_synapses");
    }
    if config.preserve_demo_path {
        let projected: Vec<Synapse> = synapses
            .iter()
            .filter(|s| s.id != synapse.id)
            .cloned()
            .collect();
        // Also exclude already-planned prunes by id via pending_prunes count alone is insufficient;
        // caller passes projected synapses when validating sequentially.
        if !has_directed_path(&projected, DEMO_SOURCE_NEURON, DEMO_TARGET_NEURON) {
            reasons.push("demo_path_required");
        }
    }
    reasons
}

/// Plan births then prunes. Does not mutate synapse/candidate vectors.
/// Births and prunes are sorted by stable IDs before return.
pub fn plan_structural_mutations(
    config: &StructuralPlasticityConfig,
    neurons: &[Neuron],
    synapses: &[Synapse],
    candidates: &[GrowthCandidate],
    tick: u64,
    next_synapse_number: u64,
) -> PlannedMutations {
    let mut planned = PlannedMutations {
        next_synapse_number,
        ..PlannedMutations::default()
    };
    if !config.enabled {
        return planned;
    }

    let mut sorted_candidates = candidates.to_vec();
    sorted_candidates.sort_by(|a, b| a.id.cmp(&b.id));

    let mut provisional = synapses.to_vec();
    let mut number = next_synapse_number;

    for candidate in &sorted_candidates {
        let near_ready = candidate.status == CandidateStatus::Maturing
            || candidate.readiness >= config.creation_readiness_threshold * 0.85;
        if !near_ready {
            continue;
        }
        let blocks = birth_block_reasons(config, neurons, &provisional, candidate, 0);
        if !blocks.is_empty() {
            if candidate.status == CandidateStatus::Maturing {
                planned.events.push(StructuralEvent {
                    event_type: "candidate_creation_blocked",
                    entity_id: candidate.id.clone(),
                    source_neuron_id: Some(candidate.source_neuron_id.clone()),
                    target_neuron_id: Some(candidate.target_neuron_id.clone()),
                    previous_status: Some(candidate.status_label().to_string()),
                    new_status: Some("blocked".into()),
                    metric: Some(candidate.readiness),
                    reason_codes: blocks,
                    message: format!(
                        "Creation blocked for {} → {}",
                        candidate.source_neuron_id, candidate.target_neuron_id
                    ),
                });
            }
            continue;
        }

        let synapse_id = format_synapse_id(number);
        number = number.saturating_add(1);
        let synapse = Synapse::new_unchecked_for_birth(
            synapse_id,
            &candidate.source_neuron_id,
            &candidate.target_neuron_id,
            BIRTH_INITIAL_WEIGHT,
            candidate.proposed_connection_type,
            tick,
            &candidate.id,
            tick.saturating_add(1),
        );
        provisional.push(synapse.clone());
        planned.births.push(PlannedBirth {
            candidate_id: candidate.id.clone(),
            synapse,
        });
    }

    planned
        .births
        .sort_by(|a, b| a.synapse.id.cmp(&b.synapse.id));
    planned.next_synapse_number = number;

    let mut sorted_synapses = provisional.clone();
    sorted_synapses.sort_by(|a, b| a.id.cmp(&b.id));
    let mut remaining = provisional;

    for synapse in &sorted_synapses {
        if synapse.structurally_protected || synapse.pruning_status != PruningStatus::AtRisk {
            continue;
        }
        // Validate against remaining after prior planned prunes in this phase.
        let blocks = {
            let mut reasons = prune_block_reasons(config, synapse, &remaining, 0);
            // Re-check demo path on remaining-without-this-synapse
            if config.preserve_demo_path && !reasons.iter().any(|r| *r == "demo_path_required") {
                let projected: Vec<Synapse> = remaining
                    .iter()
                    .filter(|s| s.id != synapse.id)
                    .cloned()
                    .collect();
                if !has_directed_path(&projected, DEMO_SOURCE_NEURON, DEMO_TARGET_NEURON) {
                    reasons.push("demo_path_required");
                }
            }
            reasons.sort();
            reasons.dedup();
            reasons
        };

        if !blocks.is_empty() {
            if synapse.at_risk_evals > 0 {
                planned.events.push(StructuralEvent {
                    event_type: "pruning_blocked",
                    entity_id: synapse.id.clone(),
                    source_neuron_id: Some(synapse.source_neuron_id.clone()),
                    target_neuron_id: Some(synapse.target_neuron_id.clone()),
                    previous_status: Some(
                        format!("{:?}", synapse.pruning_status).to_ascii_lowercase(),
                    ),
                    new_status: Some("at_risk".into()),
                    metric: Some(synapse.pruning_risk),
                    reason_codes: blocks,
                    message: format!("Pruning blocked for {}", synapse.id),
                });
            }
            continue;
        }

        remaining.retain(|s| s.id != synapse.id);
        planned.prunes.push(PlannedPrune {
            synapse_id: synapse.id.clone(),
            source_neuron_id: synapse.source_neuron_id.clone(),
            target_neuron_id: synapse.target_neuron_id.clone(),
            synapse_type: synapse.synapse_type,
            final_weight: synapse.weight,
            reason_codes: synapse.pruning_reasons.clone(),
        });
    }

    planned
        .prunes
        .sort_by(|a, b| a.synapse_id.cmp(&b.synapse_id));
    planned
}

impl GrowthCandidate {
    pub fn status_label(&self) -> &'static str {
        match self.status {
            CandidateStatus::Observing => "observing",
            CandidateStatus::Eligible => "eligible",
            CandidateStatus::Maturing => "maturing",
            CandidateStatus::Blocked => "blocked",
        }
    }
}

impl Synapse {
    /// Internal birth helper used by structural commit (already validated).
    pub fn new_unchecked_for_birth(
        id: impl Into<String>,
        source: &str,
        target: &str,
        weight: f64,
        synapse_type: SynapseType,
        creation_tick: u64,
        origin_candidate_id: &str,
        eligible_from_tick: u64,
    ) -> Self {
        let mut synapse = match synapse_type {
            SynapseType::Excitatory => {
                Synapse::excitatory(id, source, target, weight, creation_tick).expect("validated")
            }
            SynapseType::Inhibitory => {
                Synapse::inhibitory(id, source, target, weight, creation_tick).expect("validated")
            }
        };
        synapse.origin_candidate_id = Some(origin_candidate_id.to_string());
        synapse.eligible_from_tick = eligible_from_tick;
        synapse.protected_until_tick = creation_tick.saturating_add(10);
        synapse
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::neuron::{Position, TissueSeed};

    fn neuron(id: &str, x: f64, y: f64, cell: CellType, axon: f64, dend: f64) -> Neuron {
        Neuron::with_tissue(
            id,
            TissueSeed {
                position: Position { x, y },
                region: "Observatory Cortex",
                layer: 1,
                cell_type: cell,
                dna_id: "DNA-X",
                soma_radius: 0.03,
                dendrite_radius: dend,
                axon_length: axon,
            },
        )
    }

    #[test]
    fn self_pairs_never_become_candidates() {
        let config = StructuralPlasticityConfig::default();
        let neurons = vec![neuron(
            "NEURON-001",
            0.1,
            0.5,
            CellType::Excitatory,
            0.5,
            0.2,
        )];
        let mut pairs = vec![PairActivity {
            source_neuron_id: "NEURON-001".into(),
            target_neuron_id: "NEURON-001".into(),
            coactivation_count: 10,
            recent_coactivation_score: 10.0,
            last_coactivated_tick: Some(5),
            evaluation_count: 0,
        }];
        let mut candidates = Vec::new();
        evaluate_growth_candidates(&config, &neurons, &[], &mut pairs, &mut candidates, 10);
        assert!(candidates.is_empty());
    }

    #[test]
    fn existing_directed_synapse_blocks_duplicate_candidate() {
        let config = StructuralPlasticityConfig::default();
        let neurons = vec![
            neuron("NEURON-001", 0.12, 0.5, CellType::Excitatory, 0.4, 0.1),
            neuron("NEURON-002", 0.32, 0.5, CellType::Excitatory, 0.4, 0.1),
        ];
        let synapses =
            vec![Synapse::excitatory("SYNAPSE-001", "NEURON-001", "NEURON-002", 16.0, 0).unwrap()];
        let mut pairs = vec![PairActivity {
            source_neuron_id: "NEURON-001".into(),
            target_neuron_id: "NEURON-002".into(),
            coactivation_count: 10,
            recent_coactivation_score: 10.0,
            last_coactivated_tick: Some(5),
            evaluation_count: 0,
        }];
        let mut candidates = Vec::new();
        evaluate_growth_candidates(
            &config,
            &neurons,
            &synapses,
            &mut pairs,
            &mut candidates,
            10,
        );
        assert!(!candidates
            .iter()
            .any(|c| c.source_neuron_id == "NEURON-001" && c.target_neuron_id == "NEURON-002"));
    }

    #[test]
    fn reverse_direction_may_be_evaluated_separately() {
        let config = StructuralPlasticityConfig {
            minimum_coactivation_score: 1.0,
            ..StructuralPlasticityConfig::default()
        };
        let neurons = vec![
            neuron("NEURON-001", 0.12, 0.5, CellType::Excitatory, 0.5, 0.2),
            neuron("NEURON-002", 0.32, 0.5, CellType::Excitatory, 0.5, 0.2),
        ];
        let synapses =
            vec![Synapse::excitatory("SYNAPSE-001", "NEURON-001", "NEURON-002", 16.0, 0).unwrap()];
        let mut pairs = vec![PairActivity {
            source_neuron_id: "NEURON-002".into(),
            target_neuron_id: "NEURON-001".into(),
            coactivation_count: 5,
            recent_coactivation_score: 5.0,
            last_coactivated_tick: Some(8),
            evaluation_count: 0,
        }];
        let mut candidates = Vec::new();
        evaluate_growth_candidates(
            &config,
            &neurons,
            &synapses,
            &mut pairs,
            &mut candidates,
            10,
        );
        assert!(candidates
            .iter()
            .any(|c| c.source_neuron_id == "NEURON-002" && c.target_neuron_id == "NEURON-001"));
    }

    #[test]
    fn out_of_reach_pairs_remain_blocked() {
        let config = StructuralPlasticityConfig {
            max_candidate_distance: 0.2,
            minimum_coactivation_score: 1.0,
            ..StructuralPlasticityConfig::default()
        };
        let neurons = vec![
            neuron("NEURON-001", 0.0, 0.0, CellType::Excitatory, 0.05, 0.02),
            neuron("NEURON-005", 0.9, 0.9, CellType::Excitatory, 0.05, 0.02),
        ];
        let mut pairs = vec![PairActivity {
            source_neuron_id: "NEURON-001".into(),
            target_neuron_id: "NEURON-005".into(),
            coactivation_count: 9,
            recent_coactivation_score: 9.0,
            last_coactivated_tick: Some(3),
            evaluation_count: 0,
        }];
        let mut candidates = Vec::new();
        evaluate_growth_candidates(&config, &neurons, &[], &mut pairs, &mut candidates, 10);
        let c = candidates
            .iter()
            .find(|c| c.source_neuron_id == "NEURON-001")
            .expect("candidate tracked");
        assert_eq!(c.status, CandidateStatus::Blocked);
        assert!(c
            .blocking_reasons
            .iter()
            .any(|r| *r == "outside_structural_reach"));
    }

    #[test]
    fn proposed_type_follows_source_cell_type() {
        let e = neuron("NEURON-001", 0.1, 0.1, CellType::Excitatory, 0.2, 0.1);
        let i = neuron("NEURON-004", 0.2, 0.2, CellType::Inhibitory, 0.2, 0.1);
        assert_eq!(proposed_type_from_source(&e), SynapseType::Excitatory);
        assert_eq!(proposed_type_from_source(&i), SynapseType::Inhibitory);
    }

    #[test]
    fn grace_period_protects_young_synapses() {
        let config = StructuralPlasticityConfig::default();
        let mut synapses =
            vec![Synapse::excitatory("SYNAPSE-001", "NEURON-001", "NEURON-002", 5.0, 0).unwrap()];
        synapses[0].age = 3;
        synapses[0].health = 0.2;
        let _events = evaluate_pruning_risk(&config, &mut synapses, 3);
        assert_eq!(synapses[0].pruning_status, PruningStatus::Protected);
        assert!(synapses[0]
            .pruning_reasons
            .iter()
            .any(|r| *r == "grace_period"));
        assert_eq!(synapses[0].pruning_risk, 0.0);
    }

    #[test]
    fn repeated_coactivation_increases_pair_score() {
        let mut pairs = Vec::new();
        record_coactivations(&mut pairs, &[], &["A".into(), "B".into()], 1);
        record_coactivations(&mut pairs, &["A".into()], &["B".into()], 2);
        let pair = pairs
            .iter()
            .find(|p| p.source_neuron_id == "A" && p.target_neuron_id == "B")
            .unwrap();
        assert!(pair.coactivation_count >= 2);
        assert!(pair.recent_coactivation_score >= 2.0);
    }

    #[test]
    fn pair_history_remains_bounded() {
        let mut pairs = Vec::new();
        for i in 0..100 {
            let a = format!("N-{i}");
            let b = format!("N-{}", i + 1);
            record_coactivations(&mut pairs, &[], &[a, b], i as u64);
        }
        assert!(pairs.len() <= 64);
    }

    #[test]
    fn candidate_status_transitions_are_deterministic() {
        let config = StructuralPlasticityConfig {
            minimum_coactivation_score: 2.0,
            candidate_maturation_ticks: 2,
            max_candidate_distance: 0.5,
            ..StructuralPlasticityConfig::default()
        };
        let neurons = vec![
            neuron("NEURON-001", 0.12, 0.5, CellType::Excitatory, 0.5, 0.2),
            neuron("NEURON-002", 0.32, 0.5, CellType::Excitatory, 0.5, 0.2),
        ];
        let mut pairs = vec![PairActivity {
            source_neuron_id: "NEURON-001".into(),
            target_neuron_id: "NEURON-002".into(),
            coactivation_count: 5,
            recent_coactivation_score: 5.0,
            last_coactivated_tick: Some(1),
            evaluation_count: 0,
        }];
        let mut candidates = Vec::new();
        evaluate_growth_candidates(&config, &neurons, &[], &mut pairs, &mut candidates, 5);
        assert_eq!(candidates[0].status, CandidateStatus::Eligible);
        evaluate_growth_candidates(&config, &neurons, &[], &mut pairs, &mut candidates, 10);
        assert_eq!(candidates[0].status, CandidateStatus::Maturing);
        // Evidence collapse → observing/blocked and maturation reset.
        pairs[0].recent_coactivation_score = 0.0;
        evaluate_growth_candidates(&config, &neurons, &[], &mut pairs, &mut candidates, 15);
        assert!(matches!(
            candidates[0].status,
            CandidateStatus::Observing | CandidateStatus::Blocked
        ));
        assert_eq!(candidates[0].maturation_ticks, 0);
    }

    #[test]
    fn low_weight_accumulates_pruning_evidence_after_grace() {
        let config = StructuralPlasticityConfig {
            pruning_grace_ticks: 1,
            pruning_weight_threshold: 10.0,
            pruning_inactivity_ticks: 100,
            ..StructuralPlasticityConfig::default()
        };
        let mut synapses =
            vec![Synapse::excitatory("SYNAPSE-001", "NEURON-001", "NEURON-002", 5.0, 0).unwrap()];
        synapses[0].age = 5;
        synapses[0].last_activated_tick = Some(4);
        evaluate_pruning_risk(&config, &mut synapses, 5);
        evaluate_pruning_risk(&config, &mut synapses, 6);
        evaluate_pruning_risk(&config, &mut synapses, 7);
        assert!(synapses[0].low_weight_ticks >= 2);
        assert!(synapses[0]
            .pruning_reasons
            .iter()
            .any(|r| *r == "low_weight"));
        assert!(synapses[0].pruning_risk > 0.0);
    }
}
