import {
  getSlotPosition,
  getSlotNumber,
  ST24_GEOMETRY,
  type Calibration,
  type SlotPosition,
} from "./geometry";
import type { StudentRecord } from "./student";

export type LabelFillOrder = "across-rows" | "down-columns";

export type PlacedLabel = {
  pageNumber: number;
  slotNumber: number;
  student: StudentRecord;
  position: SlotPosition;
};

export type LabelPage = {
  pageNumber: number;
  labels: PlacedLabel[];
};

function assertStartSlot(startSlot: number): void {
  if (!Number.isInteger(startSlot) || startSlot < 1 || startSlot > 24) {
    throw new RangeError("Start label must be between 1 and 24.");
  }
}

export function getSlotOrder(fillOrder: LabelFillOrder = "across-rows"): number[] {
  if (fillOrder === "across-rows") {
    return Array.from({ length: ST24_GEOMETRY.columns * ST24_GEOMETRY.rows }, (_, index) => index + 1);
  }

  return Array.from({ length: ST24_GEOMETRY.columns }, (_, column) =>
    Array.from({ length: ST24_GEOMETRY.rows }, (_, row) => getSlotNumber(row, column)),
  ).flat();
}

export function paginateStudents(
  students: StudentRecord[],
  startSlot: number,
  calibration: Calibration = { xMm: 0, yMm: 0 },
  fillOrder: LabelFillOrder = "across-rows",
): LabelPage[] {
  assertStartSlot(startSlot);

  if (students.length === 0) {
    return [];
  }

  const pages: LabelPage[] = [];
  let pageNumber = 1;
  const slotOrder = getSlotOrder(fillOrder);
  let slotIndex = slotOrder.indexOf(startSlot);

  for (const student of students) {
    if (slotIndex >= slotOrder.length) {
      pageNumber += 1;
      slotIndex = 0;
    }

    const slotNumber = slotOrder[slotIndex];

    let page = pages.at(-1);
    if (!page || page.pageNumber !== pageNumber) {
      page = { pageNumber, labels: [] };
      pages.push(page);
    }

    page.labels.push({
      pageNumber,
      slotNumber,
      student,
      position: getSlotPosition(slotNumber, calibration),
    });

    slotIndex += 1;
  }

  return pages;
}
