import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

import { db } from "../../services/mongo.js";
import { checkQuery } from "./utils.js";
import uploadVersionRoute from "./upload/upload-version.js";
import { getEmbeddings } from "./vectors.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = new express.Router();

const copyProgress = new Map();

router.use(uploadVersionRoute);

// list all dashboards from server
router.route("/admin/list-dashboards").get(async (req, res) => {
  const response = await db.collection("boards").find({}).toArray();
  res.json(response);
});

// add a new dashboard
router.route("/admin/add-dashboard").post(async (req, res) => {
  const filters = checkQuery(
    req.body,
    [
      "name_fr",
      "name_en",
      "id",
      "description_fr",
      "description_en",
      "url",
      "api_url",
    ],
    res,
  );
  const {
    name_fr,
    name_en,
    id,
    description_fr,
    description_en,
    url,
    api_url,
    isMultilingual,
    homePageVisible,
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
      name_fr,
      name_en,
      id,
      description_fr,
      description_en,
      url,
      api_url,
      isMultilingual: isMultilingual || false,
      homePageVisible: homePageVisible !== undefined ? homePageVisible : true,
      data: [],
      constants: [],
      createdAt: new Date().toISOString(),
      icon: "question-mark",
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
        if (parts.length < 3) {
          return null; // Ignorer les collections qui ne suivent pas la convention de nommage
        }

        const boardName = parts[0];
        const collectionName = collection.name;

        // Chercher la date de création dans la collection dashboards
        const dashboard = dashboards.find((d) => d.boardName === boardName);
        const collectionInfo = dashboard?.collections
          ?.filter((c) => c.name === collectionName)
          .sort((a, b) => b.createdAt - a.createdAt)[0];

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
  const collectionId = req.query.collectionId;
  if (!collectionId) {
    return res.status(400).json({ error: "Collection ID is required" });
  }

  try {
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

// update constant
router.route("/admin/update-constant").post(async (req, res) => {
  const filters = checkQuery(req.body, ["dashboardId", "key", "value"], res);
  const { dashboardId, key, value } = filters;

  const response = await db.collection("boards").updateOne(
    { id: dashboardId },
    { $set: { "constants.$[elem].value": value } },
    {
      arrayFilters: [{ "elem.key": key }],
    },
  );

  if (response.matchedCount === 0) {
    return res.status(404).json({ error: "No document found" });
  }

  // return current data
  const ret = await db.collection("boards").findOne({ id: dashboardId });
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

// get constants from a dashboard
router.route("/admin/get-constants").get(async (req, res) => {
  const dashboardId = req.query.dashboardId;
  if (!dashboardId) {
    return res.status(400).json({ error: "Dashboard ID is required" });
  }

  const board = await db.collection("boards").findOne({ id: dashboardId });
  if (!board) {
    return res.status(404).json({ error: "No document found" });
  }

  res.json(board.constants);
});

// router.route("/admin/get-ticket-office-messages").get(async (req, res) => {
//   try {
//     const params = new URLSearchParams({
//       fromApplication: "tableaux",
//       status: "new",
//     });

//     const response = await fetch(
//       `https://ticket-office.dataesr.ovh/api/contacts?${params}`,
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
    const collectionName = req.params.name;
    const totalDocs = await db.collection(collectionName).countDocuments();
    res.json({ size: totalDocs });
  } catch (error) {
    console.error("Error getting collection size:", error);
    res.status(500).json({
      error: "Unable to get collection size",
      details: error.message,
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
