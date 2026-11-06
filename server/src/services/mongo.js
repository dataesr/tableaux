import { MongoClient } from "mongodb";

import logger from "./logger.js";

const mongoDbName = process.env.MONGO_DB_NAME || "tableaux-staging";
const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/";

const client = new MongoClient(mongoUri);

logger.info(`Try to connect to mongo Tableaux...`);
await client.connect().catch((e) => {
  logger.info(`Connexion to mongo Tableaux instance failed... Terminating... ${e.message}`);
  process.kill(process.pid, "SIGTERM");
});

logger.info(`Connected to mongo database - Tableaux...`);
const db = client.db(mongoDbName);

export { client, db };
