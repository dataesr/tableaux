import express from "express";
import { spawn } from "child_process";
import fs from "fs";
import os from "os";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

import { db, mongoUri } from "../../services/mongo.js";
import { dbProd, mongoProdUri } from "../../services/mongo-prod.js";
import logger from "../../services/logger.js";
import { checkQuery } from "./utils.js";
import uploadVersionRoute from "./upload/upload-version.js";
import { getEmbeddings } from "./vectors.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const getMongoToolsUri = (uri) => {
  const parsedUri = new URL(uri);
  const uriDatabase = decodeURIComponent(parsedUri.pathname.slice(1));
  if (uriDatabase && !parsedUri.searchParams.has("authSource")) {
    parsedUri.searchParams.set("authSource", uriDatabase);
  }
  if (!parsedUri.searchParams.has("authMechanism")) {
    parsedUri.searchParams.set("authMechanism", "SCRAM-SHA-256");
  }
  parsedUri.pathname = "/";
  return parsedUri.toString();
};

const sanitizeErrorMessage = (message) => message.replace(/(mongodb(?:\+srv)?:\/\/)[^/@\s]+@/gi, "$1[REDACTED]@");

const resolveStagingVersionCollection = async (dashboardId, versionId) => {
  const prefixedName = versionId.startsWith(`${dashboardId}_`)
    ? versionId
    : `${dashboardId}_${versionId}`;
  const candidates = [...new Set([versionId, prefixedName])];
  const exists = await Promise.all(
    candidates.map((name) => db.listCollections({ name }).hasNext()),
  );
  const matches = candidates.filter((_, index) => exists[index]);
  return { candidates, matches };
};

// Base visée par une route admin qui peut lire ou écrire en staging comme en production (`environment`).
// Sans paramètre, c'est la base staging, comme avant : les appels existants ne changent pas.
const getAdminDb = (environment) => (environment === "production" ? dbProd : db);

const router = new express.Router();

const copyProgress = new Map();

router.use(uploadVersionRoute);

// List all dashboards from server
router.route("/admin/list-dashboards").get(async (req, res) => {
  const response = await db.collection("boards").find({}).toArray();
  res.json(response);
});

// Add a new dashboard
router.route("/admin/add-dashboard").post(async (req, res) => {
  const filters = checkQuery(
    req.body,
    [
      "description_en",
      "description_fr",
      "id",
      "name_en",
      "name_fr",
      "url",
    ],
    res,
  );
  const {
    description_en,
    description_fr,
    homePageVisible,
    id,
    isMultilingual,
    name_en,
    name_fr,
    url,
  } = req.body;

  getEmbeddings([name_fr, name_en, description_fr, description_en]).catch(
    console.error,
  );

  try {
    // Vérifier si un dashboard avec cet ID existe déjà
    const existingDashboard = await db.collection("boards").findOne({ id });
    if (existingDashboard) {
      return res
        .status(409)
        .json({ error: "A dashboard with this ID already exists" });
    }

    // Créer le nouveau dashboard
    const newDashboard = {
      constants: [],
      createdAt: new Date().toISOString(),
      data: [],
      description_en,
      description_fr,
      homePageVisible: homePageVisible !== undefined ? homePageVisible : true,
      icon: "question-mark",
      id,
      isMultilingual: isMultilingual || false,
      name_en,
      name_fr,
      url,
    };

    await db.collection("boards").insertOne(newDashboard);
    res.json({
      message: "Dashboard added successfully",
      dashboard: newDashboard,
    });
  } catch (error) {
    console.error("Error adding dashboard:", error);
    res
      .status(500)
      .json({ error: "Unable to add dashboard", details: error.message });
  }
});

// Update dashboard visibility
router.route("/admin/update-dashboard-visibility").post(async (req, res) => {
  const { dashboardId, homePageVisible } = req.body;

  if (!dashboardId || homePageVisible === undefined) {
    return res
      .status(400)
      .json({ error: "dashboardId and homePageVisible are required" });
  }

  try {
    const result = await db
      .collection("boards")
      .updateOne({ id: dashboardId }, { $set: { homePageVisible } });

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Dashboard not found" });
    }

    res.json({
      message: "Dashboard visibility updated successfully",
      homePageVisible,
    });
  } catch (error) {
    console.error("Error updating dashboard visibility:", error);
    res
      .status(500)
      .json({
        error: "Unable to update dashboard visibility",
        details: error.message,
      });
  }
});

router.route("/admin/list-all-collections").get(async (req, res) => {
  try {
    // Liste de toutes les collections
    const collections = await db.listCollections().toArray();
    // Récupérer tous les dashboards pour avoir les createdAt
    const dashboards = await db.collection("dashboards").find({}).toArray();

    // Mapper les collections avec le format attendu
    const boards = collections
      .map((collection) => {
        const parts = collection.name.split("_");
        if (parts.length < 2) {
          return null; // Ignorer les collections qui ne suivent pas la convention de nommage
        }

        const boardName = parts[0];
        const collectionName = collection.name;

        // Chercher la date de création dans la collection dashboards
        const dashboard = dashboards.find((d) => d.boardName === boardName);
        const collectionInfo = dashboard?.collections?.filter((c) => c.name === collectionName).sort((a, b) => b.createdAt - a.createdAt)[0];

        return {
          boardName: parts[0],
          collectionName: parts[1],
          version: parts[2],
          createdAt: collectionInfo?.createdAt || null,
        };
      })
      .filter((board) => board !== null);

    res.json(boards);
  } catch (error) {
    console.error("Error listing boards:", error);
    res.status(500).json({
      error: "Unable to list boards",
      details: error.message,
    });
  }
});

