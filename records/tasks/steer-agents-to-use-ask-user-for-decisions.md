---
id: 019fdf43-57d0-735c-a7a1-9a7b8c2d8bfe
name: steer-agents-to-use-ask-user-for-decisions
created_at: 2026-08-08T02:46:00.400Z
desc: "Steer agents to call ask_user for option selection, recommendation approval, preferences, and concise clarifications rather than ending with a prose question; include a packaged recommendation-approval example for that pattern."
tags: []
status: done
scope: agreed
---

## Scope

### Desired outcome

- Packaged guidance more reliably leads agents to invoke `ask_user` when a brief user decision or approval is needed before continuing.

### In scope

- Strengthen the active tool prompt guideline.
- Expand the packaged skill's frontmatter trigger description and full instructions with the options/recommendation-approval pattern.
- Include a concrete prose-question anti-pattern and correct `ask_user` example.
- Add a packaged skill example that exercises a recommended implementation option requiring approval.

### Out of scope

- Detecting prose questions after the model responds and coercing them into a panel.
- Changes to the `ask_user` result contract, panel behavior, or option schema.

### Existing behavior to preserve

- One focused question at a time, sequential dependent questions, terminal-only interaction, and the documented result contract.
- Ordinary discussion and questions needing substantial data or long-form text remain prose.

### Acceptance

- The always-active tool guideline explicitly directs `ask_user` use for selecting presented alternatives or approving a recommendation and prohibits ending that case with a prose question.
- The skill description exposes that trigger before the full skill is loaded.
- The skill contains a concise wrong/right example.
- The packaged skill includes a concrete `ask_user` request that presents alternatives and marks the recommendation.

## Open questions

- None.

## Decisions

- 2026-08-08: Prefer prompt and skill steering; do not attempt brittle post-response enforcement.
- 2026-08-08: Use packaged skill guidance rather than an automated PTY/model-backed harness, because `ask_user` is intentionally inactive outside TUI mode.
- 2026-08-08: Keep the recommendation-approval example in the packaged skill, not the public README.

## Plan

- Update the active tool guideline in `index.ts`.
- Update the packaged skill trigger and rules in `skills/ask-user/SKILL.md`, including a wrong/right example.
- Add a recommendation-approval request example to `skills/ask-user/SKILL.md`.
- Run the repository's required checks.

## Implemented so far

- Updated `index.ts` active `ask_user` guidance to name brief choices, recommendation approval, preferences, clarifications, and presented alternatives; it now directs agents not to replace those prompts with prose questions.
- Updated `skills/ask-user/SKILL.md` frontmatter and usage rules to expose selection and recommendation-approval triggers before the skill loads; added a concrete wrong/right prose-question example.
- Added a recommendation-approval `ask_user` request example to `skills/ask-user/SKILL.md`; removed the manual validation scenario from `README.md` and retained the user-facing guidance improvement in `CHANGELOG.md`.

## Checks

- `attendant validate --noCorrect`: passed with no diagnostics.
- `attendant sync`: passed.
- `git diff --check`: passed after the active-guidance and skill updates.
- `npm pack --dry-run`: passed; packaged `skills/ask-user/SKILL.md`.
- `npm run smoke`: passed; extension loads in non-interactive mode.
- `git diff --check`: passed after all changes.
- No automated model-behavior assertion is included; `ask_user` is intentionally inactive outside interactive TUI mode.

## Review / next slice

- Approved 2026-08-08; complete.
- Likely next slice/task: none.

## Notes

- Prompt and skill guidance improve model behavior but do not enforce tool use deterministically.
