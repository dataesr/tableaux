import express from "express";
import { db } from "../../../../../../services/mongo.js";
import { recreateIndex } from "../../../../../utils.js";

const router = new express.Router();

const collection_erc_projects_synthese = "european-projects_erc-projects-synthese";

/**
 * Route de synthèse par type de financement ERC (destination)
 * Retourne les données agrégées par destination_code (STG, COG, ADG, SYG, POC)
 */
router.route("/european-projects/erc/synthesis-by-destination").get(async (req, res) => {
  const filters = {};

  if (req.query.call_year) {
    const years = req.query.call_year.split(",");
    filters.call_year = { $in: years };
  }
  if (req.query.panel_id) {
    const panels = req.query.panel_id.split(",");
    filters.panel_code = { $in: panels };
  }
  if (req.query.framework) {
    filters.framework = req.query.framework;
  }
  if (req.query.country_code) {
    filters.country_code = req.query.country_code.toUpperCase();
  }
  if (req.query.isEjo) {
    filters["is_ejo"] = { $eq: req.query.isEjo === "true" ? true : false };
  }

  const data = await db
    .collection(collection_erc_projects_synthese)
    .aggregate([
      { $match: filters },
      {
        $group: {
          _id: {
            destination_code: "$destination_code",
            destination_name_en: "$destination_name_en",
            stage: "$stage",
          },
          total_funding_project: { $sum: "$calculated_fund" },
          total_funding_entity: { $sum: "$fund_ent_erc" },
          total_involved: { $sum: "$number_involved" },
          total_pi: { $sum: { $cond: [{ $eq: ["$role", "PI"] }, "$number_involved", 0] } },
          projects: { $addToSet: "$project_id" },
        },
      },
      {
        $project: {
          _id: 0,
          destination_code: "$_id.destination_code",
          destination_name_en: "$_id.destination_name_en",
          stage: "$_id.stage",
          total_funding_project: 1,
          total_funding_entity: 1,
          total_involved: 1,
          total_pi: 1,
          total_projects: { $size: "$projects" },
        },
      },
      { $sort: { destination_code: 1, stage: 1 } },
    ])
    .toArray();

  // Restructurer les données par destination
  const destinations = {};
  data.forEach((item) => {
    if (!destinations[item.destination_code]) {
      destinations[item.destination_code] = {
        destination_code: item.destination_code,
        destination_name_en: item.destination_name_en,
        evaluated: null,
        successful: null,
      };
    }
    destinations[item.destination_code][item.stage] = {
      total_funding_project: item.total_funding_project,
      total_funding_entity: item.total_funding_entity,
      total_involved: item.total_involved,
      total_pi: item.total_pi,
      total_projects: item.total_projects,
    };
  });

  res.json(Object.values(destinations));
});

// Route pour créer le covered index de synthesis-by-destination
router.route("/european-projects/erc/synthesis-by-destination_indexes").get(async (req, res) => {
  try {
    await recreateIndex(
      db.collection(collection_erc_projects_synthese),
      {
        framework: 1,
        stage: 1,
        country_code: 1,
        is_ejo: 1,
        destination_code: 1,
        panel_code: 1,
        panel_regroupement_code: 1,
        call_year: 1,
        destination_name_en: 1,
        project_id: 1,
        calculated_fund: 1,
        fund_ent_erc: 1,
        number_involved: 1,
        role: 1,
      },
      "idx_synthesis-by-destination_covered",
    );

    res.status(201).json({ message: "Index recréé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la recréation de l'index:", error);
    res.status(500).json({ error: "Erreur lors de la recréation de l'index" });
  }
});

export default router;
