# ExamLabel V1 Design

## Goal
Build a browser-based school exam label generator that converts an Excel student list into a print-ready A4 PDF for the user's ST-24 label sheet.

## Scope
Version 1 supports one physical sheet only:
- A4 paper
- 24 labels per page
- 3 columns × 8 rows
- nominal label size: 64 mm × 34 mm

The application is frontend-only. No login, backend, database, or server-side student-data processing is required.

## Input
Supported upload types:
- .xlsx
- .xls
- .csv

Required student fields, in this exact display order:
1. Class
2. Hall Ticket NO.
3. AdmNo
4. Student Name
5. Room NO.

Each non-empty Excel row produces one label. The application must not alter student values.

## Label Layout
Each label prints only these five lines:

Class: <value>
Hall Ticket NO.: <value>
AdmNo: <value>
Student Name: <value>
Room NO.: <value>

Formatting:
- left aligned
- small internal padding
- vertically centered as one text block
- Student Name may be slightly bolder for readability
- text must stay inside the label boundary
- long values may reduce font size within safe limits rather than overflow

## Physical ST-24 Geometry
The default template is based on the uploaded scanned A4 ST-24 sheet and the printed nominal label size 64 mm × 34 mm. Because the source is a scan, the app must keep X/Y calibration controls; however, the following dimensions are the V1 defaults used by preview and PDF generation:

- page width: 210.0 mm
- page height: 297.0 mm
- left margin / grid start X: 5.8 mm (0.58 cm)
- top margin / grid start Y: 11.2 mm (1.12 cm)
- label width: 64.0 mm (6.40 cm)
- label height: 34.0 mm (3.40 cm)
- horizontal gap: 1.6 mm (0.16 cm)
- vertical gap: 0.0 mm
- derived right margin: 9.0 mm (0.90 cm)
- derived bottom margin: 13.8 mm (1.38 cm)

Column start positions before calibration:
- column 1: 5.8 mm
- column 2: 71.4 mm
- column 3: 137.0 mm

Row start positions before calibration:
- row 1: 11.2 mm
- row 2: 45.2 mm
- row 3: 79.2 mm
- row 4: 113.2 mm
- row 5: 147.2 mm
- row 6: 181.2 mm
- row 7: 215.2 mm
- row 8: 249.2 mm

All coordinates are measured from the top-left corner of the A4 page. X/Y calibration offsets are added to every slot position.

## Sheet Placement
Labels are filled left-to-right, top-to-bottom:
1 2 3
4 5 6
...
22 23 24

The user can choose a start label from 1 through 24 for the first PDF page so partially used sheets can be reused. Any skipped labels on the first page remain blank. Subsequent pages start at label 1.

## Preview
The application shows an A4 preview with the 3 × 8 label grid before PDF generation. The preview must use the same geometry model as PDF generation so visual placement and PDF placement do not drift independently.

## PDF Output
Generate PDF directly using physical measurements rather than relying on browser print layout.

Requirements:
- A4 dimensions
- 24 physical label slots per page
- automatic pagination after 24 slots
- first-page start-label offset
- no scaling assumptions in generated coordinates
- user prints at Actual Size / 100%

## Printer Calibration
Provide at least:
- X offset in mm
- Y offset in mm

Offsets shift the whole label grid to compensate for printer registration differences. Default values are 0 mm.

## Architecture
Recommended stack:
- Next.js
- TypeScript
- SheetJS (xlsx) for Excel/CSV parsing
- pdf-lib for deterministic PDF generation
- CSS for UI and preview
- Vitest for unit tests

Main modules:
1. spreadsheet parser: validates required headers and returns normalized student rows
2. label geometry: calculates row/column slots and millimetre positions
3. pagination: maps student records to pages and slots, respecting start-label
4. PDF renderer: uses the same geometry model to draw text onto A4 pages
5. preview: renders the same page/slot model in the browser
6. app UI: upload, validation errors, start-label selector, X/Y calibration, preview, PDF download

## Validation and Errors
The app should clearly report:
- unsupported file type
- missing required columns
- empty spreadsheet
- rows with missing required values

Rows with missing required values should be identified for review rather than silently printing incomplete labels.

## Testing
Unit tests should cover:
- spreadsheet header matching for the exact required column names
- parsing valid rows
- rejecting missing required headers
- skipping fully blank rows
- identifying incomplete rows
- 3 × 8 slot ordering
- first-page start-label behavior
- page rollover after slot 24
- multi-page counts
- geometry calculations in mm
- calibration offsets

A manual print test should be performed on plain A4 paper against the physical ST-24 sheet before production use.

## Non-Goals for V1
Do not add:
- additional label templates
- school/exam headings on labels
- backend storage
- authentication
- saved student databases
- AI processing
- drag-and-drop label designer
- arbitrary field mapping UI

These can be considered later after the ST-24 printing accuracy is proven.
