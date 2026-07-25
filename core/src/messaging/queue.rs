//! Per-cell inbox.
//!
//! Each cell owns its queue. There is no shared bus and no central router.

use super::Message;

/// FIFO message queue local to a single cell.
#[derive(Debug, Clone, Default)]
pub struct MessageQueue {
    pending: Vec<Message>,
}

impl MessageQueue {
    /// Create an empty queue.
    pub fn new() -> Self {
        Self {
            pending: Vec::new(),
        }
    }

    /// Number of waiting messages.
    pub fn len(&self) -> usize {
        self.pending.len()
    }

    /// Whether the queue is empty.
    pub fn is_empty(&self) -> bool {
        self.pending.is_empty()
    }

    /// Enqueue a message at the tail.
    pub fn enqueue(&mut self, message: Message) {
        self.pending.push(message);
    }

    /// Drain all pending messages in arrival order.
    pub fn drain(&mut self) -> Vec<Message> {
        std::mem::take(&mut self.pending)
    }

    /// Peek at pending messages without removing them.
    pub fn pending(&self) -> &[Message] {
        &self.pending
    }
}

#[cfg(test)]
mod tests {
    use uuid::Uuid;

    use super::*;

    #[test]
    fn enqueue_and_drain_preserve_order() {
        let sender = Uuid::new_v4();
        let mut queue = MessageQueue::new();
        queue.enqueue(Message::new(sender, "one"));
        queue.enqueue(Message::new(sender, "two"));
        assert_eq!(queue.len(), 2);

        let drained = queue.drain();
        assert_eq!(drained.len(), 2);
        assert_eq!(drained[0].payload, "one");
        assert_eq!(drained[1].payload, "two");
        assert!(queue.is_empty());
    }
}
