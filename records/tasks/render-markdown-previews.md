---
id: 019fd420-e502-70f8-b741-566d3bc7c209
name: render-markdown-previews
created_at: 2026-08-05T22:52:33.410Z
desc: "Render option previews with Markdown formatting and tables."
tags: []
status: todo
scope: agreed
---

## Scope

### Desired outcome

- Option previews present terminal-safe Markdown formatting, including pipe tables.

### In scope

- Preview fields only: headings, emphasis, inline/fenced code, lists, links, blockquotes, and GitHub-style pipe tables.
- Preserve responsive placement: beside options when viable and below them when narrow.
- Preserve table rows and columns on narrow terminals, truncating overflow cell content with ellipses.

### Out of scope

- HTML, images, external content, Markdown in option labels/descriptions, horizontal table scrolling, and paging.

### Existing behavior to preserve

- Responsive preview placement beside options on wide terminals and below them on narrow terminals.
- Plain previews and option-selection behavior.

### Acceptance

- Formatted preview text renders correctly.
- A pipe table renders as a table.
- Every rendered preview line fits terminal width.
- On narrow terminals, table headers and row/column structure remain visible while overflowing cell text is truncated.
- Existing plain preview and option-selection flows remain unchanged.

## Open questions

- None.

## Decisions

- 2026-08-05: Support the documented Markdown subset in preview fields only.
- 2026-08-05: Keep narrow tables structurally intact and truncate overflowing columns; do not add horizontal navigation.

## Plan

- Verify Pi's terminal Markdown component supports the agreed subset and table rendering.
- Replace plain preview wrapping with Markdown-aware rendering.
- Add width-safe table layout/truncation only where the built-in renderer does not meet acceptance.
- Exercise formatted, table, wide, and narrow preview examples.

## Implemented so far

- No code changes.

## Checks

- Required: focused formatted-preview and pipe-table examples at wide and narrow terminal widths; `npm run smoke` and `git diff --check`.

## Review / next slice

- Ready for review: no; scope is agreed and ready for implementation.
- Likely next slice/task: implement Markdown-aware preview rendering.

## Notes

- Confirmed 2026-08-05. Pi's built-in Markdown table capability must be verified before choosing any custom renderer.
