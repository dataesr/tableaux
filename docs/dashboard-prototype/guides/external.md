# External public sources

Public data not hosted by the project: OpenAlex, EPO, Eurostat, or another public database or site. **Approval required** for any live call; a one-off snapshot is lighter but still reviewed.

## Two modes

- **Snapshot (preferred for a prototype):** a script pulls a slice once and writes it to the board's `data/fixtures/`. Simple, reviewable, offline. Record source, license, retrieval date and URL in the fixture's `provenance` and in the manifest's `fixture_provenance`. Data mode: `fixtures-public-snapshot`.
- **Live:** the board's server routes call the API at request time. This needs caching, rate-limit handling and a network-egress decision by the platform owner. The browser never calls the external API. Data mode: `external-live`.

## Before you use it

- **Feasibility:** confirm the source can answer the question (international coverage for a country comparison, the right entity types, the needed years).
- **Entity linking:** plan the join keys across sources (SIREN, ROR, grid, country codes) and flag the risk of mismatches.
- **Personal data:** author-level or person-level records can fall under GDPR; prefer aggregated data.
- **License and attribution:** record the license; many public APIs require attribution.

## Examples

- **OpenAlex** — works, institutions, sources, funders. Free API, CC0 for metadata, no key needed, rate-limited.
- **EPO** (patents) — OPS API, registration required, rate-limited.
- **Eurostat** — SDMX/JSON API, free, no key.

Each is called from the board's server routes only, with a cache for live calls.
