import { MongoClient } from "mongodb";

import logger from "./logger.js";

const mongoProdDbName = process.env.MONGO_DB_NAME_PROD || "tableaux-prod";
const mongoProdUri = process.env.MONGO_URI_PROD;

let dbProd = null;
let clientProd = null;

if (mongoProdUri) {
  clientProd = new MongoClient(mongoProdUri);

  logger.info(`Try to connect to mongo Tableaux Production...`);
  await clientProd.connect().catch((e) => {
    logger.error(`Connection to mongo Tableaux Production instance failed... ${e.message}`);
  });

  logger.info(`Connected to mongo Production database - Tableaux...`);
  dbProd = clientProd.db(mongoProdDbName);
} else {
  logger.warn(`MONGO_URI_PROD not configured. Production operations will not be available.`);
}

export { clientProd, dbProd };
