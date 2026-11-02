# MongoDB (tableaux)

Server-side connection in `server/src/services/mongo.js` (and `mongo-accessibility.js`). Credentials are already configured. **Target confirmation required**: the developer confirms the exact collection and data classification before any read; access must be read-only. See [`data-specs.md`](./data-specs.md).

## Constraints

- Read it only from the board's server routes, never from the browser.
- The server connects to MongoDB at startup and exits if it fails, so running the app locally needs the MongoDB that repository developers already have.
- No two current boards share a collection; collection names are board-specific or resolved from the `boards` record.

## Without confirmation

Do not substitute sample data. If the developer has not confirmed access, stop and ask the data-source question (see [`data-specs.md`](./data-specs.md)).
