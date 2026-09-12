export type LabelTextStyle = {
  fontSizePt: number;
  fontColor: string;
  bold: boolean;
};

export const DEFAULT_LABEL_TEXT_STYLE: LabelTextStyle = {
  fontSizePt: 8.5,
  fontColor: "#000000",
  bold: false,
};

export const MIN_LABEL_FONT_SIZE_PT = 6;
export const MAX_LABEL_FONT_SIZE_PT = 20;
export const LABEL_TEXT_STYLE_STORAGE_KEY = "exam-label.text-style";

export function clampLabelFontSize(fontSizePt: number): number {
  return Math.min(MAX_LABEL_FONT_SIZE_PT, Math.max(MIN_LABEL_FONT_SIZE_PT, fontSizePt));
}

function normalizeHexColor(value: unknown): string {
  if (typeof value !== "string" || !/^#[0-9a-f]{6}$/i.test(value)) {
    return DEFAULT_LABEL_TEXT_STYLE.fontColor;
  }
  return value.toUpperCase();
}

export function normalizeLabelTextStyle(value: unknown): LabelTextStyle {
  if (!value || typeof value !== "object") return DEFAULT_LABEL_TEXT_STYLE;
  const candidate = value as Partial<LabelTextStyle>;
  return {
    fontSizePt: clampLabelFontSize(
      typeof candidate.fontSizePt === "number" && Number.isFinite(candidate.fontSizePt)
        ? candidate.fontSizePt
        : DEFAULT_LABEL_TEXT_STYLE.fontSizePt,
    ),
    fontColor: normalizeHexColor(candidate.fontColor),
    bold: typeof candidate.bold === "boolean" ? candidate.bold : DEFAULT_LABEL_TEXT_STYLE.bold,
  };
}

export function loadLabelTextStyle(): LabelTextStyle {
  if (typeof window === "undefined") return DEFAULT_LABEL_TEXT_STYLE;
  try {
    const stored = window.localStorage.getItem(LABEL_TEXT_STYLE_STORAGE_KEY);
    return stored ? normalizeLabelTextStyle(JSON.parse(stored)) : DEFAULT_LABEL_TEXT_STYLE;
  } catch {
    return DEFAULT_LABEL_TEXT_STYLE;
  }
}

export function saveLabelTextStyle(style: LabelTextStyle): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LABEL_TEXT_STYLE_STORAGE_KEY, JSON.stringify(normalizeLabelTextStyle(style)));
  } catch {
    // Storage can be unavailable in private browsing or restricted environments.
  }
}

export function hexToPdfRgb(hex: string): { red: number; green: number; blue: number } {
  const normalized = normalizeHexColor(hex);
  return {
    red: Number.parseInt(normalized.slice(1, 3), 16) / 255,
    green: Number.parseInt(normalized.slice(3, 5), 16) / 255,
    blue: Number.parseInt(normalized.slice(5, 7), 16) / 255,
  };
}
