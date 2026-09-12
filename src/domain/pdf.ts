import type { LabelPage, PlacedLabel } from "./pagination";
import type { PDFOperator, PDFPage, PDFFont } from "pdf-lib";
import type { StudentRecord } from "./student";

const POINTS_PER_INCH = 72;
const MM_PER_INCH = 25.4;
export const LABEL_FIT_CONFIG = {
  preferredFontSizePt: 8.5,
  minimumReadableFontSizePt: 6.5,
  singleLinePreferenceMinFontSizePt: 7.75,
  fontStepPt: 0.25,
  defaultLineHeightPt: 10,
} as const;
const HORIZONTAL_PADDING_MM = 3;
const VERTICAL_SAFE_PADDING_MM = 2;

export type LabelLine = {
  text: string;
  bold: boolean;
};

export type MeasureText = (text: string, fontSizePt: number, bold: boolean) => number;

export type FittedLabel = {
  lines: LabelLine[];
  fontSizePt: number;
  lineHeightPt: number;
  warning?: string;
};

export function mmToPt(mm: number): number {
  return (mm * POINTS_PER_INCH) / MM_PER_INCH;
}

export function buildLabelLines(student: StudentRecord): LabelLine[] {
  return student.fields.map(({ heading, value }) => ({
    text: `${heading}: ${value}`,
    bold: false,
  }));
}

function wrapLine(line: LabelLine, fontSizePt: number, availableWidthPt: number, measureText: MeasureText): LabelLine[] {
  if (measureText(line.text, fontSizePt, line.bold) <= availableWidthPt) return [line];

  const wrapped: LabelLine[] = [];
  let remaining = line.text;
  while (remaining.length > 0) {
    let end = 0;
    for (let index = 1; index <= remaining.length; index += 1) {
      if (measureText(remaining.slice(0, index), fontSizePt, line.bold) <= availableWidthPt) end = index;
      else break;
    }
    if (end === 0) end = 1;

    let splitAt = end;
    let preserveBreakSpace = false;
    if (end < remaining.length) {
      const whitespace = remaining.slice(0, end).lastIndexOf(" ");
      if (whitespace > 0) {
        splitAt = whitespace + 1;
        preserveBreakSpace = true;
      }
    }

    const segment = preserveBreakSpace ? remaining.slice(0, splitAt) : remaining.slice(0, splitAt).trimEnd();
    wrapped.push({ text: segment || remaining.slice(0, end), bold: line.bold });
    remaining = remaining.slice(splitAt);
  }
  return wrapped;
}

export function fitLabelLines(
  lines: LabelLine[],
  availableWidthPt: number,
  availableHeightPt: number,
  measureText: MeasureText,
): FittedLabel {
  const lineHeight = (fontSizePt: number) =>
    LABEL_FIT_CONFIG.defaultLineHeightPt *
    (fontSizePt / LABEL_FIT_CONFIG.preferredFontSizePt);
  const nextFontSize = (fontSizePt: number) =>
    Math.round((fontSizePt - LABEL_FIT_CONFIG.fontStepPt) * 100) / 100;
  const fitsWithoutWrapping = (fontSizePt: number) =>
    lines.every((line) => measureText(line.text, fontSizePt, line.bold) <= availableWidthPt) &&
    lines.length * lineHeight(fontSizePt) <= availableHeightPt;

  let fontSizePt: number = LABEL_FIT_CONFIG.preferredFontSizePt;
  while (fontSizePt >= LABEL_FIT_CONFIG.singleLinePreferenceMinFontSizePt) {
    if (fitsWithoutWrapping(fontSizePt)) {
      return { lines, fontSizePt, lineHeightPt: lineHeight(fontSizePt) };
    }
    fontSizePt = nextFontSize(fontSizePt);
  }

  fontSizePt = LABEL_FIT_CONFIG.singleLinePreferenceMinFontSizePt;
  let lastAttempt: FittedLabel = { lines, fontSizePt, lineHeightPt: lineHeight(fontSizePt) };

  while (fontSizePt >= LABEL_FIT_CONFIG.minimumReadableFontSizePt) {
    const lineHeightPt = lineHeight(fontSizePt);
    const wrappedLines = lines.flatMap((line) => wrapLine(line, fontSizePt, availableWidthPt, measureText));
    const fitsWidth = wrappedLines.every(
      (line) => measureText(line.text, fontSizePt, line.bold) <= availableWidthPt,
    );
    const fitsHeight = wrappedLines.length * lineHeightPt <= availableHeightPt;
    lastAttempt = { lines: wrappedLines, fontSizePt, lineHeightPt };
    if (fitsWidth && fitsHeight) return lastAttempt;
    fontSizePt = nextFontSize(fontSizePt);
  }

  return {
    ...lastAttempt,
    fontSizePt: LABEL_FIT_CONFIG.minimumReadableFontSizePt,
    warning: "Label content cannot fit inside the label at the minimum readable font size.",
  };
}

