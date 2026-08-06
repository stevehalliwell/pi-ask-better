---
id: 019fd41b-5684-7184-815e-8da65ad6ea51
name: visual-tweaks
created_at: 2026-08-05T22:46:29.252Z
desc: "Clarify the active ask_user question panel, choice hierarchy, and cursor movement."
tags: []
status: done
scope: agreed
---

## Scope

### Desired outcome

- The default ask_user panel clearly communicates that Pi is asking a question, distinguishes option names from descriptions, and makes cursor movement understandable.

### In scope

- Add a compact border around the active question panel.
- Add the `Your decision`, `Your answer`, and choices labels with clear visual hierarchy.
- Render the question accent/bold; render option descriptions muted and indented below their labels.
- Show a persistent visible marker for the focused option, including in multi-select questions where checked state must remain visually distinct from cursor position.
- Add a hint that Down enters choices and Up returns to the answer input.
- Retain essential panel elements on narrow terminals.

### Out of scope

- Changes to selection, filtering, free-text, or multi-select behavior.
- Markdown preview work and any new panel interaction modes.

### Existing behavior to preserve

- The transcript remains visible above the bottom panel.
- One-question flow, immediate option submission, and current keyboard behavior.
- Compact terminal rendering.

### Acceptance

- The active question panel is identifiable at a glance.
- The question, option labels, and option descriptions have visibly distinct hierarchy.
- The user can see the current option cursor and understand how Up/Down move between it and the answer input.
- In multi-select questions, the cursor movement is visible independently of checked/unchecked state.
- The transcript stays visible and the compact panel keeps its essential controls on narrow terminals.

## Open questions

- None.

## Decisions

- 2026-08-05: Use a compact border rather than a frameless layout or padded card.
- 2026-08-05: Use `Your decision` as the active-panel heading and explicit `Your answer`/choices labels.
- 2026-08-05: Multi-select cursor position must be visible independently of checkbox state.

## Plan

- Update the panel renderer's sections, labels, and theme styling.
- Add focused-option marker and directional navigation hint.
- Exercise normal and narrow widths against the supplied screenshot's flow.

## Implemented so far

- Added a compact accent-bordered panel with a `Your decision` heading.
- Added bold `Your answer` and `Choices` section labels, accented/bold question text, bold option labels, and muted descriptions and hints.
- Added a separate `>` cursor marker for focused multi-select options while retaining their checkboxes.
- Updated the hint to show both Down-to-choices and Up-to-answer navigation.
- Updated README and CHANGELOG.

## Checks

- Passed: `npm run smoke`.
- Passed: `git diff --check`.
- Pending manual visual checks at normal and narrow terminal widths.

## Review / next slice

- Approved 2026-08-05: manual TUI visual verification reported looking great.
- Likely next task: `render-markdown-previews`.

## Notes

- Reference screenshot: `records/tasks/image.png`.
- Original feedback: the default layout does not clearly show an active question, option names versus descriptions, or where the Up/Down cursor moves.
- Added feedback: multi-select questions do not visibly show the cursor moving up and down.