// copy collection with new name
router.route("/admin/copy-collection").post(async (req, res) => {
  const filters = checkQuery(req.body, ["sourceName", "targetName"], res);
  const { sourceName, targetName } = filters;
  const timestamp = req.body.timestamp || Math.floor(Date.now() / 1000);
  console.log("Copying collection from", sourceName, "to", targetName);
  try {
    // Vérifier si la collection source existe
    const sourceExists = await db
      .listCollections({ name: sourceName })
      .hasNext();
    if (!sourceExists) {
      return res.status(404).json({ error: "Source collection not found" });
    }

    // Vérifier si la collection cible existe déjà
    const targetExists = await db
      .listCollections({ name: targetName })
      .hasNext();
    if (targetExists) {
      return res.status(409).json({
        error: "Target collection already exists : " + targetName,
        message:
          "Please choose a different target name or delete the existing collection first",
      });
    }

    // Créer la nouvelle collection
    await db.createCollection(targetName);

    // Copier les documents avec une agrégation
    await db
      .collection(sourceName)
      .aggregate([
        {
          $out: targetName,
        },
      ])
      .toArray();

    // Copier les index
    const indexes = await db.collection(sourceName).indexes();
    for (const index of indexes) {
      if (index.name !== "_id_") {
        const indexOptions = { ...index };
        delete indexOptions._id;
        delete indexOptions.ns;
        delete indexOptions.v;
        delete indexOptions.key;
        await db.collection(targetName).createIndex(index.key, indexOptions);
      }
    }

    // Extraire le nom du tableau de bord depuis le nom de la collection
    // Format attendu: boardName_*
    const boardName = targetName.split("_")[0];

    // Mettre à jour la collection dashboards
    await db.collection("dashboards").updateOne(
      {
        boardName,
        "collections.name": targetName,
      },
      {
        $push: {
          collections: {
            name: targetName,
            createdAt: timestamp,
          },
        },
      },
      { upsert: true },
    );

    res.json({ message: "Collection copied successfully", targetName });
  } catch (error) {
    console.error("Error copying collection:", error);
    res
      .status(500)
      .json({ error: "Unable to copy collection", details: error.message });
  }
});

// delete a collection
router.route("/admin/delete-collection").delete(async (req, res) => {
  const filters = checkQuery(req.body, ["collectionName"], res);
  const { collectionName } = filters;
  try {
    // Check if the collection exists
    const collectionExists = await db
      .listCollections({ name: collectionName })
      .hasNext();
    if (!collectionExists) {
      return res.status(404).json({ error: "Collection not found" });
    }
    // Drop the collection
    await db.collection(collectionName).drop();
    res.json({ message: "Collection deleted successfully" });
  } catch (error) {
    console.error("Error deleting collection:", error);
    res.status(500).json({
      error: "Unable to delete collection",
      details: error.message,
    });
  }
});

// list all indexes from a collection
router.route("/admin/list-indexes").get(async (req, res) => {
  let collectionId = req.query.collectionId;
  if (!collectionId) {
    return res.status(400).json({ error: "Collection ID is required" });
  }

  try {
    // Avec `dashboardId`, `collectionId` est un identifiant de version : on retrouve sa collection staging,
    // préfixée ou non par le tableau, comme pour la copie vers la prod. Avant, l'identifiant de version était
    // pris tel quel comme nom de collection, et la route échouait pour les collections préfixées.
    if (req.query.dashboardId !== undefined) {
      const { matches } = await resolveStagingVersionCollection(req.query.dashboardId, collectionId);
      if (matches.length > 1) {
        return res.status(409).json({ error: "Plusieurs collections staging correspondent à cette version" });
      }
      if (matches.length === 0) {
        return res.status(404).json({ error: "Collection staging introuvable" });
      }
      [collectionId] = matches;
    }
    const indexes = await db.collection(collectionId).indexes();
    res.json(indexes);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Unable to list indexes", details: error.message });
  }
});

// change current data
router.route("/admin/set-current-version").post(async (req, res) => {
  const filters = checkQuery(
    req.body,
    ["dashboardId", "dataId", "versionId"],
    res,
  );

  const { dashboardId, dataId, versionId } = filters;

  const response = await db
    .collection("boards")
    .updateOne(
      { id: dashboardId, "data.id": dataId },
      { $set: { "data.$.current": versionId } },
    );

  if (response.matchedCount === 0) {
    res.status(404).json({ error: "No document found" });
  }

  // return current data
  const ret = await db.collection("boards").findOne({ id: dashboardId });

  res.json(ret);
});

// update constant, in staging (default) or in production (`environment: "production"`)
router.route("/admin/update-constant").post(async (req, res) => {
  const { dashboardId, key, value, environment } = req.body;
  if (![dashboardId, key].every((field) => typeof field === "string" && field.length > 0) || typeof value !== "string") {
    return res.status(400).json({ error: "dashboardId, key and value are required" });
  }
  const targetDb = getAdminDb(environment);
  if (!targetDb) {
    return res.status(503).json({ error: "Production database is not configured" });
  }

  const response = await targetDb.collection("boards").updateOne(
    { id: dashboardId, "constants.key": key },
    { $set: { "constants.$[elem].value": value } },
    {
      arrayFilters: [{ "elem.key": key }],
    },
  );

  if (response.matchedCount === 0) {
    // Constante ajoutée en staging après la création de la fiche de prod : on l'ajoute à la fiche visée,
    // avec la description de staging. Avant, la mise à jour ne trouvait pas la clé et ne faisait rien, sans erreur.
    const stagingBoard = await db.collection("boards").findOne({ id: dashboardId });
    const stagingConstant = stagingBoard?.constants?.find((constant) => constant.key === key);
    if (!stagingConstant) {
      return res.status(404).json({ error: "Constant not found in staging" });
    }
    const pushResponse = await targetDb.collection("boards").updateOne(
      { id: dashboardId },
      { $push: { constants: { ...stagingConstant, value } } },
    );
    if (pushResponse.matchedCount === 0) {
      return res.status(404).json({ error: "Dashboard not found" });
    }
  }

  // return current data
  const ret = await targetDb.collection("boards").findOne({ id: dashboardId });
  res.json(ret);
});

