# Mode: accessibility

Read-only by default. The target standard is RGAA 4 (the French public-sector reference, based on WCAG 2.1 AA). Read the page, component and chart code, and report findings with the criterion they relate to. Use [dsfr](../../dsfr/SKILL.md) for correct component usage before proposing a fix. Only change files if the user asks for fixes.

Target: a board id or path, for example `client/src/boards/<board-id>`.

## Keyboard and focus

- Every control (filters, tabs, chart toggles, table sorts, export or copy buttons) is reachable and operable with the keyboard only, in a logical order.
- Focus is visible and never removed by custom styles. Closing a panel or a select returns focus to a sensible element.
- No keyboard trap in custom widgets such as `ItemFilter` or `Select`.
- Native elements (`button`, `a`, `select`) are used before ARIA roles on `div`.

## Names, labels and language

- Every form control has a visible label, linked by `for`/`id` or by the component's `label` prop. Placeholders are not labels.
- Buttons and links have a name that makes sense out of context (no bare "Voir plus", no icon-only control without a label).
- The page has a `lang` attribute matching its language and a title that identifies the page.
- Passages in another language are marked with `lang`.

## Colour and contrast

- Text and essential UI reach at least 4.5:1 contrast (3:1 for large text and UI components), using DSFR tokens.
- Information is not conveyed by colour alone. Chart series have a second cue (pattern, marker, label, or a text legend entry).
- No hard-coded colours in new code. Colours from `useChartColor` are checked against the background.
- Content stays readable when text is zoomed to 200% and when the page reflows to 320 px width.

## Charts and data

- Every `ChartWrapper` chart has a text alternative: a title and description (`ChartConfig.description`) that state the takeaway, plus a data table or a summary when values matter.
- Highcharts accessibility settings (keyboard navigation, screen-reader description) are not disabled without a reason.
- Tooltip content is available on focus as well as on hover.
- Loading, empty and error states are announced to assistive technology (`role="status"` or `role="alert"`, or the equivalent DSFR component).
- Skeletons do not replace a message that the page is loading.

## Structure and headings

- One `h1` per page; headings follow a logical order without skipped levels.
- Landmarks (`header`, `nav`, `main`, `footer`) come from the board layouts; do not remove them.
- Tables use `th` with `scope`, and a caption or an accessible name.
- Skip links and repeated navigation are provided by the existing layouts; do not remove them.

## Motion and media

- No content flashes more than three times per second. Animations respect `prefers-reduced-motion`.
- Autoplaying media is avoided. Any image of text has an alternative.

## Report

List blocking findings first (criterion, file and line, impact, fix), then should-fix and notes. State which checks were done by reading code only. Recommend a manual test with a keyboard and a screen reader on the final page, since this review does not run the page.
