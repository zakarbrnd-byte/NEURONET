//! Version 0.8 — Autonomous Sensory Environment.
//!
//! Deterministic virtual environment that supplies structured sensory input
//! through dedicated receptor channels. Not real sensors, perception, or cognition.

use serde::{Deserialize, Serialize};

use crate::neuron::Position;

pub const MAX_ENVIRONMENT_HISTORY: usize = 80;

/// Named environment activity preset.
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub enum EnvironmentPreset {
    Quiet,
    #[default]
    Balanced,
    Active,
}

/// Abstract receptor channel type (not biological receptor cells).
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ReceptorType {
    Background,
    TouchA,
    TouchB,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct EnvironmentConfig {
    pub enabled: bool,
    pub deterministic_seed: u64,
    pub preset: EnvironmentPreset,
    pub background_enabled: bool,
    pub background_interval_ticks: u64,
    pub background_strength_mv: f64,
    pub pattern_a_enabled: bool,
    pub pattern_b_enabled: bool,
    pub pattern_a_interval_ticks: u64,
    pub pattern_b_interval_ticks: u64,
    pub pattern_a_first_tick: u64,
    pub pattern_b_first_tick: u64,
    pub maximum_events_per_tick: usize,
    pub event_history_limit: usize,
}

impl Default for EnvironmentConfig {
    fn default() -> Self {
        Self::balanced()
    }
}

impl EnvironmentConfig {
    pub fn quiet() -> Self {
        Self {
            enabled: true,
            deterministic_seed: 20260801,
            preset: EnvironmentPreset::Quiet,
            background_enabled: true,
            background_interval_ticks: 12,
            background_strength_mv: 1.0,
            pattern_a_enabled: true,
            pattern_b_enabled: false,
            pattern_a_interval_ticks: 40,
            pattern_b_interval_ticks: 55,
            pattern_a_first_tick: 20,
            pattern_b_first_tick: 35,
            maximum_events_per_tick: 4,
            event_history_limit: MAX_ENVIRONMENT_HISTORY,
        }
    }

    pub fn balanced() -> Self {
        Self {
            enabled: true,
            deterministic_seed: 20260801,
            preset: EnvironmentPreset::Balanced,
            background_enabled: true,
            background_interval_ticks: 8,
            background_strength_mv: 2.0,
            pattern_a_enabled: true,
            pattern_b_enabled: true,
            pattern_a_interval_ticks: 24,
            pattern_b_interval_ticks: 36,
            pattern_a_first_tick: 16,
            pattern_b_first_tick: 28,
            maximum_events_per_tick: 6,
            event_history_limit: MAX_ENVIRONMENT_HISTORY,
        }
    }

    pub fn active() -> Self {
        Self {
            enabled: true,
            deterministic_seed: 20260801,
            preset: EnvironmentPreset::Active,
            background_enabled: true,
            background_interval_ticks: 5,
            background_strength_mv: 3.0,
            pattern_a_enabled: true,
            pattern_b_enabled: true,
            pattern_a_interval_ticks: 16,
            pattern_b_interval_ticks: 22,
            pattern_a_first_tick: 10,
            pattern_b_first_tick: 18,
            maximum_events_per_tick: 8,
            event_history_limit: MAX_ENVIRONMENT_HISTORY,
        }
    }

    pub fn from_preset(preset: EnvironmentPreset) -> Self {
        match preset {
            EnvironmentPreset::Quiet => Self::quiet(),
            EnvironmentPreset::Balanced => Self::balanced(),
            EnvironmentPreset::Active => Self::active(),
        }
    }

    pub fn summary(&self) -> EnvironmentConfigSummary {
        EnvironmentConfigSummary {
            enabled: self.enabled,
            deterministic_seed: self.deterministic_seed,
            preset: self.preset,
            background_enabled: self.background_enabled,
            background_interval_ticks: self.background_interval_ticks,
            background_strength_mv: self.background_strength_mv,
            pattern_a_enabled: self.pattern_a_enabled,
            pattern_b_enabled: self.pattern_b_enabled,
            pattern_a_interval_ticks: self.pattern_a_interval_ticks,
            pattern_b_interval_ticks: self.pattern_b_interval_ticks,
            pattern_a_first_tick: self.pattern_a_first_tick,
            pattern_b_first_tick: self.pattern_b_first_tick,
            maximum_events_per_tick: self.maximum_events_per_tick,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct EnvironmentConfigSummary {
    pub enabled: bool,
    pub deterministic_seed: u64,
    pub preset: EnvironmentPreset,
    pub background_enabled: bool,
    pub background_interval_ticks: u64,
    pub background_strength_mv: f64,
    pub pattern_a_enabled: bool,
    pub pattern_b_enabled: bool,
    pub pattern_a_interval_ticks: u64,
    pub pattern_b_interval_ticks: u64,
    pub pattern_a_first_tick: u64,
    pub pattern_b_first_tick: u64,
    pub maximum_events_per_tick: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SensoryReceptor {
    pub id: String,
    pub receptor_type: ReceptorType,
    pub position: Position,
    pub region: String,
    pub sensitivity: f64,
    pub activation_threshold: f64,
    pub current_activation: f64,
    pub last_activated_tick: Option<u64>,
    pub activation_count: u64,
    pub active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SensoryConnection {
    pub id: String,
    pub receptor_id: String,
    pub target_neuron_id: String,
    pub weight_mv: f64,
    pub enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct PatternStep {
    pub offset_ticks: u64,
    pub receptor_id: String,
    pub magnitude_mv: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SensoryPattern {
    pub id: String,
    pub name: String,
    pub steps: Vec<PatternStep>,
    pub repetition_interval_ticks: u64,
    pub first_tick: u64,
    pub enabled: bool,
    pub activation_count: u64,
    pub last_started_tick: Option<u64>,
    pub active: bool,
    pub active_started_tick: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct EnvironmentStatistics {
    pub total_events: u64,
    pub background_events: u64,
    pub pattern_a_starts: u64,
    pub pattern_b_starts: u64,
    pub receptor_activations: u64,
    pub sensory_deliveries: u64,
}

impl Default for EnvironmentStatistics {
    fn default() -> Self {
        Self {
            total_events: 0,
            background_events: 0,
            pattern_a_starts: 0,
            pattern_b_starts: 0,
            receptor_activations: 0,
            sensory_deliveries: 0,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct EnvironmentHistoryEntry {
    pub event_id: String,
    pub tick: u64,
    pub kind: String,
    pub pattern_id: Option<String>,
    pub receptor_id: Option<String>,
    pub target_neuron_id: Option<String>,
    pub magnitude_mv: Option<f64>,
    pub sequence_step: Option<u64>,
    pub reason_codes: Vec<String>,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct EnvironmentSnapshot {
    pub environment_id: String,
    pub name: String,
    pub enabled: bool,
    pub mode: String,
    pub preset: EnvironmentPreset,
    pub seed: u64,
    pub age_ticks: u64,
    pub event_count: u64,
    pub latest_event_tick: Option<u64>,
    pub next_scheduled_event_tick: Option<u64>,
    pub next_background_tick: Option<u64>,
    pub next_pattern_a_tick: Option<u64>,
    pub next_pattern_b_tick: Option<u64>,
    pub active_patterns: Vec<String>,
    pub statistics: EnvironmentStatistics,
    pub config: EnvironmentConfigSummary,
    pub receptors: Vec<SensoryReceptor>,
    pub sensory_connections: Vec<SensoryConnection>,
    pub patterns: Vec<SensoryPattern>,
    pub recent_events: Vec<EnvironmentHistoryEntry>,
    pub sensory_input_count: usize,
    pub neural_synapse_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SensoryDeliveryTrace {
    pub receptor_id: String,
    pub target_neuron_id: String,
    pub magnitude_mv: f64,
    pub connection_id: String,
    pub event_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
#[serde(rename_all = "camelCase")]
pub struct EnvironmentTrace {
    pub events_generated: Vec<String>,
    pub receptors_activated: Vec<String>,
    pub sensory_deliveries: Vec<SensoryDeliveryTrace>,
    pub active_patterns: Vec<String>,
}

#[derive(Debug, Clone)]
pub struct PendingSensoryDelivery {
    pub receptor_id: String,
    pub target_neuron_id: String,
    pub magnitude_mv: f64,
    pub connection_id: String,
    pub environment_event_id: String,
    pub pattern_id: Option<String>,
    pub sequence_step: Option<u64>,
}

#[derive(Debug, Clone, Default)]
pub struct EnvironmentPhaseResult {
    pub deliveries: Vec<PendingSensoryDelivery>,
    pub events: Vec<serde_json::Value>,
    pub history: Vec<EnvironmentHistoryEntry>,
    pub trace: EnvironmentTrace,
}

/// Full environment runtime state owned by the network.
#[derive(Debug, Clone)]
pub struct SensoryEnvironment {
    pub config: EnvironmentConfig,
    pub age_ticks: u64,
    pub next_event_number: u64,
    pub receptors: Vec<SensoryReceptor>,
    pub connections: Vec<SensoryConnection>,
    pub patterns: Vec<SensoryPattern>,
    pub statistics: EnvironmentStatistics,
    pub history: Vec<EnvironmentHistoryEntry>,
    pub latest_event_tick: Option<u64>,
    pub last_background_tick: Option<u64>,
}

impl SensoryEnvironment {
    pub fn initial() -> Self {
        Self::with_config(EnvironmentConfig::balanced())
    }

    pub fn with_config(config: EnvironmentConfig) -> Self {
        let mut env = Self {
            config: config.clone(),
            age_ticks: 0,
            next_event_number: 1,
            receptors: initial_receptors(),
            connections: initial_connections(),
            patterns: initial_patterns(&config),
            statistics: EnvironmentStatistics::default(),
            history: Vec::new(),
            latest_event_tick: None,
            last_background_tick: None,
        };
        env.sync_pattern_intervals_from_config();
        env
    }

    pub fn apply_preset(&mut self, preset: EnvironmentPreset) {
        let mut next = EnvironmentConfig::from_preset(preset);
        // Preserve enable toggles chosen by operator where sensible.
        next.enabled = self.config.enabled;
        next.background_enabled = self.config.background_enabled;
        next.pattern_a_enabled = self.config.pattern_a_enabled;
        next.pattern_b_enabled = self.config.pattern_b_enabled;
        self.config = next;
        self.sync_pattern_intervals_from_config();
    }

    fn sync_pattern_intervals_from_config(&mut self) {
        for p in &mut self.patterns {
            match p.id.as_str() {
                "PATTERN-A" => {
                    p.repetition_interval_ticks = self.config.pattern_a_interval_ticks;
                    p.first_tick = self.config.pattern_a_first_tick;
                    p.enabled = self.config.pattern_a_enabled;
                }
                "PATTERN-B" => {
                    p.repetition_interval_ticks = self.config.pattern_b_interval_ticks;
                    p.first_tick = self.config.pattern_b_first_tick;
                    p.enabled = self.config.pattern_b_enabled;
                }
                _ => {}
            }
        }
    }

    fn alloc_event_id(&mut self) -> String {
        let id = format!("ENV-{:04}", self.next_event_number);
        self.next_event_number = self.next_event_number.saturating_add(1);
        id
    }

    fn push_history(&mut self, entry: EnvironmentHistoryEntry) {
        self.history.push(entry);
        let limit = self.config.event_history_limit.max(1);
        while self.history.len() > limit {
            self.history.remove(0);
        }
    }

    pub fn next_background_tick(&self) -> Option<u64> {
        if !self.config.enabled || !self.config.background_enabled {
            return None;
        }
        let interval = self.config.background_interval_ticks.max(1);
        match self.last_background_tick {
            None => Some(interval),
            Some(t) => Some(t.saturating_add(interval)),
        }
    }

    pub fn next_pattern_tick(&self, pattern_id: &str) -> Option<u64> {
        let pattern = self.patterns.iter().find(|p| p.id == pattern_id)?;
        if !self.config.enabled || !pattern.enabled {
            return None;
        }
        match pattern.last_started_tick {
            None => Some(pattern.first_tick),
            Some(t) => Some(t.saturating_add(pattern.repetition_interval_ticks.max(1))),
        }
    }

    pub fn next_scheduled_event_tick(&self) -> Option<u64> {
        let mut times = Vec::new();
        if let Some(t) = self.next_background_tick() {
            times.push(t);
        }
        if let Some(t) = self.next_pattern_tick("PATTERN-A") {
            times.push(t);
        }
        if let Some(t) = self.next_pattern_tick("PATTERN-B") {
            times.push(t);
        }
        // In-flight pattern steps.
        for p in &self.patterns {
            if p.active {
                if let Some(start) = p.active_started_tick {
                    for step in &p.steps {
                        let t = start.saturating_add(step.offset_ticks);
                        if t > self.age_ticks {
                            times.push(t);
                        }
                    }
                }
            }
        }
        times.into_iter().min()
    }

    /// Advance environment for the current network tick and produce sensory deliveries.
    pub fn evaluate_tick(&mut self, tick: u64) -> EnvironmentPhaseResult {
        let mut result = EnvironmentPhaseResult::default();
        self.age_ticks = tick;

        // Clear transient activation flags each tick.
        for r in &mut self.receptors {
            r.active = false;
            r.current_activation = 0.0;
        }

        if !self.config.enabled {
            result.events.push(serde_json::json!({
                "eventType": "environment_paused",
                "tick": tick,
                "message": "Environment disabled — no sensory events.",
                "reasonCodes": ["environment_disabled"],
            }));
            return result;
        }

        let mut events_this_tick = 0usize;
        let max_events = self.config.maximum_events_per_tick.max(1);

        // 1) Continue active pattern steps for this tick.
        let pattern_ids: Vec<String> = self.patterns.iter().map(|p| p.id.clone()).collect();
        for pid in pattern_ids {
            if events_this_tick >= max_events {
                break;
            }
            let Some(pattern) = self.patterns.iter().find(|p| p.id == pid).cloned() else {
                continue;
            };
            if !pattern.active || !pattern.enabled {
                continue;
            }
            let Some(start) = pattern.active_started_tick else {
                continue;
            };
            let relative = tick.saturating_sub(start);
            let steps_now: Vec<_> = pattern
                .steps
                .iter()
                .enumerate()
                .filter(|(_, s)| s.offset_ticks == relative)
                .map(|(i, s)| (i as u64, s.clone()))
                .collect();

            for (step_idx, step) in steps_now {
                if events_this_tick >= max_events {
                    break;
                }
                let env_id = self.alloc_event_id();
                let deliveries = self.activate_receptor(
                    &step.receptor_id,
                    step.magnitude_mv,
                    tick,
                    &env_id,
                    Some(pid.clone()),
                    Some(step_idx),
                    &mut result,
                );
                events_this_tick = events_this_tick.saturating_add(1);
                self.statistics.total_events = self.statistics.total_events.saturating_add(1);
                self.latest_event_tick = Some(tick);
                let message = format!(
                    "{} step {} — {} +{:.1} mV.",
                    pid, step_idx, step.receptor_id, step.magnitude_mv
                );
                let hist = EnvironmentHistoryEntry {
                    event_id: env_id.clone(),
                    tick,
                    kind: "sensory_pattern_step".into(),
                    pattern_id: Some(pid.clone()),
                    receptor_id: Some(step.receptor_id.clone()),
                    target_neuron_id: deliveries.first().map(|d| d.target_neuron_id.clone()),
                    magnitude_mv: Some(step.magnitude_mv),
                    sequence_step: Some(step_idx),
                    reason_codes: vec!["pattern_step".into()],
                    message: message.clone(),
                };
                self.push_history(hist.clone());
                result.history.push(hist);
                result.events.push(serde_json::json!({
                    "eventType": "sensory_pattern_step",
                    "tick": tick,
                    "environmentEventId": env_id,
                    "patternId": pid,
                    "receptorId": step.receptor_id,
                    "magnitudeMv": step.magnitude_mv,
                    "sequenceStep": step_idx,
                    "reasonCodes": ["pattern_step"],
                    "message": message,
                }));
                result.trace.events_generated.push(env_id);
            }

            // Complete pattern when past last step.
            if let Some(p) = self.patterns.iter_mut().find(|p| p.id == pid) {
                if p.active {
                    let max_offset = p.steps.iter().map(|s| s.offset_ticks).max().unwrap_or(0);
                    if tick >= start.saturating_add(max_offset) {
                        p.active = false;
                        p.active_started_tick = None;
                        let env_id = self.alloc_event_id();
                        let message = format!("{pid} completed.");
                        let hist = EnvironmentHistoryEntry {
                            event_id: env_id.clone(),
                            tick,
                            kind: "sensory_pattern_completed".into(),
                            pattern_id: Some(pid.clone()),
                            receptor_id: None,
                            target_neuron_id: None,
                            magnitude_mv: None,
                            sequence_step: None,
                            reason_codes: vec!["pattern_complete".into()],
                            message: message.clone(),
                        };
                        self.push_history(hist.clone());
                        result.history.push(hist);
                        result.events.push(serde_json::json!({
                            "eventType": "sensory_pattern_completed",
                            "tick": tick,
                            "environmentEventId": env_id,
                            "patternId": pid,
                            "reasonCodes": ["pattern_complete"],
                            "message": message,
                        }));
                        result.trace.events_generated.push(env_id);
                    }
                }
            }
        }

        // 2) Start patterns when schedule hits.
        for pid in ["PATTERN-A", "PATTERN-B"] {
            if events_this_tick >= max_events {
                break;
            }
            let should_start = {
                let p = self.patterns.iter().find(|p| p.id == pid);
                match p {
                    Some(p) if p.enabled && !p.active => {
                        let next = match p.last_started_tick {
                            None => p.first_tick,
                            Some(t) => t.saturating_add(p.repetition_interval_ticks.max(1)),
                        };
                        tick == next
                    }
                    _ => false,
                }
            };
            if !should_start {
                continue;
            }
            if let Some(p) = self.patterns.iter_mut().find(|p| p.id == pid) {
                p.active = true;
                p.active_started_tick = Some(tick);
                p.last_started_tick = Some(tick);
                p.activation_count = p.activation_count.saturating_add(1);
            }
            if pid == "PATTERN-A" {
                self.statistics.pattern_a_starts =
                    self.statistics.pattern_a_starts.saturating_add(1);
            } else {
                self.statistics.pattern_b_starts =
                    self.statistics.pattern_b_starts.saturating_add(1);
            }
            let env_id = self.alloc_event_id();
            let message = format!("{pid} started.");
            let hist = EnvironmentHistoryEntry {
                event_id: env_id.clone(),
                tick,
                kind: "sensory_pattern_started".into(),
                pattern_id: Some(pid.into()),
                receptor_id: None,
                target_neuron_id: None,
                magnitude_mv: None,
                sequence_step: None,
                reason_codes: vec!["pattern_schedule".into()],
                message: message.clone(),
            };
            self.push_history(hist.clone());
            result.history.push(hist);
            result.events.push(serde_json::json!({
                "eventType": "sensory_pattern_started",
                "tick": tick,
                "environmentEventId": env_id,
                "patternId": pid,
                "reasonCodes": ["pattern_schedule"],
                "message": message,
            }));
            result.trace.events_generated.push(env_id);
            self.statistics.total_events = self.statistics.total_events.saturating_add(1);
            self.latest_event_tick = Some(tick);
            events_this_tick = events_this_tick.saturating_add(1);

            // Immediately apply offset-0 steps for this start tick.
            let steps0: Vec<PatternStep> = self
                .patterns
                .iter()
                .find(|p| p.id == pid)
                .map(|p| {
                    p.steps
                        .iter()
                        .filter(|s| s.offset_ticks == 0)
                        .cloned()
                        .collect()
                })
                .unwrap_or_default();
            for (step_idx, step) in steps0.into_iter().enumerate() {
                if events_this_tick >= max_events {
                    break;
                }
                let env_id = self.alloc_event_id();
                let _ = self.activate_receptor(
                    &step.receptor_id,
                    step.magnitude_mv,
                    tick,
                    &env_id,
                    Some(pid.into()),
                    Some(step_idx as u64),
                    &mut result,
                );
                events_this_tick = events_this_tick.saturating_add(1);
                self.statistics.total_events = self.statistics.total_events.saturating_add(1);
                let message = format!(
                    "{} step {} — {} +{:.1} mV.",
                    pid, step_idx, step.receptor_id, step.magnitude_mv
                );
                let hist = EnvironmentHistoryEntry {
                    event_id: env_id.clone(),
                    tick,
                    kind: "sensory_pattern_step".into(),
                    pattern_id: Some(pid.into()),
                    receptor_id: Some(step.receptor_id.clone()),
                    target_neuron_id: None,
                    magnitude_mv: Some(step.magnitude_mv),
                    sequence_step: Some(step_idx as u64),
                    reason_codes: vec!["pattern_step".into()],
                    message: message.clone(),
                };
                self.push_history(hist.clone());
                result.history.push(hist);
                result.events.push(serde_json::json!({
                    "eventType": "sensory_pattern_step",
                    "tick": tick,
                    "environmentEventId": env_id,
                    "patternId": pid,
                    "receptorId": step.receptor_id,
                    "magnitudeMv": step.magnitude_mv,
                    "sequenceStep": step_idx,
                    "reasonCodes": ["pattern_step"],
                    "message": message,
                }));
                result.trace.events_generated.push(env_id);
            }
        }

        // 3) Background pulse (conservative, after patterns so patterns dominate).
        if self.config.background_enabled && events_this_tick < max_events {
            let due = match self.last_background_tick {
                None => tick >= self.config.background_interval_ticks.max(1),
                Some(t) => tick >= t.saturating_add(self.config.background_interval_ticks.max(1)),
            };
            if due {
                let env_id = self.alloc_event_id();
                let magnitude = self.config.background_strength_mv;
                let _ = self.activate_receptor(
                    "RECEPTOR-BG",
                    magnitude,
                    tick,
                    &env_id,
                    None,
                    None,
                    &mut result,
                );
                self.last_background_tick = Some(tick);
                self.statistics.background_events =
                    self.statistics.background_events.saturating_add(1);
                self.statistics.total_events = self.statistics.total_events.saturating_add(1);
                self.latest_event_tick = Some(tick);
                let message = format!("Background pulse +{magnitude:.1} mV via RECEPTOR-BG.");
                let hist = EnvironmentHistoryEntry {
                    event_id: env_id.clone(),
                    tick,
                    kind: "environment_event_started".into(),
                    pattern_id: None,
                    receptor_id: Some("RECEPTOR-BG".into()),
                    target_neuron_id: Some("NEURON-001".into()),
                    magnitude_mv: Some(magnitude),
                    sequence_step: None,
                    reason_codes: vec!["background_pulse".into()],
                    message: message.clone(),
                };
                self.push_history(hist.clone());
                result.history.push(hist);
                result.events.push(serde_json::json!({
                    "eventType": "environment_event_started",
                    "tick": tick,
                    "environmentEventId": env_id,
                    "receptorId": "RECEPTOR-BG",
                    "magnitudeMv": magnitude,
                    "reasonCodes": ["background_pulse"],
                    "message": message,
                }));
                result.trace.events_generated.push(env_id);
            }
        }

        result.trace.active_patterns = self
            .patterns
            .iter()
            .filter(|p| p.active)
            .map(|p| p.id.clone())
            .collect();
        result
    }

    fn activate_receptor(
        &mut self,
        receptor_id: &str,
        magnitude_mv: f64,
        tick: u64,
        environment_event_id: &str,
        pattern_id: Option<String>,
        sequence_step: Option<u64>,
        result: &mut EnvironmentPhaseResult,
    ) -> Vec<PendingSensoryDelivery> {
        let mut deliveries = Vec::new();
        if let Some(receptor) = self.receptors.iter_mut().find(|r| r.id == receptor_id) {
            let effective = magnitude_mv * receptor.sensitivity;
            receptor.current_activation = effective;
            receptor.last_activated_tick = Some(tick);
            receptor.activation_count = receptor.activation_count.saturating_add(1);
            receptor.active = effective >= receptor.activation_threshold;
            self.statistics.receptor_activations =
                self.statistics.receptor_activations.saturating_add(1);
            result
                .trace
                .receptors_activated
                .push(receptor_id.to_string());
            result.events.push(serde_json::json!({
                "eventType": "receptor_activated",
                "tick": tick,
                "environmentEventId": environment_event_id,
                "receptorId": receptor_id,
                "magnitudeMv": effective,
                "patternId": pattern_id,
                "sequenceStep": sequence_step,
                "reasonCodes": ["receptor_channel"],
                "message": format!("{receptor_id} activated ({effective:.1} mV)."),
            }));
        }

        let mut conns: Vec<_> = self
            .connections
            .iter()
            .filter(|c| c.enabled && c.receptor_id == receptor_id)
            .cloned()
            .collect();
        conns.sort_by(|a, b| a.id.cmp(&b.id));

        for conn in conns {
            // Background: deliver pulse magnitude (capped by connection weight).
            // Touch: scale configured connection weight by pattern intensity / 12 mV.
            let amount = if receptor_id == "RECEPTOR-BG" {
                magnitude_mv.min(conn.weight_mv).max(0.0)
            } else {
                (conn.weight_mv * (magnitude_mv / 12.0)).max(0.0)
            };

            let pending = PendingSensoryDelivery {
                receptor_id: receptor_id.to_string(),
                target_neuron_id: conn.target_neuron_id.clone(),
                magnitude_mv: amount,
                connection_id: conn.id.clone(),
                environment_event_id: environment_event_id.to_string(),
                pattern_id: pattern_id.clone(),
                sequence_step,
            };
            result.trace.sensory_deliveries.push(SensoryDeliveryTrace {
                receptor_id: pending.receptor_id.clone(),
                target_neuron_id: pending.target_neuron_id.clone(),
                magnitude_mv: pending.magnitude_mv,
                connection_id: pending.connection_id.clone(),
                event_id: pending.environment_event_id.clone(),
            });
            result.events.push(serde_json::json!({
                "eventType": "receptor_input_delivered",
                "tick": tick,
                "environmentEventId": environment_event_id,
                "receptorId": receptor_id,
                "targetNeuronId": conn.target_neuron_id,
                "magnitudeMv": amount,
                "connectionId": conn.id,
                "patternId": pattern_id,
                "sequenceStep": sequence_step,
                "reasonCodes": ["sensory_delivery"],
                "message": format!(
                    "{receptor_id} delivered +{amount:.1} mV to {}.",
                    conn.target_neuron_id
                ),
            }));
            self.statistics.sensory_deliveries =
                self.statistics.sensory_deliveries.saturating_add(1);
            deliveries.push(pending.clone());
            result.deliveries.push(pending);
        }
        deliveries
    }

    pub fn snapshot(&self, neural_synapse_count: usize) -> EnvironmentSnapshot {
        let active_patterns: Vec<String> = self
            .patterns
            .iter()
            .filter(|p| p.active)
            .map(|p| p.id.clone())
            .collect();
        let mode = if self.config.enabled {
            "active".into()
        } else {
            "paused".into()
        };
        EnvironmentSnapshot {
            environment_id: "ENV-VIRTUAL-01".into(),
            name: "Virtual Sensory Environment".into(),
            enabled: self.config.enabled,
            mode,
            preset: self.config.preset,
            seed: self.config.deterministic_seed,
            age_ticks: self.age_ticks,
            event_count: self.statistics.total_events,
            latest_event_tick: self.latest_event_tick,
            next_scheduled_event_tick: self.next_scheduled_event_tick(),
            next_background_tick: self.next_background_tick(),
            next_pattern_a_tick: self.next_pattern_tick("PATTERN-A"),
            next_pattern_b_tick: self.next_pattern_tick("PATTERN-B"),
            active_patterns,
            statistics: self.statistics.clone(),
            config: self.config.summary(),
            receptors: self.receptors.clone(),
            sensory_connections: self.connections.clone(),
            patterns: self.patterns.clone(),
            recent_events: {
                let mut h = self.history.clone();
                h.reverse();
                h
            },
            sensory_input_count: self.connections.len(),
            neural_synapse_count,
        }
    }
}

fn initial_receptors() -> Vec<SensoryReceptor> {
    vec![
        SensoryReceptor {
            id: "RECEPTOR-BG".into(),
            receptor_type: ReceptorType::Background,
            position: Position { x: 0.06, y: 0.50 },
            region: "Sensory Margin".into(),
            sensitivity: 1.0,
            activation_threshold: 0.5,
            current_activation: 0.0,
            last_activated_tick: None,
            activation_count: 0,
            active: false,
        },
        SensoryReceptor {
            id: "RECEPTOR-A".into(),
            receptor_type: ReceptorType::TouchA,
            position: Position { x: 0.08, y: 0.32 },
            region: "Sensory Margin".into(),
            sensitivity: 1.0,
            activation_threshold: 0.5,
            current_activation: 0.0,
            last_activated_tick: None,
            activation_count: 0,
            active: false,
        },
        SensoryReceptor {
            id: "RECEPTOR-B".into(),
            receptor_type: ReceptorType::TouchB,
            position: Position { x: 0.08, y: 0.68 },
            region: "Sensory Margin".into(),
            sensitivity: 1.0,
            activation_threshold: 0.5,
            current_activation: 0.0,
            last_activated_tick: None,
            activation_count: 0,
            active: false,
        },
    ]
}

/// Option A: sensory wiring only to designated initial input neurons.
fn initial_connections() -> Vec<SensoryConnection> {
    vec![
        SensoryConnection {
            id: "SENSORY-001".into(),
            receptor_id: "RECEPTOR-BG".into(),
            target_neuron_id: "NEURON-001".into(),
            weight_mv: 2.0,
            enabled: true,
        },
        SensoryConnection {
            id: "SENSORY-002".into(),
            receptor_id: "RECEPTOR-A".into(),
            target_neuron_id: "NEURON-001".into(),
            weight_mv: 12.0,
            enabled: true,
        },
        SensoryConnection {
            id: "SENSORY-003".into(),
            receptor_id: "RECEPTOR-A".into(),
            target_neuron_id: "NEURON-002".into(),
            weight_mv: 6.0,
            enabled: true,
        },
        SensoryConnection {
            id: "SENSORY-004".into(),
            receptor_id: "RECEPTOR-B".into(),
            target_neuron_id: "NEURON-002".into(),
            weight_mv: 12.0,
            enabled: true,
        },
        SensoryConnection {
            id: "SENSORY-005".into(),
            receptor_id: "RECEPTOR-B".into(),
            target_neuron_id: "NEURON-003".into(),
            weight_mv: 4.0,
            enabled: true,
        },
    ]
}

fn initial_patterns(config: &EnvironmentConfig) -> Vec<SensoryPattern> {
    vec![
        SensoryPattern {
            id: "PATTERN-A".into(),
            name: "Touch Pattern A".into(),
            steps: vec![
                PatternStep {
                    offset_ticks: 0,
                    receptor_id: "RECEPTOR-A".into(),
                    magnitude_mv: 12.0,
                },
                PatternStep {
                    offset_ticks: 1,
                    receptor_id: "RECEPTOR-B".into(),
                    magnitude_mv: 6.0,
                },
            ],
            repetition_interval_ticks: config.pattern_a_interval_ticks,
            first_tick: config.pattern_a_first_tick,
            enabled: config.pattern_a_enabled,
            activation_count: 0,
            last_started_tick: None,
            active: false,
            active_started_tick: None,
        },
        SensoryPattern {
            id: "PATTERN-B".into(),
            name: "Touch Pattern B".into(),
            steps: vec![
                PatternStep {
                    offset_ticks: 0,
                    receptor_id: "RECEPTOR-B".into(),
                    magnitude_mv: 12.0,
                },
                PatternStep {
                    offset_ticks: 2,
                    receptor_id: "RECEPTOR-A".into(),
                    magnitude_mv: 4.0,
                },
            ],
            repetition_interval_ticks: config.pattern_b_interval_ticks,
            first_tick: config.pattern_b_first_tick,
            enabled: config.pattern_b_enabled,
            activation_count: 0,
            last_started_tick: None,
            active: false,
            active_started_tick: None,
        },
    ]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn balanced_defaults_are_deterministic() {
        let a = SensoryEnvironment::initial();
        let b = SensoryEnvironment::initial();
        assert_eq!(a.config, b.config);
        assert_eq!(a.receptors, b.receptors);
        assert_eq!(a.connections, b.connections);
    }

    #[test]
    fn pattern_a_starts_at_configured_tick() {
        let mut env = SensoryEnvironment::initial();
        for t in 1..16 {
            let r = env.evaluate_tick(t);
            assert!(!r.trace.active_patterns.contains(&"PATTERN-A".into()) || t >= 16);
        }
        let r = env.evaluate_tick(16);
        assert!(
            r.trace.active_patterns.contains(&"PATTERN-A".to_string())
                || env
                    .patterns
                    .iter()
                    .any(|p| p.id == "PATTERN-A" && p.activation_count == 1)
        );
        assert!(env.statistics.pattern_a_starts >= 1);
    }

    #[test]
    fn disabled_environment_emits_no_deliveries() {
        let mut env = SensoryEnvironment::initial();
        env.config.enabled = false;
        let r = env.evaluate_tick(16);
        assert!(r.deliveries.is_empty());
    }

    #[test]
    fn history_remains_bounded() {
        let mut env = SensoryEnvironment::initial();
        env.config.event_history_limit = 10;
        for t in 1..80 {
            env.evaluate_tick(t);
        }
        assert!(env.history.len() <= 10);
    }
}
