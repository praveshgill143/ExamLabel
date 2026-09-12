import {
  getSlotPosition,
  type Calibration,
  type SlotPosition,
} from "./geometry";
import type { StudentRecord } from "./student";

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

export function paginateStudents(
  students: StudentRecord[],
  startSlot: number,
  calibration: Calibration = { xMm: 0, yMm: 0 },
): LabelPage[] {
  assertStartSlot(startSlot);

  if (students.length === 0) {
    return [];
  }

  const pages: LabelPage[] = [];
  let pageNumber = 1;
  let slotNumber = startSlot;

  for (const student of students) {
    if (slotNumber > 24) {
      pageNumber += 1;
      slotNumber = 1;
    }

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

    slotNumber += 1;
  }

  return pages;
}
