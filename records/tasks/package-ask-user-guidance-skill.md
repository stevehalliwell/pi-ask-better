---
id: 019fd49f-8eb1-7da5-8fd9-7028c0d47ec4
name: package-ask-user-guidance-skill
created_at: 2026-08-06T01:10:54.385Z
desc: "Package a model-invoked skill that guides agents to use ask_user correctly."
tags: []
status: done
scope: agreed
---

## Scope

### Desired outcome

- Pi Ask Better ships a model-invoked `ask-user` skill that helps agents use the extension as users experience it.

### In scope

- Package `skills/ask-user/SKILL.md` with the extension.
- Explain when to use `ask_user`: one focused decision, preference, or clarification; dependent questions one at a time.
- Explain terminal-only behavior, option and custom-text results, multi-select, cancellation, filtering, focused-option typing, sole-match Enter, and Markdown display behavior.
- Preserve the documented result contract and direct agents to use original option-label source when interpreting results.

### Out of scope

- Changing extension behavior or the `ask_user` tool schema.
- A user-invoked tutorial skill, additional commands, or interactive test automation.

### Existing behavior to preserve

- The documented `ask_user` result contract and non-TUI cancellation behavior.
- Pi package discovery of skills from a packaged `skills/` directory.

### Acceptance

- The package includes `skills/ask-user/SKILL.md`.
- The skill frontmatter validates and enables model invocation.
- Skill instructions accurately match current tool behavior and README claims.
- `npm pack --dry-run`, `npm run smoke`, and `git diff --check` pass.

## Open questions

- None.

## Decisions

- 2026-08-06: Include the model-invoked skill in the 0.1.0 release.
- 2026-08-06: Return values remain the original option-label Markdown source; formatting is display-only.

## Plan

- Create concise model-invoked `ask-user` skill instructions.
- Include `skills/` in package files and document packaged agent guidance.
- Validate the skill and package contents.

## Implemented so far

- Added model-invoked `skills/ask-user/SKILL.md` with usage boundaries, result contract, terminal behavior, controls, and Markdown display guidance.
- Added `skills` to package files and documented the bundled guidance in README.
- Added the skill to the 0.1.0 release notes.
- Refined the skill with a canonical all-fields request sample, explicit Markdown support by display location, and narrower skip guidance.

## Checks

- Passed: skill frontmatter validator.
- Passed: skill word-count check (474 words).
- Passed: `npm run smoke`.
- Passed: `npm pack --dry-run`; package includes `skills/ask-user/SKILL.md`.
- Passed: `git diff --check`.

## Review / next slice

- Approved 2026-08-06: skill refinement accepted.
- Likely next slice/task: none.

## Notes

- Release readiness is preparing the first verified release target, 0.1.0.
