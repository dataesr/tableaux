# Opendatasoft (ODS)

The Opendatasoft API, configured through `ODS_API_URL` / `ODS_API_KEY`, used by `structures-finance`. Credentials are already configured. **Target confirmation required**: the developer confirms the dataset before any read; access must be read-only. See [`data-specs.md`](./data-specs.md).

## Constraints

- Call it from the board's server routes, never from the browser. `structures-finance` does this and adds an in-memory cache (about 5 minutes); follow that pattern for a live external call.
- Cache live calls: external APIs have rate limits, and every response should survive an upstream hiccup.

## Without confirmation

Do not substitute sample data. If the developer has not confirmed access, stop and ask the data-source question (see [`data-specs.md`](./data-specs.md)).
