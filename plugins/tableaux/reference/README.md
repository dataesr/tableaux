# Dashboard prototyping conventions

This document describes the current tableaux architecture for AI-assisted dashboard work. It is not an authorization to access every service present in the repository. Authenticated sources need the developer's manual confirmation before use (see the Data sources section).

## Scope and status

- Prototype data comes from a data source the user chooses at the start: a repository data source (MongoDB, Elasticsearch, Paysage, ODS) or a user-defined source. There are no fixtures and no generated sample data. A repository source requires the developer's manual confirmation and read access.
- The backend is the existing Node.js/Express service; do not add a Python/FastAPI service.
- Discovery and manifest-validation tools exist in the separate `dataesr-mcp` repository (`/tableaux` endpoint) but are not deployed. They read this repository from GitHub (branch `staging` by default), so `index.json` must be pushed before they work. They validate the manifest and do static bundle checks only, not generated code. No isolated sandbox exists for executing generated projects.
- Chat workflow gap: the MCP can plan and validate but cannot produce a board file bundle from chat. A `scaffold_board(id, routes)` tool that returns a bundle to import is a candidate future addition; it is not implemented.
- Open decisions: approved preview datasets and their owners, whether to add executable sandbox validation, and whether submission stays manual import/review or moves to a restricted bot branch/PR flow.

## Board model

There is one prototype profile: a **board** made of a client folder and its own server routes. The browser calls only the board's routes (`/<board-id>/...`); those routes read the data. The data source is a server-side concern, so promotion can change the data access inside the route and leave the URL, response shape, and client code unchanged.

| Part | Location | Notes |
| --- | --- | --- |
| Client board | `client/src/boards/<board-id>/` | Follows `client/src/boards/template/` |
| Server routes | `server/src/routes/boards/<board-id>/` | Mounted from `server/src/router.js`; follows `server/src/routes/boards/template/` |
| Data access | Inside the board's routes | Repository or user-defined source, see Data sources |

## Repository-native layout and registration

Work directly in `client/src/boards/<board-id>/` and `server/src/routes/boards/<board-id>/`. A generated board should use the existing route/page/component conventions instead of adding a parallel `web/` application.

The root router obtains board records from `/admin/list-dashboards` and dynamically imports `client/src/boards/<record.id>/routes.tsx`. A folder alone does not publish a dashboard. Production registration additionally requires a MongoDB `boards` record whose `id` matches the folder. Do not create or update production records during prototyping. Treat registration as a human-reviewed promotion step.

The Express API is in `server/`. Every board creates its router and mounts it in `server/src/router.js`, even when its data source is user-defined. The server connects to MongoDB at startup, so running any board locally requires the MongoDB that repository developers already have. Backend work is still reviewed by the data owner: identify data ownership, input validation, and deployment exposure.

The chart iframe integration is a separate surface. When explicitly requested, follow `client/src/boards/integration/README.md` and register the chart in `client/src/boards/integration/charts-registry.tsx`.

## Existing implementation references

- **Board routes/layout:** `client/src/boards/template/routes.tsx`, `client/src/boards/template/components/layouts/global-layout.tsx`, `client/src/boards/template/components/layouts/sidemenu-layout.tsx`.
- **Page composition:** `client/src/boards/template/pages/home/index.tsx` and `client/src/boards/template/pages/overview/index.tsx`.
- **Chart wrapper:** `client/src/components/chart-wrapper/index.tsx`, `ChartWrapper({ config, options, constructorType?, hideTitle?, legend?, renderData? })`.
- **Chart options:** `client/src/components/chart-wrapper/default-options.ts`, `createChartOptions(type, options)`, the shared form of `european-projects`' `CreateChartOptions`. Every chart builds its Highcharts options with it (DSFR tokens, fonts, axes, tooltip, accessibility defaults). It concatenates axis lists, so set `yAxis`/`xAxis` arrays after the call.
- **Chart reference (structure and data flow):** `client/src/boards/european-projects/pages/overview/charts/programs-funding/` (`index.tsx`, `query.tsx`, `options.tsx`, `utils.tsx` with `renderDataTable`) and its route `server/src/routes/boards/european-projects/routes/horizon-europe/overview/programs-funding/index.js`, which returns aggregates and success rates already computed.
- **Where computation happens:** on the server. Routes return chart-ready data (aggregated, ranked, sorted, cut to what is displayed); the client maps it to series and formats it. A local chart control (indicator, tab) is a route parameter or is already answered in the response, so switching is instant.
- **Chart loading and colors:** `client/src/components/charts-skeletons/` and `client/src/hooks/useChartColor.tsx`.
- **Chart example (component usage only):** `client/src/boards/template/pages/overview/charts/funded-labs/index.tsx` shows `ChartWrapper`, `useQuery`, skeletons and `useChartColor`. Like the other charts in that folder, it queries the production Elasticsearch proxy (`/elasticsearch`) directly from the browser and the template page does not render it. Do not copy that data access: a prototype's charts call the board's own server routes.
- **Server router:** `server/src/routes/boards/template/` is a minimal stub (`/template/overview/test`) with no data files. Add data access to a new board's router as described in "Board model" above.
- **Shared UI:** `client/src/components/` and `@dataesr/dsfr-plus`, already listed in `client/package.json`.

The examples show patterns, not a universal component API. Inspect actual exports and nearby usage before generating code.

## Data sources

