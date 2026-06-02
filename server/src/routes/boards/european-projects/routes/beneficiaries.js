import express from "express";
import { checkQuery, recreateIndex } from "../../../utils.js";
import { db } from "../../../../services/mongo.js";

const router = new express.Router();

const routesPrefix = "/european-projects/beneficiaries";

const collection_projects_entities = "european-projects_projects-entities_staging";

router.route(routesPrefix + "/main-beneficiaries-pct-50").get(async (req, res) => {
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
            total_fund_eur: { $sum: "$fund_eur" },
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
router.route(routesPrefix + "/main-beneficiaries-pct-50_indexes").get(async (req, res) => {
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

router.route(routesPrefix + "/beneficiaries-by-role").get(async (req, res) => {
  try {
    const filters = { framework: "Horizon Europe" };

    // Ajouter les filtres optionnels (similaire à main-beneficiaries-pct-50)
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

    filters.country_code = req.query.country_code; // Filtre obligatoire TODO

    const data = await db
      .collection(collection_projects_entities)
      .aggregate([
        {
          $match: filters,
        },
        {
          $group: {
            _id: {
              entity_id: "$entities_id",
              entity_name: "$entities_name",
              acronym: "$entities_acronym",
              country_code: "$country_code",
              country_name_fr: "$country_name_fr",
              country_name_en: "$country_name_en",
              role: "$role",
            },
            total_fund_eur: { $sum: "$fund_eur" },
          },
        },
        {
          $group: {
            _id: {
              entity_id: "$_id.entity_id",
              entity_name: "$_id.entity_name",
              acronym: "$_id.acronym",
              country_code: "$_id.country_code",
              country_name_fr: "$_id.country_name_fr",
              country_name_en: "$_id.country_name_en",
            },
            roles: {
              $push: {
                role: "$_id.role",
                total_fund_eur: "$total_fund_eur",
              },
            },
            total_fund_eur: { $sum: "$total_fund_eur" },
          },
        },
        {
          $project: {
            _id: 0,
            entity_id: "$_id.entity_id",
            entity_name: "$_id.entity_name",
            acronym: "$_id.acronym",
            country_code: "$_id.country_code",
            country_name_fr: "$_id.country_name_fr",
            country_name_en: "$_id.country_name_en",
            total_fund_eur_coordination: {
              $ifNull: [
                {
                  $arrayElemAt: [
                    {
                      $map: {
                        input: {
                          $filter: {
                            input: "$roles",
                            cond: { $eq: [{ $toLower: "$$this.role" }, "coordinator"] },
                          },
                        },
                        as: "item",
                        in: "$$item.total_fund_eur",
                      },
                    },
                    0,
                  ],
                },
                0,
              ],
            },
            total_fund_eur_partner: {
              $ifNull: [
                {
                  $arrayElemAt: [
                    {
                      $map: {
                        input: {
                          $filter: {
                            input: "$roles",
                            cond: { $eq: [{ $toLower: "$$this.role" }, "partner"] },
                          },
                        },
                        as: "item",
                        in: "$$item.total_fund_eur",
                      },
                    },
                    0,
                  ],
                },
                0,
              ],
            },
            total_fund_eur: 1,
          },
        },
        {
          $sort: { total_fund_eur: -1 },
        },
        {
          $limit: 10,
        },
      ])
      .toArray();

    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching beneficiaries by role:", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
});

// Route pour créer l'index pour beneficiaries-by-role
router.route(routesPrefix + "/beneficiaries-by-role_indexes").get(async (req, res) => {
  try {
    await recreateIndex(
      db.collection(collection_projects_entities),
      {
        // Champs de filtrage
        framework: 1,
        role: 1,
        pilier_code: 1,
        programme_code: 1,
        thema_code: 1,
        destination_code: 1,
        // Champs de groupement et calculs
        entities_name: 1,
        entities_id: 1,
        entities_acronym: 1,
        country_code: 1,
        country_name_fr: 1,
        country_name_en: 1,
        fund_eur: 1,
      },
      "idx_beneficiaries_by_role_covered",
    );

    res.status(201).json({
      message: "Index pour beneficiaries-by-role créé avec succès",
      indexName: "idx_beneficiaries_by_role_covered",
    });
  } catch (error) {
    console.error("Erreur lors de la création de l'index beneficiaries-by-role:", error);
    res.status(500).json({ error: "Erreur lors de la création de l'index" });
  }
});

export default router;
