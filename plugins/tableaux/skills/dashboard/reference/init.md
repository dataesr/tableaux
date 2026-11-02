# Mode: init

Clarify the request and the data source. This mode writes no files and runs no queries.

## Steps

1. Read the root `AGENTS.md`, `client/src/boards/AGENTS.md` and `server/src/routes/boards/AGENTS.md`, and `plugins/tableaux/reference/README.md`.
2. Ask for the goal, the audience and the question the dashboard answers, if not given.
3. Ask for the **data source**, and do not continue until the user answers:
   - a **repository data source** (MongoDB, Elasticsearch, Paysage or ODS, already used by a board in this repository), or
   - a **user-defined data source** (a public source such as OpenAlex, EPO or Eurostat, or a new source the user supplies).
   Never create fixtures or sample data in place of the answer. If the answer is missing, ask again.
4. For a repository source, follow sections 1 and 2 of [data-specs.md](../../../reference/guides/data-specs.md): exact index or collection. Wait for manual confirmation in the session before any read. Do not build on a guess.
5. For a user-defined source, follow section 3 of the same guide: URL, licence, retrieval date, and a choice between a live call and a one-off pull (see [external.md](../../../reference/guides/external.md)). Check that the source covers the question (a France-vs-countries comparison needs international coverage), and flag entity-linking risks (SIREN, ROR).
6. Once the source is confirmed, ask about the fields the board needs. Read the mapping or a sample document before writing any query, and do not write queries before the answers are in.
7. Summarise the brief: goal, audience, data source, confirmed fields, open questions. Then stop and suggest `build` as the next step.
