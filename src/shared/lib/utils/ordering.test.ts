import { describe, expect, it } from "vitest";
import { ORDER_STEP, isSubset, nextOrder, orderAt } from "./ordering";

describe("nextOrder", () => {
  it("adds one step past the current max", () => {
    expect(nextOrder(5000)).toBe(6000);
  });

  it("treats null/undefined as an empty list (first slot)", () => {
    expect(nextOrder(null)).toBe(ORDER_STEP);
    expect(nextOrder(undefined)).toBe(ORDER_STEP);
  });

  it("treats a leading zero max as empty rather than skipping it", () => {
    expect(nextOrder(0)).toBe(ORDER_STEP);
  });
});

describe("orderAt", () => {
  it("maps a zero-based index to a 1-based stepped order", () => {
    expect(orderAt(0)).toBe(ORDER_STEP);
    expect(orderAt(1)).toBe(2 * ORDER_STEP);
    expect(orderAt(4)).toBe(5 * ORDER_STEP);
  });

  it("produces strictly increasing, evenly spaced values", () => {
    const orders = [0, 1, 2, 3].map(orderAt);
    expect(orders).toEqual([1000, 2000, 3000, 4000]);
  });
});

describe("isSubset", () => {
  const allowed = new Set(["a", "b", "c"]);

  it("returns true when every id is allowed", () => {
    expect(isSubset(["a", "c"], allowed)).toBe(true);
  });

  it("returns true for an empty payload (vacuously)", () => {
    expect(isSubset([], allowed)).toBe(true);
  });

  it("returns false when any id is foreign", () => {
    expect(isSubset(["a", "x"], allowed)).toBe(false);
  });
});
