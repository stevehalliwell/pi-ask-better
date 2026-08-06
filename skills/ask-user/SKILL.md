---
name: ask-user
description: "Ask the user to choose an option, state a preference, or answer one focused clarification. Use when an agent needs a decision before continuing, especially for requirements, priorities, confirmations, or mutually exclusive paths; skip when the user already gave a clear instruction, a question is informational, or proceeding cannot affect user-visible behavior or scope."
---

# Ask User

Use the `ask_user` tool for one decision the agent cannot responsibly make alone.

## When to use

- Ask one focused question when the answer changes scope, behavior, priority, compatibility, or the next action.
- Ask dependent questions only after receiving the prior answer.
- Continue without a question when the user already supplied the answer or proceeding cannot affect user-visible behavior or scope.

## Tool contract

Send one `question`, optional `header` and `tab`, optional `options`, and optional `multiSelect`. Do not invent multiple-question, required-answer, or free-text-mode parameters.

```json
{
  "header": "Release plan",
  "tab": "Release",
  "question": "# What should ship next?\n\nChoose the work that best supports **new users**.",
  "options": [
    {
      "label": "**Guided setup**",
      "description": "Add a short _first-run_ walkthrough.",
      "preview": "## Outcome\n\nA guided first session.\n\n| Benefit | Impact |\n| --- | --- |\n| Faster start | High |"
    },
    {
      "label": "`/export` command",
      "description": "Export the current configuration."
    }
  ],
  "multiSelect": true
}
```

This sample uses every request field and Markdown in the question, option label, description, and preview. With options present, users may still type custom text; with `multiSelect: true`, Space toggles choices and Enter returns checked labels.

- Each option has a required `label` and optional `description` and `preview`.
- Single-select results contain either `{ tab, answer }` for an option or `{ tab, custom }` for typed text.
- Multi-select results contain `{ tab, answers }` with selected option labels.
- Cancellation returns `{ cancelled: true, answers: [] }`.
- Outside Pi's interactive terminal UI, the tool is unavailable and returns cancellation. Do not treat that as user approval or a chosen default.

Use option labels as the exact returned value. Markdown formatting is display-only; an option selected from Markdown returns its original label source.

## What the user sees

- A bordered question panel with an answer editor and choices.
- Typing filters choices or writes custom text. Typing, paste, and normal editing continue while an option has focus.
- Down enters choices; Up from the first choice returns to the editor. Escape cancels.
- In single-select mode, Enter selects the focused option. When exactly one filtered option remains, it is focused while typing and Enter selects it.
- In multi-select mode, Space toggles the focused choice and Enter submits checked choices.
- Question text, option labels, option descriptions, and previews support terminal-safe Markdown: headings, emphasis, code, lists, links, blockquotes, and pipe tables. Wide previews appear beside choices when space permits; narrow previews appear below.

## Rules

- Keep the question neutral, concrete, and answerable without hidden context.
- Use options for genuine choices; leave options out for free-text input.
- Use the tool for one decision, not a survey; never collect secrets or replace an instruction the user already gave.
- After a result, state the selected value or cancellation outcome before acting on it.
