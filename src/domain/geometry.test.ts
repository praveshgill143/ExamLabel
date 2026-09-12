import { describe, expect, it } from "vitest";
import { getSlotNumber, getSlotPosition, ST24_GEOMETRY } from "./geometry";

describe("ST-24 geometry", () => {
  it("uses the measured A4 ST-24 dimensions", () => {
    expect(ST24_GEOMETRY).toEqual({
      pageWidthMm: 210,
      pageHeightMm: 297,
      columns: 3,
      rows: 8,
      startXmm: 5.8,
      startYmm: 11.2,
      labelWidthMm: 64,
      labelHeightMm: 34,
      gapXmm: 1.6,
      gapYmm: 0,
    });
  });

  it("places the first row at the measured column starts", () => {
    const first = getSlotPosition(1);
    const second = getSlotPosition(2);
    const third = getSlotPosition(3);

    expect(first).toMatchObject({ yMm: 11.2, row: 0, column: 0 });
    expect(second).toMatchObject({ yMm: 11.2, row: 0, column: 1 });
    expect(third).toMatchObject({ yMm: 11.2, row: 0, column: 2 });
    expect(first.xMm).toBeCloseTo(5.8, 10);
    expect(second.xMm).toBeCloseTo(71.4, 10);
    expect(third.xMm).toBeCloseTo(137, 10);
  });

  it("advances rows by exactly 34 mm", () => {
    expect(getSlotPosition(4)).toMatchObject({ xMm: 5.8, yMm: 45.2, row: 1, column: 0 });
    expect(getSlotPosition(24)).toMatchObject({ xMm: 137, yMm: 249.2, row: 7, column: 2 });
  });

  it("applies whole-grid calibration offsets", () => {
    expect(getSlotPosition(1, { xMm: 1.2, yMm: -0.7 })).toMatchObject({ xMm: 7, yMm: 10.5 });
  });

  it("maps row and column to the left-to-right slot number", () => {
    expect(getSlotNumber(0, 0)).toBe(1);
    expect(getSlotNumber(7, 2)).toBe(24);
  });

  it("rejects invalid slot numbers", () => {
    expect(() => getSlotPosition(0)).toThrow(/1 and 24/);
    expect(() => getSlotPosition(25)).toThrow(/1 and 24/);
  });
});
