import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ReadingGuide } from "./ReadingGuide";

describe("ReadingGuide", () => {
  it("explains how to use the observatory screen", () => {
    render(<ReadingGuide />);

    expect(screen.getByRole("heading", { name: "How to read this screen" })).toBeInTheDocument();
    expect(screen.getByText("Tap a neuron to inspect it.")).toBeInTheDocument();
    expect(screen.getByText("Hold a neuron to stimulate it.")).toBeInTheDocument();
    expect(screen.getByText("A tick is one backend simulation step.")).toBeInTheDocument();
    expect(
      screen.getByText("A neuron fires when its membrane potential reaches threshold."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Fired neurons send signals only through real backend connections."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Refractory neurons temporarily cannot fire again."),
    ).toBeInTheDocument();
  });
});
