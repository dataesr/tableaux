import express from "express";

import { db } from "../../../../../../../services/mongo.js";
import { recreateIndex } from "../../../../../../utils.js";

const router = new express.Router();

const collection_projects_entities = "european-projects_projects-entities";

router
  .route("/european-projects/positioning/top-10-beneficiaries")
  .get(async (req, res) => {
    const filters = { framework: "Horizon Europe" };

    // test filters (pillars, programs, thematics, destinations)
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
      const filteredThematics = thematics.filter(
        (thematic) => !["ERC", "MSCA"].includes(thematic),
      );
      filters.thema_code = { $in: filteredThematics };
    }
    if (req.query.destinations) {
      const destinations = req.query.destinations.split(",");
      filters.destination_code = { $in: destinations };
    }
    if (req.query.isEjo) {
      filters["is_ejo"] = { $eq: req.query.isEjo === "true" ? true : false };
    }
    if (req.query.range_of_years) {
      filters.call_year = { $in: req.query.range_of_years.split(/[|,]/) };
    }
    filters.stage = "successful";

    const data = await db
      .collection(collection_projects_entities)
      .aggregate([
        { $match: filters },
        {
          $group: {
            _id: {
              name_fr: "$country_name_fr",
              name_en: "$country_name_en",
              id: "$country_code",
            },
            total_fund_eur: { $sum: "$calculated_fund" },
          },
        },
        {
          $project: {
            _id: 0,
            name_fr: "$_id.name_fr",
            name_en: "$_id.name_en",
            id: "$_id.id",
            total_fund_eur: 1,
          },
        },
        {
          $sort: { total_fund_eur: -1 },
        },
      ])
      .toArray();

    let acc = 0;
    const total_fund_eur = data.reduce((acc, el) => acc + el.total_fund_eur, 0);
    const dataReturn = {
      total_fund_eur,
      top10: data
        .map((el) => {
          if (el.id !== "ZOE" && el.id !== "ZOI") {
            acc += el.total_fund_eur;
            return {
              ...el,
              influence: (acc / total_fund_eur) * 100,
            };
          }
        })
        .filter((el) => el),
    };

    return res.json(dataReturn);
  });

// Route pour créer le covered index de top-10-beneficiaries
router
  .route("/european-projects/positioning/top-10-beneficiaries_indexes")
  .get(async (req, res) => {
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
          country_name_en: 1,
          country_name_fr: 1,
          calculated_fund: 1,
        },
        "idx_top-10-beneficiaries_covered",
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
