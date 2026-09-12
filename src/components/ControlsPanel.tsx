import type { Calibration } from "@/domain/geometry";
import type { LabelFillOrder } from "@/domain/pagination";
import {
  MAX_LABEL_FONT_SIZE_PT,
  MIN_LABEL_FONT_SIZE_PT,
  type LabelTextStyle,
} from "@/domain/text-style";

export type ControlsPanelProps = {
  startSlot: number;
  calibration: Calibration;
  fillOrder: LabelFillOrder;
  textStyle: LabelTextStyle;
  disabled: boolean;
  onStartSlotChange: (slot: number) => void;
  onCalibrationChange: (calibration: Calibration) => void;
  onFillOrderChange: (fillOrder: LabelFillOrder) => void;
  onTextStyleChange: (textStyle: LabelTextStyle) => void;
};

function safeOffset(value: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(20, Math.max(-20, parsed));
}

export function ControlsPanel({
  startSlot,
  calibration,
  fillOrder,
  textStyle,
  disabled,
  onStartSlotChange,
  onCalibrationChange,
  onFillOrderChange,
  onTextStyleChange,
}: ControlsPanelProps) {
  return (
    <section className="card controls-card">
      <div>
        <p className="eyebrow">Step 2</p>
        <h2>Label position & printer calibration</h2>
        <p className="muted">Use Start Label when the first stickers on a sheet are already used.</p>
      </div>

      <div className="control-grid">
        <div className="control-grid__wide text-style-controls">
          <span>Label Text Style</span>
          <div className="text-style-controls__row">
            <span className="text-style-controls__label">Font Size:</span>
            <button
              type="button"
              aria-label="Decrease label font size"
              disabled={disabled || textStyle.fontSizePt <= MIN_LABEL_FONT_SIZE_PT}
              onClick={() => onTextStyleChange({ ...textStyle, fontSizePt: textStyle.fontSizePt - 1 })}
            >
              −
            </button>
            <output aria-label="Label font size">{textStyle.fontSizePt} pt</output>
            <button
              type="button"
              aria-label="Increase label font size"
              disabled={disabled || textStyle.fontSizePt >= MAX_LABEL_FONT_SIZE_PT}
              onClick={() => onTextStyleChange({ ...textStyle, fontSizePt: textStyle.fontSizePt + 1 })}
            >
              +
            </button>
            <label className="text-style-controls__color">
              <span>Font Color:</span>
              <input
                aria-label="Label font color"
                type="color"
                value={textStyle.fontColor}
                disabled={disabled}
                onChange={(event) => onTextStyleChange({ ...textStyle, fontColor: event.target.value.toUpperCase() })}
              />
            </label>
            <label className="text-style-controls__bold">
              <input
                aria-label="Bold"
                type="checkbox"
                checked={textStyle.bold}
                disabled={disabled}
                onChange={(event) => onTextStyleChange({ ...textStyle, bold: event.target.checked })}
              />
              <span>Bold</span>
            </label>
          </div>
        </div>

        <label>
          <span>Label Fill Order</span>
          <select
            aria-label="Label Fill Order"
            value={fillOrder}
            disabled={disabled}
            onChange={(event) => onFillOrderChange(event.target.value as LabelFillOrder)}
          >
            <option value="across-rows">Across Rows</option>
            <option value="down-columns">Down Columns</option>
          </select>
        </label>

        <label>
          <span>Start from label</span>
          <select
            aria-label="Start from label"
            value={startSlot}
            disabled={disabled}
            onChange={(event) => onStartSlotChange(Number(event.target.value))}
          >
            {Array.from({ length: 24 }, (_, index) => index + 1).map((slot) => (
              <option key={slot} value={slot}>
                Label {slot}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>X offset (mm)</span>
          <input
            aria-label="X offset (mm)"
            type="number"
            min="-20"
            max="20"
            step="0.1"
            value={calibration.xMm}
            disabled={disabled}
            onChange={(event) =>
              onCalibrationChange({ ...calibration, xMm: safeOffset(event.target.value) })
            }
          />
        </label>

        <label>
          <span>Y offset (mm)</span>
          <input
            aria-label="Y offset (mm)"
            type="number"
            min="-20"
            max="20"
            step="0.1"
            value={calibration.yMm}
            disabled={disabled}
            onChange={(event) =>
              onCalibrationChange({ ...calibration, yMm: safeOffset(event.target.value) })
            }
          />
        </label>
      </div>

      <div className="geometry-note">
        <strong>ST-24 default:</strong> left 0.58 cm · right 0.90 cm · top 1.12 cm · bottom 1.38 cm ·
        label 6.40 × 3.40 cm · horizontal gap 0.16 cm
      </div>
    </section>
  );
}