// list all uploaded files in files folder
router.route("/admin/list-uploaded-files").get((req, res) => {
  fs.readdir("../files", (err, files) => {
    if (err) {
      return res.status(500).json({ error: "Unable to scan files directory" });
    }

    const fileDetails = files.map((file) => {
      const filePath = path.join("../files", file);
      const stats = fs.statSync(filePath);
      return {
        name: file,
        size: (stats.size / (1024 * 1024)).toFixed(2), // size in MB
      };
    });

    res.json(fileDetails);
  });
});

// delete a version
router.route("/admin/delete-version").delete(async (req, res) => {
  const filters = checkQuery(
    req.body,
    ["dashboardId", "collectionId", "versionId"],
    res,
  );
  const { dashboardId, collectionId, versionId } = filters;

  // Check if the version to be deleted is the current version
  const board = await db
    .collection("boards")
    .findOne(
      { id: dashboardId, "data.id": collectionId },
      { projection: { "data.$": 1 } },
    );

  if (!board) {
    return res.status(404).json({ error: "No document found" });
  }

  const data = board.data[0];
  if (data.current === versionId) {
    return res.status(400).json({ error: "Cannot delete the current version" });
  }

  const response = await db.collection("boards").updateOne(
    { id: dashboardId, "data.id": collectionId },
    {
      $pull: {
        "data.$.versions": { id: versionId },
      },
    },
  );

  if (response.modifiedCount === 0) {
    res.status(404).json({ error: "No document found" });
  }

  // delete the collection
  await db.collection(versionId).drop();

  // return current data
  const ret = await db.collection("boards").findOne({ id: dashboardId });

  res.json(ret);
});

// Copies vers la production, une entrée par collection de production : { status, versionId, documentsCount, error, details }.
// Avant, la copie se faisait pendant la requête HTTP : sur une grosse collection, un proxy coupait la requête
// avant la fin, l'admin affichait une erreur alors que la copie continuait, et rien n'empêchait d'en relancer
// une seconde en parallèle sur la même collection. Désormais la route répond tout de suite, l'admin interroge
// le statut, et cette Map sert de verrou : une seule copie à la fois par collection de production.
// Elle est en mémoire : le verrou ne vaut que pour cette instance du serveur.
const productionCopies = new Map();

// Lance mongodump / mongorestore. Avant, `execFile` gardait toute leur sortie en mémoire et tuait le processus
// au-delà de 1 Mo ; or ces outils y écrivent leur progression, ce qui peut arriver sur une très longue copie,
// en pleine restauration. `spawn` lit la sortie au fil de l'eau ; on n'en garde que la fin pour le message d'erreur.
const runMongoTool = (command, args) => new Promise((resolve, reject) => {
  const child = spawn(command, args, { stdio: ["ignore", "ignore", "pipe"] });
  let stderrTail = "";
  child.stderr.on("data", (chunk) => {
    stderrTail = `${stderrTail}${chunk}`.slice(-4000);
  });
  child.on("error", reject);
  child.on("close", (code) => {
    if (code === 0) resolve();
    else reject(new Error(`${command} exited with code ${code}: ${stderrTail}`));
  });
});

const copyVersionToProduction = async ({ board, stagingData, dashboardId, collectionId, versionId, stagingCollectionName, productionCollectionName, copy }) => {
  // Comptage exact fait ici plutôt que dans la requête HTTP : sur une grosse collection, il prend du temps.
  const copiedCount = await db.collection(stagingCollectionName).countDocuments();

  // Avant, `mongorestore --drop` supprimait la collection de production puis la remplissait : pendant toute la
  // restauration le tableau en prod lisait une collection vide ou partielle, et un échec (réseau, redémarrage du
  // serveur) la laissait incomplète, sans retour possible. On restaure maintenant sous un nom temporaire : la
  // production reste servie telle quelle jusqu'à la bascule finale, et un échec ne la touche pas.
  const temporaryCollectionName = `${productionCollectionName}__copy_in_progress`;
  const temporaryDirectory = await fs.promises.mkdtemp(path.join(os.tmpdir(), "tableaux-copy-version-"));
  const stagingConfigPath = path.join(temporaryDirectory, "staging.json");
  const productionConfigPath = path.join(temporaryDirectory, "production.json");
  const archivePath = path.join(temporaryDirectory, "collection.archive");

  try {
    await Promise.all([fs.promises.writeFile(stagingConfigPath, JSON.stringify({ uri: getMongoToolsUri(mongoUri) })), fs.promises.writeFile(productionConfigPath, JSON.stringify({ uri: getMongoToolsUri(mongoProdUri) }))]);
    await runMongoTool("mongodump", [`--config=${stagingConfigPath}`, `--db=${db.databaseName}`, `--collection=${stagingCollectionName}`, `--archive=${archivePath}`, "--gzip"]);
    // --drop ne vise plus que la collection temporaire, laissée par une copie interrompue.
    // Plusieurs insertions en parallèle accélèrent la restauration des grosses collections (l'ordre des documents n'importe pas).
    await runMongoTool("mongorestore", [`--config=${productionConfigPath}`, `--archive=${archivePath}`, "--gzip", "--drop", "--stopOnError", "--numInsertionWorkersPerCollection=4", `--nsFrom=${db.databaseName}.${stagingCollectionName}`, `--nsTo=${dbProd.databaseName}.${temporaryCollectionName}`]);
  } finally {
    await fs.promises.rm(temporaryDirectory, { recursive: true, force: true }); // suppression de /tmp
  }

  // La vérification porte sur la collection temporaire : si la collection staging a changé pendant le dump ou si la
  // restauration est incomplète, la production n'a pas encore été touchée.
  const restoredCount = await dbProd.collection(temporaryCollectionName).countDocuments();
  if (restoredCount !== copiedCount) {
    throw new Error(`Restore verification failed for ${dbProd.databaseName}.${temporaryCollectionName}: expected ${copiedCount} documents, found ${restoredCount}`);
  }

  // Bascule atomique : la collection temporaire, index compris, remplace la collection de production en une opération.
  await dbProd.collection(temporaryCollectionName).rename(productionCollectionName, { dropTarget: true });
  copy.productionReplaced = true;

  // Les constantes ont maintenant leur propre valeur de prod, modifiée depuis l'admin : la copie ne les écrase plus.
  // Celles de staging ne servent qu'à initialiser une fiche de prod qui n'en a pas encore.
  const { _id, data, constants, ...boardMetadata } = board;
  const { current, versions, productionVersion, ...collectionMetadata } = stagingData;
  const publishedData = {
    ...collectionMetadata,
    current: productionCollectionName,
    productionVersion: versionId,
    versions: [{ id: productionCollectionName, createdAt: Date.now() }],
  };

  await dbProd.collection("boards").updateOne(
    { id: dashboardId },
    [{
      $replaceWith: {
        $mergeObjects: [
          { $literal: boardMetadata },
          {
            _id: "$_id",
            constants: { $ifNull: ["$constants", { $literal: constants ?? [] }] },
            data: {
              $concatArrays: [
                {
                  $filter: {
                    input: { $ifNull: ["$data", []] },
                    as: "collection",
                    cond: { $ne: ["$$collection.id", { $literal: collectionId }] },
                  },
                },
                { $literal: [publishedData] },
              ],
            },
          },
        ],
      },
    }],
    { upsert: true },
  );

  const stagingUpdate = await db.collection("boards").updateOne(
    { id: dashboardId, "data.id": collectionId },
    { $set: { "data.$.productionVersion": versionId } },
  );
  if (stagingUpdate.matchedCount !== 1) {
    throw new Error("Production was updated, but the staging board could not be updated");
  }

  return copiedCount;
};

