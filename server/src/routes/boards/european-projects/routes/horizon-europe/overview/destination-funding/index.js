import express from "express";
import { db } from "../../../../../../../services/mongo.js";
import { checkQuery, recreateIndex } from "../../../../../../utils.js";

const router = new express.Router();

const collection_projects_entities = "european-projects_projects-entities";

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

  if (req.query.isEjo) {
    filters["is_ejo"] = { $eq: req.query.isEjo === "true" ? true : false };
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
            destination: "$destination_code",
            stage: "$stage",
          },
          total_fund_eur: { $sum: "$calculated_fund" },
          count: { $addToSet: "$_id" },
        },
      },
      {
        $project: {
          _id: 0,
          destination: "$_id.destination",
          stage: "$_id.stage",
          total_fund_eur: 1,
          count: { $size: "$count" },
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

// Route pour créer le covered index de destination-funding
router.route("/european-projects/overview/destination-funding_indexes").get(async (req, res) => {
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
      "idx_destination-funding_covered",
    );

    res.status(201).json({ message: "Index recréé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la recréation de l'index:", error);
    res.status(500).json({ error: "Erreur lors de la recréation de l'index" });
  }
});

export default router;
