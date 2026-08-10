---
id: 019fe914-89ce-7172-8642-5b341e5962e2
name: add-custom-text-choice
created_at: 2026-08-10T00:31:05.166Z
desc: "Always show a selectable custom-text choice so users can explicitly enter a custom answer even while their partial text matches listed options."
tags: []
status: done
scope: agreed
---

## Scope

### Desired outcome

- Users can select a persistent custom-text choice and start typing a custom response, even when typed text still matches options.

### In scope

- Add an always-visible custom-text choice to the ask_user panel.

### Out of scope

- Replacing existing free-text input, filtering, option selection, or default-answer behavior.

### Existing behavior to preserve

- Typing in the answer input filters matching options.
- Users can submit a custom answer with the existing free-text flow.

### Acceptance

- A persistent `Enter custom text` choice remains visible while filtering options.
- Selecting it preserves the input and activates a visible custom-answer state.
- In custom-answer state, Enter submits the input as `custom` even when it is a sole matching option.
- Existing option and custom-answer flows continue to work.

## Open questions

- None.

## Decisions

- 2026-08-10: Render `Enter custom text` as a final pseudo-option that filtering cannot hide.
- 2026-08-10: Selecting it preserves typed text and activates a visible `Custom answer` state; the state forces Enter to return a custom result rather than auto-select a sole matching option.

## Plan

- Add panel state for forced custom entry and a persistent pseudo-option.
- Route its Enter action back to the editor in forced-custom state.
- Ensure custom-mode Enter bypasses sole-match option submission.
- Update public usage documentation and validate the interactive flows.

## Implemented so far

- Added an unfiltered final `Enter custom text` pseudo-option.
- Selecting it returns to the editor with a visible `Custom answer` label and prevents sole matching options from consuming Enter.
- Updated README usage guidance and the unreleased changelog.

## Checks

- Passed: `npm run smoke`.
- Passed: `npm pack --dry-run`.
- Passed: `git diff --check`.
- Passed: manual TUI verification; normal option selection and forced custom-answer flows look good.

## Review / next slice

- Approved 2026-08-10: user confirmed the feature looks good.

## Notes

- Reported need: force a custom answer when partial text continues to match options but the user does not want any matching option.
