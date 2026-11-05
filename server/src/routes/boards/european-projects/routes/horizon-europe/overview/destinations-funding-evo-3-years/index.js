import express from "express";
import { db } from "../../../../../../../services/mongo.js";
import { checkQuery, recreateIndex } from "../../../../../../utils.js";

const router = new express.Router();

const collection_projects_entities = "european-projects_projects-entities";
const rangeOfYears = ["2021", "2022", "2023"];

router.route("/european-projects/overview/destinations-funding-evo-3-years").get(async (req, res) => {
  const filters = checkQuery(req.query, ["country_code"], res);

  // cas de plusieurs thématiques passées en paramètre
  if (req.query.destination_code?.split("|").length > 1) {
    filters.destination_code = { $in: req.query.destination_code.split("|") };
  } else if (req.query.destination_code?.split("|").length === 1) {
    filters.destination_code = req.query.destination_code;
  }

  filters.call_year = { $in: rangeOfYears };

  delete filters.pilier_code;
  delete filters.programme_code;
  delete filters.thema_code;
  //TODO: ! destination_name_fr n'existe pas en base
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
              destination_code: "$destination_code",
              destination_name_fr: "$destination_name_en",
              destination_name_en: "$destination_name_en",
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
              destination_code: "$_id.destination_code",
              destination_name_fr: "$_id.destination_name_fr",
              destination_name_en: "$_id.destination_name_en",
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
            destinations: {
              $push: {
                destination_code: "$_id.destination_code",
                destination_name_fr: "$_id.destination_name_fr",
                destination_name_en: "$_id.destination_name_en",
                years: "$years",
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            stage: "$_id",
            destinations: 1,
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

// Route pour créer le covered index de destinations-funding-evo-3-years
router.route("/european-projects/overview/destinations-funding-evo-3-years_indexes").get(async (req, res) => {
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
        calculated_fund: 1,
        coordination_number: 1,
        number_involved: 1,
      },
      "idx_destinations-funding-evo-3-years_covered",
    );

    res.status(201).json({ message: "Index recréé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la recréation de l'index:", error);
    res.status(500).json({ error: "Erreur lors de la recréation de l'index" });
  }
});

export default router;
