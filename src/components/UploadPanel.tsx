export type UploadPanelProps = {
  fileName: string;
  isLoading: boolean;
  onFileSelected: (file: File | null) => void;
};

export function UploadPanel({ fileName, isLoading, onFileSelected }: UploadPanelProps) {
  return (
    <section className="card upload-card">
      <div>
        <p className="eyebrow">Step 1</p>
        <h2>Upload examination data</h2>
        <p className="muted">Your first row becomes the label headings. Blank headings are ignored.</p>
      </div>

      <label className="upload-zone">
        <span className="upload-zone__title">{isLoading ? "Reading spreadsheet..." : "Upload Excel or CSV"}</span>
        <span className="upload-zone__hint">.xlsx, .xls or .csv</span>
        <input
          aria-label="Student spreadsheet"
          type="file"
          accept=".xlsx,.xls,.csv"
          disabled={isLoading}
          onChange={(event) => onFileSelected(event.target.files?.[0] ?? null)}
        />
      </label>

      {fileName ? <p className="selected-file">Selected: {fileName}</p> : null}
    </section>
  );
}


