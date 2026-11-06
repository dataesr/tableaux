import express from "express";
import { db } from "../../../../../../services/mongo.js";
import { recreateIndex } from "../../../../../utils.js";

const router = new express.Router();

const collection_erc_projects_synthese = "european-projects_erc-projects-synthese";

/**
 * Route de synthèse ERC - récupère les données agrégées pour les cartes de synthèse
 * Paramètres optionnels:
 * - country_code: code du pays (ex: FRA, CHE)
 * - call_year: années d'appel (ex: 2018,2019,2020)
 * - destination_code: codes de destination/type de financement (ex: COG,STG,ADG)
 * - panel_id: identifiants des panels (ex: SH4,LS9)
 */
router.route("/european-projects/erc/synthesis").get(async (req, res) => {
  const filters = {};

  if (req.query.call_year) {
    const years = req.query.call_year.split(",");
    filters.call_year = { $in: years };
  }
  if (req.query.destination_code) {
    const destinations = req.query.destination_code.split(",");
    filters.destination_code = { $in: destinations };
  }
  if (req.query.panel_id) {
    const panels = req.query.panel_id.split(",");
    filters.panel_code = { $in: panels };
  }
  if (req.query.domaine_scientifique) {
    filters.panel_regroupement_code = req.query.domaine_scientifique.toUpperCase();
  }
  if (req.query.framework) {
    filters.framework = req.query.framework;
  }
  if (req.query.isEjo) {
    filters["is_ejo"] = { $eq: req.query.isEjo === "true" ? true : false };
  }

  // Données pour les projets lauréats (successful)
  const dataSuccessful = await db
    .collection(collection_erc_projects_synthese)
    .aggregate([
      { $match: { ...filters, stage: "successful" } },
      {
        $group: {
          _id: "$country_code",
          total_funding_project: { $sum: "$calculated_fund" },
          total_funding_entity: { $sum: "$fund_ent_erc" },
          total_involved: { $sum: "$number_involved" },
          total_pi: { $sum: { $cond: [{ $eq: ["$role", "PI"] }, "$number_involved", 0] } },
          country_name_fr: { $first: "$country_name_fr" },
          country_name_en: { $first: "$country_name_en" },
          projects: { $addToSet: "$project_id" },
        },
      },
      {
        $project: {
          _id: 0,
          country_code: "$_id",
          country_name_fr: 1,
          country_name_en: 1,
          total_funding_project: 1,
          total_funding_entity: 1,
          total_involved: 1,
          total_pi: 1,
          projects: 1,
          total_projects: { $size: "$projects" },
        },
      },
      {
        $group: {
          _id: null,
          total_funding_project: { $sum: "$total_funding_project" },
          total_funding_entity: { $sum: "$total_funding_entity" },
          total_involved: { $sum: "$total_involved" },
          total_pi: { $sum: "$total_pi" },
          projects: { $push: "$projects" },
          countries: {
            $push: {
              country_code: "$country_code",
              country_name_fr: "$country_name_fr",
              country_name_en: "$country_name_en",
              total_funding_project: "$total_funding_project",
              total_funding_entity: "$total_funding_entity",
              total_involved: "$total_involved",
              total_pi: "$total_pi",
              total_projects: "$total_projects",
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          total_funding_project: 1,
          total_funding_entity: 1,
          total_involved: 1,
          total_projects: {
            $size: {
              $reduce: {
                input: "$projects",
                initialValue: [],
                in: { $setUnion: ["$$value", "$$this"] },
              },
            },
          },
          total_pi: 1,
          countries: 1,
        },
      },
    ])
    .toArray();

  // Données pour les projets évalués (evaluated)
  const dataEvaluated = await db
    .collection(collection_erc_projects_synthese)
    .aggregate([
      { $match: { ...filters, stage: "evaluated" } },
      {
        $group: {
          _id: "$country_code",
          total_funding_project: { $sum: "$calculated_fund" },
          total_funding_entity: { $sum: "$fund_ent_erc" },
          total_involved: { $sum: "$number_involved" },
          total_pi: { $sum: { $cond: [{ $eq: ["$role", "PI"] }, "$number_involved", 0] } },
          country_name_fr: { $first: "$country_name_fr" },
          country_name_en: { $first: "$country_name_en" },
          projects: { $addToSet: "$project_id" },
        },
      },
      {
        $project: {
          _id: 0,
          country_code: "$_id",
          country_name_fr: 1,
          country_name_en: 1,
          total_funding_project: 1,
          total_funding_entity: 1,
          total_involved: 1,
          total_pi: 1,
          projects: 1,
          total_projects: { $size: "$projects" },
        },
      },
      {
        $group: {
          _id: null,
          total_funding_project: { $sum: "$total_funding_project" },
          total_funding_entity: { $sum: "$total_funding_entity" },
          total_involved: { $sum: "$total_involved" },
          total_pi: { $sum: "$total_pi" },
          projects: { $push: "$projects" },
          countries: {
            $push: {
              country_code: "$country_code",
              country_name_fr: "$country_name_fr",
              country_name_en: "$country_name_en",
              total_funding_project: "$total_funding_project",
              total_funding_entity: "$total_funding_entity",
              total_involved: "$total_involved",
              total_pi: "$total_pi",
              total_projects: "$total_projects",
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          total_funding_project: 1,
          total_funding_entity: 1,
          total_involved: 1,
          total_pi: 1,
          total_projects: {
            $size: {
              $reduce: {
                input: "$projects",
                initialValue: [],
                in: { $setUnion: ["$$value", "$$this"] },
              },
            },
          },
          countries: 1,
        },
      },
    ])
    .toArray();

  // Filtrer par pays si demandé
  if (req.query.country_code) {
    const countryCode = req.query.country_code.toUpperCase();
    return res.json({
      successful: dataSuccessful[0]
        ? {
            total_funding_project: dataSuccessful[0].total_funding_project,
            total_funding_entity: dataSuccessful[0].total_funding_entity,
            total_involved: dataSuccessful[0].total_involved,
            total_pi: dataSuccessful[0].total_pi,
            countries: dataSuccessful[0].countries.filter((el) => el.country_code.toUpperCase() === countryCode),
            total_projects: dataSuccessful[0].total_projects,
          }
        : null,
      evaluated: dataEvaluated[0]
        ? {
            total_funding_project: dataEvaluated[0].total_funding_project,
            total_funding_entity: dataEvaluated[0].total_funding_entity,
            total_involved: dataEvaluated[0].total_involved,
            total_pi: dataEvaluated[0].total_pi,
            countries: dataEvaluated[0].countries.filter((el) => el.country_code.toUpperCase() === countryCode),
            total_projects: dataEvaluated[0].total_projects,
          }
        : null,
    });
  }

  res.json({
    successful: dataSuccessful[0] || null,
    evaluated: dataEvaluated[0] || null,
  });
});

// Route pour créer le covered index de synthesis
router.route("/european-projects/erc/synthesis_indexes").get(async (req, res) => {
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
        calculated_fund: 1,
        country_name_en: 1,
        country_name_fr: 1,
        fund_ent_erc: 1,
        number_involved: 1,
        role: 1,
      },
      "idx_synthesis_covered",
    );

    res.status(201).json({ message: "Index recréé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la recréation de l'index:", error);
    res.status(500).json({ error: "Erreur lors de la recréation de l'index" });
  }
});

export default router;
