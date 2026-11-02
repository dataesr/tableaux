# External public sources

Public data not hosted by the project: OpenAlex, EPO, Eurostat, or another public database or site. **Confirmation required** for any new source: the developer confirms the source, fields, licence, the token name if one is needed (never its value), and whether it becomes a common service or a board-only build.

## Constraints

- **Live:** the board's server routes call the API at request time. This needs caching, rate-limit handling and a network-egress decision by the platform owner. The browser never calls the external API.

- **Snapshot:** a dated copy of the source, pulled once by a documented command and then served by the board's own routes. The board never calls the source for a snapshot. Use one when the source is rate-limited, large, licence-sensitive, or when figures must be reproducible for a given date.

## Snapshots

A snapshot is what the public source returned, stored with its provenance. It is **real data only**: never a fixture, a sample, or a hand-written or generated file.

### Provenance record (required)

Each snapshot has a metadata record stored next to the data:

- `source`: name of the public source (for example `OpenAlex`).
- `endpoint`: base URL and the exact query or filters used.
- `retrieved_at`: ISO 8601 date and time of the pull.
- `source_date`: the date of the source's own data, when it has one.
- `licence`: as stated by the source, with its URL.
- `record_count`: number of records stored.
- `sha256`: checksum of the stored data.
- `command`: the script or command that produced the snapshot.

### Storage options

| Option | Where | Use when | Constraints |
| --- | --- | --- | --- |
| Local file | `server/src/routes/boards/<board-id>/snapshots/`: a JSON or NDJSON data file and its metadata file | Small aggregated extracts (a few MB at most), with a licence that allows redistribution | Committed to git, so it grows the repository. |
| MongoDB collection | A collection in the board's Mongo database, with the provenance on a metadata document | Large or often-queried extracts. Precedent: `suivi-recherche` stores `snapshot_openalex` (source and date) in `biblio_meta`, computed offline. | Writing needs explicit human approval. The board reads it read-only. |
| Elasticsearch index | A dedicated index read through the `/elasticsearch` proxy | Large or search-heavy extracts | Index creation needs explicit human approval, and the mapping is documented. |

Where snapshots live is the developer's choice per source. Use the table above to recommend one: a local file for small aggregated extracts, MongoDB for large or often-queried ones. Record the choice in the board manifest.

### Rules

- A snapshot is produced by a script or documented command, and the `command` in the metadata must reproduce the `sha256`. Never write a snapshot by hand.
- A refresh creates a new dated snapshot. Keep the previous one until the board switches to the new one, so figures can be compared.
- Board routes read the snapshot only. Their response uses the standard `{ data, provenance }` shape, where `provenance` carries `source`, `source_date`, `retrieved_at` and `licence` from the metadata record.
- The refresh cadence is manual and is stated in the UI or the final summary.

## Examples

- **OpenAlex** — works, institutions, sources, funders. Free API, CC0 for metadata, no key needed, rate-limited.
- **EPO** (patents) — OPS API, registration required, rate-limited.
- **Eurostat** — SDMX/JSON API, free, no key.

Each is called from the board's server routes only, with a cache for live calls.
