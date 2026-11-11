import { describe, expect, it, vi } from "vitest";
import { identityPrompt, loadSoul } from "./soul.server";

describe("Soul identity", () => {
  it("preserves identity instructions and reference count", () => {
    const prompt = identityPrompt({
      id: "soul-1", user_id: "user-1", name: "Test artist",
      reference_image_paths: ["one.jpg", "two.jpg"],
      reference_profile: { description: "red-tinted locs and shoulder tattoo" },
    }, 2);
    expect(prompt).toContain("first 2 image(s)");
    expect(prompt).toContain("same face");
    expect(prompt).toContain("red-tinted locs");
  });
  it("rejects Souls without downloadable photos before any generation", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { id: "soul-1", user_id: "user-1", name: "Test artist", reference_image_paths: ["missing.jpg"], reference_profile: null },
      error: null,
    });
    const db = {
      from: vi.fn(() => ({ select: () => ({ eq: () => ({ maybeSingle }) }) })),
      storage: { from: vi.fn(() => ({ download: vi.fn().mockResolvedValue({ data: null }) })) },
    };
    await expect(loadSoul(db as never, "soul-1")).rejects.toThrow("soul_has_no_photos");
  });
});
