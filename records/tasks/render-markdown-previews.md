---
id: 019fd420-e502-70f8-b741-566d3bc7c209
name: render-markdown-previews
created_at: 2026-08-05T22:52:33.410Z
desc: "Render option previews with Markdown formatting and tables."
tags: []
status: done
scope: agreed
---

## Scope

### Desired outcome

- All displayed question and option text presents terminal-safe Markdown formatting, including pipe tables.

### In scope

- Question text, option labels, option descriptions, and previews: headings, emphasis, inline/fenced code, lists, links, blockquotes, and GitHub-style pipe tables.
- Preserve responsive preview placement: beside options when viable and below them when narrow.
- Preserve table rows and columns on narrow terminals, truncating overflow cell content with ellipses.
- Return the original, unrendered option-label Markdown source in `ask_user` results.

### Out of scope

- HTML, images, external content, horizontal table scrolling, paging, and Markdown rendering in headers or tabs.

### Existing behavior to preserve

- Responsive preview placement beside options on wide terminals and below them on narrow terminals.
- Option-selection behavior and the documented result contract, including original option labels in results.

### Acceptance

- Formatted question text, option labels, option descriptions, and preview text render correctly.
- A pipe table renders as a table in every supported display field.
- Every rendered Markdown line fits terminal width.
- On narrow terminals, table headers and row/column structure remain visible while overflowing cell text is truncated.
- Existing option-selection flows remain unchanged and return the original option-label Markdown source.

## Open questions

- None.

## Decisions

- 2026-08-05: Support the documented Markdown subset in question text, option labels, option descriptions, and preview fields; do not render Markdown in headers or tabs.
- 2026-08-05: Return original option-label Markdown source in results.
- 2026-08-05: Keep narrow tables structurally intact and truncate overflowing columns; do not add horizontal navigation.

## Plan

- Verify Pi's terminal Markdown component supports the agreed subset and table rendering.
- Replace plain preview wrapping with Markdown-aware rendering.
- Render Markdown in question text and option labels/descriptions while preserving raw option-label results.
- Add width-safe table layout/truncation only where the built-in renderer does not meet acceptance.
- Exercise formatted, table, wide, and narrow examples across every supported display field.

## Implemented so far

- Replaced plain preview wrapping with Pi's Markdown renderer and preview-specific terminal theme.
- Verified the built-in renderer handles the agreed Markdown subset and width-safe pipe-table structure at 40 and 12 columns.
- Confirmed that built-in narrow tables wrap cell content rather than truncating it; a custom table path remains necessary for the agreed ellipsis behavior.
- 2026-08-05 refinement: expanded Markdown display support from previews to question text, option labels, and descriptions; results retain original option-label Markdown source.
- Rendered question text, option labels, and option descriptions through the Markdown renderer while retaining the existing focus markers, checkbox state, and raw option-label result values.
- Added a width-aware pipe-table renderer that preserves headers, rows, and columns while truncating cell content with ellipses.
- Updated README and CHANGELOG.

## Checks

- Passed: `npm run smoke`.
- Passed: direct Markdown-renderer probe at 40 and 12 columns; all lines fit and table structure remained visible.
- Passed: `git diff --check`.
- Pending manual checks: formatted question text, option labels, descriptions, and previews at normal and narrow terminal widths; pipe tables at wide and narrow widths.

## Review / next slice

- Approved 2026-08-05: manual TUI verification reported looking great.
- Next: no tracked implementation work.

## Notes

- Confirmed 2026-08-05. Pi's built-in Markdown table capability must be verified before choosing any custom renderer.
