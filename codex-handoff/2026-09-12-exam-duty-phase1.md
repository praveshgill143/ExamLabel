# Exam Duty Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a protected Exam Duty shell, persistent local teacher/special-duty/rule database, and one-time Teacher Master import to the existing ExamLabel app without changing Exam Label generation behavior.

**Architecture:** Keep `/` as the existing Exam Label tool and add `/duty` as a separate feature route. Exam Duty lives under `src/features/exam-duty`, uses native IndexedDB in a dedicated `exam-duty-db`, and reuses the already-installed `xlsx` package only for one-time Teacher Master import. Existing Exam Label domain logic, ST-24 geometry, spreadsheet parsing, PDF generation, calibration, print flow, and tests are regression-protected and must not be refactored as part of this phase.

**Tech Stack:** Next.js 15.5.21, React 19.1.1, TypeScript 5.9.2, Vitest 3.2.4, Testing Library, native IndexedDB, SheetJS `xlsx` already present in the project, `fake-indexeddb` as a test-only dependency.

**Spec:** `docs/superpowers/specs/2026-09-12-exam-duty-module-design.md`

## Global Constraints

- Project path is `C:\Projects\ExamLabel`.
- Existing Exam Label behavior is a protected subsystem.
- Do not change A4/ST-24 geometry or label rendering to implement Exam Duty.
- Do not change existing Exam Label spreadsheet input rules, PDF output rules, print behavior, calibration behavior, or pagination behavior.
- Keep `/` as Exam Labels so existing bookmarks/workflow still work.
- Add Exam Duty at `/duty`.
- Browser-only; no backend, login, cloud database, or AI.
- Exam Duty uses a separate IndexedDB database named exactly `exam-duty-db`.
- Duty groups are fixed for MVP: `LKG-V`, `VI-VIII`, `IX-XII`.
- Fixed special-duty staff are not room invigilators.
- This phase does **not** generate exam duties yet. It establishes the safe shell and persistent setup data used by later phases.
- Before changing code, record the current `npm test`, `npm run lint`, and `npm run build` result. If the current branch has unrelated failures, do not silently fix them under this feature; report them before proceeding.
- Use TDD: failing test → minimal implementation → passing test → commit.
- Commit after every task.

---

## File Structure Locked by This Phase

Create these files:

```text
src/
  components/
    UtilityNav.tsx
    UtilityNav.test.tsx
  app/
    duty/
      page.tsx
      page.test.tsx
  features/
    exam-duty/
      types.ts
      domain/
        groups.ts
        groups.test.ts
        defaults.ts
      import/
        teacher-master.ts
        teacher-master.test.ts
      storage/
        db.ts
        db.test.ts
        repositories.ts
        repositories.test.ts
      components/
        ExamDutyApp.tsx
        DutyDashboard.tsx
        TeacherSetup.tsx
        TeacherSetup.test.tsx
        SpecialDutySetup.tsx
        DutyRulesSetup.tsx
```

Modify only these existing files unless Codex discovers the current local project already has a newer equivalent structure:

```text
package.json
src/app/page.tsx
src/app/globals.css
README.md
CODEX.md
```

If the current local project contains newer Exam Label files than the recovered V1 archive, preserve the current local versions and adapt this plan to them. In particular, do not overwrite any newer print-window/popup handling or later regression tests.

---

### Task 1: Baseline, isolated worktree, and regression checkpoint

**Files:**
- Read: `CODEX.md`
- Read: `package.json`
- Read: `src/app/page.tsx`
- Read: `src/components/ExamLabelApp.tsx`
- Read: `src/components/ExamLabelApp.test.tsx`
- Read: `src/domain/geometry.ts`
- Read: `src/domain/pdf.ts`
- Create at implementation time: git worktree for branch `feature/exam-duty-phase1`

**Interfaces:**
- Consumes: current working ExamLabel repository.
- Produces: isolated branch/worktree with a recorded green-or-known-failing baseline.

- [ ] **Step 1: Enter the current project and inspect status**

Run in PowerShell:

```powershell
Set-Location C:\Projects\ExamLabel
git status --short
git branch --show-current
git log -5 --oneline
```

Expected: know whether the working tree is clean and what current Label fixes are already present.

- [ ] **Step 2: Run the existing verification baseline without changing code**

```powershell
npm test
npm run lint
npm run build
```

Expected: all pass. If a command fails, save the exact output and stop this task. Do not alter ST-24 geometry or Label behavior to make unrelated tests pass.

- [ ] **Step 3: Create an isolated worktree using the Superpowers worktree workflow**

Use `superpowers:using-git-worktrees` in Codex. Target branch:

```text
feature/exam-duty-phase1
```

Recommended worktree path:

```text
C:\Projects\ExamLabel\.worktrees\exam-duty-phase1
```

- [ ] **Step 4: Re-run the baseline inside the worktree**

```powershell
npm install
npm test
npm run lint
npm run build
```

Expected: same result as the original project baseline.

- [ ] **Step 5: Commit nothing**

This task is a checkpoint. Start Task 2 only after the baseline is understood.

---

### Task 2: Add isolated top navigation and `/duty` route without touching Label internals

**Files:**
- Create: `src/components/UtilityNav.tsx`
- Create: `src/components/UtilityNav.test.tsx`
- Create: `src/app/duty/page.tsx`
- Create: `src/app/duty/page.test.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: existing `ExamLabelApp` default page.
- Produces: `UtilityNav({ active: "labels" | "duty" })` and a new `/duty` route that initially renders a placeholder shell.

- [ ] **Step 1: Write navigation tests first**

Create `src/components/UtilityNav.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { UtilityNav } from "./UtilityNav";

