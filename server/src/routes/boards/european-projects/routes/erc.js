import express from "express";
import { db } from "../../../../services/mongo.js";

const router = new express.Router();

const collection_erc_projects_synthese = "european-projects_erc-projects-synthese_staging";
const collection_projects_entities = "european-projects_projects-entities_staging";
const collection_persons = "european-projects_erc-persons_staging";

/**
 * Route de synthèse ERC - récupère les données agrégées pour les cartes de synthèse
 * Paramètres optionnels:
 * - country_code: code du pays (ex: FRA, CHE)
 * - call_year: années d'appel (ex: 2018,2019,2020)
 * - destination_code: codes de destination/type de financement (ex: COG,STG,ADG)
 * - panel_id: identifiants des panels (ex: SH4,LS9)
 */
router.route("/european-projects/erc/synthesis").get(async (req, res) => {
  const filters = {};

  if (req.query.call_year) {
    const years = req.query.call_year.split(",");
    filters.call_year = { $in: years };
  }
  if (req.query.destination_code) {
    const destinations = req.query.destination_code.split(",");
    filters.destination_code = { $in: destinations };
  }
  if (req.query.panel_id) {
    const panels = req.query.panel_id.split(",");
    filters.panel_id = { $in: panels };
  }
  if (req.query.domaine_scientifique) {
    filters.domaine_scientifique = req.query.domaine_scientifique.toUpperCase();
  }
  if (req.query.framework) {
    filters.framework = req.query.framework;
  }

  // Données pour les projets lauréats (successful)
  const dataSuccessful = await db
    .collection(collection_erc_projects_synthese)
    .aggregate([
      { $match: { ...filters, stage: "successful" } },
      {
        $group: {
          _id: "$country_code",
          total_funding_project: { $sum: "$funding_project" },
          total_funding_entity: { $sum: "$funding_entity" },
          total_involved: { $sum: "$number_involved" },
          total_pi: { $sum: { $cond: [{ $eq: ["$role_entity", "PI"] }, "$number_involved", 0] } },
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
          total_funding_entity: 1,
          total_involved: 1,
          total_pi: 1,
        },
      },
      {
        $group: {
          _id: null,
          total_funding_project: { $sum: "$total_funding_project" },
          total_funding_entity: { $sum: "$total_funding_entity" },
          total_involved: { $sum: "$total_involved" },
          total_pi: { $sum: "$total_pi" },
          countries: { $push: "$$ROOT" },
        },
      },
      {
        $project: {
          _id: 0,
          total_funding_project: 1,
          total_funding_entity: 1,
          total_involved: 1,
          total_pi: 1,
          countries: 1,
        },
      },
    ])
    .toArray();

  // Données pour les projets évalués (evaluated)
  const dataEvaluated = await db
    .collection(collection_erc_projects_synthese)
    .aggregate([
      { $match: { ...filters, stage: "evaluated" } },
      {
        $group: {
          _id: "$country_code",
          total_funding_project: { $sum: "$funding_project" },
          total_funding_entity: { $sum: "$funding_entity" },
          total_involved: { $sum: "$number_involved" },
          total_pi: { $sum: { $cond: [{ $eq: ["$role_entity", "PI"] }, "$number_involved", 0] } },
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
          total_funding_entity: 1,
          total_involved: 1,
          total_pi: 1,
        },
      },
      {
        $group: {
          _id: null,
          total_funding_project: { $sum: "$total_funding_project" },
          total_funding_entity: { $sum: "$total_funding_entity" },
          total_involved: { $sum: "$total_involved" },
          total_pi: { $sum: "$total_pi" },
          countries: { $push: "$$ROOT" },
        },
      },
      {
        $project: {
          _id: 0,
          total_funding_project: 1,
          total_funding_entity: 1,
          total_involved: 1,
          total_pi: 1,
          countries: 1,
        },
      },
    ])
    .toArray();

  // Filtrer par pays si demandé
  if (req.query.country_code) {
    const countryCode = req.query.country_code.toUpperCase();
    return res.json({
      successful: dataSuccessful[0]
        ? {
            total_funding_project: dataSuccessful[0].total_funding_project,
            total_funding_entity: dataSuccessful[0].total_funding_entity,
            total_involved: dataSuccessful[0].total_involved,
            total_pi: dataSuccessful[0].total_pi,
            countries: dataSuccessful[0].countries.filter((el) => el.country_code.toUpperCase() === countryCode),
          }
        : null,
      evaluated: dataEvaluated[0]
        ? {
            total_funding_project: dataEvaluated[0].total_funding_project,
            total_funding_entity: dataEvaluated[0].total_funding_entity,
            total_involved: dataEvaluated[0].total_involved,
            total_pi: dataEvaluated[0].total_pi,
            countries: dataEvaluated[0].countries.filter((el) => el.country_code.toUpperCase() === countryCode),
          }
        : null,
    });
  }

  res.json({
    successful: dataSuccessful[0] || null,
    evaluated: dataEvaluated[0] || null,
  });
});

