import express from "express";

import { db } from "../../../../../../../services/mongo.js";
import { checkQuery, recreateIndex } from "../../../../../../utils.js";

const router = new express.Router();

const collection_projects_entities = "european-projects_projects-entities";

router.route("/european-projects/overview/funding-proportion").get(async (req, res) => {
  try {
    const groupBy = req.query.groupBy || "pillar";
    // `sort` = champ de tri du niveau (null → tri par code)
    const groupings = {
      pillar: {
        code: "pilier_code",
        nameFr: "pilier_name_fr",
        nameEn: "pilier_name_en",
        sort: null,
        outputCode: "pillar",
      },
      program: {
        code: "programme_code",
        nameFr: "programme_name_fr",
        nameEn: "programme_name_en",
        sort: null,
        outputCode: "program",
      },
      topic: {
        code: "thema_code",
        nameFr: "thema_name_fr",
        nameEn: "thema_name_en",
        sort: "thema_sort",
        outputCode: "topic",
      },
      destination: {
        code: "destination_code",
        nameFr: "destination_name_fr",
        nameEn: "destination_name_en",
        sort: "destination_sort",
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
      filters.thema_code = { $in: req.query.thematics.split(",") };
    }
    if (req.query.destinations) {
      filters.destination_code = { $in: req.query.destinations.split(",") };
    }
    if (req.query.isEjo) {
      filters.is_ejo = { $eq: req.query.isEjo === "true" };
    }
    if (req.query.range_of_years) {
      filters.call_year = { $in: req.query.range_of_years.split(/[|,]/) };
    }

    const sortField = grouping.sort ? `$${grouping.sort}` : null;

    const aggregation = [
      { $match: { $and: [filters] } },
      {
        $group: {
          _id: {
            code: `$${grouping.code}`,
            stage: "$stage",
            name_fr: `$${grouping.nameFr}`,
            name_en: `$${grouping.nameEn}`,
          },
          // "" traité comme absent ($min ignore null/absent)
          sort: { $min: { $cond: [{ $eq: [sortField, ""] }, null, sortField] } },
          total_fund_eur: { $sum: "$calculated_fund" },
          total_coordination_number: { $sum: "$coordination_number" },
          total_number_involved: { $sum: "$number_involved" },
          count: { $sum: 1 },
          projects: { $addToSet: "$project_id" },
        },
      },
      {
        $project: {
          _id: 0,
          code: "$_id.code",
          name_fr: "$_id.name_fr",
          name_en: "$_id.name_en",
          stage: "$_id.stage",
          sort: 1,
          total_fund_eur: 1,
          total_coordination_number: 1,
          total_number_involved: 1,
          count: 1,
          total_projects: { $size: "$projects" },
          // 1 = pas de valeur de tri → à la fin
          _noSort: { $cond: [{ $eq: [{ $ifNull: ["$sort", null] }, null] }, 1, 0] },
        },
      },
      { $sort: { _noSort: 1, sort: 1, code: 1, stage: 1 } },
      { $project: { _noSort: 0 } },
    ];

    const collection = db.collection(collection_projects_entities);
    const data_country = await collection.aggregate(aggregation).toArray();

    const filters_all = { ...filters };
    delete filters_all.country_code;
    const data_all = await collection.aggregate([{ $match: { $and: [filters_all] } }, ...aggregation.slice(1)]).toArray();
    const dataAllByCodeAndStage = new Map(data_all.map((item) => [JSON.stringify([item.code, item.stage]), item]));
    const ratio = (country, total) => (total ? (country / total) * 100 : 0);

    // L'ordre de data_country (tri par sort / code) est conservé
    const data = data_country.map((item) => {
      const all = dataAllByCodeAndStage.get(JSON.stringify([item.code, item.stage]));
      return {
        // champs génériques (quel que soit le niveau)
        code: item.code,
        name_fr: item.name_fr,
        name_en: item.name_en,
        sort: item.sort,
        // champs historiques par niveau (ex : program, programme_name_fr) conservés pour les graphs existants
        [grouping.outputCode]: item.code,
        [grouping.nameFr]: item.name_fr,
        [grouping.nameEn]: item.name_en,
        stage: item.stage,
        proportion: ratio(item.total_fund_eur, all?.total_fund_eur),
        proportion_coordination_number: ratio(item.total_coordination_number, all?.total_coordination_number),
        proportion_number_involved: ratio(item.total_number_involved, all?.total_number_involved),
        proportion_count: ratio(item.count, all?.count),
        proportion_projects: ratio(item.total_projects, all?.total_projects),
      };
    });

    return res.json({ data });
  } catch (error) {
    console.error("[funding-proportion] ERREUR", error);
    return res.status(500).json({ error: error.message });
  }
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
        call_year: 1,
        pilier_name_fr: 1,
        pilier_name_en: 1,
        programme_name_fr: 1,
        programme_name_en: 1,
        thema_name_fr: 1,
        thema_name_en: 1,
        destination_name_fr: 1,
        destination_name_en: 1,
        thema_sort: 1,
        destination_sort: 1,
        calculated_fund: 1,
        coordination_number: 1,
        number_involved: 1,
        project_id: 1,
      },
      "idx_funding-proportion_covered",
    );

      res.status(201).json({ message: "Index recréé avec succès" });
    } catch (error) {
      console.error("Erreur lors de la recréation de l'index:", error);
      res
        .status(500)
        .json({ error: "Erreur lors de la recréation de l'index" });
    }
  });

export default router;