describe("UtilityNav", () => {
  it("links to the protected label tool and the duty tool", () => {
    render(<UtilityNav active="labels" />);

    expect(screen.getByRole("link", { name: "Exam Labels" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Exam Duty" })).toHaveAttribute("href", "/duty");
    expect(screen.getByRole("link", { name: "Exam Labels" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});
```

Create `src/app/duty/page.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import DutyPage from "./page";

describe("duty page shell", () => {
  it("renders the Exam Duty heading and keeps a link back to Exam Labels", () => {
    render(<DutyPage />);

    expect(screen.getByRole("heading", { name: "Exam Duty" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Exam Labels" })).toHaveAttribute("href", "/");
  });
});
```

- [ ] **Step 2: Run the new tests and verify they fail**

```powershell
npx vitest run src/components/UtilityNav.test.tsx src/app/duty/page.test.tsx
```

Expected: FAIL because `UtilityNav` and `/duty` page do not exist.

- [ ] **Step 3: Implement the minimal navigation**

Create `src/components/UtilityNav.tsx`:

```tsx
import Link from "next/link";

export type UtilityNavProps = {
  active: "labels" | "duty";
};

export function UtilityNav({ active }: UtilityNavProps) {
  return (
    <nav className="utility-nav" aria-label="School exam utilities">
      <Link href="/" aria-current={active === "labels" ? "page" : undefined}>
        Exam Labels
      </Link>
      <Link href="/duty" aria-current={active === "duty" ? "page" : undefined}>
        Exam Duty
      </Link>
    </nav>
  );
}
```

Modify `src/app/page.tsx` only as a wrapper around the existing app:

```tsx
import { ExamLabelApp } from "@/components/ExamLabelApp";
import { UtilityNav } from "@/components/UtilityNav";

export default function HomePage() {
  return (
    <>
      <UtilityNav active="labels" />
      <ExamLabelApp />
    </>
  );
}
```

Create temporary `src/app/duty/page.tsx`:

```tsx
import { UtilityNav } from "@/components/UtilityNav";

export default function DutyPage() {
  return (
    <main className="duty-shell">
      <UtilityNav active="duty" />
      <header className="duty-hero">
        <p className="eyebrow">School exam utility</p>
        <h1>Exam Duty</h1>
        <p>Teacher setup and duty generation will live here.</p>
      </header>
    </main>
  );
}
```

- [ ] **Step 4: Add CSS using new class names only**

Append to `src/app/globals.css`; do not modify Label geometry classes:

```css
.utility-nav {
  width: min(1480px, calc(100% - 32px));
  margin: 16px auto 0;
  display: flex;
  gap: 8px;
}

.utility-nav a {
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--card-bg);
  padding: 9px 14px;
  color: var(--text);
  font-weight: 800;
  text-decoration: none;
}

.utility-nav a[aria-current="page"] {
  border-color: var(--primary);
  background: var(--primary-soft);
  color: var(--primary-dark);
}

.duty-shell {
  width: min(1480px, calc(100% - 32px));
  margin: 0 auto;
  padding: 28px 0 56px;
}

.duty-hero {
  margin-bottom: 24px;
}

.duty-hero h1 {
  margin: 4px 0 0;
  font-size: clamp(30px, 4vw, 46px);
}
```

- [ ] **Step 5: Run navigation tests and the full Label tests**

```powershell
npx vitest run src/components/UtilityNav.test.tsx src/app/duty/page.test.tsx src/app/page.test.tsx
npm test
```

Expected: PASS. Existing Label component/domain tests remain unchanged.

- [ ] **Step 6: Commit**

```powershell
git add src/components/UtilityNav.tsx src/components/UtilityNav.test.tsx src/app/duty/page.tsx src/app/duty/page.test.tsx src/app/page.tsx src/app/globals.css
git commit -m "feat: add isolated exam duty route"
```

---

### Task 3: Define duty setup types, fixed groups, and current school defaults

**Files:**
- Create: `src/features/exam-duty/types.ts`
- Create: `src/features/exam-duty/domain/groups.ts`
- Create: `src/features/exam-duty/domain/groups.test.ts`
- Create: `src/features/exam-duty/domain/defaults.ts`

**Interfaces:**
- Produces:
  - `SchoolClass`
  - `DutyGroupId`
  - `Teacher`
  - `TeacherAssignment`
  - `SpecialDuty`
  - `DutySettings`
  - `normalizeSchoolClass(value: string): SchoolClass | null`
  - `deriveEligibleGroups(assignments: TeacherAssignment[]): DutyGroupId[]`
  - `DEFAULT_DUTY_SETTINGS`
  - `DEFAULT_SPECIAL_DUTIES`

- [ ] **Step 1: Write group tests first**

Create `src/features/exam-duty/domain/groups.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { TeacherAssignment } from "../types";
import { deriveEligibleGroups, normalizeSchoolClass } from "./groups";

function assignment(className: string): TeacherAssignment {
  return {
    id: `a-${className}`,
    teacherId: "t-1",
    className: normalizeSchoolClass(className)!,
    section: "A",
    subject: "Test",
  };
}

describe("exam duty groups", () => {
  it("normalizes numeric and roman class names", () => {
    expect(normalizeSchoolClass("3")).toBe("III");
    expect(normalizeSchoolClass("Class 8")).toBe("VIII");
    expect(normalizeSchoolClass("10#C")).toBe("X");
    expect(normalizeSchoolClass("LKG-A")).toBe("LKG");
    expect(normalizeSchoolClass("UKG")).toBe("UKG");
  });

  it("derives all groups a cross-band teacher actually teaches", () => {
    expect(
      deriveEligibleGroups([
        assignment("V"),
        assignment("VI"),
        assignment("IX"),
      ]),
    ).toEqual(["LKG-V", "VI-VIII", "IX-XII"]);
  });

  it("never adds a group not represented in assignments", () => {
    expect(deriveEligibleGroups([assignment("III"), assignment("V")])).toEqual(["LKG-V"]);
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

```powershell
npx vitest run src/features/exam-duty/domain/groups.test.ts
```

Expected: FAIL because types/functions do not exist.

- [ ] **Step 3: Create the domain types**

Create `src/features/exam-duty/types.ts`:

```ts
export const SCHOOL_CLASSES = [
  "LKG",
  "UKG",
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
] as const;

export type SchoolClass = (typeof SCHOOL_CLASSES)[number];
export type DutyGroupId = "LKG-V" | "VI-VIII" | "IX-XII";

export type Teacher = {
  id: string;
  name: string;
  alias: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TeacherAssignment = {
  id: string;
  teacherId: string;
  className: SchoolClass;
  section: string;
  subject: string;
};

export type SpecialDuty = {
  id: string;
  teacherId: string | null;
  staffName: string;
  alias: string;
  dutyType: "Paper Distribution/Collection";
  responsibility: string;
  roomRange: string;
  lockedFromRoomDuty: boolean;
  active: boolean;
};

export type DutyGroupRule = {
  id: DutyGroupId;
  preferredTeachersPerRoom: 1 | 2;
  minimumTeachersPerRoom: 1 | 2;
  shuffleDaily: boolean;
  allowCrossGroup: false;
};

export type DutySettings = {
  id: "default";
  schoolName: string;
  defaultSession: string;
  fixedLowerLocations: string[];
  avoidSameRoomConsecutiveDays: boolean;
  avoidSamePairConsecutiveDays: boolean;
  balanceTotalDuties: boolean;
  groups: Record<DutyGroupId, DutyGroupRule>;
};
```

- [ ] **Step 4: Implement class normalization and group derivation**

Create `src/features/exam-duty/domain/groups.ts`:

```ts
import type { DutyGroupId, SchoolClass, TeacherAssignment } from "../types";

const CLASS_ALIASES: Record<string, SchoolClass> = {
  LKG: "LKG",
  UKG: "UKG",
  "1": "I",
  I: "I",
  "2": "II",
  II: "II",
  "3": "III",
  III: "III",
  "4": "IV",
  IV: "IV",
  "5": "V",
  V: "V",
  "6": "VI",
  VI: "VI",
  "7": "VII",
  VII: "VII",
  "8": "VIII",
  VIII: "VIII",
  "9": "IX",
  IX: "IX",
  "10": "X",
  X: "X",
  "11": "XI",
  XI: "XI",
  "12": "XII",
  XII: "XII",
};

const GROUP_CLASSES: Record<DutyGroupId, ReadonlySet<SchoolClass>> = {
  "LKG-V": new Set(["LKG", "UKG", "I", "II", "III", "IV", "V"]),
  "VI-VIII": new Set(["VI", "VII", "VIII"]),
  "IX-XII": new Set(["IX", "X", "XI", "XII"]),
};

const GROUP_ORDER: DutyGroupId[] = ["LKG-V", "VI-VIII", "IX-XII"];

export function normalizeSchoolClass(value: string): SchoolClass | null {
  const token = value
    .trim()
    .toUpperCase()
    .replace(/^CLASS\s+/, "")
    .split(/[-#\s]/)[0];

  return CLASS_ALIASES[token] ?? null;
}

export function deriveEligibleGroups(assignments: TeacherAssignment[]): DutyGroupId[] {
  const classes = new Set(assignments.map((item) => item.className));
  return GROUP_ORDER.filter((group) =>
    [...classes].some((className) => GROUP_CLASSES[group].has(className)),
  );
}
```

- [ ] **Step 5: Add school defaults**

Create `src/features/exam-duty/domain/defaults.ts` with these exact defaults:

```ts
import type { DutySettings, SpecialDuty } from "../types";

export const DEFAULT_DUTY_SETTINGS: DutySettings = {
  id: "default",
  schoolName: "Little Flower School-GIDA, Gorakhpur",
  defaultSession: "2026-27",
  fixedLowerLocations: [
    "LKG-A",
    "UKG-A",
    "UKG-B",
    "I-A",
    "I-B",
    "II-A",
    "II-B",
    "II-C",
  ],
  avoidSameRoomConsecutiveDays: true,
  avoidSamePairConsecutiveDays: true,
  balanceTotalDuties: true,
  groups: {
    "LKG-V": {
      id: "LKG-V",
      preferredTeachersPerRoom: 2,
      minimumTeachersPerRoom: 1,
      shuffleDaily: true,
      allowCrossGroup: false,
    },
    "VI-VIII": {
      id: "VI-VIII",
      preferredTeachersPerRoom: 2,
      minimumTeachersPerRoom: 1,
      shuffleDaily: true,
      allowCrossGroup: false,
    },
    "IX-XII": {
      id: "IX-XII",
      preferredTeachersPerRoom: 2,
      minimumTeachersPerRoom: 1,
      shuffleDaily: true,
      allowCrossGroup: false,
    },
  },
};

export const DEFAULT_SPECIAL_DUTIES: SpecialDuty[] = [
  ["SR SINI", "SR SINI", "LKG-UKG-I", "LKG-UKG-I"],
  ["SR CARMEL", "SR CARMEL", "II", "II"],
  ["MOHD HAROON", "HAROON", "III", "Rooms 1-11"],
  ["KHUSBOO", "KHUSBOO", "III Block", "Rooms 1-11"],
  ["USHA RANI", "USHA", "IV", "Rooms 1-11"],
  ["ASHISH RAI", "ASHISH", "V", "Rooms 1-11"],
  ["SUSHIL CHAUDHARY", "SUSHIL", "VI", "Rooms 12-24"],
  ["SUNIL KUMAR", "SUNIL", "VII", "Rooms 12-24"],
  ["NICODIM NARZARY", "NICODIM", "VIII Block", "Rooms 12-24"],
  ["VISHNU SWAROOP", "VISHNU", "VIII", "Rooms 12-24"],
  ["RAJ GAURAV", "RAJ", "IX-X", "Rooms 25-33"],
  ["SHATRUGHAN KUMAR TIWARI", "SHATRUGHAN", "XI-XII", "Rooms 34-40"],
  ["KULANDAI YESU", "K. YESU", "X", "Rooms 25-33"],
  ["BINOY EK", "BINOY", "XII", "Rooms 34-40"],
].map(([staffName, alias, responsibility, roomRange]) => ({
  id: `default-${alias.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
  teacherId: null,
  staffName,
  alias,
  dutyType: "Paper Distribution/Collection" as const,
  responsibility,
  roomRange,
  lockedFromRoomDuty: true,
  active: true,
}));
```

- [ ] **Step 6: Run group tests**

```powershell
npx vitest run src/features/exam-duty/domain/groups.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add src/features/exam-duty/types.ts src/features/exam-duty/domain
git commit -m "feat: define exam duty setup domain"
```

---

### Task 4: Add dedicated IndexedDB schema and repositories

**Files:**
- Modify: `package.json`
- Create: `src/features/exam-duty/storage/db.ts`
- Create: `src/features/exam-duty/storage/db.test.ts`
- Create: `src/features/exam-duty/storage/repositories.ts`
- Create: `src/features/exam-duty/storage/repositories.test.ts`

**Interfaces:**
- Produces:
  - `EXAM_DUTY_DB_NAME = "exam-duty-db"`
  - `openExamDutyDb(): Promise<IDBDatabase>`
  - `resetExamDutyDbForTests(): Promise<void>`
  - `listTeachers(): Promise<Teacher[]>`
  - `upsertTeacher(input: Omit<Teacher, "createdAt" | "updatedAt"> & Partial<Pick<Teacher, "createdAt" | "updatedAt">>): Promise<Teacher>`
  - `replaceTeacherAssignments(teacherId: string, assignments: TeacherAssignment[]): Promise<void>`
  - `listTeacherAssignments(teacherId?: string): Promise<TeacherAssignment[]>`
  - `listSpecialDuties(): Promise<SpecialDuty[]>`
  - `replaceSpecialDuties(items: SpecialDuty[]): Promise<void>`
  - `getDutySettings(): Promise<DutySettings>`
  - `saveDutySettings(settings: DutySettings): Promise<void>`
  - `seedDutyDefaults(): Promise<void>`

- [ ] **Step 1: Add test-only IndexedDB dependency**

Run:

```powershell
npm install --save-dev fake-indexeddb
```

Do not add a runtime IndexedDB wrapper dependency.

- [ ] **Step 2: Write the database schema test first**

Create `src/features/exam-duty/storage/db.test.ts`:

```ts
import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import { EXAM_DUTY_DB_NAME, openExamDutyDb, resetExamDutyDbForTests } from "./db";

afterEach(async () => {
  await resetExamDutyDbForTests();
});

describe("exam duty IndexedDB", () => {
  it("uses a database isolated from Exam Labels and creates all planned stores", async () => {
    expect(EXAM_DUTY_DB_NAME).toBe("exam-duty-db");

    const db = await openExamDutyDb();
    expect([...db.objectStoreNames]).toEqual(
      expect.arrayContaining([
        "teachers",
        "teacherAssignments",
        "specialDuties",
        "dutySettings",
        "exams",
        "seatingRows",
        "timetableRows",
        "teacherUnavailability",
        "generatedDuties",
      ]),
    );
    db.close();
  });
});
```

- [ ] **Step 3: Run the database test and verify it fails**

```powershell
npx vitest run src/features/exam-duty/storage/db.test.ts
```

Expected: FAIL because `db.ts` does not exist.

- [ ] **Step 4: Implement native IndexedDB open/reset helpers**

Create `src/features/exam-duty/storage/db.ts`:

```ts
export const EXAM_DUTY_DB_NAME = "exam-duty-db";
export const EXAM_DUTY_DB_VERSION = 1;

export const DUTY_STORES = {
  teachers: "teachers",
  teacherAssignments: "teacherAssignments",
  specialDuties: "specialDuties",
  dutySettings: "dutySettings",
  exams: "exams",
  seatingRows: "seatingRows",
  timetableRows: "timetableRows",
  teacherUnavailability: "teacherUnavailability",
  generatedDuties: "generatedDuties",
} as const;

export function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

export function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB transaction failed"));
    transaction.onabort = () => reject(transaction.error ?? new Error("IndexedDB transaction aborted"));
  });
}

export function openExamDutyDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(EXAM_DUTY_DB_NAME, EXAM_DUTY_DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(DUTY_STORES.teachers)) {
        db.createObjectStore(DUTY_STORES.teachers, { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains(DUTY_STORES.teacherAssignments)) {
        const store = db.createObjectStore(DUTY_STORES.teacherAssignments, { keyPath: "id" });
        store.createIndex("teacherId", "teacherId", { unique: false });
      }

      if (!db.objectStoreNames.contains(DUTY_STORES.specialDuties)) {
        db.createObjectStore(DUTY_STORES.specialDuties, { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains(DUTY_STORES.dutySettings)) {
        db.createObjectStore(DUTY_STORES.dutySettings, { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains(DUTY_STORES.exams)) {
        db.createObjectStore(DUTY_STORES.exams, { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains(DUTY_STORES.seatingRows)) {
        const store = db.createObjectStore(DUTY_STORES.seatingRows, { keyPath: "id" });
        store.createIndex("examId", "examId", { unique: false });
      }

      if (!db.objectStoreNames.contains(DUTY_STORES.timetableRows)) {
        const store = db.createObjectStore(DUTY_STORES.timetableRows, { keyPath: "id" });
        store.createIndex("examId", "examId", { unique: false });
      }

      if (!db.objectStoreNames.contains(DUTY_STORES.teacherUnavailability)) {
        const store = db.createObjectStore(DUTY_STORES.teacherUnavailability, { keyPath: "id" });
        store.createIndex("examId", "examId", { unique: false });
      }

      if (!db.objectStoreNames.contains(DUTY_STORES.generatedDuties)) {
        const store = db.createObjectStore(DUTY_STORES.generatedDuties, { keyPath: "id" });
        store.createIndex("examId", "examId", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open Exam Duty database"));
  });
}

export function resetExamDutyDbForTests(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(EXAM_DUTY_DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error ?? new Error("Could not delete Exam Duty database"));
    request.onblocked = () => reject(new Error("Exam Duty database deletion was blocked"));
  });
}
```

- [ ] **Step 5: Run the database test**

```powershell
npx vitest run src/features/exam-duty/storage/db.test.ts
```

Expected: PASS.

- [ ] **Step 6: Write repository persistence tests**

Create `src/features/exam-duty/storage/repositories.test.ts`:

```ts
import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import type { TeacherAssignment } from "../types";
import { resetExamDutyDbForTests } from "./db";
import {
  getDutySettings,
  listSpecialDuties,
  listTeacherAssignments,
  listTeachers,
  replaceTeacherAssignments,
  seedDutyDefaults,
  upsertTeacher,
} from "./repositories";

afterEach(async () => {
  await resetExamDutyDbForTests();
});

describe("exam duty repositories", () => {
  it("persists teachers and their assignments", async () => {
    const teacher = await upsertTeacher({
      id: "teacher-abha",
      name: "ABHA MASIH",
      alias: "ABHA MASIH",
      active: true,
    });

    const assignments: TeacherAssignment[] = [
      {
        id: "assignment-abha-iii-b-science",
        teacherId: teacher.id,
        className: "III",
        section: "B",
        subject: "Science",
      },
    ];

    await replaceTeacherAssignments(teacher.id, assignments);

    expect(await listTeachers()).toHaveLength(1);
    expect(await listTeacherAssignments(teacher.id)).toEqual(assignments);
  });

  it("seeds school defaults only when stores are empty", async () => {
    await seedDutyDefaults();
    const firstDuties = await listSpecialDuties();
    const firstSettings = await getDutySettings();

    await seedDutyDefaults();

    expect(firstDuties).toHaveLength(14);
    expect(await listSpecialDuties()).toHaveLength(14);
    expect(firstSettings.fixedLowerLocations).toEqual([
      "LKG-A",
      "UKG-A",
      "UKG-B",
      "I-A",
      "I-B",
      "II-A",
      "II-B",
      "II-C",
    ]);
  });
});
```

- [ ] **Step 7: Implement repositories**

Create `src/features/exam-duty/storage/repositories.ts`. Use these helper signatures exactly:

```ts
import { DEFAULT_DUTY_SETTINGS, DEFAULT_SPECIAL_DUTIES } from "../domain/defaults";
import type { DutySettings, SpecialDuty, Teacher, TeacherAssignment } from "../types";
import { DUTY_STORES, openExamDutyDb, requestToPromise, transactionDone } from "./db";

function nowIso() {
  return new Date().toISOString();
}

export async function listTeachers(): Promise<Teacher[]> {
  const db = await openExamDutyDb();
  try {
    const tx = db.transaction(DUTY_STORES.teachers, "readonly");
    const items = await requestToPromise(tx.objectStore(DUTY_STORES.teachers).getAll());
    await transactionDone(tx);
    return (items as Teacher[]).sort((a, b) => a.name.localeCompare(b.name));
  } finally {
    db.close();
  }
}

export async function upsertTeacher(
  input: Omit<Teacher, "createdAt" | "updatedAt"> &
    Partial<Pick<Teacher, "createdAt" | "updatedAt">>,
): Promise<Teacher> {
  const timestamp = nowIso();
  const teacher: Teacher = {
    ...input,
    createdAt: input.createdAt ?? timestamp,
    updatedAt: timestamp,
  };

  const db = await openExamDutyDb();
  try {
    const tx = db.transaction(DUTY_STORES.teachers, "readwrite");
    tx.objectStore(DUTY_STORES.teachers).put(teacher);
    await transactionDone(tx);
    return teacher;
  } finally {
    db.close();
  }
}
```

Implement the remaining exported functions using the same pattern. `replaceTeacherAssignments` must delete only assignments belonging to that teacher and then insert the supplied rows in the same readwrite transaction. `replaceSpecialDuties` must clear only the `specialDuties` store and replace its rows. `seedDutyDefaults` must create the 14 special duties only if `listSpecialDuties()` is empty and save settings only if no `default` record exists.

- [ ] **Step 8: Run repository tests**

```powershell
npx vitest run src/features/exam-duty/storage/db.test.ts src/features/exam-duty/storage/repositories.test.ts
```

Expected: PASS.

- [ ] **Step 9: Run full regression suite**

```powershell
npm test
```

Expected: all Label tests and Duty tests PASS.

- [ ] **Step 10: Commit**

```powershell
git add package.json package-lock.json src/features/exam-duty/storage
git commit -m "feat: add isolated exam duty database"
```

---

### Task 5: Add one-time Teacher Master Excel import

**Files:**
- Create: `src/features/exam-duty/import/teacher-master.ts`
- Create: `src/features/exam-duty/import/teacher-master.test.ts`

**Interfaces:**
- Consumes: workbook bytes and existing `xlsx` dependency.
- Produces:
  - `TeacherMasterImportResult`
  - `parseTeacherMasterWorkbook(bytes: ArrayBuffer): Promise<TeacherMasterImportResult>`

Use this type:

```ts
export type TeacherMasterImportResult = {
  teachers: Teacher[];
  assignments: TeacherAssignment[];
  warnings: string[];
  errors: string[];
};
```

- [ ] **Step 1: Write parser tests first**

Create `src/features/exam-duty/import/teacher-master.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { parseTeacherMasterWorkbook } from "./teacher-master";

function workbookBytes(rows: Record<string, string>[]) {
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, sheet, "Teacher Master");
  return XLSX.write(workbook, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
}

describe("Teacher Master import", () => {
  it("combines repeated teacher rows into one teacher with multiple assignments", async () => {
    const result = await parseTeacherMasterWorkbook(
      workbookBytes([
        {
          "Teacher ID": "T001",
          "Teacher Name": "ABHA MASIH",
          "Alias / Short Name": "ABHA MASIH",
          Class: "III",
          Section: "B",
          Subject: "Science",
          Active: "YES",
        },
        {
          "Teacher ID": "T001",
          "Teacher Name": "ABHA MASIH",
          "Alias / Short Name": "ABHA MASIH",
          Class: "VI",
          Section: "B",
          Subject: "Science",
          Active: "YES",
        },
      ]),
    );

    expect(result.errors).toEqual([]);
    expect(result.teachers).toHaveLength(1);
    expect(result.assignments.map((item) => item.className)).toEqual(["III", "VI"]);
  });

  it("reports an invalid class instead of inventing a group", async () => {
    const result = await parseTeacherMasterWorkbook(
      workbookBytes([
        {
          "Teacher ID": "T002",
          "Teacher Name": "TEST TEACHER",
          Class: "College",
          Section: "A",
          Subject: "Test",
          Active: "YES",
        },
      ]),
    );

    expect(result.errors[0]).toContain("College");
    expect(result.assignments).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

```powershell
npx vitest run src/features/exam-duty/import/teacher-master.test.ts
```

Expected: FAIL because parser does not exist.

- [ ] **Step 3: Implement the parser**

Create `src/features/exam-duty/import/teacher-master.ts` and use `XLSX.read(bytes, { type: "array" })`. Prefer the `Teacher Master` sheet; if absent, use the first sheet and add a warning.

Normalize header lookup so these exact template headers are supported:

```text
Teacher ID
Teacher Name
Alias / Short Name
Class
Section
Subject
Active
Fixed Special Duty
Remarks
```

Rules:

```ts
const normalizedYes = (value: unknown) => String(value ?? "").trim().toUpperCase() !== "NO";
```

- teacher name is required
- class is required and must pass `normalizeSchoolClass`
- section and subject may be blank but are stored as `""`
- teacher ID may be supplied; otherwise create a stable ID from normalized teacher name, e.g. `teacher-abha-masih`
- repeated teacher rows produce one Teacher and multiple TeacherAssignment rows
- duplicate class/section/subject rows for the same teacher are de-duplicated
- invalid rows produce row-numbered errors and are skipped
- `Fixed Special Duty=YES` creates a warning only in this parser; actual special-duty configuration remains managed by Special Duties setup

- [ ] **Step 4: Run parser tests**

```powershell
npx vitest run src/features/exam-duty/import/teacher-master.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/features/exam-duty/import
git commit -m "feat: parse teacher master workbook"
```

---

### Task 6: Build Teacher Setup with one-time import and persisted group preview

**Files:**
- Create: `src/features/exam-duty/components/TeacherSetup.tsx`
- Create: `src/features/exam-duty/components/TeacherSetup.test.tsx`
- Modify: `src/features/exam-duty/storage/repositories.ts`

**Interfaces:**
- Consumes: `parseTeacherMasterWorkbook`, teacher repositories, `deriveEligibleGroups`.
- Produces: teacher import UI that saves imported teachers/assignments to IndexedDB and displays derived groups.

Add this repository function before UI work:

```ts
export async function replaceTeacherMaster(
  teachers: Teacher[],
  assignments: TeacherAssignment[],
): Promise<void>
```

It must replace only `teachers` and `teacherAssignments` in one multi-store readwrite transaction. It must not touch special duties/settings/exams.

- [ ] **Step 1: Write the Teacher Setup UI test first**

Create `src/features/exam-duty/components/TeacherSetup.test.tsx` using dependency injection so the component is testable without a real database:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { TeacherMasterImportResult } from "../import/teacher-master";
import { TeacherSetup } from "./TeacherSetup";

const parsed: TeacherMasterImportResult = {
  teachers: [
    {
      id: "t-1",
      name: "ABHA MASIH",
      alias: "ABHA MASIH",
      active: true,
      createdAt: "2026-09-12T00:00:00.000Z",
      updatedAt: "2026-09-12T00:00:00.000Z",
    },
  ],
  assignments: [
    { id: "a-1", teacherId: "t-1", className: "V", section: "B", subject: "Science" },
    { id: "a-2", teacherId: "t-1", className: "VI", section: "B", subject: "Science" },
  ],
  warnings: [],
  errors: [],
};

describe("TeacherSetup", () => {
  it("imports a teacher master and shows derived eligible groups", async () => {
    const user = userEvent.setup();
    const parseWorkbook = vi.fn().mockResolvedValue(parsed);
    const replaceMaster = vi.fn().mockResolvedValue(undefined);

    render(
      <TeacherSetup
        initialTeachers={[]}
        initialAssignments={[]}
        parseWorkbook={parseWorkbook}
        replaceMaster={replaceMaster}
      />,
    );

    const file = new File(["x"], "teachers.xlsx");
    Object.defineProperty(file, "arrayBuffer", { value: async () => new ArrayBuffer(8) });
    await user.upload(screen.getByLabelText("Teacher Master spreadsheet"), file);

    expect(await screen.findByText("ABHA MASIH")).toBeInTheDocument();
    expect(screen.getByText("LKG-V / VI-VIII")).toBeInTheDocument();
    expect(replaceMaster).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

```powershell
npx vitest run src/features/exam-duty/components/TeacherSetup.test.tsx
```

Expected: FAIL because component does not exist.

- [ ] **Step 3: Implement `replaceTeacherMaster` and TeacherSetup**

`TeacherSetup` props:

```ts
export type TeacherSetupProps = {
  initialTeachers: Teacher[];
  initialAssignments: TeacherAssignment[];
  parseWorkbook?: typeof parseTeacherMasterWorkbook;
  replaceMaster?: typeof replaceTeacherMaster;
};
```

Required UI:

```text
Teacher Setup
[Upload Teacher Master Excel]
Current teachers: N
Search box
Table: Teacher | Classes | Eligible Duty Group(s) | Active
```

When a file is selected:

1. read `arrayBuffer()`
2. parse
3. if `errors.length > 0`, display errors and do not replace database
4. otherwise call `replaceMaster(parsed.teachers, parsed.assignments)`
5. update local list immediately
6. show warnings non-destructively

Build class list from assignments sorted by school class order. Build group label using `deriveEligibleGroups`.

Do not add full manual row-by-row editing in Phase 1; the one-time import is the fast setup path. Manual edit belongs to a later enhancement after generation is stable.

- [ ] **Step 4: Run Teacher Setup tests**

```powershell
npx vitest run src/features/exam-duty/components/TeacherSetup.test.tsx src/features/exam-duty/storage/repositories.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/features/exam-duty/components/TeacherSetup.tsx src/features/exam-duty/components/TeacherSetup.test.tsx src/features/exam-duty/storage/repositories.ts src/features/exam-duty/storage/repositories.test.ts
git commit -m "feat: add persistent teacher setup import"
```

---

### Task 7: Build editable Special Duties setup and reconcile imported teachers by name

**Files:**
- Create: `src/features/exam-duty/components/SpecialDutySetup.tsx`
- Modify: `src/features/exam-duty/storage/repositories.ts`
- Test: `src/features/exam-duty/components/SpecialDutySetup.test.tsx`

**Interfaces:**
- Consumes: persisted teachers, `DEFAULT_SPECIAL_DUTIES`, `replaceSpecialDuties`.
- Produces: editable special-duty table and `reconcileSpecialDutiesWithTeachers` helper.

- [ ] **Step 1: Add the reconciliation test**

Create `src/features/exam-duty/components/SpecialDutySetup.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { SpecialDuty, Teacher } from "../types";
import { reconcileSpecialDutiesWithTeachers, SpecialDutySetup } from "./SpecialDutySetup";

const teachers: Teacher[] = [
  {
    id: "teacher-haroon",
    name: "MOHD HAROON",
    alias: "HAROON",
    active: true,
    createdAt: "2026-09-12T00:00:00.000Z",
    updatedAt: "2026-09-12T00:00:00.000Z",
  },
];

const duties: SpecialDuty[] = [
  {
    id: "d-1",
    teacherId: null,
    staffName: "MOHD HAROON",
    alias: "HAROON",
    dutyType: "Paper Distribution/Collection",
    responsibility: "III",
    roomRange: "Rooms 1-11",
    lockedFromRoomDuty: true,
    active: true,
  },
];

describe("SpecialDutySetup", () => {
  it("links a seeded special duty to an imported teacher by canonical name or alias", () => {
    expect(reconcileSpecialDutiesWithTeachers(duties, teachers)[0].teacherId).toBe(
      "teacher-haroon",
    );
  });

  it("shows unresolved staff instead of deleting them", () => {
    render(<SpecialDutySetup teachers={[]} duties={duties} onSave={async () => {}} />);
    expect(screen.getByText("MOHD HAROON")).toBeInTheDocument();
    expect(screen.getByText("Not linked to Teacher Master")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run and verify failure**

```powershell
npx vitest run src/features/exam-duty/components/SpecialDutySetup.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement reconciliation and editable setup**

Use this normalization helper inside the component module:

```ts
function normalizePersonName(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}
```

`reconcileSpecialDutiesWithTeachers` must compare both teacher `name` and `alias` against duty `staffName` and `alias`. If no match exists, preserve `teacherId: null`.

UI columns:

```text
Staff
Alias
Responsibility
Room Range
Linked Teacher
Locked
Active
```

Allow editing `responsibility`, `roomRange`, `lockedFromRoomDuty`, and `active`. Teacher linkage can be changed through a teacher dropdown. Save calls the injected `onSave` callback with the entire array.

Do not allow deleting seeded rows in Phase 1; use `Active=No` to disable them. This protects the known school configuration from accidental loss.

- [ ] **Step 4: Run tests**

```powershell
npx vitest run src/features/exam-duty/components/SpecialDutySetup.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/features/exam-duty/components/SpecialDutySetup.tsx src/features/exam-duty/components/SpecialDutySetup.test.tsx
git commit -m "feat: add fixed special duty setup"
```

---

### Task 8: Build Duty Rules setup for the fixed three-group policy

**Files:**
- Create: `src/features/exam-duty/components/DutyRulesSetup.tsx`
- Test: `src/features/exam-duty/components/DutyRulesSetup.test.tsx`

**Interfaces:**
- Consumes: `DutySettings`.
- Produces: controlled settings editor that can update school name/session/lower locations and staffing preferences without changing group class membership.

- [ ] **Step 1: Write the rules test**

Create `src/features/exam-duty/components/DutyRulesSetup.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_DUTY_SETTINGS } from "../domain/defaults";
import { DutyRulesSetup } from "./DutyRulesSetup";

describe("DutyRulesSetup", () => {
  it("keeps the three class bands fixed and saves staffing settings", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);

    render(<DutyRulesSetup settings={DEFAULT_DUTY_SETTINGS} onSave={onSave} />);

    expect(screen.getByText("LKG-V")).toBeInTheDocument();
    expect(screen.getByText("VI-VIII")).toBeInTheDocument();
    expect(screen.getByText("IX-XII")).toBeInTheDocument();
    expect(screen.getAllByText("Cross-group duty: No")).toHaveLength(3);

    await user.clear(screen.getByLabelText("Default session"));
    await user.type(screen.getByLabelText("Default session"), "2027-28");
    await user.click(screen.getByRole("button", { name: "Save duty rules" }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ defaultSession: "2027-28" }),
    );
  });
});
```

- [ ] **Step 2: Run and verify failure**

```powershell
npx vitest run src/features/exam-duty/components/DutyRulesSetup.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement DutyRulesSetup**

Required editable fields:

- School name
- Default session
- Fixed lower locations, one per line
- Preferred teachers per room for each group: 1 or 2
- Minimum teachers per room for each group: 1 or 2
- Shuffle daily: Yes/No
- Avoid same room on consecutive days
- Avoid same pair on consecutive days
- Balance total duties

Required read-only text for every group:

```text
Cross-group duty: No
```

Do not make group class membership editable in the MVP.

- [ ] **Step 4: Run tests**

```powershell
npx vitest run src/features/exam-duty/components/DutyRulesSetup.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/features/exam-duty/components/DutyRulesSetup.tsx src/features/exam-duty/components/DutyRulesSetup.test.tsx
git commit -m "feat: add exam duty rule settings"
```

---

### Task 9: Assemble the Phase 1 Exam Duty app and dashboard

**Files:**
- Create: `src/features/exam-duty/components/DutyDashboard.tsx`
- Create: `src/features/exam-duty/components/ExamDutyApp.tsx`
- Test: `src/features/exam-duty/components/ExamDutyApp.test.tsx`
- Modify: `src/app/duty/page.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: repositories and setup components.
- Produces: working `/duty` setup app with four sections: Dashboard, Teachers, Special Duties, Duty Rules.

- [ ] **Step 1: Write app integration test**

Create `src/features/exam-duty/components/ExamDutyApp.test.tsx` with injected repository methods:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_DUTY_SETTINGS, DEFAULT_SPECIAL_DUTIES } from "../domain/defaults";
import { ExamDutyApp } from "./ExamDutyApp";

describe("ExamDutyApp", () => {
  it("loads setup data and switches between setup sections", async () => {
    const user = userEvent.setup();

    render(
      <ExamDutyApp
        dataSource={{
          seedDutyDefaults: vi.fn().mockResolvedValue(undefined),
          listTeachers: vi.fn().mockResolvedValue([]),
          listTeacherAssignments: vi.fn().mockResolvedValue([]),
          listSpecialDuties: vi.fn().mockResolvedValue(DEFAULT_SPECIAL_DUTIES),
          getDutySettings: vi.fn().mockResolvedValue(DEFAULT_DUTY_SETTINGS),
          replaceTeacherMaster: vi.fn().mockResolvedValue(undefined),
          replaceSpecialDuties: vi.fn().mockResolvedValue(undefined),
          saveDutySettings: vi.fn().mockResolvedValue(undefined),
        }}
      />,
    );

    expect(await screen.findByText("Exam Duty setup is ready")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Teachers" }));
    expect(screen.getByRole("heading", { name: "Teacher Setup" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Special Duties" }));
    expect(screen.getByRole("heading", { name: "Special Duties" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run and verify failure**

```powershell
npx vitest run src/features/exam-duty/components/ExamDutyApp.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement DutyDashboard**

`DutyDashboard` receives counts and displays:

```text
Exam Duty setup is ready
Teachers: N
Teacher assignments: N
Active special duties: N
Groups: LKG-V / VI-VIII / IX-XII

New Examination — Coming in Phase 2
Previous Exams — Coming in Phase 2
```

Do not expose inactive buttons as working actions.

- [ ] **Step 4: Implement ExamDutyApp**

Mark it `"use client"`.

On mount:

1. `seedDutyDefaults()`
2. load teachers
3. load all teacher assignments
4. load special duties
5. load settings
6. render dashboard

Use a local section state:

```ts
type DutySetupSection = "dashboard" | "teachers" | "special" | "rules";
```

Show four buttons with names exactly:

```text
Dashboard
Teachers
Special Duties
Duty Rules
```

After successful teacher import, refresh teacher/assignment state. After Special Duty save or Rule save, persist and refresh local state.

Errors loading IndexedDB must render a visible error box on `/duty` but must not affect `/` Exam Labels.

- [ ] **Step 5: Replace the temporary duty page**

`src/app/duty/page.tsx`:

```tsx
import { UtilityNav } from "@/components/UtilityNav";
import { ExamDutyApp } from "@/features/exam-duty/components/ExamDutyApp";

export default function DutyPage() {
  return (
    <>
      <UtilityNav active="duty" />
      <ExamDutyApp />
    </>
  );
}
```

Update `src/app/duty/page.test.tsx` to assert the `Exam Duty` heading using the real app; mock repository access through an `ExamDutyApp` dependency boundary if necessary rather than touching Label tests.

- [ ] **Step 6: Add duty-only CSS classes**

Append styles prefixed with `duty-`, e.g.:

```css
.duty-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 18px;
}

.duty-toolbar button {
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--card-bg);
  padding: 9px 13px;
  color: var(--text);
  cursor: pointer;
  font-weight: 800;
}

.duty-toolbar button[aria-pressed="true"] {
  border-color: var(--primary);
  background: var(--primary-soft);
  color: var(--primary-dark);
}

.duty-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
}

.duty-table-wrap {
  overflow-x: auto;
}

.duty-table {
  width: 100%;
  border-collapse: collapse;
}

.duty-table th,
.duty-table td {
  border-bottom: 1px solid var(--border);
  padding: 10px;
  text-align: left;
  vertical-align: top;
}
```

Do not change `.label-*`, `.sheet-*`, `.preview-*`, geometry, or print-specific rules.

- [ ] **Step 7: Run Phase 1 Duty tests**

```powershell
npx vitest run src/features/exam-duty src/app/duty/page.test.tsx src/components/UtilityNav.test.tsx
```

Expected: PASS.

- [ ] **Step 8: Run the full existing Label regression suite**

```powershell
npm test
npm run lint
npm run build
```

Expected: all PASS.

- [ ] **Step 9: Commit**

```powershell
git add src/features/exam-duty/components src/app/duty/page.tsx src/app/duty/page.test.tsx src/app/globals.css
git commit -m "feat: assemble exam duty setup module"
```

---

### Task 10: Update project handoff docs and run final Phase 1 verification

**Files:**
- Modify: `README.md`
- Modify: `CODEX.md`
- Create: `docs/superpowers/specs/2026-09-12-exam-duty-module-design.md` if not already present in the local repo
- Create: `docs/superpowers/plans/2026-09-12-exam-duty-phase1.md` using this plan document

**Interfaces:**
- Produces: documented Phase 1 setup workflow and a clean Codex handoff for Phase 2.

- [ ] **Step 1: Add Exam Duty section to README**

Document:

```text
Exam Labels: /
Exam Duty: /duty
Exam Duty data stays in local browser IndexedDB: exam-duty-db
Phase 1 supports Teacher Master import, Special Duties, and Duty Rules.
Phase 2 will add New Examination and Exam_Data.xlsx import.
```

Keep all existing ST-24/printing documentation unchanged.

- [ ] **Step 2: Extend CODEX.md protection rules**

Add:

```text
Exam Duty is a separate subsystem.
Do not modify Exam Label geometry, parsing, PDF/print, or calibration behavior for Duty features.
Run npm test, npm run lint, npm run build after every Duty phase.
Use /duty and src/features/exam-duty for Duty code.
Use IndexedDB database exam-duty-db only for Duty data.
```

- [ ] **Step 3: Run the one-command verifier**

```powershell
.\scripts\verify.ps1
```

Expected: install, tests, lint, build all PASS.

- [ ] **Step 4: Manual smoke test**

```powershell
npm run dev
```

Check in browser:

```text
1. Open / and confirm Exam Label upload, preview, current print/PDF flow all still work.
2. Click Exam Duty.
3. Confirm /duty opens.
4. Confirm 14 default special duties are visible.
5. Confirm default lower locations are LKG-A, UKG-A, UKG-B, I-A, I-B, II-A, II-B, II-C.
6. Import a Teacher Master workbook using the agreed template.
7. Refresh the browser and confirm imported teachers remain saved.
8. Confirm derived groups appear correctly.
9. Return to Exam Labels and confirm Label state/functionality is unaffected.
```

- [ ] **Step 5: Final commit**

```powershell
git add README.md CODEX.md docs/superpowers
git commit -m "docs: document exam duty phase 1"
```

- [ ] **Step 6: Report Phase 1 evidence before any Phase 2 work**

Report exactly:

```text
Branch/worktree:
Commits:
Existing Exam Label tests:
New Exam Duty tests:
Lint:
Production build:
Manual Label smoke test:
Manual Duty persistence smoke test:
Files changed:
Known limitations:
```

Do not start Phase 2 in the same change set. Phase 2 begins only after Phase 1 is reviewed as stable.

---

## Phase 1 Self-Review Checklist

Before saying Phase 1 is complete, verify all of these:

- Existing Exam Label default route `/` still renders the existing app.
- Existing Exam Label component/domain code was not refactored for Duty.
- `/duty` works independently.
- Exam Duty database name is exactly `exam-duty-db`.
- Future stores are created in DB version 1 so Phase 2 can use them without an unnecessary schema migration.
- Teacher Master parser does not infer unknown classes.
- Teacher group eligibility derives only from actual imported teaching classes.
- Current school fixed special duties are seeded and preserved if unmatched to Teacher Master.
- `SHATRUGHAN KUMAR TIWARI` can remain an unresolved special-duty staff member without being dropped.
- Fixed lower locations are stored in Duty Settings.
- Cross-group duty remains disabled and read-only in MVP settings.
- No duty generation code has been added yet.
- Full `npm test`, `npm run lint`, and `npm run build` pass.
- The current Label print/PDF flow still works manually.
