import type { Calibration } from "@/domain/geometry";
import type { LabelFillOrder } from "@/domain/pagination";

export type ControlsPanelProps = {
  startSlot: number;
  calibration: Calibration;
  fillOrder: LabelFillOrder;
  disabled: boolean;
  onStartSlotChange: (slot: number) => void;
  onCalibrationChange: (calibration: Calibration) => void;
  onFillOrderChange: (fillOrder: LabelFillOrder) => void;
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
  disabled,
  onStartSlotChange,
  onCalibrationChange,
  onFillOrderChange,
}: ControlsPanelProps) {
  return (
    <section className="card controls-card">
      <div>
        <p className="eyebrow">Step 2</p>
        <h2>Label position & printer calibration</h2>
        <p className="muted">Use Start Label when the first stickers on a sheet are already used.</p>
      </div>

      <div className="control-grid">
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
