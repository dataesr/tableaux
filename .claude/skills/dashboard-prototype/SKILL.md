---
name: dashboard-prototype
description: "Plan and deliver a whole dashboard prototype in dataesr/tableaux: clarify the request, fix the route contract, orchestrate new-board / new-chart / dsfr, write the manifest, and report promotion needs. Use when the request is a dashboard idea or prototype; for scaffolding only use new-board, for a single chart use new-chart."
argument-hint: "Describe the dashboard, its audience, and the data it should show"
---

# Prototype a tableaux dashboard

Orchestrator only. It plans and reports; the file-level recipes live in the other skills, so do not duplicate them here:

- `new-board`: client folder, i18n, sitemap, server router, `.http` tests, mounting, registration rules.
- `new-chart`: one Highcharts chart.
- `dsfr`: UI and styling.

This workflow never registers a dashboard, approves data access or deploys a preview.

## Procedure

1. Read the root `AGENTS.md`, `client/src/boards/AGENTS.md`, `server/src/routes/boards/AGENTS.md` and `docs/dashboard-prototype/README.md`.
2. Clarify: visual prototype or production candidate, audience, key interactions, data needed. If a decision is unknown, proceed with synthetic fixtures and state the assumption.
3. Inspect an existing board with a similar page or chart. Check the real exports and types of any shared component before using it.
4. Define the backend contract first: routes (`/<board-id>/<page>/<endpoint>`), query parameters, response shapes. Get it agreed before building.
5. Build with `new-board` (scaffold, server router with synthetic or public fixtures), then `new-chart` per chart and `dsfr` for UI. Charts call only the board's own routes.
6. Decide common versus dedicated code (see the README, "Common or dedicated code"). Keep dataset-specific code in the board; list reusable candidates instead of editing shared code.
7. Write `board.manifest.json` at the board root when a portable prototype is requested. Validate it against `docs/dashboard-prototype/board.manifest.schema.json`. A read-only preview source needs an approval described in the manifest. The manifest is documentation, not registration or permission.
8. Run the checks from the root `AGENTS.md` and exercise the routes with the `.http` file. Report failures and checks that do not exist; never claim unrun checks passed.
9. Summarise: files changed, data assumptions, validation results, proposed common extractions, and what promotion requires (matching MongoDB `boards.id`, approved data source replacing fixtures, owner review of the routes, optional chart registry entry). Do not open a pull request or create a branch unless asked.
