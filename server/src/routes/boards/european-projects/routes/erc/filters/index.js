import express from "express";
import { db } from "../../../../../../services/mongo.js";
import { recreateIndex } from "../../../../../utils.js";

const router = new express.Router();

const collection_erc_projects_synthese = "european-projects_erc-projects-synthese";

/**
 * Route pour récupérer les filtres disponibles (années, destinations, panels)
 */
router.route("/european-projects/erc/filters").get(async (req, res) => {
  const [years, destinations, panels, frameworks, yearsByFrameworkRaw] = await Promise.all([
    db.collection(collection_erc_projects_synthese).distinct("call_year"),
    db
      .collection(collection_erc_projects_synthese)
      .aggregate([{ $group: { _id: { code: "$destination_code", name: "$destination_name_en" } } }, { $project: { _id: 0, code: "$_id.code", name: "$_id.name" } }, { $sort: { code: 1 } }])
      .toArray(),
    db
      .collection(collection_erc_projects_synthese)
      .aggregate([
        { $match: { "panel_code": { $ne: null } } },
        {
          $group: {
            _id: {
              id: "$panel_code",
              name: "$panel_name",
              lib: "$panel_lib",
              domaine: "$panel_regroupement_code",
              domaine_name: "$panel_regroupement_name",
            },
          },
        },
        { $project: { _id: 0, id: "$_id.id", name: "$_id.name", lib: "$_id.lib", domaine: "$_id.domaine", domaine_name: "$_id.domaine_name" } },
        { $sort: { domaine: 1, id: 1 } },
      ])
      .toArray(),
    db.collection(collection_erc_projects_synthese).distinct("framework"),
    db
      .collection(collection_erc_projects_synthese)
      .aggregate([{ $group: { _id: { framework: "$framework", call_year: "$call_year" } } }, { $group: { _id: "$_id.framework", years: { $addToSet: "$_id.call_year" } } }, { $project: { _id: 0, framework: "$_id", years: 1 } }])
      .toArray(),
  ]);

  const yearsByFramework = yearsByFrameworkRaw.reduce((acc, { framework, years: fwYears }) => {
    acc[framework] = fwYears.sort();
    return acc;
  }, {});

  res.json({
    years: years.sort(),
    destinations,
    panels,
    frameworks,
    yearsByFramework,
  });
});

// Route pour créer le covered index de filters
router.route("/european-projects/erc/filters_indexes").get(async (req, res) => {
  try {
    await recreateIndex(
      db.collection(collection_erc_projects_synthese),
      {
        framework: 1,
        call_year: 1,
        destination_code: 1,
        destination_name_en: 1,
        panel_code: 1,
        panel_name: 1,
        panel_lib: 1,
        panel_regroupement_code: 1,
        panel_regroupement_name: 1,
      },
      "idx_filters_covered",
    );

    res.status(201).json({ message: "Index recréé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la recréation de l'index:", error);
    res.status(500).json({ error: "Erreur lors de la recréation de l'index" });
  }
});

export default router;
