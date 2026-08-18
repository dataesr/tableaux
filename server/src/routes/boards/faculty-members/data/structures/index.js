import { Router } from "express";
import { db } from "../../../../../services/mongo.js";

const router = Router();
const COLLECTION = "faculty-members";

const VALID_VIEWS = ["structure", "discipline", "region", "academie"];

function buildMatchStage(view, id, year) {
  const match = {};
  if (year) match.annee_universitaire = year;
  if (!id) return match;

  switch (view) {
    case "structure":
      match.etablissement_id_paysage = id;
      break;
    case "discipline":
      match.code_grande_discipline = id;
      break;
    case "region":
      match.etablissement_code_region = id;
      break;
    case "academie":
      match.etablissement_code_academie = id;
      break;
  }
  return match;
}

async function getContextInfo(collection, view, id) {
  if (!id) return null;

  const fieldMap = {
    structure: "etablissement_id_paysage",
    discipline: "code_grande_discipline",
    region: "etablissement_code_region",
    academie: "etablissement_code_academie",
  };

  const doc = await collection.findOne(
    { [fieldMap[view]]: id },
    {
      projection: {
        etablissement_lib: 1,
        etablissement_actuel_lib: 1,
        etablissement_type: 1,
        etablissement_region: 1,
        etablissement_academie: 1,
        grande_discipline: 1,
      },
    }
  );
  if (!doc) return null;

  const base = {
    region: doc.etablissement_region,
    academie: doc.etablissement_academie,
    structure_type: doc.etablissement_type,
  };

  switch (view) {
    case "structure":
      return {
        ...base,
        id,
        name: doc.etablissement_actuel_lib || doc.etablissement_lib,
      };
    case "discipline":
      return { ...base, id, name: doc.grande_discipline || id };
    case "region":
      return { ...base, id, name: doc.etablissement_region || id };
    case "academie":
      return { ...base, id, name: doc.etablissement_academie || id };
    default:
      return null;
  }
}

