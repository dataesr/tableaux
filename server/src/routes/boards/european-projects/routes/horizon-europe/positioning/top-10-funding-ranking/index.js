import express from "express";
import { db } from "../../../../../../../services/mongo.js";
import { recreateIndex } from "../../../../../../utils.js";

const router = new express.Router();

const collection_projects_entities = "european-projects_projects-entities";

router.route("/european-projects/positioning/top-10-funding-ranking").get(async (req, res) => {
  const filters = {};
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
    filters.thema_code = { $in: thematics };
  }
  if (req.query.destinations) {
    const destinations = req.query.destinations.split(",");
    filters.destination_code = { $in: destinations };
  }
  filters.country_code = { $nin: ["ZOE", "ZOI"] }; // TODO: A clarifier

  if (req.query.isEjo) {
    filters["is_ejo"] = { $eq: req.query.isEjo === "true" ? true : false };
  }
  const data = await db
    .collection(collection_projects_entities)
    .aggregate([
      { $match: filters },
      {
        $group: {
          _id: {
            id: "$country_code",
            name_fr: "$country_name_fr",
            name_en: "$country_name_en",
            stage: "$stage",
          },
          total_fund_eur: { $sum: "$calculated_fund" },
          total_coordination_number: { $sum: "$coordination_number" },
          total_number_involved: { $sum: "$number_involved" },
          projects: { $addToSet: "$project_id" },
        },
      },
      {
        $project: {
          _id: 0,
          id: "$_id.id",
          name_fr: "$_id.name_fr",
          name_en: "$_id.name_en",
          total_fund_eur: 1,
          stage: "$_id.stage",
          total_coordination_number: 1,
          total_number_involved: 1,
          total_projects: { $size: "$projects" },
        },
      },
      {
        $group: {
          _id: {
            id: "$id",
            name_fr: "$name_fr",
            name_en: "$name_en",
          },
          total_successful: {
            $sum: {
              $cond: [{ $eq: ["$stage", "successful"] }, "$total_fund_eur", 0],
            },
          },
          total_evaluated: {
            $sum: {
              $cond: [{ $eq: ["$stage", "evaluated"] }, "$total_fund_eur", 0],
            },
          },
          total_coordination_number_successful: {
            $sum: {
              $cond: [{ $eq: ["$stage", "successful"] }, "$total_coordination_number", 0],
            },
          },
          total_coordination_number_evaluated: {
            $sum: {
              $cond: [{ $eq: ["$stage", "evaluated"] }, "$total_coordination_number", 0],
            },
          },
          total_number_involved_successful: {
            $sum: {
              $cond: [{ $eq: ["$stage", "successful"] }, "$total_number_involved", 0],
            },
          },
          total_number_involved_evaluated: {
            $sum: {
              $cond: [{ $eq: ["$stage", "evaluated"] }, "$total_number_involved", 0],
            },
          },
          total_projects_successful: {
            $sum: {
              $cond: [{ $eq: ["$stage", "successful"] }, "$total_projects", 0],
            },
          },
          total_projects_evaluated: {
            $sum: {
              $cond: [{ $eq: ["$stage", "evaluated"] }, "$total_projects", 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          id: "$_id.id",
          name_fr: "$_id.name_fr",
          name_en: "$_id.name_en",
          total_successful: 1,
          total_evaluated: 1,
          total_coordination_number_successful: 1,
          total_coordination_number_evaluated: 1,
          total_number_involved_successful: 1,
          total_number_involved_evaluated: 1,
          total_projects_successful: 1,
          total_projects_evaluated: 1,
        },
      },
    ])
    .toArray();

  const total_evaluated_all_country = data.reduce((acc, el) => acc + el.total_evaluated, 0);
  const total_successful_all_country = data.reduce((acc, el) => acc + el.total_successful, 0);

  const dataWithRatio = data.map((el) => {
    if (el.total_evaluated === 0) {
      return { ...el, ratio: 0 };
    }
    return {
      ...el,
      total_evaluated_ratio: ((el.total_evaluated / total_evaluated_all_country) * 100).toFixed(2),
      total_successful_ratio: ((el.total_successful / total_successful_all_country) * 100).toFixed(2),
      ratio: (el.total_successful / el.total_evaluated) * 100,
      ratio_coordination_number: (el.total_coordination_number_successful / el.total_coordination_number_evaluated) * 100,
      ratio_involved: (el.total_number_involved_successful / el.total_number_involved_evaluated) * 100,
      ratio_projects: el.total_projects_evaluated ? (el.total_projects_successful / el.total_projects_evaluated) * 100 : 0,
    };
  });

  // add successful rank to returned data
  const dataSortedSuccessful = dataWithRatio.sort((a, b) => b.total_successful - a.total_successful); // sort by total_sccessful
  for (let i = 0; i < dataSortedSuccessful.length; i++) {
    dataWithRatio.find((el) => el.id === dataSortedSuccessful[i].id).rank_successful = i + 1;
  }

  // add evaluated rank to returned data
  const dataSortedEvaluated = dataWithRatio.sort((a, b) => b.total_evaluated - a.total_evaluated); // sort by total_evaluated
  for (let i = 0; i < dataSortedEvaluated.length; i++) {
    dataWithRatio.find((el) => el.id === dataSortedEvaluated[i].id).rank_evaluated = i + 1;
  }

  // add coordination_number_successful rank to returned data
  const dataSortedCoordinationNumberSuccessful = dataWithRatio.sort((a, b) => b.total_coordination_number_successful - a.total_coordination_number_successful); // sort by total_coordination_number_successful
  for (let i = 0; i < dataSortedCoordinationNumberSuccessful.length; i++) {
    dataWithRatio.find((el) => el.id === dataSortedCoordinationNumberSuccessful[i].id).rank_coordination_number_successful = i + 1;
  }

  // add coordination_number_evaluated rank to returned data
  const dataSortedCoordinationNumberEvaluated = dataWithRatio.sort((a, b) => b.total_coordination_number_evaluated - a.total_coordination_number_evaluated); // sort by total_coordination_number_evaluated
  for (let i = 0; i < dataSortedCoordinationNumberEvaluated.length; i++) {
    dataWithRatio.find((el) => el.id === dataSortedCoordinationNumberEvaluated[i].id).rank_coordination_number_evaluated = i + 1;
  }

  // add number_involved_successful rank to returned data
  const dataSortedInvolvedSuccessful = dataWithRatio.sort((a, b) => b.total_number_involved_successful - a.total_number_involved_successful); // sort by total_number_involved_successful
  for (let i = 0; i < dataSortedInvolvedSuccessful.length; i++) {
    dataWithRatio.find((el) => el.id === dataSortedInvolvedSuccessful[i].id).rank_involved_successful = i + 1;
  }

  // add number_involved_evaluated rank to returned data
  const dataSortedInvolvedEvaluated = dataWithRatio.sort((a, b) => b.total_number_involved_evaluated - a.total_number_involved_evaluated); // sort by total_number_involved_evaluated
  for (let i = 0; i < dataSortedInvolvedEvaluated.length; i++) {
    dataWithRatio.find((el) => el.id === dataSortedInvolvedEvaluated[i].id).rank_involved_evaluated = i + 1;
  }

  // add projects_successful rank to returned data
  const dataSortedProjectsSuccessful = dataWithRatio.sort((a, b) => b.total_projects_successful - a.total_projects_successful);
  for (let i = 0; i < dataSortedProjectsSuccessful.length; i++) {
    dataWithRatio.find((el) => el.id === dataSortedProjectsSuccessful[i].id).rank_projects_successful = i + 1;
  }

  // add projects_evaluated rank to returned data
  const dataSortedProjectsEvaluated = dataWithRatio.sort((a, b) => b.total_projects_evaluated - a.total_projects_evaluated);
  for (let i = 0; i < dataSortedProjectsEvaluated.length; i++) {
    dataWithRatio.find((el) => el.id === dataSortedProjectsEvaluated[i].id).rank_projects_evaluated = i + 1;
  }

  return res.json(dataWithRatio);
});

// Route pour créer le covered index de top-10-funding-ranking
router.route("/european-projects/positioning/top-10-funding-ranking_indexes").get(async (req, res) => {
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
        country_name_en: 1,
        country_name_fr: 1,
        calculated_fund: 1,
        coordination_number: 1,
        number_involved: 1,
        total_projects: 1,
      },
      "idx_top-10-funding-ranking_covered",
    );

    res.status(201).json({ message: "Index recréé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la recréation de l'index:", error);
    res.status(500).json({ error: "Erreur lors de la recréation de l'index" });
  }
});

export default router;
