import express from "express";
import { db } from "../../../../services/mongo.js";

// Fonction utilitaire pour gérer les index
async function recreateIndex(collection, indexSpec, indexName) {
  try {
    // Vérifier si des index existent avec les mêmes spécifications
    const existingIndexes = await collection.listIndexes().toArray();

    // Vérifier l'existence d'index similaires
    for (const index of existingIndexes) {
      // Comparer les spécifications de l'index
      const isSpecMatch = Object.entries(indexSpec).every(
        ([key, value]) => index.key[key] === value
      );

      if (isSpecMatch) {
        // Si l'index existe avec un nom différent, le supprimer
        await collection.dropIndex(index.name);
        console.log(
          `Index existant ${index.name} supprimé car spécifications identiques`
        );
      }
    }

    // Créer le nouvel index avec le nom souhaité
    await collection.createIndex(indexSpec, { name: indexName });
    console.log(`Index ${indexName} créé avec succès`);

    return true;
  } catch (error) {
    console.error(`Erreur lors de la gestion de l'index ${indexName}:`, error);
    throw error;
  }
}

const router = new express.Router();
const routesPrefix = "/european-projects/evolution-pcri";

const collections_projects_evolution = "european-projects_evolution_staging";

router
  .route(routesPrefix + "/get-evolution-by-country")
  .get(async (req, res) => {
    const filters = {};

    // Filtre optionnel pour country_code
    if (req.query.country_code) {
      filters.country_code = req.query.country_code.toUpperCase();
    }

    // Filtres optionnels
    if (req.query.frameworks) {
      const frameworks = req.query.frameworks.split("|");
      filters.framework = { $in: frameworks };
    }
    if (req.query.stages) {
      const stages = req.query.stages.split("|");
      filters.stage = { $in: stages };
    }
    if (req.query.call_years) {
      const callYears = req.query.call_years.split("|");
      filters.call_year = { $in: callYears };
    }

    try {
      const evolution = await db
        .collection(collections_projects_evolution)
        .find(filters)
        .project({
          _id: 0,
          call_year: 1,
          framework: 1,
          country_name_fr: 1,
          country_code: 1,
          stage: 1,
          number_involved: 1,
          coordination_number: 1,
          funding: 1,
          project_number: 1,
          share_number_involved: 1,
          share_coordination_number: 1,
          share_funding: 1,
          share_project_number: 1,
        })
        .sort({ call_year: 1, framework: 1 })
        .toArray();

      res.status(200).json(evolution);
    } catch (error) {
      console.error("Error fetching evolution by country:", error);
      res.status(500).json({ error: "Erreur interne du serveur" });
    }
  });

// Route pour créer l'index pour get-evolution-by-country
router
  .route(routesPrefix + "/get-evolution-by-country_indexes")
  .get(async (req, res) => {
    try {
      await recreateIndex(
        db.collection(collections_projects_evolution),
        {
          country_code: 1,
          framework: 1,
          stage: 1,
          call_year: 1,
        },
        "idx_evolution_by_country",
      );

      res.status(201).json({ message: "Index recréé avec succès" });
    } catch (error) {
      console.error("Erreur lors de la recréation de l'index:", error);
      res
        .status(500)
        .json({ error: "Erreur lors de la recréation de l'index" });
    }
  });

// Route pour récupérer l'évolution globale (tous pays)
router.route(routesPrefix + "/get-evolution-global").get(async (req, res) => {
  const filters = {};

  // Filtres optionnels
  if (req.query.frameworks) {
    const frameworks = req.query.frameworks.split("|");
    filters.framework = { $in: frameworks };
  }
  if (req.query.stages) {
    const stages = req.query.stages.split("|");
    filters.stage = { $in: stages };
  }
  if (req.query.call_years) {
    const callYears = req.query.call_years.split("|");
    filters.call_year = { $in: callYears };
  }
  // Filtrer pour obtenir uniquement les données "ALL" (tous pays)
  filters.country_code = "ALL";

  try {
    const evolution = await db
      .collection(collections_projects_evolution)
      .find(filters)
      .project({
        _id: 0,
        call_year: 1,
        framework: 1,
        country_name_fr: 1,
        country_code: 1,
        stage: 1,
        number_involved: 1,
        coordination_number: 1,
        funding: 1,
        project_number: 1,
        share_number_involved: 1,
        share_coordination_number: 1,
        share_funding: 1,
        share_project_number: 1,
      })
      .sort({ call_year: 1, framework: 1 })
      .toArray();

    res.status(200).json(evolution);
  } catch (error) {
    console.error("Error fetching global evolution:", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
});

// Route pour récupérer l'évolution par framework
router
  .route(routesPrefix + "/get-evolution-by-framework")
  .get(async (req, res) => {
    const filters = {};

    if (req.query.country_code) {
      filters.country_code = req.query.country_code;
    }
    if (req.query.stages) {
      const stages = req.query.stages.split("|");
      filters.stage = { $in: stages };
    }

    try {
      const evolution = await db
        .collection(collections_projects_evolution)
        .aggregate([
          { $match: filters },
          {
            $group: {
              _id: {
                framework: "$framework",
                call_year: "$call_year",
                stage: "$stage",
              },
              total_funding: { $sum: "$funding" },
              total_projects: { $sum: "$project_number" },
              total_involved: { $sum: "$number_involved" },
              total_coordination: { $sum: "$coordination_number" },
            },
          },
          {
            $project: {
              _id: 0,
              framework: "$_id.framework",
              call_year: "$_id.call_year",
              stage: "$_id.stage",
              total_funding: 1,
              total_projects: 1,
              total_involved: 1,
              total_coordination: 1,
            },
          },
          {
            $sort: {
              call_year: 1,
              framework: 1,
            },
          },
        ])
        .toArray();

      res.status(200).json(evolution);
    } catch (error) {
      console.error("Error fetching evolution by framework:", error);
      res.status(500).json({ error: "Erreur interne du serveur" });
    }
  });

export default router;