/**
 * Route de synthèse par type de financement ERC (destination)
 * Retourne les données agrégées par destination_code (STG, COG, ADG, SYG, POC)
 */
router.route("/european-projects/erc/synthesis-by-destination").get(async (req, res) => {
  const filters = {};

  if (req.query.call_year) {
    const years = req.query.call_year.split(",");
    filters.call_year = { $in: years };
  }
  if (req.query.panel_id) {
    const panels = req.query.panel_id.split(",");
    filters.panel_id = { $in: panels };
  }
  if (req.query.framework) {
    filters.framework = req.query.framework;
  }
  if (req.query.country_code) {
    filters.country_code = req.query.country_code.toUpperCase();
  }

  const data = await db
    .collection(collection_erc_projects_synthese)
    .aggregate([
      { $match: filters },
      {
        $group: {
          _id: {
            destination_code: "$destination_code",
            destination_name_en: "$destination_name_en",
            stage: "$stage",
          },
          total_funding_project: { $sum: "$funding_project" },
          total_funding_entity: { $sum: "$funding_entity" },
          total_involved: { $sum: "$number_involved" },
          total_pi: { $sum: { $cond: [{ $eq: ["$role_entity", "PI"] }, "$number_involved", 0] } },
        },
      },
      {
        $project: {
          _id: 0,
          destination_code: "$_id.destination_code",
          destination_name_en: "$_id.destination_name_en",
          stage: "$_id.stage",
          total_funding_project: 1,
          total_funding_entity: 1,
          total_involved: 1,
          total_pi: 1,
        },
      },
      { $sort: { destination_code: 1, stage: 1 } },
    ])
    .toArray();

  // Restructurer les données par destination
  const destinations = {};
  data.forEach((item) => {
    if (!destinations[item.destination_code]) {
      destinations[item.destination_code] = {
        destination_code: item.destination_code,
        destination_name_en: item.destination_name_en,
        evaluated: null,
        successful: null,
      };
    }
    destinations[item.destination_code][item.stage] = {
      total_funding_project: item.total_funding_project,
      total_funding_entity: item.total_funding_entity,
      total_involved: item.total_involved,
      total_pi: item.total_pi,
    };
  });

  res.json(Object.values(destinations));
});

/**
 * Route de synthèse par panel ERC
 * Retourne les données agrégées par panel_id
 * Paramètres optionnels:
 * - stage: "successful" (défaut) ou "evaluated"
 */
/**
 * Route de synthèse par panel ERC
 * Retourne les données agrégées par panel_id avec evaluated et successful
 */
/**
 * Route de synthèse par panel ERC (pour les cards)
 * Retourne les données agrégées par panel avec structure imbriquée evaluated/successful
 */
