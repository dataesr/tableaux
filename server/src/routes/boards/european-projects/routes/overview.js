import express from "express";
import { db } from "../../../../services/mongo.js";

const router = new express.Router();

const collection_projects_synthese = "fr-esr-all-projects-synthese";
const collection_projects_entities = "fr-esr-all-projects-entities";

import { checkQuery } from "../../../utils.js";

const rangeOfYears = ["2021", "2022", "2023"];

router.route("/european-projects/overview/graph1").get(async (req, res) => {
  const filters = checkQuery(req.query, ["country_code", "extra_joint_organization", "stage"], res);

  const data = await db.collection(collection_projects_entities).aggregate([{ $match: filters }]);
});

router.route("/european-projects/synthesis-focus").get(async (req, res) => {
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
  if (req.query.range_of_years) {
    const rangeOfYears = req.query.range_of_years.split(",");
    filters.call_year = { $in: rangeOfYears };
  }

  const dataSuccessful = await db
    .collection(collection_projects_synthese)
    .aggregate([
      { $match: { ...filters, stage: "successful" } },
      {
        $group: {
          _id: "$country_code",
          total_fund_eur: { $sum: "$fund_eur" },
          total_involved: { $sum: "$number_involved" },
          total_coordination_number: { $sum: "$coordination_number" },
        },
      },
      {
        $project: {
          _id: 0,
          total_fund_eur: 1,
          total_involved: 1,
          total_coordination_number: 1,
          country_code: "$_id",
        },
      },
      {
        $group: {
          _id: null,
          total_fund_eur: { $sum: "$total_fund_eur" },
          total_involved: { $sum: "$total_involved" },
          total_coordination_number: { $sum: "$total_coordination_number" },
          countries: { $push: "$$ROOT" },
        },
      },
      {
        $project: {
          _id: 0,
          total_fund_eur: 1,
          total_involved: 1,
          total_coordination_number: 1,
          countries: 1,
        },
      },
    ])
    .toArray();

  const dataEvaluated = await db
    .collection(collection_projects_synthese)
    .aggregate([
      { $match: { ...filters, stage: "evaluated" } },
      {
        $group: {
          _id: "$country_code",
          total_fund_eur: { $sum: "$fund_eur" },
          total_involved: { $sum: "$number_involved" },
          total_coordination_number: { $sum: "$coordination_number" },
        },
      },
      {
        $project: {
          _id: 0,
          total_fund_eur: 1,
          total_involved: 1,
          total_coordination_number: 1,
          country_code: "$_id",
        },
      },
      {
        $group: {
          _id: null,
          total_fund_eur: { $sum: "$total_fund_eur" },
          total_involved: { $sum: "$total_involved" },
          total_coordination_number: { $sum: "$total_coordination_number" },
          countries: { $push: "$$ROOT" },
        },
      },
      {
        $project: {
          _id: 0,
          total_fund_eur: 1,
          total_involved: 1,
          total_coordination_number: 1,
          countries: 1,
        },
      },
    ])
    .toArray();

  if (req.query.country_code) {
    return res.json({
      successful: dataSuccessful[0]
        ? {
            total_fund_eur: dataSuccessful[0].total_fund_eur,
            total_involved: dataSuccessful[0].total_involved,
            total_coordination_number: dataSuccessful[0].total_coordination_number,
            countries: dataSuccessful[0].countries.filter((el) => el.country_code.toLowerCase() === req.query.country_code.toLowerCase()),
          }
        : null,
      evaluated: dataEvaluated[0]
        ? {
            total_fund_eur: dataEvaluated[0].total_fund_eur,
            total_involved: dataEvaluated[0].total_involved,
            total_coordination_number: dataEvaluated[0].total_coordination_number,
            countries: dataEvaluated[0].countries.filter((el) => el.country_code.toLowerCase() === req.query.country_code.toLowerCase()),
          }
        : null,
    });
  }
  res.json({
    successful: dataSuccessful[0] || null,
    evaluated: dataEvaluated[0] || null,
  });
});

