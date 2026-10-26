# Dashboard prototyping conventions

This catalogue documents the current tableaux architecture for AI-assisted dashboard work. It is not an authorization to access every service present in the repository. Data owners must approve preview sources before use.

## Supported profiles

| Profile id | Frontend | Backend/data access | Intended use |
| --- | --- | --- | --- |
| `tableaux-fixtures` | React + TypeScript in the existing Vite client | Local synthetic or public JSON fixtures; no backend change | Default prototype profile |
| `tableaux-existing-api` | React + TypeScript in the existing Vite client | Existing Node.js/Express endpoints | Only after the endpoint and dataset are approved for the prototype |

## Repository-native layout and registration

Work directly in `client/src/boards/<board-id>/` and follow `client/src/boards/template/`. A generated board should use the existing route/page/component conventions instead of adding a parallel `web/` application.

The root router obtains board records from `/admin/list-dashboards` and dynamically imports `client/src/boards/<record.id>/routes.tsx`. A folder alone does not publish a dashboard. Production registration additionally requires a MongoDB `boards` record whose `id` matches the folder. Do not create or update production records during prototyping. Treat registration as a human-reviewed promotion step.

The Express API is in `server/`. Board API modules are explicitly mounted in `server/src/router.js`. Backend work must be separately reviewed and must identify data ownership, input validation, route mounting, and deployment exposure.

The chart iframe integration is a separate surface. When explicitly requested, follow `client/src/boards/integration/README.md` and register the chart in `client/src/boards/integration/charts-registry.tsx`.

## Existing implementation references

- **Board routes/layout:** `client/src/boards/template/routes.tsx`, `client/src/boards/template/components/layouts/global-layout.tsx`, `client/src/boards/template/components/layouts/sidemenu-layout.tsx`.
- **Page composition:** `client/src/boards/template/pages/home/index.tsx` and `client/src/boards/template/pages/overview/index.tsx`.
- **Chart wrapper:** `client/src/components/chart-wrapper/index.tsx`, `ChartWrapper({ config, options, constructorType?, hideTitle?, legend?, renderData? })`.
- **Chart loading and colors:** `client/src/components/charts-skeletons/` and `client/src/hooks/useChartColor.tsx`.
- **Example chart API/query pattern:** `client/src/boards/template/pages/overview/charts/funded-structures/index.tsx`. This chart queries the production Elasticsearch service through `/elasticsearch`; it is an architectural example only. Do not copy its live data access into a prototype without explicit approval.
- **Shared UI:** `client/src/components/` and `@dataesr/dsfr-plus`, already listed in `client/package.json`.

The examples show patterns, not a universal component API. Inspect actual exports and nearby usage before generating code.

## Integration inventory

| Catalogue id | Repository implementation | Prototype status | Required substitute / approval |
| --- | --- | --- | --- |
| `fixtures.local-json` | Fixture files owned by the prototype | Allowed default when synthetic/public and non-sensitive | Keep fixtures small, representative, and free of production records |
| `tableaux.elasticsearch-proxy` | Express `/elasticsearch` proxy; frontend examples pass an index and Elasticsearch query | Not approved by this catalogue for prototype use | Use fixtures unless the Elasticsearch/data owner approves a specific preview index, read-only access, and data classification |
| `tableaux.board-api` | Board-specific Express routes, e.g. `/faculty-members/*`, `/structures-finance/*`, `/outcomes/*` | Endpoint- and dataset-specific; no blanket approval | Use fixtures unless the endpoint owner approves the preview data and access controls |
| `tableaux.mongodb` | Server-side MongoDB connections in `server/src/services/mongo.js` and related services | Not a frontend integration; no direct prototype access | Access only through an approved server endpoint; never expose MongoDB credentials or connect from browser code |

The repository does not establish a separate preview database, approved dataset list, or service-owner approvals. Mark an integration approved only after recording its owner, environment, allowed datasets/indexes, authentication, sensitivity, and fixture source. No credentials or production connection strings belong in this catalogue.

## Bundle manifest

`board.manifest.json` is proposed metadata kept at the board root when a generated bundle needs to travel separately. It does not replace dashboard metadata in MongoDB and is not consumed by the current runtime.

The JSON Schema is [`board.manifest.schema.json`](./board.manifest.schema.json). `id` must match the intended `client/src/boards/<id>/` directory and, at promotion, the MongoDB `boards.id`. `integrations` entries reference the catalogue above. Set `data_mode` to `fixtures` unless the exact preview source was approved; the schema cannot grant access.

Example:

```json
{
  "$schema": "../../../../docs/dashboard-prototyping/board.manifest.schema.json",
  "schema_version": 1,
  "id": "research-funding",
  "name": "Research funding",
  "description": "Synthetic prototype of funding trends",
  "architecture_profile": "tableaux-fixtures",
  "data_mode": "fixtures",
  "integrations": ["fixtures.local-json"],
  "features": ["filters", "time-series-chart", "data-table"]
}
```

## Checks and delivery

The repository's current frontend checks are:

```powershell
npm -w client run lint
npm run build
```

The build runs TypeScript compilation and Vite. The repository has no configured unit/browser/accessibility test runner, generic scaffold/import command, or pull-request validation workflow. An external archive therefore needs human import/review and these local checks; do not describe it as automatically validated or production-ready.
