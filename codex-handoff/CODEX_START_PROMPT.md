# Codex Start Prompt — Exam Duty Phase 1

Open the existing project at:

`C:\Projects\ExamLabel`

The existing **Exam Label** subsystem is protected. Do not refactor or alter its ST-24 geometry, parser, PDF/print flow, calibration, pagination, or current working behavior.

Read these two documents first:

1. `docs/superpowers/specs/2026-09-12-exam-duty-module-design.md`
2. `docs/superpowers/plans/2026-09-12-exam-duty-phase1.md`

Use Superpowers workflows. Start with `using-git-worktrees`, then implement the Phase 1 plan with `subagent-driven-development` (recommended) and TDD. Before any edits run the existing baseline:

```powershell
Set-Location C:\Projects\ExamLabel
npm test
npm run lint
npm run build
```

Create an isolated worktree/branch named `feature/exam-duty-phase1`. Implement **Phase 1 only**. Run the full Label regression suite after every major task. Use the existing local project as the source of truth if it is newer than any archived V1 handoff; preserve newer Label print/popup fixes and tests.

Do not ask for routine implementation permission. Stop only for a genuinely destructive action, an external credential/access requirement, or a contradiction that cannot be resolved from the design/plan.

At completion, use `verification-before-completion` and report:

- branch/worktree
- commits
- total tests passed
- Exam Label regression status
- Exam Duty test status
- lint status
- production build status
- manual smoke-test results
- files changed
- known limitations

Do not start Phase 2 until Phase 1 is reviewed.
