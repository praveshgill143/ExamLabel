import { describe, expect, it } from "vitest";
import { makeStudents } from "@/test/fixtures";
import { paginateStudents } from "./pagination";

describe("paginateStudents", () => {
  it("places the first student in slot 1 by default", () => {
    const pages = paginateStudents(makeStudents(1), 1);
    expect(pages).toHaveLength(1);
    expect(pages[0].labels[0]).toMatchObject({ pageNumber: 1, slotNumber: 1 });
  });

  it("starts the first page from the selected partially-used slot", () => {
    const pages = paginateStudents(makeStudents(1), 6);
    expect(pages[0].labels[0]).toMatchObject({ pageNumber: 1, slotNumber: 6 });
  });

  it("fills slots 6 through 24 with exactly 19 students", () => {
    const pages = paginateStudents(makeStudents(19), 6);
    expect(pages).toHaveLength(1);
    expect(pages[0].labels[0].slotNumber).toBe(6);
    expect(pages[0].labels.at(-1)?.slotNumber).toBe(24);
  });

  it("rolls the 20th student to page 2 slot 1 when starting from slot 6", () => {
    const pages = paginateStudents(makeStudents(20), 6);
    expect(pages).toHaveLength(2);
    expect(pages[1].labels[0]).toMatchObject({ pageNumber: 2, slotNumber: 1 });
  });

  it("uses one page for 24 students from slot 1", () => {
    expect(paginateStudents(makeStudents(24), 1)).toHaveLength(1);
  });

  it("uses two pages for 25 students from slot 1", () => {
    const pages = paginateStudents(makeStudents(25), 1);
    expect(pages).toHaveLength(2);
    expect(pages[1].labels[0].slotNumber).toBe(1);
  });

  it("applies calibration to all physical positions", () => {
    const pages = paginateStudents(makeStudents(1), 1, { xMm: 1, yMm: 2 });
    expect(pages[0].labels[0].position).toMatchObject({ xMm: 6.8, yMm: 13.2 });
  });

  it("returns no pages for an empty student list", () => {
    expect(paginateStudents([], 1)).toEqual([]);
  });

  it("rejects start slots outside 1 through 24", () => {
    expect(() => paginateStudents(makeStudents(1), 0)).toThrow(/1 and 24/);
    expect(() => paginateStudents(makeStudents(1), 25)).toThrow(/1 and 24/);
  });
});
