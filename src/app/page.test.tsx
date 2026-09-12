import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "./page";

describe("app shell", () => {
  it("renders the Exam Label Generator heading", () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { name: "Exam Label Generator" })).toBeInTheDocument();
  });
});
