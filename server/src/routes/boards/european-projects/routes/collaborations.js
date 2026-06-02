import express from "express";
import { db } from "../../../../services/mongo.js";
import { checkQuery } from "../../../utils.js";

// Fonction utilitaire pour gérer les index
async function recreateIndex(collection, indexSpec, indexName) {
  try {
    // Vérifier si des index existent avec les mêmes spécifications
    const existingIndexes = await collection.listIndexes().toArray();

    // Vérifier l'existence d'index similaires
    for (const index of existingIndexes) {
      // Comparer les spécifications de l'index
      const isSpecMatch = Object.entries(indexSpec).every(([key, value]) => index.key[key] === value);

      if (isSpecMatch) {
        // Si l'index existe avec un nom différent, le supprimer
        await collection.dropIndex(index.name);
        console.log(`Index existant ${index.name} supprimé car spécifications identiques`);
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
const routesPrefix = "/european-projects/collaborations";

const collection_projects_entities = "european-projects_projects-entities_staging";
const collection_collaborations = "european-projects_collaborations_staging";

router.route(routesPrefix + "/get-entities").get(async (req, res) => {
  const { entityName, country_code } = req.query;

  if (entityName && entityName.length < 3) {
    return res.status(400).json({
      error: "Le terme de recherche doit contenir au moins 3 caractères",
    });
  }

  try {
    const entities = await db
      .collection(collection_projects_entities)
      .aggregate([
        {
          $match: {
            ...(entityName && { entities_name: { $regex: entityName, $options: "i" } }),
            ...(country_code && { country_code }),
          },
        },
        {
          $group: {
            _id: "$entities_id",
            entities_name: { $first: "$entities_name" },
            entities_id: { $first: "$entities_id" },
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            entities_name: 1,
            entities_id: 1,
            count: 1,
          },
        },
        {
          $sort: {
            count: -1, // Tri par ordre décroissant du nombre d'occurrences
          },
        },
      ])
      .toArray();

    res.status(200).json(entities);
  } catch (error) {
    console.error("Error fetching entities:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Route pour obtenir les suggestions d'entités (top 5 par nombre de projets)
router.route(routesPrefix + "/get-suggested-entities").get(async (req, res) => {
  const { country_code } = req.query;

  try {
    const suggestedEntities = await db
      .collection(collection_projects_entities)
      .aggregate([
        {
          $match: {
            ...(country_code && { country_code }),
          },
        },
        {
          $group: {
            _id: "$entities_id",
            entities_name: { $first: "$entities_name" },
            entities_id: { $first: "$entities_id" },
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            entities_name: 1,
            entities_id: 1,
            count: 1,
          },
        },
        {
          $sort: {
            count: -1, // Tri par ordre décroissant du nombre de projets
          },
        },
        {
          $limit: 5, // Limiter à 5 suggestions
        },
      ])
      .toArray();

    res.status(200).json(suggestedEntities);
  } catch (error) {
    console.error("Error fetching suggested entities:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Route pour créer l'index pour get-entities
router.route(routesPrefix + "/get-entities_indexes").get(async (req, res) => {
  try {
    await recreateIndex(
      db.collection(collection_projects_entities),
      {
        entities_name: 1,
        country_code: 1,
        entities_id: 1,
      },
      "idx_entities_covered",
    );

    res.status(201).json({ message: "Index recréé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la recréation de l'index:", error);
    res.status(500).json({ error: "Erreur lors de la recréation de l'index" });
  }
});

router.route(routesPrefix + "/get-collaborations").get(async (req, res) => {
  const filters = checkQuery(req.query, ["country_code"], res);

  if (req.query.pillars) {
    const pillars = req.query.pillars.split("|");
    filters.pilier_code = { $in: pillars };
  }
  if (req.query.programs) {
    const programs = req.query.programs.split("|");
    filters.programme_code = { $in: programs };
  }
  if (req.query.thematics) {
    const thematics = req.query.thematics.split(",");
    filters.thema_code = { $in: thematics };
  }
  if (req.query.destinations) {
    const destinations = req.query.destinations.split(",");
    filters.destination_code = { $in: destinations };
  }
  if (req.query.call_year) {
    const callYears = req.query.call_year.split(",");
    filters.call_year = { $in: callYears };
  }

  try {
    const collaborations = await db
      .collection(collection_collaborations)
      .aggregate([
        { $match: { ...filters } },
        {
          $group: {
            _id: {
              country_code: "$country_code_collab",
              call_year: "$call_year",
            },
            country_name_fr: { $first: "$country_name_fr_collab" },
            country_name_en: { $first: "$country_name_en_collab" },
            unique_project_ids: { $addToSet: "$project_id" },
            total_cost: { $sum: "$total_cost" },
          },
        },
        {
          $group: {
            _id: "$_id.country_code",
            country_name_fr: { $first: "$country_name_fr" },
            country_name_en: { $first: "$country_name_en" },
            unique_project_ids: { $push: "$unique_project_ids" },
            total_amount: { $sum: "$total_cost" },
            by_year: {
              $push: {
                year: "$_id.call_year",
                count: { $size: "$unique_project_ids" },
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            country_code: "$_id",
            country_name_fr: 1,
            country_name_en: 1,
            total_collaborations: {
              $size: {
                $reduce: {
                  input: "$unique_project_ids",
                  initialValue: [],
                  in: { $setUnion: ["$$value", "$$this"] },
                },
              },
            },
            total_amount: 1,
            by_year: 1,
          },
        },
        {
          $sort: {
            total_collaborations: -1,
          },
        },
      ])
      .toArray();

    res.status(200).json(collaborations);
  } catch (error) {
    console.error("Error fetching collaborations:", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
});

// Route pour créer l'index pour get-collaborations
router.route(routesPrefix + "/get-collaborations_indexes").get(async (req, res) => {
  try {
    await recreateIndex(
      db.collection(collection_collaborations),
      {
        country_code: 1,
        country_code_collab: 1,
        country_name_fr_collab: 1,
        country_name_en_collab: 1,
        project_id: 1,
        pilier_code: 1,
        programme_code: 1,
        thema_code: 1,
        destination_code: 1,
      },
      "idx_collaborations_covered",
    );

    res.status(201).json({ message: "Index recréé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la recréation de l'index:", error);
    res.status(500).json({ error: "Erreur lors de la recréation de l'index" });
  }
});

// Route pour récupérer les collaborations par pays en fonction du pays en cours et du pays collaborateur
router.route(routesPrefix + "/get-collaborations-by-country").get(async (req, res) => {
  const { country_code, country_code_collab } = req.query;
  if (!country_code || !country_code_collab) {
    return res.status(400).json({ error: "Les codes pays sont requis" });
  }

  const filters = checkQuery(req.query, ["country_code", "country_code_collab"], res);

  if (req.query.pillars) {
    const pillars = req.query.pillars.split("|");
    filters.pilier_code = { $in: pillars };
  }
  if (req.query.programs) {
    const programs = req.query.programs.split("|");
    filters.programme_code = { $in: programs };
  }
  if (req.query.thematics) {
    const thematics = req.query.thematics.split(",");
    filters.thema_code = { $in: thematics };
  }
  if (req.query.destinations) {
    const destinations = req.query.destinations.split(",");
    filters.destination_code = { $in: destinations };
  }
  if (req.query.call_year) {
    const callYears = req.query.call_year.split(",");
    filters.call_year = { $in: callYears };
  }

  try {
    const collaborations = await db
      .collection(collection_collaborations)
      .find({ ...filters })
      .project({
        _id: 0,
        // abstract: 1,
        call_year: 1,
        country_code_collab: 1,
        country_code: 1,
        extra_joint_organizations_collab: 1,
        extra_joint_organizations: 1,
        flag_coordination: 1,
        part_num_collab: 1,
        part_num: 1,
        participates_as_collab: 1,
        participates_as: 1,
        participation_nuts_collab: 1,
        participation_nuts: 1,
        project_id: 1,
        proposal_budget: 1,
        total_cost: 1,
      })
      .toArray();

    res.status(200).json(collaborations);
  } catch (error) {
    console.error("Error fetching collaborations by country:", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
});

// Route de création de l'index pour les collaborations par pays
router.route(routesPrefix + "/get-collaborations-by-country_indexes").get(async (req, res) => {
  try {
    await recreateIndex(
      db.collection(collection_collaborations),
      {
        country_code: 1,
        country_code_collab: 1,
        pilier_code: 1,
        programme_code: 1,
        thema_code: 1,
        destination_code: 1,
        call_year: 1,
        flag_coordination: 1,
        participates_as: 1,
        participates_as_collab: 1,
        project_id: 1,
        proposal_budget: 1,
        total_cost: 1,
        part_num: 1,
        part_num_collab: 1,
        participation_nuts: 1,
        participation_nuts_collab: 1,
        extra_joint_organizations: 1,
        extra_joint_organizations_collab: 1,
      },
      "idx_collaborations-by-country_covered",
    );

    res.status(201).json({ message: "Index recréé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la recréation de l'index:", error);
    res.status(500).json({ error: "Erreur lors de la recréation de l'index" });
  }
});

// Route pour récupérer les collaborations d'une entité spécifique
router.route(routesPrefix + "/get-collaborations-by-entity").get(async (req, res) => {
  const { entity_id } = req.query;

  if (!entity_id) {
    return res.status(400).json({ error: "L'identifiant de l'entité est requis" });
  }

  // Construire les filtres optionnels
  const filters = { entities_id: entity_id };
  // Filtres sans entity_id pour le lookup total_projects
  const additionalFilters = {};

  if (req.query.pillars) {
    const pillars = req.query.pillars.split("|");
    filters.pilier_code = { $in: pillars };
    additionalFilters.pilier_code = { $in: pillars };
  }
  if (req.query.programs) {
    const programs = req.query.programs.split("|");
    filters.programme_code = { $in: programs };
    additionalFilters.programme_code = { $in: programs };
  }
  if (req.query.thematics) {
    const thematics = req.query.thematics.split(",");
    filters.thema_code = { $in: thematics };
    additionalFilters.thema_code = { $in: thematics };
  }
  if (req.query.destinations) {
    const destinations = req.query.destinations.split(",");
    filters.destination_code = { $in: destinations };
    additionalFilters.destination_code = { $in: destinations };
  }
  if (req.query.call_year) {
    const callYears = req.query.call_year.split(",");
    filters.call_year = { $in: callYears };
    additionalFilters.call_year = { $in: callYears };
  }

  // Construire le match pour le lookup total_projects
  const totalProjectsMatchConditions = [{ $eq: ["$entities_id", "$$entityId"] }];
  if (req.query.call_year) {
    const callYears = req.query.call_year.split(",");
    totalProjectsMatchConditions.push({ $in: ["$call_year", callYears] });
  }
  if (req.query.pillars) {
    const pillars = req.query.pillars.split("|");
    totalProjectsMatchConditions.push({ $in: ["$pilier_code", pillars] });
  }
  if (req.query.programs) {
    const programs = req.query.programs.split("|");
    totalProjectsMatchConditions.push({ $in: ["$programme_code", programs] });
  }
  if (req.query.thematics) {
    const thematics = req.query.thematics.split(",");
    totalProjectsMatchConditions.push({ $in: ["$thema_code", thematics] });
  }
  if (req.query.destinations) {
    const destinations = req.query.destinations.split(",");
    totalProjectsMatchConditions.push({ $in: ["$destination_code", destinations] });
  }

  try {
    // Récupérer d'abord les informations de l'entité
    const entityInfo = await db.collection(collection_projects_entities).findOne({ entities_id: entity_id }, { projection: { _id: 0, entities_name: 1 } });

    if (!entityInfo) {
      return res.status(404).json({ error: "Entité non trouvée" });
    }

    const entityCollaborations = await db
      .collection(collection_projects_entities)
      .aggregate([
        // Étape 1 : Récupérer tous les project_ids de l'entité avec les filtres
        {
          $match: filters,
        },
        {
          $group: {
            _id: null,
            project_ids: { $addToSet: "$project_id" },
          },
        },
        // Étape 2 : Rechercher toutes les entités qui collaborent sur ces projets
        {
          $lookup: {
            from: collection_projects_entities,
            let: { projectIds: "$project_ids" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [{ $in: ["$project_id", "$$projectIds"] }, { $ne: ["$entities_id", entity_id] }],
                  },
                },
              },
              {
                $group: {
                  _id: "$entities_id",
                  entities_name: { $first: "$entities_name" },
                  country_code: { $first: "$country_code" },
                  country_name_fr: { $first: "$country_name_fr" },
                  country_name_en: { $first: "$country_name_en" },
                  projects: {
                    $addToSet: {
                      project_id: "$project_id",
                      role: "$role",
                    },
                  },
                  total_collaborations: { $addToSet: "$project_id" },
                },
              },
              // On ajoute une étape pour calculer total_collaborations à partir de la taille du tableau
              {
                $addFields: {
                  total_collaborations: { $size: "$total_collaborations" },
                },
              },
              // Ajout d'une étape pour compter le nombre total de projets (avec les mêmes filtres)
              {
                $lookup: {
                  from: collection_projects_entities,
                  let: { entityId: "$_id" },
                  pipeline: [
                    {
                      $match: {
                        $expr: { $and: totalProjectsMatchConditions },
                      },
                    },
                    {
                      $group: {
                        _id: null,
                        total_projects: { $addToSet: "$project_id" },
                      },
                    },
                  ],
                  as: "entity_stats",
                },
              },
              {
                $addFields: {
                  total_projects: {
                    $size: { $ifNull: [{ $arrayElemAt: ["$entity_stats.total_projects", 0] }, []] },
                  },
                },
              },
              {
                $project: {
                  entity_stats: 0,
                },
              },
            ],
            as: "collaborating_entities",
          },
        },
        {
          $project: {
            _id: 0,
            collaborating_entities: {
              $sortArray: {
                input: "$collaborating_entities",
                sortBy: { total_collaborations: -1 },
              },
            },
          },
        },
      ])
      .toArray();

    if (!entityCollaborations.length) {
      return res.status(404).json({
        id: entity_id,
        name_fr: entityInfo.entities_name,
        name_en: entityInfo.entities_name, // Comme il n'y a pas de champ name_en dans la base, on utilise le même
        collaborations: [],
      });
    }

    res.status(200).json({
      id: entity_id,
      name_fr: entityInfo.entities_name,
      name_en: entityInfo.entities_name, // Comme il n'y a pas de champ name_en dans la base, on utilise le même
      collaborations: entityCollaborations[0].collaborating_entities,
    });
  } catch (error) {
    console.error("Error fetching entity collaborations:", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
});

// Mise à jour de l'index pour optimiser la nouvelle requête
router.route(routesPrefix + "/get-collaborations-by-entity_indexes").get(async (req, res) => {
  try {
    await Promise.all([
      recreateIndex(
        db.collection(collection_projects_entities),
        {
          entities_id: 1,
          project_id: 1,
          entities_name: 1,
          country_code: 1,
          role: 1,
        },
        "idx_entity_collaborations_main",
      ),
      recreateIndex(
        db.collection(collection_projects_entities),
        {
          entities_id: 1,
          project_id: 1,
        },
        "idx_entity_total_projects",
      ),
    ]);

    res.status(201).json({ message: "Index recréés avec succès" });
  } catch (error) {
    console.error("Erreur lors de la recréation des index:", error);
    res.status(500).json({ error: "Erreur lors de la recréation des index" });
  }
});

export default router;
