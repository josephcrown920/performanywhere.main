import { describe, expect, it } from "vitest";
import { displayName, greetingText } from "./greeting";

describe("named greetings", () => {
  it("greets the signed-in user's own name", () => {
    expect(greetingText(displayName({ full_name: "Ada" }))).toContain("Hi, Ada!");
  });
  it("prefers the account name over the local name", () => {
    expect(displayName({ name: "Ada" }, "Other person")).toBe("Ada");
  });
  it("uses a provided guest name without inventing an identity", () => {
    expect(displayName(undefined, "Tunde")).toBe("Tunde");
    expect(greetingText("")).toMatch(/^Hi! /);
  });
});