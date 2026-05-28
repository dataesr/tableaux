import express from "express";
import { db } from "../../../../services/mongo.js";

const router = new express.Router();

const COLLECTION_NAME = "european-projects_msca-projects-synthese_staging";

/**
 * Route de synthèse MSCA - agrège les données globales pour les cartes de synthèse
 * Paramètres optionnels :
 * - country_code : code du pays (ex: FRA)
 * - call_year    : années séparées par virgule (ex: 2021,2022)
 * - destination_code : code(s) de destination (ex: PF,DN)
 */
router.route("/european-projects/msca/synthesis").get(async (req, res) => {
  const filters = {};

  if (req.query.call_year) {
    filters.call_year = { $in: req.query.call_year.split(",") };
  }
  if (req.query.destination_code) {
    filters.destination_code = { $in: req.query.destination_code.split(",") };
  }
  if (req.query.framework) {
    filters.framework = req.query.framework;
  }

  const buildPipeline = (stage) => [
    { $match: { ...filters, stage } },
    {
      $group: {
        _id: "$country_code",
        total_funding_project: { $sum: "$fund_eur" },
        total_involved: { $sum: "$number_involved" },
        total_pi: {
          $sum: { $cond: [{ $eq: ["$role_participant", "Coordinator"] }, "$number_involved", 0] },
        },
        project_ids: { $addToSet: "$project_id" },
        country_name_fr: { $first: "$country_name_fr" },
        country_name_en: { $first: "$country_name_en" },
      },
    },
    {
      $project: {
        _id: 0,
        country_code: "$_id",
        country_name_fr: 1,
        country_name_en: 1,
        total_funding_project: 1,
        total_involved: 1,
        total_pi: 1,
        total_projects: { $size: "$project_ids" },
      },
    },
    {
      $group: {
        _id: null,
        total_funding_project: { $sum: "$total_funding_project" },
        total_involved: { $sum: "$total_involved" },
        total_pi: { $sum: "$total_pi" },
        total_projects: { $sum: "$total_projects" },
        countries: { $push: "$$ROOT" },
      },
    },
    { $project: { _id: 0, total_funding_project: 1, total_involved: 1, total_pi: 1, total_projects: 1, countries: 1 } },
  ];

  const [dataSuccessful, dataEvaluated] = await Promise.all([
    db.collection(COLLECTION_NAME).aggregate(buildPipeline("successful")).toArray(),
    db.collection(COLLECTION_NAME).aggregate(buildPipeline("evaluated")).toArray(),
  ]);

  const filterByCountry = (record, countryCode) =>
    record
      ? {
          total_funding_project: record.total_funding_project,
          total_involved: record.total_involved,
          total_pi: record.total_pi,
          total_projects: record.total_projects,
          countries: (record.countries || []).filter((c) => c.country_code?.toUpperCase() === countryCode),
        }
      : null;

  if (req.query.country_code) {
    const cc = req.query.country_code.toUpperCase();
    return res.json({
      successful: filterByCountry(dataSuccessful[0], cc),
      evaluated: filterByCountry(dataEvaluated[0], cc),
    });
  }

  res.json({
    successful: dataSuccessful[0] || null,
    evaluated: dataEvaluated[0] || null,
  });
});

/**
 * Route de synthèse par type de financement MSCA (destination)
 * Retourne les données agrégées par destination_code (PF, DN, SE, COFUND…)
 */
