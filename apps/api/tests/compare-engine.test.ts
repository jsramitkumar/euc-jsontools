import { describe, it, expect } from "vitest";
import { compareJson, validateJson, analyzeJson } from "../src/services/compare-engine.js";

describe("compareJson", () => {
  it("returns isEqual=true for identical objects", () => {
    const result = compareJson({ a: 1, b: "hello" }, { a: 1, b: "hello" });
    expect(result.summary.isEqual).toBe(true);
    expect(result.summary.added).toBe(0);
    expect(result.summary.removed).toBe(0);
    expect(result.summary.modified).toBe(0);
  });

  it("detects added keys", () => {
    const result = compareJson({ a: 1 }, { a: 1, b: 2 });
    expect(result.summary.added).toBe(1);
    expect(result.differences.some((d) => d.path === "$.b" && d.type === "added")).toBe(true);
  });

  it("detects removed keys", () => {
    const result = compareJson({ a: 1, b: 2 }, { a: 1 });
    expect(result.summary.removed).toBe(1);
    expect(result.differences.some((d) => d.path === "$.b" && d.type === "removed")).toBe(true);
  });

  it("detects modified values", () => {
    const result = compareJson({ a: 1 }, { a: 99 });
    expect(result.summary.modified).toBe(1);
    expect(result.differences[0].oldValue).toBe(1);
    expect(result.differences[0].newValue).toBe(99);
  });

  it("handles nested objects", () => {
    const result = compareJson(
      { user: { name: "Alice", age: 30 } },
      { user: { name: "Alice", age: 31 } }
    );
    expect(result.summary.modified).toBe(1);
    expect(result.differences.some((d) => d.path === "$.user.age")).toBe(true);
  });

  it("handles array comparison", () => {
    const result = compareJson({ tags: ["a", "b"] }, { tags: ["a", "c"] });
    expect(result.summary.modified).toBe(1);
  });

  it("ignores order when option set", () => {
    const result = compareJson(
      { arr: [1, 2, 3] },
      { arr: [3, 1, 2] },
      { ignoreOrder: true }
    );
    expect(result.summary.isEqual).toBe(true);
  });

  it("ignores casing when option set", () => {
    const result = compareJson({ name: "Alice" }, { name: "alice" }, { ignoreCasing: true });
    expect(result.summary.isEqual).toBe(true);
  });

  it("type mismatch is detected as modified", () => {
    const result = compareJson({ val: "123" }, { val: 123 });
    expect(result.summary.modified).toBe(1);
  });
});

describe("validateJson", () => {
  it("returns isValid=true for valid JSON", () => {
    expect(validateJson('{"key":"value"}').isValid).toBe(true);
  });

  it("returns isValid=false for invalid JSON", () => {
    const result = validateJson("{invalid}");
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe("analyzeJson", () => {
  it("counts keys correctly", () => {
    const { keys } = analyzeJson({ a: 1, b: { c: 2, d: 3 } });
    expect(keys).toBe(4); // a, b, c, d
  });

  it("measures depth correctly", () => {
    const { depth } = analyzeJson({ a: { b: { c: 1 } } });
    expect(depth).toBe(3);
  });
});
