import express from "express";
import { db } from "../../../../../../../services/mongo.js";
import { checkQuery, recreateIndex } from "../../../../../../utils.js";

const router = new express.Router();

const collection_projects_entities = "european-projects_projects-entities";

router.route("/european-projects/overview/funding-evo").get(async (req, res) => {
  // route utilisée pour les thématiques ET les destinations
  const filters = checkQuery(req.query, ["country_code"], res);

  let field_code = "$thema_code";
  let field_name_fr = "$thema_name_fr";
  let field_name_en = "$thema_name_en";

  if (req.query.thematicIds) {
    filters.thema_code = { $in: req.query.thematicIds.split(/[|,]/) };
  }

  if (req.query.destinationIds) {
    filters.destination_code = { $in: req.query.destinationIds.split(/[|,]/) };
    field_code = "$destination_code";
    field_name_fr = "$destination_name_fr";
    field_name_en = "$destination_name_en";
    delete filters.thema_code;
  }

  if (req.query.range_of_years) {
    filters.call_year = { $in: req.query.range_of_years.split(/[|,]/) };
  }

  delete filters.pilier_code;
  delete filters.programme_code;

  if (req.query.isEjo) {
    filters["is_ejo"] = { $eq: req.query.isEjo === "true" ? true : false };
  }

  const query = () => {
    return db
      .collection(collection_projects_entities)
      .aggregate([
        {
          $match: { $and: [filters] },
        },
        {
          $group: {
            _id: {
              stage: "$stage",
              code: field_code,
              name_fr: field_name_fr,
              name_en: field_name_en,
              call_year: "$call_year",
            },
            total_fund_eur: { $sum: "$calculated_fund" },
            total_coordination_number: { $sum: "$coordination_number" },
            total_number_involved: { $sum: "$number_involved" },
          },
        },
        {
          $group: {
            _id: {
              stage: "$_id.stage",
              code: "$_id.code",
              name_fr: "$_id.name_fr",
              name_en: "$_id.name_en",
            },
            years: {
              $push: {
                year: "$_id.call_year",
                total_fund_eur: "$total_fund_eur",
                total_coordination_number: "$total_coordination_number",
                total_number_involved: "$total_number_involved",
              },
            },
          },
        },
        {
          $addFields: {
            years: {
              $sortArray: {
                input: "$years",
                sortBy: { year: 1 },
              },
            },
          },
        },
        {
          $group: {
            _id: "$_id.stage",
            items: {
              $push: {
                code: "$_id.code",
                name_fr: "$_id.name_fr",
                name_en: "$_id.name_en",
                years: "$years",
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            stage: "$_id",
            items: 1,
          },
        },
      ])
      .toArray();
  };

  const data_country = await query();
  delete filters.country_code;
  const data_all = await query();

  return res.json([
    {
      country: req.query.country_code,
      data: data_country,
    },
    { country: "all", data: data_all },
  ]);
});

// Route pour créer le covered index de funding-evo
router.route("/european-projects/overview/funding-evo_indexes").get(async (req, res) => {
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
        call_year: 1,
        destination_name_en: 1,
        destination_name_fr: 1,
        thema_name_en: 1,
        thema_name_fr: 1,
        calculated_fund: 1,
        coordination_number: 1,
        number_involved: 1,
      },
      "idx_funding-evo_covered",
    );

    res.status(201).json({ message: "Index recréé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la recréation de l'index:", error);
    res.status(500).json({ error: "Erreur lors de la recréation de l'index" });
  }
});

export default router;
