# Paysage API

External referential API for French higher-education and research structures, configured through `PAYSAGE_API_URL` / `PAYSAGE_API_KEY`. **Approval required** before any prototype or preview calls it.

## Before you use it

Hand the data owner this list and stop until it is answered:

- The exact Paysage endpoints and resources the board needs.
- An API key with read-only scope.
- Data classification.

## Constraints

- Call it from the board's server routes, never from the browser.
- `atlas` and `european-projects` each carry a duplicated Paysage client. Do not add a third copy: if your board needs Paysage, reuse or propose extracting a shared client into `server/src/services` (list it in `common_candidates`).

## Prototyping without approval

Serve representative fixtures with the same response shape. See the `board-fixtures` guide.
