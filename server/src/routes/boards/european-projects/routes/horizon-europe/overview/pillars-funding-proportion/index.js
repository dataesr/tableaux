import express from "express";
import { db } from "../../../../../../../services/mongo.js";
import { checkQuery, recreateIndex } from "../../../../../../utils.js";

const router = new express.Router();

const collection_projects_entities = "european-projects_projects-entities";

router.route("/european-projects/overview/pillars-funding-proportion").get(async (req, res) => {
  const filters = checkQuery(req.query, ["country_code"], res);

  if (req.query.pillars) {
    const pillars = req.query.pillars.split("|");
    filters.pilier_code = { $in: pillars };
  }
  delete filters.programs;
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
            pillar: "$pilier_code",
            stage: "$stage",
            pilier_name_fr: "$pilier_name_fr",
            pilier_name_en: "$pilier_name_en",
          },
          total_fund_eur: { $sum: "$calculated_fund" },
          total_coordination_number: { $sum: "$coordination_number" },
          total_number_involved: { $sum: "$number_involved" },
        },
      },
      {
        $project: {
          _id: 0,
          pillar: "$_id.pillar",
          stage: "$_id.stage",
          total_fund_eur: 1,
          total_coordination_number: 1,
          total_number_involved: 1,
          pilier_name_fr: "$_id.pilier_name_fr",
          pilier_name_en: "$_id.pilier_name_en",
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
            pillar: "$pilier_code",
            stage: "$stage",
            pilier_name_fr: "$pilier_name_fr",
            pilier_name_en: "$pilier_name_en",
          },
          total_fund_eur: { $sum: "$calculated_fund" },
          total_coordination_number: { $sum: "$coordination_number" },
          total_number_involved: { $sum: "$number_involved" },
        },
      },
      {
        $project: {
          _id: 0,
          pillar: "$_id.pillar",
          stage: "$_id.stage",
          total_fund_eur: 1,
          total_coordination_number: 1,
          total_number_involved: 1,
          pilier_name_fr: "$_id.pilier_name_fr",
          pilier_name_en: "$_id.pilier_name_en",
        },
      },
      { $sort: { total_fund_eur: -1 } },
    ])
    .toArray();

  // calculate the proportion of each destination in the country data compared to the all data
  const data = data_country.map((item) => {
    const all = data_all.find((el) => el.pillar === item.pillar && el.stage === item.stage);
    const ratio = (country, total) => (total ? (country / total) * 100 : 0);

    return {
      pillar: item.pillar,
      pilier_name_fr: item.pilier_name_fr,
      pilier_name_en: item.pilier_name_en,
      stage: item.stage,
      proportion: ratio(item.total_fund_eur, all?.total_fund_eur),
      proportion_coordination_number: ratio(item.total_coordination_number, all?.total_coordination_number),
      proportion_number_involved: ratio(item.total_number_involved, all?.total_number_involved),
    };
  });
  // sort by proportion
  data.sort((a, b) => b.proportion - a.proportion);

  res.json({ data });
});

// Route pour créer le covered index de pillars-funding-proportion
router.route("/european-projects/overview/pillars-funding-proportion_indexes").get(async (req, res) => {
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
        pilier_name_en: 1,
        pilier_name_fr: 1,
        calculated_fund: 1,
        coordination_number: 1,
        number_involved: 1,
      },
      "idx_pillars-funding-proportion_covered",
    );

    res.status(201).json({ message: "Index recréé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la recréation de l'index:", error);
    res.status(500).json({ error: "Erreur lors de la recréation de l'index" });
  }
});

export default router;
