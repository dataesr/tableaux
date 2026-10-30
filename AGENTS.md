# Repository guidance

## Project structure

- The application is an npm workspace. Use Node.js 24; do not introduce pnpm-only commands.
- The frontend is React + TypeScript + Vite in `client/`; the backend is Express in `server/`.
- Boards live in `client/src/boards/<board-id>/`. Read the board-specific guidance in `client/src/boards/AGENTS.md` before changing a board.
- Board records are stored in MongoDB and returned by `/admin/list-dashboards`. The frontend dynamically imports a board's `routes.tsx` using its record id. Creating a folder alone does not publish a board.
- Server route modules are explicitly mounted from `server/src/router.js`. Read `server/src/routes/boards/AGENTS.md` before changing board APIs.
- See `docs/dashboard-prototype/README.md` for the prototype architecture, component references, manifest and data-source constraints.
- For DSFR UI and styling, consult `.claude/skills/dsfr/SKILL.md`; use the board and chart skills for those focused workflows.

## Runtime and commands

- Main local commands are `npm start`, `npm run build`, and `npm run build:staging` from the repository root.
- `npm run build` is the primary frontend verification command because it runs TypeScript compilation and Vite build through the workspace scripts.
- The repository currently has no package-script unit or browser test suite. API behavior is commonly checked with `.http` request files under `server/src/routes/**/api-tests/`.
- `npm -w client run lint` exists but currently depends on an ESLint 9 flat-config migration that is not yet in place in this repository. Report this status explicitly when validation is requested.

## Safety and data

- Use synthetic or public data in prompts and checked-in fixtures. Never include credentials, production records, or confidential data in prompts, fixtures, logs, or generated files.
- A read-only preview source may be used only after its owner, datasets, environment, and access controls have been explicitly approved.
- Do not create or modify MongoDB dashboard records, deployment settings, secrets, or production routes as part of prototyping without an explicit human-approved task.
- Never read or print `.env` files or expose credentials. Client-side `VITE_*` variables are included in the built bundle and must not contain secrets.

## Architecture and conventions

- Use `ChartWrapper` for Highcharts, with `useQuery` keys containing all relevant filters. Handle loading, error, and empty states explicitly; keep expected data errors on the page so users can adjust filters.
- Follow the nearest board's i18n pattern. Provide French text and English text when the board is multilingual.
- Every board has its own server router under `server/src/routes/boards/<board-id>/`, even when it only serves synthetic or public fixtures, so that promotion replaces data access without changing the client contract.
- Keep code dedicated to the board by default. Reuse existing `server/src/commons` and `server/src/services` code, and extract domain-neutral infrastructure into them only when a second board needs it; see `docs/dashboard-prototype/README.md` ("Common or dedicated code").
- Keep shared components shared only when a second board needs them. Boards must not import from one another except through `boards/integration/charts-registry.tsx`.
- For new server routes, use the shared error classes and error middleware; use the repository logger instead of `console.log`.
- Follow neighboring file conventions for imports, extensions, formatting, and language.
- DSFR JavaScript is loaded by `DSFRConfig` (`client/src/main.tsx`) and drives the modals of the shared Header and Footer (menu, theme, language). Outside those, do not rely on DSFR JS behaviors on React-owned nodes; use dsfr-plus components, native HTML behavior, or explicit React state.
- There is a single header: `client/src/layout/header` (`Header`, own `i18n.json`), always used through `client/src/layout/layout.tsx` (`Layout`: header + `<main id="main-content">` + footer). Every board layout and page is a thin wrapper around `Layout` (`items` with Accueil first and the `home-4-line` icon, `serviceName` / `serviceTag` (title and tagline, default "Tableaux" and the generic tagline), `exploreLink` and `languageSelector` (both off by default), `themeSwitch` (on by default), `extra` (header tools), `navExtra` (right side of the menu bar), `before`, `footer`). Never hand-write `fr-header`, `fr-nav` menus, `<main>`, `<SwitchTheme />` or skiplinks in a board or page.
- The skiplinks ("liens d'évitement": Contenu principal / Menu / Pied de page, RGAA 12.7) are rendered once, by `Header`. Targets are `#main-content` (`Layout`), `#main-menu` (the nav, only when there are items) and `#footer` (`Footer`); pages must not add their own `<main>`.
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
