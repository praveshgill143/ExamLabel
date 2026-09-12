# ExamLabel V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a frontend-only browser app that converts an Excel/CSV student list into an accurately positioned A4 PDF for the uploaded ST-24 24-label sheet.

**Architecture:** Next.js App Router hosts one client workflow. Pure TypeScript domain modules parse spreadsheet rows, compute ST-24 geometry, paginate students into physical slots, and generate the PDF; both preview and PDF consume the same page/slot model so placement stays consistent. Student data never needs a backend and remains in the browser.

**Tech Stack:** Next.js 15, React 19, TypeScript, SheetJS/xlsx, pdf-lib, Vitest, plain CSS.

**Spec:** `docs/superpowers/specs/2026-09-11-exam-label-v1-design.md`

## Global Constraints

- A4 only: 210.0 mm × 297.0 mm.
- ST-24 only: 24 labels, 3 columns × 8 rows.
- Default grid start: X 5.8 mm, Y 11.2 mm.
- Label size: 64.0 mm × 34.0 mm.
- Horizontal gap: 1.6 mm; vertical gap: 0.0 mm.
- Derived default margins: left 5.8 mm, right 9.0 mm, top 11.2 mm, bottom 13.8 mm.
- Student fields and display order are exactly: `Class`, `Hall Ticket NO.`, `AdmNo`, `Student Name`, `Room NO.`.
- Label text is left aligned and the five-line block is vertically centered.
- Start label is selectable from 1 through 24 for page 1 only; later pages start at slot 1.
- All parsing and PDF generation happen in the browser; no backend, login, database, or AI.
- Preview and PDF must consume the same geometry/page model.
- X and Y calibration offsets are expressed in millimetres and shift the full grid.
- Missing required headers or incomplete rows must be surfaced; incomplete rows must not silently print.

---

## File Structure

```text
src/
  app/
    globals.css                 # application and A4 preview styling
    layout.tsx                  # root metadata/layout
    page.tsx                    # composition shell only
  components/
    ExamLabelApp.tsx            # workflow state and actions
    UploadPanel.tsx             # file selection + parsing errors
    ControlsPanel.tsx           # start slot and X/Y calibration
    StudentTable.tsx            # parsed rows + invalid-row review
    SheetPreview.tsx            # A4 preview from page/slot model
  domain/
    student.ts                  # StudentRecord, parsed-row types, exact headers
    spreadsheet.ts              # xlsx/xls/csv parsing and validation
    geometry.ts                 # ST-24 physical dimensions and slot positions
    pagination.ts               # student-to-page/slot mapping
    pdf.ts                      # pdf-lib renderer and text fitting
  test/
    setup.ts                    # Vitest setup
    fixtures.ts                 # reusable valid/invalid student data
```

Tests live beside domain modules as `*.test.ts` so each behavior stays close to its implementation.

---

### Task 1: Project scaffold and test harness

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `eslint.config.mjs`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Create: `.gitignore`

**Interfaces:**
- Produces: `npm run dev`, `npm run test`, `npm run lint`, and `npm run build` as the common verification commands.
- Consumes: none.

- [ ] **Step 1: Create the package/test configuration**

Use scripts:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

Dependencies: `next`, `react`, `react-dom`, `pdf-lib`, and SheetJS `xlsx`. Dev dependencies: `typescript`, React/Node types, ESLint Next config, `vitest`, `jsdom`, and `@testing-library/jest-dom`.

- [ ] **Step 2: Add a temporary failing smoke test for the app title**

Create `src/app/page.test.tsx` that imports `APP_TITLE` from `src/app/page.tsx` and expects `Exam Label Generator`.

```ts
import { describe, expect, it } from "vitest";
import { APP_TITLE } from "./page";

describe("app shell", () => {
  it("uses the Exam Label Generator title", () => {
    expect(APP_TITLE).toBe("Exam Label Generator");
  });
});
```

- [ ] **Step 3: Run the test and verify RED**

Run: `npm test -- src/app/page.test.tsx`

Expected: FAIL because `APP_TITLE` is not exported yet.

- [ ] **Step 4: Add the minimal app shell**

`src/app/page.tsx` exports `APP_TITLE` and renders an `<h1>` only. `layout.tsx` imports `globals.css` and supplies basic metadata.

- [ ] **Step 5: Run test/lint/build and verify GREEN**

Run:

