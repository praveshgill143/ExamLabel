import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ParseResult } from "@/domain/spreadsheet";
import { makeStudents } from "@/test/fixtures";
import { ExamLabelApp } from "./ExamLabelApp";

beforeEach(() => localStorage.clear());

function validResult(count = 2): ParseResult {
  return { students: makeStudents(count), issues: [], errors: [] };
}

function makeUploadFile(name = "students.xlsx") {
  const file = new File(["test"], name, {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  Object.defineProperty(file, "arrayBuffer", {
    value: async () => new ArrayBuffer(8),
  });
  return file;
}

describe("ExamLabelApp", () => {
  it("starts with upload available and PDF disabled", () => {
    render(<ExamLabelApp />);
    expect(screen.getByLabelText("Student spreadsheet")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Download PDF" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Print Labels" })).toBeDisabled();
  });

  it("uploads data and uses the selected start label", async () => {
    const user = userEvent.setup();
    const parser = vi.fn().mockResolvedValue(validResult(2));
    render(<ExamLabelApp parseWorkbook={parser} />);

    await user.upload(screen.getByLabelText("Student spreadsheet"), makeUploadFile());
    expect(await screen.findByText("2 valid students")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Start from label"), { target: { value: "6" } });
    await waitFor(() => expect(screen.getByTestId("placed-label-6")).toBeInTheDocument());
    expect(screen.queryByTestId("placed-label-1")).not.toBeInTheDocument();
  });

  it("defaults to Across Rows and updates the preview when Down Columns is selected", async () => {
    const user = userEvent.setup();
    const parser = vi.fn().mockResolvedValue(validResult(10));
    render(<ExamLabelApp parseWorkbook={parser} />);

    await user.upload(screen.getByLabelText("Student spreadsheet"), makeUploadFile());
    await screen.findByText("10 valid students");
    expect(screen.getByTestId("placed-label-2")).toHaveTextContent("Student Name: STUDENT 2");

    await user.selectOptions(screen.getByLabelText("Label Fill Order"), "down-columns");
    expect(screen.getByTestId("placed-label-2")).toHaveTextContent("Student Name: STUDENT 9");
    expect(screen.getByTestId("placed-label-4")).toHaveTextContent("Student Name: STUDENT 2");
  });

  it("updates all label text controls live and passes the same style to PDF", async () => {
    const user = userEvent.setup();
    const parser = vi.fn().mockResolvedValue(validResult(1));
    const generatePdf = vi.fn().mockResolvedValue(new Uint8Array([37, 80, 68, 70]));
    const createObjectURL = vi.fn().mockReturnValue("blob:exam-labels");
    Object.defineProperty(URL, "createObjectURL", { value: createObjectURL, configurable: true });
    Object.defineProperty(URL, "revokeObjectURL", { value: vi.fn(), configurable: true });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(<ExamLabelApp parseWorkbook={parser} generatePdf={generatePdf} />);
    await user.upload(screen.getByLabelText("Student spreadsheet"), makeUploadFile());
    await screen.findByText("1 valid student");

    expect(screen.getByTestId("placed-label-lines-1")).toHaveStyle({ fontSize: "8.5pt", color: "rgb(0, 0, 0)", fontWeight: "400" });
    await user.click(screen.getByRole("button", { name: "Increase label font size" }));
    await user.click(screen.getByLabelText("Label font color"));
    fireEvent.change(screen.getByLabelText("Label font color"), { target: { value: "#ff0000" } });
    await user.click(screen.getByLabelText("Bold"));

    expect(screen.getByTestId("placed-label-lines-1")).toHaveStyle({ fontSize: "9.5pt", color: "rgb(255, 0, 0)", fontWeight: "700" });
    await user.click(screen.getByRole("button", { name: "Download PDF" }));
    await waitFor(() => expect(generatePdf).toHaveBeenCalledTimes(1));
    expect(generatePdf.mock.calls[0][1]).toEqual({ fontSizePt: 9.5, fontColor: "#FF0000", bold: true });
  });

  it("applies the text style to labels in Down Columns mode", async () => {
    const user = userEvent.setup();
    const parser = vi.fn().mockResolvedValue(validResult(10));
    render(<ExamLabelApp parseWorkbook={parser} />);
    await user.upload(screen.getByLabelText("Student spreadsheet"), makeUploadFile());
    await screen.findByText("10 valid students");
    await user.selectOptions(screen.getByLabelText("Label Fill Order"), "down-columns");
    await user.click(screen.getByLabelText("Bold"));

    expect(screen.getByTestId("placed-label-lines-2")).toHaveStyle({ fontWeight: "700" });
    expect(screen.getByTestId("placed-label-2")).toHaveTextContent("Student Name: STUDENT 9");
  });

  it("restores persisted text settings after remount", async () => {
    const user = userEvent.setup();
    const parser = vi.fn().mockResolvedValue(validResult(1));
    const { unmount } = render(<ExamLabelApp parseWorkbook={parser} />);
    await user.upload(screen.getByLabelText("Student spreadsheet"), makeUploadFile());
    await screen.findByText("1 valid student");
    await user.click(screen.getByRole("button", { name: "Increase label font size" }));
    await user.click(screen.getByLabelText("Bold"));
    fireEvent.change(screen.getByLabelText("Label font color"), { target: { value: "#0000ff" } });
    unmount();

    render(<ExamLabelApp parseWorkbook={parser} />);
    expect(screen.getByLabelText("Label font size")).toHaveTextContent("9.5 pt");
    expect(screen.getByLabelText("Bold")).toBeChecked();
    expect(screen.getByLabelText("Label font color")).toHaveValue("#0000ff");
  });

  it("applies X and Y calibration to the preview", async () => {
    const user = userEvent.setup();
    const parser = vi.fn().mockResolvedValue(validResult(1));
    render(<ExamLabelApp parseWorkbook={parser} />);
    await user.upload(screen.getByLabelText("Student spreadsheet"), makeUploadFile());
    await screen.findByText("1 valid student");

    fireEvent.change(screen.getByLabelText("X offset (mm)"), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText("Y offset (mm)"), { target: { value: "2" } });

    await waitFor(() => {
      const label = screen.getByTestId("placed-label-1");
      expect(label).toHaveStyle({
        left: `${(6.8 / 210) * 100}%`,
        top: `${(13.2 / 297) * 100}%`,
      });
    });
  });

  it("shows parser errors and incomplete-row issues", async () => {
    const user = userEvent.setup();
    const parser = vi.fn().mockResolvedValue({
      students: makeStudents(1),
      errors: ["Missing required column: Room NO."],
      issues: [{ sourceRow: 4, missingFields: ["Student Name"] }],
    } satisfies ParseResult);
    render(<ExamLabelApp parseWorkbook={parser} />);

    await user.upload(screen.getByLabelText("Student spreadsheet"), makeUploadFile());
    expect(await screen.findByText("Missing required column: Room NO.")).toBeInTheDocument();
    expect(screen.getByText(/Row 4/)).toHaveTextContent("Student Name");
  });

  it("downloads the generated PDF", async () => {
    const user = userEvent.setup();
    const parser = vi.fn().mockResolvedValue(validResult(1));
    const generatePdf = vi.fn().mockResolvedValue(new Uint8Array([37, 80, 68, 70]));
    const createObjectURL = vi.fn().mockReturnValue("blob:exam-labels");
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, "createObjectURL", { value: createObjectURL, configurable: true });
    Object.defineProperty(URL, "revokeObjectURL", { value: revokeObjectURL, configurable: true });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(<ExamLabelApp parseWorkbook={parser} generatePdf={generatePdf} />);
    await user.upload(screen.getByLabelText("Student spreadsheet"), makeUploadFile());
    await screen.findByText("1 valid student");
    await user.click(screen.getByRole("button", { name: "Download PDF" }));

    await waitFor(() => expect(generatePdf).toHaveBeenCalledTimes(1));
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:exam-labels");
    clickSpy.mockRestore();
  });

  it("renders the print note and opens the generated PDF for printing", async () => {
    const user = userEvent.setup();
    const parser = vi.fn().mockResolvedValue(validResult(1));
    const generatePdf = vi.fn().mockResolvedValue(new Uint8Array([37, 80, 68, 70]));
    const createObjectURL = vi.fn().mockReturnValue("blob:exam-labels");
    const revokeObjectURL = vi.fn();
    const loadHandlers: EventListener[] = [];
    const printWindow = {
      addEventListener: vi.fn((_type: string, handler: EventListener) => loadHandlers.push(handler)),
      location: { href: "" },
      print: vi.fn(),
    };
    Object.defineProperty(URL, "createObjectURL", { value: createObjectURL, configurable: true });
    Object.defineProperty(URL, "revokeObjectURL", { value: revokeObjectURL, configurable: true });
    const openSpy = vi.spyOn(window, "open").mockReturnValue(printWindow as unknown as Window);

    render(<ExamLabelApp parseWorkbook={parser} generatePdf={generatePdf} />);
    await user.upload(screen.getByLabelText("Student spreadsheet"), makeUploadFile());
    await screen.findByText("1 valid student");

    expect(screen.getByText(/A4, 100% \/ Actual Size/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Print Labels" }));

    await waitFor(() => expect(generatePdf).toHaveBeenCalledTimes(1));
    expect(openSpy).toHaveBeenCalledWith("", "_blank", "noopener,noreferrer");
    expect(printWindow.location.href).toBe("blob:exam-labels");
    expect(printWindow.print).not.toHaveBeenCalled();

    loadHandlers[0](new Event("load"));
    expect(printWindow.print).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:exam-labels");
    openSpy.mockRestore();
  });

  it("opens the print window before asynchronous PDF generation resolves", async () => {
    const user = userEvent.setup();
    const parser = vi.fn().mockResolvedValue(validResult(1));
    let resolvePdf!: (bytes: Uint8Array) => void;
    const generatePdf = vi.fn().mockImplementation(
      () => new Promise<Uint8Array>((resolve) => { resolvePdf = resolve; }),
    );
    const printWindow = {
      addEventListener: vi.fn(),
      location: { href: "" },
      print: vi.fn(),
      close: vi.fn(),
    };
    const openSpy = vi.spyOn(window, "open").mockReturnValue(printWindow as unknown as Window);
    const createObjectURL = vi.fn().mockReturnValue("blob:exam-labels");
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, "createObjectURL", { value: createObjectURL, configurable: true });
    Object.defineProperty(URL, "revokeObjectURL", { value: revokeObjectURL, configurable: true });

    render(<ExamLabelApp parseWorkbook={parser} generatePdf={generatePdf} />);
    await user.upload(screen.getByLabelText("Student spreadsheet"), makeUploadFile());
    await screen.findByText("1 valid student");

    const clickPromise = user.click(screen.getByRole("button", { name: "Print Labels" }));
    await waitFor(() => expect(openSpy).toHaveBeenCalledTimes(1));
    expect(generatePdf).toHaveBeenCalledTimes(1);

    resolvePdf(new Uint8Array([37, 80, 68, 70]));
    await clickPromise;
    openSpy.mockRestore();
  });

  it("reports a blocked print window after successful PDF generation", async () => {
    const user = userEvent.setup();
    const parser = vi.fn().mockResolvedValue(validResult(1));
    const generatePdf = vi.fn().mockResolvedValue(new Uint8Array([37, 80, 68, 70]));
    const createObjectURL = vi.fn().mockReturnValue("blob:exam-labels");
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, "createObjectURL", { value: createObjectURL, configurable: true });
    Object.defineProperty(URL, "revokeObjectURL", { value: revokeObjectURL, configurable: true });
    const openSpy = vi.spyOn(window, "open").mockReturnValue(null);

    render(<ExamLabelApp parseWorkbook={parser} generatePdf={generatePdf} />);
    await user.upload(screen.getByLabelText("Student spreadsheet"), makeUploadFile());
    await screen.findByText("1 valid student");
    await user.click(screen.getByRole("button", { name: "Print Labels" }));

    expect(await screen.findByText("Print window was blocked. Please allow pop-ups and try again.")).toBeInTheDocument();
    expect(generatePdf).not.toHaveBeenCalled();
    expect(revokeObjectURL).not.toHaveBeenCalled();
    openSpy.mockRestore();
  });

  it("opens a temporary print window before reporting PDF generation failure", async () => {
    const user = userEvent.setup();
    const parser = vi.fn().mockResolvedValue(validResult(1));
    const generatePdf = vi.fn().mockRejectedValue(new Error("PDF failed"));
    const printWindow = {
      addEventListener: vi.fn(),
      location: { href: "" },
      print: vi.fn(),
      close: vi.fn(),
    };
    const openSpy = vi.spyOn(window, "open").mockReturnValue(printWindow as unknown as Window);

    render(<ExamLabelApp parseWorkbook={parser} generatePdf={generatePdf} />);
    await user.upload(screen.getByLabelText("Student spreadsheet"), makeUploadFile());
    await screen.findByText("1 valid student");
    await user.click(screen.getByRole("button", { name: "Print Labels" }));

    expect(await screen.findByText("Could not generate PDF: PDF failed")).toBeInTheDocument();
    expect(openSpy).toHaveBeenCalledTimes(1);
    expect(printWindow.close).toHaveBeenCalledTimes(1);
    openSpy.mockRestore();
  });

  it("closes the temporary print window when PDF generation fails", async () => {
    const user = userEvent.setup();
    const parser = vi.fn().mockResolvedValue(validResult(1));
    const generatePdf = vi.fn().mockRejectedValue(new Error("PDF failed"));
    const printWindow = {
      addEventListener: vi.fn(),
      location: { href: "" },
      print: vi.fn(),
      close: vi.fn(),
    };
    const openSpy = vi.spyOn(window, "open").mockReturnValue(printWindow as unknown as Window);

    render(<ExamLabelApp parseWorkbook={parser} generatePdf={generatePdf} />);
    await user.upload(screen.getByLabelText("Student spreadsheet"), makeUploadFile());
    await screen.findByText("1 valid student");

    await user.click(screen.getByRole("button", { name: "Print Labels" }));

    expect(await screen.findByText("Could not generate PDF: PDF failed")).toBeInTheDocument();
    expect(printWindow.close).toHaveBeenCalledTimes(1);
    openSpy.mockRestore();
  });
});
