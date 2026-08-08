# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

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