```bash
npm test -- src/app/page.test.tsx
npm run lint
npm run build
```

Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json tsconfig.json next.config.ts eslint.config.mjs vitest.config.ts src .gitignore
git commit -m "chore: scaffold ExamLabel app"
```

---

### Task 2: ST-24 geometry engine

**Files:**
- Create: `src/domain/geometry.test.ts`
- Create: `src/domain/geometry.ts`

**Interfaces:**
- Produces:
  - `ST24_GEOMETRY: LabelSheetGeometry`
  - `getSlotPosition(slotNumber: number, calibration?: Calibration): SlotPosition`
  - `getSlotNumber(row: number, column: number): number`
- Consumes: none.

Required types:

```ts
export type Calibration = { xMm: number; yMm: number };
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
```

- [ ] **Step 1: Write failing geometry tests**

Tests must assert:

```ts
expect(getSlotPosition(1)).toMatchObject({ xMm: 5.8, yMm: 11.2, row: 0, column: 0 });
expect(getSlotPosition(2)).toMatchObject({ xMm: 71.4, yMm: 11.2, row: 0, column: 1 });
expect(getSlotPosition(3)).toMatchObject({ xMm: 137.0, yMm: 11.2, row: 0, column: 2 });
expect(getSlotPosition(4)).toMatchObject({ xMm: 5.8, yMm: 45.2, row: 1, column: 0 });
expect(getSlotPosition(24)).toMatchObject({ xMm: 137.0, yMm: 249.2, row: 7, column: 2 });
expect(getSlotPosition(1, { xMm: 1.2, yMm: -0.7 })).toMatchObject({ xMm: 7.0, yMm: 10.5 });
expect(() => getSlotPosition(0)).toThrow(/1 and 24/);
expect(() => getSlotPosition(25)).toThrow(/1 and 24/);
```

- [ ] **Step 2: Run and verify RED**

Run: `npm test -- src/domain/geometry.test.ts`

Expected: FAIL because geometry module does not exist.

- [ ] **Step 3: Implement minimal geometry calculations**

Use:

```ts
x = startXmm + column * (labelWidthMm + gapXmm) + calibration.xMm;
y = startYmm + row * (labelHeightMm + gapYmm) + calibration.yMm;
```

Slot numbering is left-to-right then top-to-bottom.

- [ ] **Step 4: Run tests and verify GREEN**

Run: `npm test -- src/domain/geometry.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/geometry.ts src/domain/geometry.test.ts
git commit -m "feat: add ST-24 geometry engine"
```

---

### Task 3: Pagination and start-label behavior

**Files:**
- Create: `src/domain/student.ts`
- Create: `src/test/fixtures.ts`
- Create: `src/domain/pagination.test.ts`
- Create: `src/domain/pagination.ts`

**Interfaces:**
- Produces:
  - `StudentRecord`
  - `PlacedLabel`
  - `LabelPage`
  - `paginateStudents(students: StudentRecord[], startSlot: number, calibration?: Calibration): LabelPage[]`
- Consumes: `getSlotPosition` from Task 2.

Student type:

```ts
export type StudentRecord = {
  className: string;
  hallTicketNo: string;
  admNo: string;
  studentName: string;
  roomNo: string;
  sourceRow: number;
};
```

- [ ] **Step 1: Write failing pagination tests**

Cover:
- one student at start slot 1 goes to page 1 / slot 1;
- one student at start slot 6 goes to page 1 / slot 6;
- 19 students starting at slot 6 exactly fill slots 6–24 on page 1;
- student 20 rolls to page 2 / slot 1;
- 24 students starting at slot 1 make one page;
- 25 students make two pages;
- later pages always begin at slot 1;
- invalid start slots 0 and 25 throw.

- [ ] **Step 2: Run and verify RED**

Run: `npm test -- src/domain/pagination.test.ts`

Expected: FAIL because `paginateStudents` does not exist.

- [ ] **Step 3: Implement minimal pagination model**

`PlacedLabel` must include both the student and the physical `SlotPosition` from geometry so preview/PDF cannot create their own placement logic.

- [ ] **Step 4: Run tests and verify GREEN**

Run: `npm test -- src/domain/pagination.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/student.ts src/test/fixtures.ts src/domain/pagination.ts src/domain/pagination.test.ts
git commit -m "feat: paginate students into ST-24 slots"
```

---

### Task 4: Spreadsheet parsing and validation

**Files:**
- Create: `src/domain/spreadsheet.test.ts`
- Create: `src/domain/spreadsheet.ts`

**Interfaces:**
- Produces:
  - `REQUIRED_HEADERS`
  - `parseWorkbookBytes(bytes: ArrayBuffer, fileName: string): ParseResult`
  - `parseMatrix(rows: unknown[][]): ParseResult` for testable pure parsing
- Consumes: `StudentRecord` from Task 3.

Result model:

```ts
export type RowIssue = {
  sourceRow: number;
  missingFields: string[];
};

