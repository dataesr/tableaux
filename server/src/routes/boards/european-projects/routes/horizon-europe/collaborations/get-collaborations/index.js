import express from "express";
import { db } from "../../../../../../../services/mongo.js";
import { checkQuery, recreateIndex } from "../../../../../../utils.js";

const router = new express.Router();

const collection_collaborations = "european-projects_collaborations";

router
  .route("/european-projects/collaborations/get-collaborations")
  .get(async (req, res) => {
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
          // 1. Projets distincts par (pays, année, stage)
          {
            $group: {
              _id: {
                country_code: "$country_code_collab",
                call_year: "$call_year",
                stage: "$stage",
              },
              country_name_fr: { $first: "$country_name_fr_collab" },
              country_name_en: { $first: "$country_name_en_collab" },
              project_ids: { $addToSet: "$project_id" },
            },
          },
          // 2. Tri pour que les by_stage soient ordonnés
          { $sort: { "_id.stage": 1 } },
          // 3. Regroupement par (pays, année) : les stages deviennent by_stage
          {
            $group: {
              _id: {
                country_code: "$_id.country_code",
                call_year: "$_id.call_year",
              },
              country_name_fr: { $first: "$country_name_fr" },
              country_name_en: { $first: "$country_name_en" },
              // unique_project_ids: { $push: "$unique_project_ids" },
              stage_project_ids: { $push: "$project_ids" },
              by_stage: {
                $push: {
                  stage: "$_id.stage",
                  total_collaborations: { $size: "$project_ids" },
                },
              },
            },
          },
          // 4. Projets distincts de l'année (union des projets de tous ses stages)
          {
            $set: {
              year_project_ids: {
                $reduce: {
                  input: "$stage_project_ids",
                  initialValue: [],
                  in: { $setUnion: ["$$value", "$$this"] },
                },
              },
            },
          },
          // 5. Tri pour que les by_year soient ordonnés
          { $sort: { "_id.call_year": 1 } },
          // 6. Regroupement par pays : les années deviennent by_year
          {
            $group: {
              _id: "$_id.country_code",
              country_name_fr: { $first: "$country_name_fr" },
              country_name_en: { $first: "$country_name_en" },
              all_project_ids: { $push: "$year_project_ids" },
              by_year: {
                $push: {
                  year: "$_id.call_year",
                  total_collaborations: { $size: "$year_project_ids" },
                  by_stage: "$by_stage",
                },
              },
            },
          },
          // 7. Total distinct du pays + mise en forme
          {
            $project: {
              _id: 0,
              country_code: "$_id",
              country_name_fr: 1,
              country_name_en: 1,
              total_collaborations: {
                $size: {
                  $reduce: {
                    input: "$all_project_ids",
                    initialValue: [],
                    in: { $setUnion: ["$$value", "$$this"] },
                  },
                },
              },
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
router
  .route("/european-projects/collaborations/get-collaborations_indexes")
  .get(async (req, res) => {
    try {
      await recreateIndex(
        db.collection(collection_collaborations),
        {
          country_code_collab: 1,
          country_code: 1,
          country_name_en_collab: 1,
          country_name_fr_collab: 1,
          destination_code: 1,
          pilier_code: 1,
          programme_code: 1,
          project_id: 1,
          thema_code: 1,
        },
        "idx_collaborations_covered",
      );

      res.status(201).json({ message: "Index recréé avec succès" });
    } catch (error) {
      console.error("Erreur lors de la recréation de l'index:", error);
      res
        .status(500)
        .json({ error: "Erreur lors de la recréation de l'index" });
    }
  });

export default router;
