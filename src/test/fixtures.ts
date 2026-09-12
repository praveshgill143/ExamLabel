import type { StudentRecord } from "@/domain/student";

export const SAMPLE_STUDENTS: StudentRecord[] = [
  {
    fields: [
      { heading: "Class", value: "LKG#A" },
      { heading: "Hall Ticket NO.", value: "100" },
      { heading: "AdmNo", value: "6007" },
      { heading: "Student Name", value: "AARAV YADAV" },
      { heading: "Room NO.", value: "LKG#A" },
    ],
    sourceRow: 2,
  },
  {
    fields: [
      { heading: "Class", value: "LKG#A" },
      { heading: "Hall Ticket NO.", value: "101" },
      { heading: "AdmNo", value: "6088" },
      { heading: "Student Name", value: "ABHUDAY MISHRA" },
      { heading: "Room NO.", value: "LKG#A" },
    ],
    sourceRow: 3,
  },
  {
    fields: [
      { heading: "Class", value: "LKG#A" },
      { heading: "Hall Ticket NO.", value: "102" },
      { heading: "AdmNo", value: "5916" },
      { heading: "Student Name", value: "ADVIKA SINGH" },
      { heading: "Room NO.", value: "LKG#A" },
    ],
    sourceRow: 4,
  },
  {
    fields: [
      { heading: "Class", value: "LKG#A" },
      { heading: "Hall Ticket NO.", value: "103" },
      { heading: "AdmNo", value: "5910" },
      { heading: "Student Name", value: "AHAAN SIDDIQUI" },
      { heading: "Room NO.", value: "LKG#A" },
    ],
    sourceRow: 5,
  },
];

export function makeStudents(count: number): StudentRecord[] {
  return Array.from({ length: count }, (_, index) => ({
    fields: [
      { heading: "Class", value: "VIII#A" },
      { heading: "Hall Ticket NO.", value: String(100 + index) },
      { heading: "AdmNo", value: String(6000 + index) },
      { heading: "Student Name", value: `STUDENT ${index + 1}` },
      { heading: "Room NO.", value: "ROOM 1" },
    ],
    sourceRow: index + 2,
  }));
}
