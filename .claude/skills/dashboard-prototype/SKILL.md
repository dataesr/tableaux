---
name: dashboard-prototype
description: "Plan and deliver a dashboard prototype in the dataesr/tableaux repository end to end (client board + server routes + fixtures + manifest + promotion notes). Use when the request is a whole dashboard idea or prototype; for scaffolding only use new-board, for a single chart use new-chart."
argument-hint: "Describe the dashboard, its audience, and the data it should show"
---

# Prototype a tableaux dashboard

Create a maintainable board using this repository's React application, Express server, and established board patterns. This workflow does not register a production dashboard, approve data access, or deploy a preview. It orchestrates the `new-board`, `new-chart`, and `dsfr` skills.

## Procedure

1. Read the root `AGENTS.md`, `client/src/boards/AGENTS.md`, `server/src/routes/boards/AGENTS.md`, and `docs/dashboard-prototyping/README.md`.
2. Clarify whether the request is a visual prototype or a production candidate, the intended audience, key interactions, and the data required. If a required decision is unknown, proceed with synthetic fixtures and state the assumption.
3. Inspect `client/src/boards/template/`, `server/src/routes/boards/template/`, and one existing board with a similar page or chart. Check the actual exports and types of any shared component before using it.
4. Define the backend contract first: the board's routes (`/<board-id>/<page>/<endpoint>`), query parameters, and response shapes.
5. Create the server router `server/src/routes/boards/<board-id>/` with those routes, serving synthetic or public JSON from its `fixtures/` folder, plus an `api-tests/**/*.http` file. Mount it in `server/src/router.js`. Isolate data access so promotion replaces it without changing the contract. Every board has a server router, even a fixture-only one.
6. Create the client under `client/src/boards/<board-id>/`, following the nearest routes, layout, page, styles, i18n, and data-query patterns. Charts call only the board's own routes; never `/elasticsearch` or any other service, and never import fixtures into the client. Reuse installed dependencies; do not install packages without approval.
7. Decide common versus dedicated code: search `server/src/commons`, `server/src/services`, `server/src/routes/utils.js`, and other boards for an equivalent before writing a helper. Keep dataset-specific code in the board. Do not edit shared code for one board; list reusable candidates for the reviewer.
8. Create `board.manifest.json` at the board root when a portable prototype is requested: `data_mode`, `data_sources`, `routes` (the contract from step 4), `common_candidates`, and `features`. Check it against `docs/dashboard-prototyping/board.manifest.schema.json`. A read-only preview source may be used only when its owner, exact datasets, environment, and access controls were approved; describe that approval in the manifest. The manifest is documentation, not runtime registration or permission.
9. Do not add MongoDB board records, alter deployment settings, or add a chart to the iframe registry unless the user explicitly asks and the relevant owner approves. Explain what promotion requires: matching MongoDB `boards.id`, replacing fixture data access with the approved source, owner review of the routes, and an optional chart registry entry.
10. Run the checks documented in the root `AGENTS.md` and exercise the routes with the `.http` file where possible. Report failures and any unavailable tests; do not claim unrun checks passed.
11. Summarize files changed, data assumptions, validation results, proposed common extractions, and outstanding human approvals. Do not open a pull request or create a bot branch unless explicitly requested.
