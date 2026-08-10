---
id: 019fe914-89ce-7172-8642-5b341e5962e2
name: add-custom-text-choice
created_at: 2026-08-10T00:31:05.166Z
desc: "Always show a selectable custom-text choice so users can explicitly enter a custom answer even while their partial text matches listed options."
tags: []
status: todo
scope: draft
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

- A user can explicitly select custom text and begin entering an answer while matching options remain visible.
- Existing option and custom-answer flows continue to work.

## Open questions

- TBD: label, placement, and keyboard interaction for the custom-text choice.

## Notes

- Reported need: force a custom answer when partial text continues to match options but the user does not want any matching option.
