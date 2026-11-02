# Data specifications

Ask these before any design or code, one source at a time. Use the `ask_user` form for grouped answers. Do not guess an answer that changes the data path.

## 1. Source choice

Ask first, before any other question. The answer is one of two:

- **Repository data source:** `mongodb`, `elasticsearch`, `paysage`, `ods`, or a source already listed in the repository. Continue with section 2.
- **User-defined data source:** the user supplies the source (for example an external public API or a file they own). Continue with section 3.

The agent does not generate sample data in either case.

## 2. Repository sources (`mongodb`, `elasticsearch`, `paysage`, `ods`)

These are read-only, and their credentials are already configured on the server. No token or key is requested from the user, and the agent never reads `.env` or prints a credential.

Every answer is required before the agent calls the source:

- **Target:** the exact index (Elasticsearch), collection (MongoDB) or dataset (ODS, Paysage).
- **Target confirmation:** the developer states in the session that the target and data classification are correct.
- **Allowed reads:** mapping/schema reads (`GET _mapping`, field lists) are allowed after confirmation. Sample documents may be read only after confirmation, and only to inspect field names and types. Do not export or store documents in the repository.
- **Fields:** The agent may read the elasticsearch mapping and ask about fields, but must not write aggregations until the answers are in:
  - Which fields are needed? Suggest some fields from the mapping.
  - What is the time window and the refresh cadence? Is the metric a snapshot or cumulative?
  - Should the dashboard deduplicate records, and by which key?
  - Which language should labels use (French, English or both)?

## 3. User-defined and external sources

A new source is not configured in the repository yet. Ask these with the `ask_user` form before any design:

- **Origin:** the URL, file or public API (for example OpenAlex, EPO, Eurostat). Licence, retrieval date, and a personal-data check (author-level data can fall under GDPR).
- **Access:** does it need a key? If so, ask for the server environment variable name (for example `OPENALEX_API_KEY`) and whether it is already set. The value goes only into the server environment, never into the chat, the repository or client code.
- **Mode:** a live call from the board's server, or a snapshot. A live call needs caching and a platform egress decision. See [external.md](./external.md).
- **Build scope:** asked in `build`, once the code location is decided. A **common service** in `server/src/services/`, reusable by other boards, or a **board-only** build in `server/src/routes/boards/<board-id>/`. Default to board-only. Move code to a shared folder only when a second board needs it (root `AGENTS.md`, "Keep code dedicated to the board by default").

## 4. Output of the questions

Record the answers in the board manifest (`data_sources`) and summarise them in the final report. Do not create a separate planning file.
