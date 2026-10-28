import express from "express";
import { db } from "../../../../../../../services/mongo.js";
import { checkQuery, recreateIndex } from "../../../../../../utils.js";

const router = new express.Router();

const collection_collaborations = "european-projects_collaborations";

router.route("/european-projects/collaborations/get-collaborations").get(async (req, res) => {
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
  if (req.query.isEjo) {
    filters["is_ejo"] = { $eq: req.query.isEjo === "true" ? true : false };
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
router.route("/european-projects/collaborations/get-collaborations_indexes").get(async (req, res) => {
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

export default router;
