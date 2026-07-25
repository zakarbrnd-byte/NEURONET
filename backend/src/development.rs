//! Version 0.7 — Developmental Neural Tissue.
//!
//! Deterministic progenitor birth → maturation → differentiation → migration →
//! settlement. Only developing cells migrate; settled somas are fixed.
//!
//! This is a simplified developmental abstraction — not embryology or stem-cell biology.

use serde::{Deserialize, Serialize};

use crate::neuron::{
    CellType, LifecycleState, MigrationPath, MorphologyProfile, Neuron, Position, TissueRegion,
};

/// Alias for readability in developmental code.
pub type TissuePosition = Position;

/// Minimum normalized soma spacing for settlement targets.
pub const MIN_SOMA_SPACING: f64 = 0.12;

/// Backend-owned developmental configuration.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct DevelopmentConfig {
    pub enabled: bool,
    pub evaluation_interval_ticks: u64,
    pub initial_settled_neurons: usize,
    pub maximum_total_neurons: usize,
    pub first_birth_tick: u64,
    pub minimum_birth_interval_ticks: u64,
    pub maturation_duration_ticks: u64,
    pub differentiation_duration_ticks: u64,
    pub migration_duration_ticks: u64,
    pub settling_duration_ticks: u64,
    pub maximum_concurrent_developing_cells: usize,
    pub migration_step_limit: f64,
    pub target_excitatory_ratio: f64,
    pub progenitor_zone: TissueRegion,
    pub settlement_zones: Vec<TissueRegion>,
}

impl Default for DevelopmentConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            evaluation_interval_ticks: 1,
            initial_settled_neurons: 5,
            maximum_total_neurons: 8,
            first_birth_tick: 30,
            minimum_birth_interval_ticks: 35,
            maturation_duration_ticks: 8,
            differentiation_duration_ticks: 4,
            migration_duration_ticks: 16,
            settling_duration_ticks: 4,
            maximum_concurrent_developing_cells: 1,
            migration_step_limit: 0.08,
            target_excitatory_ratio: 0.75,
            progenitor_zone: TissueRegion {
                id: "progenitor-zone".into(),
                name: "Simplified Progenitor Zone".into(),
                x_min: 0.10,
                x_max: 0.90,
                y_min: 0.82,
                y_max: 0.96,
                description: "Simplified birth band — not anatomical germinal zone.".into(),
            },
            settlement_zones: vec![TissueRegion {
                id: "settlement-zone".into(),
                name: "Settlement Zone".into(),
                x_min: 0.08,
                x_max: 0.92,
                y_min: 0.12,
                y_max: 0.78,
                description: "Allowed settlement band for newly developed neurons.".into(),
            }],
        }
    }
}

/// Compact development summary for API snapshots.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct DevelopmentSummary {
    pub enabled: bool,
    pub total_cell_count: usize,
    pub settled_neuron_count: usize,
    pub developing_cell_count: usize,
    pub population_capacity: usize,
    pub latest_birth_tick: Option<u64>,
    pub latest_development_evaluation_tick: Option<u64>,
    pub next_birth_eligibility_tick: Option<u64>,
    pub current_lifecycle_activity: String,
    pub progenitor_zone: TissueRegion,
    pub settlement_zones: Vec<TissueRegion>,
    pub config: DevelopmentConfigSummary,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct DevelopmentConfigSummary {
    pub maximum_total_neurons: usize,
    pub maximum_concurrent_developing_cells: usize,
    pub first_birth_tick: u64,
    pub minimum_birth_interval_ticks: u64,
    pub maturation_duration_ticks: u64,
    pub differentiation_duration_ticks: u64,
    pub migration_duration_ticks: u64,
    pub settling_duration_ticks: u64,
    pub target_excitatory_ratio: f64,
}

