# Board development guidance

- Read `client/src/boards/template/routes.tsx` and the relevant files under `client/src/boards/template/` before creating a board. Also inspect one existing board with similar pages or charts; the template is an example, not a generator or a complete design system.
- Keep board code under `client/src/boards/<board-id>/`. Follow local conventions for `routes.tsx`, page/layout components, `components/`, `pages/`, `styles.scss`, and `i18n` JSON where applicable.
- Use React + TypeScript and the versions already installed in the npm workspace. Prefer existing DSFR, shared components, chart wrappers, hooks, and utilities over new packages or bespoke equivalents.
- For DSFR markup, accessibility, and styling, follow `.claude/skills/dsfr/SKILL.md`; inspect actual component types and nearby usage instead of guessing props.
- For Highcharts visualizations, inspect `client/src/components/chart-wrapper/index.tsx` and existing board charts. Pass the wrapper's `config` and `options`; use existing skeletons and chart-color hooks where suitable.
- Keep data access out of presentational components where practical; follow the closest existing board's API/query pattern. Check response handling and loading, error, and empty states rather than assuming a successful JSON response.
- Prototype with synthetic fixture data by default. Do not copy live query payloads or production endpoints from example charts without explicit data-owner approval. Never put service credentials in client code.
- Do not assume a board folder is private or published automatically. A production dashboard needs a MongoDB `boards` record with the matching `id`; its route is dynamically imported using that id. Do not create or change that record as part of a prototype unless explicitly requested and approved.
- Adding or changing a backend endpoint is a separate change: follow `server/src/routes/boards/AGENTS.md` and identify required route mounting and owner review.
- If exposing an individual chart through the iframe integration surface, follow `client/src/boards/integration/README.md` and add it to `charts-registry.tsx` only when explicitly requested.
- Run the checks documented in the root `AGENTS.md` and report any test coverage or checks that are unavailable.
