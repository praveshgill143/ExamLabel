# Exam Duty Module Design

Date: 2026-09-12  
Project: `C:\Projects\ExamLabel`

## Goal
Add a new **Exam Duty** module to the existing ExamLabel utility without changing the working Exam Label geometry, spreadsheet parsing, preview, PDF generation, calibration, or print flow.

The product has two tools:
- **Exam Labels** — existing feature, preserved.
- **Exam Duty** — new feature for teacher setup, exam-data import, automatic duty allocation, review, counts, and export.

The duty module remains browser-only and stores its data in a separate IndexedDB database. No backend, login, cloud database, or AI service is needed.

## Isolation
- Keep `/` as the current Exam Label screen.
- Add a small top navigation with **Exam Labels** and **Exam Duty**.
- Add `/duty` for the new module.
- Put all duty code under `src/features/exam-duty/` and `src/app/duty/`.
- Use a separate IndexedDB database name such as `exam-duty-db`.
- Do not modify label-domain modules to implement duty features.
- Run existing label tests before and after duty work.

## Normal workflow
### One-time setup stored in IndexedDB
- Teacher Master
- Teacher class/subject assignments
- Fixed Question Paper Distribution/Collection duties
- Duty rules
- Fixed lower-class exam locations such as LKG-A, UKG-A/B, I-A/B, II-A/B/C

### Every examination
1. New Examination
2. Enter exam name/session
3. Upload one `Exam_Data.xlsx`
4. System reads `Seating Plan` and `Exam Timetable`
5. Mark unavailable teachers in the UI, if any
6. Generate all dates together
7. Review date-wise duty, duty count, room history, and shortages
8. Export Excel

## IndexedDB stores
- `teachers`
- `teacherAssignments`
- `specialDuties`
- `schoolDutySettings`
- `exams`
- `seatingRows`
- `timetableRows`
- `teacherUnavailability`
- `generatedDuties`

Teacher group eligibility is derived from actual class assignments, not typed manually.

## Three duty groups
### LKG-V
Eligible if the teacher teaches at least one class from LKG, UKG, I, II, III, IV, or V. Teachers may be shuffled anywhere inside the LKG-V duty group.

### VI-VIII
Eligible if the teacher teaches at least one class from VI, VII, or VIII. Teachers may be shuffled anywhere inside VI-VIII.

### IX-XII
Eligible if the teacher teaches at least one class from IX, X, XI, or XII. Teachers may be shuffled anywhere inside IX-XII.

A teacher who genuinely teaches across group boundaries may be eligible for more than one group, but can receive only one room duty on one exam date. The generator must never assign a teacher to a group in which they teach no class.

## Fixed special duties
- Fixed Distribution/Collection staff are stored once in Settings.
- They are excluded from room invigilation while their special duty is active.
- Their special duty counts as one duty on each active exam date.
- Alias and official name map to one teacher identity.

## `Exam_Data.xlsx`
### `Seating Plan` sheet
Required columns:
- S.No.
- Room No.
- Hall Ticket No.
- Admission No.
- Student Name
- Class
- Section / Stream

The parser groups rows by room and derives the duty group from the seated classes. Mixed duty groups in one numbered room are flagged for review instead of guessed.

### `Exam Timetable` sheet
Required columns:
- Exam Name
- Session
- Exam Date
- Day
- Class
- Section / Stream
- Subject / Paper
- Exam Type
- Start Time
- End Time

Use long format: one class/paper/date per row.

## Unavailable teachers
No extra Excel file. The user selects a date and marks teachers unavailable in the UI. Those teachers are excluded from that date's generation.

## Allocation engine
For each exam date:
1. Load active rooms/locations.
2. Determine each location's duty group.
3. Load active eligible teachers.
4. Remove fixed special-duty staff.
5. Remove unavailable teachers.
6. Enforce one room duty per teacher per date.
7. Give one minimum teacher to every active room/location first.
8. Add second teachers where preferred staffing and group availability allow.
9. Never fill a shortage with an ineligible teacher.
10. Rotate teachers across locations using history from the full examination.

Rotation preference:
1. avoid same location on consecutive exam dates
2. minimize repeated locations
3. minimize repeated teacher pairs
4. balance total duties where totals differ
5. keep group usage stable where possible
6. deterministic tie-break by teacher id/name

If a second eligible teacher is unavailable, leave the position blank and show `STAFF SHORTAGE`. If even the minimum teacher is unavailable, show `CRITICAL SHORTAGE`.

## Review screen
Columns:
- Group
- Class / Room
- Actual Seating
- Exam Subject(s)
- Students
- Teacher 1
- Teacher 2
- Status

Controls:
- Previous/Next date
- Filter by group
- Regenerate
- Finalize
- Export Excel

Manual replacement comes after automatic generation is stable. Any replacement list must contain only eligible, available, unassigned, non-special-duty teachers.

## Duty count
Provide a date-wise duty-count table:
- Teacher / Staff
- Duty Group / Type
- one column per exam date
- **TOTAL ALL DUTY** as the last column

Count both room duty and fixed special duty. Also show room/location history for shuffle review.

## Excel export
MVP workbook sheets:
1. Summary
2. Exam Schedule
3. Actual Seating Plan
4. Teacher Master
5. Fixed Special Duties
6. one `Duty <date>` sheet per exam date
7. Duty Count Date Wise
8. Rotation Audit

Use the already-reviewed school duty-list structure.

## Code structure
```text
src/
  app/
    duty/
      page.tsx
  features/
    exam-duty/
      components/
      domain/
        allocation.ts
        groups.ts
        validation.ts
        duty-count.ts
      import/
        exam-data-parser.ts
        teacher-import.ts
      storage/
        db.ts
        repositories.ts
      export/
        excel.ts
      types.ts
```

## Testing
Add tests for:
- all three group rules
- multi-group eligibility
- no ineligible assignment
- valid/missing Excel sheets and headers
- mixed room groups
- IndexedDB save/load/schema upgrade
- fixed staff exclusion
- unavailable staff exclusion
- one duty per teacher/date
- minimum coverage before second teachers
- shortage flags
- no consecutive same-room repeat when an alternative exists
- deterministic regeneration
- date-wise counts and TOTAL ALL DUTY
- existing Exam Label regression suite

## Implementation phases
### Phase 1 — Safe shell and database
Navigation, `/duty`, isolated feature folder, IndexedDB repositories, Teacher Setup, Special Duties, Duty Rules.

### Phase 2 — New Exam import
`Exam_Data.xlsx` parser, validation, exam persistence, unavailable-teacher UI.

### Phase 3 — Duty generation
Three-group allocator, rotation history, shortage validation, date-wise review, duty count.

### Phase 4 — Output
Excel export, rotation audit, validated manual replacement, then print/PDF only after Excel output is verified with real school data.

## MVP definition of done
- Exam Labels behavior remains unchanged.
- Exam Duty is separate and persistent.
- Teacher/settings data is entered once and reused.
- Normal exam input is one `Exam_Data.xlsx`.
- All exam dates generate together.
- Only eligible teachers are assigned.
- Fixed special-duty staff never receive room duty.
- No teacher has two room duties on the same date.
- Teachers are shuffled across their own group.
- Shortages are explicit.
- Duty Count shows every date and `TOTAL ALL DUTY`.
- Excel export matches the school duty-list format.
- Label regression tests and Duty tests are both part of verification.
