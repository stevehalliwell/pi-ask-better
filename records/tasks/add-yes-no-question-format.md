---
id: 019fe916-db12-7136-b687-e2eb95359108
name: add-yes-no-question-format
created_at: 2026-08-10T00:33:37.042Z
desc: "Add a yes/no question format that retains custom-text entry, and remove standalone free-text-only ask_user questions in favor of asking those questions directly in Pi chat."
tags: []
status: todo
scope: draft
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

- An agent can invoke a yes/no question and the user can answer yes, no, or enter custom text.
- ask_user no longer presents a standalone free-text-only interaction.
- Existing option-based question behavior continues to work.

## Open questions

- TBD: public API shape for yes/no (for example, a dedicated parameter or a convenience option form).
- TBD: behavior when ask_user is invoked without options after free-text-only support is removed.

## Notes

- Product rationale: unconstrained typing should use Pi chat for its native terminal editing experience.