router.route("/european-projects/funded-objectives").get(async (req, res) => {
  const filters = checkQuery(req.query, ["country_code", "extra_joint_organization", "stage"], res);
  const data = await db
    .collection(collection_projects_synthese)
    .aggregate([
      { $match: filters },
      {
        $group: {
          _id: {
            programme_name_en: "$programme_name_en",
            programme_name_fr: "$programme_name_fr",
            pilier_name_en: "$pilier_name_en",
            pilier_name_fr: "$pilier_name_fr",
          },
          total_funding: { $sum: "$fund_eur" },
        },
      },
      {
        $project: {
          _id: 0,
          programme_name_en: "$_id.programme_name_en",
          programme_name_fr: "$_id.programme_name_fr",
          pilier_name_en: "$_id.pilier_name_en",
          pilier_name_fr: "$_id.pilier_name_fr",
          total_funding: 1,
        },
      },
      { $sort: { total_funding: -1 } },
    ])
    .toArray();
  res.json(data);
});

router.route("/european-projects/overview/pillars-funding").get(async (req, res) => {
  const filters = checkQuery(req.query, ["country_code"], res);

  if (req.query.pillars) {
    const pillars = req.query.pillars.split("|");
    filters.pilier_code = { $in: pillars };
  }
  delete filters.programs;
  delete filters.thematics;
  delete filters.destinations;

  const data = await db
    .collection(collection_projects_synthese)
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
          total_fund_eur: { $sum: "$fund_eur" },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          pillar: "$_id.pillar",
          pilier_name_fr: "$_id.pilier_name_fr",
          pilier_name_en: "$_id.pilier_name_en",
          stage: "$_id.stage",
          total_fund_eur: 1,
          count: 1,
        },
      },
      { $sort: { total_fund_eur: -1 } },
    ])
    .toArray();

  const successRates = data.reduce((acc, item) => {
    const pillar = item.pillar;
    if (!acc[pillar]) {
      acc[pillar] = { successful: 0, evaluated: 0 };
    }
    if (item.stage === "successful") {
      acc[pillar].successful += item.total_fund_eur;
    } else if (item.stage === "evaluated") {
      acc[pillar].evaluated += item.total_fund_eur;
    }
    return acc;
  }, {});

  const successRateByPillar = Object.entries(successRates).map(([pillar, { successful, evaluated }]) => ({
    pillar,
    successRate: evaluated > 0 ? successful / evaluated : 0,
  }));

  res.json({ data, successRateByPillar });
});

router.route("/european-projects/overview/pillars-funding-proportion").get(async (req, res) => {
  const filters = checkQuery(req.query, ["country_code"], res);

  if (req.query.pillars) {
    const pillars = req.query.pillars.split("|");
    filters.pilier_code = { $in: pillars };
  }
  delete filters.programs;
  delete filters.thematics;
  delete filters.destinations;

  const data_country = await db
    .collection(collection_projects_synthese)
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
          total_fund_eur: { $sum: "$fund_eur" },
        },
      },
      {
        $project: {
          _id: 0,
          pillar: "$_id.pillar",
          stage: "$_id.stage",
          total_fund_eur: 1,
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
    .collection(collection_projects_synthese)
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
          total_fund_eur: { $sum: "$fund_eur" },
        },
      },
      {
        $project: {
          _id: 0,
          pillar: "$_id.pillar",
          stage: "$_id.stage",
          total_fund_eur: 1,
          pilier_name_fr: "$_id.pilier_name_fr",
          pilier_name_en: "$_id.pilier_name_en",
        },
      },
      { $sort: { total_fund_eur: -1 } },
    ])
    .toArray();

  // calculate the proportion of each destination in the country data compared to the all data
  const data = data_country.map((item) => {
    const total_fund_eur_country = item.total_fund_eur;
    const total_fund_eur_all = data_all.find((el) => el.pillar === item.pillar && el.stage === item.stage)?.total_fund_eur;

    return {
      pillar: item.pillar,
      pilier_name_fr: item.pilier_name_fr,
      pilier_name_en: item.pilier_name_en,
      stage: item.stage,
      proportion: total_fund_eur_all ? (total_fund_eur_country / total_fund_eur_all) * 100 : 0,
    };
  });
  // sort by proportion
  data.sort((a, b) => b.proportion - a.proportion);
  // remove duplicates
  // const uniquePillars = new Set();
  // const filteredData = data.filter((item) => {
  //   if (uniquePillars.has(item.pillar)) {
  //     return false;
  //   }
  //   uniquePillars.add(item.pillar);
  //   return true;
  // });

  res.json({ data });
});

