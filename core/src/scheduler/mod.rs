//! Local tick clock for a cell runtime instance.
//!
//! This is **not** a master scheduler of the NEURONET society. Each runtime
//! owns its own clock. When millions of cells exist, each living instance (or
//! local colony runtime) advances on its own tempo. No global orchestrator
//! decides when every cell may think.

use std::time::Duration;

use tokio::time::{interval, MissedTickBehavior};

/// Interval between autonomous lifecycle advances.
pub const DEFAULT_TICK_INTERVAL: Duration = Duration::from_secs(1);

/// Local scheduler that yields tick signals for its owning runtime.
#[derive(Debug)]
pub struct LocalScheduler {
    period: Duration,
}

impl Default for LocalScheduler {
    fn default() -> Self {
        Self::new(DEFAULT_TICK_INTERVAL)
    }
}

impl LocalScheduler {
    /// Create a scheduler with the given period between ticks.
    pub fn new(period: Duration) -> Self {
        Self { period }
    }

    /// Period between successive tick signals.
    pub fn period(&self) -> Duration {
        self.period
    }

    /// Run `on_tick` once every period until the future returns an error or the
    /// provided shutdown flag becomes true.
    ///
    /// The callback is invoked immediately on the first tick (after the
    /// interval is armed with `MissedTickBehavior::Delay`) and then once per
    /// period. The first fire of a Tokio interval is instantaneous; we skip
    /// that burst and wait one full period so the organism breathes at 1 Hz
    /// from wall-clock start, then continue.
    pub async fn run_until<F, E>(&self, mut on_tick: F, mut should_stop: impl FnMut() -> bool) -> Result<(), E>
    where
        F: FnMut() -> Result<(), E>,
    {
        let mut ticker = interval(self.period);
        ticker.set_missed_tick_behavior(MissedTickBehavior::Delay);

        // Consume the immediate first tick so the cell advances once per second
        // of real time rather than immediately on startup burst.
        ticker.tick().await;

        loop {
            ticker.tick().await;
            if should_stop() {
                break;
            }
            on_tick()?;
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use std::sync::{
        atomic::{AtomicUsize, Ordering},
        Arc,
    };
    use std::time::Duration;

    use super::*;

    #[tokio::test]
    async fn fires_approximately_once_per_period() {
        let scheduler = LocalScheduler::new(Duration::from_millis(40));
        let count = Arc::new(AtomicUsize::new(0));
        let observed = Arc::clone(&count);

        let result = tokio::time::timeout(Duration::from_millis(180), async {
            scheduler
                .run_until(
                    || {
                        observed.fetch_add(1, Ordering::SeqCst);
                        Ok::<(), ()>(())
                    },
                    || count.load(Ordering::SeqCst) >= 3,
                )
                .await
        })
        .await;

        assert!(result.is_ok());
        assert!(count.load(Ordering::SeqCst) >= 3);
    }
}
