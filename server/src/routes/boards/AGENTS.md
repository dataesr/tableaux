# Board API development guidance

- Board APIs are Node.js/Express routes under `server/src/routes/boards/<board-id>/`.
- New route modules must be explicitly imported and mounted from `server/src/router.js`; adding a file alone does not activate a route.
- Follow neighboring routes for input validation, response shapes, async error handling, and MongoDB access. Use the shared error middleware and existing helpers where appropriate.
- Keep database credentials and service tokens on the server. Do not expose them to the frontend, fixtures, prompts, or logs.
- Prototype work must use fixtures unless the data/service owner has approved a read-only preview source and its datasets and access controls. Never connect an AI-generated frontend directly to MongoDB.
- Do not add or expose a route solely on the assumption that a prototype route is private. Identify its access control, deployment exposure, and reviewer before implementation.
- Backend changes require an explicit human review by the service/data owner. The repository currently has no package-script backend test suite or pull-request check workflow; do not claim those checks ran.
