export type Calibration = {
  xMm: number;
  yMm: number;
};

export type SlotPosition = {
  slotNumber: number;
  row: number;
  column: number;
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
};

export type LabelSheetGeometry = {
  pageWidthMm: number;
  pageHeightMm: number;
  columns: number;
  rows: number;
  startXmm: number;
  startYmm: number;
  labelWidthMm: number;
  labelHeightMm: number;
  gapXmm: number;
  gapYmm: number;
};

export const ST24_GEOMETRY: LabelSheetGeometry = {
  pageWidthMm: 210,
  pageHeightMm: 297,
  columns: 3,
  rows: 8,
  startXmm: 5.8,
  startYmm: 11.2,
  labelWidthMm: 64,
  labelHeightMm: 34,
  gapXmm: 1.6,
  gapYmm: 0,
};

const DEFAULT_CALIBRATION: Calibration = { xMm: 0, yMm: 0 };
const SLOT_COUNT = ST24_GEOMETRY.columns * ST24_GEOMETRY.rows;

function assertSlotNumber(slotNumber: number): void {
  if (!Number.isInteger(slotNumber) || slotNumber < 1 || slotNumber > SLOT_COUNT) {
    throw new RangeError(`Slot number must be between 1 and ${SLOT_COUNT}.`);
  }
}

export function getSlotNumber(row: number, column: number): number {
  if (
    !Number.isInteger(row) ||
    !Number.isInteger(column) ||
    row < 0 ||
    row >= ST24_GEOMETRY.rows ||
    column < 0 ||
    column >= ST24_GEOMETRY.columns
  ) {
    throw new RangeError("Row or column is outside the ST-24 grid.");
  }

  return row * ST24_GEOMETRY.columns + column + 1;
}

export function getSlotPosition(
  slotNumber: number,
  calibration: Calibration = DEFAULT_CALIBRATION,
): SlotPosition {
  assertSlotNumber(slotNumber);

  const zeroBased = slotNumber - 1;
  const row = Math.floor(zeroBased / ST24_GEOMETRY.columns);
  const column = zeroBased % ST24_GEOMETRY.columns;

  return {
    slotNumber,
    row,
    column,
    xMm:
      ST24_GEOMETRY.startXmm +
      column * (ST24_GEOMETRY.labelWidthMm + ST24_GEOMETRY.gapXmm) +
      calibration.xMm,
    yMm:
      ST24_GEOMETRY.startYmm +
      row * (ST24_GEOMETRY.labelHeightMm + ST24_GEOMETRY.gapYmm) +
      calibration.yMm,
    widthMm: ST24_GEOMETRY.labelWidthMm,
    heightMm: ST24_GEOMETRY.labelHeightMm,
  };
}

export function getAllSlotPositions(calibration: Calibration = DEFAULT_CALIBRATION): SlotPosition[] {
  return Array.from({ length: SLOT_COUNT }, (_, index) => getSlotPosition(index + 1, calibration));
}
