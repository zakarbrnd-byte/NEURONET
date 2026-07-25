//! Structural plasticity foundations (Version 0.6C).
//!
//! Observes where future growth or pruning *could* occur.
//! Does NOT create or delete synapses.
//!
//! All rules are deterministic educational approximations — not biological growth.

use serde::Serialize;

use crate::neuron::{CellType, Neuron};
use crate::synapse::{PruningStatus, Synapse, SynapseType};

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
    pub pruning_weight_threshold: f64,
    pub pruning_health_threshold: f64,
    pub pruning_inactivity_ticks: u64,
    /// Synapses younger than this (age) stay `protected`.
    pub pruning_grace_ticks: u64,
    pub max_candidates: usize,
}

impl Default for StructuralPlasticityConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            evaluation_interval_ticks: 5,
            max_candidate_distance: 0.55,
            minimum_coactivation_score: 2.0,
            candidate_maturation_ticks: 3,
            pruning_weight_threshold: 6.0,
            pruning_health_threshold: 0.55,
            pruning_inactivity_ticks: 12,
            pruning_grace_ticks: 10,
            max_candidates: 8,
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
    pub pruning_weight_threshold: f64,
    pub pruning_health_threshold: f64,
    pub pruning_inactivity_ticks: u64,
    pub pruning_grace_ticks: u64,
    pub max_candidates: usize,
}

impl From<&StructuralPlasticityConfig> for StructuralConfigSummary {
    fn from(config: &StructuralPlasticityConfig) -> Self {
        Self {
            enabled: config.enabled,
            evaluation_interval_ticks: config.evaluation_interval_ticks,
            max_candidate_distance: config.max_candidate_distance,
            minimum_coactivation_score: config.minimum_coactivation_score,
            candidate_maturation_ticks: config.candidate_maturation_ticks,
            pruning_weight_threshold: config.pruning_weight_threshold,
            pruning_health_threshold: config.pruning_health_threshold,
            pruning_inactivity_ticks: config.pruning_inactivity_ticks,
            pruning_grace_ticks: config.pruning_grace_ticks,
            max_candidates: config.max_candidates,
        }
    }
}

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct StructuralSnapshot {
    pub config: StructuralConfigSummary,
    pub growth_candidates: Vec<GrowthCandidate>,
    pub latest_evaluation_tick: Option<u64>,
    pub candidate_count: usize,
    pub at_risk_synapse_count: usize,
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

#[derive(Debug, Clone)]
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

        if synapse.age < config.pruning_grace_ticks {
            synapse.protected_until_tick = config.pruning_grace_ticks;
            synapse.pruning_status = PruningStatus::Protected;
            synapse.pruning_risk = 0.0;
            synapse.pruning_reasons = vec!["grace_period"];
            synapse.low_weight_ticks = 0;
            synapse.low_health_ticks = 0;
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
