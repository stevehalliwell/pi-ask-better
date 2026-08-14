# Pi Ask Better

Pi Ask Better makes it easy to answer an agent's questions without losing the conversation. When Pi needs your decision, a compact panel appears at the bottom of the terminal while the transcript stays visible above it.

You choose an option or type your own answer; Pi continues with your answer instead of guessing.

## Scope

Pi Ask Better is deliberately opinionated: it does question panels the way its developer prefers, and no more. If you need a more feature-rich ask extension, consider one of these alternatives:

- [@juicesharp/rpiv-ask-user-question](https://pi.dev/packages/@juicesharp/rpiv-ask-user-question)
- [pi-ask-user](https://pi.dev/packages/pi-ask-user)
- [@mrclrchtr/supi-ask-user](https://pi.dev/packages/@mrclrchtr/supi-ask-user)
- [@zhushanwen/pi-ask-user](https://pi.dev/packages/@zhushanwen/pi-ask-user)

## Install

Install from the [GitHub repository](https://github.com/stevehalliwell/pi-ask-better) as a Pi git package:

```powershell
pi install git:github.com/stevehalliwell/pi-ask-better
```

Restart Pi or run `/reload` after installation. The package includes a model-invoked `ask-user` skill that guides agents to use the panel for focused decisions and clarifications.

When an agent needs your answer before continuing, it uses the panel for a structured clarification, preference, confirmation, recommendation approval, or choice between alternatives. It first checks available context and proceeds without asking when the answer is clear or a reversible default is enough. For unconstrained or substantial text, it asks in Pi chat instead.

## Question formats

Agents use `options` for a presented choice, or `yesNo: true` for fixed Yes/No choices. Both formats retain custom-text entry through **Enter custom text**. For unconstrained text, agents ask directly in Pi chat so you get Pi's native editor; `ask_user` no longer accepts a standalone free-text question.

## What it feels like

When Pi needs your input, it shows one focused, bordered question panel with a labelled answer box and choices.

- **Type right away** to filter the choices or write your own answer.
- **Press Enter** in the text box to send what you wrote, or accept the displayed default before you type or move.
- **Press Down** to move into the matching choices.
- Select **Enter custom text** to force a typed response; its visible custom-answer state prevents Enter from selecting a matching option.
- Keep typing, pasting, or editing your text while a choice remains focused.
- **Press Up** from the first choice to return to the text box.
- **Press Enter** on a choice to send it immediately; in single-select questions, it also selects a sole filtered match.
- For questions that allow several choices, **Space** checks or unchecks a choice, then **Enter** sends your selections.
- **Press Escape** to cancel.

For option-based questions, agents can mark a recommended choice, or several in a multi-select question. Before you type or move, Enter accepts that recommendation; it is shown as ` - recommended`. If no recommendation is supplied, the first choice is the fallback and is shown as ` - default`.

Agents can also ask fixed yes/no questions while retaining custom text entry. For unconstrained text, agents ask directly in Pi chat so you get Pi's native editor.

Some choices include more detail. On wide terminals it appears alongside the choices; on narrow terminals it appears underneath them.

Question text, option labels and descriptions, and previews support terminal-safe Markdown: headings, emphasis, code, lists, links, blockquotes, and pipe tables. Markdown is display-only: selecting an option returns its original label text.

## For contributors

Pi Ask Better needs Node.js 22.19+ and Pi 0.83.0+.

```powershell
npm run smoke
npm pack --dry-run
```

The smoke check starts a one-shot Pi session, so it needs a configured Pi model.
