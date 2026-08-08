---
name: ask-user
description: "Ask the user to choose presented options, approve a recommendation, state a preference, or provide one focused answer or direction. Use when an agent needs a brief answer before continuing, including a yes/no or clarification; skip when the user already gave a clear instruction, the answer needs substantial data or long-form text, or the exchange is ordinary conversation."
---

# Ask User

Use the `ask_user` tool for one focused answer or direction needed before continuing.

## When to use

- Ask one concise, focused question when a brief answer, including yes/no, determines the next action. This includes presenting alternatives or a recommended path and needing the user to select or approve it.
- When you need that response before proceeding, call `ask_user`; do not end the response with a prose question instead.
- Ask dependent questions only after receiving the prior answer.
- Use ordinary conversation for discussion or answers needing substantial data or long-form text.
- Continue without a question when the user already supplied the answer or a reasonable default lets work move forward.

## Avoid prose decision prompts

**Wrong:** Present options, recommend one, then write: “Option 2 is recommended. Would you like me to implement it?”

**Right:** Call `ask_user` with the options, mark the recommended option with `recommended: true`, and wait for the result before proceeding.

### Example: request approval for a recommendation

After comparing approaches, make the approval request through the tool:

```json
{
  "header": "Implementation direction",
  "tab": "Approach",
  "question": "## Which approach should I implement?\n\nBoth approaches work; **shared tokens** keeps the outputs aligned.",
  "options": [
    {
      "label": "Separate CSS and image tokens",
      "description": "Keep each output's values independent."
    },
    {
      "label": "Shared TypeScript tokens",
      "description": "Use one token source for browser and generated-image output.",
      "recommended": true
    }
  ]
}
```

## Tool contract

Send one `question`, optional `header` and `tab`, optional `options`, optional `multiSelect`, and optional per-option `recommended`. Do not invent multiple-question, required-answer, or free-text-mode parameters.

```json
{
  "header": "Release plan",
  "tab": "Release",
  "question": "# What should ship next?\n\nChoose the work that best supports **new users**.",
  "options": [
    {
      "label": "**Guided setup**",
      "description": "Add a short _first-run_ walkthrough.",
      "preview": "## Outcome\n\nA guided first session.\n\n| Benefit | Impact |\n| --- | --- |\n| Faster start | High |",
      "recommended": true
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

- Each option has a required `label` and optional `description`, `preview`, and `recommended` boolean. For option-based questions, mark one option in single-select or the options you recommend in multi-select with `recommended: true`.
- Before any typing or navigation, Enter returns the recommended option in single-select or all marked options in multi-select. If no option is marked, or several are marked in single-select, it returns the first declared option instead.
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
- Before input or navigation, explicitly marked options are visibly labelled ` - recommended`. When no option is marked, the first-option fallback is visibly labelled ` - default`.
- Question text, option labels, option descriptions, and previews support terminal-safe Markdown: headings, emphasis, code, lists, links, blockquotes, and pipe tables. Wide previews appear beside choices when space permits; narrow previews appear below.

## Rules

- Keep the question neutral, concrete, and answerable without hidden context.
- Use options for genuine choices; leave options out for free-text input.
- Use the tool for one decision, not a survey; never collect secrets or replace an instruction the user already gave.
- After a result, state the selected value or cancellation outcome before acting on it.