impl DevelopmentConfig {
    pub fn summary_config(&self) -> DevelopmentConfigSummary {
        DevelopmentConfigSummary {
            maximum_total_neurons: self.maximum_total_neurons,
            maximum_concurrent_developing_cells: self.maximum_concurrent_developing_cells,
            first_birth_tick: self.first_birth_tick,
            minimum_birth_interval_ticks: self.minimum_birth_interval_ticks,
            maturation_duration_ticks: self.maturation_duration_ticks,
            differentiation_duration_ticks: self.differentiation_duration_ticks,
            migration_duration_ticks: self.migration_duration_ticks,
            settling_duration_ticks: self.settling_duration_ticks,
            target_excitatory_ratio: self.target_excitatory_ratio,
        }
    }
}

/// Reason codes for migration / development decisions.
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum DevelopmentReasonCode {
    TargetAttraction,
    SomaExclusion,
    TissueBoundary,
    WaypointProgress,
    TargetReached,
    PopulationCapacity,
    BirthInterval,
    ConcurrentLimit,
    BirthEligible,
    DifferentiationAssigned,
    SettlementStabilizing,
}

/// Result of one developmental evaluation tick.
#[derive(Debug, Default)]
pub struct DevelopmentTickResult {
    pub events: Vec<serde_json::Value>,
    pub birth: Option<BirthPlan>,
    pub settled_this_tick: Vec<String>,
}

/// Planned progenitor birth (network applies the spawn).
#[derive(Debug, Clone)]
pub struct BirthPlan {
    pub neuron_number: u32,
    pub birth_tick: u64,
    pub position: TissuePosition,
}

/// Deterministic birth position inside the progenitor zone.
pub fn birth_position_for_index(config: &DevelopmentConfig, birth_index: u32) -> TissuePosition {
    let z = &config.progenitor_zone;
    let t = (birth_index as f64 + 1.0) / 4.0;
    let x = z.x_min + (z.x_max - z.x_min) * (0.25 + 0.5 * ((t * 2.0) % 1.0));
    let y = z.y_min + (z.y_max - z.y_min) * 0.5;
    TissuePosition {
        x: clamp01(x),
        y: clamp01(y),
    }
}

fn clamp01(v: f64) -> f64 {
    v.clamp(0.0, 1.0)
}

fn dist(a: &TissuePosition, b: &TissuePosition) -> f64 {
    let dx = a.x - b.x;
    let dy = a.y - b.y;
    (dx * dx + dy * dy).sqrt()
}

/// Deterministic lattice of candidate settlement positions.
pub fn candidate_settlement_lattice(config: &DevelopmentConfig) -> Vec<TissuePosition> {
    let mut out = Vec::new();
    for zone in &config.settlement_zones {
        let mut gy = 0usize;
        let mut y = zone.y_min + 0.06;
        while y <= zone.y_max - 0.04 {
            let mut gx = 0usize;
            let mut x = zone.x_min + 0.06;
            while x <= zone.x_max - 0.04 {
                let stagger = if gy % 2 == 1 { 0.03 } else { 0.0 };
                out.push(TissuePosition {
                    x: clamp01(x + stagger),
                    y: clamp01(y),
                });
                gx += 1;
                let _ = gx;
                x += 0.10;
            }
            gy += 1;
            y += 0.10;
        }
    }
    out.sort_by(|a, b| {
        a.y.partial_cmp(&b.y)
            .unwrap()
            .then(a.x.partial_cmp(&b.x).unwrap())
    });
    out
}

