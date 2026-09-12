# ST-24 Printer Calibration

The default template is based on the uploaded ST-24 A4 sheet. Printers can still shift output by 1–2 mm, so calibrate the printer before a large exam batch.

## Default physical layout

| Measurement | mm | cm |
| --- | ---: | ---: |
| Page | 210.0 × 297.0 | 21.00 × 29.70 |
| Left margin | 5.8 | 0.58 |
| Top margin | 11.2 | 1.12 |
| Right margin | 9.0 | 0.90 |
| Bottom margin | 13.8 | 1.38 |
| Each label | 64.0 × 34.0 | 6.40 × 3.40 |
| Horizontal gap | 1.6 | 0.16 |
| Vertical gap | 0.0 | 0.00 |

Default column starts from the left edge are **5.8 mm, 71.4 mm, 137.0 mm**.

Default row starts from the top edge are **11.2, 45.2, 79.2, 113.2, 147.2, 181.2, 215.2, 249.2 mm**.

## Calibration procedure

1. Prepare a small spreadsheet with enough sample students to cover the first, middle, and last rows of the sheet.
2. Upload it to ExamLabel and leave X/Y offsets at `0.0 mm`.
3. Download one A4 PDF page.
4. Print the PDF on ordinary plain A4 paper using **Actual Size / 100%**. Disable Fit to Page and automatic scaling.
5. Put the printed plain sheet directly behind an unused ST-24 label sheet.
6. Hold both sheets against a bright light or window so the printed text and label boundaries are visible together.
7. Measure the horizontal and vertical mismatch in millimetres.
8. Enter compensating values in **X offset** and **Y offset**:
   - if text needs to move right, use a positive X value;
   - if text needs to move left, use a negative X value;
   - if text needs to move down, use a positive Y value;
   - if text needs to move up, use a negative Y value.
9. Generate and print another plain-paper test.
10. Repeat until text falls safely inside labels in the top, middle, and bottom rows.
11. Record the successful X/Y values for that specific printer. V1 does not save printer profiles automatically.

## Example

If the whole print is approximately **1.0 mm left** and **0.5 mm too high**, try:

```text
X offset: +1.0 mm
Y offset: +0.5 mm
```

Do not change the label width, height, or gap just to correct a whole-page shift. Use X/Y offsets for registration changes.
