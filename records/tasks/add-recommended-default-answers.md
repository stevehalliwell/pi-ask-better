---
id: 019fda14-77a2-757c-a596-1ffbff966431
name: add-recommended-default-answers
created_at: 2026-08-07T02:36:42.274Z
desc: "Require every ask_user question to provide a recommended/default answer. Display recommended choices first. When the user presses Enter without typing or moving the cursor, return the recommended default as the user's answer. For multi-select questions, show all recommended items first and return those items when Enter is pressed without typing or cursor movement."
tags: []
status: todo
scope: agreed
---

## Desired outcome

- Option-based `ask_user` questions support a recommended/default answer.
- Recommended answers appear first.
- Pressing Enter without typing or moving the cursor returns the effective default as the user's response.
- For multi-select questions, all recommended items appear first and the same pristine Enter action returns all effective defaults.

## In scope

- Add optional `options[].recommended: true` metadata to the option schema and normalization.
- Stably render recommended options before non-recommended options.
- Track whether the panel remains pristine and submit the effective default(s) on blank Enter only while pristine.
- Use the first declared option as the effective default when recommendation metadata is missing or invalid for the selection mode.
- Document the parameter and behavior in the packaged skill, README, and CHANGELOG.

## Out of scope

- Changing the free-text-only question flow.
- Changing result shapes, cancellation behavior, or unrelated panel interaction.

## Existing behavior to preserve

- Free-text-only questions remain available without a recommendation.
- Typing, filtering, or navigation retains existing Enter behavior and does not silently accept a default.
- Existing option-label, custom-text, multi-select, and cancellation result contracts remain unchanged.

## Acceptance

- Marked recommendations display first while preserving original order within recommended and non-recommended groups.
- A pristine blank Enter returns one effective default in single-select and all effective defaults in multi-select.
- Missing or selection-mode-invalid recommendation metadata safely uses the first declared option as the effective default.
- Free-text-only, custom text, filtering, navigation, cancellation, and existing result shapes remain intact.
- `npm run smoke`, `npm pack --dry-run`, and `git diff --check` pass.

## Open questions

- None.

## Decisions

- 2026-08-07: Represent recommendations with `options[].recommended: true`; see `records/decisions/recommended-options-use-option-metadata.md`.
- 2026-08-07: Preserve free-text-only questions without a recommendation and fall back to the first declared option for missing or invalid recommendation metadata.

## Plan

- Extend option parsing and derive effective defaults plus display ordering from the option list.
- Add pristine-state-aware Enter handling without changing post-interaction behavior.
- Update user and agent documentation, then run the repository checks.

## Review / next slice

- Scope agreed 2026-08-07; ready for separate implementation workflow.
