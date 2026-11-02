# Mode: critique

Read-only. Read the board's client and server code, and report findings. Do not edit files. For the accessibility checks, use the [accessibility](./accessibility.md) mode and include its blocking findings in the report.

Target: a board id or path, for example `client/src/boards/<board-id>`.

## Usability

- The page answers the question stated in the brief, and the first screen shows the main result.
- Filters have clear labels, defaults and a visible reset. Changing a filter updates every chart it affects.
- Each chart has a title, a unit, and a short description or source line (`ChartConfig`).
- Empty, loading and error states are handled on every page. A filter that returns no data says so.
- Labels are in the languages the board supports (French, and English if multilingual), with no mixed-language strings.

## Data correctness

- The data source matches the confirmed brief. No fixtures, sample data or invented numbers appear in code, UI or routes.
- Aggregations match their labels: metric, year, denominator and entity are the ones the user confirmed.
- Duplicates, null values and multi-valued fields are handled as agreed with the developer and recorded in the manifest.
- Time window and refresh cadence are stated in the UI or the summary.
- Personal data is not shown or exported beyond what the brief allows; aggregates are preferred.
- The browser never calls a data source directly; all access goes through the board's routes.

## DSFR use

- Components come from `@dataesr/dsfr-plus` and are used according to [dsfr](../../dsfr/SKILL.md); no raw `fr-*` markup invented from memory.
- Colours and spacing use DSFR tokens and utilities; no hard-coded colours or inline layout styles in new code.
- Headings follow one logical order, and the page uses the existing board layouts.
- DSFR JavaScript-only behaviours are not relied on.

## Infrastructure fit

- The board follows `client/src/boards/AGENTS.md` and `server/src/routes/boards/AGENTS.md`.
- The server router is mounted in `server/src/router.js`, and route paths start with `/<board-id>/`.
- Credentials and tokens stay on the server; no secret appears in client code, logs or the manifest.
- Shared code is reused from `server/src/commons` or `server/src/services`; dataset logic stays in the board.
- Expected data errors are shown on the page so the user can adjust filters.
- Code in the board's own `server/src/routes/boards/<board-id>/` or `client/src/boards/<board-id>/` that is generic (for example an API client, a formatter, a DSFR wrapper, a sort or aggregation helper) and could be shared. Search `server/src/commons`, `server/src/services`, `client/src/components` and the other boards for a second use, and list each candidate with the files involved. Do not move code during a critique; the common-service decision belongs to `build`.

## Report

Group findings by section, with severity (blocking, should fix, note), the file and line, and a suggested fix. End with the checks that were not run.
