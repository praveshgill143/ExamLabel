import type { CSSProperties } from "react";
import { ST24_GEOMETRY, type SlotPosition } from "@/domain/geometry";
import { buildLabelLines, fitLabelLines, mmToPt } from "@/domain/pdf";
import type { LabelPage } from "@/domain/pagination";
import { DEFAULT_LABEL_TEXT_STYLE, type LabelTextStyle } from "@/domain/text-style";

export type SheetPreviewProps = {
  page?: LabelPage;
  slotPositions: SlotPosition[];
  textStyle?: LabelTextStyle;
};

function positionStyle(position: SlotPosition): CSSProperties {
  return {
    left: `${(position.xMm / ST24_GEOMETRY.pageWidthMm) * 100}%`,
    top: `${(position.yMm / ST24_GEOMETRY.pageHeightMm) * 100}%`,
    width: `${(position.widthMm / ST24_GEOMETRY.pageWidthMm) * 100}%`,
    height: `${(position.heightMm / ST24_GEOMETRY.pageHeightMm) * 100}%`,
  };
}

function previewMeasure(text: string, fontSizePt: number, bold: boolean): number {
  return text.length * fontSizePt * 0.52 * (bold ? 1.05 : 1);
}

export function SheetPreview({ page, slotPositions, textStyle = DEFAULT_LABEL_TEXT_STYLE }: SheetPreviewProps) {
  return (
    <section className="preview-card" aria-label="A4 label preview">
      <div className="preview-heading-row">
        <div>
          <h2>A4 Preview</h2>
          <p>{page ? `Page ${page.pageNumber}` : "Upload a spreadsheet to preview labels."}</p>
        </div>
        <span className="preview-size">21.0 × 29.7 cm</span>
      </div>

      <div className="preview-scroll">
        <div className="a4-preview" data-testid="a4-preview">
          {slotPositions.map((position) => (
            <div
              key={`guide-${position.slotNumber}`}
              data-testid={`slot-guide-${position.slotNumber}`}
              className="slot-guide"
              style={positionStyle(position)}
              aria-hidden="true"
            />
          ))}

          {page?.labels.map((placed) => (
            <article
              key={`${placed.pageNumber}-${placed.slotNumber}-${placed.student.sourceRow}`}
              data-testid={`placed-label-${placed.slotNumber}`}
              className="placed-label"
              style={positionStyle(placed.position)}
            >
              {(() => {
                const position = placed.position;
                const contentWidth = mmToPt(position.widthMm - 6);
                const contentHeight = mmToPt(position.heightMm - 4);
                const fitted = fitLabelLines(buildLabelLines(placed.student), contentWidth, contentHeight, previewMeasure, textStyle);
                return <>
                  <div
                    data-testid={`placed-label-lines-${placed.slotNumber}`}
                    className="placed-label-lines"
                    style={{
                      color: textStyle.fontColor,
                      fontSize: `${fitted.fontSizePt}pt`,
                      fontWeight: textStyle.bold ? 700 : 400,
                      lineHeight: `${fitted.lineHeightPt}pt`,
                    }}
                  >
                  {fitted.lines.map((line, index) => (
                  <div
                    key={`${index}-${line.text}`}
                    className="placed-label-line"
                  >
                    {line.text}
                  </div>
                ))}
                  </div>
                  {fitted.warning ? <span role="alert">{fitted.warning}</span> : null}
                </>;
              })()}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
