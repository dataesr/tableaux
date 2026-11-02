# Board fixtures

The default data source for every prototype. The board's own server routes read JSON files from `server/src/routes/boards/<board-id>/data/fixtures/` (see `server/src/routes/boards/template/data/fixtures.js` and its example fixture). The client never imports them; it calls the board's routes.

## Modes

- **`fixtures-dummy`** — invented values. Use when there is no approved or public data yet. The UI must carry a visible "fictitious data" notice, and the manifest records the mode.
- **`fixtures-public-snapshot`** — a slice pulled once from a public source (OpenAlex, EPO, Eurostat, an open-data export). Record source, license, retrieval date and URL in the fixture's `provenance` field and in the manifest's `fixture_provenance`. Check personal data: author-level records can fall under GDPR.

Both stay server-side fixtures; the route path and response shape do not change.

## Contract

- Response envelope: `{ data, provenance }` (see the template's `/template/overview/funded-labs`).
- Keep fixtures small and representative: enough rows to exercise filters, empty states and sorting, no production records, no credentials.
- Isolate the read in one helper (`readFixture`) so an approved data access replaces it in one place.

## Promotion

The data owner approves the target source; the route then swaps `readFixture(...)` for that source's client, without changing the path or the response shape.
