import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { clipForAsset, nextTrackStart, REQUIRED_ORCHESTRATOR_SPECIALISTS, serializableAssets, serializableTimeline, persistSession, starterTimeline, type SavedSession, type EditorClip } from "./editor-state";

const clips: EditorClip[] = [
  { id: "one", assetId: "a", track: "V1", start: 0, dur: 4, inPoint: 0, name: "one", volume: 1, opacity: 1, speed: 1, filter: "none" },
  { id: "two", assetId: "b", track: "V1", start: 6, dur: 3, inPoint: 0, name: "two", volume: 1, opacity: 1, speed: 1, filter: "none" },
];

describe("editor session rules", () => {
  test("new visual generations are placed after the final V1 clip", () => {
    assert.equal(nextTrackStart(clips, "V1"), 9);
    assert.equal(clipForAsset({ id: "g", name: "generated.png", kind: "image", url: "data:image/png;base64,x", dur: 4 }, clips, "new").start, 9);
  });

  test("temporary uploaded files are not written into saved sessions", () => {
    assert.deepEqual(serializableAssets([
      { id: "local", name: "local.mov", kind: "video", url: "blob:test", dur: 6 },
      { id: "generated", name: "generated.png", kind: "image", url: "data:image/png;base64,x", dur: 4 },
    ]).map((asset) => asset.id), ["generated"]);
  });

  test("orchestrator always routes to Astra, Codex, and Fable", () => {
    assert.deepEqual(REQUIRED_ORCHESTRATOR_SPECIALISTS, ["astra", "codex", "fable"]);
  });

  test("generated video survives serialization while uploaded media leaves no orphan clips", async () => {
    const assets = [
      { id: "a", name: "generated.mp4", kind: "video" as const, url: "blob:generated", dur: 4, generated: true },
      { id: "b", name: "upload.mp4", kind: "video" as const, url: "blob:upload", dur: 3 },
    ];
    const timeline = await serializableTimeline(assets, clips, async (url) => {
      assert.equal(url, "blob:generated");
      return "data:video/mp4;base64,AAAA";
    });
    assert.equal(timeline.assets[0]?.url, "data:video/mp4;base64,AAAA");
    assert.deepEqual(timeline.clips.map((clip) => clip.assetId), ["a"]);
    assert.equal(assets[0]?.url, "blob:generated");
  });

  const session: SavedSession = { id: "saved", name: "Generated cut", updatedAt: "2026-11-03T00:00:00Z", ...starterTimeline(["fire.jpg"]), messages: [], agent: "orchestrator", imageEngine: "image", videoEngine: "video" };

  test("a quota error still attempts cloud saving and reports cloud-only success", async () => {
    let called = false;
    const result = await persistSession(session, [], { setItem() { throw new DOMException("Full", "QuotaExceededError"); } }, async (saved) => {
      assert.equal(saved.id, "saved");
      called = true;
      return true;
    });
    assert.equal(called, true);
    assert.equal(result.localSaved, false);
    assert.equal(result.cloudSaved, true);
    assert.deepEqual(result.sessions, [session]);
  });

  test("failed local and cloud writes never add a phantom saved session", async () => {
    const result = await persistSession(session, [], { setItem() { throw new Error("Full"); } }, async () => { throw new Error("Offline"); });
    assert.equal(result.localSaved, false);
    assert.equal(result.cloudSaved, false);
    assert.deepEqual(result.sessions, []);
  });

  test("local saving preserves full generated image data and succeeds without an account", async () => {
    const withImage = { ...session, assets: [{ id: "image", name: "image.png", kind: "image" as const, url: "data:image/png;base64,AAAA", dur: 4 }] };
    let written = "";
    const result = await persistSession(withImage, [], { setItem(key, value) { assert.equal(key, "reel-editor-sessions"); written = value; } }, async () => false);
    assert.equal(JSON.parse(written)[0].assets[0].url, "data:image/png;base64,AAAA");
    assert.equal(result.localSaved, true);
    assert.equal(result.cloudSaved, false);
  });
});