// copy version from staging to production
router.route("/admin/copy-version-to-production").post(async (req, res) => {
  const { dashboardId, collectionId, versionId } = req.body;
  if (![dashboardId, collectionId, versionId].every((value) => typeof value === "string" && value.length > 0)) {
    return res.status(400).json({ error: "dashboardId, collectionId and versionId are required" });
  }

  // Check if production database is configured
  if (!dbProd) {
    return res
      .status(503)
      .json({ error: "Production database is not configured" });
  }

  // Get the board to ensure it exists in staging
  const board = await db.collection("boards").findOne({ id: dashboardId });
  const stagingData = board?.data?.find((item) => item.id === collectionId);

  if (!stagingData) {
    return res.status(404).json({ error: "Collection not found in staging" });
  }
  if (!stagingData.versions?.some((version) => version.id === versionId)) {
    return res.status(404).json({ error: "Version not found in staging" });
  }

  const { candidates, matches } = await resolveStagingVersionCollection(dashboardId, versionId);
  if (matches.length > 1) {
    return res.status(409).json({
      error: `Plusieurs collections staging correspondent à cette version : ${matches.join(", ")}. Copie annulée.`,
    });
  }
  if (matches.length === 0) {
    return res.status(404).json({
      error: `Collection staging introuvable. Noms recherchés : ${candidates.join(", ")}`,
    });
  }
  const stagingCollectionName = matches[0];
  const productionCollectionName = `${dashboardId}_${collectionId}`;

  if (productionCopies.get(productionCollectionName)?.status === "running") {
    return res.status(409).json({ error: `Une copie vers ${productionCollectionName} est déjà en cours` });
  }

  // Lecture d'un seul document plutôt qu'un comptage complet, pour que la requête réponde vite.
  const firstDocument = await db.collection(stagingCollectionName).findOne({}, { projection: { _id: 1 } });
  if (!firstDocument) {
    return res
      .status(400)
      .json({ error: "No documents to copy from staging collection" });
  }

  const copy = { status: "running", versionId };
  productionCopies.set(productionCollectionName, copy);
  logger.info(`Copying ${db.databaseName}.${stagingCollectionName} to ${dbProd.databaseName}.${productionCollectionName}`);

  copyVersionToProduction({ board, stagingData, dashboardId, collectionId, versionId, stagingCollectionName, productionCollectionName, copy })
    .then((documentsCount) => {
      Object.assign(copy, { status: "done", documentsCount });
      logger.info(`Copied ${documentsCount} documents to ${dbProd.databaseName}.${productionCollectionName}`);
    })
    .catch(async (error) => {
      const details = sanitizeErrorMessage(error.message);
      logger.error(`Error copying version to production: ${details}`);
      if (!copy.productionReplaced) {
        await dbProd.collection(`${productionCollectionName}__copy_in_progress`).drop().catch(() => {});
      }
      Object.assign(copy, {
        status: "error",
        error: "Unable to copy version to production",
        details: copy.productionReplaced
          ? `La collection de production a été remplacée, mais ses métadonnées n'ont pas pu être mises à jour. Vérifiez-les avant de réessayer. ${details}`
          : `La production n'a pas été modifiée. ${details}`,
      });
    });

  res.status(202).json({ collection: productionCollectionName });
});

// status of the last copy to production of a collection
router.route("/admin/copy-version-to-production/status").get((req, res) => {
  const { dashboardId, collectionId } = req.query;
  if (![dashboardId, collectionId].every((value) => typeof value === "string" && value.length > 0)) {
    return res.status(400).json({ error: "dashboardId and collectionId are required" });
  }
  const copy = productionCopies.get(`${dashboardId}_${collectionId}`);
  if (!copy) {
    return res.status(404).json({ error: "No copy found for this collection" });
  }
  res.json(copy);
});

