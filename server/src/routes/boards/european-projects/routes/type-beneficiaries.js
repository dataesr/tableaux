import express from "express";
import { recreateIndex } from "../../../utils.js";
import { db } from "../../../../services/mongo.js";

const router = new express.Router();

const routesPrefix = "/european-projects/type-beneficiaries";

const collection_projects_entities = "european-projects_projects-entities_staging";

router.route(routesPrefix + "/top10-countries-by-type-of-beneficiaries").get(async (req, res) => {
  if (!req.query.country_code) {
    return res.status(400).json({ error: "Le code pays est requis" });
  }

  try {
    const filters = { framework: "Horizon Europe", country_code: req.query.country_code.toUpperCase() };

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
    if (req.query.years) {
      const years = req.query.years.split("|");
      filters.call_year = { $in: years };
    }

    const data = await db
      .collection(collection_projects_entities)
      .aggregate([
        {
          $match: filters,
        },
        {
          $group: {
            _id: {
              country_code: "$country_code",
              country_name_fr: "$country_name_fr",
              country_name_en: "$country_name_en",
              cordis_type_entity_code: "$cordis_type_entity_code",
            },
            total_fund_eur: { $sum: "$fund_eur" },
          },
        },
        {
          $group: {
            _id: "$_id.country_code",
            country_name_fr: { $first: "$_id.country_name_fr" },
            country_name_en: { $first: "$_id.country_name_en" },
            types: {
              $push: {
                cordis_type_entity_code: "$_id.cordis_type_entity_code",
                total_fund_eur: "$total_fund_eur",
              },
            },
            total_fund_eur: { $sum: "$total_fund_eur" },
          },
        },
        {
          $project: {
            _id: 0,
            country_code: "$_id",
            country_name_fr: 1,
            country_name_en: 1,
            types: {
              $map: {
                input: {
                  $sortArray: {
                    input: "$types",
                    sortBy: { cordis_type_entity_code: -1 },
                  },
                },
                as: "type",
                in: "$$type",
              },
            },
            total_fund_eur: 1,
          },
        },
        {
          $sort: { total_fund_eur: -1 },
        },
      ])
      .toArray();

    const total = data.reduce((acc, el) => acc + el.total_fund_eur, 0);

    res.status(200).json({
      total_fund_eur: total,
      data,
    });
  } catch (error) {
    console.error("Error fetching type by country:", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
});

// Route pour créer l'index pour top10-countries-by-type-of-beneficiaries
router.route(routesPrefix + "/top10-countries-by-type-of-beneficiaries_indexes").get(async (req, res) => {
  try {
    await recreateIndex(
      db.collection(collection_projects_entities),
      {
        // Champs de filtrage (ordre optimisé pour la sélectivité)
        framework: 1,
        pilier_code: 1,
        programme_code: 1,
        thema_code: 1,
        destination_code: 1,
        country_code: 1,
        cordis_type_entity_code: 1,
        fund_eur: 1,
        call_year: 1,
      },
      "idx_top10_countries_by_type_of_beneficiaries_covered",
    );

    res.status(201).json({
      message: "Index couvert pour top10-countries-by-type-of-beneficiaries créé avec succès",
      indexName: "idx_top10_countries_by_type_of_beneficiaries_covered",
    });
  } catch (error) {
    console.error("Erreur lors de la création de l'index couvert:", error);
    res.status(500).json({ error: "Erreur lors de la création de l'index couvert" });
  }
});

// Route pour l'évolution temporelle des types de bénéficiaires par pays
router.route(routesPrefix + "/type-beneficiaries-evolution").get(async (req, res) => {
  console.log("Fetching type beneficiaries evolution with filters:", req.query);

  if (!req.query.country_code) {
    return res.status(400).json({ error: "Le code pays est requis" });
  }

  if (!req.query.cordis_type_entity_code) {
    return res.status(400).json({ error: "Le code type d'entité CORDIS est requis" });
  }

  try {
    const filters = { framework: "Horizon Europe" };
    const targetCountry = req.query.country_code.toUpperCase();
    const targetEntityType = req.query.cordis_type_entity_code;

    // Ajouter les filtres optionnels
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
    if (req.query.years) {
      const years = req.query.years.split("|");
      filters.call_year = { $in: years };
    }

    // Ajouter le filtre pour le type d'entité
    filters.cordis_type_entity_code = targetEntityType;

    // Première étape : obtenir le top 10 des pays pour ce type d'entité
    const top10Countries = await db
      .collection(collection_projects_entities)
      .aggregate([
        {
          $match: filters,
        },
        {
          $group: {
            _id: {
              country_code: "$country_code",
              country_name_fr: "$country_name_fr",
              country_name_en: "$country_name_en",
            },
            total_fund_eur: { $sum: "$fund_eur" },
          },
        },
        {
          $project: {
            _id: 0,
            country_code: "$_id.country_code",
            country_name_fr: "$_id.country_name_fr",
            country_name_en: "$_id.country_name_en",
            total_fund_eur: 1,
          },
        },
        {
          $sort: { total_fund_eur: -1 },
        },
        {
          $limit: 10,
        },
      ])
      .toArray();

    // Vérifier si le pays cible est dans le top 10, sinon l'ajouter
    const targetCountryIndex = top10Countries.findIndex((item) => item.country_code === targetCountry);
    let selectedCountries = [...top10Countries];

    if (targetCountryIndex === -1) {
      // Le pays cible n'est pas dans le top 10, remplacer le 10ème
      const targetCountryData = await db
        .collection(collection_projects_entities)
        .aggregate([
          {
            $match: { ...filters, country_code: targetCountry },
          },
          {
            $group: {
              _id: {
                country_code: "$country_code",
                country_name_fr: "$country_name_fr",
                country_name_en: "$country_name_en",
              },
              total_fund_eur: { $sum: "$fund_eur" },
            },
          },
          {
            $project: {
              _id: 0,
              country_code: "$_id.country_code",
              country_name_fr: "$_id.country_name_fr",
              country_name_en: "$_id.country_name_en",
              total_fund_eur: 1,
            },
          },
        ])
        .toArray();

      if (targetCountryData.length > 0) {
        selectedCountries[9] = targetCountryData[0];
      } else {
        return res.status(404).json({ error: "Aucune donnée trouvée pour ce pays et ce type d'entité" });
      }
    }

    // Obtenir les codes des pays sélectionnés
    const selectedCountryCodes = selectedCountries.map((c) => c.country_code);

    // Créer les filtres pour l'évolution temporelle (sans le filtre des années)
    const evolutionFilters = {
      framework: "Horizon Europe",
      cordis_type_entity_code: targetEntityType,
      country_code: { $in: selectedCountryCodes },
    };

    // Ajouter les filtres optionnels (sans les années)
    if (req.query.pillars) {
      const pillars = req.query.pillars.split("|");
      evolutionFilters.pilier_code = { $in: pillars };
    }
    if (req.query.programs) {
      const programs = req.query.programs.split("|");
      evolutionFilters.programme_code = { $in: programs };
    }
    if (req.query.thematics) {
      const thematics = req.query.thematics.split(",");
      const filteredThematics = thematics.filter((thematic) => !["ERC", "MSCA"].includes(thematic));
      evolutionFilters.thema_code = { $in: filteredThematics };
    }
    if (req.query.destinations) {
      const destinations = req.query.destinations.split(",");
      evolutionFilters.destination_code = { $in: destinations };
    }

    // Deuxième étape : obtenir l'évolution temporelle pour ces pays
    const evolutionData = await db
      .collection(collection_projects_entities)
      .aggregate([
        {
          $match: evolutionFilters,
        },
        {
          $group: {
            _id: {
              country_code: "$country_code",
              country_name_fr: "$country_name_fr",
              country_name_en: "$country_name_en",
              call_year: "$call_year",
            },
            total_fund_eur: { $sum: "$fund_eur" },
          },
        },
        {
          $group: {
            _id: "$_id.country_code",
            country_name_fr: { $first: "$_id.country_name_fr" },
            country_name_en: { $first: "$_id.country_name_en" },
            evolution: {
              $push: {
                year: "$_id.call_year",
                total_fund_eur: "$total_fund_eur",
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            country_code: "$_id",
            country_name_fr: 1,
            country_name_en: 1,
            evolution: {
              $sortArray: {
                input: "$evolution",
                sortBy: { year: 1 },
              },
            },
          },
        },
        {
          $sort: { country_code: 1 },
        },
      ])
      .toArray();

    // Obtenir la liste des années disponibles
    let yearsList;
    if (req.query.years) {
      // Si des années spécifiques sont filtrées, utiliser ces années
      yearsList = req.query.years
        .split("|")
        .map((year) => parseInt(year))
        .filter((year) => !isNaN(year))
        .sort((a, b) => a - b);
    } else {
      // Sinon, récupérer toutes les années disponibles
      const allYears = await db
        .collection(collection_projects_entities)
        .aggregate([
          {
            $match: {
              framework: "Horizon Europe",
              cordis_type_entity_code: targetEntityType,
              ...(req.query.pillars && { pilier_code: { $in: req.query.pillars.split("|") } }),
              ...(req.query.programs && { programme_code: { $in: req.query.programs.split("|") } }),
              ...(req.query.thematics && {
                thema_code: { $in: req.query.thematics.split(",").filter((thematic) => !["ERC", "MSCA"].includes(thematic)) },
              }),
              ...(req.query.destinations && { destination_code: { $in: req.query.destinations.split(",") } }),
            },
          },
          {
            $group: {
              _id: "$call_year",
            },
          },
          {
            $sort: { _id: 1 },
          },
        ])
        .toArray();

      yearsList = allYears.map((y) => y._id).filter((year) => year != null);
    }

    // Compléter les données manquantes avec 0 pour chaque pays et filtrer par années sélectionnées
    const completeData = evolutionData.map((country) => {
      const existingYears = country.evolution.map((e) => e.year);
      const completeEvolution = yearsList.map((year) => {
        const existingData = country.evolution.find((e) => e.year === year || e.year === year.toString() || e.year === parseInt(year));
        return {
          year,
          total_fund_eur: existingData ? existingData.total_fund_eur : 0,
        };
      });

      // Filtrer l'évolution pour ne garder que les années sélectionnées
      const filteredEvolution = req.query.years
        ? completeEvolution.filter((item) => {
            const selectedYears = req.query.years.split("|").map((y) => parseInt(y));
            return selectedYears.includes(parseInt(item.year));
          })
        : completeEvolution;

      return {
        ...country,
        evolution: filteredEvolution,
      };
    });

    res.status(200).json({
      years: yearsList,
      countries: completeData,
      entity_type: targetEntityType,
    });
  } catch (error) {
    console.error("Error fetching type beneficiaries evolution:", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
});

// Route pour créer l'index pour type-beneficiaries-evolution
router.route(routesPrefix + "/type-beneficiaries-evolution_indexes").get(async (req, res) => {
  try {
    await recreateIndex(
      db.collection(collection_projects_entities),
      {
        // Champs de filtrage (ordre optimisé pour la sélectivité)
        framework: 1,
        cordis_type_entity_code: 1,
        pilier_code: 1,
        programme_code: 1,
        thema_code: 1,
        destination_code: 1,
        country_code: 1,
        call_year: 1,
        fund_eur: 1,
      },
      "idx_type_beneficiaries_evolution_covered",
    );

    res.status(201).json({
      message: "Index couvert pour type-beneficiaries-evolution créé avec succès",
      indexName: "idx_type_beneficiaries_evolution_covered",
    });
  } catch (error) {
    console.error("Erreur lors de la création de l'index couvert:", error);
    res.status(500).json({ error: "Erreur lors de la création de l'index couvert" });
  }
});

export default router;
