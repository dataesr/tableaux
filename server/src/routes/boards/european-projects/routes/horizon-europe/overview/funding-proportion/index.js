import express from "express";
import { db } from "../../../../../../../services/mongo.js";
import { checkQuery, recreateIndex } from "../../../../../../utils.js";

const router = new express.Router();

const collection_projects_entities = "european-projects_projects-entities";

router.route("/european-projects/overview/funding-proportion").get(async (req, res) => {
  const groupBy = req.query.groupBy || "pillar";
  const groupings = {
    pillar: {
      code: "pilier_code",
      nameFr: "pilier_name_fr",
      nameEn: "pilier_name_en",
      outputCode: "pillar",
    },
    program: {
      code: "programme_code",
      nameFr: "programme_name_fr",
      nameEn: "programme_name_en",
      outputCode: "program",
    },
    topic: {
      code: "thema_code",
      nameFr: "thema_name_fr",
      nameEn: "thema_name_en",
      outputCode: "topic",
    },
    destination: {
      code: "destination_code",
      outputCode: "destination",
    },
  };
  if (typeof groupBy !== "string" || !Object.hasOwn(groupings, groupBy)) {
    return res.status(400).send("groupBy must be one of: pillar, program, topic, destination");
  }
  const grouping = groupings[groupBy];

  const filters = checkQuery(req.query, ["country_code"], res);

  if (req.query.pillars) {
    filters.pilier_code = { $in: req.query.pillars.split("|") };
  }
  if (req.query.programs) {
    filters.programme_code = { $in: req.query.programs.split("|") };
  }
  if (req.query.thematics) {
    const thematics = req.query.thematics.split(",");
    filters.thema_code = { $in: thematics };
  }
  if (req.query.destinations) {
    filters.destination_code = { $in: req.query.destinations.split(",") };
  }
  if (req.query.isEjo) {
    filters.is_ejo = { $eq: req.query.isEjo === "true" };
  }

  const group = {
    code: `$${grouping.code}`,
    stage: "$stage",
  };
  if (grouping.nameFr) group.name_fr = `$${grouping.nameFr}`;
  if (grouping.nameEn) group.name_en = `$${grouping.nameEn}`;

  const project = {
    _id: 0,
    code: "$_id.code",
    stage: "$_id.stage",
    total_fund_eur: 1,
    total_coordination_number: 1,
    total_number_involved: 1,
    count: 1,
  };
  if (grouping.nameFr) project.name_fr = "$_id.name_fr";
  if (grouping.nameEn) project.name_en = "$_id.name_en";

  const aggregation = [
    { $match: { $and: [filters] } },
    {
      $group: {
        _id: group,
        total_fund_eur: { $sum: "$calculated_fund" },
        total_coordination_number: { $sum: "$coordination_number" },
        total_number_involved: { $sum: "$number_involved" },
        count: { $sum: 1 },
      },
    },
    { $project: project },
    { $sort: { total_fund_eur: -1 } },
  ];

  const collection = db.collection(collection_projects_entities);
  const data_country = await collection.aggregate(aggregation).toArray();

  const filters_all = { ...filters };
  delete filters_all.country_code;
  const data_all = await collection.aggregate([{ $match: { $and: [filters_all] } }, ...aggregation.slice(1)]).toArray();
  const dataAllByCodeAndStage = new Map(data_all.map((item) => [JSON.stringify([item.code, item.stage]), item]));
  const ratio = (country, total) => (total ? (country / total) * 100 : 0);

  const data = data_country.map((item) => {
    const all = dataAllByCodeAndStage.get(JSON.stringify([item.code, item.stage]));
    const result = {
      [grouping.outputCode]: item.code,
      stage: item.stage,
      proportion: ratio(item.total_fund_eur, all?.total_fund_eur),
    };

    if (grouping.nameFr) result[grouping.nameFr] = item.name_fr;
    if (grouping.nameEn) result[grouping.nameEn] = item.name_en;
    result.proportion_coordination_number = ratio(item.total_coordination_number, all?.total_coordination_number);
    result.proportion_number_involved = ratio(item.total_number_involved, all?.total_number_involved);
    result.proportion_count = ratio(item.count, all?.count);

    return result;
  });
  data.sort((a, b) => b.proportion - a.proportion);

  return res.json({ data });
});

// Route pour créer le covered index de funding-proportion
router.route("/european-projects/overview/funding-proportion_indexes").get(async (req, res) => {
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
        calculated_fund: 1,
        coordination_number: 1,
        number_involved: 1,
      },
      "idx_funding-proportion_covered",
    );

    res.status(201).json({ message: "Index recréé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la recréation de l'index:", error);
    res.status(500).json({ error: "Erreur lors de la recréation de l'index" });
  }
});

export default router;
