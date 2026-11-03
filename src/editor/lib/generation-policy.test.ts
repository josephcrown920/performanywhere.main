import { describe, expect, it } from "vitest";
import { requireDepth, videoSettings } from "./generation-policy";

describe("generation policy", () => {
  it("draft previews last four seconds", () => {
    expect(videoSettings(true, "google/gemini-omni-1.1-flash", "8s").duration).toBe("4s");
  });
  it("draft Omni previews use its supported 360p resolution", () => {
    expect(videoSettings(true, "google/gemini-omni-1.1-flash").resolution).toBe("360p");
  });
  it("normal renders retain the requested duration", () => {
    expect(videoSettings(false, "google/gemini-omni-1.1-flash", "8s").duration).toBe("8s");
  });
  it("every motion-control job requires depth", () => {
    expect(() => requireDepth("Orbit", false)).toThrow();
    expect(() => requireDepth("Orbit", true)).not.toThrow();
  });
});