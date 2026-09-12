import type { StudentRecord } from "./student";

export type RowIssue = {
  sourceRow: number;
  missingFields: string[];
};

export type ParseResult = {
  students: StudentRecord[];
  issues: RowIssue[];
  errors: string[];
};

const ACCEPTED_EXTENSIONS = new Set(["xlsx", "xls", "csv"]);
const MAX_FIELDS = 5;

function toDisplayString(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function isBlankRow(row: readonly unknown[]): boolean {
  return row.every((value) => toDisplayString(value) === "");
}

export function parseMatrix(rows: readonly (readonly unknown[])[]): ParseResult {
  if (rows.length === 0) {
    return { students: [], issues: [], errors: ["Spreadsheet is empty."] };
  }

  const headerRow = Array.isArray(rows[0]) ? rows[0] : [];
  const headerColumns: { heading: string; index: number }[] = [];
  headerRow.forEach((value, index) => {
    const header = toDisplayString(value);
    if (header) headerColumns.push({ heading: header, index });
  });

  if (headerColumns.length === 0) {
    return { students: [], issues: [], errors: ["Spreadsheet must contain at least one non-empty heading."] };
  }
  if (headerColumns.length > MAX_FIELDS) {
    return { students: [], issues: [], errors: ["Spreadsheet has more than 5 non-empty columns."] };
  }

  const students: StudentRecord[] = [];

  rows.slice(1).forEach((rowValue, rowOffset) => {
    const row = Array.isArray(rowValue) ? rowValue : [];
    if (isBlankRow(row)) return;

    const sourceRow = rowOffset + 2;

    students.push({
      fields: headerColumns.map(({ heading, index }) => ({
        heading,
        value: toDisplayString(row[index]),
      })),
      sourceRow,
    });
  });

  return { students, issues: [], errors: [] };
}

function getExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf(".");
  return lastDot === -1 ? "" : fileName.slice(lastDot + 1).toLowerCase();
}

export async function parseWorkbookBytes(bytes: ArrayBuffer, fileName: string): Promise<ParseResult> {
  const extension = getExtension(fileName);
  if (!ACCEPTED_EXTENSIONS.has(extension)) {
    return {
      students: [],
      issues: [],
      errors: ["Unsupported file type. Please upload an .xlsx, .xls, or .csv file."],
    };
  }

  try {
    const XLSX = await import("xlsx");
    const workbook =
      extension === "csv"
        ? XLSX.read(new TextDecoder().decode(bytes), { type: "string" })
        : XLSX.read(bytes, { type: "array" });

    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      return { students: [], issues: [], errors: ["Spreadsheet is empty."] };
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const matrix = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
      header: 1,
      raw: false,
      defval: "",
      blankrows: true,
    }) as unknown[][];

    return parseMatrix(matrix);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown spreadsheet error";
    return {
      students: [],
      issues: [],
      errors: [`Could not read spreadsheet: ${message}`],
    };
  }
}
