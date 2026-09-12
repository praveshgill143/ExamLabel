import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getAllSlotPositions } from "@/domain/geometry";
import { paginateStudents } from "@/domain/pagination";
import { makeStudents } from "@/test/fixtures";
import { SheetPreview } from "./SheetPreview";

describe("SheetPreview", () => {
  it("renders labels using the supplied physical position", () => {
    const pages = paginateStudents(makeStudents(2), 1);
    render(
      <SheetPreview
        page={pages[0]}
        slotPositions={getAllSlotPositions()}
      />,
    );

    expect(screen.getByText("Student Name: STUDENT 1")).toBeInTheDocument();
    expect(screen.getByText("Student Name: STUDENT 2")).toBeInTheDocument();

    const firstLabel = screen.getByTestId("placed-label-1");
    expect(firstLabel).toHaveStyle({
      left: `${(5.8 / 210) * 100}%`,
      top: `${(11.2 / 297) * 100}%`,
    });
  });

  it("shows the full 24-slot guide even when slots are blank", () => {
    const pages = paginateStudents(makeStudents(1), 6);
    render(
      <SheetPreview
        page={pages[0]}
        slotPositions={getAllSlotPositions()}
      />,
    );

    expect(screen.getAllByTestId(/slot-guide-/)).toHaveLength(24);
  });
});
