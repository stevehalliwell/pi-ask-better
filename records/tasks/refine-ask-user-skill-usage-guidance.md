---
id: 019fda10-0db8-7848-9253-a8cb27a3b14a
name: refine-ask-user-skill-usage-guidance
created_at: 2026-08-06T01:10:54.385Z
desc: "Encourage agents to use ask_user for small, trivial focused questions as a clear request for an answer and direction, not merely extended conversation. Preserve the boundary that it is not a good fit for questions needing substantial data or long-form answers."
tags: []
status: done
scope: agreed
---

## Desired outcome

- Refine the packaged ask-user guidance so agents are not discouraged from using `ask_user` for small, trivial questions, including brief yes/no questions, when a clear answer or direction is needed.
- Keep guidance clear that questions requiring substantial data or long-form answers are a poor fit.

## In scope

- Make small phrasing changes in `skills/ask-user/SKILL.md` that encourage concise, focused questions that unblock progress.
- Preserve the distinction between focused input and ordinary conversational back-and-forth.

## Out of scope

- Changes to extension behavior, schema, result contract, or README.

## Existing behavior to preserve

- One focused question at a time; dependent questions remain sequential.
- The existing `ask_user` result contract and terminal-only behavior.

## Acceptance

- Guidance explicitly permits brief focused questions, including yes/no questions, rather than only consequential decisions.
- Guidance continues to discourage questions needing substantial data or long-form answers.
- No extension behavior, schema, result contract, or README changes.

## Open questions

- None.

## Plan

- Make a small wording-only update to the packaged skill.
- Run the relevant repository checks when the agreed task is implemented.

## Implemented so far

- Updated `skills/ask-user/SKILL.md` wording to allow concise focused questions, including yes/no questions, when they determine the next action.
- Added boundaries for ordinary conversation and answers needing substantial data or long-form text.

## Checks

- Passed: `npm run smoke`.
- Passed: `npm pack --dry-run`; packaged skill included.
- Passed: `git diff --check`.

## Review / next slice

- Approved 2026-08-07; complete.
