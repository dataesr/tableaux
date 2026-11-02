# Recipe: add a chart

Reference example: `client/src/boards/template/pages/overview/charts/funded-labs/`. Before writing, read a chart **from the same board** and match its style (separators, colours, filters, i18n).

## Steps

1. Create `client/src/boards/<board>/pages/<page>/charts/<chart-name>/` (kebab-case).
2. `utils.tsx`: pure functions, no React.
   - `getSeries(data)`: turns the API response into `{ categories, series }`. Handle missing or empty data explicitly; do not show an invalid response as an empty success.
   - `getOptions(...)`: returns the Highcharts options object (`credits: { enabled: false }`, axis titles, and so on).
3. `index.tsx`: default component.
   - `const { VITE_APP_SERVER_URL } = import.meta.env;`
   - Data: if the board has an `api/` folder, put the hook (`useQuery`) there and import it here. Otherwise call `useQuery` in the component, as the rest of the board does. Every filter goes in the `queryKey` (`["<board>-<chart-name>", ...filters]`).
   - Distinguish loading, error and no result: `DefaultSkeleton` while loading, an `Alert` in place on error that keeps the filters, and an explanatory message when the request succeeds with no data. An error must not leave a skeleton on screen.
   - Colours: `useChartColor`, `client/src/utils/colors.ts`, or the board's `colors.scss`. Never hard-code hex values in a new chart (dark theme).
   - `config = { id, title, integrationURL: "/integration?chart_id=<id>" }` (plus `comment`, `sources` and `description` if the board uses them).
   - Render: `<ChartWrapper config={config} options={options} />`. Never instantiate `HighchartsReact` directly.
   - Text: go through the board's `i18n.json`, and `getI18nLabel` if the board is multilingual.
4. Import the chart in `pages/<page>/index.tsx`.
5. If the chart must be embeddable in an iframe, add it to `client/src/boards/integration/charts-registry.tsx` with the same `id`.
6. If a new server route is needed, follow the server part of [dashboard build](../../dashboard/reference/build.md) and add an `.http` file in `api-tests/`. The chart calls only its own board's routes (`${VITE_APP_SERVER_URL}/<board-id>/...`), never `/elasticsearch` or another service directly.

## Accessibility

Filters: prefer dsfr-plus components (`Select`, `SegmentedControl`, and so on) or the ones in `client/src/components/` (`select`, `range-of-years`). Otherwise use unique `id`s (`useId`) and a `<label>` linked to the control. One field size per row. No information carried by colour alone. See the [dsfr](../../dsfr/SKILL.md) skill for layout pitfalls.

## Verification

Run the checks in the root `AGENTS.md`. If possible, open the page locally and check the rendering, the states and keyboard accessibility.
