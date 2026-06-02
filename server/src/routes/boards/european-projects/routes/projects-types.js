import express from "express";
import { db } from "../../../../services/mongo.js";

const router = new express.Router();

const collection_projects_synthese = "fr-esr-all-projects-synthese";

router.route("/european-projects/general-projectsTypes-successRateForAmountsByPillar").get(async (req, res) => {
  if (!req.query.country_code) {
    res.status(400).send("country_code is required");
    return;
  }
  if (req.query.country_code) {
    req.query.country_code = req.query.country_code.toUpperCase();
  }
  const dataSelectedCountry = await db
    .collection(collection_projects_synthese)
    .aggregate([
      { $match: { country_code: req.query.country_code } },
      {
        $group: {
          _id: {
            stage: "$stage",
            pilier_name_fr: "$pilier_name_fr",
            pilier_name_en: "$pilier_name_en",
          },
          total_fund_eur: { $sum: "$fund_eur" },
          total_coordination_number: { $sum: "$coordination_number" },
          total_number_involved: { $sum: "$number_involved" },
        },
      },
      {
        $project: {
          _id: 0,
          stage: "$_id.stage",
          total_fund_eur: 1,
          pilier_name_fr: "$_id.pilier_name_fr",
          pilier_name_en: "$_id.pilier_name_en",
          total_coordination_number: 1,
          total_number_involved: 1,
        },
      },
      {
        $group: {
          _id: {
            id: "$pilier_name_fr",
            name: "$pilier_name_en",
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
          name: "$_id.name",
          total_successful: 1,
          total_evaluated: 1,
          total_coordination_number_successful: 1,
          total_coordination_number_evaluated: 1,
          total_number_involved_successful: 1,
          total_number_involved_evaluated: 1,
        },
      },
      { $sort: { id: 1 } },
    ])
    .toArray();

  const otherCountries = await db
    .collection(collection_projects_synthese)
    .aggregate([
      { $match: { country_association_code: "MEMBER-ASSOCIATED" } },
      {
        $group: {
          _id: {
            stage: "$stage",
            pilier_name_fr: "$pilier_name_fr",
            pilier_name_en: "$pilier_name_en",
          },
          total_fund_eur: { $sum: "$fund_eur" },
          total_coordination_number: { $sum: "$coordination_number" },
          total_number_involved: { $sum: "$number_involved" },
        },
      },
      {
        $project: {
          _id: 0,
          stage: "$_id.stage",
          total_fund_eur: 1,
          pilier_name_fr: "$_id.pilier_name_fr",
          pilier_name_en: "$_id.pilier_name_en",
          total_coordination_number: 1,
          total_number_involved: 1,
        },
      },
      {
        $group: {
          _id: {
            id: "$pilier_name_fr",
            name: "$pilier_name_en",
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
          name: "$_id.name",
          total_successful: 1,
          total_evaluated: 1,
          total_coordination_number_successful: 1,
          total_coordination_number_evaluated: 1,
          total_number_involved_successful: 1,
          total_number_involved_evaluated: 1,
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

router.route("/european-projects/general-projectsTypes-pillarsRequestedByProjects").get(async (req, res) => {
  if (!req.query.country_code) {
    res.status(400).send("country_code is required");
    return;
  }
  if (req.query.country_code) {
    req.query.country_code = req.query.country_code.toUpperCase();
  }

  const data_country = await db
    .collection(collection_projects_synthese)
    .aggregate([
      { $match: { country_code: req.query.country_code } },
      {
        $group: {
          _id: {
            stage: "$stage",
            pilier_name_fr: "$pilier_name_fr",
            pilier_name_en: "$pilier_name_en",
          },
          total_fund_eur: { $sum: "$fund_eur" },
          total_coordination_number: { $sum: "$coordination_number" },
          total_number_involved: { $sum: "$number_involved" },
        },
      },
      {
        $project: {
          _id: 0,
          stage: "$_id.stage",
          total_fund_eur: 1,
          pilier_name_fr: "$_id.pilier_name_fr",
          pilier_name_en: "$_id.pilier_name_en",
          total_coordination_number: 1,
          total_number_involved: 1,
        },
      },
      {
        $group: {
          _id: {
            id: "$pilier_name_fr",
            name: "$pilier_name_en",
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
          name: "$_id.name",
          total_successful: 1,
          total_evaluated: 1,
          total_coordination_number_successful: 1,
          total_coordination_number_evaluated: 1,
          total_number_involved_successful: 1,
          total_number_involved_evaluated: 1,
        },
      },
      { $sort: { id: 1 } },
    ])
    .toArray();

  const data_all = await db
    .collection(collection_projects_synthese)
    .aggregate([
      {
        $group: {
          _id: {
            stage: "$stage",
            pilier_name_fr: "$pilier_name_fr",
            pilier_name_en: "$pilier_name_en",
          },
          total_fund_eur: { $sum: "$fund_eur" },
          total_coordination_number: { $sum: "$coordination_number" },
          total_number_involved: { $sum: "$number_involved" },
        },
      },
      {
        $project: {
          _id: 0,
          stage: "$_id.stage",
          total_fund_eur: 1,
          pilier_name_fr: "$_id.pilier_name_fr",
          pilier_name_en: "$_id.pilier_name_en",
          total_coordination_number: 1,
          total_number_involved: 1,
        },
      },
      {
        $group: {
          _id: {
            id: "$pilier_name_fr",
            name: "$pilier_name_en",
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
          name: "$_id.name",
          total_successful: 1,
          total_evaluated: 1,
          total_coordination_number_successful: 1,
          total_coordination_number_evaluated: 1,
          total_number_involved_successful: 1,
          total_number_involved_evaluated: 1,
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

router.route("/european-projects/general-projectsTypes-pillarsSubsidiesRequestedLines").get(async (req, res) => {
  if (!req.query.country_code) {
    res.status(400).send("country_code is required");
    return;
  }
  if (req.query.country_code) {
    req.query.country_code = req.query.country_code.toUpperCase();
  }
  const rangeOfYears = ["2021", "2022", "2023"];
  const data_country = await db
    .collection(collection_projects_synthese)
    .aggregate([
      {
        $match: {
          country_code: req.query.country_code,
          call_year: { $in: rangeOfYears },
        },
      },
      {
        $group: {
          _id: {
            stage: "$stage",
            pilier_name_fr: "$pilier_name_fr",
            call_year: "$call_year",
          },
          total_fund_eur: { $sum: "$fund_eur" },
          total_coordination_number: { $sum: "$coordination_number" },
          total_number_involved: { $sum: "$number_involved" },
        },
      },
      {
        $project: {
          _id: 0,
          stage: "$_id.stage",
          total_fund_eur: 1,
          pilier_name_fr: "$_id.pilier_name_fr",
          call_year: "$_id.call_year",
          total_coordination_number: 1,
          total_number_involved: 1,
        },
      },
      {
        $group: {
          _id: {
            name: "$pilier_name_fr",
            year: "$call_year",
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
          pilier_name_fr: "$_id.name",
          year: "$_id.year",
          total_successful: 1,
          total_evaluated: 1,
          total_coordination_number_successful: 1,
          total_coordination_number_evaluated: 1,
          total_number_involved_successful: 1,
          total_number_involved_evaluated: 1,
        },
      },
      { $sort: { pilier_name_fr: 1, year: 1 } },
    ])
    .toArray();

  const data_all = await db
    .collection(collection_projects_synthese)
    .aggregate([
      {
        $group: {
          _id: {
            stage: "$stage",
            pilier_name_fr: "$pilier_name_fr",
            call_year: "$call_year",
          },
          total_fund_eur: { $sum: "$fund_eur" },
          total_coordination_number: { $sum: "$coordination_number" },
          total_number_involved: { $sum: "$number_involved" },
        },
      },
      {
        $project: {
          _id: 0,
          stage: "$_id.stage",
          total_fund_eur: 1,
          pilier_name_fr: "$_id.pilier_name_fr",
          call_year: "$_id.call_year",
          total_coordination_number: 1,
          total_number_involved: 1,
        },
      },
      {
        $group: {
          _id: {
            name: "$pilier_name_fr",
            year: "$call_year",
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
          pilier_name_fr: "$_id.name",
          year: "$_id.year",
          total_successful: 1,
          total_evaluated: 1,
          total_coordination_number_successful: 1,
          total_coordination_number_evaluated: 1,
          total_number_involved_successful: 1,
          total_number_involved_evaluated: 1,
        },
      },
      { $sort: { pilier_name_fr: 1 } },
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

export default router;
