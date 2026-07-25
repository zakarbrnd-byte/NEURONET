import { useState } from "react";
import { Header } from "./components/Header";
import { StatusCard } from "./components/StatusCard";
import { ActivityFeed } from "./components/ActivityFeed";
import { INITIAL_ACTIVITY, INITIAL_NODE } from "./data/mockNode";
import type { NodeData } from "./types/node";

export default function App() {
  const [node, setNode] = useState<NodeData>(INITIAL_NODE);
  const [activity, setActivity] = useState<string[]>(INITIAL_ACTIVITY);

  function handleSendHello() {
    setNode((current) => ({
      ...current,
      state: "Awake",
      energy: Math.max(0, current.energy - 1),
      tick: current.tick + 1,
      lastMessage: "Hello",
    }));
    setActivity((current) => [...current, "Received message: Hello"]);
  }

  function handleReset() {
    setNode(INITIAL_NODE);
    setActivity(INITIAL_ACTIVITY);
  }

  return (
    <div className="page">
      <Header version="0.1" mode="Mock Data" />

      <main className="main">
        <StatusCard node={node} />
        <ActivityFeed items={activity} />

        <section className="actions" aria-label="Controls">
          <button type="button" className="btn btn-primary" onClick={handleSendHello}>
            Send Hello
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleReset}>
            Reset
          </button>
        </section>
      </main>
    </div>
  );
}
