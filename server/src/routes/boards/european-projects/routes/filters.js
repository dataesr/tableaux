import express from "express";
import { db } from "../../../../services/mongo.js";
import { recreateIndex } from "../../../utils.js";

const router = new express.Router();

const collection_projects_entities = "european-projects_projects-entities_staging";

router.route("/european-projects/filters-countries").get(async (req, res) => {
  try {
    const data = await db
      .collection(collection_projects_entities)
      .aggregate(
        [
          {
            $match: {
              country_code: { $ne: null },
            },
          },
          {
            $group: {
              _id: "$country_code",
              label_fr: { $first: "$country_name_fr" },
              label_en: { $first: "$country_name_en" },
              id: { $first: "$country_code" },
            },
          },
          {
            $project: {
              _id: 0,
              label_fr: 1,
              label_en: 1,
              id: 1,
            },
          },
          {
            $sort: { label_fr: 1 },
          },
        ],
        {
          collation: { locale: "fr", strength: 1 },
        },
      )
      .toArray();

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.route("/european-projects/filters-programs").get(async (req, res) => {
  try {
    const data = await db
      .collection(collection_projects_entities)
      .aggregate(
        [
          {
            $match: {
              programme_code: { $ne: null },
            },
          },
          {
            $group: {
              _id: "$programme_code",
              label_fr: { $first: "$programme_name_fr" },
              label_en: { $first: "$programme_name_en" },
              id: { $first: "$programme_code" },
            },
          },
          {
            $project: {
              _id: 0,
              label_fr: 1,
              label_en: 1,
              id: 1,
            },
          },
          {
            $sort: {
              label_fr: 1,
            },
          },
        ],
        {
          collation: { locale: "fr", strength: 1 },
        },
      )
      .toArray();

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.route("/european-projects/filters-thematics").get(async (req, res) => {
  try {
    const matchStage = {
      thema_code: { $ne: null },
    };

    if (req.query.programId === "all") {
      delete req.query.programId;
    }

    // Ajout du filtre sur programme_code si programId est présent
    if (req.query.programId) {
      matchStage.programme_code = req.query.programId;
    }

    const data = await db
      .collection(collection_projects_entities)
      .aggregate(
        [
          {
            $match: matchStage,
          },
          {
            $group: {
              _id: "$thema_code",
              label_fr: { $first: "$thema_name_fr" },
              label_en: { $first: "$thema_name_en" },
              id: { $first: "$thema_code" },
            },
          },
          {
            $project: {
              _id: 0,
              label_fr: 1,
              label_en: 1,
              id: 1,
            },
          },
          {
            $sort: {
              label_fr: 1,
            },
          },
        ],
        {
          collation: { locale: "fr", strength: 1 },
        },
      )
      .toArray();

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.route("/european-projects/filters-pillars").get(async (req, res) => {
  try {
    const data = await db
      .collection(collection_projects_entities)
      .aggregate(
        [
          {
            $match: {
              pilier_code: { $ne: null },
              framework: "Horizon Europe",
            },
          },
          {
            $group: {
              _id: "$pilier_code",
              label_fr: { $first: "$pilier_name_fr" },
              label_en: { $first: "$pilier_name_en" },
              id: { $first: "$pilier_code" },
            },
          },
          {
            $project: {
              _id: 0,
              label_fr: 1,
              label_en: 1,
              id: 1,
            },
          },
          {
            $sort: {
              label_fr: 1,
            },
          },
        ],
        {
          collation: { locale: "fr", strength: 1 },
        },
      )
      .toArray();

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.route("/european-projects/all-programs").get(async (req, res) => {
  try {
    const data = await db
      .collection(collection_projects_entities)
      .aggregate(
        [
          {
            $match: {
              programme_code: { $ne: null },
            },
          },
          {
            $group: {
              _id: "$programme_code",
              label_fr: { $first: "$programme_name_fr" },
              label_en: { $first: "$programme_name_en" },
              id: { $first: "$programme_code" },
            },
          },
          {
            $project: {
              _id: 0,
              label_fr: 1,
              label_en: 1,
              id: 1,
            },
          },
          {
            $sort: {
              label_fr: 1,
            },
          },
        ],
        {
          collation: { locale: "fr", strength: 1 },
        },
      )
      .toArray();

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.route("/european-projects/all-thematics").get(async (req, res) => {
  try {
    const data = await db
      .collection(collection_projects_entities)
      .aggregate(
        [
          {
            $match: {
              thema_code: { $ne: null },
            },
          },
          {
            $group: {
              _id: "$thema_code",
              label_fr: { $first: "$thema_name_fr" },
              label_en: { $first: "$thema_name_en" },
              id: { $first: "$thema_code" },
            },
          },
          {
            $project: {
              _id: 0,
              label_fr: 1,
              label_en: 1,
              id: 1,
            },
          },
          {
            $sort: {
              label_fr: 1,
            },
          },
        ],
        {
          collation: { locale: "fr", strength: 1 },
        },
      )
      .toArray();

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.route("/european-projects/all-destinations").get(async (req, res) => {
  try {
    const data = await db
      .collection(collection_projects_entities)
      .aggregate(
        [
          {
            $match: {
              destination_code: { $ne: null },
              destination_name_en: { $ne: null },
            },
          },
          {
            $group: {
              _id: "$destination_code",
              label_fr: { $first: "$destination_name_en" },
              label_en: { $first: "$destination_name_en" },
              id: { $first: "$destination_code" },
            },
          },
          {
            $project: {
              _id: 0,
              label_fr: 1,
              label_en: 1,
              id: 1,
            },
          },
          {
            $sort: {
              label_fr: 1,
            },
          },
        ],
        {
          collation: { locale: "fr", strength: 1 },
        },
      )
      .toArray();

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.route("/european-projects/programs-from-pillars").get(async (req, res) => {
  try {
    const data = await db
      .collection(collection_projects_entities)
      .aggregate(
        [
          {
            $match: {
              pilier_code: { $in: req.query.pillars.split("|") },
              framework: "Horizon Europe",
            },
          },
          {
            $group: {
              _id: "$programme_code",
              label_fr: { $first: "$programme_name_fr" },
              label_en: { $first: "$programme_name_en" },
              id: { $first: "$programme_code" },
            },
          },
          {
            $project: {
              _id: 0,
              label_fr: 1,
              label_en: 1,
              id: 1,
            },
          },
          {
            $sort: {
              label_fr: 1,
            },
          },
        ],
        {
          collation: { locale: "fr", strength: 1 },
        },
      )
      .toArray();

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.route("/european-projects/thematics-from-programs").get(async (req, res) => {
  try {
    const data = await db
      .collection(collection_projects_entities)
      .aggregate(
        [
          {
            $match: {
              programme_code: { $in: req.query.programs.split("|") },
              thema_code: { $ne: null },
            },
          },
          {
            $group: {
              _id: "$thema_code",
              label_fr: { $first: "$thema_name_fr" },
              label_en: { $first: "$thema_name_en" },
              id: { $first: "$thema_code" },
            },
          },
          {
            $project: {
              _id: 0,
              label_fr: 1,
              label_en: 1,
              id: 1,
            },
          },
          {
            $sort: {
              label_fr: 1,
            },
          },
        ],
        {
          collation: { locale: "fr", strength: 1 },
        },
      )
      .toArray();

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.route("/european-projects/destinations-from-thematics").get(async (req, res) => {
  try {
    const data = await db
      .collection(collection_projects_entities)
      .aggregate(
        [
          {
            $match: {
              thema_code: { $in: req.query.thematics.split(",") },
              destination_code: { $ne: null },
              destination_name_en: { $ne: null },
            },
          },
          {
            $group: {
              _id: "$destination_code",
              label_fr: { $first: "$destination_name_en" },
              label_en: { $first: "$destination_name_en" },
              id: { $first: "$destination_code" },
            },
          },
          {
            $project: {
              _id: 0,
              label_fr: 1,
              label_en: 1,
              id: 1,
            },
          },
          {
            $sort: {
              label_fr: 1,
            },
          },
        ],
        {
          collation: { locale: "fr", strength: 1 },
        },
      )
      .toArray();

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.route("/european-projects/get-countries-with-data").get(async (req, res) => {
  const defaultSort = { label_fr: 1 };

  try {
    const data = await db
      .collection(collection_projects_entities)
      .aggregate(
        [
          {
            $match: {
              country_code: { $ne: null },
            },
          },
          {
            $group: {
              _id: "$country_code",
              label_fr: { $first: "$country_name_fr" },
              label_en: { $first: "$country_name_en" },
              id: { $first: "$country_code" },
            },
          },
          {
            $project: {
              _id: 0,
              label_fr: 1,
              label_en: 1,
              id: 1,
            },
          },
          {
            $sort: defaultSort,
          },
        ],
        {
          collation: { locale: "fr", strength: 1 },
        },
      )
      .toArray();

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.route("/european-projects/get-hierarchy").get(async (req, res) => {
  try {
    const { pillarId } = req.query;

    // Si pillarId est fourni, filtrer uniquement sur ce pilier
    const pillarFilter = pillarId ? { pilier_code: pillarId } : {};

    const pillars = await db.collection(collection_projects_entities).distinct("pilier_code", {
      framework: "Horizon Europe",
      pilier_code: { $ne: null },
      ...pillarFilter,
    });

    const programs = await db
      .collection(collection_projects_entities)
      .aggregate([
        {
          $match: {
            framework: "Horizon Europe",
            pilier_code: { $in: pillars },
            programme_code: { $ne: null },
          },
        },
        {
          $group: {
            _id: { pilier_code: "$pilier_code", programme_code: "$programme_code" },
          },
        },
      ])
      .toArray();

    const thematics = await db
      .collection(collection_projects_entities)
      .aggregate([
        {
          $match: {
            framework: "Horizon Europe",
            programme_code: { $in: programs.map((p) => p._id.programme_code) },
            thema_code: { $ne: null },
          },
        },
        {
          $group: {
            _id: { programme_code: "$programme_code", thema_code: "$thema_code" },
          },
        },
      ])
      .toArray();

    const destinations = await db
      .collection(collection_projects_entities)
      .aggregate([
        {
          $match: {
            framework: "Horizon Europe",
            thema_code: { $in: thematics.map((t) => t._id.thema_code) },
            destination_code: { $ne: null },
          },
        },
        {
          $group: {
            _id: { thema_code: "$thema_code", destination_code: "$destination_code" },
          },
        },
      ])
      .toArray();

    const treeData = [];
    // Racine
    // treeData.push(["", "ep"]);

    // Piliers
    pillars.forEach((pillar) => {
      treeData.push(["ep", pillar]);
    });

    // Programmes
    programs.forEach((program) => {
      treeData.push([program._id.pilier_code, program._id.programme_code]);
    });

    // Thématiques (préfixées pour éviter les collisions)
    thematics.forEach((thematic) => {
      treeData.push([thematic._id.programme_code, `THEMA_${thematic._id.thema_code}`]);
    });

    // Destinations (préfixées pour éviter les collisions)
    destinations.forEach((destination) => {
      treeData.push([`THEMA_${destination._id.thema_code}`, `DEST_${destination._id.destination_code}`, 4]);
    });

    res.json(treeData);
  } catch (error) {
    console.error("Error in get-hierarchy:", error);
    res.status(500).json({ error: error.message });
  }
});

// Route pour créer l'index pour get-hierarchy
router.route("/european-projects/get-hierarchy_indexes").get(async (req, res) => {
  try {
    await recreateIndex(
      db.collection(collection_projects_entities),
      {
        // Champs de filtrage essentiels pour la hiérarchie
        framework: 1,
        pilier_code: 1,
        programme_code: 1,
        thema_code: 1,
        destination_code: 1,
        // Champs pour les noms (utiles pour le futur)
        pilier_name_fr: 1,
        programme_name_fr: 1,
        thema_name_fr: 1,
        destination_name_en: 1,
      },
      "idx_hierarchy_covered",
    );

    res.status(201).json({
      message: "Index pour get-hierarchy créé avec succès",
      indexName: "idx_hierarchy_covered",
      description: "Index optimisé pour la récupération de la hiérarchie des projets européens",
    });
  } catch (error) {
    console.error("Erreur lors de la création de l'index hierarchy:", error);
    res.status(500).json({ error: "Erreur lors de la création de l'index hierarchy" });
  }
});

export default router;
