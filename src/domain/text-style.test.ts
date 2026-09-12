import { beforeEach, describe, expect, it } from "vitest";
import {
  DEFAULT_LABEL_TEXT_STYLE,
  LABEL_TEXT_STYLE_STORAGE_KEY,
  clampLabelFontSize,
  hexToPdfRgb,
  loadLabelTextStyle,
} from "./text-style";

describe("label text style", () => {
  beforeEach(() => localStorage.clear());

  it("preserves the current label typography as the default", () => {
    expect(DEFAULT_LABEL_TEXT_STYLE).toEqual({ fontSizePt: 8.5, fontColor: "#000000", bold: false });
  });

  it("clamps font size to the supported 6 through 20 point range", () => {
    expect(clampLabelFontSize(5)).toBe(6);
    expect(clampLabelFontSize(12)).toBe(12);
    expect(clampLabelFontSize(21)).toBe(20);
  });

  it("converts HEX colors to normalized PDF RGB values", () => {
    expect(hexToPdfRgb("#FF0000")).toEqual({ red: 1, green: 0, blue: 0 });
    expect(hexToPdfRgb("#336699")).toEqual({ red: 0x33 / 255, green: 0x66 / 255, blue: 0x99 / 255 });
  });

  it("falls back safely when saved settings are missing or malformed", () => {
    expect(loadLabelTextStyle()).toEqual(DEFAULT_LABEL_TEXT_STYLE);
    localStorage.setItem(LABEL_TEXT_STYLE_STORAGE_KEY, "not-json");
    expect(loadLabelTextStyle()).toEqual(DEFAULT_LABEL_TEXT_STYLE);
    localStorage.setItem(LABEL_TEXT_STYLE_STORAGE_KEY, JSON.stringify({ fontSizePt: 99, bold: true }));
    expect(loadLabelTextStyle()).toEqual({ fontSizePt: 20, fontColor: "#000000", bold: true });
  });
});
