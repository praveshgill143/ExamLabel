import { describe, expect, it } from "vitest";
import { resolveCanonicalProjectRoot } from "./next-with-canonical-cwd.mjs";

describe("resolveCanonicalProjectRoot", () => {
  it("uses the filesystem's canonical casing for the repository root", () => {
    const realpath = (path: string) =>
      path.endsWith("\\scripts") ? "C:\\Projects\\ExamLabel\\scripts" : "C:\\Projects\\ExamLabel";

    expect(
      resolveCanonicalProjectRoot("C:\\projects\\examlabel\\scripts", realpath),
    ).toBe("C:\\Projects\\ExamLabel");
  });
});
