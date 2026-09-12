import { describe, expect, it } from "vitest";
import { parseMatrix } from "./spreadsheet";

describe("parseMatrix", () => {
  it.each([1, 2, 3, 4, 5])("parses a spreadsheet with %i dynamic headings", (fieldCount) => {
    const headings = Array.from({ length: fieldCount }, (_, index) => `Field ${index + 1}`);
    const result = parseMatrix([
      headings,
      headings.map((_, index) => index === 0 ? "AARAV YADAV" : index + 900),
    ]);

    expect(result.errors).toEqual([]);
    expect(result.issues).toEqual([]);
    expect(result.students[0]).toEqual({
      fields: headings.map((heading, index) => ({
        heading,
        value: index === 0 ? "AARAV YADAV" : String(index + 900),
      })),
      sourceRow: 2,
    });
  });

  it("ignores fully blank rows", () => {
    const result = parseMatrix([["Name"], [""], ["   "]]);
    expect(result.students).toEqual([]);
    expect(result.issues).toEqual([]);
  });

  it("preserves arbitrary heading order and ignores blank headings", () => {
    const result = parseMatrix([["Roll No.", "", "Student Name", "Room"], [901, "ignored", "AARAV YADAV", 1]]);
    expect(result.students[0]).toEqual({
      fields: [
        { heading: "Roll No.", value: "901" },
        { heading: "Student Name", value: "AARAV YADAV" },
        { heading: "Room", value: "1" },
      ],
      sourceRow: 2,
    });
  });

  it("keeps empty individual values in the schema", () => {
    const result = parseMatrix([["Name", "Room"], ["AARAV", ""]]);
    expect(result.students[0].fields).toEqual([
      { heading: "Name", value: "AARAV" },
      { heading: "Room", value: "" },
    ]);
  });

  it("trims surrounding whitespace but does not rewrite values", () => {
    const result = parseMatrix([
      [" Class ", " Roll No. "],
      [" LKG#A ", " 00100 "],
    ]);
    expect(result.students[0].fields).toEqual([
      { heading: "Class", value: "LKG#A" },
      { heading: "Roll No.", value: "00100" },
    ]);
  });

  it("reports an empty spreadsheet", () => {
    expect(parseMatrix([]).errors).toEqual(["Spreadsheet is empty."]);
  });

  it("rejects more than five usable headings", () => {
    expect(parseMatrix([["A", "B", "C", "D", "E", "F"]]).errors).toEqual([
      "Spreadsheet has more than 5 non-empty columns.",
    ]);
  });

  it("rejects a spreadsheet with no usable headings", () => {
    expect(parseMatrix([["", "   "], ["value", "other"]]).errors).toEqual([
      "Spreadsheet must contain at least one non-empty heading.",
    ]);
  });
});