router.route("/european-projects/erc/synthesis-by-panel").get(async (req, res) => {
  const filters = {};

  if (req.query.call_year) {
    const years = req.query.call_year.split(",");
    filters.call_year = { $in: years };
  }
  if (req.query.destination_code) {
    const destinations = req.query.destination_code.split(",");
    filters.destination_code = { $in: destinations };
  }
  if (req.query.framework) {
    filters.framework = req.query.framework;
  }
  if (req.query.country_code) {
    filters.country_code = req.query.country_code.toUpperCase();
  }

  const data = await db
    .collection(collection_erc_projects_synthese)
    .aggregate([
      { $match: filters },
      {
        $group: {
          _id: {
            panel_id: "$panel_id",
            panel_name: "$panel_name",
            panel_lib: "$panel_lib",
            domaine_scientifique: "$domaine_scientifique",
            domaine_name_scientifique: "$domaine_name_scientifique",
            stage: "$stage",
          },
          total_funding_entity: { $sum: "$funding_entity" },
          total_involved: { $sum: "$number_involved" },
          total_pi: { $sum: { $cond: [{ $eq: ["$role_entity", "PI"] }, "$number_involved", 0] } },
        },
      },
      {
        $project: {
          _id: 0,
          panel_id: "$_id.panel_id",
          panel_name: "$_id.panel_name",
          panel_lib: "$_id.panel_lib",
          domaine_scientifique: "$_id.domaine_scientifique",
          domaine_name_scientifique: "$_id.domaine_name_scientifique",
          stage: "$_id.stage",
          total_funding_entity: 1,
          total_involved: 1,
          total_pi: 1,
        },
      },
      { $sort: { domaine_scientifique: 1, panel_id: 1, stage: 1 } },
    ])
    .toArray();

  // Restructurer les données par panel (pour les cards)
  const panels = {};
  data.forEach((item) => {
    if (!panels[item.panel_id]) {
      panels[item.panel_id] = {
        panel_id: item.panel_id,
        panel_name: item.panel_name,
        panel_lib: item.panel_lib,
        domaine_scientifique: item.domaine_scientifique,
        domaine_name_scientifique: item.domaine_name_scientifique,
        evaluated: null,
        successful: null,
      };
    }
    panels[item.panel_id][item.stage] = {
      total_funding_entity: item.total_funding_entity,
      total_involved: item.total_involved,
      total_pi: item.total_pi,
    };
  });

  res.json(Object.values(panels));
});

/**
 * Route de financement par panel ERC (pour le graphique)
 * Retourne les données avec destination_code pour le scatter plot
 */
router.route("/european-projects/erc/panel-funding").get(async (req, res) => {
  const filters = {};

  if (req.query.call_year) {
    const years = req.query.call_year.split(",");
    filters.call_year = { $in: years };
  }
  if (req.query.destination_code) {
    const destinations = req.query.destination_code.split(",");
    filters.destination_code = { $in: destinations };
  }
  if (req.query.framework) {
    filters.framework = req.query.framework;
  }
  if (req.query.country_code) {
    filters.country_code = req.query.country_code.toUpperCase();
  }
  if (req.query.stage) {
    filters.stage = req.query.stage;
  }

  const data = await db
    .collection(collection_erc_projects_synthese)
    .aggregate([
      { $match: filters },
      {
        $group: {
          _id: {
            panel_id: "$panel_id",
            panel_name: "$panel_name",
            panel_lib: "$panel_lib",
            domaine_scientifique: "$domaine_scientifique",
            domaine_name_scientifique: "$domaine_name_scientifique",
            destination_code: "$destination_code",
            destination_name_en: "$destination_name_en",
          },
          total_funding_entity: { $sum: "$funding_entity" },
          total_involved: { $sum: "$number_involved" },
          total_pi: { $sum: { $cond: [{ $eq: ["$role_entity", "PI"] }, "$number_involved", 0] } },
        },
      },
      {
        $project: {
          _id: 0,
          panel_id: "$_id.panel_id",
          panel_name: "$_id.panel_name",
          panel_lib: "$_id.panel_lib",
          domaine_scientifique: "$_id.domaine_scientifique",
          domaine_name_scientifique: "$_id.domaine_name_scientifique",
          destination_code: "$_id.destination_code",
          destination_name_en: "$_id.destination_name_en",
          total_funding_entity: 1,
          total_involved: 1,
          total_pi: 1,
        },
      },
      { $sort: { domaine_scientifique: 1, panel_id: 1, destination_code: 1 } },
    ])
    .toArray();

  res.json(data);
});

/**
 * Route d'évolution temporelle ERC
 * Retourne les données agrégées par année et type de financement
 * Inclut les données du pays sélectionné ET les totaux globaux pour calculer les poids
 */