// delete all files in files folder
router.route("/admin/delete-uploaded-files").delete((req, res) => {
  const directory = "../files";

  fs.readdir(directory, (err, files) => {
    if (err) {
      return res.status(500).json({ error: "Unable to scan files directory" });
    }

    files.forEach((file) => {
      const filePath = path.join(directory, file);

      fs.unlink(filePath, (err) => {
        if (err) {
          return res
            .status(500)
            .json({ error: `Unable to delete file: ${file}` });
        }
      });
    });

    res.json({ message: "All files deleted successfully" });
  });
});

// Update a collection from another collection with script execution
router
  .route("/admin/update-version-from-dependent-collection")
  .post(async (req, res) => {
    const filters = checkQuery(req.body, ["dashboardId", "collectionId"], res);
    const { dashboardId, collectionId } = filters;

    const board = await db.collection("boards").findOne({ id: dashboardId });
    if (!board) {
      return res.status(404).json({ error: "No document found" });
    }

    const dependsOf = board.data.find((d) => d.id === collectionId).dependsOf;
    if (!dependsOf) {
      return res.status(400).json({ error: "No dependency found" });
    }

    // get the current version of the dependent collection - ex:atlas2024
    const dependentCollectionId = board.data.find(
      (d) => d.id === dependsOf,
    ).current;

    async function run({ dependentCollectionId }) {
      try {
        const atlasCollection = db.collection(dependentCollectionId);
        const newCollectionId = "similar-elements_" + Date.now();
        const similarElementsCollection = db.collection(newCollectionId);

        // await similarElementsCollection.deleteMany({});

        const years = await atlasCollection.distinct("annee_universitaire");
        const geoIds = await atlasCollection.distinct("geo_id");

        // for (let i = 0; i < years.length; i++) {
        for (let i = years.length - 1; i < years.length; i++) {
          // TODO: remove this line
          for (let j = 0; j < geoIds.length; j++) {
            const query = {
              geo_id: geoIds[j],
              annee_universitaire: years[i],
              regroupement: "TOTAL",
            };
            const data = await atlasCollection.find(query).toArray();

            const effectifPR = data
              .filter((item) => item.secteur === "PR")
              .reduce((acc, item) => acc + item.effectif, 0);
            const effectifPU = data
              .filter((item) => item.secteur === "PU")
              .reduce((acc, item) => acc + item.effectif, 0);
            const pctPR = (effectifPR / (effectifPR + effectifPU)) * 100;
            const pctPU = (effectifPU / (effectifPR + effectifPU)) * 100;

            const effectifF = data
              .filter((item) => item.sexe === "2")
              .reduce((acc, item) => acc + item.effectif, 0);
            const effectifM = data
              .filter((item) => item.sexe === "1")
              .reduce((acc, item) => acc + item.effectif, 0);
            const pctF = (effectifF / (effectifF + effectifM)) * 100;
            const pctM = (effectifM / (effectifF + effectifM)) * 100;

            const similarElement = {
              geo_id: geoIds[j],
              annee_universitaire: years[i],
              niveau_geo: data[0]?.niveau_geo,
              geo_nom: data[0]?.geo_nom,
              effectifPR: effectifPR,
              effectifPU: effectifPU,
              pctPR: pctPR,
              pctPU: pctPU,
              effectifF: effectifF,
              effectifM: effectifM,
              pctF: pctF,
              pctM: pctM,
            };

            const result =
              await similarElementsCollection.insertOne(similarElement);

            // insert dans la collection board de la nouvelle version
            const response = await db.collection("boards").updateOne(
              { id: dashboardId, "data.id": collectionId },
              {
                $push: {
                  "data.$.versions": {
                    id: newCollectionId,
                    createdAt: new Date().toISOString().split("T")[0], // yyyy-mm-dd
                    from: dependentCollectionId,
                  },
                },
              },
            );
          }
        }
      } finally {
        await db.close();
        res.status(200).json({ message: "Update done" });
      }
    }

    await run({ dependentCollectionId }).catch(console.dir);
    console.log("------------------------- fin ----------------------");
  });

// add a constant to a dashboard in staging; its production value is then set with update-constant
router.route("/admin/add-constant").post(async (req, res) => {
  const { dashboardId, description, value } = req.body;
  const key = typeof req.body.key === "string" ? req.body.key.trim() : "";
  if (typeof dashboardId !== "string" || !dashboardId || !key || typeof value !== "string" || typeof description !== "string") {
    return res.status(400).json({ error: "dashboardId, key, value and description are required" });
  }

  const board = await db.collection("boards").findOne({ id: dashboardId }, { projection: { constants: 1 } });
  if (!board) {
    return res.status(404).json({ error: "Dashboard not found" });
  }
  if (board.constants?.some((constant) => constant.key === key)) {
    return res.status(409).json({ error: `La constante ${key} existe déjà` });
  }

  await db.collection("boards").updateOne({ id: dashboardId }, { $push: { constants: { key, value, description } } });
  res.status(201).json({ key, value, description });
});

// get constants from a dashboard, in staging (default) or in production (`environment=production`)
router.route("/admin/get-constants").get(async (req, res) => {
  const { dashboardId, environment } = req.query;
  if (!dashboardId) {
    return res.status(400).json({ error: "Dashboard ID is required" });
  }
  const targetDb = getAdminDb(environment);
  if (!targetDb) {
    return res.status(503).json({ error: "Production database is not configured" });
  }

  const board = await targetDb.collection("boards").findOne({ id: dashboardId });
  if (!board) {
    return res.status(404).json({ error: "No document found" });
  }

  // Une fiche sans constantes renvoie une liste vide ; avant, `undefined` donnait une réponse vide, illisible en JSON.
  res.json(board.constants ?? []);
});

// router.route("/admin/get-ticket-office-messages").get(async (req, res) => {
//   try {
//     const params = new URLSearchParams({
//       fromApplication: "tableaux",
//       status: "new",
//     });

