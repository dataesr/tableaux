import express from "express";
import { db } from "../../../../../../services/mongo.js";
import { recreateIndex } from "../../../../../utils.js";

const router = new express.Router();

const collection_projects_entities = "european-projects_projects-entities";

/**
 * Route pour les principales entités ERC (top 10)
 * Retourne les 10 premières entités par financement ERC pour un pays donné
 * Paramètres : country_code (requis), destination_code (optionnel), call_year (optionnel)
 */
router.route("/european-projects/erc/main-entities").get(async (req, res) => {
  if (!req.query.country_code) {
    return res.status(400).json({ error: "Le code pays est requis" });
  }

  try {
    const filters = {
      country_code: req.query.country_code.toUpperCase(),
      thema_code: "ERC",
    };

    if (req.query.destination_code) {
      const destinations = req.query.destination_code.split(",");
      filters.destination_code = { $in: destinations };
    }
    if (req.query.call_year) {
      const years = req.query.call_year.split(",");
      filters.call_year = { $in: years };
    }
    if (req.query.isEjo) {
      filters["is_ejo"] = { $eq: req.query.isEjo === "true" ? true : false };
    }

    const data = await db
      .collection(collection_projects_entities)
      .aggregate([
        { $match: filters },
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
        { $sort: { total_fund_eur: -1 } },
        ...(req.query.limit !== "all" ? [{ $limit: 10 }] : []),
      ])
      .toArray();

    const total = data.reduce((acc, el) => acc + el.total_fund_eur, 0);

    res.status(200).json({ total_fund_eur: total, list: data });
  } catch (error) {
    console.error("Error fetching ERC main entities:", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
});

// Route pour créer le covered index de main-entities
router.route("/european-projects/erc/main-entities_indexes").get(async (req, res) => {
  try {
    await recreateIndex(
      db.collection(collection_projects_entities),
      {
        country_code: 1,
        thema_code: 1,
        is_ejo: 1,
        destination_code: 1,
        call_year: 1,
        entities_name: 1,
        entities_acronym: 1,
        calculated_fund: 1,
      },
      "idx_main-entities_covered",
    );

    res.status(201).json({ message: "Index recréé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la recréation de l'index:", error);
    res.status(500).json({ error: "Erreur lors de la recréation de l'index" });
  }
});

export default router;