router.route("/european-projects/msca/synthesis-by-destination").get(async (req, res) => {
  const filters = {};

  if (req.query.call_year) {
    filters.call_year = { $in: req.query.call_year.split(",") };
  }
  if (req.query.framework) {
    filters.framework = req.query.framework;
  }
  if (req.query.country_code) {
    filters.country_code = req.query.country_code.toUpperCase();
  }

  const data = await db
    .collection(COLLECTION_NAME)
    .aggregate([
      { $match: filters },
      {
        $group: {
          _id: {
            destination_code: "$destination_code",
            destination_name_en: "$destination_name_en",
            country_code: "$country_code",
            country_name_fr: "$country_name_fr",
            country_name_en: "$country_name_en",
            stage: "$stage",
          },
          total_funding_project: { $sum: "$fund_eur" },
          total_involved: { $sum: "$number_involved" },
          total_pi: {
            $sum: { $cond: [{ $eq: ["$role_participant", "Coordinator"] }, "$number_involved", 0] },
          },
          project_ids: { $addToSet: "$project_id" },
        },
      },
      {
        $project: {
          _id: 0,
          destination_code: "$_id.destination_code",
          destination_name_en: "$_id.destination_name_en",
          country_code: "$_id.country_code",
          country_name_fr: "$_id.country_name_fr",
          country_name_en: "$_id.country_name_en",
          stage: "$_id.stage",
          total_funding_project: 1,
          total_involved: 1,
          total_pi: 1,
          total_projects: { $size: "$project_ids" },
        },
      },
      { $sort: { destination_code: 1, stage: 1 } },
    ])
    .toArray();

  // Restructurer par destination
  const destinations = {};
  data.forEach((item) => {
    if (!destinations[item.destination_code]) {
      destinations[item.destination_code] = {
        destination_code: item.destination_code,
        destination_name_en: item.destination_name_en,
        evaluated: { total_funding_project: 0, total_involved: 0, total_pi: 0, total_projects: 0, countries: [] },
        successful: { total_funding_project: 0, total_involved: 0, total_pi: 0, total_projects: 0, countries: [] },
      };
    }
    destinations[item.destination_code][item.stage].countries.push({
      country_code: item.country_code,
      country_name_fr: item.country_name_fr,
      country_name_en: item.country_name_en,
      total_funding_project: item.total_funding_project,
      total_involved: item.total_involved,
      total_pi: item.total_pi,
      total_projects: item.total_projects,
    });
  });

  // Calculer les totaux pour chaque destination
  Object.values(destinations).forEach((dest) => {
    dest.evaluated.total_funding_project = dest.evaluated.countries.reduce((sum, c) => sum + c.total_funding_project, 0);
    dest.evaluated.total_involved = dest.evaluated.countries.reduce((sum, c) => sum + c.total_involved, 0);
    dest.evaluated.total_pi = dest.evaluated.countries.reduce((sum, c) => sum + c.total_pi, 0);
    dest.evaluated.total_projects = dest.evaluated.countries.reduce((sum, c) => sum + c.total_projects, 0);

    dest.successful.total_funding_project = dest.successful.countries.reduce((sum, c) => sum + c.total_funding_project, 0);
    dest.successful.total_involved = dest.successful.countries.reduce((sum, c) => sum + c.total_involved, 0);
    dest.successful.total_pi = dest.successful.countries.reduce((sum, c) => sum + c.total_pi, 0);
    dest.successful.total_projects = dest.successful.countries.reduce((sum, c) => sum + c.total_projects, 0);
  });

  res.json(Object.values(destinations));
});

/**
 * Route de synthèse par panel scientifique MSCA
 * Retourne les données agrégées par panel_id (SOC, CHE, ENV…)
 */
