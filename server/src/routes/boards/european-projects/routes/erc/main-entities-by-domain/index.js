import express from "express";
import { db } from "../../../../../../services/mongo.js";
import { recreateIndex } from "../../../../../utils.js";

const router = new express.Router();

const collection_erc_projects_synthese = "european-projects_erc-projects-synthese";
const collection_projects_entities = "european-projects_projects-entities";

/**
 * Route pour les principales entités ERC filtrées par domaine scientifique ou panel
 * Interroge la collection synthèse qui contient panel_id et domaine_scientifique
 */
router.route("/european-projects/erc/main-entities-by-domain").get(async (req, res) => {
  if (!req.query.country_code) {
    return res.status(400).json({ error: "Le code pays est requis" });
  }

  try {
    const filters = {
      country_code: req.query.country_code.toUpperCase(),
      stage: "successful",
    };

    if (req.query.call_year) {
      const years = req.query.call_year.split(",");
      filters.call_year = { $in: years };
    }
    if (req.query.panel_id) {
      const panels = req.query.panel_id.split(",");
      filters.panel_code = { $in: panels };
    } else if (req.query.domaine_scientifique) {
      filters.panel_regroupement_code = req.query.domaine_scientifique.toUpperCase();
    }
    if (req.query.isEjo) {
      filters["is_ejo"] = { $eq: req.query.isEjo === "true" ? true : false };
    }

    // Récup des project_id correspondants aux filtres
    const matchingProjectIds = await db.collection(collection_erc_projects_synthese).distinct("project_id", filters);

    if (!matchingProjectIds.length) {
      return res.status(200).json({ total_fund_eur: 0, list: [] });
    }

    // Agrégation des entités à partir de la collection des entités, filtrée par les project_id
    const data = await db
      .collection(collection_projects_entities)
      .aggregate([
        { $match: { project_id: { $in: matchingProjectIds }, country_code: filters.country_code, thema_code: "ERC" } },
        {
          $group: {
            _id: { name: "$entities_name", acronym: "$entities_acronym" },
            total_fund_eur: { $sum: "$calculated_fund" },
          },
        },
        {
          $project: {
            _id: 0,
            name: "$_id.name",
            acronym: "$_id.acronym",
            total_fund_eur: 1,
          },
        },
        { $match: { name: { $ne: null } } },
        { $sort: { total_fund_eur: -1 } },
        ...(req.query.limit !== "all" ? [{ $limit: 10 }] : []),
      ])
      .toArray();

    const total = data.reduce((acc, el) => acc + el.total_fund_eur, 0);

    res.status(200).json({ total_fund_eur: total, list: data });
  } catch (error) {
    console.error("Error fetching ERC main entities by domain:", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
});

// Route pour créer le covered index de main-entities-by-domain
router.route("/european-projects/erc/main-entities-by-domain_indexes").get(async (req, res) => {
  try {
    await recreateIndex(
      db.collection(collection_erc_projects_synthese),
      {
        country_code: 1,
        stage: 1,
        is_ejo: 1,
        panel_code: 1,
        panel_regroupement_code: 1,
        call_year: 1,
        project_id: 1,
      },
      "idx_main-entities-by-domain_synthese_covered",
    );
    await recreateIndex(
      db.collection(collection_projects_entities),
      {
        country_code: 1,
        thema_code: 1,
        project_id: 1,
        entities_name: 1,
        entities_acronym: 1,
        calculated_fund: 1,
      },
      "idx_main-entities-by-domain_entities_covered",
    );

    res.status(201).json({ message: "Index recréé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la recréation de l'index:", error);
    res.status(500).json({ error: "Erreur lors de la recréation de l'index" });
  }
});

export default router;
