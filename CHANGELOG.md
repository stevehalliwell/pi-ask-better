# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.4.0]

### Added

- Bounded, scrollable question panels in regular and fullscreen modes, with automatic focus visibility and current controls in the footer.
- Support for Pi's configured input-submit and selection navigation, confirmation, cancellation, and page bindings. Ctrl+C also cancels with default bindings.

### Fixed

- Declared the bundled `ask-user` skill in the Pi package manifest so plain package installs discover it.
- Pending panels now close on tool abort, return cancellation, and clean up abort listeners. Working animation restores after UI errors too.

### Changed

- Requires Pi 1.3.0+.
- `ask_user` uses model-only exposure: it stays directly available to the model in codemode-only mode and cannot be called by scripts or nested tools.
- Paused Pi's working animation while an `ask_user` panel is open, preventing continuous terminal redraws during a long wait.
- Strengthened always-active `ask_user` guidance: agents use the panel—not a prose question—for focused structured answers needed before continuing, while inspecting context first and proceeding with clear or reversible defaults.

## [0.3.0]

### Added

- A `yesNo: true` question format with fixed Yes/No choices and custom-text entry.
- A persistent `Enter custom text` choice that forces a typed custom answer even when it matches an option.

### Changed

- `ask_user` now requires options or `yesNo: true`; use Pi chat for unconstrained text questions.
- The free-text input cursor now redraws correctly after keyboard navigation.
- Strengthened bundled `ask-user` guidance so agents use the decision panel for presented alternatives and recommendation approval rather than ending with a prose question.

## [0.2.0]

### Added

- Option-level `recommended` defaults, visibly marked in the question panel.

### Changed

- Before typing or navigation, Enter accepts the recommended option or options; unmarked option questions fall back to the first choice.

## [0.1.0]

### Added

- Interactive terminal-only `ask_user` extension with free-text, option filtering, multi-select, and responsive previews.
- A packaged model-invoked `ask-user` skill for focused agent decisions and clarifications.
- Installation, usage, and result-contract documentation.
- A reusable non-interactive package smoke check.

### Changed

- `ask_user` is hidden outside Pi's interactive terminal mode.
- Text entry, paste, and editor shortcuts continue to work while an option has focus.
- The question panel now has labelled sections, clearer focus markers, and compact bordered hierarchy.
- In single-select questions, Enter selects a sole filtered option while text input remains active.
- Questions, option labels and descriptions, and previews support terminal-safe Markdown; narrow pipe tables retain their structure and truncate cell content.
