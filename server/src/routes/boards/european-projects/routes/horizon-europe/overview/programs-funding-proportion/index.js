import express from "express";
import { db } from "../../../../../../../services/mongo.js";
import { checkQuery, recreateIndex } from "../../../../../../utils.js";

const router = new express.Router();

const collection_projects_entities = "european-projects_projects-entities";

router.route("/european-projects/overview/programs-funding-proportion").get(async (req, res) => {
  const filters = checkQuery(req.query, ["country_code", "pillars"], res);

  if (req.query.pillars) {
    const pillars = req.query.pillars.split("|");
    filters.pilier_code = { $in: pillars };
  }

  if (req.query.programs) {
    const programs = req.query.programs.split("|");
    filters.programme_code = { $in: programs };
  }
  delete filters.pillars;
  delete filters.thematics;
  delete filters.destinations;

  if (req.query.isEjo) {
    filters["is_ejo"] = { $eq: req.query.isEjo === "true" ? true : false };
  }

  const data_country = await db
    .collection(collection_projects_entities)
    .aggregate([
      { $match: { $and: [filters] } },
      {
        $group: {
          _id: {
            program: "$programme_code",
            stage: "$stage",
            programme_name_fr: "$programme_name_fr",
            programme_name_en: "$programme_name_en",
          },
          total_fund_eur: { $sum: "$calculated_fund" },
        },
      },
      {
        $project: {
          _id: 0,
          program: "$_id.program",
          stage: "$_id.stage",
          total_fund_eur: 1,
          programme_name_fr: "$_id.programme_name_fr",
          programme_name_en: "$_id.programme_name_en",
        },
      },
      { $sort: { total_fund_eur: -1 } },
    ])
    .toArray();

  // get all data without filter on country_code
  const filters_all = { ...filters };
  delete filters_all.country_code;

  const data_all = await db
    .collection(collection_projects_entities)
    .aggregate([
      { $match: { $and: [filters_all] } },
      {
        $group: {
          _id: {
            program: "$programme_code",
            stage: "$stage",
            programme_name_fr: "$programme_name_fr",
            programme_name_en: "$programme_name_en",
          },
          total_fund_eur: { $sum: "$calculated_fund" },
        },
      },
      {
        $project: {
          _id: 0,
          program: "$_id.program",
          stage: "$_id.stage",
          total_fund_eur: 1,
          programme_name_fr: "$_id.programme_name_fr",
          programme_name_en: "$_id.programme_name_en",
        },
      },
      { $sort: { total_fund_eur: -1 } },
    ])
    .toArray();

  // calculate the proportion of each destination in the country data compared to the all data
  const data = data_country.map((item) => {
    const total_fund_eur_country = item.total_fund_eur;
    const total_fund_eur_all = data_all.find((el) => el.program === item.program && el.stage === item.stage)?.total_fund_eur;

    return {
      program: item.program,
      programme_name_fr: item.programme_name_fr,
      programme_name_en: item.programme_name_en,
      stage: item.stage,
      proportion: total_fund_eur_all ? (total_fund_eur_country / total_fund_eur_all) * 100 : 0,
    };
  });
  // sort by proportion
  data.sort((a, b) => b.proportion - a.proportion);

  res.json({ data });
});

// Route pour créer le covered index de programs-funding-proportion
router.route("/european-projects/overview/programs-funding-proportion_indexes").get(async (req, res) => {
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
        programme_name_en: 1,
        programme_name_fr: 1,
        calculated_fund: 1,
      },
      "idx_programs-funding-proportion_covered",
    );

    res.status(201).json({ message: "Index recréé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la recréation de l'index:", error);
    res.status(500).json({ error: "Erreur lors de la recréation de l'index" });
  }
});

export default router;
