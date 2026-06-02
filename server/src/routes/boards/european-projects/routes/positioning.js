import express from "express";
import { db } from "../../../../services/mongo.js";
// import { checkQuery } from "../../../utils.js";

const router = new express.Router();

const collection_projects_entities = "european-projects_projects-entities_staging";
const collection_projects_synthese = "fr-esr-all-projects-synthese";

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
  filters.country_code = { $nin: ["ZOE", "ZOI"] };

  const data = await db
    .collection(collection_projects_synthese)
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
          total_fund_eur: { $sum: "$fund_eur" },
          total_coordination_number: { $sum: "$coordination_number" },
          total_number_involved: { $sum: "$number_involved" },
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
  const dataSortedCoordinationNumberSuccessful = dataWithRatio.sort(
    (a, b) => b.total_coordination_number_successful - a.total_coordination_number_successful
  ); // sort by total_coordination_number_successful
  for (let i = 0; i < dataSortedCoordinationNumberSuccessful.length; i++) {
    dataWithRatio.find((el) => el.id === dataSortedCoordinationNumberSuccessful[i].id).rank_coordination_number_successful = i + 1;
  }

  // add coordination_number_evaluated rank to returned data
  const dataSortedCoordinationNumberEvaluated = dataWithRatio.sort(
    (a, b) => b.total_coordination_number_evaluated - a.total_coordination_number_evaluated
  ); // sort by total_coordination_number_evaluated
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

  return res.json(dataWithRatio);
});

router.route("/european-projects/positioning/top-10-beneficiaries").get(async (req, res) => {
  const filters = { framework: "Horizon Europe" };

  // test filters (pillars, programs, thematics, destinations)
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

  const data = await db
    .collection(collection_projects_entities)
    .aggregate([
      { $match: filters },
      {
        $group: {
          _id: {
            name_fr: "$country_name_fr",
            name_en: "$country_name_en",
            id: "$country_code",
          },
          total_fund_eur: { $sum: "$fund_eur" },
        },
      },
      {
        $project: {
          _id: 0,
          name_fr: "$_id.name_fr",
          name_en: "$_id.name_en",
          id: "$_id.id",
          total_fund_eur: 1,
        },
      },
      {
        $sort: { total_fund_eur: -1 },
      },
    ])
    .toArray();

  let acc = 0;
  const total_fund_eur = data.reduce((acc, el) => acc + el.total_fund_eur, 0);
  const dataReturn = {
    total_fund_eur,
    top10: data
      .map((el) => {
        if (el.id !== "ZOE" && el.id !== "ZOI") {
          acc += el.total_fund_eur;
          return {
            ...el,
            influence: (acc / total_fund_eur) * 100,
          };
        }
      })
      .filter((el) => el),
  };

  return res.json(dataReturn);
});

router.route("/european-projects/positionning/funding-evo-3-years").get(async (req, res) => {
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
  filters.country_code = { $nin: ["ZOE", "ZOI"] };
  filters.call_year = { $in: ["2021", "2022", "2023"] };

  const query = () => {
    return db
      .collection(collection_projects_synthese)
      .aggregate([
        {
          $match: { $and: [filters] },
        },
        {
          $group: {
            _id: {
              stage: "$stage",
              call_year: "$call_year",
              id: "$country_code",
              name_fr: "$country_name_fr",
              name_en: "$country_name_en",
            },
            total_fund_eur: { $sum: "$fund_eur" },
            total_coordination_number: { $sum: "$coordination_number" },
            total_number_involved: { $sum: "$number_involved" },
          },
        },
        {
          $group: {
            _id: {
              stage: "$_id.stage",
              id: "$_id.id",
              name_fr: "$_id.name_fr",
              name_en: "$_id.name_en",
            },
            data: {
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
          $project: {
            _id: 0,
            id: "$_id.id",
            name_fr: "$_id.name_fr",
            name_en: "$_id.name_en",
            stage: "$_id.stage",
            data: 1,
          },
        },
        {
          $sort: { "data.year": 1 },
        },
      ])
      .toArray();
  };

  const data = await query();
  return res.json(data);
});

export default router;