/// Select a deterministic settlement target.
pub fn select_settlement_target(
    config: &DevelopmentConfig,
    occupied: &[TissuePosition],
    reserved_targets: &[TissuePosition],
) -> Option<TissuePosition> {
    let lattice = candidate_settlement_lattice(config);
    let mut best: Option<(TissuePosition, i64)> = None;

    for cand in lattice {
        let in_zone = config.settlement_zones.iter().any(|z| {
            cand.x >= z.x_min && cand.x <= z.x_max && cand.y >= z.y_min && cand.y <= z.y_max
        });
        if !in_zone {
            continue;
        }
        let mut ok = true;
        let mut min_d = f64::MAX;
        for o in occupied.iter().chain(reserved_targets.iter()) {
            let d = dist(&cand, o);
            if d < MIN_SOMA_SPACING {
                ok = false;
                break;
            }
            if d < min_d {
                min_d = d;
            }
        }
        if !ok {
            continue;
        }
        let spacing_score = (min_d * 1000.0) as i64;
        let density_penalty = occupied.iter().filter(|o| dist(&cand, o) < 0.25).count() as i64 * 10;
        let score = spacing_score - density_penalty;
        match &best {
            None => best = Some((cand, score)),
            Some((_, best_score)) if score > *best_score => best = Some((cand, score)),
            Some((best_pos, best_score)) if score == *best_score => {
                if cand.y < best_pos.y || (cand.y == best_pos.y && cand.x < best_pos.x) {
                    best = Some((cand, score));
                }
            }
            _ => {}
        }
    }
    best.map(|(p, _)| p)
}

/// Choose excitatory vs inhibitory to move toward the target ratio.
pub fn choose_cell_type_from_counts(
    config: &DevelopmentConfig,
    settled_excitatory: usize,
    settled_total: usize,
) -> CellType {
    if settled_total == 0 {
        return CellType::Excitatory;
    }
    let ratio = settled_excitatory as f64 / settled_total as f64;
    if ratio < config.target_excitatory_ratio {
        CellType::Excitatory
    } else {
        CellType::Inhibitory
    }
}

/// Choose type from current settled population (stable, inspectable rule).
pub fn choose_cell_type(config: &DevelopmentConfig, neurons: &[Neuron]) -> CellType {
    let settled: Vec<&Neuron> = neurons
        .iter()
        .filter(|n| n.lifecycle == LifecycleState::Settled)
        .collect();
    let exc = settled
        .iter()
        .filter(|n| n.cell_type == CellType::Excitatory)
        .count();
    choose_cell_type_from_counts(config, exc, settled.len())
}

/// Build a simple path: start → optional waypoint → target.
pub fn build_migration_path(start: TissuePosition, target: TissuePosition) -> MigrationPath {
    let mid = TissuePosition {
        x: clamp01((start.x + target.x) * 0.5),
        y: clamp01(start.y * 0.35 + target.y * 0.65),
    };
    MigrationPath {
        waypoints: vec![start, mid, target],
        current_segment: 0,
    }
}

/// Advance migration along the path. Never overshoots the final target.
pub fn advance_migration(
    current: &TissuePosition,
    path: &MigrationPath,
    progress: f64,
    step_limit: f64,
    duration_ticks: u64,
) -> (TissuePosition, f64, usize, bool, Vec<DevelopmentReasonCode>) {
    let duration = duration_ticks.max(1) as f64;
    let new_progress = (progress + 1.0 / duration).min(1.0);
    let target = path
        .waypoints
        .last()
        .cloned()
        .unwrap_or_else(|| current.clone());

    let desired = position_along_path(path, new_progress);
    let dx = desired.x - current.x;
    let dy = desired.y - current.y;
    let d = (dx * dx + dy * dy).sqrt();
    let mut reasons = vec![DevelopmentReasonCode::TargetAttraction];

    let next = if d <= step_limit || d < 1e-9 {
        desired
    } else {
        reasons.push(DevelopmentReasonCode::WaypointProgress);
        TissuePosition {
            x: clamp01(current.x + dx / d * step_limit),
            y: clamp01(current.y + dy / d * step_limit),
        }
    };

    let reached = new_progress >= 1.0 - 1e-9 || dist(&next, &target) < 1e-6;
    if reached {
        reasons.push(DevelopmentReasonCode::TargetReached);
        return (
            target,
            1.0,
            path.waypoints.len().saturating_sub(1),
            true,
            reasons,
        );
    }

    let segment = ((new_progress * (path.waypoints.len().saturating_sub(1) as f64)) as usize)
        .min(path.waypoints.len().saturating_sub(1));
    (next, new_progress, segment, false, reasons)
}

