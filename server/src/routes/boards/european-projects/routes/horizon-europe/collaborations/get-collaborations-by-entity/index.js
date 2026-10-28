import express from "express";
import { db } from "../../../../../../../services/mongo.js";
import { recreateIndex } from "../../../../../../utils.js";

const router = new express.Router();

const collection_projects_entities = "european-projects_projects-entities";

// Route pour récupérer les collaborations d'une entité spécifique
router.route("/european-projects/collaborations/get-collaborations-by-entity").get(async (req, res) => {
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
  if (req.query.isEjo) {
    filters["is_ejo"] = { $eq: req.query.isEjo === "true" ? true : false };
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
  if (req.query.isEjo) {
    totalProjectsMatchConditions["is_ejo"] = { $eq: req.query.isEjo === "true" ? true : false };
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
router.route("/european-projects/collaborations/get-collaborations-by-entity_indexes").get(async (req, res) => {
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
