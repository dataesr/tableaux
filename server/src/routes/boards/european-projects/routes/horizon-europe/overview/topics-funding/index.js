import express from "express";
import { db } from "../../../../../../../services/mongo.js";
import { checkQuery, recreateIndex } from "../../../../../../utils.js";

const router = new express.Router();

const collection_projects_entities = "european-projects_projects-entities";

router.route("/european-projects/overview/topics-funding").get(async (req, res) => {
  const filters = checkQuery(req.query, ["country_code"], res);

  if (req.query.thematics) {
    const thematics = req.query.thematics.split(",");
    filters.thema_code = { $in: thematics };
  }
  if (req.query.pillars) {
    filters.pilier_code = req.query.pillars;
  }
  if (req.query.programs) {
    filters.programme_code = req.query.programs;
  }

  delete filters.pillars;
  delete filters.programs;
  delete filters.destinations;

  if (req.query.isEjo) {
    filters["is_ejo"] = { $eq: req.query.isEjo === "true" ? true : false };
  }

  const data = await db
    .collection(collection_projects_entities)
    .aggregate([
      { $match: { $and: [filters] } },
      {
        $group: {
          _id: {
            topic: "$thema_code",
            stage: "$stage",
            thema_name_fr: "$thema_name_fr",
            thema_name_en: "$thema_name_en",
            // pilier_code: "$pilier_code",
            // programme_code: "$programme_code",
          },
          total_fund_eur: { $sum: "$calculated_fund" },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          topic: "$_id.topic",
          thema_name_fr: "$_id.thema_name_fr",
          thema_name_en: "$_id.thema_name_en",
          stage: "$_id.stage",
          total_fund_eur: 1,
          // pilier_code: "$_id.pilier_code",
          // programme_code: "$_id.programme_code",
          count: 1,
        },
      },
      { $sort: { total_fund_eur: -1 } },
    ])
    .toArray();

  const successRates = data.reduce((acc, item) => {
    const topic = item.topic;
    if (!acc[topic]) {
      acc[topic] = { successful: 0, evaluated: 0 };
    }
    if (item.stage === "successful") {
      acc[topic].successful += item.total_fund_eur;
    } else if (item.stage === "evaluated") {
      acc[topic].evaluated += item.total_fund_eur;
    }
    return acc;
  }, {});

  const successRateByTopic = Object.entries(successRates).map(([topic, { successful, evaluated }]) => ({
    topic,
    successRate: evaluated > 0 ? successful / evaluated : 0,
  }));

  res.json({ data, successRateByTopic });
});

// Route pour créer le covered index de topics-funding
router.route("/european-projects/overview/topics-funding_indexes").get(async (req, res) => {
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
        thema_name_en: 1,
        thema_name_fr: 1,
        calculated_fund: 1,
      },
      "idx_topics-funding_covered",
    );

    res.status(201).json({ message: "Index recréé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la recréation de l'index:", error);
    res.status(500).json({ error: "Erreur lors de la recréation de l'index" });
  }
});

export default router;
