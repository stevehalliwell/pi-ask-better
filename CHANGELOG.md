# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Interactive terminal-only `ask_user` extension with free-text, option filtering, multi-select, and responsive previews.
- Installation, usage, and result-contract documentation.
- A reusable non-interactive package smoke check.

### Changed

- `ask_user` is hidden outside Pi's interactive terminal mode.
- Text entry, paste, and editor shortcuts continue to work while an option has focus.
- The question panel now has labelled sections, clearer focus markers, and compact bordered hierarchy.
- In single-select questions, Enter selects a sole filtered option while text input remains active.
