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
        <h2>Upload student Excel sheet</h2>
        <p className="muted">The first row defines 1 to 5 label fields. Blank headings are ignored.</p>
      </div>

      <label className="upload-zone">
        <span className="upload-zone__title">{isLoading ? "Reading spreadsheet…" : "Choose Excel or CSV file"}</span>
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
