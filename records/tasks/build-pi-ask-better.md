---
id: 019fd3c8-47f5-718e-97f2-3c714a1d820f
name: build-pi-ask-better
created_at: 2026-08-05T21:15:46.037Z
desc: "A low-friction interactive Pi terminal ask_user tool that keeps the transcript visible."
tags: []
status: done
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
- 2026-08-05: Return pi-ask-complete-style JSON text: `{ cancelled, answers: [{ tab, answer|custom|answers }] }`; retain matching structured tool details.

## Plan

- Package `index.ts` registers `ask_user` and reconciles it out of the active tool set outside TUI mode.
- Use a small canonical TypeBox schema plus `prepareArguments()` to normalize common aliases and string options; no options means free-text-only rather than a preventable error.
- Build a `Focusable` bottom-panel component through `ctx.ui.custom(..., { overlay: false })`; use `Editor`, `fuzzyFilter`, and width-safe helpers.
- Keep result formatting separate from the panel and return stable option, custom, multi-select, and cancellation results.
- Validate the vertical slice: option selection, unmatched text submission, multi-select, responsive previews, no-UI tool hiding, compact-terminal rendering, and sibling-tool ordering.
- Refine packaging, documentation, and compatibility after the vertical slice.

## Implemented so far

- Added package metadata and root `index.ts` Pi extension registering terminal-only `ask_user` with sequential execution.
- Added normalization for common question and option aliases, including string options; no options provides a free-text-only panel.
- Implemented a bottom editor-panel UI with initially focused live-filter input, immediate option/custom submission, multi-select toggles, responsive preview placement, IME focus propagation, and width/control-character-safe rendering.
- Reconciled the active tool set on session start so `ask_user` is hidden outside terminal TUI mode.
- Added a human-first README focused on the in-terminal question experience and controls; contributor checks remain concise.
- Added CHANGELOG entry and reusable `npm run smoke` package-load check.

## Checks

- Attendant task collection validates with no diagnostics.
- Pi 0.83.0 API review: `ctx.ui.custom()` with `overlay: false` provides the required editor-panel surface while leaving the transcript above it visible; `Editor`, `Focusable`, `fuzzyFilter`, width-safe TUI helpers, `executionMode: "sequential"`, `prepareArguments()`, and per-turn `pi.setActiveTools()` reconciliation are available. No API blocker found.
- Initial `pi --no-extensions -e ./index.ts --no-session -p ...` checks loaded the extension and exercised normalized `options` and `choices` inputs before the terminal-only activation guard was added.
- User manually confirmed the interactive extension is working.
- `npm run smoke`, `npm pack --dry-run`, and `git diff --check` pass.
- README revision passes `git diff --check`.

## Review / next slice

- Ready for review: yes; implementation, package boundary, documentation, and smoke validation are complete.
- Ready for review: README is now human-first, describing the experience and controls rather than agent-facing tool usage.
- User approved the completed implementation on 2026-08-05.

## Notes

- Reference reviews: `@itc-steve/pi-ask-complete` for bottom-panel UX; `@juicesharp/rpiv-ask-user-question` for responsive previews and runtime validation; `pi-ask-user` for fuzzy filtering.
- Pi 0.83.0 source evidence: `ctx.ui.custom()` and tool definitions in `dist/core/extensions/types.d.ts`; examples `examples/extensions/question.ts` and `questionnaire.ts`; `fuzzyFilter` in `pi-tui/dist/fuzzy.d.ts`.
- Risks to verify: `executionMode: "sequential"` prevents parallel execution but vertical-slice testing must confirm behavior when the model emits sibling tool calls; sanitize control characters and width-truncate every rendered line; propagate `Focusable` state to the embedded editor.
- Use tool-specific prompt metadata, not global system-prompt injection, to require one focused question and context gathering.
