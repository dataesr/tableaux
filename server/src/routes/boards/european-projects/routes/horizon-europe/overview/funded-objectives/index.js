import express from "express";
import { db } from "../../../../../../../services/mongo.js";
import { checkQuery, recreateIndex } from "../../../../../../utils.js";

const router = new express.Router();

const collection_projects_entities = "european-projects_projects-entities";

router.route("/european-projects/funded-objectives").get(async (req, res) => {
  // deprecated
  const filters = checkQuery(req.query, ["country_code", "extra_joint_organization", "stage"], res);
  if (req.query.isEjo) {
    filters["is_ejo"] = { $eq: req.query.isEjo === "true" ? true : false };
  }
  const data = await db
    .collection(collection_projects_entities)
    .aggregate([
      { $match: filters },
      {
        $group: {
          _id: {
            programme_name_en: "$programme_name_en",
            programme_name_fr: "$programme_name_fr",
            pilier_name_en: "$pilier_name_en",
            pilier_name_fr: "$pilier_name_fr",
          },
          total_funding: { $sum: "$calculated_fund" },
        },
      },
      {
        $project: {
          _id: 0,
          programme_name_en: "$_id.programme_name_en",
          programme_name_fr: "$_id.programme_name_fr",
          pilier_name_en: "$_id.pilier_name_en",
          pilier_name_fr: "$_id.pilier_name_fr",
          total_funding: 1,
        },
      },
      { $sort: { total_funding: -1 } },
    ])
    .toArray();
  res.json(data);
});

// Route pour créer le covered index de funded-objectives
router.route("/european-projects/funded-objectives_indexes").get(async (req, res) => {
  try {
    await recreateIndex(
      db.collection(collection_projects_entities),
      {
        country_code: 1,
        pilier_code: 1,
        programme_code: 1,
        thema_code: 1,
        destination_code: 1,
        is_ejo: 1,
        stage: 1,
        pilier_name_en: 1,
        pilier_name_fr: 1,
        programme_name_en: 1,
        programme_name_fr: 1,
        calculated_fund: 1,
      },
      "idx_funded-objectives_covered",
    );

    res.status(201).json({ message: "Index recréé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la recréation de l'index:", error);
    res.status(500).json({ error: "Erreur lors de la recréation de l'index" });
  }
});

export default router;
