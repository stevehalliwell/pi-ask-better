# Pi Ask Better

Pi Ask Better makes it easy to answer an agent's questions without losing the conversation. When Pi needs your decision, a compact panel appears at the bottom of the terminal while the transcript stays visible above it.

You choose an option or type your own answer; Pi continues with your answer instead of guessing.

## Install

Install from a local checkout:

```powershell
pi install C:\path\to\pi-ask-better
```

Restart Pi or run `/reload` after installation.

## What it feels like

When Pi needs your input, it shows one focused, bordered question panel with a labelled answer box and choices.

- **Type right away** to filter the choices or write your own answer.
- **Press Enter** in the text box to send what you wrote.
- **Press Down** to move into the matching choices.
- Keep typing, pasting, or editing your text while a choice remains focused.
- **Press Up** from the first choice to return to the text box.
- **Press Enter** on a choice to send it immediately; in single-select questions, it also selects a sole filtered match.
- For questions that allow several choices, **Space** checks or unchecks a choice, then **Enter** sends your selections.
- **Press Escape** to cancel.

Some choices include more detail. On wide terminals it appears alongside the choices; on narrow terminals it appears underneath them.

## For contributors

Pi Ask Better needs Node.js 22.19+ and Pi 0.83.0+.

```powershell
npm run smoke
npm pack --dry-run
```

The smoke check starts a one-shot Pi session, so it needs a configured Pi model.