| Source id | Repository implementation | Prototype status | Required substitute / approval |
| --- | --- | --- | --- |
| `mongodb` | `server/src/services/mongo.js` (and `mongo-accessibility.js`), read from board routes | Target confirmation | Developer confirms the exact collections and fields
| `elasticsearch` | Express `/elasticsearch` proxy (`ES_TOKEN_*`); several boards also call it from the browser | Target confirmation | Developer confirms the exact index and fields; read it server-side from the board's routes, not from the browser |
| `paysage` | `PAYSAGE_API_URL` / `PAYSAGE_API_KEY`, currently called separately from `atlas` and `european-projects` | Target confirmation | Developer confirms; reuse a shared client rather than a third copy |
| `ods` | `ODS_API_URL` / `ODS_API_KEY`, used by `structures-finance` | Target confirmation | Developer confirms |
| `external` | A public or user-defined source not hosted by the project (OpenAlex, EPO, Eurostat, a file the user supplies), called from the board's routes | Approval required | Record license, retrieval date and URL; a live call needs caching and a platform egress decision; |

Each source has a guide in [`guides/`](./guides/); the questions to ask before using a source are in [`guides/data-specs.md`](./guides/data-specs.md).

Repository sources (`mongodb`, `elasticsearch`, `paysage`, `ods`) are always read-only and their credentials are already configured, so no token is requested. The developer confirms, before any read, only the exact index or collection and the data classification. A new source needs its token name (never its value) confirmed as well. No credentials or production connection strings belong in this document.

[`index.json`](./index.json) is the machine-readable form of this document: guidance files, template paths, components, and the data sources above with their status. The `dataesr-mcp` `/tableaux` server reads it, the `AGENTS.md` files, the skills, the template files, and the manifest schema from GitHub at request time and stores nothing itself. When you add or move a template, guidance file, component, or data source, update `index.json` in the same change.

## Common or dedicated code

The existing board servers share infrastructure but almost no data logic: one MongoDB connection and `boards` collection, `server/src/commons/errors` (used by few boards), `routes/utils.js`, and duplicated Paysage client code. No two boards read the same dataset. Before writing a helper for a new board:

1. Search `server/src/commons`, `server/src/services`, `server/src/routes/utils.js`, and other boards' routers for an existing equivalent, and reuse it.
2. Put code in the board when it depends on its dataset: aggregation pipelines, collection names, filter vocabularies, response shaping. This is the default.
3. Extract to `commons`/`services` only domain-neutral infrastructure that a second board needs: error handling, query validation, caching, external-API clients (Paysage, ODS), database access. Extract after the second real use, not speculatively.
4. Never edit shared code silently for one board. List proposed extractions in the manifest's `common_candidates` and in the pull request for reviewer decision.

## Bundle manifest

`board.manifest.json` is proposed metadata kept at the board root when a generated bundle needs to travel separately. It does not replace dashboard metadata in MongoDB and is not consumed by the current runtime. Its useful part is the backend contract: `routes` lists the board's endpoints and `data_sources` what they read, so a data owner can review it before reading the code.

The JSON Schema is [`manifest.json`](./manifest.json). `id` must match the intended client and server folder names and, at promotion, the MongoDB `boards.id`; every route path must start with `/<id>/` (the schema cannot check this).

Example:

```json
{
  "$schema": "../../../../plugins/tableaux/reference/manifest.json",
  "schema_version": 1,
  "id": "research-funding",
  "name": "Research funding",
  "description": "Prototype of funding trends",
  "data_sources": ["mongodb"],
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

## Plugin skills

The workflow lives in the `tableaux` plugin at [`plugins/tableaux/`](../).

### Install with GitHub Copilot CLI

From the repository root:

```bash
copilot plugin install ./plugins/tableaux
```

### Install with Claude Code

The repository root holds a marketplace, [`.claude-plugin/marketplace.json`](../../../.claude-plugin/marketplace.json), that lists the `tableaux` plugin. From the repository root:

```bash
claude plugin marketplace add ./
claude plugin install tableaux@dataesr-tableaux --scope project
```

Or from a Claude Code session:

```text
/plugin marketplace add dataesr/tableaux
/plugin install tableaux@dataesr-tableaux
```

| Skill | Purpose |
| --- | --- |
| `/dashboard init` | Clarify the request and ask which data source to use (repository or user-defined), then the fields. Writes nothing. |
| `/dashboard build` | Build the board from a confirmed brief: scaffold, server router, charts (`chart`) and styling (`dsfr`). |
| `/dashboard critique` | Read-only checklist: usability, data correctness, DSFR use, infrastructure fit. |
| `/dashboard accessibility` | Read-only checklist for RGAA / WCAG 2.1 AA: keyboard, labels, contrast, chart text alternatives, headings. |
| `/chart new` | Add one Highcharts chart to a board page. |
| `dsfr` | DSFR components, layout and styling rules, used by the modes above. |

## Checks and delivery

Run the checks documented in the root `AGENTS.md` and report actual command outcomes.

At the time of writing:

```powershell
npm run build
```

`npm run build` runs TypeScript compilation and Vite. Client lint exists but currently depends on ESLint 9 flat-config migration. The repository has no configured unit/browser/accessibility test runner, generic scaffold/import command, or pull-request validation workflow. An external archive therefore needs human import/review and these local checks; do not describe it as automatically validated or production-ready.
