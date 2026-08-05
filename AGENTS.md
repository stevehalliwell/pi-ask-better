# AGENTS.md

Project-specific agent notes only. Global Pi rules already apply.

Before committing: replace or delete every `[TBD]` item. Keep only verified, durable facts. Pi concatenates context files; refine global rules without contradicting them. State any narrow exception, condition, and reason.

## Read first

- `README.md` — public-facing project purpose, installation, usage, and brief developer setup; do not use it for current work or internal status.
- `.pi/attendant.tables` — configured record collections; run `attendant_schema` to discover every tracked table and fields before planning/querying.
- `.pi/handoff.md` — previous pickup summary, if present.
- Read specific record source paths only after `attendant_schema`, `attendant_query`, or `attendant_search` identifies them.

## Verified commands

- Setup/install: [TBD]
- Test: [TBD]
- Focused test: [TBD]
- Lint/typecheck/build: [TBD]
- Required order, prerequisites, expensive checks, bench/profile policy: [TBD]
- Local wrappers/skills: [TBD]

## Project map and coding rules

- Key source/test/config/generated paths: [TBD]
- Naming: [TBD]
- Formatting: [TBD]
- Error handling: [TBD]
- Ownership/lifetime/resources: [TBD]
- Public API compatibility: [TBD]
- Perf-sensitive areas: [TBD]
- Security/data constraints: Extensions run with the user's full system permissions; do not collect, log, or transmit question answers without explicit design approval.

## Protected paths

Do not edit unless task explicitly targets them or rule below says otherwise:

- Generated/build/cache: `.attendant/`
- Vendored/deps: [TBD]
- CI/release config: [TBD]
- Binary/media/serialized assets: [TBD]
- Lockfiles policy: [TBD]
- Backups/archives: [TBD]

## Project-specific doc policy

- `README.md`: public, human-first purpose, installation, usage, and brief developer setup; current state belongs in Attendant records or `.pi/handoff.md`, and detailed contributor instructions belong in `CONTRIBUTING.md` or another focused document.
- `CHANGELOG.md`: Keep notable released and unreleased user-facing changes.
- Attendant collections: canonical tracked state; discover configured collections with `attendant_schema`, query with Attendant, edit Markdown records as source.
- `.pi/handoff.md`: agent-only resume pointer; update via `/skill:wrap-up`; link records or include exact Attendant query.

## Done means here

- Project-specific acceptance: [TBD]
- Required validation commands and expected result: [TBD]
- Test/doc/update requirements for changed behavior: [TBD]
- If a required check cannot run, record blocker and remaining risk.
