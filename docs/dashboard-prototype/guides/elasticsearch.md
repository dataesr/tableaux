# Elasticsearch

Server-side access to the configured Elasticsearch clusters (`ES_TOKEN_*` credentials) through the Express `/elasticsearch` proxy. **Approval required** before any prototype or preview uses a real index.

## Before you use it

Hand the data owner this list and stop until it is answered:

- Index name(s) and cluster.
- Read-only access and credentials scope.
- Data classification and any personal data.
- The fields the board needs and how they map to the response contract.

## Constraints

- The browser never calls the proxy. The board's server routes call it; the client calls the board's routes.
- Several existing boards call `/elasticsearch` from the browser (`template`, `tableaux-doc`, `valorisation-recherche-innovation`, `financements-par-aap`, `teds`). That is a legacy pattern; do not copy it.
- There is no repository-wide list of approved indexes. Record any approved index in the board's manifest and get it reviewed.
- Field names and document shapes differ per index; inspect a sample document before writing aggregations.

## Prototyping without approval

Serve representative fixtures with the same response shape. See the `board-fixtures` guide.
