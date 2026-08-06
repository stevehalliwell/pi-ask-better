---
id: 019fd420-0445-7c1e-830f-7adc9259f274
name: select-single-filtered-option
created_at: 2026-08-05T22:51:35.877Z
desc: "Select the sole filtered option with Enter while preserving continued free-text typing."
tags: []
status: done
scope: agreed
---

## Scope

### Desired outcome

- In single-select mode, Enter selects the one remaining fuzzy-filtered option instead of returning the same text as a custom answer.

### In scope

- Keep the text input focused while one fuzzy-filtered option is visibly marked as the active target.
- Recompute that target as the user continues typing.
- Make Enter select and return the sole matching option in single-select mode.
- Preserve custom-text Enter submission when zero or multiple options match.

### Out of scope

- Multi-select behavior.
- General typing while an explicitly focused option is active; that belongs to `type-while-option-focused`.

### Existing behavior to preserve

- Fuzzy filtering and continued typing in the text input.
- The Down-to-options flow.
- Multi-select Space toggles and Enter submission.

### Acceptance

- With exactly one fuzzy-filtered option in single-select mode, it is visibly marked while the text input remains focused.
- Enter returns the matching option label as an option selection.
- Further typing immediately recomputes whether a sole target exists.
- Zero or multiple matches return custom text on Enter as before.
- Multi-select behavior is unchanged.

## Open questions

- None.

## Decisions

- 2026-08-05: Apply sole-match Enter selection in single-select only; leave multi-select unchanged.
- 2026-08-05: A sole fuzzy match, not only an exact match, is the active target.

## Plan

- Derive an optional sole-match target from the filtered options while the text editor remains active.
- Render that target distinctly without transferring editor focus.
- Route Enter to the target only in single-select mode.
- Exercise zero, one, multiple, and changed-match cases.

## Implemented so far

- Marked the sole filtered option as focused while the text editor remains active in single-select mode.
- Routed Enter to that option only when exactly one option matches; zero and multiple matches retain editor submission.
- Kept multi-select behavior unchanged.
- Updated the single-select hint, README, and CHANGELOG.

## Checks

- Passed: `npm run smoke`.
- Passed: `git diff --check`.
- Pending manual single-select checks for zero, one, multiple, and changed fuzzy matches.

## Review / next slice

- Approved 2026-08-05: manual TUI verification reported working.
- Likely next task: `render-markdown-previews`.

## Notes

- User request: "when there is only 1 option cursor should move to it and pressing enter should select it, but allow user to keep typing."
