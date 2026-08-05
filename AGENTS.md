# AGENTS.md

Project-specific agent notes only. Global Pi rules already apply.

Before committing: keep only verified, durable facts. Pi concatenates context files; refine global rules without contradicting them. State any narrow exception, condition, and reason.

## Read first

- `README.md` — public-facing project purpose, installation, usage, and brief developer setup; do not use it for current work or internal status.
- `.pi/attendant.tables` — configured record collections; run `attendant_schema` to discover every tracked table and fields before planning/querying.
- `.pi/handoff.md` — previous pickup summary, if present.
- Read specific record source paths only after `attendant_schema`, `attendant_query`, or `attendant_search` identifies them.

## Verified commands

- Setup/install: Node.js 22.19+ and Pi 0.83.0+; Pi provides the extension's peer dependencies at runtime.
- Test: `npm run smoke` (requires a configured Pi model).
- Focused test: `PI_SKIP_VERSION_CHECK=1 pi --no-extensions -e ./index.ts --no-session -p "Reply with exactly: ok"`.
- Lint/typecheck/build: none configured; Pi loads TypeScript extensions through jiti.
- Packaging check: `npm pack --dry-run`.
- Required order: run smoke, packaging, and `git diff --check` before release or commit when applicable.

## Project map and coding rules

- Extension entry point: `index.ts`.
- Reusable checks: `scripts/`.
- Public package metadata: `package.json`; public documentation: `README.md`; release notes: `CHANGELOG.md`.
- Naming/formatting: TypeScript uses two-space indentation, double quotes, and semicolons.
- Error handling: extension tool failures must return useful tool results or throw genuine execution errors; terminal-only interactions must remain unavailable outside TUI mode.
- Public API compatibility: preserve the documented `ask_user` result contract unless a task explicitly changes it.
- Security/data constraints: extensions run with the user's full system permissions; do not collect, log, or transmit question answers without explicit design approval.

## Protected paths

Do not edit unless task explicitly targets them or rule below says otherwise:

- Generated/build/cache: `.attendant/`
- Installed dependencies: `node_modules/`
- CI/release config: none exists.
- Binary/media/serialized assets: none exists.
- Lockfiles: do not add one unless runtime dependencies are introduced and the user approves the install.
- Backups/archives: none exists.

## Project-specific doc policy

- `README.md`: public, human-first purpose, installation, usage, and brief developer setup; current state belongs in Attendant records or `.pi/handoff.md`, and detailed contributor instructions belong in `CONTRIBUTING.md` or another focused document.
- `CHANGELOG.md`: Keep notable released and unreleased user-facing changes.
- Attendant collections: canonical tracked state; discover configured collections with `attendant_schema`, query with Attendant, edit Markdown records as source.
- `.pi/handoff.md`: agent-only resume pointer; update via `/skill:wrap-up`; link records or include exact Attendant query.

## Done means here

- `ask_user` remains an interactive-terminal-only Pi extension with documented controls and result behavior.
- Run `npm run smoke`, `npm pack --dry-run`, and `git diff --check`; record any check that cannot run and its risk.
- Update README and CHANGELOG for user-facing behavior changes.
