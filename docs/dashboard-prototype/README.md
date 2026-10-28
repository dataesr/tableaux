# Dashboard prototyping conventions

This document describes the current tableaux architecture for AI-assisted dashboard work. It is not an authorization to access every service present in the repository. Data owners must approve preview sources before use.

## Scope and status

- The pilot targets Claude Code in an IDE with repository access. Browser-only and repository-less workflows are out of scope for now.
- Prototype data is synthetic or public fixtures. Preview or production data requires explicit owner approval.
- The backend is the existing Node.js/Express service; do not add a Python/FastAPI service.
- Discovery and manifest-validation tools exist in the separate `dataesr-mcp` repository (`/tableaux` endpoint) but are not deployed. They read this repository from GitHub (branch `staging` by default), so `prototype.index.json` must be pushed before they work. They validate the manifest only, not generated code. No isolated sandbox exists for executing generated projects.
- Open decisions: approved preview datasets and their owners, whether to add executable sandbox validation, and whether submission stays manual import/review or moves to a restricted bot branch/PR flow.

## Board model

There is one prototype profile: a **board** made of a client folder and its own server routes. The browser calls only the board's routes (`/<board-id>/...`); those routes read the data. Fixtures are a data source of the server routes, not a separate architecture, so promotion replaces the data access inside the route and leaves the URL, response shape, and client code unchanged.

| Part | Location | Notes |
| --- | --- | --- |
| Client board | `client/src/boards/<board-id>/` | Follows `client/src/boards/template/` |
| Server routes | `server/src/routes/boards/<board-id>/` | Mounted from `server/src/router.js`; follows `server/src/routes/boards/template/` |
| Fixtures | `server/src/routes/boards/<board-id>/fixtures/*.json` | Synthetic or public only; read by the routes, never imported by the client |

## Repository-native layout and registration

Work directly in `client/src/boards/<board-id>/` and `server/src/routes/boards/<board-id>/`. A generated board should use the existing route/page/component conventions instead of adding a parallel `web/` application.

The root router obtains board records from `/admin/list-dashboards` and dynamically imports `client/src/boards/<record.id>/routes.tsx`. A folder alone does not publish a dashboard. Production registration additionally requires a MongoDB `boards` record whose `id` matches the folder. Do not create or update production records during prototyping. Treat registration as a human-reviewed promotion step.

The Express API is in `server/`. Every board creates its router and mounts it in `server/src/router.js`, even when it only serves fixtures. The server connects to MongoDB at startup, so running any board locally requires the MongoDB that repository developers already have. Backend work is still reviewed by the data owner: identify data ownership, input validation, and deployment exposure.

The chart iframe integration is a separate surface. When explicitly requested, follow `client/src/boards/integration/README.md` and register the chart in `client/src/boards/integration/charts-registry.tsx`.

## Existing implementation references

- **Board routes/layout:** `client/src/boards/template/routes.tsx`, `client/src/boards/template/components/layouts/global-layout.tsx`, `client/src/boards/template/components/layouts/sidemenu-layout.tsx`.
- **Page composition:** `client/src/boards/template/pages/home/index.tsx` and `client/src/boards/template/pages/overview/index.tsx`.
- **Chart wrapper:** `client/src/components/chart-wrapper/index.tsx`, `ChartWrapper({ config, options, constructorType?, hideTitle?, legend?, renderData? })`.
- **Chart loading and colors:** `client/src/components/charts-skeletons/` and `client/src/hooks/useChartColor.tsx`.
- **Chart example (component usage only):** `client/src/boards/template/pages/overview/charts/funded-labs/index.tsx` shows `ChartWrapper`, `useQuery`, skeletons and `useChartColor`. Like the other charts in that folder, it queries the production Elasticsearch proxy (`/elasticsearch`) directly from the browser and the template page does not render it. Do not copy that data access: a prototype's charts call the board's own server routes, which serve fixtures.
- **Server router:** `server/src/routes/boards/template/` is a minimal stub (`/template/overview/test`). Add fixture-backed routes and a `fixtures/` folder to a new board's router; see "Board model" above.
- **Shared UI:** `client/src/components/` and `@dataesr/dsfr-plus`, already listed in `client/package.json`.

The examples show patterns, not a universal component API. Inspect actual exports and nearby usage before generating code.

