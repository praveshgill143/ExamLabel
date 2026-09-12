# ExamLabel

ExamLabel is a browser-based school exam label generator for one physical label sheet: **A4 ST-24, 24 labels, 3 columns × 8 rows, nominal label size 64 × 34 mm**.

Student data stays in the browser. There is no login, backend, database, or AI processing in V1.

## Required Excel columns

Use these five headers exactly and keep the same order:

| Class | Hall Ticket NO. | AdmNo | Student Name | Room NO. |
| --- | --- | --- | --- | --- |
| LKG#A | 100 | 6007 | AARAV YADAV | LKG#A |
| LKG#A | 101 | 6088 | ABHUDAY MISHRA | LKG#A |

Supported files: `.xlsx`, `.xls`, `.csv`.

Each valid spreadsheet row becomes one label with these five left-aligned lines:

```text
Class: LKG#A
Hall Ticket NO.: 100
AdmNo: 6007
Student Name: AARAV YADAV
Room NO.: LKG#A
```

Incomplete rows are shown for review and are not silently printed.

## ST-24 default geometry

| Measurement | mm | cm |
| --- | ---: | ---: |
| A4 page width | 210.0 | 21.00 |
| A4 page height | 297.0 | 29.70 |
| Left margin / start X | 5.8 | 0.58 |
| Top margin / start Y | 11.2 | 1.12 |
| Label width | 64.0 | 6.40 |
| Label height | 34.0 | 3.40 |
| Horizontal gap | 1.6 | 0.16 |
| Vertical gap | 0.0 | 0.00 |
| Derived right margin | 9.0 | 0.90 |
| Derived bottom margin | 13.8 | 1.38 |

The sheet is filled left-to-right and then top-to-bottom. The first page can begin at any label from 1 through 24 so partially used sheets can be reused. All later pages start at label 1.

## Run on Windows

Open **PowerShell** and run:

```powershell
Set-Location C:\Projects\ExamLabel
npm install
npm run dev
```

Then open the local address shown by Next.js, normally `http://localhost:3000`.

## Production checks

Run in **PowerShell** from `C:\Projects\ExamLabel`:

```powershell
npm test
npm run lint
npm run build
```

## Printing

1. Upload the student Excel/CSV file.
2. Review the valid-student and incomplete-row counts.
3. Choose **Start from label** if the physical sheet is already partly used.
4. Set X/Y printer offsets if needed.
5. Preview the A4 sheet.
6. Download `exam-labels.pdf`.
7. In the PDF print dialog choose **Actual Size / 100%**.
8. Do **not** choose Fit, Shrink, Scale to fit, or Fit to Page.

Before printing a large batch, follow [`docs/calibration.md`](docs/calibration.md).

## One-command verification on Windows

After copying the project to `C:\Projects\ExamLabel`, open **PowerShell** and run:

```powershell
Set-Location C:\Projects\ExamLabel
.\scripts\verify.ps1
```

A sample input file is included at `samples\students-example.csv`.
