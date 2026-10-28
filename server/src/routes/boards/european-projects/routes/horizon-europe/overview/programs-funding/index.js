import express from "express";
import { db } from "../../../../../../../services/mongo.js";
import { checkQuery, recreateIndex } from "../../../../../../utils.js";

const router = new express.Router();

const collection_projects_entities = "european-projects_projects-entities";

router.route("/european-projects/overview/programs-funding").get(async (req, res) => {
  const filters = checkQuery(req.query, ["country_code"], res);

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

  const data = await db
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
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          program: "$_id.program",
          programme_name_fr: "$_id.programme_name_fr",
          programme_name_en: "$_id.programme_name_en",
          stage: "$_id.stage",
          total_fund_eur: 1,
          count: 1,
        },
      },
      { $sort: { total_fund_eur: -1 } },
    ])
    .toArray();

  const successRates = data.reduce((acc, item) => {
    const program = item.program;
    if (!acc[program]) {
      acc[program] = { successful: 0, evaluated: 0 };
    }
    if (item.stage === "successful") {
      acc[program].successful += item.total_fund_eur;
    } else if (item.stage === "evaluated") {
      acc[program].evaluated += item.total_fund_eur;
    }
    return acc;
  }, {});

  const successRateByProgram = Object.entries(successRates).map(([program, { successful, evaluated }]) => ({
    program,
    successRate: evaluated > 0 ? successful / evaluated : 0,
  }));

  res.json({ data, successRateByProgram });
});

// Route pour créer le covered index de programs-funding
router.route("/european-projects/overview/programs-funding_indexes").get(async (req, res) => {
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
      "idx_programs-funding_covered",
    );

    res.status(201).json({ message: "Index recréé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la recréation de l'index:", error);
    res.status(500).json({ error: "Erreur lors de la recréation de l'index" });
  }
});

export default router;
