import express from "express";
import { db } from "../../../../../../../services/mongo.js";
import { recreateIndex } from "../../../../../../utils.js";

const router = new express.Router();

const collection_projects_entities = "european-projects_projects-entities";

// Route pour obtenir les suggestions d'entités (top 5 par nombre de projets)
router.route("/european-projects/collaborations/get-suggested-entities").get(async (req, res) => {
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

// Route pour créer le covered index de get-suggested-entities
router.route("/european-projects/collaborations/get-suggested-entities_indexes").get(async (req, res) => {
  try {
    await recreateIndex(
      db.collection(collection_projects_entities),
      {
        country_code: 1,
        entities_id: 1,
        entities_name: 1,
      },
      "idx_get-suggested-entities_covered",
    );

    res.status(201).json({ message: "Index recréé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la recréation de l'index:", error);
    res.status(500).json({ error: "Erreur lors de la recréation de l'index" });
  }
});

export default router;