fn position_along_path(path: &MigrationPath, progress: f64) -> TissuePosition {
    if path.waypoints.is_empty() {
        return TissuePosition { x: 0.5, y: 0.5 };
    }
    if path.waypoints.len() == 1 {
        return path.waypoints[0].clone();
    }
    let segs = path.waypoints.len() - 1;
    let t = progress.clamp(0.0, 1.0) * segs as f64;
    let i = (t.floor() as usize).min(segs - 1);
    let local = t - i as f64;
    let a = &path.waypoints[i];
    let b = &path.waypoints[i + 1];
    TissuePosition {
        x: clamp01(a.x + (b.x - a.x) * local),
        y: clamp01(a.y + (b.y - a.y) * local),
    }
}

fn morphology_for_lifecycle(
    lifecycle: LifecycleState,
    phase_age: u64,
    config: &DevelopmentConfig,
    mature: &MorphologyProfile,
) -> (f64, f64, f64, f64) {
    match lifecycle {
        LifecycleState::Quiescent | LifecycleState::Maturing => {
            let p = (phase_age as f64 / config.maturation_duration_ticks.max(1) as f64).min(1.0);
            (0.018 + 0.006 * p, 0.0, 0.0, p * 0.25)
        }
        LifecycleState::Differentiating => {
            let p =
                (phase_age as f64 / config.differentiation_duration_ticks.max(1) as f64).min(1.0);
            (0.022 + 0.008 * p, 0.02 * p, 0.0, 0.25 + p * 0.25)
        }
        LifecycleState::Migrating => {
            let p = (phase_age as f64 / config.migration_duration_ticks.max(1) as f64).min(1.0);
            (0.026, 0.03 + 0.02 * p, 0.02 * p, 0.5 + p * 0.2)
        }
        LifecycleState::Settling => {
            let p = (phase_age as f64 / config.settling_duration_ticks.max(1) as f64).min(1.0);
            (
                0.028 + (mature.soma_radius - 0.028) * p,
                0.05 + (mature.dendrite_radius - 0.05) * p,
                0.04 + (mature.axon_reach - 0.04) * p,
                0.7 + p * 0.3,
            )
        }
        LifecycleState::Settled => (
            mature.soma_radius,
            mature.dendrite_radius,
            mature.axon_reach,
            1.0,
        ),
    }
}

fn push_dev_event(
    events: &mut Vec<serde_json::Value>,
    event_type: &str,
    tick: u64,
    neuron: &Neuron,
    message: &str,
    extra: serde_json::Map<String, serde_json::Value>,
) {
    let mut m = serde_json::Map::new();
    m.insert("eventType".into(), serde_json::json!(event_type));
    m.insert("tick".into(), serde_json::json!(tick));
    m.insert("cellId".into(), serde_json::json!(neuron.id));
    m.insert("neuronId".into(), serde_json::json!(neuron.id));
    m.insert("lifecycleState".into(), serde_json::json!(neuron.lifecycle));
    m.insert("currentPosition".into(), serde_json::json!(neuron.position));
    if let Some(t) = &neuron.target_position {
        m.insert("targetPosition".into(), serde_json::json!(t));
    }
    m.insert(
        "migrationProgress".into(),
        serde_json::json!(neuron.migration_progress),
    );
    m.insert(
        "morphologyProgress".into(),
        serde_json::json!(neuron.morphology_progress),
    );
    if let Some(ct) = neuron.cell_type_assigned {
        m.insert("cellType".into(), serde_json::json!(ct));
    }
    m.insert("message".into(), serde_json::json!(message));
    for (k, v) in extra {
        m.insert(k, v);
    }
    events.push(serde_json::Value::Object(m));
}

