---
id: 019fd3c8-47f5-718e-97f2-3c714a1d820f
name: build-pi-ask-better
created_at: 2026-08-05T21:15:46.037Z
desc: "A low-friction interactive Pi terminal ask_user tool that keeps the transcript visible."
tags: []
status: todo
scope: agreed
---

## Scope

### Desired outcome

- A public Pi extension exposing `ask_user` for low-friction, structured user decisions in the interactive terminal.

### In scope

- One question per tool call; prevent dependent-question queues.
- Bottom editor-panel UI that leaves the transcript visible and remains compact on small terminals.
- Initially focused text box that live-filters options.
- Immediate submit: choose an option to submit it, or press Enter in the text box to submit free text.
- Single-select and multi-select; Space toggles multi-select options and Enter submits them.
- Responsive focused-option preview, side-by-side when wide and below options when narrow.
- Permissive, normalization-first tool input without cosmetic fields or brittle limits that cause preventable model errors.
- Hide the tool outside interactive Pi terminal mode.

### Out of scope

- Multiple questions in one invocation.
- Mandatory review or confirmation screens.
- RPC/native-dialog fallback for the first release.

### Existing behavior to preserve

- User choice must not be made by the agent when requirements are ambiguous.
- Option and free-text answers are mutually exclusive: selecting an option discards the draft; starting a non-empty free-text draft clears checked multi-select options.

### Acceptance

- An option selection returns immediately with no second confirmation.
- An unmatched typed answer submits as free text with one Enter.
- Multi-select returns selected labels with one Enter; a non-empty free-text draft clears checked options and submits only custom text.
- The most recent transcript remains visible while the panel is open.
- The panel retains the essential text input, matching options, and submit hints on a small terminal; previews stack below options when side-by-side display is not viable.
- Recoverable option-shape mistakes do not produce avoidable tool errors.

## Open questions

- No unresolved product behavior. Validate technical implementation choices in the first vertical slice.

## Decisions

- 2026-08-05: expose `ask_user`.
- 2026-08-05: terminal-only first release; hide the tool without terminal UI.
- 2026-08-05: include responsive previews and multi-select in v1.
- 2026-08-05: Down moves from the initially focused text box into filtered options; Up from the first option returns to the text box.
- 2026-08-05: Starting a non-empty free-text draft clears checked multi-select options.
- 2026-08-05: Keep the TUI compact for small terminals; do not sacrifice the transcript or core answer flow for decorative framing.

## Plan

- Package `index.ts` registers `ask_user` and reconciles it out of the active tool set outside TUI mode.
- Use a small canonical TypeBox schema plus `prepareArguments()` to normalize common aliases and string options; no options means free-text-only rather than a preventable error.
- Build a `Focusable` bottom-panel component through `ctx.ui.custom(..., { overlay: false })`; use `Editor`, `fuzzyFilter`, and width-safe helpers.
- Keep result formatting separate from the panel and return stable option, custom, multi-select, and cancellation results.
- Validate the vertical slice: option selection, unmatched text submission, multi-select, responsive previews, no-UI tool hiding, compact-terminal rendering, and sibling-tool ordering.
- Refine packaging, documentation, and compatibility after the vertical slice.

## Implemented so far

- Requirements research only; no extension code.

## Checks

- Attendant task collection validates with no diagnostics.
- Pi 0.83.0 API review: `ctx.ui.custom()` with `overlay: false` provides the required editor-panel surface while leaving the transcript above it visible; `Editor`, `Focusable`, `fuzzyFilter`, width-safe TUI helpers, `executionMode: "sequential"`, `prepareArguments()`, and per-turn `pi.setActiveTools()` reconciliation are available. No API blocker found.

## Review / next slice

- Ready for review: no; scope is agreed but implementation has not started.
- Likely next slice/task: build the terminal-only vertical slice.

## Notes

- Reference reviews: `@itc-steve/pi-ask-complete` for bottom-panel UX; `@juicesharp/rpiv-ask-user-question` for responsive previews and runtime validation; `pi-ask-user` for fuzzy filtering.
- Pi 0.83.0 source evidence: `ctx.ui.custom()` and tool definitions in `dist/core/extensions/types.d.ts`; examples `examples/extensions/question.ts` and `questionnaire.ts`; `fuzzyFilter` in `pi-tui/dist/fuzzy.d.ts`.
- Risks to verify: `executionMode: "sequential"` prevents parallel execution but vertical-slice testing must confirm behavior when the model emits sibling tool calls; sanitize control characters and width-truncate every rendered line; propagate `Focusable` state to the embedded editor.
- Use tool-specific prompt metadata, not global system-prompt injection, to require one focused question and context gathering.
