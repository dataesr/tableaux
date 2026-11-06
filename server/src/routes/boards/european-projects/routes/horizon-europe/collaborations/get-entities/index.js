import express from "express";
import { db } from "../../../../../../../services/mongo.js";
import { recreateIndex } from "../../../../../../utils.js";

const router = new express.Router();

const collection_projects_entities = "european-projects_projects-entities";

router.route("/european-projects/collaborations/get-entities").get(async (req, res) => {
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

// Route pour créer l'index pour get-entities
router.route("/european-projects/collaborations/get-entities_indexes").get(async (req, res) => {
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

export default router;