router.route("/european-projects/overview/programs-funding").get(async (req, res) => {
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
  const data = await db
    .collection(collection_projects_synthese)
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
          total_fund_eur: { $sum: "$fund_eur" },
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

  const data_country = await db
    .collection(collection_projects_synthese)
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
          total_fund_eur: { $sum: "$fund_eur" },
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
    .collection(collection_projects_synthese)
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
          total_fund_eur: { $sum: "$fund_eur" },
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

router.route("/european-projects/overview/topics-funding").get(async (req, res) => {
  const filters = checkQuery(req.query, ["country_code"], res);

  if (req.query.thematics) {
    const thematics = req.query.thematics.split(",");
    filters.thema_code = { $in: thematics };
  }
  if (req.query.pillars) {
    filters.pilier_code = req.query.pillars;
  }
  if (req.query.programs) {
    filters.programme_code = req.query.programs;
  }

  delete filters.pillars;
  delete filters.programs;
  delete filters.destinations;

  const data = await db
    .collection(collection_projects_synthese)
    .aggregate([
      { $match: { $and: [filters] } },
      {
        $group: {
          _id: {
            topic: "$thema_code",
            stage: "$stage",
            thema_name_fr: "$thema_name_fr",
            thema_name_en: "$thema_name_en",
            pilier_code: "$pilier_code",
            programme_code: "$programme_code",
          },
          total_fund_eur: { $sum: "$fund_eur" },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          topic: "$_id.topic",
          thema_name_fr: "$_id.thema_name_fr",
          thema_name_en: "$_id.thema_name_en",
          stage: "$_id.stage",
          total_fund_eur: 1,
          pilier_code: "$_id.pilier_code",
          programme_code: "$_id.programme_code",
          count: 1,
        },
      },
      { $sort: { total_fund_eur: -1 } },
    ])
    .toArray();

  const successRates = data.reduce((acc, item) => {
    const topic = item.topic;
    if (!acc[topic]) {
      acc[topic] = { successful: 0, evaluated: 0 };
    }
    if (item.stage === "successful") {
      acc[topic].successful += item.total_fund_eur;
    } else if (item.stage === "evaluated") {
      acc[topic].evaluated += item.total_fund_eur;
    }
    return acc;
  }, {});

  const successRateByTopic = Object.entries(successRates).map(([topic, { successful, evaluated }]) => ({
    topic,
    successRate: evaluated > 0 ? successful / evaluated : 0,
  }));

  res.json({ data, successRateByTopic });
});

router.route("/european-projects/overview/topics-funding-proportion").get(async (req, res) => {
  const filters = checkQuery(req.query, ["country_code"], res);

  if (req.query.thematics) {
    const thematics = req.query.thematics.split(",");
    filters.thema_code = { $in: thematics };
  }
  if (req.query.pillars) {
    filters.pilier_code = req.query.pillars;
  }
  if (req.query.programs) {
    filters.programme_code = req.query.programs;
  }

  delete filters.pillars;
  delete filters.programs;
  delete filters.destinations;

  const data_country = await db
    .collection(collection_projects_synthese)
    .aggregate([
      { $match: { $and: [filters] } },
      {
        $group: {
          _id: {
            topic: "$thema_code",
            stage: "$stage",
            thema_name_fr: "$thema_name_fr",
            thema_name_en: "$thema_name_en",
          },
          total_fund_eur: { $sum: "$fund_eur" },
        },
      },
      {
        $project: {
          _id: 0,
          topic: "$_id.topic",
          stage: "$_id.stage",
          total_fund_eur: 1,
          thema_name_fr: "$_id.thema_name_fr",
          thema_name_en: "$_id.thema_name_en",
        },
      },
      { $sort: { total_fund_eur: -1 } },
    ])
    .toArray();

  // get all data without filter on country_code
  const filters_all = { ...filters };
  delete filters_all.country_code;

  const data_all = await db
    .collection(collection_projects_synthese)
    .aggregate([
      { $match: { $and: [filters_all] } },
      {
        $group: {
          _id: {
            topic: "$thema_code",
            stage: "$stage",
            thema_name_fr: "$thema_name_fr",
            thema_name_en: "$thema_name_en",
          },
          total_fund_eur: { $sum: "$fund_eur" },
        },
      },
      {
        $project: {
          _id: 0,
          topic: "$_id.topic",
          stage: "$_id.stage",
          total_fund_eur: 1,
          thema_name_fr: "$_id.thema_name_fr",
          thema_name_en: "$_id.thema_name_en",
        },
      },
      { $sort: { total_fund_eur: -1 } },
    ])
    .toArray();

  // calculate the proportion of each destination in the country data compared to the all data
  const data = data_country.map((item) => {
    const total_fund_eur_country = item.total_fund_eur;
    const total_fund_eur_all = data_all.find((el) => el.topic === item.topic && el.stage === item.stage)?.total_fund_eur;

    return {
      topic: item.topic,
      thema_name_fr: item.thema_name_fr,
      thema_name_en: item.thema_name_en,
      stage: item.stage,
      proportion: total_fund_eur_all ? (total_fund_eur_country / total_fund_eur_all) * 100 : 0,
    };
  });
  // sort by proportion
  data.sort((a, b) => b.proportion - a.proportion);

  res.json({ data });
});

router.route("/european-projects/overview/destination-funding").get(async (req, res) => {
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

  const data = await db
    .collection(collection_projects_synthese)
    .aggregate([
      { $match: { $and: [filters] } },
      {
        $group: {
          _id: {
            destination: "$destination_code",
            stage: "$stage",
          },
          total_fund_eur: { $sum: "$fund_eur" },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          destination: "$_id.destination",
          stage: "$_id.stage",
          total_fund_eur: 1,
          count: 1,
        },
      },
      { $sort: { total_fund_eur: -1 } },
    ])
    .toArray();

  const successRates = data.reduce((acc, item) => {
    const destination = item.destination;
    if (!acc[destination]) {
      acc[destination] = { successful: 0, evaluated: 0 };
    }
    if (item.stage === "successful") {
      acc[destination].successful += item.total_fund_eur;
    } else if (item.stage === "evaluated") {
      acc[destination].evaluated += item.total_fund_eur;
    }
    return acc;
  }, {});

  const successRateByDestination = Object.entries(successRates).map(([destination, { successful, evaluated }]) => ({
    destination,
    successRate: evaluated > 0 ? successful / evaluated : 0,
  }));

  res.json({ data, successRateByDestination });
});

router.route("/european-projects/overview/destination-funding-proportion").get(async (req, res) => {
  const filters = checkQuery(req.query, ["country_code"], res);

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

  const data_country = await db
    .collection(collection_projects_synthese)
    .aggregate([
      { $match: { $and: [filters] } },
      {
        $group: {
          _id: {
            destination: "$destination_code",
            stage: "$stage",
          },
          total_fund_eur: { $sum: "$fund_eur" },
        },
      },
      {
        $project: {
          _id: 0,
          destination: "$_id.destination",
          stage: "$_id.stage",
          total_fund_eur: 1,
        },
      },
      { $sort: { total_fund_eur: -1 } },
    ])
    .toArray();

  // get all data without filter on country_code
  const filters_all = { ...filters };
  delete filters_all.country_code;

  const data_all = await db
    .collection(collection_projects_synthese)
    .aggregate([
      { $match: { $and: [filters_all] } },
      {
        $group: {
          _id: {
            destination: "$destination_code",
            stage: "$stage",
          },
          total_fund_eur: { $sum: "$fund_eur" },
        },
      },
      {
        $project: {
          _id: 0,
          destination: "$_id.destination",
          stage: "$_id.stage",
          total_fund_eur: 1,
        },
      },
      { $sort: { total_fund_eur: -1 } },
    ])
    .toArray();

  // calculate the proportion of each destination in the country data compared to the all data
  const data = data_country.map((item) => {
    // const destination = item.destination;
    const total_fund_eur_country = item.total_fund_eur;
    const total_fund_eur_all = data_all.find((el) => el.destination === item.destination && el.stage === item.stage)?.total_fund_eur;

    return {
      destination: item.destination,
      stage: item.stage,
      proportion: total_fund_eur_all ? (total_fund_eur_country / total_fund_eur_all) * 100 : 0,
    };
  });
  // sort by proportion
  data.sort((a, b) => b.proportion - a.proportion);
  // remove duplicates
  // const uniqueDestinations = new Set();
  // const filteredData = data.filter((item) => {
  //   if (uniqueDestinations.has(item.destination)) {
  //     return false;
  //   }
  //   uniqueDestinations.add(item.destination);
  //   return true;
  // });

  res.json({ data });
});

router.route("/european-projects/overview/pillars-funding-evo-3-years").get(async (req, res) => {
  const filters = checkQuery(req.query, ["country_code"], res);

  // cas de plusieurs piliers passés en paramètre
  if (req.query.pilier_code?.split("|").length > 1) {
    filters.pilier_code = { $in: req.query.pilier_code.split("|") };
  } else if (req.query.pilier_code?.split("|").length === 1) {
    filters.pilier_code = req.query.pilier_code;
  } else {
    filters.pilier_code = { $in: ["p1", "p2", "p3", "p4"] };
  }

  filters.call_year = { $in: rangeOfYears };

  delete filters.thema_code;
  delete filters.programme_code;
  delete filters.destination_code;

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
              pilier_code: "$pilier_code",
              pilier_name_fr: "$pilier_name_fr",
              pilier_name_en: "$pilier_name_en",
              call_year: "$call_year",
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
              pilier_code: "$_id.pilier_code",
              pilier_name_fr: "$_id.pilier_name_fr",
              pilier_name_en: "$_id.pilier_name_en",
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
            pillars: {
              $push: {
                pilier_code: "$_id.pilier_code",
                pilier_name_fr: "$_id.pilier_name_fr",
                pilier_name_en: "$_id.pilier_name_en",
                years: "$years",
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            stage: "$_id",
            pillars: 1,
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

router.route("/european-projects/overview/programs-funding-evo-3-years").get(async (req, res) => {
  const filters = checkQuery(req.query, ["country_code"], res);

  // cas de plusieurs programmes passés en paramètre
  if (req.query.programme_code?.split("|").length > 1) {
    filters.programme_code = { $in: req.query.programme_code.split("|") };
  } else if (req.query.programme_code?.split("|").length === 1) {
    filters.programme_code = req.query.programme_code;
  }

  filters.call_year = { $in: rangeOfYears };

  delete filters.pilier_code;
  delete filters.thema_code;
  delete filters.destination_code;

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
              programme_code: "$programme_code",
              programme_name_fr: "$programme_name_fr",
              programme_name_en: "$programme_name_en",
              call_year: "$call_year",
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
              programme_code: "$_id.programme_code",
              programme_name_fr: "$_id.programme_name_fr",
              programme_name_en: "$_id.programme_name_en",
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
            programs: {
              $push: {
                programme_code: "$_id.programme_code",
                programme_name_fr: "$_id.programme_name_fr",
                programme_name_en: "$_id.programme_name_en",
                years: "$years",
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            stage: "$_id",
            programs: 1,
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

router.route("/european-projects/overview/topics-funding-evo-3-years").get(async (req, res) => {
  const filters = checkQuery(req.query, ["country_code"], res);

  // cas de plusieurs thématiques passées en paramètre
  if (req.query.thema_code?.split("|").length > 1) {
    filters.thema_code = { $in: req.query.thema_code.split("|") };
  } else if (req.query.thema_code?.split("|").length === 1) {
    filters.thema_code = req.query.thema_code;
  }

  // TODO: implémenter le filtre rangeOfYears côté client
  // filters.call_year = { $in: rangeOfYears };

  delete filters.pilier_code;
  delete filters.programme_code;
  delete filters.destination_code;

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
              thema_code: "$thema_code",
              thema_name_fr: "$thema_name_fr",
              thema_name_en: "$thema_name_en",
              call_year: "$call_year",
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
              thema_code: "$_id.thema_code",
              thema_name_fr: "$_id.thema_name_fr",
              thema_name_en: "$_id.thema_name_en",
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
            topics: {
              $push: {
                thema_code: "$_id.thema_code",
                thema_name_fr: "$_id.thema_name_fr",
                thema_name_en: "$_id.thema_name_en",
                years: "$years",
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            stage: "$_id",
            topics: 1,
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
              destination_code: "$destination_code",
              destination_name_fr: "$destination_name_en",
              destination_name_en: "$destination_name_en",
              call_year: "$call_year",
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

router.route("/european-projects/overview/projects-types-1").get(async (req, res) => {
  const filters = checkQuery(req.query, ["country_code"], res);
  // cas de plusieurs pilliers passés en paramètre
  if (req.query.pilier_code?.split("|").length > 1) {
    filters.pilier_code = { $in: req.query.pilier_code.split("|") };
  } else if (req.query.pilier_code?.split("|").length === 1) {
    filters.pilier_code = req.query.pilier_code;
  }
  // cas de plusieurs programmes passés en paramètre
  if (req.query.programme_code?.split("|").length > 1) {
    filters.programme_code = { $in: req.query.programme_code.split("|") };
  } else if (req.query.programme_code?.split("|").length === 1) {
    filters.programme_code = req.query.programme_code;
  }
  // cas de plusieurs thématiques passées en paramètre
  if (req.query.thema_code?.split("|").length > 1) {
    filters.thema_code = { $in: req.query.thema_code.split("|") };
  } else if (req.query.thema_code?.split("|").length === 1) {
    filters.thema_code = req.query.thema_code;
  }
  // cas de plusieurs destinations passées en paramètre
  if (req.query.destination_code?.split("|").length > 1) {
    filters.destination_code = { $in: req.query.destination_code.split("|") };
  } else if (req.query.destination_code?.split("|").length === 1) {
    filters.destination_code = req.query.destination_code;
  }

  const data_country = await db
    .collection(collection_projects_synthese)
    .aggregate([
      { $match: { $and: [filters] } },
      {
        $group: {
          _id: {
            stage: "$stage",
            action_id: "$action_group_code",
            action_name: "$action_group_name",
          },
          total_fund_eur: { $sum: "$fund_eur" },
        },
      },
      {
        $project: {
          _id: 0,
          stage: "$_id.stage",
          total_fund_eur: 1,
          action_id: "$_id.action_id",
          action_name: "$_id.action_name",
        },
      },
      {
        $group: {
          _id: {
            id: "$action_id",
            name: "$action_name",
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
        },
      },
      {
        $project: {
          _id: 0,
          id: "$_id.id",
          name: "$_id.name",
          total_successful: 1,
          total_evaluated: 1,
        },
      },
      { $sort: { id: 1 } },
    ])
    .toArray();

  delete filters.country_code;
  const data_all = await db
    .collection(collection_projects_synthese)
    .aggregate([
      { $match: { $and: [filters] } },
      {
        $group: {
          _id: {
            stage: "$stage",
            action_id: "$action_group_code",
            action_name: "$action_group_name",
          },
          total_fund_eur: { $sum: "$fund_eur" },
        },
      },
      {
        $project: {
          _id: 0,
          stage: "$_id.stage",
          total_fund_eur: 1,
          action_id: "$_id.action_id",
          action_name: "$_id.action_name",
        },
      },
      {
        $group: {
          _id: {
            id: "$action_id",
            name: "$action_name",
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
        },
      },
      {
        $project: {
          _id: 0,
          id: "$_id.id",
          name: "$_id.name",
          total_successful: 1,
          total_evaluated: 1,
        },
      },
      { $sort: { id: 1 } },
    ])
    .toArray();

  // remove empty data
  const country = [];
  data_country.forEach((el) => {
    if (el.total_successful > 0 || el.total_evaluated > 0) {
      country.push(el);
    }
  });

  const all = [];
  data_all.forEach((el) => {
    if (el.total_successful > 0 || el.total_evaluated > 0) {
      all.push(el);
    }
  });

  return res.json({ country, all });
});

router.route("/european-projects/overview/projects-types-2").get(async (req, res) => {
  const filters = checkQuery(req.query, ["country_code"], res);

  // cas de plusieurs pilliers passés en paramètre
  if (req.query.pilier_code?.split("|").length > 1) {
    filters.pilier_code = { $in: req.query.pilier_code.split("|") };
  } else if (req.query.pilier_code?.split("|").length === 1) {
    filters.pilier_code = req.query.pilier_code;
  }
  // cas de plusieurs programmes passés en paramètre
  if (req.query.programme_code?.split("|").length > 1) {
    filters.programme_code = { $in: req.query.programme_code.split("|") };
  } else if (req.query.programme_code?.split("|").length === 1) {
    filters.programme_code = req.query.programme_code;
  }
  // cas de plusieurs thématiques passées en paramètre
  if (req.query.thema_code?.split("|").length > 1) {
    filters.thema_code = { $in: req.query.thema_code.split("|") };
  } else if (req.query.thema_code?.split("|").length === 1) {
    filters.thema_code = req.query.thema_code;
  }
  // cas de plusieurs destinations passées en paramètre
  if (req.query.destination_code?.split("|").length > 1) {
    filters.destination_code = { $in: req.query.destination_code.split("|") };
  } else if (req.query.destination_code?.split("|").length === 1) {
    filters.destination_code = req.query.destination_code;
  }

  //TODO: get the range of years from the database
  filters.call_year = { $in: rangeOfYears };
  const data_country = await db
    .collection(collection_projects_synthese)
    .aggregate([
      { $match: { $and: [filters] } },
      {
        $group: {
          _id: {
            stage: "$stage",
            action_id: "$action_group_code",
            action_name: "$action_group_name",
            call_year: "$call_year",
          },
          total_fund_eur: { $sum: "$fund_eur" },
        },
      },
      {
        $project: {
          _id: 0,
          stage: "$_id.stage",
          total_fund_eur: 1,
          action_id: "$_id.action_id",
          action_name: "$_id.action_name",
          call_year: "$_id.call_year",
        },
      },
      {
        $group: {
          _id: {
            id: "$action_id",
            year: "$call_year",
            action_name: "$action_name",
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
        },
      },
      {
        $project: {
          _id: 0,
          action_id: "$_id.id",
          action_name: "$_id.action_name",
          year: "$_id.year",
          total_successful: 1,
          total_evaluated: 1,
        },
      },
      { $sort: { action_id: 1, year: 1 } },
    ])
    .toArray();

  const data_all = await db
    .collection(collection_projects_synthese)
    .aggregate([
      {
        $group: {
          _id: {
            stage: "$stage",
            action_id: "$action_group_code",
            action_name: "$action_group_name",
            call_year: "$call_year",
          },
          total_fund_eur: { $sum: "$fund_eur" },
        },
      },
      {
        $project: {
          _id: 0,
          stage: "$_id.stage",
          total_fund_eur: 1,
          action_id: "$_id.action_id",
          action_name: "$_id.action_name",
          call_year: "$_id.call_year",
        },
      },
      {
        $group: {
          _id: {
            id: "$action_id",
            year: "$call_year",
            action_name: "$action_name",
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
        },
      },
      {
        $project: {
          _id: 0,
          action_id: "$_id.id",
          action_name: "$_id.action_name",
          year: "$_id.year",
          total_successful: 1,
          total_evaluated: 1,
        },
      },
      { $sort: { action_id: 1 } },
    ])
    .toArray();

  return res.json([
    {
      country: req.query.country_code,
      data: data_country,
    },
    { country: "all", data: data_all },
  ]);
});

router.route("/european-projects/overview/projects-types-3").get(async (req, res) => {
  const filters = checkQuery(req.query, ["country_code"], res);

  // cas de plusieurs pilliers passés en paramètre
  if (req.query.pilier_code?.split("|").length > 1) {
    filters.pilier_code = { $in: req.query.pilier_code.split("|") };
  } else if (req.query.pilier_code?.split("|").length === 1) {
    filters.pilier_code = req.query.pilier_code;
  }
  // cas de plusieurs programmes passés en paramètre
  if (req.query.programme_code?.split("|").length > 1) {
    filters.programme_code = { $in: req.query.programme_code.split("|") };
  } else if (req.query.programme_code?.split("|").length === 1) {
    filters.programme_code = req.query.programme_code;
  }
  // cas de plusieurs thématiques passées en paramètre
  if (req.query.thema_code?.split("|").length > 1) {
    filters.thema_code = { $in: req.query.thema_code.split("|") };
  } else if (req.query.thema_code?.split("|").length === 1) {
    filters.thema_code = req.query.thema_code;
  }
  // cas de plusieurs destinations passées en paramètre
  if (req.query.destination_code?.split("|").length > 1) {
    filters.destination_code = { $in: req.query.destination_code.split("|") };
  } else if (req.query.destination_code?.split("|").length === 1) {
    filters.destination_code = req.query.destination_code;
  }

  const dataSelectedCountry = await db
    .collection(collection_projects_synthese)
    .aggregate([
      { $match: { $and: [filters] } },
      {
        $group: {
          _id: {
            stage: "$stage",
            action_id: "$action_group_code",
            action_name: "$action_group_name",
          },
          total_fund_eur: { $sum: "$fund_eur" },
        },
      },
      {
        $project: {
          _id: 0,
          stage: "$_id.stage",
          total_fund_eur: 1,
          action_id: "$_id.action_id",
          action_name: "$_id.action_name",
        },
      },
      {
        $group: {
          _id: {
            id: "$action_id",
            name: "$action_name",
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
        },
      },
      {
        $project: {
          _id: 0,
          id: "$_id.id",
          name: "$_id.name",
          total_successful: 1,
          total_evaluated: 1,
        },
      },
      { $sort: { id: 1 } },
    ])
    .toArray();

  delete filters.country_code;
  filters.country_association_code = "MEMBER-ASSOCIATED";

  const otherCountries = await db
    .collection(collection_projects_synthese)
    .aggregate([
      { $match: { $and: [filters] } },
      {
        $group: {
          _id: {
            stage: "$stage",
            action_id: "$action_group_code",
            action_name: "$action_group_name",
          },
          total_fund_eur: { $sum: "$fund_eur" },
        },
      },
      {
        $project: {
          _id: 0,
          stage: "$_id.stage",
          total_fund_eur: 1,
          action_id: "$_id.action_id",
          action_name: "$_id.action_name",
        },
      },
      {
        $group: {
          _id: {
            id: "$action_id",
            name: "$action_name",
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
        },
      },
      {
        $project: {
          _id: 0,
          id: "$_id.id",
          name: "$_id.name",
          total_successful: 1,
          total_evaluated: 1,
        },
      },
      { $sort: { id: 1 } },
    ])
    .toArray();

  const data = {
    selectedCountry: dataSelectedCountry.map((el) => {
      if (el.total_evaluated === 0) {
        return { ...el, ratio: 0 };
      }
      return {
        ...el,
        ratio: (el.total_successful / el.total_evaluated) * 100,
      };
    }),
    otherCountries: otherCountries.map((el) => {
      if (el.total_evaluated === 0) {
        return { ...el, ratio: 0 };
      }
      return {
        ...el,
        ratio: (el.total_successful / el.total_evaluated) * 100,
      };
    }),
  };

  return res.json(data);
});

export default router;
