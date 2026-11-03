# Repository guidance

## Project structure

- The application is an npm workspace. Use Node.js 24; do not introduce pnpm-only commands.
- The frontend is React + TypeScript + Vite in `client/`; the backend is Express in `server/`.
- Boards live in `client/src/boards/<board-id>/`. Read the board-specific guidance in `client/src/boards/AGENTS.md` before changing a board.
- Board records are stored in MongoDB and returned by `/admin/list-dashboards`. The frontend dynamically imports a board's `routes.tsx` using its record id. Creating a folder alone does not publish a board.
- Server route modules are explicitly mounted from `server/src/router.js`. Read `server/src/routes/boards/AGENTS.md` before changing board APIs.
- See `plugins/tableaux/reference/README.md` for the prototype architecture, component references, manifest and data-source constraints.
- The `dashboard` skill (modes `init`, `build`, `critique`, `accessibility`) and the `chart` and `dsfr` skills live in the `tableaux` plugin under `plugins/tableaux/skills/`. For DSFR UI and styling, consult `plugins/tableaux/skills/dsfr/SKILL.md`.
- See `plugins/tableaux/reference/url-parameters.md` for URL and API parameter names shared across boards.

## Runtime and commands

- Main local commands are `npm start`, `npm run build`, and `npm run build:staging` from the repository root.
- `npm run build` is the primary frontend verification command because it runs TypeScript compilation and Vite build through the workspace scripts.
- The repository currently has no package-script unit or browser test suite. API behavior is commonly checked with `.http` request files under `server/src/routes/**/api-tests/`.
- `npm -w client run lint` exists but currently depends on an ESLint 9 flat-config migration that is not yet in place in this repository. Report this status explicitly when validation is requested.

## Safety and data

- Never include credentials, production records, or confidential data in prompts, logs, or generated files. Do not create sample or fixture data for a dashboard; ask which data source to use (a repository source or a user-defined one) first.
- Authenticated data sources (MongoDB, Elasticsearch, Paysage, ODS) are read-only only. The credentials are already configured on the server, so only the exact index or collection and the data classification need developer confirmation. A new source (not in the table above) also needs its token name, never its value, confirmed. Ask the questions in `plugins/tableaux/reference/guides/data-specs.md` first, and ask about fields before coding.
- Do not create or modify MongoDB dashboard records, deployment settings, secrets, or production routes as part of prototyping without an explicit human-approved task.
- Never read or print `.env` files or expose credentials. Client-side `VITE_*` variables are included in the built bundle and must not contain secrets.

## Architecture and conventions

- Use `ChartWrapper` for Highcharts, with `useQuery` keys containing all relevant filters. Handle loading, error, and empty states explicitly; keep expected data errors on the page so users can adjust filters.
- Every data-driven block — chart, KPI card, data table, list of results — is greyed out as soon as it is being recomputed, so that a stale value is never mistaken for the current selection. Use a skeleton only for the first load. Afterwards keep the previous content (`placeholderData: keepPreviousData`) and cover it with an overlay showing a loading indicator, with `aria-busy`, for the whole recomputation: while the API call is pending (`isPlaceholderData`) and while the block is re-rendered after new data or a local control change (indicator, tab, sort), including a synchronous Highcharts redraw (apply the new value only after the overlay has been painted). Titles, comments, legends and tables describe the displayed data, not the pending one. Reference implementation: `client/src/boards/suivi-recherche/components/chart-busy/` (overlay) and `client/src/boards/suivi-recherche/hooks/use-render-transition.ts` (applies a new value only after the overlay is painted); propose moving them to `client/src/components/` when a second board needs them.
- Build every Highcharts options object with `createChartOptions(type, options)` from `client/src/components/chart-wrapper/default-options.ts` (the shared version of `european-projects`' `CreateChartOptions`): it applies the DSFR theme tokens, fonts, axes, tooltip, legend, credits and accessibility defaults. Pass only chart-specific options; do not restate those defaults or build a raw options object.
- Compute on the server, not in the browser. Filtering, aggregation, joins, ratios and success rates, rankings, sorting, top-N, period comparisons and derived geometry belong in the board's server route (MongoDB pipeline or route code, cached when the input is static), which returns chart-ready data sized to what is displayed. The client only maps that response to series, formats labels and renders. `european-projects` is the reference (e.g. `/european-projects/overview/programs-funding` returns totals and `successRateByProgram` already computed).
- A local control (indicator, metric, tab, sort) must switch the chart instantly. Either the route returns ready-to-plot values for every option of the control, or the control is a query parameter of the route so each answer is fetched once and cached by `useQuery`. Never recompute a full dataset on each toggle; wrap any remaining client-side mapping in `useMemo` keyed on the data and the control.
- Name URL parameters as described in `plugins/tableaux/reference/url-parameters.md`: `snake_case`, the shared vocabulary for shared notions (`section` for the selected tab of a page, `paysage_id` / `ror_id` for structures, `year`, `year_min` / `year_max`, `region`, `country_code`, `language`), the same names in the page URL and the API route, no default value written to the URL, and old names rewritten so that existing links keep working.
- Follow the nearest board's i18n pattern. Provide French text and English text when the board is multilingual.
- Every board has its own server router under `server/src/routes/boards/<board-id>/`, even when it serves a user-defined public source, so that promotion replaces data access without changing the client contract.
- Keep code dedicated to the board by default. Reuse existing `server/src/commons` and `server/src/services` code, and extract domain-neutral infrastructure into them only when a second board needs it; see `plugins/tableaux/reference/README.md` ("Common or dedicated code").
- Keep shared components shared only when a second board needs them. Boards must not import from one another except through `boards/integration/charts-registry.tsx`.
- For new server routes, use the shared error classes and error middleware; use the repository logger instead of `console.log`.
- Follow neighboring file conventions for imports, extensions, formatting, and language.
- DSFR JavaScript is not loaded in this project. Do not rely on DSFR JS-only behaviors; use dsfr-plus components, native HTML behavior, or explicit React state.
- Do not invent DSFR markup from memory. Verify actual component APIs and examples before writing raw `fr-*` markup.
- Do not hard-code colors or rely on inline layout styles in new UI code; use DSFR tokens/utilities and existing board styling patterns.

## Git and delivery conventions

- Day-to-day work happens on `staging`; `main` is updated through deployment flow.
- Do not run `npm run deploy:*` or its pre/postdeploy scripts from agent tasks; these commands bump versions, merge branches, and push tags.
- Keep pull requests focused and call out any required human approvals (dashboard registration, backend exposure, and preview data access).

## Validation

- Available checks include `npm run build` and, when lint configuration is migrated, `npm -w client run lint`.
- No repository-wide PR validation or package-script test suite is configured. Report checks that do not exist instead of claiming they passed.
- Keep pull requests focused and describe required dashboard registration, server changes, data access, and checks that remain for a human reviewer.
