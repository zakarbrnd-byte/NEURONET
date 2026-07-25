import { useState } from "react";
import { Header } from "./components/Header";
import { StatusCard } from "./components/StatusCard";
import { ActivityFeed } from "./components/ActivityFeed";
import { INITIAL_ACTIVITY } from "./data/initialActivity";
import { DigitalNode } from "./models/DigitalNode";
import type { NodeData } from "./types/node";

// One node instance for the Debug Board session.
// Refreshing the browser creates a new node from scratch.
const digitalNode = new DigitalNode();

export default function App() {
  const [node, setNode] = useState<NodeData>(() => digitalNode.getData());
  const [activity, setActivity] = useState<string[]>(INITIAL_ACTIVITY);

  function refreshNode() {
    setNode(digitalNode.getData());
  }

  function handleSendHello() {
    digitalNode.receiveMessage("Hello");
    refreshNode();
    setActivity((current) => [...current, "Received message: Hello"]);
  }

  function handleWake() {
    digitalNode.wake();
    refreshNode();
    setActivity((current) => [...current, "Node awakened"]);
  }

  function handleSleep() {
    digitalNode.sleep();
    refreshNode();
    setActivity((current) => [...current, "Node entered sleep"]);
  }

  function handleReset() {
    digitalNode.reset();
    refreshNode();
    setActivity([...INITIAL_ACTIVITY, "Node reset"]);
  }

  return (
    <div className="page">
      <Header version="0.2" mode="Local DigitalNode" />

      <main className="main">
        <StatusCard node={node} />
        <ActivityFeed items={activity} />

        <section className="actions" aria-label="Controls">
          <button type="button" className="btn btn-primary" onClick={handleSendHello}>
            Send Hello
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleWake}>
            Wake
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleSleep}>
            Sleep
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleReset}>
            Reset
          </button>
        </section>
      </main>
    </div>
  );
}
