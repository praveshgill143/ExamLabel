import type { StudentRecord } from "@/domain/student";
import type { RowIssue } from "@/domain/spreadsheet";

export type StudentTableProps = {
  students: StudentRecord[];
  issues: RowIssue[];
};

export function StudentTable({ students, issues }: StudentTableProps) {
  if (students.length === 0 && issues.length === 0) return null;

  return (
    <section className="card data-card">
      <div className="data-card__header">
        <div>
          <p className="eyebrow">Data review</p>
          <h2>Students to print</h2>
        </div>
        <span className="count-badge">
          {students.length} ready to print
        </span>
      </div>

      {issues.length > 0 ? (
        <div className="issue-box" role="status">
          <strong>{issues.length} incomplete {issues.length === 1 ? "row" : "rows"} skipped</strong>
          <ul>
            {issues.map((issue) => (
              <li key={issue.sourceRow}>
                Row {issue.sourceRow}: missing {issue.missingFields.join(", ")}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {students.length > 0 ? (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>{students[0].fields.map((field, index) => <th key={`${field.heading}-${index}`}>{field.heading}</th>)}</tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.sourceRow}>
                  {student.fields.map((field, index) => <td key={`${student.sourceRow}-${index}`}>{field.value}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