router.route("/european-projects/msca/synthesis-by-panel").get(async (req, res) => {
  const filters = {};

  if (req.query.call_year) {
    filters.call_year = { $in: req.query.call_year.split(",") };
  }
  if (req.query.destination_code) {
    filters.destination_code = { $in: req.query.destination_code.split(",") };
  }
  if (req.query.framework) {
    filters.framework = req.query.framework;
  }
  if (req.query.country_code) {
    filters.country_code = req.query.country_code.toUpperCase();
  }

  const data = await db
    .collection(COLLECTION_NAME)
    .aggregate([
      { $match: { ...filters, panel_id: { $ne: null, $exists: true } } },
      {
        $group: {
          _id: {
            panel_id: "$panel_id",
            panel_name: "$panel_name",
            country_code: "$country_code",
            country_name_fr: "$country_name_fr",
            country_name_en: "$country_name_en",
            stage: "$stage",
          },
          total_funding_project: { $sum: "$fund_eur" },
          total_involved: { $sum: "$number_involved" },
          total_pi: {
            $sum: { $cond: [{ $eq: ["$role_participant", "Coordinator"] }, "$number_involved", 0] },
          },
          project_ids: { $addToSet: "$project_id" },
        },
      },
      {
        $project: {
          _id: 0,
          panel_id: "$_id.panel_id",
          panel_name: "$_id.panel_name",
          country_code: "$_id.country_code",
          country_name_fr: "$_id.country_name_fr",
          country_name_en: "$_id.country_name_en",
          stage: "$_id.stage",
          total_funding_project: 1,
          total_involved: 1,
          total_pi: 1,
          total_projects: { $size: "$project_ids" },
        },
      },
      { $sort: { panel_id: 1, stage: 1 } },
    ])
    .toArray();

  // Restructurer par panel
  const panels = {};
  data.forEach((item) => {
    if (!panels[item.panel_id]) {
      panels[item.panel_id] = {
        panel_id: item.panel_id,
        panel_name: item.panel_name,
        evaluated: { total_funding_project: 0, total_involved: 0, total_pi: 0, total_projects: 0, countries: [] },
        successful: { total_funding_project: 0, total_involved: 0, total_pi: 0, total_projects: 0, countries: [] },
      };
    }
    panels[item.panel_id][item.stage].countries.push({
      country_code: item.country_code,
      country_name_fr: item.country_name_fr,
      country_name_en: item.country_name_en,
      total_funding_project: item.total_funding_project,
      total_involved: item.total_involved,
      total_pi: item.total_pi,
      total_projects: item.total_projects,
    });
  });

  // Calculer les totaux pour chaque panel
  Object.values(panels).forEach((panel) => {
    panel.evaluated.total_funding_project = panel.evaluated.countries.reduce((sum, c) => sum + c.total_funding_project, 0);
    panel.evaluated.total_involved = panel.evaluated.countries.reduce((sum, c) => sum + c.total_involved, 0);
    panel.evaluated.total_pi = panel.evaluated.countries.reduce((sum, c) => sum + c.total_pi, 0);
    panel.evaluated.total_projects = panel.evaluated.countries.reduce((sum, c) => sum + c.total_projects, 0);

    panel.successful.total_funding_project = panel.successful.countries.reduce((sum, c) => sum + c.total_funding_project, 0);
    panel.successful.total_involved = panel.successful.countries.reduce((sum, c) => sum + c.total_involved, 0);
    panel.successful.total_pi = panel.successful.countries.reduce((sum, c) => sum + c.total_pi, 0);
    panel.successful.total_projects = panel.successful.countries.reduce((sum, c) => sum + c.total_projects, 0);
  });

  res.json(Object.values(panels));
});

/**
 * Route de filtres MSCA - retourne les années disponibles et leur répartition par framework
 */
router.route("/european-projects/msca/filters").get(async (req, res) => {
  const [years, destinations, frameworks, yearsByFrameworkRaw] = await Promise.all([
    db.collection(COLLECTION_NAME).distinct("call_year"),
    db
      .collection(COLLECTION_NAME)
      .aggregate([
        { $group: { _id: { code: "$destination_code", name: "$destination_name_en" } } },
        { $project: { _id: 0, code: "$_id.code", name: "$_id.name" } },
        { $sort: { code: 1 } },
      ])
      .toArray(),
    db.collection(COLLECTION_NAME).distinct("framework"),
    db
      .collection(COLLECTION_NAME)
      .aggregate([
        { $group: { _id: { framework: "$framework", call_year: "$call_year" } } },
        { $group: { _id: "$_id.framework", years: { $addToSet: "$_id.call_year" } } },
        { $project: { _id: 0, framework: "$_id", years: 1 } },
      ])
      .toArray(),
  ]);

  const yearsByFramework = yearsByFrameworkRaw.reduce((acc, { framework, years: fwYears }) => {
    acc[framework] = fwYears.sort();
    return acc;
  }, {});

  res.json({
    years: years.sort(),
    destinations,
    frameworks,
    yearsByFramework,
  });
});

/**
 * Route d'évolution temporelle MSCA
 * Retourne les données agrégées par année et type de financement
 * Inclut les données du pays sélectionné ET les totaux globaux pour calculer les poids
 */
