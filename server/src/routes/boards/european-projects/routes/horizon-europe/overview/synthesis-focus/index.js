import express from "express";
import { db } from "../../../../../../../services/mongo.js";
import { recreateIndex } from "../../../../../../utils.js";

const router = new express.Router();

const collection_projects_entities = "european-projects_projects-entities";

router.route("/european-projects/synthesis-focus").get(async (req, res) => {
  // Filtres "communs" appliqués à la fois au calcul pays et au calcul entité.
  // IMPORTANT : entities_id n'est PAS inclus ici, car le calcul pays doit rester
  // global (toutes les entités du pays) pour servir de dénominateur à la part captée.
  const filters = {};
  if (req.query.pillars) {
    filters.pilier_code = { $in: req.query.pillars.split("|") };
  }
  if (req.query.programs) {
    filters.programme_code = { $in: req.query.programs.split("|") };
  }
  if (req.query.thematics) {
    filters.thema_code = { $in: req.query.thematics.split(",") };
  }
  if (req.query.destinations) {
    filters.destination_code = { $in: req.query.destinations.split(",") };
  }
  if (req.query.range_of_years) {
    filters.call_year = { $in: req.query.range_of_years.split(/[|,]/) };
  }
  if (req.query.isEjo) {
    filters["is_ejo"] = { $eq: req.query.isEjo === "true" ? true : false };
  }

  const entityId = req.query.structureid || null;
  const countryCodeFilter = req.query.country_code ? req.query.country_code.toLowerCase() : null;

  // Pipeline réutilisable : group par pays, puis group global avec push des pays ($$ROOT)
  const countryAggregationStages = [
    {
      $group: {
        _id: "$country_code",
        total_fund_eur: { $sum: "$calculated_fund" },
        total_involved: { $sum: "$number_involved" },
        total_coordination_number: { $sum: "$coordination_number" },
      },
    },
    {
      $project: {
        _id: 0,
        country_code: "$_id",
        total_fund_eur: 1,
        total_involved: 1,
        total_coordination_number: 1,
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
  ];

  // Pipeline plus léger pour l'entité : pas besoin du group global, juste le détail par pays
  // (en pratique une entité appartient à un seul pays, mais on reste robuste si jamais ce n'était pas le cas)
  const entityAggregationStages = [
    {
      $group: {
        _id: "$country_code",
        total_fund_eur: { $sum: "$calculated_fund" },
        total_involved: { $sum: "$number_involved" },
        total_coordination_number: { $sum: "$coordination_number" },
      },
    },
    {
      $project: {
        _id: 0,
        country_code: "$_id",
        total_fund_eur: 1,
        total_involved: 1,
        total_coordination_number: 1,
      },
    },
  ];

  // Construction dynamique du $facet : un seul appel aggregate pour tout récupérer
  const facet = {
    successfulCountries: [{ $match: { ...filters, stage: "successful" } }, ...countryAggregationStages],
    evaluatedCountries: [{ $match: { ...filters, stage: "evaluated" } }, ...countryAggregationStages],
  };

  if (entityId) {
    facet.successfulEntity = [{ $match: { ...filters, entities_id: entityId, stage: "successful" } }, ...entityAggregationStages];
    facet.evaluatedEntity = [{ $match: { ...filters, entities_id: entityId, stage: "evaluated" } }, ...entityAggregationStages];
  }

  const [result] = await db
    .collection(collection_projects_entities)
    .aggregate([{ $facet: facet }])
    .toArray();

  const ratio = (numerator, denominator) => (typeof denominator === "number" && denominator !== 0 ? numerator / denominator : null);

  // Construit la réponse pour un "stage" donné (successful ou evaluated)
  const buildStageResponse = (countryAgg, entityRows) => {
    if (!countryAgg) return null;

    const visibleCountries = countryCodeFilter ? countryAgg.countries.filter((c) => c.country_code.toLowerCase() === countryCodeFilter) : countryAgg.countries;

    const base = {
      total_fund_eur: countryAgg.total_fund_eur,
      total_involved: countryAgg.total_involved,
      total_coordination_number: countryAgg.total_coordination_number,
      countries: visibleCountries,
    };

    if (!entityId) {
      // Comportement inchangé : pays sélectionné vs ensemble des pays
      return base;
    }

    // Données de l'entité (normalement une seule ligne, un seul pays)
    const entityRow = (entityRows && entityRows[0]) || null;
    const entityCountryCode = entityRow ? entityRow.country_code : null;

    // Pays de référence pour le ratio : celui demandé en query, sinon celui de l'entité elle-même
    const referenceCode = countryCodeFilter || (entityCountryCode || "").toLowerCase() || null;
    const referenceCountry = countryAgg.countries.find((c) => c.country_code.toLowerCase() === referenceCode) || null;

    return {
      ...base,
      entity: {
        country_code: entityCountryCode,
        total_fund_eur: entityRow ? entityRow.total_fund_eur : 0,
        total_involved: entityRow ? entityRow.total_involved : 0,
        total_coordination_number: entityRow ? entityRow.total_coordination_number : 0,
        // part captée par l'entité au sein du pays de référence (entre 0 et 1, null si pays inconnu/total à 0)
        share_fund_eur: referenceCountry ? ratio(entityRow?.total_fund_eur || 0, referenceCountry.total_fund_eur) : null,
        share_involved: referenceCountry ? ratio(entityRow?.total_involved || 0, referenceCountry.total_involved) : null,
        share_coordination_number: referenceCountry ? ratio(entityRow?.total_coordination_number || 0, referenceCountry.total_coordination_number) : null,
      },
    };
  };

  res.json({
    successful: buildStageResponse(result.successfulCountries[0], result.successfulEntity),
    evaluated: buildStageResponse(result.evaluatedCountries[0], result.evaluatedEntity),
  });
});

// Route pour créer l'index pour synthesis-focus
router.route("/european-projects/synthesis-focus_indexes").get(async (req, res) => {
  try {
    await recreateIndex(
      db.collection(collection_projects_entities),
      {
        country_code: 1,
        pilier_code: 1,
        programme_code: 1,
        thema_code: 1,
        destination_code: 1,
        call_year: 1,
        entities_id: 1,
        is_ejo: 1,
      },
      "idx_synthesis-focus_covered",
    );

    res.status(201).json({ message: "Index recréé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la recréation de l'index:", error);
    res.status(500).json({ error: "Erreur lors de la recréation de l'index" });
  }
});

export default router;
