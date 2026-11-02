# Opendatasoft (ODS)

The Opendatasoft API, configured through `ODS_API_URL` / `ODS_API_KEY`, used by `structures-finance`. **Approval required** before any prototype or preview calls it.

## Before you use it

Hand the data owner this list and stop until it is answered:

- The exact ODS dataset and fields.
- An API key with read-only scope.
- Data classification.

## Constraints

- Call it from the board's server routes, never from the browser. `structures-finance` does this and adds an in-memory cache (about 5 minutes); follow that pattern for a live external call.
- Cache live calls: external APIs have rate limits, and every response should survive an upstream hiccup.

## Prototyping without approval

Serve representative fixtures with the same response shape. See the `board-fixtures` guide.
