---
id: 019fd421-ef62-785b-9456-f5d071d351db
name: type-while-option-focused
created_at: 2026-08-05T22:53:41.602Z
desc: "Keep accepting text input while an option has cursor focus."
tags: []
status: done
scope: agreed
---

## Scope

### Desired outcome

- The user can continue filtering or writing a custom answer while an option remains visibly focused.

### In scope

- Route printable text, paste, Backspace, Delete, and normal editor shortcuts to the text input while an option is focused.
- Keep the option cursor visible while text changes filter results.
- Safely recompute the focused option as the filtered list changes.
- Keep Up/Down as option navigation and Escape as cancellation.

### Out of scope

- Changing the sole-filtered-option behavior defined in `select-single-filtered-option`.
- New keyboard shortcuts or a separate free-text mode.

### Existing behavior to preserve

- In single-select, Enter selects the focused option; with zero matching options, it submits typed custom text.
- In multi-select, Space toggles choices and Enter submits checked choices.
- A non-empty text draft clears multi-select checks.

### Acceptance

- Typing, pasting, and standard editor deletion/editing work while an option is focused without moving the cursor back to the input area.
- Filter results and the focused option update safely as text changes.
- Up/Down continue to navigate options; Escape continues to cancel.
- In single-select, Enter selects the focused option; with zero matches, Enter submits typed custom text.
- Multi-select Space-toggle and Enter-submit behavior remains unchanged, including clearing checked choices on non-empty typing.

## Open questions

- None.

## Decisions

- 2026-08-05: Keep Enter as the focused-option action while an option exists; use it for custom text only when filtering has no options.
- 2026-08-05: Preserve existing multi-select controls and clear checked choices when a non-empty draft begins.

## Plan

- Decouple editor input routing from visual option focus.
- Reconcile the focused index after each editor change.
- Keep option-navigation keys separate from editor input.
- Exercise single-select, multi-select, zero-match, paste, deletion, and navigation flows.

## Implemented so far

- Routed all non-navigation keys from option focus to the editor.
- Preserved option-focus handling for Up, Down, Escape, multi-select Space, and Enter when a focused option exists.
- With zero matching options, Enter now reaches the editor and submits non-empty custom text.
- Updated README and CHANGELOG keyboard behavior documentation.

## Checks

- Passed: `npm run smoke`.
- Passed: `npm pack --dry-run`.
- Passed: `git diff --check`.
- Pending manual TUI keyboard-flow checks: typed text, paste, deletion, single-select, multi-select, zero matches, and Up/Down navigation.

## Review / next slice

- Approved 2026-08-05: manual TUI verification reported working.
- Likely next task: `select-single-filtered-option`.

## Notes

- Confirmed 2026-08-05.