## Data sources

| Source id | Repository implementation | Prototype status | Required substitute / approval |
| --- | --- | --- | --- |
| `board-fixtures` | JSON files in the board's server folder, read by its routes | Allowed default when synthetic/public and non-sensitive | Keep fixtures small, representative, and free of production records |
| `mongodb` | `server/src/services/mongo.js` (and `mongo-accessibility.js`), read from board routes | Approval required | Use fixtures unless the data owner approves the exact collections and read-only access |
| `elasticsearch` | Express `/elasticsearch` proxy (`ES_TOKEN_*`); several boards also call it from the browser | Approval required | Use fixtures unless the data owner approves a specific index, read-only access, and data classification; read it server-side from the board's routes, not from the browser |
| `paysage` | `PAYSAGE_API_URL` / `PAYSAGE_API_KEY`, currently called separately from `atlas` and `european-projects` | Approval required | Use fixtures unless approved; reuse a shared client rather than a third copy |
| `ods` | `ODS_API_URL` / `ODS_API_KEY`, used by `structures-finance` | Approval required | Use fixtures unless approved |

The repository does not establish a separate preview database, approved dataset list, or service-owner approvals. Mark a source approved only after recording its owner, environment, allowed datasets/indexes, authentication, sensitivity, and fixture source. No credentials or production connection strings belong in this document.

[`prototype.index.json`](./prototype.index.json) is the machine-readable form of this document: guidance files, template paths, components, and the data sources above with their status. The `dataesr-mcp` `/tableaux` server reads it, the `AGENTS.md` files, the skills, the template files, and the manifest schema from GitHub at request time and stores nothing itself. When you add or move a template, guidance file, component, or data source, update `prototype.index.json` in the same change.

## Common or dedicated code

The existing board servers share infrastructure but almost no data logic: one MongoDB connection and `boards` collection, `server/src/commons/errors` (used by few boards), `routes/utils.js`, and duplicated Paysage client code. No two boards read the same dataset. Before writing a helper for a new board:

1. Search `server/src/commons`, `server/src/services`, `server/src/routes/utils.js`, and other boards' routers for an existing equivalent, and reuse it.
2. Put code in the board when it depends on its dataset: aggregation pipelines, collection names, filter vocabularies, response shaping. This is the default.
3. Extract to `commons`/`services` only domain-neutral infrastructure that a second board needs: error handling, query validation, caching, external-API clients (Paysage, ODS), database access. Extract after the second real use, not speculatively.
4. Never edit shared code silently for one board. List proposed extractions in the manifest's `common_candidates` and in the pull request for reviewer decision.

## Bundle manifest

`board.manifest.json` is proposed metadata kept at the board root when a generated bundle needs to travel separately. It does not replace dashboard metadata in MongoDB and is not consumed by the current runtime. Its useful part is the backend contract: `routes` lists the board's endpoints and `data_sources` what they read, so a data owner can review it before reading the code.

The JSON Schema is [`board.manifest.schema.json`](./board.manifest.schema.json). `id` must match the intended client and server folder names and, at promotion, the MongoDB `boards.id`; every route path must start with `/<id>/` (the schema cannot check this, the MCP validator does). Set `data_mode` to `fixtures` unless the exact preview source was approved; the schema cannot grant access.

Example:

```json
{
  "$schema": "../../../../docs/dashboard-prototype/board.manifest.schema.json",
  "schema_version": 1,
  "id": "research-funding",
  "name": "Research funding",
  "description": "Synthetic prototype of funding trends",
  "data_mode": "fixtures",
  "data_sources": ["board-fixtures"],
  "routes": [
    {
      "method": "GET",
      "path": "/research-funding/overview/funding-by-year",
      "description": "Projects funded per year"
    }
  ],
  "common_candidates": [],
  "features": ["filters", "time-series-chart", "data-table"]
}
```

## Checks and delivery

Run the checks documented in the root `AGENTS.md` and report actual command outcomes.

At the time of writing:

```powershell
npm run build
```

`npm run build` runs TypeScript compilation and Vite. Client lint exists but currently depends on ESLint 9 flat-config migration. The repository has no configured unit/browser/accessibility test runner, generic scaffold/import command, or pull-request validation workflow. An external archive therefore needs human import/review and these local checks; do not describe it as automatically validated or production-ready.
