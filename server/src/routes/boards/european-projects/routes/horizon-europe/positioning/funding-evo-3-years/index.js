import express from "express";
import { db } from "../../../../../../../services/mongo.js";
import { recreateIndex } from "../../../../../../utils.js";

const router = new express.Router();

const collection_projects_entities = "european-projects_projects-entities";

router.route("/european-projects/positionning/funding-evo-3-years").get(async (req, res) => {
  const filters = {};
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
  filters.country_code = { $nin: ["ZOE", "ZOI"] };
  filters.call_year = { $in: ["2021", "2022", "2023"] };
  if (req.query.isEjo) {
    filters["is_ejo"] = { $eq: req.query.isEjo === "true" ? true : false };
  }
  filters.stage = "successful";

  const query = () => {
    return db
      .collection(collection_projects_entities)
      .aggregate([
        {
          $match: { $and: [filters] },
        },
        {
          $group: {
            _id: {
              stage: "$stage",
              call_year: "$call_year",
              id: "$country_code",
              name_fr: "$country_name_fr",
              name_en: "$country_name_en",
            },
            total_fund_eur: { $sum: "$calculated_fund" },
            total_coordination_number: { $sum: "$coordination_number" },
            total_number_involved: { $sum: "$number_involved" },
          },
        },
        {
          $group: {
            _id: {
              stage: "$_id.stage",
              id: "$_id.id",
              name_fr: "$_id.name_fr",
              name_en: "$_id.name_en",
            },
            data: {
              $push: {
                year: "$_id.call_year",
                total_fund_eur: "$total_fund_eur",
                total_coordination_number: "$total_coordination_number",
                total_number_involved: "$total_number_involved",
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            id: "$_id.id",
            name_fr: "$_id.name_fr",
            name_en: "$_id.name_en",
            stage: "$_id.stage",
            data: 1,
          },
        },
        {
          $sort: { "data.year": 1 },
        },
      ])
      .toArray();
  };

  const data = await query();
  return res.json(data);
});

// Route pour créer le covered index de funding-evo-3-years
router.route("/european-projects/positionning/funding-evo-3-years_indexes").get(async (req, res) => {
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
        call_year: 1,
        country_name_en: 1,
        country_name_fr: 1,
        calculated_fund: 1,
        coordination_number: 1,
        number_involved: 1,
      },
      "idx_funding-evo-3-years_covered",
    );

    res.status(201).json({ message: "Index recréé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la recréation de l'index:", error);
    res.status(500).json({ error: "Erreur lors de la recréation de l'index" });
  }
});

export default router;