router.route("/european-projects/msca/evolution").get(async (req, res) => {
  const baseFilters = {};
  const countryFilters = {};

  if (req.query.destination_code) {
    const destinations = req.query.destination_code.split(",");
    baseFilters.destination_code = { $in: destinations };
    countryFilters.destination_code = { $in: destinations };
  }
  if (req.query.panel_id) {
    const panels = req.query.panel_id.split(",");
    baseFilters.panel_id = { $in: panels };
    countryFilters.panel_id = { $in: panels };
  }
  if (req.query.framework) {
    baseFilters.framework = req.query.framework;
    countryFilters.framework = req.query.framework;
  }
  if (req.query.country_code) {
    countryFilters.country_code = req.query.country_code.toUpperCase();
  }

  countryFilters.call_year = { $ne: null, $exists: true, $nin: ["2002", "2003", "2004", "2005", "2006"] };
  baseFilters.call_year = { $ne: null, $exists: true, $nin: ["2002", "2003", "2004", "2005", "2006"] };

  // Agrégation commune
  const aggregationPipeline = (filters, stage) => [
    { $match: { ...filters, stage } },
    {
      $group: {
        _id: {
          call_year: "$call_year",
          destination_code: "$destination_code",
          destination_name_en: "$destination_name_en",
        },
        total_funding_project: { $sum: "$fund_eur" },
        total_involved: { $sum: "$number_involved" },
      },
    },
    {
      $project: {
        _id: 0,
        call_year: "$_id.call_year",
        destination_code: "$_id.destination_code",
        destination_name_en: "$_id.destination_name_en",
        total_funding_project: 1,
        total_involved: 1,
      },
    },
    { $sort: { call_year: 1, destination_code: 1 } },
  ];

  // Données pour le pays sélectionné
  const [countrySuccessful, countryEvaluated] = await Promise.all([
    db.collection(COLLECTION_NAME).aggregate(aggregationPipeline(countryFilters, "successful")).toArray(),
    db.collection(COLLECTION_NAME).aggregate(aggregationPipeline(countryFilters, "evaluated")).toArray(),
  ]);

  // Données globales (tous pays) pour calculer les poids
  const [totalSuccessful, totalEvaluated] = await Promise.all([
    db.collection(COLLECTION_NAME).aggregate(aggregationPipeline(baseFilters, "successful")).toArray(),
    db.collection(COLLECTION_NAME).aggregate(aggregationPipeline(baseFilters, "evaluated")).toArray(),
  ]);

  res.json({
    country: {
      successful: countrySuccessful,
      evaluated: countryEvaluated,
    },
    total: {
      successful: totalSuccessful,
      evaluated: totalEvaluated,
    },
  });
});


/**
 * Route d'évolution temporelle MSCA par domaine scientifique (LS, PE, SH)
 * Retourne les données agrégées par année et domaine scientifique
 * Inclut les données du pays sélectionné ET les totaux globaux pour calculer les poids
 */
router.route("/european-projects/msca/evolution-by-panel").get(async (req, res) => {
  const baseFilters = {};
  const countryFilters = {};

  if (req.query.destination_code) {
    const destinations = req.query.destination_code.split(",");
    baseFilters.destination_code = { $in: destinations };
    countryFilters.destination_code = { $in: destinations };
  }
  if (req.query.panel_id) {
    const panels = req.query.panel_id.split(",");
    baseFilters.panel_id = { $in: panels };
    countryFilters.panel_id = { $in: panels };
  }
  if (req.query.framework) {
    baseFilters.framework = req.query.framework;
    countryFilters.framework = req.query.framework;
  }
  if (req.query.country_code) {
    countryFilters.country_code = req.query.country_code.toUpperCase();
  }

  // Agrégation par domaine scientifique
  const aggregationPipeline = (filters, stage) => [
    { $match: { ...filters, stage, "panel_id": {$ne:null}} },
    {
      $group: {
        _id: {
          call_year: "$call_year",
          panel_id: "$panel_id",
          panel_name: "$panel_name",
        },
        total_funding: { $sum: "$fund_eur" },
        total_involved: { $sum: "$number_involved" },
      },
    },
    {
      $project: {
        _id: 0,
        call_year: "$_id.call_year",
        panel_id: "$_id.panel_id",
        panel_name: "$_id.panel_name",
        total_funding: 1,
        total_involved: 1,
      },
    },
    { $sort: { call_year: 1, panel_name: 1 } },
  ];

  // Données pour le pays sélectionné
  const [countrySuccessful, countryEvaluated] = await Promise.all([
    db.collection(COLLECTION_NAME).aggregate(aggregationPipeline(countryFilters, "successful")).toArray(),
    db.collection(COLLECTION_NAME).aggregate(aggregationPipeline(countryFilters, "evaluated")).toArray(),
  ]);

  // Données globales (tous pays) pour calculer les poids
  const [totalSuccessful, totalEvaluated] = await Promise.all([
    db.collection(COLLECTION_NAME).aggregate(aggregationPipeline(baseFilters, "successful")).toArray(),
    db.collection(COLLECTION_NAME).aggregate(aggregationPipeline(baseFilters, "evaluated")).toArray(),
  ]);

  res.json({
    country: {
      successful: countrySuccessful,
      evaluated: countryEvaluated,
    },
    total: {
      successful: totalSuccessful,
      evaluated: totalEvaluated,
    },
  });
});


export default router;
