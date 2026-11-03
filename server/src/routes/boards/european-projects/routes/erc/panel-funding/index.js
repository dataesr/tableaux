import express from "express";
import { db } from "../../../../../../services/mongo.js";
import { recreateIndex } from "../../../../../utils.js";

const router = new express.Router();

const collection_erc_projects_synthese = "european-projects_erc-projects-synthese";

/**
 * Route de financement par panel ERC (pour le graphique)
 * Retourne les données avec destination_code pour le scatter plot
 */
router.route("/european-projects/erc/panel-funding").get(async (req, res) => {
  const filters = {};

  if (req.query.call_year) {
    const years = req.query.call_year.split(",");
    filters.call_year = { $in: years };
  }
  if (req.query.destination_code) {
    const destinations = req.query.destination_code.split(",");
    filters.destination_code = { $in: destinations };
  }
  if (req.query.framework) {
    filters.framework = req.query.framework;
  }
  if (req.query.country_code) {
    filters.country_code = req.query.country_code.toUpperCase();
  }
  if (req.query.stage) {
    filters.stage = req.query.stage;
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
            panel_id: "$panel_code",
            panel_name: "$panel_name",
            panel_lib: "$panel_lib",
            domaine_scientifique: "$panel_regroupement_code",
            domaine_name_scientifique: "$panel_regroupement_name",
            destination_code: "$destination_code",
            destination_name_en: "$destination_name_en",
          },
          total_funding_entity: { $sum: "$fund_ent_erc" },
          total_involved: { $sum: "$number_involved" },
          total_pi: { $sum: { $cond: [{ $eq: ["$role", "PI"] }, "$number_involved", 0] } },
        },
      },
      {
        $project: {
          _id: 0,
          panel_id: "$_id.panel_id",
          panel_name: "$_id.panel_name",
          panel_lib: "$_id.panel_lib",
          domaine_scientifique: "$_id.domaine_scientifique",
          domaine_name_scientifique: "$_id.domaine_name_scientifique",
          destination_code: "$_id.destination_code",
          destination_name_en: "$_id.destination_name_en",
          total_funding_entity: 1,
          total_involved: 1,
          total_pi: 1,
        },
      },
      { $sort: { domaine_scientifique: 1, panel_id: 1, destination_code: 1 } },
    ])
    .toArray();

  res.json(data);
});

// Route pour créer le covered index de panel-funding
router.route("/european-projects/erc/panel-funding_indexes").get(async (req, res) => {
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
        panel_name: 1,
        panel_lib: 1,
        panel_regroupement_name: 1,
        fund_ent_erc: 1,
        number_involved: 1,
        role: 1,
      },
      "idx_panel-funding_covered",
    );

    res.status(201).json({ message: "Index recréé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la recréation de l'index:", error);
    res.status(500).json({ error: "Erreur lors de la recréation de l'index" });
  }
});

export default router;
