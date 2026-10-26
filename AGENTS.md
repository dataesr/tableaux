# Repository guidance

## Project structure

- The application is an npm workspace. Use Node.js 24; do not introduce pnpm-only commands.
- The frontend is React + TypeScript + Vite in `client/`; the backend is Express in `server/`.
- Boards live in `client/src/boards/<board-id>/`. Read the board-specific guidance in `client/src/boards/AGENTS.md` before changing a board.
- Board records are stored in MongoDB and returned by `/admin/list-dashboards`. The frontend dynamically imports a board's `routes.tsx` using its record id. Creating a folder alone does not publish a board.
- Server route modules are explicitly mounted from `server/src/router.js`. Read `server/src/routes/boards/AGENTS.md` before changing board APIs.
- See `docs/dashboard-prototyping/README.md` for the prototype architecture, component references, manifest and data-source constraints.
- For DSFR UI and styling, consult `.claude/skills/dsfr/SKILL.md`; use the board and chart skills for those focused workflows.

## Safety and data

- Use synthetic or public data in prompts and checked-in fixtures. Never include credentials, production records, or confidential data in prompts, fixtures, logs, or generated files.
- Use fixtures by default. Do not call production data services or connect directly to MongoDB from prototype frontend code.
- A read-only preview source may be used only after its owner, datasets, environment, and access controls have been explicitly approved.
- Do not create or modify MongoDB dashboard records, deployment settings, secrets, or production routes as part of prototyping without an explicit human-approved task.
- Never read or print `.env` files or expose credentials. Client-side `VITE_*` variables are included in the built bundle and must not contain secrets.

## Architecture and conventions

- Use `ChartWrapper` for Highcharts, with `useQuery` keys containing all relevant filters. Handle loading, error, and empty states explicitly; keep expected data errors on the page so users can adjust filters.
- Follow the nearest board's i18n pattern. Provide French text and English text when the board is multilingual.
- Keep shared components shared only when a second board needs them. Boards must not import from one another except through `boards/integration/charts-registry.tsx`.
- For new server routes, use the shared error classes and error middleware; use the repository logger instead of `console.log`.
- Follow neighboring file conventions for imports, extensions, formatting, and language.

## Validation

- Available checks include `npm -w client run lint` and `npm run build`. The lint command may require installed dependencies and compatible ESLint configuration; report its actual result rather than assuming it passed.
- No repository-wide PR validation or package-script test suite is configured. Report checks that do not exist instead of claiming they passed.
- Do not run `npm run deploy:*` or its pre/postdeploy scripts; these change versions, merge branches and push tags.
- Keep pull requests focused and describe required dashboard registration, server changes, data access, and checks that remain for a human reviewer.
