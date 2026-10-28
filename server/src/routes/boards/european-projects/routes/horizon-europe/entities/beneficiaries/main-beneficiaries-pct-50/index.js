import express from "express";
import { db } from "../../../../../../../../services/mongo.js";
import { checkQuery, recreateIndex } from "../../../../../../../utils.js";

const router = new express.Router();

const collection_projects_entities = "european-projects_projects-entities";

router.route("/european-projects/beneficiaries/main-beneficiaries-pct-50").get(async (req, res) => {
  if (!req.query.country_code) {
    return res.status(400).json({ error: "Le code pays est requis" });
  }

  try {
    const filters = checkQuery(req.query, ["country_code"], res);

    // test filters (thematics, programs, thematics, destinations)
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
      const filteredThematics = thematics.filter((thematic) => !["ERC", "MSCA"].includes(thematic));
      filters.thema_code = { $in: filteredThematics };
    }
    if (req.query.destinations) {
      const destinations = req.query.destinations.split(",");
      filters.destination_code = { $in: destinations };
    }
    if (req.query.years) {
      const years = req.query.years.split("|");
      filters.call_year = { $in: years };
    }

    filters.framework = "Horizon Europe";

    const data = await db
      .collection(collection_projects_entities)
      .aggregate([
        {
          $match: filters,
        },
        {
          $group: {
            _id: {
              name: "$entities_name",
              acronym: "$entities_acronym",
            },
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
        {
          $sort: { total_fund_eur: -1 },
        },
      ])
      .toArray();

    const total = data.reduce((acc, el) => acc + el.total_fund_eur, 0);
    const half = total / 2;

    // get list who represent 50% of the total
    const list = [];
    let currentTotal = 0;
    for (let i = 0; i < data.length; i++) {
      if (currentTotal < half) {
        list.push(data[i]);
        currentTotal += data[i].total_fund_eur;
      }
    }

    res.status(200).json({ total_fund_eur: total, list });
  } catch (error) {
    console.error("Error fetching main beneficiaries:", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
});

// Route pour créer l'index pour main-beneficiaries-pct-50
router.route("/european-projects/beneficiaries/main-beneficiaries-pct-50_indexes").get(async (req, res) => {
  try {
    await recreateIndex(
      db.collection(collection_projects_entities),
      {
        // Champs de filtrage (ordre optimisé pour la sélectivité)
        country_code: 1,
        framework: 1,
        pilier_code: 1,
        programme_code: 1,
        thema_code: 1,
        destination_code: 1,
        // Champs utilisés dans le groupement et la projection
        entities_name: 1,
        entities_acronym: 1,
        fund_eur: 1,
      },
      "idx_main_beneficiaries_pct_50_covered",
    );

    res.status(201).json({
      message: "Index couvert pour main-beneficiaries-pct-50 créé avec succès",
      indexName: "idx_main_beneficiaries_pct_50_covered",
    });
  } catch (error) {
    console.error("Erreur lors de la création de l'index couvert:", error);
    res.status(500).json({ error: "Erreur lors de la création de l'index couvert" });
  }
});

export default router;
