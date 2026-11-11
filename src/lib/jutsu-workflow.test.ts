import { describe, expect, it } from "vitest";
import { estimateJutsuPricing, canAdvanceJutsu, JUTSU_CAMERA_PATH, type JutsuProject } from "./jutsu-workflow";
describe("Jutsu workflow", () => {
  it("keeps the eight-second camera path", () => {
    expect(JUTSU_CAMERA_PATH.at(-1)?.time).toBe(8);
    expect(JUTSU_CAMERA_PATH.map(k => k.time)).toEqual([0, 1.8, 3.2, 4.7, 5.8, 8]);
  });
  it("does not mislabel an expensive preview as half price", () => {
    expect(estimateJutsuPricing(100, 50).isHalfPriceOrLess).toBe(true);
    expect(estimateJutsuPricing(100, 60).isHalfPriceOrLess).toBe(false);
    expect(estimateJutsuPricing(100, 50, 25).combinedCredits).toBe(125);
  });
  it("requires depth and explicit preview approval before final", () => {
    const p: JutsuProject = { id:"test", sourceKind:"video", stage:"source", sourceUrl:"source.mp4", cameraPath:[...JUTSU_CAMERA_PATH], previewApproved:false };
    expect(canAdvanceJutsu(p,"depth")).toBe(true);
    p.stage="depth";
    expect(canAdvanceJutsu(p,"previz")).toBe(false);
    p.depthMapUrl="depth.png";
    expect(canAdvanceJutsu(p,"previz")).toBe(true);
    p.stage="approved";
    expect(canAdvanceJutsu(p,"final")).toBe(false);
    p.previewApproved=true;
    expect(canAdvanceJutsu(p,"final")).toBe(true);
  });
});
