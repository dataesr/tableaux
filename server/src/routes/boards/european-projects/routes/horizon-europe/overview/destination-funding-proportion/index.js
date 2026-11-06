import express from "express";
import { db } from "../../../../../../../services/mongo.js";
import { checkQuery, recreateIndex } from "../../../../../../utils.js";

const router = new express.Router();

const collection_projects_entities = "european-projects_projects-entities";

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
            destination: "$destination_code",
            stage: "$stage",
          },
          total_fund_eur: { $sum: "$calculated_fund" },
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
    .collection(collection_projects_entities)
    .aggregate([
      { $match: { $and: [filters_all] } },
      {
        $group: {
          _id: {
            destination: "$destination_code",
            stage: "$stage",
          },
          total_fund_eur: { $sum: "$calculated_fund" },
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

// Route pour créer le covered index de destination-funding-proportion
router.route("/european-projects/overview/destination-funding-proportion_indexes").get(async (req, res) => {
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
      },
      "idx_destination-funding-proportion_covered",
    );

    res.status(201).json({ message: "Index recréé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la recréation de l'index:", error);
    res.status(500).json({ error: "Erreur lors de la recréation de l'index" });
  }
});

export default router;