export type ParseResult = {
  students: StudentRecord[];
  issues: RowIssue[];
  errors: string[];
};
```

- [ ] **Step 1: Write failing pure-parser tests**

Cover exact headers in exact names:

```ts
["Class", "Hall Ticket NO.", "AdmNo", "Student Name", "Room NO."]
```

Cover:
- valid four-row sample from the user;
- numeric hall ticket / admission values normalize to strings;
- fully blank rows are ignored;
- required-header omission returns an error naming the missing header;
- incomplete rows are excluded from `students` and reported in `issues` with Excel-like source row numbers;
- values are trimmed but otherwise not rewritten.

- [ ] **Step 2: Run and verify RED**

Run: `npm test -- src/domain/spreadsheet.test.ts`

Expected: FAIL because parser does not exist.

- [ ] **Step 3: Implement `parseMatrix` minimally**

Map exact header indexes, preserve values as display strings, and report incomplete rows.

- [ ] **Step 4: Run tests and verify GREEN for pure parser**

Run: `npm test -- src/domain/spreadsheet.test.ts`

Expected: PASS for matrix tests.

- [ ] **Step 5: Add a failing workbook-bytes test**

Create an in-memory workbook using SheetJS in the test and assert `parseWorkbookBytes` returns the same student data for `.xlsx` and `.csv` inputs.

- [ ] **Step 6: Verify RED, implement workbook reading, then verify GREEN**

Run: `npm test -- src/domain/spreadsheet.test.ts`

Expected after implementation: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/domain/spreadsheet.ts src/domain/spreadsheet.test.ts
git commit -m "feat: parse and validate student spreadsheets"
```

---

### Task 5: Deterministic PDF renderer

**Files:**
- Create: `src/domain/pdf.test.ts`
- Create: `src/domain/pdf.ts`

**Interfaces:**
- Produces:
  - `mmToPt(mm: number): number`
  - `generateLabelPdf(pages: LabelPage[]): Promise<Uint8Array>`
- Consumes: `LabelPage`, `PlacedLabel`, `SlotPosition` from Tasks 2–3.

Label lines in exact order:

```text
Class: <className>
Hall Ticket NO.: <hallTicketNo>
AdmNo: <admNo>
Student Name: <studentName>
Room NO.: <roomNo>
```

- [ ] **Step 1: Write failing conversion/layout tests**

Cover:
- `mmToPt(25.4)` is 72 points;
- A4 page size equals 210 × 297 mm in points;
- generated one-student PDF has one page;
- generated 25-student pagination result has two pages;
- PDF byte output begins with `%PDF`.

Also expose a pure helper `buildLabelLines(student)` and test the exact five-line order.

- [ ] **Step 2: Run and verify RED**

Run: `npm test -- src/domain/pdf.test.ts`

Expected: FAIL because PDF module does not exist.

- [ ] **Step 3: Implement minimal renderer**

Rules:
- use Helvetica / Helvetica-Bold embedded standard fonts;
- use the physical x/y/width/height carried by `PlacedLabel.position`;
- convert top-left millimetre coordinates to PDF bottom-left point coordinates;
- use an internal left/right padding of 3.0 mm and top/bottom safe padding of 2.0 mm;
- vertically center the complete five-line block inside the 34 mm label;
- default font size 8.5 pt and line height 10.0 pt;
- Student Name value line is bold as one full line;
- if any line exceeds available width, reduce the shared font size in 0.25 pt steps down to 6.5 pt; if still too wide, keep 6.5 pt and clip to the label content box rather than drawing outside it.

- [ ] **Step 4: Run tests and verify GREEN**

Run: `npm test -- src/domain/pdf.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/pdf.ts src/domain/pdf.test.ts
git commit -m "feat: generate calibrated ST-24 PDFs"
```

---

### Task 6: Shared preview components