router.route("/european-projects/erc/evolution").get(async (req, res) => {
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
        total_funding_project: { $sum: "$funding_project" },
        total_involved: { $sum: "$number_involved" },
        total_pi: { $sum: { $cond: [{ $eq: ["$role_entity", "PI"] }, "$number_involved", 0] } },
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
        total_pi: 1,
      },
    },
    { $sort: { call_year: 1, destination_code: 1 } },
  ];

  // Données pour le pays sélectionné
  const [countrySuccessful, countryEvaluated] = await Promise.all([
    db.collection(collection_erc_projects_synthese).aggregate(aggregationPipeline(countryFilters, "successful")).toArray(),
    db.collection(collection_erc_projects_synthese).aggregate(aggregationPipeline(countryFilters, "evaluated")).toArray(),
  ]);

  // Données globales (tous pays) pour calculer les poids
  const [totalSuccessful, totalEvaluated] = await Promise.all([
    db.collection(collection_erc_projects_synthese).aggregate(aggregationPipeline(baseFilters, "successful")).toArray(),
    db.collection(collection_erc_projects_synthese).aggregate(aggregationPipeline(baseFilters, "evaluated")).toArray(),
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
 * Route d'évolution temporelle ERC par domaine scientifique (LS, PE, SH)
 * Retourne les données agrégées par année et domaine scientifique
 * Inclut les données du pays sélectionné ET les totaux globaux pour calculer les poids
 */
router.route("/european-projects/erc/evolution-by-domain").get(async (req, res) => {
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
    { $match: { ...filters, stage } },
    {
      $group: {
        _id: {
          call_year: "$call_year",
          domaine_scientifique: "$domaine_scientifique",
          domaine_name_scientifique: "$domaine_name_scientifique",
        },
        total_funding_project: { $sum: "$funding_project" },
        total_involved: { $sum: "$number_involved" },
        total_pi: { $sum: { $cond: [{ $eq: ["$role_entity", "PI"] }, "$number_involved", 0] } },
      },
    },
    {
      $project: {
        _id: 0,
        call_year: "$_id.call_year",
        domaine_scientifique: "$_id.domaine_scientifique",
        domaine_name_scientifique: "$_id.domaine_name_scientifique",
        total_funding_project: 1,
        total_involved: 1,
        total_pi: 1,
      },
    },
    { $sort: { call_year: 1, domaine_scientifique: 1 } },
  ];

  // Données pour le pays sélectionné
  const [countrySuccessful, countryEvaluated] = await Promise.all([
    db.collection(collection_erc_projects_synthese).aggregate(aggregationPipeline(countryFilters, "successful")).toArray(),
    db.collection(collection_erc_projects_synthese).aggregate(aggregationPipeline(countryFilters, "evaluated")).toArray(),
  ]);

  // Données globales (tous pays) pour calculer les poids
  const [totalSuccessful, totalEvaluated] = await Promise.all([
    db.collection(collection_erc_projects_synthese).aggregate(aggregationPipeline(baseFilters, "successful")).toArray(),
    db.collection(collection_erc_projects_synthese).aggregate(aggregationPipeline(baseFilters, "evaluated")).toArray(),
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
 * Route d'évolution temporelle ERC par panel
 * Retourne les données agrégées par année et panel_id
 * Inclut les données du pays sélectionné ET les totaux globaux pour calculer les poids
 */
router.route("/european-projects/erc/evolution-by-panel").get(async (req, res) => {
  const baseFilters = {};
  const countryFilters = {};

  if (req.query.destination_code) {
    const destinations = req.query.destination_code.split(",");
    baseFilters.destination_code = { $in: destinations };
    countryFilters.destination_code = { $in: destinations };
  }
  if (req.query.domaine_scientifique) {
    baseFilters.domaine_scientifique = req.query.domaine_scientifique;
    countryFilters.domaine_scientifique = req.query.domaine_scientifique;
  }
  if (req.query.framework) {
    baseFilters.framework = req.query.framework;
    countryFilters.framework = req.query.framework;
  }
  if (req.query.country_code) {
    countryFilters.country_code = req.query.country_code.toUpperCase();
  }

  // Agrégation par panel
  const aggregationPipeline = (filters, stage) => [
    { $match: { ...filters, stage } },
    {
      $group: {
        _id: {
          call_year: "$call_year",
          panel_id: "$panel_id",
          panel_name: "$panel_name",
          panel_lib: "$panel_lib",
          domaine_scientifique: "$domaine_scientifique",
          domaine_name_scientifique: "$domaine_name_scientifique",
        },
        total_funding_project: { $sum: "$funding_project" },
        total_funding_entity: { $sum: "$funding_entity" },
        total_involved: { $sum: "$number_involved" },
        total_pi: { $sum: { $cond: [{ $eq: ["$role_entity", "PI"] }, "$number_involved", 0] } },
      },
    },
    {
      $project: {
        _id: 0,
        call_year: "$_id.call_year",
        panel_id: "$_id.panel_id",
        panel_name: "$_id.panel_name",
        panel_lib: "$_id.panel_lib",
        domaine_scientifique: "$_id.domaine_scientifique",
        domaine_name_scientifique: "$_id.domaine_name_scientifique",
        total_funding_project: 1,
        total_funding_entity: 1,
        total_involved: 1,
        total_pi: 1,
      },
    },
    { $sort: { call_year: 1, domaine_scientifique: 1, panel_id: 1 } },
  ];

  // Données pour le pays sélectionné
  const [countrySuccessful, countryEvaluated] = await Promise.all([
    db.collection(collection_erc_projects_synthese).aggregate(aggregationPipeline(countryFilters, "successful")).toArray(),
    db.collection(collection_erc_projects_synthese).aggregate(aggregationPipeline(countryFilters, "evaluated")).toArray(),
  ]);

  // Données globales (tous pays) pour calculer les poids
  const [totalSuccessful, totalEvaluated] = await Promise.all([
    db.collection(collection_erc_projects_synthese).aggregate(aggregationPipeline(baseFilters, "successful")).toArray(),
    db.collection(collection_erc_projects_synthese).aggregate(aggregationPipeline(baseFilters, "evaluated")).toArray(),
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
 * Route pour les principales entités ERC (top 10)
 * Retourne les 10 premières entités par financement ERC pour un pays donné
 * Paramètres : country_code (requis), destination_code (optionnel), call_year (optionnel)
 */
router.route("/european-projects/erc/main-entities").get(async (req, res) => {
  if (!req.query.country_code) {
    return res.status(400).json({ error: "Le code pays est requis" });
  }

  try {
    const filters = {
      country_code: req.query.country_code.toUpperCase(),
      thema_code: "ERC",
    };

    if (req.query.destination_code) {
      const destinations = req.query.destination_code.split(",");
      filters.destination_code = { $in: destinations };
    }
    if (req.query.call_year) {
      const years = req.query.call_year.split(",");
      filters.call_year = { $in: years };
    }
    const data = await db
      .collection(collection_projects_entities)
      .aggregate([
        { $match: filters },
        {
          $group: {
            _id: { name: "$entities_name", acronym: "$entities_acronym" },
            total_fund_eur: { $sum: "$fund_eur" },
          },
        },
        {
          $project: {
            _id: 0,
            name: "$_id.name",
            acronym: "$_id.acronym",
            total_fund_eur: 1,
          },
        },
        { $sort: { total_fund_eur: -1 } },
        ...(req.query.limit !== "all" ? [{ $limit: 10 }] : []),
      ])
      .toArray();

    const total = data.reduce((acc, el) => acc + el.total_fund_eur, 0);

    res.status(200).json({ total_fund_eur: total, list: data });
  } catch (error) {
    console.error("Error fetching ERC main entities:", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
});

/**
 * Route pour les principales entités ERC filtrées par domaine scientifique ou panel
 * Interroge la collection synthèse qui contient panel_id et domaine_scientifique
 */
router.route("/european-projects/erc/main-entities-by-domain").get(async (req, res) => {
  if (!req.query.country_code) {
    return res.status(400).json({ error: "Le code pays est requis" });
  }

  try {
    const filters = {
      country_code: req.query.country_code.toUpperCase(),
      stage: "successful",
    };

    if (req.query.call_year) {
      const years = req.query.call_year.split(",");
      filters.call_year = { $in: years };
    }
    if (req.query.panel_id) {
      const panels = req.query.panel_id.split(",");
      filters.panel_id = { $in: panels };
    } else if (req.query.domaine_scientifique) {
      filters.domaine_scientifique = req.query.domaine_scientifique.toUpperCase();
    }

    // Récup des project_id correspondants aux filtres
    const matchingProjectIds = await db.collection(collection_erc_projects_synthese).distinct("project_id", filters);

    if (!matchingProjectIds.length) {
      return res.status(200).json({ total_fund_eur: 0, list: [] });
    }

    // Agrégation des entités à partir de la collection des entités, filtrée par les project_id
    const data = await db
      .collection(collection_projects_entities)
      .aggregate([
        { $match: { project_id: { $in: matchingProjectIds }, country_code: filters.country_code, thema_code: "ERC" } },
        {
          $group: {
            _id: { name: "$entities_name", acronym: "$entities_acronym" },
            total_fund_eur: { $sum: "$fund_eur" },
          },
        },
        {
          $project: {
            _id: 0,
            name: "$_id.name",
            acronym: "$_id.acronym",
            total_fund_eur: 1,
          },
        },
        { $match: { name: { $ne: null } } },
        { $sort: { total_fund_eur: -1 } },
        ...(req.query.limit !== "all" ? [{ $limit: 10 }] : []),
      ])
      .toArray();

    const total = data.reduce((acc, el) => acc + el.total_fund_eur, 0);

    res.status(200).json({ total_fund_eur: total, list: data });
  } catch (error) {
    console.error("Error fetching ERC main entities by domain:", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
});

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
        {
          $group: {
            _id: {
              id: "$panel_id",
              name: "$panel_name",
              lib: "$panel_lib",
              domaine: "$domaine_scientifique",
              domaine_name: "$domaine_name_scientifique",
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

/**
 * Route genre ERC - évolution annuelle de la répartition par genre
 * Paramètres: country_code, destination_code, panel_id, domaine_scientifique
 */
router.route("/european-projects/erc/gender-evolution").get(async (req, res) => {
  if (!req.query.country_code) {
    return res.status(400).json({ error: "Le code pays est requis" });
  }

  try {
    const filters = {
      country_code: req.query.country_code.toUpperCase(),
      gender: { $in: ["female", "male", "non binary"] },
    };

    if (req.query.destination_code) {
      filters.destination_code = { $in: req.query.destination_code.split(",") };
    }
    if (req.query.panel_id) {
      filters.panel_code = { $in: req.query.panel_id.split(",") };
    } else if (req.query.domaine_scientifique) {
      filters.panel_regroupement_code = req.query.domaine_scientifique.toUpperCase();
    }

    const data = await db
      .collection(collection_persons)
      .aggregate([
        { $match: filters },
        {
          $group: {
            _id: {
              call_year: "$call_year",
              gender: "$gender",
            },
            count: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: "$_id.call_year",
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
            call_year: "$_id",
            genders: 1,
            total: 1,
          },
        },
        { $sort: { call_year: 1 } },
      ])
      .toArray();

    res.status(200).json({ years: data });
  } catch (error) {
    console.error("Error fetching ERC gender evolution:", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
});

/**
 * Route genre ERC - répartition par genre par domaine scientifique et panel
 * Paramètres: country_code, call_year, destination_code
 */
router.route("/european-projects/erc/gender-by-domain").get(async (req, res) => {
  if (!req.query.country_code) {
    return res.status(400).json({ error: "Le code pays est requis" });
  }

  try {
    const filters = {
      country_code: req.query.country_code.toUpperCase(),
      gender: { $in: ["female", "male", "non binary"] },
      panel_regroupement_code: { $in: ["LS", "PE", "SH"] },
    };

    if (req.query.call_year) {
      filters.call_year = { $in: req.query.call_year.split(",") };
    }
    if (req.query.destination_code) {
      filters.destination_code = { $in: req.query.destination_code.split(",") };
    }

    const groupBy = req.query.panel_id ? "panel_code" : req.query.domaine_scientifique ? "panel_code" : "panel_regroupement_code";
    const groupFilters = { ...filters };
    if (req.query.panel_id) {
      groupFilters.panel_code = { $in: req.query.panel_id.split(",") };
    } else if (req.query.domaine_scientifique) {
      groupFilters.panel_regroupement_code = req.query.domaine_scientifique.toUpperCase();
    }

    const data = await db
      .collection(collection_persons)
      .aggregate([
        { $match: groupFilters },
        {
          $group: {
            _id: {
              group: `$${groupBy}`,
              domain: "$panel_regroupement_code",
              gender: "$gender",
            },
            count: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: {
              group: "$_id.group",
              domain: "$_id.domain",
            },
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
            group: "$_id.group",
            domain: "$_id.domain",
            genders: 1,
            total: 1,
          },
        },
        { $sort: { group: 1 } },
      ])
      .toArray();

    res.status(200).json({ byGroup: data });
  } catch (error) {
    console.error("Error fetching ERC gender by domain:", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
});

export default router;
