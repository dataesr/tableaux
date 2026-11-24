import express from "express";

import { db } from "../../../../../../../services/mongo.js";
import { checkQuery, recreateIndex } from "../../../../../../utils.js";

const router = new express.Router();

const collection_projects_entities = "european-projects_projects-entities";

router.route("/european-projects/overview/funding").get(async (req, res) => {
  const filters = checkQuery(req.query, ["country_code"], res);
  // destination_sort n'est unique qu'à l'intérieur d'un cluster : on le préfixe par thema_sort (ex. "C4-A-F")
  const destinationSort = {
    $concat: [
      { $ifNull: ["$thema_sort", ""] },
      "-",
      { $ifNull: ["$destination_sort", ""] },
    ],
  };
  const groupings = {
    pillar: {
      code: "$pilier_code",
      name_fr: "$pilier_name_fr",
      name_en: "$pilier_name_en",
      sort: "$pilier_code",
    },
    program: {
      code: "$programme_code",
      name_fr: "$programme_name_fr",
      name_en: "$programme_name_en",
      sort: "$programme_code",
    },
    topic: {
      code: "$thema_code",
      name_fr: "$thema_name_fr",
      name_en: "$thema_name_en",
      sort: "$thema_sort",
    },
    destination: {
      code: "$destination_code",
      name_fr: "$destination_name_en",
      name_en: "$destination_name_en",
      sort: destinationSort,
    },
  };
  const requestedGrouping = req.query.groupBy;
  if (
    requestedGrouping !== undefined &&
    (typeof requestedGrouping !== "string" ||
      !Object.hasOwn(groupings, requestedGrouping))
  ) {
    return res
      .status(400)
      .send("groupBy must be one of: pillar, program, topic, destination");
  }
  const hasExplicitGrouping = typeof requestedGrouping === "string";
  const groupBy = hasExplicitGrouping
    ? { ...groupings[requestedGrouping] }
    : { ...groupings.pillar };

  // Depending on the filter selected, we want to group at the lowest level
  if (req.query.pillars) {
    const pillars = req.query.pillars.split("|");
    filters.pilier_code = { $in: pillars };

    if (!hasExplicitGrouping) {
      groupBy.code = "$programme_code";
      groupBy.name_fr = "$programme_name_fr";
      groupBy.name_en = "$programme_name_en";
      groupBy.sort = "$programme_code";
    }
  }

  if (req.query.programs) {
    const programs = req.query.programs.split("|");
    filters.programme_code = { $in: programs };

    if (!hasExplicitGrouping) {
      groupBy.code = "$thema_code";
      groupBy.name_fr = "$thema_name_fr";
      groupBy.name_en = "$thema_name_en";
      groupBy.sort = "$thema_sort";
    }
  }

  if (req.query.thematics) {
    const thematics = req.query.thematics.split(",");
    filters.thema_code = { $in: thematics };

    if (!hasExplicitGrouping) {
      groupBy.code = "$destination_code";
      groupBy.name_fr = "$destination_name_fr";
      groupBy.name_en = "$destination_name_en";
      groupBy.sort = destinationSort;
    }
  }

  if (req.query.destinations) {
    const destinations = req.query.destinations.split(",");
    filters.destination_code = { $in: destinations };

    if (!hasExplicitGrouping) {
      groupBy.code = "$destination_code";
      groupBy.name_fr = "$destination_name_fr";
      groupBy.name_en = "$destination_name_en";
      groupBy.sort = destinationSort;
    }
  }

  if (req.query.structureid) {
    filters.entities_id = req.query.structureid;
    delete filters.structureid;
  }

  // group by exception: if no pilar, we want to show all programs too. This query will be call two times. One without grouBy params en one with
  if (req.query.showAllPrograms === "true") {
    groupBy.code = "$programme_code";
    groupBy.name_fr = "$programme_name_fr";
    groupBy.name_en = "$programme_name_en";
    groupBy.sort = "$programme_code";
  }

  if (req.query.isEjo) {
    filters.is_ejo = { $eq: req.query.isEjo === "true" ? true : false };
  }

  if (req.query.range_of_years) {
    filters.call_year = { $in: req.query.range_of_years.split(/[|,]/) };
  }

  const data = await db
    .collection(collection_projects_entities)
    .aggregate([
      { $match: { $and: [filters] } },
      {
        $group: {
          _id: {
            code: groupBy.code,
            stage: "$stage",
            name_fr: groupBy.name_fr,
            name_en: groupBy.name_en,
          },
          total_fund_eur: { $sum: "$calculated_fund" },
          total_coordination_number: { $sum: "$coordination_number" },
          total_number_involved: { $sum: "$number_involved" },
          sort: { $first: groupBy.sort },
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
        },
      },
      { $sort: { sort: 1, code: 1 } },
    ])
    .toArray();

  const successRates = data.reduce((acc, item) => {
    if (!acc[item.code]) {
      acc[item.code] = { successful: 0, evaluated: 0 };
    }
    if (item.stage === "successful") {
      acc[item.code].successful += item.total_fund_eur;
    } else if (item.stage === "evaluated") {
      acc[item.code].evaluated += item.total_fund_eur;
    }
    return acc;
  }, {});

  const successRatesByCodes = Object.entries(successRates).map(
    ([code, { successful, evaluated }]) => ({
      code,
      successRate: evaluated > 0 ? successful / evaluated : 0,
    }),
  );

  res.json({ data, successRatesByCodes });
});

// Route pour créer le covered index de funding
router
  .route("/european-projects/overview/funding_indexes")
  .get(async (req, res) => {
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
          entities_id: 1,
          destination_name_en: 1,
          destination_name_fr: 1,
          pilier_name_en: 1,
          pilier_name_fr: 1,
          programme_name_en: 1,
          programme_name_fr: 1,
          thema_name_en: 1,
          thema_name_fr: 1,
          thema_sort: 1,
          destination_sort: 1,
          calculated_fund: 1,
          coordination_number: 1,
          number_involved: 1,
          project_id: 1,
        },
        "idx_funding_covered",
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
