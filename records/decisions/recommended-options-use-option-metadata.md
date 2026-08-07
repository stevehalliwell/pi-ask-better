---
id: 019fdb03-5dc0-716a-9473-ebfcbc71b30c
name: recommended-options-use-option-metadata
created_at: 2026-08-07T06:57:38.752Z
desc: "Represent ask_user recommended defaults with per-option metadata rather than top-level labels or implicit ordering."
tags: []
status: accepted
revisit_triggers:
  - ask-user-public-api
  - default-answer-semantics
---

## Context

The `add-recommended-default-answers` backlog item requires callers to designate default answers, render them first, and return them when Enter is pressed before typing or navigation. The designation is a public `ask_user` request-shape decision.

## Decision

Use `options[].recommended: true` to mark recommended options. Preserve free-text-only questions without a recommendation; default behavior applies only to option-based questions. For option-based requests with missing or selection-mode-invalid recommendations, fall back to the first declared option rather than reject the request.

## Options considered

- **Per-option boolean metadata (chosen):** keeps the recommendation attached to the option and supports one recommendation for single-select or several for multi-select.
- **Free-text default:** preserve the existing free-text-only flow rather than requiring options or adding a custom-text default field.
- **Top-level default label(s):** leaves option objects unchanged but couples the setting to exact label strings.
- **Implicit first option:** requires no new field but makes presentation order behavioral and cannot express a different recommendation.

## Trade-offs / consequences

- The public option shape gains an optional boolean field and callers should intentionally mark recommendations for option-based questions; legacy or invalid markings fall back to the first declared option.
- Free-text-only questions remain available without a recommendation.
- Rendering and pristine-Enter handling must derive defaults from the marked options; display order must not be the sole source of default semantics except for the explicit first-declared-option fallback.

## Affected areas

- `index.ts` option schema, argument normalization, panel state, rendering, and keyboard handling.
- Packaged `ask-user` guidance and public documentation if the new parameter is documented.

## Guardrails

- Preserve the existing result contract: option selections return labels, custom text returns `custom`, and cancellation remains distinct.
- Do not treat Enter as default acceptance after typing, filtering, navigation, or other input that changes the pristine state.
- Preserve free-text-only questions without a recommendation.
- For missing or selection-mode-invalid recommendation metadata, use the first declared option as the effective default instead of throwing a tool error.
- Support multiple marked recommendations only in multi-select; define invalid or absent recommendations explicitly during task refinement.

## Revisit trigger

- Revisit if Pi constrains option-object extensions or the API needs richer recommendation metadata than a boolean.
- Revisit if testing shows users expect default acceptance after interaction, rather than only a pristine blank Enter.
