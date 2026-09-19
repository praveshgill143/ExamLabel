"use client";

import Link from "next/link";

import { useEffect, useMemo, useState } from "react";
import { getAllSlotPositions, type Calibration } from "@/domain/geometry";
import { paginateStudents, type LabelFillOrder } from "@/domain/pagination";
import { generateLabelPdf } from "@/domain/pdf";
import { loadLabelTextStyle, saveLabelTextStyle, type LabelTextStyle } from "@/domain/text-style";
import {
  parseWorkbookBytes,
  type ParseResult,
} from "@/domain/spreadsheet";
import { ControlsPanel } from "./ControlsPanel";
import { SheetPreview } from "./SheetPreview";
import { StudentTable } from "./StudentTable";
import { UploadPanel } from "./UploadPanel";

const EMPTY_RESULT: ParseResult = { students: [], issues: [], errors: [] };

export type ExamLabelAppProps = {
  parseWorkbook?: typeof parseWorkbookBytes;
  generatePdf?: typeof generateLabelPdf;
};

export function ExamLabelApp({
  parseWorkbook = parseWorkbookBytes,
  generatePdf = generateLabelPdf,
}: ExamLabelAppProps) {
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<ParseResult>(EMPTY_RESULT);
  const [hasLoadedFile, setHasLoadedFile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const [startSlot, setStartSlot] = useState(1);
  const [calibration, setCalibration] = useState<Calibration>({ xMm: 0, yMm: 0 });
  const [fillOrder, setFillOrder] = useState<LabelFillOrder>("across-rows");
  const [textStyle, setTextStyle] = useState<LabelTextStyle>(() => loadLabelTextStyle());
  const [activePageIndex, setActivePageIndex] = useState(0);

  const pages = useMemo(
    () => paginateStudents(result.students, startSlot, calibration, fillOrder),
    [result.students, startSlot, calibration, fillOrder],
  );
  const slotPositions = useMemo(() => getAllSlotPositions(calibration), [calibration]);
  const safePageIndex = Math.min(activePageIndex, Math.max(0, pages.length - 1));
  const activePage = pages[safePageIndex];

  useEffect(() => {
    saveLabelTextStyle(textStyle);
  }, [textStyle]);

  useEffect(() => {
    setActivePageIndex(0);
  }, [result.students, startSlot, calibration.xMm, calibration.yMm, fillOrder]);

  async function createPdfBlob(): Promise<Blob> {
    const bytes = await generatePdf(pages, textStyle);
    return new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
  }

  async function handleFileSelected(file: File | null) {
    if (!file) return;
    setIsLoading(true);
    setDownloadError("");
    setFileName(file.name);
    setHasLoadedFile(true);

    try {
      const bytes = await file.arrayBuffer();
      const parsed = await parseWorkbook(bytes, file.name);
      setResult(parsed);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown file error";
      setResult({ students: [], issues: [], errors: [`Could not read spreadsheet: ${message}`] });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDownloadPdf() {
    if (pages.length === 0) return;
    setIsGenerating(true);
    setDownloadError("");

    try {
      const blob = await createPdfBlob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "exam-labels.pdf";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown PDF error";
      setDownloadError(`Could not generate PDF: ${message}`);
    } finally {
      setIsGenerating(false);
    }
  }

  const validCount = result.students.length;

  return (
    <main className="app-shell">
      <header className="hero">
        <div className="hero-brand-row">
          <Link className="hero-brand" href="/" aria-label="ExamLabel home">ExamLabel</Link>
          <span className="hero-brand-context">For schools and examination teams</span>
        </div>
        <div className="hero-main">
          <div>
            <p className="eyebrow">Online exam label generator for schools & institutions</p>
            <h1>Online Exam Label Generator</h1>
            <p className="hero-copy">
              Create professional, print-ready exam labels from Excel or CSV in seconds.
            </p>
            <p className="hero-supporting">
              Designed for CBSE, ICSE, state-board and international schools, colleges, examination centres and institutes.
            </p>
            <a className="hero-cta" href="#label-tool">Upload Excel or CSV</a>
          </div>
          <div className="hero-specs" aria-label="Supported label format">
            <span>A4</span>
            <span>24 labels</span>
            <span>3 &times; 8 layout</span>
            <span>ST-24 supported</span>
          </div>
        </div>
      </header>

      <div className="workflow-grid" id="label-tool">
        <div className="workflow-column">
          <UploadPanel
            fileName={fileName}
            isLoading={isLoading}
            onFileSelected={handleFileSelected}
          />

          <ControlsPanel
            startSlot={startSlot}
            calibration={calibration}
            fillOrder={fillOrder}
            textStyle={textStyle}
            disabled={validCount === 0}
            onStartSlotChange={setStartSlot}
            onCalibrationChange={setCalibration}
            onFillOrderChange={setFillOrder}
            onTextStyleChange={setTextStyle}
          />

          {hasLoadedFile ? (
            <section className="card status-card">
              <div className="status-summary">
                <strong>
                  {validCount} valid {validCount === 1 ? "student" : "students"}
                </strong>
                <span>
                  {pages.length} PDF {pages.length === 1 ? "page" : "pages"}
                </span>
              </div>

              {result.errors.length > 0 ? (
                <div className="error-box" role="alert">
                  {result.errors.map((error) => (
                    <p key={error}>{error}</p>
                  ))}
                </div>
              ) : null}

              {downloadError ? <div className="error-box">{downloadError}</div> : null}

              <div className="action-row action-row--download-only">
              <button
                className="primary-button"
                type="button"
                disabled={pages.length === 0 || isGenerating}
                onClick={handleDownloadPdf}
              >
                {isGenerating ? "Generating PDF..." : "Download PDF"}
              </button>
              </div>

              <p className="print-warning">
                Print at <strong>A4, 100% / Actual Size</strong>. Disable Fit or Shrink.
              </p>
            </section>
          ) : (
            <div className="action-row action-row--download-only action-row--standalone">
              <button className="primary-button" type="button" disabled>
                Download PDF
              </button>
            </div>
          )}
        </div>

        <div className="preview-column">
          <SheetPreview page={activePage} slotPositions={slotPositions} textStyle={textStyle} />

          {pages.length > 1 ? (
            <div className="page-nav" aria-label="Preview page navigation">
              <button
                type="button"
                disabled={safePageIndex === 0}
                onClick={() => setActivePageIndex((index) => Math.max(0, index - 1))}
              >
                Previous
              </button>
              <span>
                Page {safePageIndex + 1} of {pages.length}
              </span>
              <button
                type="button"
                disabled={safePageIndex >= pages.length - 1}
                onClick={() =>
                  setActivePageIndex((index) => Math.min(pages.length - 1, index + 1))
                }
              >
                Next
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <StudentTable students={result.students} issues={result.issues} />
    </main>
  );
}