**Files:**
- Create: `src/components/SheetPreview.test.tsx`
- Create: `src/components/SheetPreview.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Produces: `SheetPreview({ pages, activePage }: SheetPreviewProps)`.
- Consumes: `LabelPage[]`; does not recalculate slots.

- [ ] **Step 1: Write failing component tests**

Test that a page with two placed labels renders the two exact student names and that the first label element exposes CSS variables derived from its supplied `position` rather than from slot-number math.

- [ ] **Step 2: Run and verify RED**

Run: `npm test -- src/components/SheetPreview.test.tsx`

Expected: FAIL because preview component does not exist.

- [ ] **Step 3: Implement A4 preview**

Render a scaled `210mm × 297mm` page. Each label is absolutely positioned from the supplied x/y/width/height values and shows the same five lines in the same order as the PDF. Draw subtle slot outlines only in preview; PDF must not print label borders.

- [ ] **Step 4: Run tests and verify GREEN**

Run: `npm test -- src/components/SheetPreview.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/SheetPreview.tsx src/components/SheetPreview.test.tsx src/app/globals.css
git commit -m "feat: add shared-geometry A4 preview"
```

---

### Task 7: Upload, controls, review table, and PDF download workflow

**Files:**
- Create: `src/components/ExamLabelApp.test.tsx`
- Create: `src/components/ExamLabelApp.tsx`
- Create: `src/components/UploadPanel.tsx`
- Create: `src/components/ControlsPanel.tsx`
- Create: `src/components/StudentTable.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Produces: complete V1 browser workflow.
- Consumes: parser, pagination, PDF generator, and `SheetPreview`.

- [ ] **Step 1: Write failing workflow tests**

Cover:
- initial screen has upload input and disables PDF button;
- valid parsed data enables preview/PDF actions;
- start-label control accepts 1–24 and regenerates pagination;
- X/Y offsets regenerate positions;
- parser errors are visible;
- incomplete-row issues are visible and excluded from generated labels;
- Download PDF action calls `generateLabelPdf` and creates a browser download named `exam-labels.pdf`.

Use dependency injection for parser/PDF functions where browser APIs make direct integration brittle; do not mock domain logic already covered by unit tests.

- [ ] **Step 2: Run and verify RED**

Run: `npm test -- src/components/ExamLabelApp.test.tsx`

Expected: FAIL because workflow components do not exist.

- [ ] **Step 3: Implement minimal workflow**

UI sections:
1. title and short ST-24 description;
2. upload card;
3. detected-student and issue counts;
4. Start Label selector (1–24);
5. X Offset and Y Offset numeric inputs with 0.1 mm step;
6. A4 preview with page navigation when needed;
7. valid-student table and row-issue review;
8. `Generate / Download PDF` primary action;
9. print instruction: `Print at Actual Size / 100%. Do not use Fit to Page.`

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `npm test -- src/components/ExamLabelApp.test.tsx`

Expected: PASS.

- [ ] **Step 5: Run the full quality gate**

Run:

```bash
npm test
npm run lint
npm run build
```

Expected: all pass with zero test failures and zero build errors.

- [ ] **Step 6: Commit**

```bash
git add src/app src/components
git commit -m "feat: complete ExamLabel V1 workflow"
```

---

### Task 8: Calibration guidance and final verification

**Files:**
- Create: `README.md`
- Create: `docs/calibration.md`

**Interfaces:**
- Produces: reproducible local setup and physical print-verification procedure.
- Consumes: completed app.

- [ ] **Step 1: Document setup and use**

README must contain Windows PowerShell commands:

```powershell
Set-Location C:\Projects\ExamLabel
npm install
npm run dev
```

Document the exact Excel columns and sample row, supported `.xlsx/.xls/.csv`, start-label behavior, PDF download, and 100% print requirement.

- [ ] **Step 2: Document calibration procedure**

`docs/calibration.md` must instruct the user to:
1. load sample data;
2. generate one A4 page;
3. print onto plain A4 at Actual Size / 100%;
4. place that page behind the physical ST-24 label sheet and hold against light;
5. measure horizontal/vertical mismatch in millimetres;
6. enter compensating X/Y offsets;
7. repeat until text falls inside every label;
8. save the successful values externally for that printer in V1.

Record the default geometry table in both mm and cm.

- [ ] **Step 3: Run final verification**

Run:

```bash
npm test
npm run lint
npm run build
git status --short
```

Expected: all automated checks pass; working tree contains only the intended README/docs changes before commit.

- [ ] **Step 4: Commit**

```bash
git add README.md docs/calibration.md
git commit -m "docs: add setup and ST-24 calibration guide"
```

