# Mode: build

Implement a dashboard from a confirmed brief. Run `init` first if there is no confirmed data source.

## 1. Gate on the brief

Stop unless the data source is confirmed: a repository source with manual confirmation, or a user-defined source with its licence and URL. Never fall back to fixtures, sample data or generated values.

## 2. Plan the contract

1. Read the AGENTS.md files listed in `init` step 1.
2. Inspect an existing board with a similar page or chart. Check the real exports and types of any shared component before using it.
3. Define the backend contract first: routes `/<board-id>/<page>/<endpoint>`, query parameters and response shapes `{ data, provenance }`. Agree it before building.

## 3. Scaffold the board

Board id: kebab-case, identical to the folder name and to the `id` of the MongoDB `boards` document. Use the template as a reference, not a generator to copy in full.

### Client (`client/src/boards/<board-id>/`)

1. Create only the files needed. Rename `TemplateRoutes` if the template is the starting point.
2. Create or adapt `routes.tsx` and the pages.
3. Update `title-i18n.json` (`fr` required, `en` if multilingual) and the `i18n.json` files of the layouts and sidemenu.
4. Add `sitemap-config.ts` exporting `SITEMAP: BoardSitemapConfig` (example: `client/src/boards/devenir-etudiants/sitemap-config.ts`). It feeds the site map and the footer.
5. Do **not** edit `client/src/router.tsx`. Board routes are loaded dynamically from the MongoDB list.

### Server (`server/src/routes/boards/<board-id>/`, every board has its own router)

1. Create `index.js`, which aggregates `routes/*.js` (see the template). Do not add a `data/` folder or fixtures.
2. Each route: `router.route("/<board-id>/<page>/<endpoint>")`. Response in the { data, provenance } format, ready for auditing: filters, aggregations, rates, rankings, sorting, and top-N calculations are performed in the route (Mongo pipeline or server-side code), never left to the browser.
Any metric that users can change must either be a validated route parameter or already be available for every value in the response.
Example: server/src/routes/boards/european-projects/routes/horizon-europe/overview/programs-funding/index.js. Validate parameters by throwing the error classes in `server/src/commons/errors` (for example `BadRequestError`). `checkQuery` in `server/src/routes/utils.js` does not stop the handler. Use Mongo through `server/src/services/mongo.js` only once the source is confirmed. 
3. Data source: only the one confirmed in step 1. Isolate data access in a board helper, so the source can change without changing the route path or the response shape. If the source is new (not a repository source), ask before writing code whether it is a **common service** (`server/src/services/`, reusable by other boards) or a **board-only** build (`server/src/routes/boards/<board-id>/`). Default to board-only.
4. Register the router in `server/src/router.js` (import and `router.use`, alphabetical order).
5. Add `api-tests/<page>/*.http` files (for example `GET http://localhost:3000/api/<board-id>/...`).
6. Shared or dedicated code: before writing a helper, search `server/src/commons`, `server/src/services`, `routes/utils.js` and the other boards. Keep in the board anything that depends on the dataset (pipelines, collection names, filter vocabularies, response shaping). Move code to `commons` or `services` only when a second board already uses it. List candidates instead of editing shared code (see the README, "Common or dedicated code").

## 4. Charts and UI

- For each chart, follow [chart](../../chart/SKILL.md). Charts call only the board's own routes, use `ChartWrapper`, and handle loading, error and empty states.
- For layout, components and styling, follow [dsfr](../../dsfr/SKILL.md). Use DSFR tokens, not hard-coded colours.

## 5. Manifest (only when a portable bundle is requested)

Write `board.manifest.json` at the board root and check it against `plugins/tableaux/reference/manifest.json`. Confirm that every route starts with `/<board-id>/`. Record the target confirmations for repository sources in `data_sources`. The manifest is documentation: it is not a registration or a permission.

## 6. Registration

The board appears only when a record exists in the MongoDB `boards` collection (`id`, `name_fr`, `name_en`, `description_fr`, `description_en`, `url`, and optionally `homePageVisible`, `isMultilingual`). Locally, use `POST /api/admin/add-dashboard` or the `/admin` page (disabled in production). For production, see the README section on it. Do not write to the database without explicit approval from the user. Creating a prototype does not imply registration, and no production metadata is changed without a clear request and human approval.

Do not assume a board folder is private, and do not expose credentials in client code.

## 7. Charts registry

If a chart must be embeddable in an iframe, add it to `client/src/boards/integration/charts-registry.tsx` with the same `id`.

## 8. Checks

1. Run `npm run build` from the repository root. On Windows it fails on `rm -rf`; in that case run `npm -w client run build` and say so. `npm -w client run lint` is not configured.
2. Exercise the routes with the `.http` files.
3. If a local preview is available, give the route `http://localhost:5173/<board-id>` and ask for a manual check of responsive layout, themes, keyboard use, and empty or error states.
4. Run the [accessibility](./accessibility.md) checklist on the UI and fix blocking findings before reporting.

## 9. Report

List the files changed, the confirmed data source, the check results (with checks that were not run), accessibility findings still open, proposed common-code extractions, and what promotion needs: a matching MongoDB `boards` record, the confirmed data source wired in the routes, owner review of the routes, and an optional chart registry entry. Do not register the board, deploy, create a branch or open a pull request unless asked.
