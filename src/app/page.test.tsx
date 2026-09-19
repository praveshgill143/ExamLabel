import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "./page";

describe("homepage positioning", () => {
  it("presents ExamLabel as an online exam label generator for education teams", () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { name: "Online Exam Label Generator" })).toBeInTheDocument();
    expect(screen.getByText("Create professional, print-ready exam labels from Excel or CSV in seconds.")).toBeInTheDocument();
    expect(screen.getByText("Designed for CBSE, ICSE, state-board and international schools, colleges, examination centres and institutes.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "How it works" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Built for schools and examination teams worldwide" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Frequently asked questions" })).toBeInTheDocument();
  });
});