/// Advance all developing cells one tick; optionally plan a birth.
pub fn evaluate_development(
    config: &DevelopmentConfig,
    neurons: &mut [Neuron],
    tick: u64,
    next_neuron_number: u32,
    latest_birth_tick: Option<u64>,
    birth_count: u32,
) -> DevelopmentTickResult {
    let mut result = DevelopmentTickResult::default();
    if !config.enabled {
        return result;
    }

    // Precompute differentiation assignments (avoids borrow conflicts).
    let mut pending_type: Vec<(String, CellType, Option<Position>)> = Vec::new();
    {
        let mut settled_exc = neurons
            .iter()
            .filter(|n| {
                n.lifecycle == LifecycleState::Settled && n.cell_type == CellType::Excitatory
            })
            .count();
        let mut settled_total = neurons
            .iter()
            .filter(|n| n.lifecycle == LifecycleState::Settled)
            .count();
        let mut differentiating: Vec<&Neuron> = neurons
            .iter()
            .filter(|n| {
                n.lifecycle == LifecycleState::Differentiating && n.cell_type_assigned.is_none()
            })
            .collect();
        differentiating.sort_by(|a, b| a.id.cmp(&b.id));
        for cell in differentiating {
            let ctype = choose_cell_type_from_counts(config, settled_exc, settled_total);
            let occupied: Vec<Position> = neurons
                .iter()
                .filter(|n| n.id != cell.id && n.lifecycle == LifecycleState::Settled)
                .map(|n| n.position.clone())
                .chain(pending_type.iter().filter_map(|(_, _, t)| t.clone()))
                .collect();
            let reserved: Vec<Position> = neurons
                .iter()
                .filter(|n| {
                    n.id != cell.id
                        && matches!(
                            n.lifecycle,
                            LifecycleState::Migrating
                                | LifecycleState::Settling
                                | LifecycleState::Differentiating
                        )
                        && n.target_position.is_some()
                })
                .filter_map(|n| n.target_position.clone())
                .collect();
            let target = select_settlement_target(config, &occupied, &reserved);
            if ctype == CellType::Excitatory {
                settled_exc += 1;
            }
            settled_total += 1;
            pending_type.push((cell.id.clone(), ctype, target));
        }
    }

    // Advance existing developing cells.
    for cell in neurons.iter_mut() {
        if cell.lifecycle == LifecycleState::Settled || cell.lifecycle == LifecycleState::Quiescent
        {
            continue;
        }

        cell.developmental_age = cell.developmental_age.saturating_add(1);
        cell.phase_age = cell.phase_age.saturating_add(1);
        let prev = cell.lifecycle;
        let mature = cell.mature_morphology();

        match cell.lifecycle {
            LifecycleState::Maturing => {
                if cell.phase_age >= config.maturation_duration_ticks {
                    cell.lifecycle = LifecycleState::Differentiating;
                    cell.phase_age = 0;
                    let mut extra = serde_json::Map::new();
                    extra.insert("previousState".into(), serde_json::json!(prev));
                    extra.insert("newState".into(), serde_json::json!(cell.lifecycle));
                    push_dev_event(
                        &mut result.events,
                        "differentiation_started",
                        tick,
                        cell,
                        &format!("{} began differentiation.", cell.id),
                        extra,
                    );
                }
            }
            LifecycleState::Differentiating => {
                if cell.cell_type_assigned.is_none() {
                    if let Some((_, ctype, target)) =
                        pending_type.iter().find(|(id, _, _)| id == &cell.id)
                    {
                        cell.cell_type_assigned = Some(*ctype);
                        cell.cell_type = *ctype;
                        if let Some(target) = target {
                            cell.target_position = Some(target.clone());
                            cell.original_target_position = Some(target.clone());
                            let start = cell.position.clone();
                            let dx = target.x - start.x;
                            let dy = target.y - start.y;
                            cell.migration_distance = (dx * dx + dy * dy).sqrt();
                            cell.migration_path = Some(build_migration_path(start, target.clone()));
                        }
                        let mut extra = serde_json::Map::new();
                        extra.insert(
                            "reasonCodes".into(),
                            serde_json::json!([DevelopmentReasonCode::DifferentiationAssigned]),
                        );
                        push_dev_event(
                            &mut result.events,
                            "cell_type_assigned",
                            tick,
                            cell,
                            &format!("{} assigned cell type {:?}.", cell.id, ctype),
                            extra,
                        );
                    }
                }
                if cell.phase_age >= config.differentiation_duration_ticks
                    && cell.target_position.is_some()
                {
                    cell.lifecycle = LifecycleState::Migrating;
                    cell.phase_age = 0;
                    cell.migration_progress = 0.0;
                    let mut extra = serde_json::Map::new();
                    extra.insert("previousState".into(), serde_json::json!(prev));
                    extra.insert("newState".into(), serde_json::json!(cell.lifecycle));
                    push_dev_event(
                        &mut result.events,
                        "migration_started",
                        tick,
                        cell,
                        &format!(
                            "{} began migration toward settlement site at ({:.2}, {:.2}).",
                            cell.id,
                            cell.target_position.as_ref().map(|p| p.x).unwrap_or(0.0),
                            cell.target_position.as_ref().map(|p| p.y).unwrap_or(0.0)
                        ),
                        extra,
                    );
                }
            }
            LifecycleState::Migrating => {
                if let Some(path) = cell.migration_path.clone() {
                    let (next, prog, seg, reached, reasons) = advance_migration(
                        &cell.position,
                        &path,
                        cell.migration_progress,
                        config.migration_step_limit,
                        config.migration_duration_ticks,
                    );
                    cell.position = next;
                    cell.migration_progress = prog;
                    if let Some(p) = cell.migration_path.as_mut() {
                        p.current_segment = seg;
                    }
                    if cell.phase_age == 1 || cell.phase_age % 4 == 0 || reached {
                        let mut extra = serde_json::Map::new();
                        extra.insert("progress".into(), serde_json::json!(prog));
                        extra.insert("reasonCodes".into(), serde_json::json!(reasons));
                        push_dev_event(
                            &mut result.events,
                            if reached {
                                "migration_completed"
                            } else {
                                "migration_progressed"
                            },
                            tick,
                            cell,
                            &format!("{} migration progress {:.0}%.", cell.id, prog * 100.0),
                            extra,
                        );
                    }
                    if reached || cell.phase_age >= config.migration_duration_ticks {
                        if let Some(t) = cell.target_position.clone() {
                            cell.position = t;
                        }
                        cell.migration_progress = 1.0;
                        cell.lifecycle = LifecycleState::Settling;
                        cell.phase_age = 0;
                        let mut extra = serde_json::Map::new();
                        extra.insert(
                            "previousState".into(),
                            serde_json::json!(LifecycleState::Migrating),
                        );
                        extra.insert("newState".into(), serde_json::json!(cell.lifecycle));
                        push_dev_event(
                            &mut result.events,
                            "settling_started",
                            tick,
                            cell,
                            &format!("{} entered settling at target position.", cell.id),
                            extra,
                        );
                    }
                }
            }
            LifecycleState::Settling => {
                if cell.phase_age >= config.settling_duration_ticks {
                    cell.lifecycle = LifecycleState::Settled;
                    cell.settled_tick = Some(tick);
                    cell.electrically_eligible_from_tick = Some(tick + 1);
                    cell.structurally_eligible_from_tick = Some(tick + 1);
                    cell.apply_morphology(
                        mature.soma_radius,
                        mature.dendrite_radius,
                        mature.axon_reach,
                        1.0,
                    );
                    result.settled_this_tick.push(cell.id.clone());
                    let mut extra = serde_json::Map::new();
                    extra.insert("previousState".into(), serde_json::json!(prev));
                    extra.insert("newState".into(), serde_json::json!(cell.lifecycle));
                    extra.insert(
                        "electricallyEligibleFromTick".into(),
                        serde_json::json!(tick + 1),
                    );
                    push_dev_event(
                        &mut result.events,
                        "neuron_settled",
                        tick,
                        cell,
                        &format!(
                            "{} settled and will become electrically eligible at Tick {}.",
                            cell.id,
                            tick + 1
                        ),
                        extra,
                    );
                }
            }
            _ => {}
        }

        let (sr, dr, ar, mp) =
            morphology_for_lifecycle(cell.lifecycle, cell.phase_age, config, &mature);
        if cell.lifecycle != LifecycleState::Settled {
            cell.apply_morphology(sr, dr, ar, mp);
        }
    }

    // Birth planning (network applies spawn).
    let developing = neurons
        .iter()
        .filter(|n| n.lifecycle != LifecycleState::Settled)
        .count();
    let total = neurons.len();
    let birth_ok_interval = match latest_birth_tick {
        None => tick >= config.first_birth_tick,
        Some(t) => tick >= t.saturating_add(config.minimum_birth_interval_ticks),
    };
    let next_elig = match latest_birth_tick {
        None => Some(config.first_birth_tick),
        Some(t) => Some(t.saturating_add(config.minimum_birth_interval_ticks)),
    };

    if total >= config.maximum_total_neurons {
        if tick % 20 == 0 {
            result.events.push(serde_json::json!({
                "eventType": "population_capacity_reached",
                "tick": tick,
                "message": format!("Population capacity reached ({}/{}).", total, config.maximum_total_neurons),
                "reasonCodes": [DevelopmentReasonCode::PopulationCapacity],
            }));
        }
    } else if developing >= config.maximum_concurrent_developing_cells {
        // blocked by concurrent limit — silent unless milestone
    } else if birth_ok_interval && total < config.maximum_total_neurons {
        let pos = birth_position_for_index(config, birth_count);
        result.birth = Some(BirthPlan {
            neuron_number: next_neuron_number,
            birth_tick: tick,
            position: pos.clone(),
        });
        result.events.push(serde_json::json!({
            "eventType": "progenitor_born",
            "tick": tick,
            "cellId": format!("NEURON-{:03}", next_neuron_number),
            "neuronId": format!("NEURON-{:03}", next_neuron_number),
            "lifecycleState": "maturing",
            "currentPosition": pos,
            "message": format!("Neural progenitor NEURON-{:03} born in Simplified Progenitor Zone.", next_neuron_number),
            "reasonCodes": [DevelopmentReasonCode::BirthEligible],
            "nextBirthEligibilityTick": next_elig.map(|t| t + config.minimum_birth_interval_ticks),
        }));
        result.events.push(serde_json::json!({
            "eventType": "maturation_started",
            "tick": tick,
            "cellId": format!("NEURON-{:03}", next_neuron_number),
            "neuronId": format!("NEURON-{:03}", next_neuron_number),
            "lifecycleState": "maturing",
            "message": format!("NEURON-{:03} began maturation.", next_neuron_number),
        }));
    } else if !birth_ok_interval {
        let _ = DevelopmentReasonCode::BirthInterval;
    }

    let _ = next_elig;
    result
}

