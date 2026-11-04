import express from "express";
import { db } from "../../../../../../services/mongo.js";
import { recreateIndex } from "../../../../../utils.js";

const router = new express.Router();

const collection_erc_projects_synthese = "european-projects_erc-projects-synthese";

/**
 * Route d'évolution temporelle ERC par domaine scientifique (LS, PE, SH)
 * Retourne les données agrégées par année et domaine scientifique
 * Inclut les données du pays sélectionné ET les totaux globaux pour calculer les poids
 */
router.route("/european-projects/erc/evolution-by-domain").get(async (req, res) => {
  const baseFilters = {};
  const countryFilters = {};

  if (req.query.destination_code) {
    const destinations = req.query.destination_code.split(",");
    baseFilters.destination_code = { $in: destinations };
    countryFilters.destination_code = { $in: destinations };
  }
  if (req.query.panel_id) {
    const panels = req.query.panel_id.split(",");
    baseFilters.panel_id = { $in: panels };
    countryFilters.panel_id = { $in: panels };
  }
  if (req.query.framework) {
    baseFilters.framework = req.query.framework;
    countryFilters.framework = req.query.framework;
  }
  if (req.query.country_code) {
    countryFilters.country_code = req.query.country_code.toUpperCase();
  }
  if (req.query.isEjo) {
    filters["is_ejo"] = { $eq: req.query.isEjo === "true" ? true : false };
  }

  // Agrégation par domaine scientifique
  const aggregationPipeline = (filters, stage) => [
    { $match: { ...filters, stage } },
    {
      $group: {
        _id: {
          call_year: "$call_year",
          domaine_scientifique: "$panel_regroupement_code",
          domaine_name_scientifique: "$panel_regroupement_name",
        },
        total_funding_project: { $sum: "$calculated_fund" },
        total_involved: { $sum: "$number_involved" },
        projects: { $addToSet: "$project_id" },
        total_pi: { $sum: { $cond: [{ $eq: ["$role", "PI"] }, "$number_involved", 0] } },
      },
    },
    {
      $project: {
        _id: 0,
        call_year: "$_id.call_year",
        domaine_scientifique: "$_id.domaine_scientifique",
        domaine_name_scientifique: "$_id.domaine_name_scientifique",
        total_funding_project: 1,
        total_involved: 1,
        total_projects: { $size: "$projects" },
        total_pi: 1,
      },
    },
    { $sort: { call_year: 1, domaine_scientifique: 1 } },
  ];

  // Données pour le pays sélectionné
  const [countrySuccessful, countryEvaluated] = await Promise.all([
    db.collection(collection_erc_projects_synthese).aggregate(aggregationPipeline(countryFilters, "successful")).toArray(),
    db.collection(collection_erc_projects_synthese).aggregate(aggregationPipeline(countryFilters, "evaluated")).toArray(),
  ]);

  // Données globales (tous pays) pour calculer les poids
  const [totalSuccessful, totalEvaluated] = await Promise.all([
    db.collection(collection_erc_projects_synthese).aggregate(aggregationPipeline(baseFilters, "successful")).toArray(),
    db.collection(collection_erc_projects_synthese).aggregate(aggregationPipeline(baseFilters, "evaluated")).toArray(),
  ]);

  res.json({
    country: {
      successful: countrySuccessful,
      evaluated: countryEvaluated,
    },
    total: {
      successful: totalSuccessful,
      evaluated: totalEvaluated,
    },
  });
});

// Route pour créer le covered index de evolution-by-domain
router.route("/european-projects/erc/evolution-by-domain_indexes").get(async (req, res) => {
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
        panel_regroupement_name: 1,
        calculated_fund: 1,
        number_involved: 1,
        role: 1,
        project_id: 1,
      },
      "idx_evolution-by-domain_covered",
    );

    res.status(201).json({ message: "Index recréé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la recréation de l'index:", error);
    res.status(500).json({ error: "Erreur lors de la recréation de l'index" });
  }
});

export default router;
