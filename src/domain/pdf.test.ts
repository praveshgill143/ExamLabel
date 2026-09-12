import { describe, expect, it } from "vitest";
import { makeStudents } from "@/test/fixtures";
import { paginateStudents } from "./pagination";
import {
  buildLabelLines,
  fitLabelLines,
  generateLabelPdf,
  LABEL_FIT_CONFIG,
  mmToPt,
} from "./pdf";

describe("PDF label renderer", () => {
  it("converts millimetres to PDF points", () => {
    expect(mmToPt(25.4)).toBeCloseTo(72, 8);
    expect(mmToPt(210)).toBeCloseTo(595.27559, 4);
    expect(mmToPt(297)).toBeCloseTo(841.88976, 4);
  });

  it("builds lines from the supplied fields in exact order", () => {
    const student = makeStudents(1)[0];
    expect(buildLabelLines(student)).toEqual([
      { text: "Class: VIII#A", bold: false },
      { text: "Hall Ticket NO.: 100", bold: false },
      { text: "AdmNo: 6000", bold: false },
      { text: "Student Name: STUDENT 1", bold: false },
      { text: "Room NO.: ROOM 1", bold: false },
    ]);
  });

  it("uses a larger size for short content than long content", () => {
    const measure = (text: string, size: number) => text.length * size * 0.5;
    const short = fitLabelLines([{ text: "Name: AARAV", bold: false }], 120, 80, measure);
    const long = fitLabelLines([{ text: `Name: ${"A".repeat(300)}`, bold: false }], 120, 80, measure);

    expect(short.fontSizePt).toBe(8.5);
    expect(long.fontSizePt).toBeLessThan(short.fontSizePt);
    expect(long.warning).toBeUndefined();
    expect(long.lines.map((line) => line.text).join(" ")).toContain("Name:");
    expect(long.lines.map((line) => line.text).join("")).toContain("A".repeat(300));
  });

  it("shrinks a medium-long field slightly before allowing it to wrap", () => {
    const measure = (text: string, size: number) => text.length * size * 0.5;
    const fitted = fitLabelLines(
      [{ text: "Student Name: DIVYANSH MADDHESHIYA", bold: false }],
      135,
      80,
      measure,
    );

    expect(fitted.fontSizePt).toBe(LABEL_FIT_CONFIG.singleLinePreferenceMinFontSizePt);
    expect(fitted.lines).toHaveLength(1);
    expect(fitted.lines[0].text).toBe("Student Name: DIVYANSH MADDHESHIYA");
  });

  it("still wraps genuinely long content after the single-line preference floor", () => {
    const measure = (text: string, size: number) => text.length * size * 0.5;
    const fitted = fitLabelLines(
      [{ text: `Student Name: ${"A".repeat(300)}`, bold: false }],
      140,
      200,
      measure,
    );

    expect(fitted.fontSizePt).toBe(LABEL_FIT_CONFIG.singleLinePreferenceMinFontSizePt);
    expect(fitted.lines.length).toBeGreaterThan(1);
    expect(fitted.lines.map((line) => line.text).join("")).toContain("A".repeat(300));
  });

  it("fits each label independently and reports an explicit minimum-size failure", () => {
    const measure = (text: string, size: number) => text.length * size * 0.5;
    const neighboringShort = fitLabelLines([{ text: "Name: A", bold: false }], 120, 80, measure);
    const impossible = fitLabelLines([{ text: "Name: A", bold: false }], 1, 1, measure);

    expect(neighboringShort.fontSizePt).toBe(8.5);
    expect(impossible.warning).toMatch(/cannot fit/i);
    expect(impossible.fontSizePt).toBe(6.5);
  });

  it("returns deterministic wrapped lines without truncating content", () => {
    const measure = (text: string, size: number) => text.length * size * 0.5;
    const input = [{ text: "Room: SUPERLONGVALUE", bold: false }];
    expect(fitLabelLines(input, 45, 80, measure)).toEqual(fitLabelLines(input, 45, 80, measure));
    expect(fitLabelLines(input, 45, 80, measure).lines.map((line) => line.text).join("")).toBe("Room: SUPERLONGVALUE");
  });

  it("creates a one-page PDF for one page of labels", async () => {
    const bytes = await generateLabelPdf(paginateStudents(makeStudents(1), 1));
    expect(new TextDecoder().decode(bytes.slice(0, 4))).toBe("%PDF");

    const { PDFDocument } = await import("pdf-lib");
    const document = await PDFDocument.load(bytes);
    expect(document.getPageCount()).toBe(1);
    const { width, height } = document.getPage(0).getSize();
    expect(width).toBeCloseTo(mmToPt(210), 4);
    expect(height).toBeCloseTo(mmToPt(297), 4);
  });

  it("creates two pages when pagination supplies two pages", async () => {
    const bytes = await generateLabelPdf(paginateStudents(makeStudents(25), 1));
    const { PDFDocument } = await import("pdf-lib");
    const document = await PDFDocument.load(bytes);
    expect(document.getPageCount()).toBe(2);
  });
});
