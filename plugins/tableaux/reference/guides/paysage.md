# Paysage API

External referential API for French higher-education and research structures, configured through `PAYSAGE_API_URL` / `PAYSAGE_API_KEY`. Credentials are already configured. **Target confirmation required**: the developer confirms the dataset before any read; access must be read-only. See [`data-specs.md`](./data-specs.md).

## Constraints

- Call it from the board's server routes, never from the browser.
- `atlas` and `european-projects` each carry a duplicated Paysage client. Do not add a third copy: if your board needs Paysage, reuse or propose extracting a shared client into `server/src/services` (list it in `common_candidates`).

## Without confirmation

Do not substitute sample data. If the developer has not confirmed access, stop and ask the data-source question (see [`data-specs.md`](./data-specs.md)).