function drawPlacedLabel(
  page: PDFPage,
  placed: PlacedLabel,
  pageHeightPt: number,
  regularFont: PDFFont,
  boldFont: PDFFont,
  operators: {
    pushGraphicsState: () => PDFOperator;
    popGraphicsState: () => PDFOperator;
    rectangle: (x: number, y: number, width: number, height: number) => PDFOperator;
    clip: () => PDFOperator;
    endPath: () => PDFOperator;
  },
): void {
  const { position, student } = placed;
  const labelX = mmToPt(position.xMm);
  const labelBottom = pageHeightPt - mmToPt(position.yMm + position.heightMm);
  const labelWidth = mmToPt(position.widthMm);
  const labelHeight = mmToPt(position.heightMm);
  const horizontalPadding = mmToPt(HORIZONTAL_PADDING_MM);
  const verticalPadding = mmToPt(VERTICAL_SAFE_PADDING_MM);
  const contentX = labelX + horizontalPadding;
  const contentWidth = labelWidth - 2 * horizontalPadding;
  const clipY = labelBottom + verticalPadding;
  const clipHeight = labelHeight - 2 * verticalPadding;
  const lines = buildLabelLines(student);
  const fitted = fitLabelLines(
    lines,
    contentWidth,
    clipHeight,
    (text, size, bold) => (bold ? boldFont : regularFont).widthOfTextAtSize(text, size),
  );
  if (fitted.warning) throw new Error(fitted.warning);
  const blockHeight = fitted.lines.length * fitted.lineHeightPt;
  const blockTop = labelBottom + (labelHeight + blockHeight) / 2;
  let baselineY = blockTop - fitted.fontSizePt;

  page.pushOperators(
    operators.pushGraphicsState(),
    operators.rectangle(contentX, clipY, contentWidth, clipHeight),
    operators.clip(),
    operators.endPath(),
  );

  for (const line of fitted.lines) {
    page.drawText(line.text, {
      x: contentX,
      y: baselineY,
      size: fitted.fontSizePt,
      font: line.bold ? boldFont : regularFont,
    });
    baselineY -= fitted.lineHeightPt;
  }

  page.pushOperators(operators.popGraphicsState());
}

export async function generateLabelPdf(pages: LabelPage[]): Promise<Uint8Array> {
  if (pages.length === 0) {
    throw new Error("There are no valid student labels to generate.");
  }

  const pdfLib = await import("pdf-lib");
  const {
    PDFDocument,
    StandardFonts,
    pushGraphicsState,
    popGraphicsState,
    rectangle,
    clip,
    endPath,
  } = pdfLib;

  const document = await PDFDocument.create();
  const regularFont = await document.embedFont(StandardFonts.Helvetica);
  const boldFont = await document.embedFont(StandardFonts.HelveticaBold);
  const pageWidthPt = mmToPt(210);
  const pageHeightPt = mmToPt(297);
  const operators = { pushGraphicsState, popGraphicsState, rectangle, clip, endPath };

  for (const labelPage of pages) {
    const page = document.addPage([pageWidthPt, pageHeightPt]);
    for (const placed of labelPage.labels) {
      drawPlacedLabel(page, placed, pageHeightPt, regularFont, boldFont, operators);
    }
  }

  return document.save();
}
