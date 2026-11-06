import express from "express";
import { db } from "../../../../../../../services/mongo.js";
import { checkQuery, recreateIndex } from "../../../../../../utils.js";

const router = new express.Router();

const collection_projects_entities = "european-projects_projects-entities";

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
            stage: "$stage",
            action_id: "$action_group_code",
            action_name: "$action_group_name",
          },
          total_fund_eur: { $sum: "$calculated_fund" },
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
    .collection(collection_projects_entities)
    .aggregate([
      { $match: { $and: [filters] } },
      {
        $group: {
          _id: {
            stage: "$stage",
            action_id: "$action_group_code",
            action_name: "$action_group_name",
          },
          total_fund_eur: { $sum: "$calculated_fund" },
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

// Route pour créer le covered index de projects-types-1
router.route("/european-projects/overview/projects-types-1_indexes").get(async (req, res) => {
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
        action_group_code: 1,
        action_group_name: 1,
        action_id: 1,
        action_name: 1,
        calculated_fund: 1,
      },
      "idx_projects-types-1_covered",
    );

    res.status(201).json({ message: "Index recréé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la recréation de l'index:", error);
    res.status(500).json({ error: "Erreur lors de la recréation de l'index" });
  }
});

export default router;
