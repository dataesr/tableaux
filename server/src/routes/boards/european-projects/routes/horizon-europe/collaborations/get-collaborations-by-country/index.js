import express from "express";
import { db } from "../../../../../../../services/mongo.js";
import { checkQuery, recreateIndex } from "../../../../../../utils.js";

const router = new express.Router();

const collection_collaborations = "european-projects_collaborations";

// Route pour récupérer les collaborations par pays en fonction du pays en cours et du pays collaborateur
router.route("/european-projects/collaborations/get-collaborations-by-country").get(async (req, res) => {
  const { country_code, country_code_collab } = req.query;
  if (!country_code || !country_code_collab) {
    return res.status(400).json({ error: "Les codes pays sont requis" });
  }

  const filters = checkQuery(req.query, ["country_code", "country_code_collab"], res);

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
  if (req.query.call_year) {
    const callYears = req.query.call_year.split(",");
    filters.call_year = { $in: callYears };
  }
  if (req.query.isEjo) {
    filters["is_ejo"] = { $eq: req.query.isEjo === "true" ? true : false };
  }

  try {
    const collaborations = await db
      .collection(collection_collaborations)
      .find({ ...filters })
      .project({
        _id: 0,
        // abstract: 1,
        call_year: 1,
        country_code_collab: 1,
        country_code: 1,
        extra_joint_organizations_collab: 1,
        extra_joint_organizations: 1,
        flag_coordination: 1,
        part_num_collab: 1,
        part_num: 1,
        participates_as_collab: 1,
        participates_as: 1,
        participation_nuts_collab: 1,
        participation_nuts: 1,
        project_id: 1,
        proposal_budget: 1,
        total_cost: 1,
      })
      .toArray();

    res.status(200).json(collaborations);
  } catch (error) {
    console.error("Error fetching collaborations by country:", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
});

// Route de création de l'index pour les collaborations par pays
router.route("/european-projects/collaborations/get-collaborations-by-country_indexes").get(async (req, res) => {
  try {
    await recreateIndex(
      db.collection(collection_collaborations),
      {
        country_code: 1,
        country_code_collab: 1,
        pilier_code: 1,
        programme_code: 1,
        thema_code: 1,
        destination_code: 1,
        call_year: 1,
        flag_coordination: 1,
        participates_as: 1,
        participates_as_collab: 1,
        project_id: 1,
        proposal_budget: 1,
        total_cost: 1,
        part_num: 1,
        part_num_collab: 1,
        participation_nuts: 1,
        participation_nuts_collab: 1,
        extra_joint_organizations: 1,
        extra_joint_organizations_collab: 1,
      },
      "idx_collaborations-by-country_covered",
    );

    res.status(201).json({ message: "Index recréé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la recréation de l'index:", error);
    res.status(500).json({ error: "Erreur lors de la recréation de l'index" });
  }
});

export default router;
