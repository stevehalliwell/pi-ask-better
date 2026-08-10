---
id: 019fe916-db12-7136-b687-e2eb95359108
name: add-yes-no-question-format
created_at: 2026-08-10T00:33:37.042Z
desc: "Add a yes/no question format that retains custom-text entry, and remove standalone free-text-only ask_user questions in favor of asking those questions directly in Pi chat."
tags: []
status: done
scope: agreed
---

## Scope

### Desired outcome

- Agents can ask yes/no questions with a custom-text response path.
- Questions needing only unconstrained text are posed in Pi chat rather than through ask_user.

### In scope

- Add a yes/no question format.
- Retain custom-text entry for yes/no questions.
- Remove the free-text-only ask_user format.

### Out of scope

- Replacing existing single-select or multi-select option flows.

### Existing behavior to preserve

- Option-based ask_user questions retain custom-text entry.
- Pi chat remains available for ordinary typed questions.

### Acceptance

- An agent can invoke `ask_user({ question, yesNo: true })`; the user can answer `Yes`, `No`, or enter custom text.
- ask_user rejects calls that provide neither `options` nor `yesNo: true`, directing agents to ask unconstrained questions in Pi chat.
- ask_user rejects `yesNo` combined with explicit options or `multiSelect: true`.
- Existing option-based question behavior continues to work.

## Open questions

- None.

## Decisions

- 2026-08-10: Use a dedicated `yesNo: true` flag rather than relying on agents to supply `Yes` and `No` options.
- 2026-08-10: Reject no-format and ambiguous format combinations with errors rather than silently normalizing them.

## Plan

- Add `yesNo` to the public tool schema and normalize it to fixed `Yes`/`No` options.
- Validate format combinations before rendering the panel.
- Remove standalone free-text-only panel behavior and direct agents to Pi chat in tool guidance and documentation.
- Verify yes/no, option, multi-select, and invalid-call flows.

## Implemented so far

- Added `yesNo: true` schema support and normalized it to fixed `Yes`/`No` options.
- Rejects no-format calls and `yesNo` combined with options or multi-select.
- Updated tool guidance, bundled ask-user guidance, README, and the unreleased changelog.

## Checks

- Passed: `npm run smoke`.
- Passed: `npm pack --dry-run`.
- Passed: `git diff --check`.
- Passed: manual TUI verification of yes/no, forced custom text, option, multi-select, and invalid-call flows.

## Review / next slice

- Approved 2026-08-10: user confirmed the feature worked.

## Notes

- Product rationale: unconstrained typing should use Pi chat for its native terminal editing experience.
