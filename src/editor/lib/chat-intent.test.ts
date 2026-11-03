import { describe, expect, it } from "vitest";
import { generationIntent } from "./chat-intent";

describe("generationIntent", () => {
  it("routes image requests", () => expect(generationIntent("Generate a photoreal image of a fox")).toBe("image"));
  it("routes video requests", () => expect(generationIntent("Generate a 6-second video of waves")).toBe("video"));
  it("leaves editing chat alone", () => expect(generationIntent("tighten the cuts on my timeline")).toBeNull());
});
