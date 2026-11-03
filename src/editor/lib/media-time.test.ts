import { describe, expect, it } from "vitest";
import { sourceTime } from "./media-time";

describe("timeline source seeking", () => {
  it("preserves source offsets at normal speed", () => {
    expect(sourceTime({ start: 2, inPoint: 1, speed: 1 }, 4)).toBe(3);
  });
  it("seeks Bullet Time at 0.2x instead of jumping at normal speed", () => {
    expect(sourceTime({ start: 0, inPoint: 0, speed: 0.2 }, 4)).toBe(0.8);
  });
  it("seeks double-speed clips at twice the source time", () => {
    expect(sourceTime({ start: 2, inPoint: 1, speed: 2 }, 4)).toBe(5);
  });
});