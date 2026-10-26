---
name: dashboard-prototype
description: "Prototype or add a dashboard in the dataesr/tableaux repository. Use when creating a board, chart, dashboard page, fixture-driven visualization, or planning its promotion."
argument-hint: "Describe the dashboard, its audience, and the data it should show"
---

# Prototype a tableaux dashboard

Create a maintainable board using this repository's React application and established board patterns. This workflow does not register a production dashboard, approve data access, or deploy a preview.

## Procedure

1. Read the root `AGENTS.md`, `client/src/boards/AGENTS.md`, and `docs/dashboard-prototyping/README.md`.
2. Clarify whether the request is a visual prototype or a production candidate, the intended audience, key interactions, and the data required. If a required decision is unknown, proceed with synthetic fixtures and state the assumption.
3. Inspect `client/src/boards/template/` and one existing board with a similar page or chart. Check the actual exports and types of any shared components before using them.
4. Keep frontend files under `client/src/boards/<board-id>/`, following the nearest existing routes, layout, page, styles, i18n, and data-query patterns. Reuse installed dependencies; do not create a second app or install packages without approval.
5. Use synthetic or public fixtures by default. Do not copy live query data or call a production endpoint. A read-only preview may be used only when its owner, exact datasets, environment, and access controls have been approved; describe that approval in the manifest.
6. Create `board.manifest.json` at the board root when a portable prototype is requested. Check it against `docs/dashboard-prototyping/board.manifest.schema.json`. The manifest is documentation, not runtime registration or permission.
7. Do not add MongoDB board records, mount server endpoints, alter deployment settings, or add a chart to the iframe registry unless the user explicitly asks and the relevant owner approves. Explain what promotion requires: matching MongoDB `boards.id`, frontend `routes.tsx`, any required Express route mounting, and optional chart registry entry.
8. Run `npm -w client run lint` and `npm run build` for frontend changes. Report failures and any unavailable tests; do not claim unrun checks passed.
9. Summarize files changed, data assumptions, validation results, and outstanding human approvals. Do not open a pull request or create a bot branch unless explicitly requested.
