import express from "express";
import { db } from "../../../../../../services/mongo.js";
import { recreateIndex } from "../../../../../utils.js";

const router = new express.Router();

const collection_persons = "european-projects_erc-persons";

/**
 * Route genre ERC - répartition par genre selon le type de financement
 * Paramètres: country_code, call_year, domaine_scientifique, panel_id
 */
router.route("/european-projects/erc/gender-by-destination").get(async (req, res) => {
  if (!req.query.country_code) {
    return res.status(400).json({ error: "Le code pays est requis" });
  }

  try {
    const filters = {
      country_code: req.query.country_code.toUpperCase(),
      gender: { $in: ["female", "male", "non binary"] },
    };

    if (req.query.call_year) {
      filters.call_year = { $in: req.query.call_year.split(",") };
    }
    if (req.query.destination_code) {
      filters.destination_code = { $in: req.query.destination_code.split(",") };
    }
    if (req.query.panel_id) {
      filters.panel_code = { $in: req.query.panel_id.split(",") };
    } else if (req.query.domaine_scientifique) {
      filters.panel_regroupement_code = req.query.domaine_scientifique.toUpperCase();
    }
    if (req.query.isEjo) {
      filters["is_ejo"] = { $eq: req.query.isEjo === "true" ? true : false };
    }

    const data = await db
      .collection(collection_persons)
      .aggregate([
        { $match: filters },
        {
          $group: {
            _id: {
              destination_code: "$destination_code",
              gender: "$gender",
            },
            count: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: "$_id.destination_code",
            genders: {
              $push: {
                gender: "$_id.gender",
                count: "$count",
              },
            },
            total: { $sum: "$count" },
          },
        },
        {
          $project: {
            _id: 0,
            destination_code: "$_id",
            genders: 1,
            total: 1,
          },
        },
        { $sort: { destination_code: 1 } },
      ])
      .toArray();

    const totalByGender = await db
      .collection(collection_persons)
      .aggregate([{ $match: filters }, { $group: { _id: "$gender", count: { $sum: 1 } } }, { $project: { _id: 0, gender: "$_id", count: 1 } }])
      .toArray();

    res.status(200).json({ byDestination: data, total: totalByGender });
  } catch (error) {
    console.error("Error fetching ERC gender by destination:", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
});

// Route pour créer le covered index de gender-by-destination
router.route("/european-projects/erc/gender-by-destination_indexes").get(async (req, res) => {
  try {
    await recreateIndex(
      db.collection(collection_persons),
      {
        country_code: 1,
        gender: 1,
        is_ejo: 1,
        panel_code: 1,
        panel_regroupement_code: 1,
        call_year: 1,
        destination_code: 1,
      },
      "idx_gender-by-destination_covered",
    );

    res.status(201).json({ message: "Index recréé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la recréation de l'index:", error);
    res.status(500).json({ error: "Erreur lors de la recréation de l'index" });
  }
});

export default router;
