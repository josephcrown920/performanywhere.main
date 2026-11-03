import { describe, expect, it } from "vitest";
import { IMAGE_ENGINES, engineModel } from "./engines";

describe("Seedream 5.0 Pro connection", () => {
  it("uses the owner's tested ModelArk endpoint", () => {
    expect(engineModel(IMAGE_ENGINES, "seedream5pro")).toBe("ep-20261019095901-gj979");
    expect(IMAGE_ENGINES.find((engine) => engine.id === "seedream5pro")?.provider).toBe("ark");
  });
});