/// Build API development summary.
pub fn build_summary(
    config: &DevelopmentConfig,
    neurons: &[Neuron],
    latest_birth_tick: Option<u64>,
    latest_eval_tick: Option<u64>,
) -> DevelopmentSummary {
    let settled = neurons
        .iter()
        .filter(|n| n.lifecycle == LifecycleState::Settled)
        .count();
    let developing = neurons.len().saturating_sub(settled);
    let next_birth = if neurons.len() >= config.maximum_total_neurons {
        None
    } else {
        match latest_birth_tick {
            None => Some(config.first_birth_tick),
            Some(t) => Some(t.saturating_add(config.minimum_birth_interval_ticks)),
        }
    };
    let activity = neurons
        .iter()
        .filter(|n| n.lifecycle != LifecycleState::Settled)
        .map(|n| format!("{}:{:?}", n.id, n.lifecycle))
        .collect::<Vec<_>>()
        .join(", ");
    DevelopmentSummary {
        enabled: config.enabled,
        total_cell_count: neurons.len(),
        settled_neuron_count: settled,
        developing_cell_count: developing,
        population_capacity: config.maximum_total_neurons,
        latest_birth_tick,
        latest_development_evaluation_tick: latest_eval_tick,
        next_birth_eligibility_tick: next_birth,
        current_lifecycle_activity: if activity.is_empty() {
            "idle".into()
        } else {
            activity
        },
        progenitor_zone: config.progenitor_zone.clone(),
        settlement_zones: config.settlement_zones.clone(),
        config: config.summary_config(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn target_selection_is_deterministic() {
        let config = DevelopmentConfig::default();
        let occupied = vec![
            TissuePosition { x: 0.22, y: 0.30 },
            TissuePosition { x: 0.50, y: 0.28 },
            TissuePosition { x: 0.78, y: 0.32 },
            TissuePosition { x: 0.34, y: 0.58 },
            TissuePosition { x: 0.66, y: 0.62 },
        ];
        let a = select_settlement_target(&config, &occupied, &[]).unwrap();
        let b = select_settlement_target(&config, &occupied, &[]).unwrap();
        assert_eq!(a, b);
        assert!(a.x >= 0.0 && a.x <= 1.0);
        assert!(a.y >= 0.0 && a.y <= 1.0);
        for o in &occupied {
            assert!(dist(&a, o) >= MIN_SOMA_SPACING - 1e-9);
        }
    }

    #[test]
    fn differentiation_prefers_ratio() {
        let config = DevelopmentConfig::default();
        let mut neurons = vec![
            Neuron::new_settled_demo(1, CellType::Excitatory, 0.2, 0.3, 1),
            Neuron::new_settled_demo(2, CellType::Excitatory, 0.5, 0.3, 1),
            Neuron::new_settled_demo(3, CellType::Excitatory, 0.8, 0.3, 1),
            Neuron::new_settled_demo(4, CellType::Excitatory, 0.3, 0.6, 2),
            Neuron::new_settled_demo(5, CellType::Inhibitory, 0.7, 0.6, 2),
        ];
        // 4/5 = 0.8 > 0.75 → choose inhibitory
        assert_eq!(choose_cell_type(&config, &neurons), CellType::Inhibitory);
        neurons.push(Neuron::new_settled_demo(
            6,
            CellType::Inhibitory,
            0.5,
            0.5,
            2,
        ));
        // 4/6 ≈ 0.67 < 0.75 → excitatory
        assert_eq!(choose_cell_type(&config, &neurons), CellType::Excitatory);
    }

    #[test]
    fn migration_reaches_target_without_overshoot() {
        let start = TissuePosition { x: 0.5, y: 0.9 };
        let target = TissuePosition { x: 0.3, y: 0.4 };
        let path = build_migration_path(start.clone(), target.clone());
        let mut pos = start;
        let mut prog = 0.0;
        for _ in 0..40 {
            let (n, p, _, reached, _) = advance_migration(&pos, &path, prog, 0.08, 16);
            pos = n;
            prog = p;
            if reached {
                break;
            }
        }
        assert!((pos.x - target.x).abs() < 1e-9);
        assert!((pos.y - target.y).abs() < 1e-9);
        assert!((prog - 1.0).abs() < 1e-9);
    }
}
