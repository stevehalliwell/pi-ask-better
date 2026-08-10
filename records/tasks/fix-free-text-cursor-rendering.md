---
id: 019fe8f6-a191-72af-a9cf-0f7bf24a5340
name: fix-free-text-cursor-rendering
created_at: 2026-08-05T22:50:00.000Z
desc: "Fix the free-text answer input so its visible cursor moves when keyboard navigation moves the underlying text cursor."
tags: []
status: done
scope: agreed
---

## Scope

### Desired outcome

- In free-text answer mode, the displayed cursor reflects the actual text insertion position after cursor-navigation keys.

### In scope

- Investigate and fix visual cursor positioning in the free-text input.

### Out of scope

- Changing free-text editing or navigation behavior beyond correcting its visual rendering.

### Existing behavior to preserve

- Keyboard navigation continues to move the underlying text cursor and typed characters are inserted at that position.

### Acceptance

- After moving the text cursor with keyboard keys, its on-screen position updates to match the insertion point.

## Open questions

- None.

## Decisions

- 2026-08-05: After every delegated `Editor.handleInput()` call in editing mode, invalidate the panel cache and request a render. This covers cursor-only navigation, for which Pi's `Editor` does not invoke `onChange`.

## Plan

- Add `this.refresh(this.tui)` after `this.editor.handleInput(data)` in the editing branch.
- Manually verify cursor rendering for arrow keys, word movement, Home/End, wrapping, and wide characters.

## Implemented so far

- Added `this.refresh(this.tui)` immediately after delegated `Editor.handleInput()` in editing mode, so cursor-only editor actions invalidate the panel's rendered-line cache.

## Checks

- Passed: `npm run smoke`.
- Passed: `npm pack --dry-run`.
- Passed: `git diff --check`.
- Passed: manual TUI verification; the reported cursor rendering issue is resolved.

## Review / next slice

- Approved 2026-08-10: user confirmed the fix worked.

## Notes

- Reported behavior: typing and navigation affect the underlying cursor correctly, but the visible cursor stays in the wrong position.