//     const response = await fetch(
//       `${VITE_APP_TICKETOFFICE_URL}/api/contacts?${params}`,
//       {
//         method: "GET",
//         headers: {
//           Authorization: `Basic ${process.env.TICKET_OFFICE_BASIC_AUTH}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }

//     const data = await response.json();
//     res.json({
//       success: true,
//       data: data,
//     });
//   } catch (error) {
//     console.error("Erreur ticket-office:", error);
//     res.status(500).json({
//       success: false,
//       message: "Erreur lors de la récupération des messages",
//       error: error.message,
//     });
//   }
// });

// Get collection fields with their types
router.route("/admin/list-collection-fields").get(async (req, res) => {
  const collectionName = req.query.collectionName;
  if (!collectionName) {
    return res.status(400).json({ error: "Collection name is required" });
  }

  try {
    // Vérifier si la collection existe
    const collectionExists = await db
      .listCollections({ name: collectionName })
      .hasNext();
    if (!collectionExists) {
      return res.status(404).json({ error: "Collection not found" });
    }

    // Récupérer un échantillon de documents pour analyser les champs
    const sampleSize = 100;
    const documents = await db
      .collection(collectionName)
      .find({})
      .limit(sampleSize)
      .toArray();

    if (documents.length === 0) {
      return res.json({ fields: [] });
    }

    // Analyser les champs et leurs types
    const fieldsMap = new Map();

    documents.forEach((doc) => {
      Object.entries(doc).forEach(([key, value]) => {
        if (key === "_id") return; // Ignorer le champ _id

        let type = typeof value;
        if (Array.isArray(value)) {
          type = "array";
        } else if (value === null) {
          type = "null";
        } else if (value instanceof Date) {
          type = "date";
        }

        if (fieldsMap.has(key)) {
          const existingTypes = fieldsMap.get(key);
          if (!existingTypes.includes(type)) {
            existingTypes.push(type);
          }
        } else {
          fieldsMap.set(key, [type]);
        }
      });
    });

    // Convertir en tableau et trier
    const fields = Array.from(fieldsMap.entries())
      .map(([name, types]) => ({
        name,
        types: types.sort(),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    res.json({ fields });
  } catch (error) {
    console.error("Error listing collection fields:", error);
    res.status(500).json({
      error: "Unable to list collection fields",
      details: error.message,
    });
  }
});

// Characterize a field - store all distinct values in shared collection
router.route("/admin/characterize-field").post(async (req, res) => {
  const filters = checkQuery(
    req.body,
    ["boardId", "collectionId", "field", "associatedRoute"],
    res,
  );
  const { boardId, collectionId, field, associatedRoute } = filters;

  try {
    // Construire le nom complet de la collection (on utilise staging par défaut)
    const fullCollectionName = `${boardId}_${collectionId}_staging`;

    // Vérifier si la collection existe
    const collectionExists = await db
      .listCollections({ name: fullCollectionName })
      .hasNext();
    if (!collectionExists) {
      return res
        .status(404)
        .json({ error: `Collection ${fullCollectionName} not found` });
    }

    // Récupérer toutes les valeurs distinctes du champ
    const distinctValues = await db
      .collection(fullCollectionName)
      .distinct(field);

    // Supprimer les anciennes entrées pour ce champ
    await db.collection("shared").deleteMany({
      boardId,
      collectionId,
      field,
    });

    // Insérer chaque valeur distincte dans la collection "shared"
    const documents = distinctValues.map((value) => ({
      boardId,
      collectionId,
      field,
      value,
      associatedRoute,
      createdAt: new Date().toISOString(),
    }));

    if (documents.length > 0) {
      await db.collection("shared").insertMany(documents);
    }

    res.json({
      message: "Field characterized successfully",
      count: documents.length,
      boardId,
      collectionId,
      field,
    });
  } catch (error) {
    console.error("Error characterizing field:", error);
    res.status(500).json({
      error: "Unable to characterize field",
      details: error.message,
    });
  }
});

// Add manual characterization - add a single value to "shared" collection
router.route("/admin/add-manual-characterization").post(async (req, res) => {
  const filters = checkQuery(
    req.body,
    ["boardId", "field", "value", "associatedRoute"],
    res,
  );
  const { boardId, field, value, associatedRoute } = filters;

  try {
    // Insérer la valeur dans la collection "shared"
    const document = {
      boardId,
      collectionId: null, // Pas de collection spécifique pour les champs manuels
      field,
      value,
      associatedRoute,
      createdAt: new Date().toISOString(),
      isManual: true, // Marquer comme ajout manuel
    };

    await db.collection("shared").insertOne(document);

    res.json({
      message: "Manual characterization added successfully",
      boardId,
      field,
      value,
    });
  } catch (error) {
    console.error("Error adding manual characterization:", error);
    res.status(500).json({
      error: "Unable to add manual characterization",
      details: error.message,
    });
  }
});

// Get all characterizations
router.route("/admin/list-characterizations").get(async (req, res) => {
  try {
    // Récupérer toutes les caractérisations avec leurs valeurs
    const characterizations = await db
      .collection("shared")
      .aggregate([
        {
          $group: {
            _id: {
              boardId: "$boardId",
              collectionId: "$collectionId",
              field: "$field",
              associatedRoute: "$associatedRoute",
            },
            count: { $sum: 1 },
            values: { $push: "$value" },
            createdAt: { $first: "$createdAt" },
          },
        },
        {
          $project: {
            _id: 0,
            boardId: "$_id.boardId",
            collectionId: "$_id.collectionId",
            field: "$_id.field",
            associatedRoute: "$_id.associatedRoute",
            count: 1,
            values: 1,
            createdAt: 1,
          },
        },
        {
          $sort: { boardId: 1, collectionId: 1, field: 1 },
        },
      ])
      .toArray();

    res.json(characterizations);
  } catch (error) {
    console.error("Error listing characterizations:", error);
    res.status(500).json({
      error: "Unable to list characterizations",
      details: error.message,
    });
  }
});

// Search shared by URL parameters
router.route("/admin/search-shared").get(async (req, res) => {
  try {
    // Récupérer tous les paramètres de l'URL
    const urlParams = req.query;

    if (Object.keys(urlParams).length === 0) {
      return res.json([]);
    }

    // Construire les requêtes pour chaque paramètre
    // Chercher soit la valeur exacte, soit les champs avec des valeurs commençant par $
    const searchQueries = Object.entries(urlParams).flatMap(
      ([field, value]) => [
        // Match exact sur field et value
        { field, value },
        // Match sur field uniquement si value commence par $
        { field, value: { $regex: /^\$/ } },
      ],
    );

    // Rechercher dans la collection "shared" toutes les correspondances
    const results = await db
      .collection("shared")
      .find({
        $or: searchQueries,
      })
      .toArray();

    // Grouper les résultats par boardId et associatedRoute
    const grouped = results.reduce((acc, item) => {
      const key = `${item.boardId}_${item.associatedRoute}`;
      if (!acc[key]) {
        acc[key] = {
          boardId: item.boardId,
          associatedRoute: item.associatedRoute,
          matches: [],
        };
      }

      // Si la valeur commence par $, utiliser la valeur du paramètre d'URL
      const actualValue = item.value.startsWith("$")
        ? urlParams[item.field]
        : item.value;

      acc[key].matches.push({
        field: item.field,
        value: actualValue,
        collectionId: item.collectionId,
      });
      return acc;
    }, {});

    res.json(Object.values(grouped));
  } catch (error) {
    console.error("Error searching shared:", error);
    res.status(500).json({
      error: "Unable to search shared",
      details: error.message,
    });
  }
});

// Refresh characterization - delete and recreate values for a specific field
router.route("/admin/refresh-characterization").post(async (req, res) => {
  const filters = checkQuery(
    req.body,
    ["boardId", "collectionId", "field", "associatedRoute"],
    res,
  );
  const { boardId, collectionId, field, associatedRoute } = filters;

  try {
    // Construire le nom complet de la collection (on utilise staging par défaut)
    const fullCollectionName = `${boardId}_${collectionId}_staging`;

    // Vérifier si la collection existe
    const collectionExists = await db
      .listCollections({ name: fullCollectionName })
      .hasNext();
    if (!collectionExists) {
      return res
        .status(404)
        .json({ error: `Collection ${fullCollectionName} not found` });
    }

    // Supprimer les anciennes entrées pour ce champ
    await db.collection("shared").deleteMany({
      boardId,
      collectionId,
      field,
    });

    // Récupérer toutes les valeurs distinctes du champ
    const distinctValues = await db
      .collection(fullCollectionName)
      .distinct(field);

    // Insérer chaque valeur distincte dans la collection "shared"
    const documents = distinctValues.map((value) => ({
      boardId,
      collectionId,
      field,
      value,
      associatedRoute,
      createdAt: new Date().toISOString(),
    }));

    if (documents.length > 0) {
      await db.collection("shared").insertMany(documents);
    }

    res.json({
      message: "Characterization refreshed successfully",
      count: documents.length,
      boardId,
      collectionId,
      field,
    });
  } catch (error) {
    console.error("Error refreshing characterization:", error);
    res.status(500).json({
      error: "Unable to refresh characterization",
      details: error.message,
    });
  }
});

// Get collection size
router.route("/admin/collection-size/:name").get(async (req, res) => {
  try {
    let collectionName = req.params.name;
    if (req.query.dashboardId !== undefined) {
      if (typeof req.query.dashboardId !== "string" || !req.query.dashboardId) {
        return res.status(400).json({ error: "Invalid dashboardId" });
      }
      const { matches } = await resolveStagingVersionCollection(req.query.dashboardId, collectionName);
      if (matches.length > 1) {
        return res.status(409).json({ error: "Plusieurs collections staging correspondent à cette version" });
      }
      if (matches.length === 0) {
        return res.status(404).json({ error: "Collection not found" });
      }
      [collectionName] = matches;
    }
    const collectionExists = await db.listCollections({ name: collectionName }).hasNext();
    if (!collectionExists) {
      return res.status(404).json({ error: "Collection not found" });
    }
    // Estimation lue dans les métadonnées de la collection, instantanée. Avant, `countDocuments` parcourait toute
    // la collection, pour chaque ligne de version affichée dans l'admin : la page devenait lente sur de grosses collections.
    const totalDocs = await db.collection(collectionName).estimatedDocumentCount();
    res.json({ size: totalDocs });
  } catch (error) {
    logger.error(`Error getting collection size: ${sanitizeErrorMessage(error.message)}`);
    res.status(500).json({
      error: "Unable to get collection size",
      details: sanitizeErrorMessage(error.message),
    });
  }
});

// Get copy progress
router.route("/admin/copy-progress/:name").get(async (req, res) => {
  try {
    const collectionName = req.params.name;
    const copiedSize = copyProgress.get(collectionName) || 0;
    res.json({ copiedSize });
  } catch (error) {
    console.error("Error getting copy progress:", error);
    res.status(500).json({
      error: "Unable to get copy progress",
      details: error.message,
    });
  }
});

// Initialize dashboard structure from template
router.route("/admin/initialize-dashboard-structure").post(async (req, res) => {
  // Vérifier que l'on est en localhost
  const host = req.get("host");
  if (!host || !host.includes("localhost")) {
    return res.status(403).json({
      error: "This operation is only allowed on localhost",
    });
  }

  const filters = checkQuery(req.body, ["dashboardId"], res);
  const { dashboardId } = filters;

  try {
    // Convertir l'ID en différents formats
    const dashboardIdKebab = dashboardId.toLowerCase().replace(/_/g, "-");
    const dashboardIdCamel = dashboardId
      .split(/[-_]/)
      .map((word, index) => {
        const lowerWord = word.toLowerCase();
        return index === 0
          ? lowerWord
          : lowerWord.charAt(0).toUpperCase() + lowerWord.slice(1);
      })
      .join("");
    const dashboardIdPascal = dashboardId
      .split(/[-_]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join("");

    // Chemins des répertoires
    const projectRoot = path.resolve(__dirname, "../../../..");
    const clientTemplateDir = path.join(
      projectRoot,
      "client/src/boards/template",
    );
    const serverTemplateDir = path.join(
      projectRoot,
      "server/src/routes/boards/template",
    );

    const clientTargetDir = path.join(
      projectRoot,
      `client/src/boards/${dashboardIdKebab}`,
    );
    const serverTargetDir = path.join(
      projectRoot,
      `server/src/routes/boards/${dashboardIdKebab}`,
    );

    // Vérifier que les répertoires template existent
    if (!fs.existsSync(clientTemplateDir)) {
      return res
        .status(404)
        .json({ error: "Client template directory not found" });
    }
    if (!fs.existsSync(serverTemplateDir)) {
      return res
        .status(404)
        .json({ error: "Server template directory not found" });
    }

    // Vérifier que le dashboard n'existe pas déjà
    if (fs.existsSync(clientTargetDir)) {
      return res
        .status(409)
        .json({ error: "Client dashboard directory already exists" });
    }
    if (fs.existsSync(serverTargetDir)) {
      return res
        .status(409)
        .json({ error: "Server dashboard directory already exists" });
    }

    // Fonction pour copier récursivement en remplaçant les templates
    const copyAndReplace = (srcDir, destDir) => {
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }

      const entries = fs.readdirSync(srcDir, { withFileTypes: true });

      for (const entry of entries) {
        const srcPath = path.join(srcDir, entry.name);
        const destPath = path.join(destDir, entry.name);

        if (entry.isDirectory()) {
          copyAndReplace(srcPath, destPath);
        } else {
          let content = fs.readFileSync(srcPath, "utf8");

          // Remplacements
          content = content.replace(/template/g, dashboardIdKebab);
          content = content.replace(/Template/g, dashboardIdPascal);

          fs.writeFileSync(destPath, content, "utf8");
        }
      }
    };

    // Copier les structures
    copyAndReplace(clientTemplateDir, clientTargetDir);
    copyAndReplace(serverTemplateDir, serverTargetDir);

    // Modifier client/src/router.tsx
    const clientRouterPath = path.join(
      projectRoot,
      "client/src/commons/router.tsx",
    );
    let clientRouterContent = fs.readFileSync(clientRouterPath, "utf8");

    // Ajouter l'import
    const importLine = `import ${dashboardIdPascal}Routes from "../boards/${dashboardIdKebab}/routes.tsx";`;
    const importInsertionPoint = clientRouterContent.indexOf(
      "import TemplateRoutes",
    );
    if (importInsertionPoint !== -1) {
      clientRouterContent =
        clientRouterContent.slice(0, importInsertionPoint) +
        importLine +
        "\n" +
        clientRouterContent.slice(importInsertionPoint);
    }

    // Ajouter la route
    const routeLine = ```
      <Route
        path="/${dashboardIdKebab}"
        element={<Navigate to="/${dashboardIdKebab}/home" replace />}
      />
      <Route path="/${dashboardIdKebab}/*" element={<${dashboardIdPascal}Routes />} />
      ```;
    const routeInsertionPoint = clientRouterContent.indexOf(
      '<Route path="/template/*"',
    );
    if (routeInsertionPoint !== -1) {
      const lineEnd = clientRouterContent.indexOf("\n", routeInsertionPoint);
      clientRouterContent =
        clientRouterContent.slice(0, lineEnd + 1) +
        routeLine +
        "\n" +
        clientRouterContent.slice(lineEnd + 1);
    }

    fs.writeFileSync(clientRouterPath, clientRouterContent, "utf8");

    // Modifier server/src/router.js
    const serverRouterPath = path.join(projectRoot, "server/src/router.js");
    let serverRouterContent = fs.readFileSync(serverRouterPath, "utf8");

    // Ajouter l'import (utiliser camelCase pour le nom de variable)
    const serverImportLine = `import ${dashboardIdCamel}Router from "./routes/boards/${dashboardIdKebab}/index.js";`;
    const serverImportInsertionPoint = serverRouterContent.indexOf(
      "import templateRouter",
    );
    if (serverImportInsertionPoint !== -1) {
      serverRouterContent =
        serverRouterContent.slice(0, serverImportInsertionPoint) +
        serverImportLine +
        "\n" +
        serverRouterContent.slice(serverImportInsertionPoint);
    }

    // Ajouter l'utilisation du router
    const useRouterLine = `router.use(${dashboardIdCamel}Router);`;
    const useRouterInsertionPoint = serverRouterContent.indexOf(
      "router.use(templateRouter)",
    );
    if (useRouterInsertionPoint !== -1) {
      const lineEnd = serverRouterContent.indexOf(
        "\n",
        useRouterInsertionPoint,
      );
      serverRouterContent =
        serverRouterContent.slice(0, lineEnd + 1) +
        useRouterLine +
        "\n" +
        serverRouterContent.slice(lineEnd + 1);
    }

    fs.writeFileSync(serverRouterPath, serverRouterContent, "utf8");

    res.json({
      message: "Dashboard structure initialized successfully",
      dashboardId,
      clientDir: clientTargetDir,
      serverDir: serverTargetDir,
    });
  } catch (error) {
    console.error("Error initializing dashboard structure:", error);
    res.status(500).json({
      error: "Unable to initialize dashboard structure",
      details: error.message,
    });
  }
});

export default router;
