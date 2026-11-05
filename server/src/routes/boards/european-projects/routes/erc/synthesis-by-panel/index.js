import express from "express";
import { db } from "../../../../../../services/mongo.js";
import { recreateIndex } from "../../../../../utils.js";

const router = new express.Router();

const collection_erc_projects_synthese = "european-projects_erc-projects-synthese";

/**
 * Route de synthèse par panel ERC
 * Retourne les données agrégées par panel_id
 * Paramètres optionnels:
 * - stage: "successful" (défaut) ou "evaluated"
 */
/**
 * Route de synthèse par panel ERC
 * Retourne les données agrégées par panel_id avec evaluated et successful
 */
/**
 * Route de synthèse par panel ERC (pour les cards)
 * Retourne les données agrégées par panel avec structure imbriquée evaluated/successful
 */
router.route("/european-projects/erc/synthesis-by-panel").get(async (req, res) => {
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
            stage: "$stage",
          },
          total_funding_entity: { $sum: "$fund_ent_erc" },
          total_involved: { $sum: "$number_involved" },
          projects: { $addToSet: "$project_id" },
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
          stage: "$_id.stage",
          total_funding_entity: 1,
          total_involved: 1,
          total_projects: { $size: "$projects" },
          total_pi: 1,
        },
      },
      { $sort: { domaine_scientifique: 1, panel_id: 1, stage: 1 } },
    ])
    .toArray();

  // Restructurer les données par panel (pour les cards)
  const panels = {};
  data.forEach((item) => {
    if (!panels[item.panel_id]) {
      panels[item.panel_id] = {
        panel_id: item.panel_id,
        panel_name: item.panel_name,
        panel_lib: item.panel_lib,
        domaine_scientifique: item.domaine_scientifique,
        domaine_name_scientifique: item.domaine_name_scientifique,
        evaluated: null,
        successful: null,
      };
    }
    panels[item.panel_id][item.stage] = {
      total_funding_entity: item.total_funding_entity,
      total_involved: item.total_involved,
      total_pi: item.total_pi,
      total_projects: item.total_projects,
    };
  });

  res.json(Object.values(panels));
});

// Route pour créer le covered index de synthesis-by-panel
router.route("/european-projects/erc/synthesis-by-panel_indexes").get(async (req, res) => {
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
        panel_name: 1,
        panel_lib: 1,
        panel_regroupement_name: 1,
        fund_ent_erc: 1,
        number_involved: 1,
        role: 1,
        project_id: 1,
      },
      "idx_synthesis-by-panel_covered",
    );

    res.status(201).json({ message: "Index recréé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la recréation de l'index:", error);
    res.status(500).json({ error: "Erreur lors de la recréation de l'index" });
  }
});

export default router;
