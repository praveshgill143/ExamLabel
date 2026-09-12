# Codex Handoff - ExamLabel V1

Open this project in Codex at:

```text
C:\Projects\ExamLabel
```

## Fixed product requirements

Do not change these unless the user explicitly requests it:

- A4 only: 210.0 × 297.0 mm
- ST-24 only: 24 labels, 3 columns × 8 rows
- left margin: 5.8 mm (0.58 cm)
- right margin: 9.0 mm (0.90 cm)
- top margin: 11.2 mm (1.12 cm)
- bottom margin: 13.8 mm (1.38 cm)
- each label: 64.0 × 34.0 mm
- horizontal gap: 1.6 mm
- vertical gap: 0 mm
- label field order: Class -> Hall Ticket NO. -> AdmNo -> Student Name -> Room NO.
- label text: left aligned
- first page can start at label 1-24; later pages start at label 1
- browser-only processing; no backend/database/login/AI
- print PDF at Actual Size / 100%

## First Codex action

Use PowerShell in the project folder and run:

```powershell
npm install
npm test
npm run lint
npm run build
```

If any command fails, use systematic debugging and fix the smallest root cause. Do not alter ST-24 geometry to make software tests pass.

After all four commands are green:

```powershell
npm run dev
```

Upload `samples\students-example.csv`, confirm the first four students appear in labels 1-4, then generate `exam-labels.pdf`.

## Physical verification

Follow `docs\calibration.md`. Print first on plain A4 at Actual Size / 100%, place it behind the physical ST-24 sheet, and use X/Y offsets only for whole-page printer registration differences.
