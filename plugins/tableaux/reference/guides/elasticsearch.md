# Elasticsearch

Server-side access to the configured Elasticsearch clusters (`ES_TOKEN_*` credentials) through the Express `/elasticsearch` proxy. Credentials are already configured. **Target confirmation required**: the developer confirms the exact index and data classification before any read, and access must be read-only. See [`data-specs.md`](./data-specs.md).

## Constraints

- The browser never calls the proxy. The board's server routes call it; the client calls the board's routes.
- Several existing boards call `/elasticsearch` from the browser (`template`, `tableaux-doc`, `valorisation-recherche-innovation`, `financements-par-aap`, `teds`). That is a legacy pattern; do not copy it.
- There is no repository-wide list of approved indexes. Record any approved index in the board's manifest and get it reviewed.
- Field names and document shapes differ per index; inspect a sample document before writing aggregations.

## Without confirmation

Do not substitute sample data. If the developer has not confirmed access, stop and ask the data-source question (see [`data-specs.md`](./data-specs.md)).
