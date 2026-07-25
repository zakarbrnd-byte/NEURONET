import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { MetricLabel } from "./MetricLabel";
import {
  METRIC_EXPLANATIONS,
  REQUIRED_METRIC_KEYS,
} from "../content/metricExplanations";

describe("MetricLabel", () => {
  it("exposes every required metric explanation in accessible tooltip text", () => {
    render(
      <dl>
        {REQUIRED_METRIC_KEYS.map((metric) => (
          <div key={metric}>
            <MetricLabel metric={metric} />
            <dd>value</dd>
          </div>
        ))}
      </dl>,
    );

    for (const metric of REQUIRED_METRIC_KEYS) {
      const { label, explanation } = METRIC_EXPLANATIONS[metric];
      expect(screen.getByText(label)).toBeInTheDocument();
      const tooltip = screen.getByRole("tooltip", { name: explanation });
      expect(tooltip).toHaveAttribute("data-metric", metric);
      expect(screen.getByRole("button", { name: `Explain ${label}` })).toHaveAttribute(
        "aria-describedby",
        tooltip.id,
      );
    }
  });

  it("opens the explanation on mobile tap without requiring hover", async () => {
    const user = userEvent.setup();
    render(
      <dl>
        <MetricLabel metric="networkTick" />
        <dd>0</dd>
      </dl>,
    );

    const trigger = screen.getByRole("button", { name: "Explain Network Tick" });
    const label = trigger.closest(".metric-label");
    expect(label).not.toHaveClass("is-open");
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await user.click(trigger);

    expect(label).toHaveClass("is-open");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByText(
        "One complete backend simulation step. It is not equal to one real-world second.",
      ),
    ).toBeVisible();
  });

  it("is keyboard accessible via focus and activation", async () => {
    const user = userEvent.setup();
    render(
      <dl>
        <MetricLabel metric="energy" />
        <dd>100%</dd>
      </dl>,
    );

    await user.tab();
    const trigger = screen.getByRole("button", { name: "Explain Energy" });
    expect(trigger).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(trigger.closest(".metric-label")).toHaveClass("is-open");

    await user.keyboard("{Escape}");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger.closest(".metric-label")).not.toHaveClass("is-open");
  });

  it("states that Network Tick is not a real-world second", () => {
    render(
      <dl>
        <MetricLabel metric="networkTick" />
        <dd>3</dd>
      </dl>,
    );

    const explanation = METRIC_EXPLANATIONS.networkTick.explanation;
    expect(explanation.toLowerCase()).toContain("not equal to one real-world second");
    expect(screen.getByRole("tooltip")).toHaveTextContent(explanation);
  });

  it("closes after an outside pointer press", async () => {
    render(
      <div>
        <dl>
          <MetricLabel metric="fatigue" />
          <dd>0</dd>
        </dl>
        <button type="button">Outside</button>
      </div>,
    );

    const trigger = screen.getByRole("button", { name: "Explain Fatigue" });
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    fireEvent.pointerDown(screen.getByRole("button", { name: "Outside" }));
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });
});
