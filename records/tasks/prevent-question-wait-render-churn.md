---
id: 01a0601b-7e41-72d7-89ef-75723d7d11bc
name: prevent-question-wait-render-churn
created_at: 2026-09-02T03:13:29.665Z
desc: Use current Pi TUI APIs for ask_user and prevent its long-lived waiting state from continuously re-rendering the terminal.
tags: []
status: done
scope: agreed
---

## Scope

### Desired outcome

- A long-lived `ask_user` question does not continuously animate or redraw the terminal while waiting for an answer.

### In scope

- Review the installed Pi 0.84.4 TUI API and adapt the question panel to its supported waiting-state controls.

### Out of scope

- Changing question controls, answer results, or global Pi terminal settings.

### Existing behavior to preserve

- The question remains an interactive-terminal-only custom component.
- Pi resumes normal working feedback after an answer or an error.

### Acceptance

- Opening an `ask_user` panel hides Pi's working indicator.
- Closing or failing the panel restores normal working feedback.

## Open questions

- None.

## Decisions

- 2026-09-02: Use public `ctx.ui.setWorkingVisible()` around `ctx.ui.custom()` rather than accessing TUI internals. Pi's default working loader repaints every 80 ms during the active tool call; that is the extension-controlled source of sustained redraws.
- 2026-09-02: Do not modify terminal-progress configuration. It is a user-level Pi setting, disabled by default, and its 1-second OSC keepalive is outside the extension API.

## Plan

- Pause working feedback before showing the question panel.
- Restore it in `finally` after the panel resolves or fails.
- Update public documentation and validate package loading.

## Implemented so far

- Paused Pi's working animation while the question panel is open and restored it with `finally`.
- Updated README and CHANGELOG.

## Checks

- Passed: `npm run smoke`.
- Passed: `npm pack --dry-run`.
- Passed: `git diff --check`.

## Review / next slice

- Ready for review: working animation is paused only while the question panel is open.

## Notes

- Pi 0.84.4's `Loader` requests a render every 80 ms while a tool remains active. Pi's terminal-progress OSC keepalive runs every second only when the user enables terminal progress in Pi settings.
