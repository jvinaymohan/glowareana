import { describe, expect, it } from "vitest";
import { computeSlotBookingSubtotalInr } from "./pricing";

describe("computeSlotBookingSubtotalInr", () => {
  it("uses base price × participants (minimum 1)", () => {
    expect(computeSlotBookingSubtotalInr(499, 2)).toBe(998);
    expect(computeSlotBookingSubtotalInr(499, 1)).toBe(499);
  });

  it("floors fractional participant counts", () => {
    expect(computeSlotBookingSubtotalInr(100, 2.9)).toBe(200);
  });

  it("clamps bad inputs", () => {
    expect(computeSlotBookingSubtotalInr(-10, 2)).toBe(0);
    expect(computeSlotBookingSubtotalInr(100, 0)).toBe(100);
  });
});
