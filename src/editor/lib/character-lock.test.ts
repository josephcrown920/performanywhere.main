import { describe, it, expect } from "vitest";
import { toggleCharacterRef, characterGuide, MAX_CHARACTER_REFS } from "./character-lock";
const base = { on: false, name: "Josh", notes: "", refs: [] as { id: string; url: string }[] };
describe("character lock", () => {
  it("caps references at four", () => {
    let l = base;
    for (let i = 0; i < 6; i++) l = toggleCharacterRef(l, { id: `p${i}`, url: `u${i}` });
    expect(l.refs.length).toBe(MAX_CHARACTER_REFS);
    expect(MAX_CHARACTER_REFS).toBe(4);
  });
  it("adds no guide when off", () => {
    expect(characterGuide({ ...base, refs: [{ id: "a", url: "b" }] })).toBe("");
  });
  it("guide names the character and includes notes", () => {
    const g = characterGuide({ ...base, on: true, notes: "NBA tattoo on left forearm", refs: [{ id: "a", url: "b" }] });
    expect(g).toContain("Josh");
    expect(g).toContain("NBA tattoo on left forearm");
  });
});
