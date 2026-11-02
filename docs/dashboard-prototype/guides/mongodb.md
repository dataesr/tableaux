# MongoDB (tableaux)

Server-side connection in `server/src/services/mongo.js` (and `mongo-accessibility.js`). **Approval required** before any prototype or preview reads a real collection.

## Before you use it

Hand the data owner this list and stop until it is answered:

- Database and collection name(s), including any versioned suffix convention.
- Read-only access.
- Data classification and any personal data.
- The fields the board needs and how they map to the response contract.

## Constraints

- Read it only from the board's server routes, never from the browser.
- The server connects to MongoDB at startup and exits if it fails, so running the app locally needs the MongoDB that repository developers already have.
- No two current boards share a collection; collection names are board-specific or resolved from the `boards` record.

## Prototyping without approval

Serve representative fixtures with the same response shape. See the `board-fixtures` guide.