router.get("/faculty-members/filters", async (req, res) => {
  try {
    const { type, year } = req.query;
    const collection = db.collection(COLLECTION);

    const configMap = {
      structures: {
        groupId: {
          id: "$etablissement_id_paysage",
          label: "$etablissement_lib",
        },
      },
      disciplines: {
        groupId: {
          id: "$code_grande_discipline",
          label: "$grande_discipline",
        },
      },
      regions: {
        groupId: {
          id: "$etablissement_code_region",
          label: "$etablissement_region",
        },
      },
      academies: {
        groupId: {
          id: "$etablissement_code_academie",
          label: "$etablissement_academie",
        },
      },
    };

    const config = configMap[type];
    if (!config) {
      return res.status(400).json({
        error:
          "Invalid type. Must be one of: " + Object.keys(configMap).join(", "),
      });
    }

    const pipeline = [];
    if (year) pipeline.push({ $match: { annee_universitaire: year } });
    pipeline.push(
      { $group: { _id: config.groupId, count: { $sum: "$effectif" } } },
      { $project: { _id: 0, id: "$_id.id", label: "$_id.label", count: 1 } },
      { $match: { id: { $ne: null }, label: { $ne: null } } },
      { $sort: { label: 1 } }
    );

    const items = await collection.aggregate(pipeline).toArray();

    res.json({ items });
  } catch (error) {
    console.error("Error fetching filters:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/faculty-members/years", async (req, res) => {
  try {
    const { view, id } = req.query;
    const collection = db.collection(COLLECTION);
    const match = buildMatchStage(view, id);

    const [allYears, completeYearAgg] = await Promise.all([
      collection
        .distinct("annee_universitaire", match)
        .then((y) => y.filter((v) => v != null).sort()),
      collection
        .aggregate([
          { $match: match },
          {
            $group: {
              _id: "$annee_universitaire",
              hasPermanent: {
                $max: { $cond: [{ $eq: ["$is_titulaire", true] }, 1, 0] },
              },
              hasNonPermanent: {
                $max: { $cond: [{ $ne: ["$is_titulaire", true] }, 1, 0] },
              },
            },
          },
          { $match: { hasPermanent: 1, hasNonPermanent: 1 } },
          { $sort: { _id: -1 } },
          { $limit: 1 },
        ])
        .toArray(),
    ]);

    const latestCompleteYear =
      completeYearAgg[0]?._id ?? allYears[allYears.length - 1] ?? null;
    res.json({ years: allYears, latestCompleteYear });
  } catch (error) {
    console.error("Error fetching years:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/faculty-members/dashboard", async (req, res) => {
  try {
    const { view, id, year } = req.query;
    if (!view || !VALID_VIEWS.includes(view)) {
      return res.status(400).json({ error: "Invalid or missing view param" });
    }
    const collection = db.collection(COLLECTION);
    const match = buildMatchStage(view, id, year);

    const [
      genderAgg,
      statusAgg,
      disciplineAgg,
      ageAgg,
      categoryAgg,
      establishmentTypeAgg,
      quotiteByGenderAgg,
      quotiteByAgeAgg,
      rankedItems,
      contextInfo,
    ] = await Promise.all([
      collection
        .aggregate([
          { $match: match },
          { $group: { _id: "$sexe", count: { $sum: "$effectif" } } },
        ])
        .toArray(),

      collection
        .aggregate([
          { $match: match },
          {
            $group: {
              _id: {
                status: {
                  $switch: {
                    branches: [
                      {
                        case: { $eq: ["$is_enseignant_chercheur", true] },
                        then: "enseignant_chercheur",
                      },
                      {
                        case: {
                          $and: [
                            { $eq: ["$is_titulaire", true] },
                            { $eq: ["$is_enseignant_chercheur", false] },
                          ],
                        },
                        then: "titulaire_non_chercheur",
                      },
                    ],
                    default: "non_titulaire",
                  },
                },
                gender: "$sexe",
              },
              count: { $sum: "$effectif" },
            },
          },
          {
            $group: {
              _id: "$_id.status",
              count: { $sum: "$count" },
              gender_breakdown: {
                $push: { gender: "$_id.gender", count: "$count" },
              },
            },
          },
        ])
        .toArray(),

      collection
        .aggregate([
          { $match: match },
          {
            $group: {
              _id: {
                code: "$code_grande_discipline",
                name: "$grande_discipline",
                gender: "$sexe",
              },
              count: { $sum: "$effectif" },
            },
          },
          {
            $group: {
              _id: { code: "$_id.code", name: "$_id.name" },
              total: { $sum: "$count" },
              gender_breakdown: {
                $push: { gender: "$_id.gender", count: "$count" },
              },
            },
          },
          { $sort: { total: -1 } },
        ])
        .toArray(),

      collection
        .aggregate([
          { $match: match },
          {
            $group: {
              _id: { age_class: "$classe_age3", gender: "$sexe" },
              count: { $sum: "$effectif" },
            },
          },
          {
            $group: {
              _id: "$_id.age_class",
              total: { $sum: "$count" },
              gender_breakdown: {
                $push: { gender: "$_id.gender", count: "$count" },
              },
            },
          },
          { $sort: { _id: 1 } },
        ])
        .toArray(),

      collection
        .aggregate([
          { $match: match },
          {
            $group: {
              _id: { category: "$categorie_assimilation", gender: "$sexe" },
              count: { $sum: "$effectif" },
            },
          },
          {
            $group: {
              _id: "$_id.category",
              total: { $sum: "$count" },
              gender_breakdown: {
                $push: { gender: "$_id.gender", count: "$count" },
              },
            },
          },
          { $match: { _id: { $ne: null } } },
          { $sort: { total: -1 } },
        ])
        .toArray(),

      collection
        .aggregate([
          { $match: match },
          {
            $group: {
              _id: "$etablissement_type",
              total_count: { $sum: "$effectif" },
            },
          },
          { $match: { _id: { $ne: null } } },
          { $sort: { total_count: -1 } },
        ])
        .toArray(),

      collection
        .aggregate([
          { $match: match },
          {
            $group: {
              _id: { quotite: "$quotite", gender: "$sexe" },
              count: { $sum: "$effectif" },
            },
          },
          {
            $group: {
              _id: "$_id.gender",
              total: { $sum: "$count" },
              quotite_breakdown: {
                $push: { quotite: "$_id.quotite", count: "$count" },
              },
            },
          },
          { $match: { _id: { $ne: null } } },
        ])
        .toArray(),

      collection
        .aggregate([
          { $match: match },
          {
            $group: {
              _id: {
                age: "$classe_age3",
                gender: "$sexe",
                quotite: "$quotite",
              },
              count: { $sum: "$effectif" },
            },
          },
          {
            $group: {
              _id: { age: "$_id.age", gender: "$_id.gender" },
              total: { $sum: "$count" },
              quotite_breakdown: {
                $push: { quotite: "$_id.quotite", count: "$count" },
              },
            },
          },
          {
            $group: {
              _id: "$_id.age",
              total: { $sum: "$total" },
              by_gender: {
                $push: {
                  gender: "$_id.gender",
                  total: "$total",
                  quotite_breakdown: "$quotite_breakdown",
                },
              },
            },
          },
          { $match: { _id: { $ne: null } } },
          { $sort: { _id: 1 } },
        ])
        .toArray(),

      (() => {
        const topGroupConfig = {
          structure: {
            id: "$etablissement_id_paysage",
            label: "$etablissement_lib",
          },
          discipline: {
            id: "$code_grande_discipline",
            label: "$grande_discipline",
          },
          region: {
            id: "$etablissement_code_region",
            label: "$etablissement_region",
          },
          academie: {
            id: "$etablissement_code_academie",
            label: "$etablissement_academie",
          },
        };
        const topGroup = topGroupConfig[view];
        const yearMatch = year ? { annee_universitaire: year } : {};
        return collection
          .aggregate([
            { $match: yearMatch },
            {
              $group: {
                _id: { id: topGroup.id, label: topGroup.label },
                total: { $sum: "$effectif" },
              },
            },
            { $sort: { total: -1 } },
          ])
          .toArray();
      })(),

      getContextInfo(collection, view, id),
    ]);

    const total_count = genderAgg.reduce((s, g) => s + g.count, 0);

    // Voisinage par effectif : fenêtre de 5 entités centrée sur l'entité courante.
    let neighbors = [];
    const currentIndex = rankedItems.findIndex(
      (r) => String(r._id?.id) === String(id)
    );
    if (currentIndex >= 0) {
      const n = rankedItems.length;
      let start = Math.max(0, currentIndex - 2);
      const end = Math.min(n, start + 5);
      start = Math.max(0, end - 5);
      neighbors = rankedItems.slice(start, end).map((r) => ({
        id: r._id?.id,
        label: r._id?.label,
        total: r.total,
        is_current: String(r._id?.id) === String(id),
      }));
    }

    res.json({
      context_info: contextInfo,
      total_count,
      gender_distribution: genderAgg,
      status_distribution: statusAgg,
      discipline_distribution: disciplineAgg,
      age_distribution: ageAgg,
      category_distribution: categoryAgg,
      establishment_type_distribution: establishmentTypeAgg,
      quotite_by_gender: quotiteByGenderAgg,
      quotite_by_age: quotiteByAgeAgg,
      neighbors,
    });
  } catch (error) {
    console.error("Error fetching dashboard:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/faculty-members/evolution", async (req, res) => {
  try {
    const { view, id } = req.query;
    const collection = db.collection(COLLECTION);
    const match = buildMatchStage(view, id);

    const [
      globalEvolution,
      statusEvolution,
      ageEvolution,
      categoryEvolution,
      disciplineEvolution,
      quotiteEvolution,
      contextInfo,
    ] = await Promise.all([
      collection
        .aggregate([
          { $match: match },
          {
            $group: {
              _id: { year: "$annee_universitaire", gender: "$sexe" },
              count: { $sum: "$effectif" },
            },
          },
          {
            $group: {
              _id: "$_id.year",
              total: { $sum: "$count" },
              gender_breakdown: {
                $push: { gender: "$_id.gender", count: "$count" },
              },
            },
          },
          { $sort: { _id: 1 } },
        ])
        .toArray(),

      collection
        .aggregate([
          { $match: match },
          {
            $group: {
              _id: {
                year: "$annee_universitaire",
                status: {
                  $switch: {
                    branches: [
                      {
                        case: { $eq: ["$is_enseignant_chercheur", true] },
                        then: "enseignant_chercheur",
                      },
                      {
                        case: {
                          $and: [
                            { $eq: ["$is_titulaire", true] },
                            { $eq: ["$is_enseignant_chercheur", false] },
                          ],
                        },
                        then: "titulaire_non_chercheur",
                      },
                    ],
                    default: "non_titulaire",
                  },
                },
              },
              count: { $sum: "$effectif" },
            },
          },
          {
            $group: {
              _id: "$_id.year",
              total: { $sum: "$count" },
              status_breakdown: {
                $push: { status: "$_id.status", count: "$count" },
              },
            },
          },
          { $sort: { _id: 1 } },
        ])
        .toArray(),

      collection
        .aggregate([
          { $match: match },
          {
            $group: {
              _id: {
                year: "$annee_universitaire",
                age_class: "$classe_age3",
              },
              count: { $sum: "$effectif" },
            },
          },
          {
            $group: {
              _id: "$_id.year",
              total: { $sum: "$count" },
              age_breakdown: {
                $push: { age_class: "$_id.age_class", count: "$count" },
              },
            },
          },
          { $sort: { _id: 1 } },
        ])
        .toArray(),

      collection
        .aggregate([
          { $match: match },
          {
            $group: {
              _id: {
                year: "$annee_universitaire",
                category: "$categorie_personnels",
              },
              count: { $sum: "$effectif" },
            },
          },
          {
            $group: {
              _id: "$_id.year",
              total: { $sum: "$count" },
              category_breakdown: {
                $push: { category: "$_id.category", count: "$count" },
              },
            },
          },
          { $sort: { _id: 1 } },
        ])
        .toArray(),

      collection
        .aggregate([
          { $match: match },
          {
            $group: {
              _id: {
                year: "$annee_universitaire",
                code: "$code_grande_discipline",
                name: "$grande_discipline",
              },
              count: { $sum: "$effectif" },
            },
          },
          {
            $group: {
              _id: { code: "$_id.code", name: "$_id.name" },
              total: { $sum: "$count" },
              yearly: {
                $push: { year: "$_id.year", count: "$count" },
              },
            },
          },
          { $sort: { total: -1 } },
        ])
        .toArray(),

      collection
        .aggregate([
          { $match: match },
          {
            $group: {
              _id: { year: "$annee_universitaire", quotite: "$quotite" },
              count: { $sum: "$effectif" },
            },
          },
          {
            $group: {
              _id: "$_id.year",
              total: { $sum: "$count" },
              quotite_breakdown: {
                $push: { quotite: "$_id.quotite", count: "$count" },
              },
            },
          },
          { $sort: { _id: 1 } },
        ])
        .toArray(),

      getContextInfo(collection, view, id),
    ]);

    res.json({
      context_info: contextInfo,
      global_evolution: globalEvolution,
      status_evolution: statusEvolution,
      age_evolution: ageEvolution,
      category_evolution: categoryEvolution,
      discipline_evolution: disciplineEvolution,
      quotite_evolution: quotiteEvolution,
    });
  } catch (error) {
    console.error("Error fetching evolution:", error);
    res.status(500).json({ error: "Server error" });
  }
});

async function buildQuotiteData(collection, match, matchAllYears) {
  const [quotiteByCategory, quotiteEvolution] = await Promise.all([
    collection
      .aggregate([
        { $match: match },
        {
          $group: {
            _id: {
              category_code: "$code_categorie_assimil",
              category_name: "$categorie_assimilation",
              quotite: "$quotite",
            },
            count: { $sum: "$effectif" },
          },
        },
        {
          $group: {
            _id: {
              category_code: "$_id.category_code",
              category_name: "$_id.category_name",
            },
            totalCount: { $sum: "$count" },
            quotite_breakdown: {
              $push: { quotite: "$_id.quotite", count: "$count" },
            },
          },
        },
        { $sort: { totalCount: -1 } },
      ])
      .toArray(),

    collection
      .aggregate([
        { $match: matchAllYears },
        {
          $group: {
            _id: {
              year: "$annee_universitaire",
              quotite: "$quotite",
              gender: "$sexe",
            },
            count: { $sum: "$effectif" },
          },
        },
        {
          $group: {
            _id: "$_id.year",
            total: { $sum: "$count" },
            quotite_breakdown: {
              $push: {
                quotite: "$_id.quotite",
                gender: "$_id.gender",
                count: "$count",
              },
            },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray(),
  ]);

  return { quotiteByCategory, quotiteEvolution };
}

router.get("/faculty-members/research-teachers", async (req, res) => {
  try {
    const { view, id, year } = req.query;
    if (!view || !VALID_VIEWS.includes(view)) {
      return res.status(400).json({ error: "Invalid or missing view param" });
    }
    const collection = db.collection(COLLECTION);
    const match = {
      ...buildMatchStage(view, id, year),
      is_enseignant_chercheur: true,
    };
    const matchAllYears = {
      ...buildMatchStage(view, id),
      is_enseignant_chercheur: true,
    };

    const ageClasses = [
      "35 ans et moins",
      "36 à 55 ans",
      "56 ans et plus",
      "Non précisé",
    ];

    const [
      cnuData,
      categoryDistribution,
      categoryAssimilEvolution,
      categoryAgeEvolution,
      categoryEvolution,
      genderEvolution,
      ageDistribution,
      cnuGroupEvolution,
      cnuSectionEvolution,
      contextInfo,
    ] = await Promise.all([
      collection
        .aggregate([
          { $match: match },
          {
            $group: {
              _id: {
                group_code: "$code_groupe_cnu",
                group_name: "$groupe_cnu",
                section_code: "$code_section_cnu",
                section_name: "$section_cnu",
                gender: "$sexe",
                age_class: "$classe_age3",
                category_name: "$categorie_assimilation",
              },
              count: { $sum: "$effectif" },
            },
          },
          {
            $group: {
              _id: {
                group_code: "$_id.group_code",
                group_name: "$_id.group_name",
                section_code: "$_id.section_code",
                section_name: "$_id.section_name",
                age_class: "$_id.age_class",
              },
              maleCount: {
                $sum: {
                  $cond: [{ $eq: ["$_id.gender", "Masculin"] }, "$count", 0],
                },
              },
              femaleCount: {
                $sum: {
                  $cond: [{ $eq: ["$_id.gender", "Féminin"] }, "$count", 0],
                },
              },
              totalCount: { $sum: "$count" },
              categories: {
                $push: {
                  categoryName: "$_id.category_name",
                  count: "$count",
                },
              },
            },
          },
          {
            $group: {
              _id: {
                group_code: "$_id.group_code",
                group_name: "$_id.group_name",
                section_code: "$_id.section_code",
                section_name: "$_id.section_name",
              },
              maleCount: { $sum: "$maleCount" },
              femaleCount: { $sum: "$femaleCount" },
              totalCount: { $sum: "$totalCount" },
              ageDistribution: {
                $push: {
                  ageClass: "$_id.age_class",
                  count: "$totalCount",
                },
              },
              categories: { $push: "$categories" },
            },
          },
          {
            $addFields: {
              categories: {
                $reduce: {
                  input: "$categories",
                  initialValue: [],
                  in: { $concatArrays: ["$$value", "$$this"] },
                },
              },
            },
          },
          {
            $addFields: {
              categories: {
                $filter: {
                  input: {
                    $map: {
                      input: {
                        $setUnion: [
                          {
                            $map: {
                              input: "$categories",
                              as: "cat",
                              in: "$$cat.categoryName",
                            },
                          },
                        ],
                      },
                      as: "catName",
                      in: {
                        categoryName: "$$catName",
                        count: {
                          $sum: {
                            $map: {
                              input: {
                                $filter: {
                                  input: "$categories",
                                  as: "cat",
                                  cond: {
                                    $eq: ["$$cat.categoryName", "$$catName"],
                                  },
                                },
                              },
                              as: "fcat",
                              in: "$$fcat.count",
                            },
                          },
                        },
                      },
                    },
                  },
                  as: "cat",
                  cond: { $ne: ["$$cat.categoryName", null] },
                },
              },
            },
          },
          {
            $group: {
              _id: {
                group_code: "$_id.group_code",
                group_name: "$_id.group_name",
              },
              groupTotal: { $sum: "$totalCount" },
              maleCount: { $sum: "$maleCount" },
              femaleCount: { $sum: "$femaleCount" },
              sections: {
                $push: {
                  sectionCode: "$_id.section_code",
                  sectionName: "$_id.section_name",
                  totalCount: "$totalCount",
                  maleCount: "$maleCount",
                  femaleCount: "$femaleCount",
                  ageDistribution: "$ageDistribution",
                  categories: "$categories",
                },
              },
              groupCategories: { $push: "$categories" },
            },
          },
          {
            $addFields: {
              categories: {
                $filter: {
                  input: {
                    $map: {
                      input: {
                        $setUnion: [
                          {
                            $map: {
                              input: {
                                $reduce: {
                                  input: "$groupCategories",
                                  initialValue: [],
                                  in: {
                                    $concatArrays: ["$$value", "$$this"],
                                  },
                                },
                              },
                              as: "cat",
                              in: "$$cat.categoryName",
                            },
                          },
                        ],
                      },
                      as: "catName",
                      in: {
                        categoryName: "$$catName",
                        count: {
                          $sum: {
                            $map: {
                              input: {
                                $filter: {
                                  input: {
                                    $reduce: {
                                      input: "$groupCategories",
                                      initialValue: [],
                                      in: {
                                        $concatArrays: ["$$value", "$$this"],
                                      },
                                    },
                                  },
                                  as: "cat",
                                  cond: {
                                    $eq: ["$$cat.categoryName", "$$catName"],
                                  },
                                },
                              },
                              as: "fcat",
                              in: "$$fcat.count",
                            },
                          },
                        },
                      },
                    },
                  },
                  as: "cat",
                  cond: { $ne: ["$$cat.categoryName", null] },
                },
              },
            },
          },
          { $project: { groupCategories: 0 } },
          {
            $addFields: {
              ageDistribution: ageClasses.map((ageClass) => ({
                ageClass,
                count: {
                  $sum: {
                    $map: {
                      input: "$sections",
                      as: "section",
                      in: {
                        $sum: {
                          $map: {
                            input: {
                              $filter: {
                                input: "$$section.ageDistribution",
                                as: "age",
                                cond: { $eq: ["$$age.ageClass", ageClass] },
                              },
                            },
                            as: "filteredAge",
                            in: "$$filteredAge.count",
                          },
                        },
                      },
                    },
                  },
                },
                percent: {
                  $cond: {
                    if: { $gt: ["$groupTotal", 0] },
                    then: {
                      $multiply: [
                        {
                          $divide: [
                            {
                              $sum: {
                                $map: {
                                  input: "$sections",
                                  as: "section",
                                  in: {
                                    $sum: {
                                      $map: {
                                        input: {
                                          $filter: {
                                            input: "$$section.ageDistribution",
                                            as: "age",
                                            cond: {
                                              $eq: ["$$age.ageClass", ageClass],
                                            },
                                          },
                                        },
                                        as: "filteredAge",
                                        in: "$$filteredAge.count",
                                      },
                                    },
                                  },
                                },
                              },
                            },
                            "$groupTotal",
                          ],
                        },
                        100,
                      ],
                    },
                    else: 0,
                  },
                },
              })),
            },
          },
          { $sort: { groupTotal: -1 } },
        ])
        .toArray(),

      collection
        .aggregate([
          { $match: match },
          {
            $group: {
              _id: {
                category_code: "$code_categorie_assimil",
                category_name: "$categorie_assimilation",
                gender: "$sexe",
                age_class: "$classe_age3",
              },
              count: { $sum: "$effectif" },
            },
          },
          {
            $group: {
              _id: {
                category_code: "$_id.category_code",
                category_name: "$_id.category_name",
                age_class: "$_id.age_class",
              },
              totalCount: { $sum: "$count" },
              maleCount: {
                $sum: {
                  $cond: [{ $eq: ["$_id.gender", "Masculin"] }, "$count", 0],
                },
              },
              femaleCount: {
                $sum: {
                  $cond: [{ $eq: ["$_id.gender", "Féminin"] }, "$count", 0],
                },
              },
            },
          },
          {
            $group: {
              _id: {
                category_code: "$_id.category_code",
                category_name: "$_id.category_name",
              },
              totalCount: { $sum: "$totalCount" },
              maleCount: { $sum: "$maleCount" },
              femaleCount: { $sum: "$femaleCount" },
              ageDistribution: {
                $push: { ageClass: "$_id.age_class", count: "$totalCount" },
              },
            },
          },
          { $sort: { totalCount: -1 } },
        ])
        .toArray(),

      collection
        .aggregate([
          { $match: matchAllYears },
          {
            $group: {
              _id: {
                year: "$annee_universitaire",
                category_code: "$code_categorie_assimil",
                category_name: "$categorie_assimilation",
                gender: "$sexe",
              },
              count: { $sum: "$effectif" },
            },
          },
          {
            $group: {
              _id: {
                year: "$_id.year",
                category_code: "$_id.category_code",
                category_name: "$_id.category_name",
              },
              count: { $sum: "$count" },
              gender_breakdown: {
                $push: { gender: "$_id.gender", count: "$count" },
              },
            },
          },
          {
            $group: {
              _id: {
                category_code: "$_id.category_code",
                category_name: "$_id.category_name",
              },
              yearly: {
                $push: {
                  year: "$_id.year",
                  count: "$count",
                  gender_breakdown: "$gender_breakdown",
                },
              },
            },
          },
        ])
        .toArray(),

      collection
        .aggregate([
          { $match: matchAllYears },
          {
            $group: {
              _id: {
                year: "$annee_universitaire",
                category_code: "$code_categorie_assimil",
                category_name: "$categorie_assimilation",
                age_class: "$classe_age3",
              },
              count: { $sum: "$effectif" },
            },
          },
          {
            $group: {
              _id: {
                category_code: "$_id.category_code",
                category_name: "$_id.category_name",
                age_class: "$_id.age_class",
              },
              yearly: { $push: { year: "$_id.year", count: "$count" } },
            },
          },
          {
            $group: {
              _id: {
                category_code: "$_id.category_code",
                category_name: "$_id.category_name",
              },
              age_classes: {
                $push: { age_class: "$_id.age_class", yearly: "$yearly" },
              },
            },
          },
        ])
        .toArray(),

      collection
        .aggregate([
          { $match: matchAllYears },
          {
            $group: {
              _id: {
                year: "$annee_universitaire",
                category: "$categorie_personnels",
              },
              count: { $sum: "$effectif" },
            },
          },
          {
            $group: {
              _id: "$_id.year",
              total: { $sum: "$count" },
              category_breakdown: {
                $push: { category: "$_id.category", count: "$count" },
              },
            },
          },
          { $sort: { _id: 1 } },
        ])
        .toArray(),

      collection
        .aggregate([
          { $match: matchAllYears },
          {
            $group: {
              _id: { year: "$annee_universitaire", gender: "$sexe" },
              count: { $sum: "$effectif" },
            },
          },
          {
            $group: {
              _id: "$_id.year",
              total: { $sum: "$count" },
              gender_breakdown: {
                $push: { gender: "$_id.gender", count: "$count" },
              },
            },
          },
          { $sort: { _id: 1 } },
        ])
        .toArray(),

      collection
        .aggregate([
          { $match: match },
          {
            $group: {
              _id: { age_class: "$classe_age3", gender: "$sexe" },
              count: { $sum: "$effectif" },
            },
          },
          {
            $group: {
              _id: "$_id.age_class",
              total: { $sum: "$count" },
              gender_breakdown: {
                $push: { gender: "$_id.gender", count: "$count" },
              },
            },
          },
          { $sort: { _id: 1 } },
        ])
        .toArray(),

      collection
        .aggregate([
          { $match: matchAllYears },
          {
            $group: {
              _id: {
                year: "$annee_universitaire",
                group_code: "$code_groupe_cnu",
                group_name: "$groupe_cnu",
                gender: "$sexe",
                age_class: "$classe_age3",
              },
              count: { $sum: "$effectif" },
            },
          },
          {
            $group: {
              _id: {
                year: "$_id.year",
                group_code: "$_id.group_code",
                group_name: "$_id.group_name",
                age_class: "$_id.age_class",
              },
              total: { $sum: "$count" },
              gender_breakdown: {
                $push: { gender: "$_id.gender", count: "$count" },
              },
            },
          },
          {
            $group: {
              _id: {
                year: "$_id.year",
                group_code: "$_id.group_code",
                group_name: "$_id.group_name",
              },
              total: { $sum: "$total" },
              age_breakdown: {
                $push: { age_class: "$_id.age_class", count: "$total" },
              },
              gender_rows: { $push: "$gender_breakdown" },
            },
          },
          {
            $addFields: {
              gender_breakdown: {
                $map: {
                  input: ["Féminin", "Masculin"],
                  as: "g",
                  in: {
                    gender: "$$g",
                    count: {
                      $sum: {
                        $map: {
                          input: {
                            $reduce: {
                              input: "$gender_rows",
                              initialValue: [],
                              in: { $concatArrays: ["$$value", "$$this"] },
                            },
                          },
                          as: "row",
                          in: {
                            $cond: [
                              { $eq: ["$$row.gender", "$$g"] },
                              "$$row.count",
                              0,
                            ],
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          {
            $group: {
              _id: {
                group_code: "$_id.group_code",
                group_name: "$_id.group_name",
              },
              yearly: {
                $push: {
                  year: "$_id.year",
                  count: "$total",
                  gender_breakdown: "$gender_breakdown",
                  age_breakdown: "$age_breakdown",
                },
              },
            },
          },
        ])
        .toArray(),

      collection
        .aggregate([
          { $match: matchAllYears },
          {
            $group: {
              _id: {
                year: "$annee_universitaire",
                group_code: "$code_groupe_cnu",
                section_code: "$code_section_cnu",
                section_name: "$section_cnu",
                gender: "$sexe",
                age_class: "$classe_age3",
              },
              count: { $sum: "$effectif" },
            },
          },
          {
            $group: {
              _id: {
                year: "$_id.year",
                group_code: "$_id.group_code",
                section_code: "$_id.section_code",
                section_name: "$_id.section_name",
                age_class: "$_id.age_class",
              },
              total: { $sum: "$count" },
              gender_breakdown: {
                $push: { gender: "$_id.gender", count: "$count" },
              },
            },
          },
          {
            $group: {
              _id: {
                year: "$_id.year",
                group_code: "$_id.group_code",
                section_code: "$_id.section_code",
                section_name: "$_id.section_name",
              },
              total: { $sum: "$total" },
              age_breakdown: {
                $push: { age_class: "$_id.age_class", count: "$total" },
              },
              gender_rows: { $push: "$gender_breakdown" },
            },
          },
          {
            $addFields: {
              gender_breakdown: {
                $map: {
                  input: ["Féminin", "Masculin"],
                  as: "g",
                  in: {
                    gender: "$$g",
                    count: {
                      $sum: {
                        $map: {
                          input: {
                            $reduce: {
                              input: "$gender_rows",
                              initialValue: [],
                              in: { $concatArrays: ["$$value", "$$this"] },
                            },
                          },
                          as: "row",
                          in: {
                            $cond: [
                              { $eq: ["$$row.gender", "$$g"] },
                              "$$row.count",
                              0,
                            ],
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          {
            $group: {
              _id: {
                group_code: "$_id.group_code",
                section_code: "$_id.section_code",
                section_name: "$_id.section_name",
              },
              yearly: {
                $push: {
                  year: "$_id.year",
                  count: "$total",
                  gender_breakdown: "$gender_breakdown",
                  age_breakdown: "$age_breakdown",
                },
              },
            },
          },
        ])
        .toArray(),

      getContextInfo(collection, view, id),
    ]);

    res.json({
      context_info: contextInfo,
      cnuGroups: cnuData.map((group) => ({
        cnuGroupId: group._id.group_code,
        cnuGroupLabel: group._id.group_name,
        maleCount: group.maleCount,
        femaleCount: group.femaleCount,
        totalCount: group.groupTotal,
        ageDistribution: group.ageDistribution,
        categories: group.categories,
        cnuSections: group.sections.map((section) => ({
          cnuSectionId: section.sectionCode,
          cnuSectionLabel: section.sectionName,
          maleCount: section.maleCount,
          femaleCount: section.femaleCount,
          totalCount: section.totalCount,
          ageDistribution: ageClasses.map((ageClass) => ({
            ageClass,
            count:
              section.ageDistribution.find((a) => a.ageClass === ageClass)
                ?.count || 0,
          })),
          categories: section.categories,
        })),
      })),
      categoryDistribution: categoryDistribution.map((cat) => ({
        categoryCode: cat._id.category_code,
        categoryName: cat._id.category_name,
        maleCount: cat.maleCount,
        femaleCount: cat.femaleCount,
        totalCount: cat.totalCount,
        ageDistribution: ageClasses.map((ageClass) => ({
          ageClass,
          count:
            cat.ageDistribution?.find((a) => a.ageClass === ageClass)?.count ||
            0,
        })),
      })),
      categoryAssimilEvolution,
      categoryAgeEvolution,
      categoryEvolution,
      genderEvolution,
      ageDistribution,
      cnuGroupEvolution,
      cnuSectionEvolution,
      ...(await buildQuotiteData(collection, match, matchAllYears)),
    });
  } catch (error) {
    console.error("Error fetching research teachers:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/faculty-members/2nd-degree-teachers", async (req, res) => {
  try {
    const { view, id, year } = req.query;
    if (!view || !VALID_VIEWS.includes(view)) {
      return res.status(400).json({ error: "Invalid or missing view param" });
    }
    const collection = db.collection(COLLECTION);
    const match = {
      ...buildMatchStage(view, id, year),
      is_enseignant_chercheur: false,
      code_categorie_assimil: "AM2D",
    };
    const matchAllYears = {
      ...buildMatchStage(view, id),
      is_enseignant_chercheur: false,
      code_categorie_assimil: "AM2D",
    };

    const ageClasses = [
      "35 ans et moins",
      "36 à 55 ans",
      "56 ans et plus",
      "Non précisé",
    ];

    const [
      cnuData,
      categoryDistribution,
      categoryAssimilEvolution,
      categoryAgeEvolution,
      categoryEvolution,
      genderEvolution,
      ageDistribution,
      cnuGroupEvolution,
      cnuSectionEvolution,
      contextInfo,
    ] = await Promise.all([
      collection
        .aggregate([
          { $match: match },
          {
            $group: {
              _id: {
                group_code: "$code_groupe_cnu",
                group_name: "$groupe_cnu",
                section_code: "$code_section_cnu",
                section_name: "$section_cnu",
                gender: "$sexe",
                age_class: "$classe_age3",
                category_name: "$categorie_assimilation",
              },
              count: { $sum: "$effectif" },
            },
          },
          {
            $group: {
              _id: {
                group_code: "$_id.group_code",
                group_name: "$_id.group_name",
                section_code: "$_id.section_code",
                section_name: "$_id.section_name",
                age_class: "$_id.age_class",
              },
              maleCount: {
                $sum: {
                  $cond: [{ $eq: ["$_id.gender", "Masculin"] }, "$count", 0],
                },
              },
              femaleCount: {
                $sum: {
                  $cond: [{ $eq: ["$_id.gender", "Féminin"] }, "$count", 0],
                },
              },
              totalCount: { $sum: "$count" },
              categories: {
                $push: {
                  categoryName: "$_id.category_name",
                  count: "$count",
                },
              },
            },
          },
          {
            $group: {
              _id: {
                group_code: "$_id.group_code",
                group_name: "$_id.group_name",
                section_code: "$_id.section_code",
                section_name: "$_id.section_name",
              },
              maleCount: { $sum: "$maleCount" },
              femaleCount: { $sum: "$femaleCount" },
              totalCount: { $sum: "$totalCount" },
              ageDistribution: {
                $push: {
                  ageClass: "$_id.age_class",
                  count: "$totalCount",
                },
              },
              categories: { $push: "$categories" },
            },
          },
          {
            $addFields: {
              categories: {
                $reduce: {
                  input: "$categories",
                  initialValue: [],
                  in: { $concatArrays: ["$$value", "$$this"] },
                },
              },
            },
          },
          {
            $addFields: {
              categories: {
                $filter: {
                  input: {
                    $map: {
                      input: {
                        $setUnion: [
                          {
                            $map: {
                              input: "$categories",
                              as: "cat",
                              in: "$$cat.categoryName",
                            },
                          },
                        ],
                      },
                      as: "catName",
                      in: {
                        categoryName: "$$catName",
                        count: {
                          $sum: {
                            $map: {
                              input: {
                                $filter: {
                                  input: "$categories",
                                  as: "cat",
                                  cond: {
                                    $eq: ["$$cat.categoryName", "$$catName"],
                                  },
                                },
                              },
                              as: "fcat",
                              in: "$$fcat.count",
                            },
                          },
                        },
                      },
                    },
                  },
                  as: "cat",
                  cond: { $ne: ["$$cat.categoryName", null] },
                },
              },
            },
          },
          {
            $group: {
              _id: {
                group_code: "$_id.group_code",
                group_name: "$_id.group_name",
              },
              groupTotal: { $sum: "$totalCount" },
              maleCount: { $sum: "$maleCount" },
              femaleCount: { $sum: "$femaleCount" },
              sections: {
                $push: {
                  sectionCode: "$_id.section_code",
                  sectionName: "$_id.section_name",
                  totalCount: "$totalCount",
                  maleCount: "$maleCount",
                  femaleCount: "$femaleCount",
                  ageDistribution: "$ageDistribution",
                  categories: "$categories",
                },
              },
              groupCategories: { $push: "$categories" },
            },
          },
          {
            $addFields: {
              categories: {
                $filter: {
                  input: {
                    $map: {
                      input: {
                        $setUnion: [
                          {
                            $map: {
                              input: {
                                $reduce: {
                                  input: "$groupCategories",
                                  initialValue: [],
                                  in: {
                                    $concatArrays: ["$$value", "$$this"],
                                  },
                                },
                              },
                              as: "cat",
                              in: "$$cat.categoryName",
                            },
                          },
                        ],
                      },
                      as: "catName",
                      in: {
                        categoryName: "$$catName",
                        count: {
                          $sum: {
                            $map: {
                              input: {
                                $filter: {
                                  input: {
                                    $reduce: {
                                      input: "$groupCategories",
                                      initialValue: [],
                                      in: {
                                        $concatArrays: ["$$value", "$$this"],
                                      },
                                    },
                                  },
                                  as: "cat",
                                  cond: {
                                    $eq: ["$$cat.categoryName", "$$catName"],
                                  },
                                },
                              },
                              as: "fcat",
                              in: "$$fcat.count",
                            },
                          },
                        },
                      },
                    },
                  },
                  as: "cat",
                  cond: { $ne: ["$$cat.categoryName", null] },
                },
              },
            },
          },
          { $project: { groupCategories: 0 } },
          {
            $addFields: {
              ageDistribution: ageClasses.map((ageClass) => ({
                ageClass,
                count: {
                  $sum: {
                    $map: {
                      input: "$sections",
                      as: "section",
                      in: {
                        $sum: {
                          $map: {
                            input: {
                              $filter: {
                                input: "$$section.ageDistribution",
                                as: "age",
                                cond: { $eq: ["$$age.ageClass", ageClass] },
                              },
                            },
                            as: "filteredAge",
                            in: "$$filteredAge.count",
                          },
                        },
                      },
                    },
                  },
                },
                percent: {
                  $cond: {
                    if: { $gt: ["$groupTotal", 0] },
                    then: {
                      $multiply: [
                        {
                          $divide: [
                            {
                              $sum: {
                                $map: {
                                  input: "$sections",
                                  as: "section",
                                  in: {
                                    $sum: {
                                      $map: {
                                        input: {
                                          $filter: {
                                            input: "$$section.ageDistribution",
                                            as: "age",
                                            cond: {
                                              $eq: ["$$age.ageClass", ageClass],
                                            },
                                          },
                                        },
                                        as: "filteredAge",
                                        in: "$$filteredAge.count",
                                      },
                                    },
                                  },
                                },
                              },
                            },
                            "$groupTotal",
                          ],
                        },
                        100,
                      ],
                    },
                    else: 0,
                  },
                },
              })),
            },
          },
          { $sort: { groupTotal: -1 } },
        ])
        .toArray(),

      collection
        .aggregate([
          { $match: match },
          {
            $group: {
              _id: {
                category_code: "$code_categorie_assimil",
                category_name: "$categorie_assimilation",
                gender: "$sexe",
                age_class: "$classe_age3",
              },
              count: { $sum: "$effectif" },
            },
          },
          {
            $group: {
              _id: {
                category_code: "$_id.category_code",
                category_name: "$_id.category_name",
                age_class: "$_id.age_class",
              },
              totalCount: { $sum: "$count" },
              maleCount: {
                $sum: {
                  $cond: [{ $eq: ["$_id.gender", "Masculin"] }, "$count", 0],
                },
              },
              femaleCount: {
                $sum: {
                  $cond: [{ $eq: ["$_id.gender", "Féminin"] }, "$count", 0],
                },
              },
            },
          },
          {
            $group: {
              _id: {
                category_code: "$_id.category_code",
                category_name: "$_id.category_name",
              },
              totalCount: { $sum: "$totalCount" },
              maleCount: { $sum: "$maleCount" },
              femaleCount: { $sum: "$femaleCount" },
              ageDistribution: {
                $push: { ageClass: "$_id.age_class", count: "$totalCount" },
              },
            },
          },
          { $sort: { totalCount: -1 } },
        ])
        .toArray(),

      collection
        .aggregate([
          { $match: matchAllYears },
          {
            $group: {
              _id: {
                year: "$annee_universitaire",
                category_code: "$code_categorie_assimil",
                category_name: "$categorie_assimilation",
                gender: "$sexe",
              },
              count: { $sum: "$effectif" },
            },
          },
          {
            $group: {
              _id: {
                year: "$_id.year",
                category_code: "$_id.category_code",
                category_name: "$_id.category_name",
              },
              count: { $sum: "$count" },
              gender_breakdown: {
                $push: { gender: "$_id.gender", count: "$count" },
              },
            },
          },
          {
            $group: {
              _id: {
                category_code: "$_id.category_code",
                category_name: "$_id.category_name",
              },
              yearly: {
                $push: {
                  year: "$_id.year",
                  count: "$count",
                  gender_breakdown: "$gender_breakdown",
                },
              },
            },
          },
        ])
        .toArray(),

      collection
        .aggregate([
          { $match: matchAllYears },
          {
            $group: {
              _id: {
                year: "$annee_universitaire",
                category_code: "$code_categorie_assimil",
                category_name: "$categorie_assimilation",
                age_class: "$classe_age3",
              },
              count: { $sum: "$effectif" },
            },
          },
          {
            $group: {
              _id: {
                category_code: "$_id.category_code",
                category_name: "$_id.category_name",
                age_class: "$_id.age_class",
              },
              yearly: { $push: { year: "$_id.year", count: "$count" } },
            },
          },
          {
            $group: {
              _id: {
                category_code: "$_id.category_code",
                category_name: "$_id.category_name",
              },
              age_classes: {
                $push: { age_class: "$_id.age_class", yearly: "$yearly" },
              },
            },
          },
        ])
        .toArray(),

      collection
        .aggregate([
          { $match: matchAllYears },
          {
            $group: {
              _id: {
                year: "$annee_universitaire",
                category: "$categorie_personnels",
              },
              count: { $sum: "$effectif" },
            },
          },
          {
            $group: {
              _id: "$_id.year",
              total: { $sum: "$count" },
              category_breakdown: {
                $push: { category: "$_id.category", count: "$count" },
              },
            },
          },
          { $sort: { _id: 1 } },
        ])
        .toArray(),

      collection
        .aggregate([
          { $match: matchAllYears },
          {
            $group: {
              _id: { year: "$annee_universitaire", gender: "$sexe" },
              count: { $sum: "$effectif" },
            },
          },
          {
            $group: {
              _id: "$_id.year",
              total: { $sum: "$count" },
              gender_breakdown: {
                $push: { gender: "$_id.gender", count: "$count" },
              },
            },
          },
          { $sort: { _id: 1 } },
        ])
        .toArray(),

      collection
        .aggregate([
          { $match: match },
          {
            $group: {
              _id: { age_class: "$classe_age3", gender: "$sexe" },
              count: { $sum: "$effectif" },
            },
          },
          {
            $group: {
              _id: "$_id.age_class",
              total: { $sum: "$count" },
              gender_breakdown: {
                $push: { gender: "$_id.gender", count: "$count" },
              },
            },
          },
          { $sort: { _id: 1 } },
        ])
        .toArray(),

      collection
        .aggregate([
          { $match: matchAllYears },
          {
            $group: {
              _id: {
                year: "$annee_universitaire",
                group_code: "$code_groupe_cnu",
                group_name: "$groupe_cnu",
                gender: "$sexe",
                age_class: "$classe_age3",
              },
              count: { $sum: "$effectif" },
            },
          },
          {
            $group: {
              _id: {
                year: "$_id.year",
                group_code: "$_id.group_code",
                group_name: "$_id.group_name",
                age_class: "$_id.age_class",
              },
              total: { $sum: "$count" },
              gender_breakdown: {
                $push: { gender: "$_id.gender", count: "$count" },
              },
            },
          },
          {
            $group: {
              _id: {
                year: "$_id.year",
                group_code: "$_id.group_code",
                group_name: "$_id.group_name",
              },
              total: { $sum: "$total" },
              age_breakdown: {
                $push: { age_class: "$_id.age_class", count: "$total" },
              },
              gender_rows: { $push: "$gender_breakdown" },
            },
          },
          {
            $addFields: {
              gender_breakdown: {
                $map: {
                  input: ["Féminin", "Masculin"],
                  as: "g",
                  in: {
                    gender: "$$g",
                    count: {
                      $sum: {
                        $map: {
                          input: {
                            $reduce: {
                              input: "$gender_rows",
                              initialValue: [],
                              in: { $concatArrays: ["$$value", "$$this"] },
                            },
                          },
                          as: "row",
                          in: {
                            $cond: [
                              { $eq: ["$$row.gender", "$$g"] },
                              "$$row.count",
                              0,
                            ],
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          {
            $group: {
              _id: {
                group_code: "$_id.group_code",
                group_name: "$_id.group_name",
              },
              yearly: {
                $push: {
                  year: "$_id.year",
                  count: "$total",
                  gender_breakdown: "$gender_breakdown",
                  age_breakdown: "$age_breakdown",
                },
              },
            },
          },
        ])
        .toArray(),

      collection
        .aggregate([
          { $match: matchAllYears },
          {
            $group: {
              _id: {
                year: "$annee_universitaire",
                group_code: "$code_groupe_cnu",
                section_code: "$code_section_cnu",
                section_name: "$section_cnu",
                gender: "$sexe",
                age_class: "$classe_age3",
              },
              count: { $sum: "$effectif" },
            },
          },
          {
            $group: {
              _id: {
                year: "$_id.year",
                group_code: "$_id.group_code",
                section_code: "$_id.section_code",
                section_name: "$_id.section_name",
                age_class: "$_id.age_class",
              },
              total: { $sum: "$count" },
              gender_breakdown: {
                $push: { gender: "$_id.gender", count: "$count" },
              },
            },
          },
          {
            $group: {
              _id: {
                year: "$_id.year",
                group_code: "$_id.group_code",
                section_code: "$_id.section_code",
                section_name: "$_id.section_name",
              },
              total: { $sum: "$total" },
              age_breakdown: {
                $push: { age_class: "$_id.age_class", count: "$total" },
              },
              gender_rows: { $push: "$gender_breakdown" },
            },
          },
          {
            $addFields: {
              gender_breakdown: {
                $map: {
                  input: ["Féminin", "Masculin"],
                  as: "g",
                  in: {
                    gender: "$$g",
                    count: {
                      $sum: {
                        $map: {
                          input: {
                            $reduce: {
                              input: "$gender_rows",
                              initialValue: [],
                              in: { $concatArrays: ["$$value", "$$this"] },
                            },
                          },
                          as: "row",
                          in: {
                            $cond: [
                              { $eq: ["$$row.gender", "$$g"] },
                              "$$row.count",
                              0,
                            ],
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          {
            $group: {
              _id: {
                group_code: "$_id.group_code",
                section_code: "$_id.section_code",
                section_name: "$_id.section_name",
              },
              yearly: {
                $push: {
                  year: "$_id.year",
                  count: "$total",
                  gender_breakdown: "$gender_breakdown",
                  age_breakdown: "$age_breakdown",
                },
              },
            },
          },
        ])
        .toArray(),

      getContextInfo(collection, view, id),
    ]);

    res.json({
      context_info: contextInfo,
      cnuGroups: cnuData.map((group) => ({
        cnuGroupId: group._id.group_code,
        cnuGroupLabel: group._id.group_name,
        maleCount: group.maleCount,
        femaleCount: group.femaleCount,
        totalCount: group.groupTotal,
        ageDistribution: group.ageDistribution,
        categories: group.categories,
        cnuSections: group.sections.map((section) => ({
          cnuSectionId: section.sectionCode,
          cnuSectionLabel: section.sectionName,
          maleCount: section.maleCount,
          femaleCount: section.femaleCount,
          totalCount: section.totalCount,
          ageDistribution: ageClasses.map((ageClass) => ({
            ageClass,
            count:
              section.ageDistribution.find((a) => a.ageClass === ageClass)
                ?.count || 0,
          })),
          categories: section.categories,
        })),
      })),
      categoryDistribution: categoryDistribution.map((cat) => ({
        categoryCode: cat._id.category_code,
        categoryName: cat._id.category_name,
        maleCount: cat.maleCount,
        femaleCount: cat.femaleCount,
        totalCount: cat.totalCount,
        ageDistribution: ageClasses.map((ageClass) => ({
          ageClass,
          count:
            cat.ageDistribution?.find((a) => a.ageClass === ageClass)?.count ||
            0,
        })),
      })),
      categoryAssimilEvolution,
      categoryAgeEvolution,
      categoryEvolution,
      genderEvolution,
      ageDistribution,
      cnuGroupEvolution,
      cnuSectionEvolution,
      ...(await buildQuotiteData(collection, match, matchAllYears)),
    });
  } catch (error) {
    console.error("Error fetching 2nd degree teachers:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/faculty-members/non-permanents-teachers", async (req, res) => {
  try {
    const { view, id, year } = req.query;
    if (!view || !VALID_VIEWS.includes(view)) {
      return res.status(400).json({ error: "Invalid or missing view param" });
    }
    const collection = db.collection(COLLECTION);
    const match = {
      ...buildMatchStage(view, id, year),
      is_titulaire: false,
    };
    const matchAllYears = {
      ...buildMatchStage(view, id),
      is_titulaire: false,
    };

    const ageClasses = [
      "35 ans et moins",
      "36 à 55 ans",
      "56 ans et plus",
      "Non précisé",
    ];

    const [
      cnuData,
      categoryDistribution,
      categoryAssimilEvolution,
      categoryAgeEvolution,
      categoryEvolution,
      genderEvolution,
      ageDistribution,
      cnuGroupEvolution,
      contextInfo,
    ] = await Promise.all([
      collection
        .aggregate([
          { $match: match },
          {
            $group: {
              _id: {
                group_code: "$code_groupe_cnu",
                group_name: "$groupe_cnu",
                gender: "$sexe",
                age_class: "$classe_age3",
                category_name: "$categorie_personnels",
              },
              count: { $sum: "$effectif" },
            },
          },
          {
            $group: {
              _id: {
                group_code: "$_id.group_code",
                group_name: "$_id.group_name",
                age_class: "$_id.age_class",
              },
              maleCount: {
                $sum: {
                  $cond: [{ $eq: ["$_id.gender", "Masculin"] }, "$count", 0],
                },
              },
              femaleCount: {
                $sum: {
                  $cond: [{ $eq: ["$_id.gender", "Féminin"] }, "$count", 0],
                },
              },
              totalCount: { $sum: "$count" },
              categories: {
                $push: {
                  categoryName: "$_id.category_name",
                  count: "$count",
                },
              },
            },
          },
          {
            $group: {
              _id: {
                group_code: "$_id.group_code",
                group_name: "$_id.group_name",
              },
              maleCount: { $sum: "$maleCount" },
              femaleCount: { $sum: "$femaleCount" },
              totalCount: { $sum: "$totalCount" },
              ageDistribution: {
                $push: {
                  ageClass: "$_id.age_class",
                  count: "$totalCount",
                },
              },
              categories: { $push: "$categories" },
            },
          },
          {
            $addFields: {
              categories: {
                $reduce: {
                  input: "$categories",
                  initialValue: [],
                  in: { $concatArrays: ["$$value", "$$this"] },
                },
              },
            },
          },
          {
            $addFields: {
              categories: {
                $filter: {
                  input: {
                    $map: {
                      input: {
                        $setUnion: [
                          {
                            $map: {
                              input: "$categories",
                              as: "cat",
                              in: "$$cat.categoryName",
                            },
                          },
                        ],
                      },
                      as: "catName",
                      in: {
                        categoryName: "$$catName",
                        count: {
                          $sum: {
                            $map: {
                              input: {
                                $filter: {
                                  input: "$categories",
                                  as: "cat",
                                  cond: {
                                    $eq: ["$$cat.categoryName", "$$catName"],
                                  },
                                },
                              },
                              as: "fcat",
                              in: "$$fcat.count",
                            },
                          },
                        },
                      },
                    },
                  },
                  as: "cat",
                  cond: { $ne: ["$$cat.categoryName", null] },
                },
              },
            },
          },
          {
            $group: {
              _id: {
                group_code: "$_id.group_code",
                group_name: "$_id.group_name",
              },
              groupTotal: { $sum: "$totalCount" },
              maleCount: { $sum: "$maleCount" },
              femaleCount: { $sum: "$femaleCount" },
              sections: {
                $push: {
                  totalCount: "$totalCount",
                  maleCount: "$maleCount",
                  femaleCount: "$femaleCount",
                  ageDistribution: "$ageDistribution",
                  categories: "$categories",
                },
              },
              groupCategories: { $push: "$categories" },
            },
          },
          {
            $addFields: {
              categories: {
                $filter: {
                  input: {
                    $map: {
                      input: {
                        $setUnion: [
                          {
                            $map: {
                              input: {
                                $reduce: {
                                  input: "$groupCategories",
                                  initialValue: [],
                                  in: {
                                    $concatArrays: ["$$value", "$$this"],
                                  },
                                },
                              },
                              as: "cat",
                              in: "$$cat.categoryName",
                            },
                          },
                        ],
                      },
                      as: "catName",
                      in: {
                        categoryName: "$$catName",
                        count: {
                          $sum: {
                            $map: {
                              input: {
                                $filter: {
                                  input: {
                                    $reduce: {
                                      input: "$groupCategories",
                                      initialValue: [],
                                      in: {
                                        $concatArrays: ["$$value", "$$this"],
                                      },
                                    },
                                  },
                                  as: "cat",
                                  cond: {
                                    $eq: ["$$cat.categoryName", "$$catName"],
                                  },
                                },
                              },
                              as: "fcat",
                              in: "$$fcat.count",
                            },
                          },
                        },
                      },
                    },
                  },
                  as: "cat",
                  cond: { $ne: ["$$cat.categoryName", null] },
                },
              },
            },
          },
          { $project: { groupCategories: 0 } },
          {
            $addFields: {
              ageDistribution: ageClasses.map((ageClass) => ({
                ageClass,
                count: {
                  $sum: {
                    $map: {
                      input: "$sections",
                      as: "section",
                      in: {
                        $sum: {
                          $map: {
                            input: {
                              $filter: {
                                input: "$$section.ageDistribution",
                                as: "age",
                                cond: { $eq: ["$$age.ageClass", ageClass] },
                              },
                            },
                            as: "filteredAge",
                            in: "$$filteredAge.count",
                          },
                        },
                      },
                    },
                  },
                },
                percent: {
                  $cond: {
                    if: { $gt: ["$groupTotal", 0] },
                    then: {
                      $multiply: [
                        {
                          $divide: [
                            {
                              $sum: {
                                $map: {
                                  input: "$sections",
                                  as: "section",
                                  in: {
                                    $sum: {
                                      $map: {
                                        input: {
                                          $filter: {
                                            input: "$$section.ageDistribution",
                                            as: "age",
                                            cond: {
                                              $eq: ["$$age.ageClass", ageClass],
                                            },
                                          },
                                        },
                                        as: "filteredAge",
                                        in: "$$filteredAge.count",
                                      },
                                    },
                                  },
                                },
                              },
                            },
                            "$groupTotal",
                          ],
                        },
                        100,
                      ],
                    },
                    else: 0,
                  },
                },
              })),
            },
          },
          { $sort: { groupTotal: -1 } },
        ])
        .toArray(),

      collection
        .aggregate([
          { $match: match },
          {
            $group: {
              _id: {
                category_code: "$code_categorie_pers",
                category_name: "$categorie_personnels",
                gender: "$sexe",
                age_class: "$classe_age3",
              },
              count: { $sum: "$effectif" },
            },
          },
          {
            $group: {
              _id: {
                category_code: "$_id.category_code",
                category_name: "$_id.category_name",
                age_class: "$_id.age_class",
              },
              totalCount: { $sum: "$count" },
              maleCount: {
                $sum: {
                  $cond: [{ $eq: ["$_id.gender", "Masculin"] }, "$count", 0],
                },
              },
              femaleCount: {
                $sum: {
                  $cond: [{ $eq: ["$_id.gender", "Féminin"] }, "$count", 0],
                },
              },
            },
          },
          {
            $group: {
              _id: {
                category_code: "$_id.category_code",
                category_name: "$_id.category_name",
              },
              totalCount: { $sum: "$totalCount" },
              maleCount: { $sum: "$maleCount" },
              femaleCount: { $sum: "$femaleCount" },
              ageDistribution: {
                $push: { ageClass: "$_id.age_class", count: "$totalCount" },
              },
            },
          },
          { $sort: { totalCount: -1 } },
        ])
        .toArray(),

      collection
        .aggregate([
          { $match: matchAllYears },
          {
            $group: {
              _id: {
                year: "$annee_universitaire",
                category_code: "$code_categorie_pers",
                category_name: "$categorie_personnels",
                gender: "$sexe",
              },
              count: { $sum: "$effectif" },
            },
          },
          {
            $group: {
              _id: {
                year: "$_id.year",
                category_code: "$_id.category_code",
                category_name: "$_id.category_name",
              },
              count: { $sum: "$count" },
              gender_breakdown: {
                $push: { gender: "$_id.gender", count: "$count" },
              },
            },
          },
          {
            $group: {
              _id: {
                category_code: "$_id.category_code",
                category_name: "$_id.category_name",
              },
              yearly: {
                $push: {
                  year: "$_id.year",
                  count: "$count",
                  gender_breakdown: "$gender_breakdown",
                },
              },
            },
          },
        ])
        .toArray(),

      collection
        .aggregate([
          { $match: matchAllYears },
          {
            $group: {
              _id: {
                year: "$annee_universitaire",
                category_code: "$code_categorie_pers",
                category_name: "$categorie_personnels",
                age_class: "$classe_age3",
              },
              count: { $sum: "$effectif" },
            },
          },
          {
            $group: {
              _id: {
                category_code: "$_id.category_code",
                category_name: "$_id.category_name",
                age_class: "$_id.age_class",
              },
              yearly: { $push: { year: "$_id.year", count: "$count" } },
            },
          },
          {
            $group: {
              _id: {
                category_code: "$_id.category_code",
                category_name: "$_id.category_name",
              },
              age_classes: {
                $push: { age_class: "$_id.age_class", yearly: "$yearly" },
              },
            },
          },
        ])
        .toArray(),

      collection
        .aggregate([
          { $match: matchAllYears },
          {
            $group: {
              _id: {
                year: "$annee_universitaire",
                category: "$categorie_personnels",
              },
              count: { $sum: "$effectif" },
            },
          },
          {
            $group: {
              _id: "$_id.year",
              total: { $sum: "$count" },
              category_breakdown: {
                $push: { category: "$_id.category", count: "$count" },
              },
            },
          },
          { $sort: { _id: 1 } },
        ])
        .toArray(),

      collection
        .aggregate([
          { $match: matchAllYears },
          {
            $group: {
              _id: { year: "$annee_universitaire", gender: "$sexe" },
              count: { $sum: "$effectif" },
            },
          },
          {
            $group: {
              _id: "$_id.year",
              total: { $sum: "$count" },
              gender_breakdown: {
                $push: { gender: "$_id.gender", count: "$count" },
              },
            },
          },
          { $sort: { _id: 1 } },
        ])
        .toArray(),

      collection
        .aggregate([
          { $match: match },
          {
            $group: {
              _id: { age_class: "$classe_age3", gender: "$sexe" },
              count: { $sum: "$effectif" },
            },
          },
          {
            $group: {
              _id: "$_id.age_class",
              total: { $sum: "$count" },
              gender_breakdown: {
                $push: { gender: "$_id.gender", count: "$count" },
              },
            },
          },
          { $sort: { _id: 1 } },
        ])
        .toArray(),

      collection
        .aggregate([
          { $match: matchAllYears },
          {
            $group: {
              _id: {
                year: "$annee_universitaire",
                group_code: "$code_groupe_cnu",
                group_name: "$groupe_cnu",
                gender: "$sexe",
                age_class: "$classe_age3",
              },
              count: { $sum: "$effectif" },
            },
          },
          {
            $group: {
              _id: {
                year: "$_id.year",
                group_code: "$_id.group_code",
                group_name: "$_id.group_name",
                age_class: "$_id.age_class",
              },
              total: { $sum: "$count" },
              gender_breakdown: {
                $push: { gender: "$_id.gender", count: "$count" },
              },
            },
          },
          {
            $group: {
              _id: {
                year: "$_id.year",
                group_code: "$_id.group_code",
                group_name: "$_id.group_name",
              },
              total: { $sum: "$total" },
              age_breakdown: {
                $push: { age_class: "$_id.age_class", count: "$total" },
              },
              gender_rows: { $push: "$gender_breakdown" },
            },
          },
          {
            $addFields: {
              gender_breakdown: {
                $map: {
                  input: ["Féminin", "Masculin"],
                  as: "g",
                  in: {
                    gender: "$$g",
                    count: {
                      $sum: {
                        $map: {
                          input: {
                            $reduce: {
                              input: "$gender_rows",
                              initialValue: [],
                              in: { $concatArrays: ["$$value", "$$this"] },
                            },
                          },
                          as: "row",
                          in: {
                            $cond: [
                              { $eq: ["$$row.gender", "$$g"] },
                              "$$row.count",
                              0,
                            ],
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          {
            $group: {
              _id: {
                group_code: "$_id.group_code",
                group_name: "$_id.group_name",
              },
              yearly: {
                $push: {
                  year: "$_id.year",
                  count: "$total",
                  gender_breakdown: "$gender_breakdown",
                  age_breakdown: "$age_breakdown",
                },
              },
            },
          },
        ])
        .toArray(),

      /* collection
        .aggregate([
          { $match: matchAllYears },
          {
            $group: {
              _id: {
                year: "$annee_universitaire",
                group_code: "$code_groupe_cnu",
                gender: "$sexe",
                age_class: "$classe_age3",
              },
              count: { $sum: "$effectif" },
            },
          },
          {
            $group: {
              _id: {
                year: "$_id.year",
                group_code: "$_id.group_code",
                age_class: "$_id.age_class",
              },
              total: { $sum: "$count" },
              gender_breakdown: {
                $push: { gender: "$_id.gender", count: "$count" },
              },
            },
          },
          {
            $group: {
              _id: {
                year: "$_id.year",
                group_code: "$_id.group_code",
              },
              total: { $sum: "$total" },
              age_breakdown: {
                $push: { age_class: "$_id.age_class", count: "$total" },
              },
              gender_rows: { $push: "$gender_breakdown" },
            },
          },
          {
            $addFields: {
              gender_breakdown: {
                $map: {
                  input: ["Féminin", "Masculin"],
                  as: "g",
                  in: {
                    gender: "$$g",
                    count: {
                      $sum: {
                        $map: {
                          input: {
                            $reduce: {
                              input: "$gender_rows",
                              initialValue: [],
                              in: { $concatArrays: ["$$value", "$$this"] },
                            },
                          },
                          as: "row",
                          in: {
                            $cond: [
                              { $eq: ["$$row.gender", "$$g"] },
                              "$$row.count",
                              0,
                            ],
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          {
            $group: {
              _id: {
                group_code: "$_id.group_code",
                section_code: "$_id.section_code",
                section_name: "$_id.section_name",
              },
              yearly: {
                $push: {
                  year: "$_id.year",
                  count: "$total",
                  gender_breakdown: "$gender_breakdown",
                  age_breakdown: "$age_breakdown",
                },
              },
            },
          },
        ])
        .toArray(), */

      getContextInfo(collection, view, id),
    ]);

    res.json({
      context_info: contextInfo,
      cnuGroups: cnuData.map((group) => ({
        cnuGroupId: group._id.group_code,
        cnuGroupLabel: group._id.group_name,
        maleCount: group.maleCount,
        femaleCount: group.femaleCount,
        totalCount: group.groupTotal,
        ageDistribution: group.ageDistribution,
        categories: group.categories,
      })),
      categoryDistribution: categoryDistribution.map((cat) => ({
        categoryCode: cat._id.category_code,
        categoryName: cat._id.category_name,
        maleCount: cat.maleCount,
        femaleCount: cat.femaleCount,
        totalCount: cat.totalCount,
        ageDistribution: ageClasses.map((ageClass) => ({
          ageClass,
          count:
            cat.ageDistribution?.find((a) => a.ageClass === ageClass)?.count ||
            0,
        })),
      })),
      categoryAssimilEvolution,
      categoryAgeEvolution,
      categoryEvolution,
      genderEvolution,
      ageDistribution,
      cnuGroupEvolution,
      ...(await buildQuotiteData(collection, match, matchAllYears)),
    });
  } catch (error) {
    console.error("Error fetching non permanents teachers:", error);
    res.status(500).json({ error: "Server error" });
  }
});

async function getComparisonStats(collection, match) {
  const [genderAgg, statusAgg, categoryAgg] = await Promise.all([
    collection
      .aggregate([
        { $match: match },
        { $group: { _id: "$sexe", count: { $sum: "$effectif" } } },
      ])
      .toArray(),
    collection
      .aggregate([
        { $match: match },
        {
          $group: {
            _id: {
              $switch: {
                branches: [
                  {
                    case: { $eq: ["$is_enseignant_chercheur", true] },
                    then: "enseignant_chercheur",
                  },
                  {
                    case: {
                      $and: [
                        { $eq: ["$is_titulaire", true] },
                        { $eq: ["$is_enseignant_chercheur", false] },
                      ],
                    },
                    then: "titulaire_non_chercheur",
                  },
                ],
                default: "non_titulaire",
              },
            },
            count: { $sum: "$effectif" },
          },
        },
      ])
      .toArray(),
    collection
      .aggregate([
        { $match: match },
        {
          $group: {
            _id: "$categorie_assimilation",
            count: { $sum: "$effectif" },
          },
        },
        { $match: { _id: { $ne: null } } },
        { $sort: { count: -1 } },
      ])
      .toArray(),
  ]);

  const total = genderAgg.reduce((s, g) => s + g.count, 0);
  return { total, gender: genderAgg, status: statusAgg, category: categoryAgg };
}

router.get("/faculty-members/comparison", async (req, res) => {
  try {
    const { view, id, year } = req.query;
    if (!view || !VALID_VIEWS.includes(view) || !id || !year) {
      return res
        .status(400)
        .json({ error: "Missing or invalid view/id/year params" });
    }
    const collection = db.collection(COLLECTION);

    if (view === "structure") {
      const doc = await collection.findOne(
        { etablissement_id_paysage: id },
        {
          projection: {
            etablissement_region: 1,
            etablissement_academie: 1,
            etablissement_actuel_lib: 1,
            etablissement_lib: 1,
          },
        }
      );
      if (!doc) return res.status(404).json({ error: "Structure not found" });

      const regionName = doc.etablissement_region;
      const academieName = doc.etablissement_academie;
      const entityName = doc.etablissement_actuel_lib || doc.etablissement_lib;

      const [entityStats, regionStats, academieStats] = await Promise.all([
        getComparisonStats(collection, {
          etablissement_id_paysage: id,
          annee_universitaire: year,
        }),
        getComparisonStats(collection, {
          etablissement_region: regionName,
          annee_universitaire: year,
        }),
        getComparisonStats(collection, {
          etablissement_academie: academieName,
          annee_universitaire: year,
        }),
      ]);

      return res.json({
        type: "structure",
        entity: { name: entityName, ...entityStats },
        region: { name: regionName, ...regionStats },
        academie: { name: academieName, ...academieStats },
      });
    }

    const geoField =
      view === "region" ? "etablissement_region" : "etablissement_academie";

    const establishments = await collection
      .aggregate([
        { $match: { [geoField]: id, annee_universitaire: year } },
        {
          $group: {
            _id: {
              id: "$etablissement_id_paysage",
              label: "$etablissement_lib",
              gender: "$sexe",
              status: {
                $switch: {
                  branches: [
                    {
                      case: { $eq: ["$is_enseignant_chercheur", true] },
                      then: "enseignant_chercheur",
                    },
                    {
                      case: {
                        $and: [
                          { $eq: ["$is_titulaire", true] },
                          { $eq: ["$is_enseignant_chercheur", false] },
                        ],
                      },
                      then: "titulaire_non_chercheur",
                    },
                  ],
                  default: "non_titulaire",
                },
              },
            },
            count: { $sum: "$effectif" },
          },
        },
        {
          $group: {
            _id: { id: "$_id.id", label: "$_id.label" },
            total: { $sum: "$count" },
            gender_breakdown: {
              $push: { gender: "$_id.gender", count: "$count" },
            },
            status_breakdown: {
              $push: { status: "$_id.status", count: "$count" },
            },
          },
        },
        { $sort: { total: -1 } },
        { $limit: 20 },
      ])
      .toArray();

    const geoStats = await getComparisonStats(collection, {
      [geoField]: id,
      annee_universitaire: year,
    });

    return res.json({
      type: view,
      entity: { name: id, ...geoStats },
      establishments,
    });
  } catch (error) {
    console.error("Error fetching comparison:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/faculty-members/positioning", async (req, res) => {
  try {
    const {
      view = "structure",
      year,
      cnu_type,
      cnu_code,
      assimil_code,
    } = req.query;
    if (!VALID_VIEWS.includes(view)) {
      return res.status(400).json({ error: "Invalid view parameter" });
    }
    const collection = db.collection(COLLECTION);
    const match = {};
    if (year) match.annee_universitaire = year;
    if (cnu_type === "groupe" && cnu_code)
      match.code_groupe_cnu = parseInt(cnu_code);
    if (cnu_type === "section" && cnu_code)
      match.code_section_cnu = parseInt(cnu_code);
    if (assimil_code) match.code_categorie_assimil = assimil_code;

    const groupId = {
      structure: {
        entity_id: "$etablissement_id_paysage_actuel",
        entity_label: "$etablissement_actuel_lib",
        entity_type: "$etablissement_type",
        entity_region: "$etablissement_region",
        entity_code_region: "$etablissement_code_region",
        entity_academie: "$etablissement_academie",
        entity_code_academie: "$etablissement_code_academie",
      },
      region: {
        entity_id: "$etablissement_region",
        entity_label: "$etablissement_region",
        entity_code_region: "$etablissement_code_region",
      },
      academie: {
        entity_id: "$etablissement_academie",
        entity_label: "$etablissement_academie",
        entity_academie: "$etablissement_academie",
        entity_code_academie: "$etablissement_code_academie",
        entity_region: "$etablissement_region",
        entity_code_region: "$etablissement_code_region",
      },
      discipline: {
        entity_id: "$code_grande_discipline",
        entity_label: "$grande_discipline",
      },
    }[view];

    const items = await collection
      .aggregate([
        { $match: match },
        {
          $group: {
            _id: groupId,
            total: { $sum: "$effectif" },
            female: {
              $sum: { $cond: [{ $eq: ["$sexe", "Féminin"] }, "$effectif", 0] },
            },
            ec: {
              $sum: {
                $cond: [
                  { $eq: ["$is_enseignant_chercheur", true] },
                  "$effectif",
                  0,
                ],
              },
            },
            titulaires: {
              $sum: {
                $cond: [{ $eq: ["$is_titulaire", true] }, "$effectif", 0],
              },
            },
            pr: {
              $sum: {
                $cond: [
                  {
                    $regexMatch: {
                      input: { $ifNull: ["$categorie_assimilation", ""] },
                      regex: "professeur",
                      options: "i",
                    },
                  },
                  "$effectif",
                  0,
                ],
              },
            },
            mcf: {
              $sum: {
                $cond: [
                  {
                    $regexMatch: {
                      input: { $ifNull: ["$categorie_assimilation", ""] },
                      regex: "conf[eé]rences",
                      options: "i",
                    },
                  },
                  "$effectif",
                  0,
                ],
              },
            },
            non_permanents: {
              $sum: {
                $cond: [{ $eq: ["$is_titulaire", false] }, "$effectif", 0],
              },
            },
            age_35_moins: {
              $sum: {
                $cond: [
                  { $eq: ["$classe_age3", "35 ans et moins"] },
                  "$effectif",
                  0,
                ],
              },
            },
            age_36_55: {
              $sum: {
                $cond: [
                  { $eq: ["$classe_age3", "36 à 55 ans"] },
                  "$effectif",
                  0,
                ],
              },
            },
            age_56_plus: {
              $sum: {
                $cond: [
                  { $eq: ["$classe_age3", "56 ans et plus"] },
                  "$effectif",
                  0,
                ],
              },
            },
            temps_plein: {
              $sum: {
                $cond: [{ $eq: ["$quotite", "Temps plein"] }, "$effectif", 0],
              },
            },
            pers_2nd_degre: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$categorie_assimilation",
                      "Enseignants du 2nd degré et Arts et métiers",
                    ],
                  },
                  "$effectif",
                  0,
                ],
              },
            },
          },
        },
        { $match: { total: { $gt: 0 } } },
        { $sort: { total: -1 } },
      ])
      .toArray();

    const result = items
      .filter((item) => item._id.entity_id && item._id.entity_label)
      .map((item) => ({
        etablissement_id_paysage_actuel: item._id.entity_id,
        etablissement_actuel_lib: item._id.entity_label,
        etablissement_type: item._id.entity_type || null,
        etablissement_region: item._id.entity_region || null,
        etablissement_code_region: item._id.entity_code_region || null,
        etablissement_academie: item._id.entity_academie || null,
        etablissement_code_academie: item._id.entity_code_academie || null,
        total_effectif: item.total,
        taux_feminisation:
          item.total > 0 ? (item.female / item.total) * 100 : 0,
        taux_ec: item.total > 0 ? (item.ec / item.total) * 100 : 0,
        taux_titulaires:
          item.total > 0 ? (item.titulaires / item.total) * 100 : 0,
        taux_non_permanents:
          item.total > 0 ? (item.non_permanents / item.total) * 100 : 0,
        taux_pr: item.total > 0 ? (item.pr / item.total) * 100 : 0,
        taux_mcf: item.total > 0 ? (item.mcf / item.total) * 100 : 0,
        taux_age_35_moins:
          item.total > 0 ? (item.age_35_moins / item.total) * 100 : 0,
        taux_age_36_55:
          item.total > 0 ? (item.age_36_55 / item.total) * 100 : 0,
        taux_age_56_plus:
          item.total > 0 ? (item.age_56_plus / item.total) * 100 : 0,
        taux_temps_plein:
          item.total > 0 ? (item.temps_plein / item.total) * 100 : 0,
        taux_2nd_degre:
          item.total > 0 ? (item.pers_2nd_degre / item.total) * 100 : 0,
        total_titulaires: item.titulaires,
        total_ec: item.ec,
        total_non_permanents: item.non_permanents,
      }));

    res.json({ items: result });
  } catch (error) {
    console.error("Error fetching positioning data:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/faculty-members/cnu-list", async (req, res) => {
  try {
    const { year } = req.query;
    const collection = db.collection(COLLECTION);
    const match = {};
    if (year) match.annee_universitaire = year;

    const [groupes, sections] = await Promise.all([
      collection
        .aggregate([
          { $match: { ...match, code_groupe_cnu: { $nin: [99, null] } } },
          {
            $group: { _id: { code: "$code_groupe_cnu", label: "$groupe_cnu" } },
          },
          { $sort: { "_id.code": 1 } },
          { $project: { _id: 0, code: "$_id.code", label: "$_id.label" } },
        ])
        .toArray(),
      collection
        .aggregate([
          { $match: { ...match, code_section_cnu: { $nin: [99, null] } } },
          {
            $group: {
              _id: {
                code: "$code_section_cnu",
                label: "$section_cnu",
                groupe: "$code_groupe_cnu",
              },
            },
          },
          { $sort: { "_id.code": 1 } },
          {
            $project: {
              _id: 0,
              code: "$_id.code",
              label: "$_id.label",
              groupe: "$_id.groupe",
            },
          },
        ])
        .toArray(),
    ]);

    res.json({ groupes, sections });
  } catch (error) {
    console.error("Error fetching CNU list:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/faculty-members/assimilation-list", async (req, res) => {
  try {
    const { year } = req.query;
    const collection = db.collection(COLLECTION);
    const match = {};
    if (year) match.annee_universitaire = year;

    const categories = await collection
      .aggregate([
        { $match: { ...match, code_categorie_assimil: { $ne: null } } },
        {
          $group: {
            _id: {
              code: "$code_categorie_assimil",
              label: "$categorie_assimilation",
            },
          },
        },
        { $sort: { "_id.label": 1 } },
        { $project: { _id: 0, code: "$_id.code", label: "$_id.label" } },
      ])
      .toArray();

    res.json({ categories });
  } catch (error) {
    console.error("Error fetching assimilation list:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/faculty-members/analyses", async (req, res) => {
  try {
    const { view, id, age_class, gender, status } = req.query;
    const collection = db.collection(COLLECTION);
    const match = buildMatchStage(view, id);
    if (gender) match.sexe = gender;
    if (status === "ec") match.is_enseignant_chercheur = true;
    else if (status === "tit_non_ec") {
      match.is_titulaire = true;
      match.is_enseignant_chercheur = false;
    } else if (status === "non_permanent") {
      match.is_titulaire = { $ne: true };
    }
    const matchEc = { ...match, is_enseignant_chercheur: true };
    const matchAge = age_class ? { ...match, classe_age3: age_class } : match;
    const matchEcAge = age_class
      ? { ...matchEc, classe_age3: age_class }
      : matchEc;

    const [
      globalAgg,
      statusGenderAgg,
      quotiteGenderAgg,
      ageAgg,
      discYearAgg,
      discGenderAgg,
      cnuGroupYearAgg,
      cnuSectionTopAgg,
      gradeGenderAgg,
      ageGenderQuotiteAgg,
      statusQuotiteAgg,
    ] = await Promise.all([
      collection
        .aggregate([
          { $match: matchAge },
          {
            $group: {
              _id: { year: "$annee_universitaire", g: "$sexe" },
              c: { $sum: "$effectif" },
            },
          },
          {
            $group: {
              _id: "$_id.year",
              total: { $sum: "$c" },
              genders: { $push: { g: "$_id.g", c: "$c" } },
            },
          },
          { $sort: { _id: 1 } },
        ])
        .toArray(),

      collection
        .aggregate([
          { $match: matchAge },
          {
            $group: {
              _id: {
                year: "$annee_universitaire",
                g: "$sexe",
                status: {
                  $switch: {
                    branches: [
                      {
                        case: { $eq: ["$is_enseignant_chercheur", true] },
                        then: "ec",
                      },
                      {
                        case: {
                          $and: [
                            { $eq: ["$is_titulaire", true] },
                            { $eq: ["$is_enseignant_chercheur", false] },
                          ],
                        },
                        then: "tit",
                      },
                    ],
                    default: "non_tit",
                  },
                },
              },
              c: { $sum: "$effectif" },
            },
          },
          {
            $group: {
              _id: "$_id.year",
              breakdown: {
                $push: { g: "$_id.g", status: "$_id.status", c: "$c" },
              },
            },
          },
          { $sort: { _id: 1 } },
        ])
        .toArray(),

      collection
        .aggregate([
          { $match: matchAge },
          {
            $group: {
              _id: { year: "$annee_universitaire", g: "$sexe", q: "$quotite" },
              c: { $sum: "$effectif" },
            },
          },
          {
            $group: {
              _id: "$_id.year",
              breakdown: { $push: { g: "$_id.g", q: "$_id.q", c: "$c" } },
            },
          },
          { $sort: { _id: 1 } },
        ])
        .toArray(),

      collection
        .aggregate([
          { $match: match },
          {
            $group: {
              _id: { year: "$annee_universitaire", age: "$classe_age3" },
              c: { $sum: "$effectif" },
            },
          },
          {
            $group: {
              _id: "$_id.year",
              ages: { $push: { age: "$_id.age", c: "$c" } },
            },
          },
          { $sort: { _id: 1 } },
        ])
        .toArray(),

      collection
        .aggregate([
          { $match: matchAge },
          {
            $group: {
              _id: {
                year: "$annee_universitaire",
                code: "$code_grande_discipline",
                name: "$grande_discipline",
              },
              c: { $sum: "$effectif" },
            },
          },
          {
            $group: {
              _id: "$_id.year",
              discs: {
                $push: { code: "$_id.code", name: "$_id.name", c: "$c" },
              },
            },
          },
          { $sort: { _id: 1 } },
        ])
        .toArray(),

      collection
        .aggregate([
          { $match: matchAge },
          {
            $group: {
              _id: {
                year: "$annee_universitaire",
                code: "$code_grande_discipline",
                g: "$sexe",
              },
              c: { $sum: "$effectif" },
            },
          },
          {
            $group: {
              _id: "$_id.year",
              breakdown: { $push: { code: "$_id.code", g: "$_id.g", c: "$c" } },
            },
          },
          { $sort: { _id: 1 } },
        ])
        .toArray(),

      collection
        .aggregate([
          { $match: matchEcAge },
          {
            $group: {
              _id: {
                year: "$annee_universitaire",
                code: "$code_groupe_cnu",
                name: "$groupe_cnu",
                g: "$sexe",
              },
              c: { $sum: "$effectif" },
            },
          },
          {
            $group: {
              _id: "$_id.year",
              groups: {
                $push: {
                  code: "$_id.code",
                  name: "$_id.name",
                  g: "$_id.g",
                  c: "$c",
                },
              },
            },
          },
          { $sort: { _id: 1 } },
        ])
        .toArray(),

      collection
        .aggregate([
          { $match: { ...matchEcAge, code_section_cnu: { $ne: 0 } } },
          {
            $group: {
              _id: {
                year: "$annee_universitaire",
                code: "$code_section_cnu",
                name: "$section_cnu",
                g: "$sexe",
              },
              c: { $sum: "$effectif" },
            },
          },
          {
            $group: {
              _id: { code: "$_id.code", name: "$_id.name" },
              total: { $sum: "$c" },
              yearly: { $push: { year: "$_id.year", g: "$_id.g", c: "$c" } },
            },
          },
          { $sort: { total: -1 } },
        ])
        .toArray(),

      collection
        .aggregate([
          { $match: matchEcAge },
          {
            $group: {
              _id: {
                year: "$annee_universitaire",
                grade: {
                  $switch: {
                    branches: [
                      {
                        case: {
                          $regexMatch: {
                            input: { $ifNull: ["$categorie_assimilation", ""] },
                            regex: "professeur",
                            options: "i",
                          },
                        },
                        then: "pr",
                      },
                      {
                        case: {
                          $regexMatch: {
                            input: { $ifNull: ["$categorie_assimilation", ""] },
                            regex: "ma[iî]tre",
                            options: "i",
                          },
                        },
                        then: "mcf",
                      },
                    ],
                    default: "other",
                  },
                },
                g: "$sexe",
              },
              c: { $sum: "$effectif" },
            },
          },
          {
            $group: {
              _id: "$_id.year",
              breakdown: {
                $push: { grade: "$_id.grade", g: "$_id.g", c: "$c" },
              },
            },
          },
          { $sort: { _id: 1 } },
        ])
        .toArray(),

      collection
        .aggregate([
          { $match: match },
          {
            $group: {
              _id: {
                year: "$annee_universitaire",
                age: "$classe_age3",
                g: "$sexe",
                q: "$quotite",
              },
              c: { $sum: "$effectif" },
            },
          },
          {
            $group: {
              _id: "$_id.year",
              rows: {
                $push: {
                  age: "$_id.age",
                  g: "$_id.g",
                  q: "$_id.q",
                  c: "$c",
                },
              },
            },
          },
          { $sort: { _id: 1 } },
        ])
        .toArray(),

      collection
        .aggregate([
          { $match: matchAge },
          {
            $group: {
              _id: {
                year: "$annee_universitaire",
                status: {
                  $switch: {
                    branches: [
                      {
                        case: { $eq: ["$is_enseignant_chercheur", true] },
                        then: "ec",
                      },
                      {
                        case: {
                          $and: [
                            { $eq: ["$is_titulaire", true] },
                            { $eq: ["$is_enseignant_chercheur", false] },
                          ],
                        },
                        then: "tit",
                      },
                    ],
                    default: "non_tit",
                  },
                },
                q: "$quotite",
              },
              c: { $sum: "$effectif" },
            },
          },
          {
            $group: {
              _id: "$_id.year",
              rows: { $push: { status: "$_id.status", q: "$_id.q", c: "$c" } },
            },
          },
          { $sort: { _id: 1 } },
        ])
        .toArray(),
    ]);

    const discCodesMap = new Map();
    discYearAgg.forEach((e) =>
      e.discs.forEach((d) => {
        if (d.code != null)
          discCodesMap.set(String(d.code), d.name || String(d.code));
      })
    );

    const discTotals = new Map();
    discYearAgg.forEach((e) =>
      e.discs.forEach((d) => {
        const k = String(d.code);
        discTotals.set(k, (discTotals.get(k) || 0) + d.c);
      })
    );
    const discCodes = [...discCodesMap.keys()].sort(
      (a, b) => (discTotals.get(b) || 0) - (discTotals.get(a) || 0)
    );

    const cnuGroupCodesMap = new Map();
    cnuGroupYearAgg.forEach((e) =>
      e.groups.forEach((g) => {
        if (g.code != null)
          cnuGroupCodesMap.set(String(g.code), g.name || String(g.code));
      })
    );

    const cnuGroupTotals = new Map();
    cnuGroupYearAgg.forEach((e) =>
      e.groups.forEach((g) => {
        const k = String(g.code);
        cnuGroupTotals.set(k, (cnuGroupTotals.get(k) || 0) + g.c);
      })
    );
    const cnuGroupCodes = [...cnuGroupCodesMap.keys()].sort(
      (a, b) => (cnuGroupTotals.get(b) || 0) - (cnuGroupTotals.get(a) || 0)
    );

    const cnuSections = cnuSectionTopAgg.map((s) => ({
      code: String(s._id.code),
      name: s._id.name,
      total: s.total,
      yearly: s.yearly,
    }));

    const allYears = [...new Set(globalAgg.map((e) => e._id))].sort();

    const globalByYear = Object.fromEntries(globalAgg.map((e) => [e._id, e]));
    const statusByYear = Object.fromEntries(
      statusGenderAgg.map((e) => [e._id, e])
    );
    const quotiteByYear = Object.fromEntries(
      quotiteGenderAgg.map((e) => [e._id, e])
    );
    const ageByYear = Object.fromEntries(ageAgg.map((e) => [e._id, e]));
    const discByYear = Object.fromEntries(discYearAgg.map((e) => [e._id, e]));
    const discGenderByYear = Object.fromEntries(
      discGenderAgg.map((e) => [e._id, e])
    );
    const cnuGroupByYear = Object.fromEntries(
      cnuGroupYearAgg.map((e) => [e._id, e])
    );
    const gradeByYear = Object.fromEntries(
      gradeGenderAgg.map((e) => [e._id, e])
    );
    const ageGQByYear = Object.fromEntries(
      ageGenderQuotiteAgg.map((e) => [e._id, e])
    );
    const statusQByYear = Object.fromEntries(
      statusQuotiteAgg.map((e) => [e._id, e])
    );

    const records = allYears.map((year) => {
      const g = globalByYear[year] || {};
      const s = statusByYear[year] || {};
      const q = quotiteByYear[year] || {};
      const a = ageByYear[year] || {};
      const d = discByYear[year] || {};
      const dg = discGenderByYear[year] || {};
      const cg = cnuGroupByYear[year] || {};
      const total = g.total || 0;

      const femmes = (g.genders || []).find((x) => x.g === "Féminin")?.c || 0;
      const hommes = (g.genders || []).find((x) => x.g === "Masculin")?.c || 0;

      const sumStatus = (status, gender) =>
        (s.breakdown || [])
          .filter((x) => x.status === status && (!gender || x.g === gender))
          .reduce((acc, x) => acc + x.c, 0);

      const effectif_ec = sumStatus("ec");
      const effectif_tit_non_ec = sumStatus("tit");
      const effectif_non_permanents = sumStatus("non_tit");
      const effectif_permanents = effectif_ec + effectif_tit_non_ec;
      const femmes_ec = sumStatus("ec", "Féminin");
      const femmes_perm =
        sumStatus("ec", "Féminin") + sumStatus("tit", "Féminin");
      const femmes_non_tit = sumStatus("non_tit", "Féminin");

      const sumQ = (isPlein, gender) =>
        (q.breakdown || [])
          .filter(
            (x) =>
              (isPlein ? x.q === "Temps plein" : x.q !== "Temps plein") &&
              (!gender || x.g === gender)
          )
          .reduce((acc, x) => acc + x.c, 0);
      const effectif_temps_plein = sumQ(true);
      const effectif_temps_partiel = sumQ(false);
      const tp_femmes = sumQ(true, "Féminin");
      const tp_hommes = sumQ(true, "Masculin");

      const AGE_LABELS = {
        "35 ans et moins": "effectif_age_35_moins",
        "36 à 55 ans": "effectif_age_36_55",
        "56 ans et plus": "effectif_age_56_plus",
      };
      const ageFields = {};
      Object.entries(AGE_LABELS).forEach(([label, key]) => {
        ageFields[key] = (a.ages || []).find((x) => x.age === label)?.c || 0;
      });

      const discFields = {};
      (d.discs || []).forEach((disc) => {
        discFields[`disc_${disc.code}`] = disc.c;
      });

      const discGenderFields = {};
      discCodes.forEach((code) => {
        const femmesDisc = (dg.breakdown || [])
          .filter((x) => String(x.code) === code && x.g === "Féminin")
          .reduce((acc, x) => acc + x.c, 0);
        const hommesDisc = (dg.breakdown || [])
          .filter((x) => String(x.code) === code && x.g === "Masculin")
          .reduce((acc, x) => acc + x.c, 0);
        discGenderFields[`disc_f_${code}`] = femmesDisc;
        discGenderFields[`disc_h_${code}`] = hommesDisc;
      });

      const cnuGroupsByCode = {};
      (cg.groups || []).forEach((group) => {
        const k = String(group.code);
        cnuGroupsByCode[k] = cnuGroupsByCode[k] || { total: 0, femmes: 0 };
        cnuGroupsByCode[k].total += group.c;
        if (group.g === "Féminin") cnuGroupsByCode[k].femmes += group.c;
      });
      const cnuGroupFields = {};
      const cnuGroupGenderFields = {};
      cnuGroupCodes.forEach((code) => {
        const tot = cnuGroupsByCode[code]?.total || 0;
        const fem = cnuGroupsByCode[code]?.femmes || 0;
        cnuGroupFields[`cnu_g_${code}`] = tot;
        cnuGroupGenderFields[`cnu_g_f_${code}`] = fem;
        cnuGroupGenderFields[`cnu_g_h_${code}`] = tot - fem;
      });

      const cnuSectFields = {};
      cnuSections.forEach((sect) => {
        const yearEntries = (sect.yearly || []).filter((y) => y.year === year);
        cnuSectFields[`cnu_s_f_${sect.code}`] = yearEntries
          .filter((y) => y.g === "Féminin")
          .reduce((acc, y) => acc + y.c, 0);
        cnuSectFields[`cnu_s_h_${sect.code}`] = yearEntries
          .filter((y) => y.g === "Masculin")
          .reduce((acc, y) => acc + y.c, 0);
      });

      const gr = gradeByYear[year] || {};
      const sumGrade = (grade, gender) =>
        (gr.breakdown || [])
          .filter((x) => x.grade === grade && (!gender || x.g === gender))
          .reduce((acc, x) => acc + x.c, 0);
      const effectif_pr = sumGrade("pr");
      const effectif_mcf = sumGrade("mcf");
      const femmes_pr = sumGrade("pr", "Féminin");
      const femmes_mcf = sumGrade("mcf", "Féminin");

      const AGE_KEYS = {
        "35 ans et moins": "35_moins",
        "36 à 55 ans": "36_55",
        "56 ans et plus": "56_plus",
      };
      const agq = ageGQByYear[year] || {};
      const ageStat = {
        "35_moins": { total: 0, femmes: 0, partiel: 0 },
        "36_55": { total: 0, femmes: 0, partiel: 0 },
        "56_plus": { total: 0, femmes: 0, partiel: 0 },
      };
      (agq.rows || []).forEach((x) => {
        const k = AGE_KEYS[x.age];
        if (!k) return;
        ageStat[k].total += x.c;
        if (x.g === "Féminin") ageStat[k].femmes += x.c;
        if (x.q !== "Temps plein") ageStat[k].partiel += x.c;
      });

      const sq = statusQByYear[year] || {};
      const statusStat = {
        ec: { total: 0, partiel: 0 },
        tit: { total: 0, partiel: 0 },
        non_tit: { total: 0, partiel: 0 },
      };
      (sq.rows || []).forEach((x) => {
        if (!statusStat[x.status]) return;
        statusStat[x.status].total += x.c;
        if (x.q !== "Temps plein") statusStat[x.status].partiel += x.c;
      });
      const rate = (num, den) => (den > 0 ? (num / den) * 100 : 0);

      return {
        annee_universitaire: year,
        effectif_total: total,
        effectif_femmes: femmes,
        effectif_hommes: hommes,
        taux_feminisation: total > 0 ? (femmes / total) * 100 : 0,
        effectif_ec,
        effectif_tit_non_ec,
        effectif_non_permanents,
        effectif_permanents,
        taux_permanents: total > 0 ? (effectif_permanents / total) * 100 : 0,
        taux_ec: total > 0 ? (effectif_ec / total) * 100 : 0,
        taux_ec_sur_permanents:
          effectif_permanents > 0
            ? (effectif_ec / effectif_permanents) * 100
            : 0,
        taux_feminisation_ec:
          effectif_ec > 0 ? (femmes_ec / effectif_ec) * 100 : 0,
        taux_feminisation_permanents:
          effectif_permanents > 0
            ? (femmes_perm / effectif_permanents) * 100
            : 0,
        taux_feminisation_non_permanents:
          effectif_non_permanents > 0
            ? (femmes_non_tit / effectif_non_permanents) * 100
            : 0,
        effectif_temps_plein,
        effectif_temps_partiel,
        taux_temps_partiel:
          total > 0 ? (effectif_temps_partiel / total) * 100 : 0,
        taux_temps_partiel_femmes:
          femmes > 0 ? ((femmes - tp_femmes) / femmes) * 100 : 0,
        taux_temps_partiel_hommes:
          hommes > 0 ? ((hommes - tp_hommes) / hommes) * 100 : 0,
        effectif_mcf,
        effectif_pr,
        taux_feminisation_mcf: rate(femmes_mcf, effectif_mcf),
        taux_feminisation_pr: rate(femmes_pr, effectif_pr),
        taux_pr_sur_ec: rate(effectif_pr, effectif_ec),
        taux_temps_partiel_ec: rate(statusStat.ec.partiel, statusStat.ec.total),
        taux_temps_partiel_tit: rate(
          statusStat.tit.partiel,
          statusStat.tit.total
        ),
        taux_temps_partiel_non_perm: rate(
          statusStat.non_tit.partiel,
          statusStat.non_tit.total
        ),
        taux_feminisation_age_35_moins: rate(
          ageStat["35_moins"].femmes,
          ageStat["35_moins"].total
        ),
        taux_feminisation_age_36_55: rate(
          ageStat["36_55"].femmes,
          ageStat["36_55"].total
        ),
        taux_feminisation_age_56_plus: rate(
          ageStat["56_plus"].femmes,
          ageStat["56_plus"].total
        ),
        taux_temps_partiel_age_35_moins: rate(
          ageStat["35_moins"].partiel,
          ageStat["35_moins"].total
        ),
        taux_temps_partiel_age_36_55: rate(
          ageStat["36_55"].partiel,
          ageStat["36_55"].total
        ),
        taux_temps_partiel_age_56_plus: rate(
          ageStat["56_plus"].partiel,
          ageStat["56_plus"].total
        ),
        ...ageFields,
        taux_age_35_moins:
          total > 0
            ? ((ageFields.effectif_age_35_moins || 0) / total) * 100
            : 0,
        taux_age_56_plus:
          total > 0 ? ((ageFields.effectif_age_56_plus || 0) / total) * 100 : 0,
        ...discFields,
        ...discGenderFields,
        ...cnuGroupFields,
        ...cnuGroupGenderFields,
        ...cnuSectFields,
      };
    });

    res.json({
      records,
      disc_labels: Object.fromEntries(discCodesMap),
      disc_codes: discCodes,
      cnu_group_labels: Object.fromEntries(cnuGroupCodesMap),
      cnu_group_codes: cnuGroupCodes,
      cnu_sections: cnuSections.map(({ code, name, total }) => ({
        code,
        name,
        total,
      })),
    });
  } catch (error) {
    console.error("Error fetching analyses:", error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
