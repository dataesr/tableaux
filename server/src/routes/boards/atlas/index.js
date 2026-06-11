import express from "express";
import { db } from "../../../services/mongo.js";
import { dbPaysage } from "../../../services/mongo-paysage.js";
const router = new express.Router();

const mappingRegion = [
  { R94: "fr-cor" },
  { R53: "fr-bre" },
  { R52: "fr-pdl" },
  { R93: "fr-pac" },
  { R76: "fr-occ" },
  { R75: "fr-naq" },
  { R27: "fr-bfc" },
  { R24: "fr-cvl" },
  { R11: "fr-idf" },
  { R32: "fr-hdf" },
  { R84: "fr-ara" },
  { R44: "fr-ges" },
  { R28: "fr-nor" },
  { R06: "fr-lre" },
  { R04: "fr-may" },
  { R03: "fr-gf" },
  { R02: "fr-mq" },
  { R01: "fr-gua" },
];

const filieresOrder = [
  "CPGE",
  "STS",
  "UNIV",
  "GE",
  "UT",
  "INP",
  "ENS",
  "EPEU",
  "ING_autres",
  "EC_COM",
  "EC_JUR",
  "EC_ART",
  "EC_PARAM",
  "EC_autres",
  "TOTAL",
];

const getCurrentCollectionName = async (idCollection) => {
  const data = await db.collection("boards").find({ id: "atlas" }).toArray();
  const currentCollection = data[0].data.find(
    (item) => item.id === idCollection
  ).current;

  if (currentCollection) {
    return currentCollection;
  }
  if (idCollection === "atlas") {
    return "atlas_2025";
  }
  if (idCollection === "similar-elements") {
    return "similar-elements-2022-23";
  }
};

const getConstants = async () => {
  const data = await db.collection("boards").find({ id: "atlas" }).toArray();
  return data[0].constants || [];
};

router.route("/atlas/get-geo-ids-from-search").get(async (req, res) => {
  const currentCollectionName = await getCurrentCollectionName("atlas");

  const normalizeString = (str) => {
    return str
      .toLowerCase()
      .normalize("NFC")
      .replace("é", "e")
      .replace("è", "e")
      .replace("à", "a")
      .replace("ç", "c")
      .replace(/-/g, " ");
  };

  if (!req.query.q || req.query?.q.length === 0) {
    res.status(400).send("the query is required");
  }

  const filters = {};
  const searchQuery = normalizeString(req.query.q);
  filters.geo_nom = { $regex: searchQuery, $options: "i" };

  db.collection(currentCollectionName)
    .aggregate([
      {
        $addFields: {
          normalized_name: {
            $toLower: {
              $replaceAll: {
                input: {
                  $replaceAll: {
                    input: {
                      $replaceAll: {
                        input: {
                          $replaceAll: {
                            input: {
                              $replaceAll: {
                                input: {
                                  $toLower: {
                                    $trim: { input: "$geo_nom" },
                                  },
                                },
                                find: "é",
                                replacement: "e",
                              },
                            },
                            find: "è",
                            replacement: "e",
                          },
                        },
                        find: "à",
                        replacement: "a",
                      },
                    },
                    find: "-",
                    replacement: " ",
                  },
                },
                find: "ç",
                replacement: "c",
              },
            },
          },
        },
      },
      {
        $match: {
          normalized_name: filters.geo_nom,
        },
      },
      {
        $project: {
          _id: 0,
          geo_nom: 1,
          geo_id: 1,
          niveau_geo: 1,
          normalized_name: 1,
        },
      },
      {
        $sort: { geo_nom: 1 },
      },
    ])
    .toArray()
    .then((response) => {
      const set = new Set();
      const unique = [];
      response.map((item) => {
        if (!set.has(item.geo_id)) {
          set.add(item.geo_id);
          unique.push(item);
        }
      });

      if (req.query.niveau_geo === "COMMUNE") {
        res.json(unique.slice(0, 500));
      }

      res.json(unique);
    });
});

router.route("/atlas/get-geo-polygons").get(async (req, res) => {
  const geoId = req.query.originalId;
  if (!geoId) {
    res.status(400).send("geo_id is required");
  }

  const filters = {};
  if (geoId[0] === "R") {
    // Get all academies of a region
    filters.reg_id = geoId;
    filters.niveau_geo = "ACADEMIE";
  }
  if (geoId[0] === "D") {
    // Get all communes of a departement
    filters.dep_id = geoId;
    filters.niveau_geo = "COMMUNE";
  }
  if (geoId[0] === "U") {
    // Get all communes of a departement
    filters.uucr_id = geoId;
    filters.niveau_geo = "COMMUNE";
  }
  if (geoId[0] === "A") {
    // Get all departements of an academy
    filters.aca_id = geoId;
    filters.niveau_geo = "DEPARTEMENT";
  }
  if (geoId === "PAYS_100") {
    // Get all regions of France
    filters.niveau_geo = "REGION";
  }
  if (geoId.startsWith("R") || geoId.startsWith("A") || geoId.startsWith("P")) {
    const currentCollectionName = await getCurrentCollectionName("atlas");
    const ids = await db
      .collection(currentCollectionName)
      .distinct("geo_id", filters);
    if (geoId.startsWith("P") || geoId === "R00") {
      ids.push("D988"); //Nouvelle-Caledonie
      ids.push("D987"); //Polynesie-Francaise
      ids.push("D986"); //Wallis-et-Futuna
      ids.push("D985"); //Saint-Pierre-et-Miquelon
      ids.push("D984"); //Saint-Barthelemy
      ids.push("D978"); //Saint-Martin
    }
    const polygons = [];
    for (let i = 0; i < ids.length; i++) {
      const polygon = await dbPaysage
        .collection("geographicalcategories")
        .find({ originalId: ids[i] })
        .toArray();
      if (polygon[0]) {
        polygons.push(polygon[0]);
      }
    }
    res.json(polygons);
  } else {
    const filter = {};
    let code = geoId; // communes + uucr
    let field = "com_code";
    if (geoId.startsWith("D")) {
      code = geoId.substring(1, 4);
      code = code.startsWith("0") ? code.substring(1) : code;
    }
    if (geoId.startsWith("U")) {
      field = "uucr_id";
    }
    code = `^${code}`;
    filter[field] = { $regex: code, $options: "i" };
    const allCities = await db
      .collection("citiesPolygons")
      .find(filter)
      .toArray();
    const polygons = allCities
      .filter((city) => city.geom?.geometry)
      .map((city) => ({
        geometry: city.geom?.geometry,
        nameFr: city.com_nom,
        originalId: city.com_code,
        parentOriginalId: city.uucr_id,
      }));
    res.json(polygons);
  }
});

router.route("/atlas/number-of-students-map").get(async (req, res) => {
  const currentCollectionName = await getCurrentCollectionName("atlas");
  const allData = {};
  db.collection(currentCollectionName)
    .find(req.query, { projection: { effectif: 1, geo_id: 1 } })
    .toArray()
    .then((data) => {
      allData.data = data.map((item) => ({
        effectif: item.effectif,
        geo_id: item.geo_id,
        // geo_nom: item.geo_nom,
        // sexe: item.sexe,
        // secteur: item.secteur,
        // secret: item.secret,
      }));

      const dataMap = [];
      mappingRegion.map((regionObject) => {
        const regionKey = Object.keys(regionObject)[0];
        const regionData = allData?.data.filter(
          (item) => item.geo_id === regionKey
        );
        let effectif = 0;
        regionData?.map((item) => {
          effectif += item.effectif;
        });

        dataMap.push([regionObject[regionKey], effectif]);
      });

      res.json(dataMap);
    });
});

router.route("/atlas/get-parents-from-geo-id").get(async (req, res) => {
  const geoId = req.query.geo_id;
  if (!geoId) {
    res.status(400).send("geo_id is required");
  }

  const currentCollectionName = await getCurrentCollectionName("atlas");

  const data = await db
    .collection(currentCollectionName)
    .aggregate([
      { $match: { geo_id: geoId } },
      { $limit: 1 },
      {
        $lookup: {
          from: currentCollectionName,
          localField: "aca_id",
          foreignField: "geo_id",
          as: "academie",
        },
      },
      {
        $project: {
          "academie.geo_nom": 1,
          aca_id: 1,
          dep_id: 1,
          geo_id: 1,
          geo_nom: 1,
          niveau_geo: 1,
          reg_id: 1,
          uucr_id: 1,
        },
      },
      {
        $lookup: {
          from: currentCollectionName,
          localField: "reg_id",
          foreignField: "geo_id",
          as: "region",
        },
      },
      {
        $project: {
          "academie.geo_nom": 1,
          "region.geo_nom": 1,
          aca_id: 1,
          dep_id: 1,
          geo_id: 1,
          geo_nom: 1,
          niveau_geo: 1,
          reg_id: 1,
          uucr_id: 1,
        },
      },
      {
        $lookup: {
          from: currentCollectionName,
          localField: "dep_id",
          foreignField: "geo_id",
          as: "departement",
        },
      },
      {
        $project: {
          "academie.geo_nom": 1,
          "departement.geo_nom": 1,
          "region.geo_nom": 1,
          aca_id: 1,
          dep_id: 1,
          geo_id: 1,
          geo_nom: 1,
          niveau_geo: 1,
          reg_id: 1,
          uucr_id: 1,
        },
      },
      {
        $lookup: {
          from: currentCollectionName,
          localField: "uucr_id",
          foreignField: "geo_id",
          as: "uu",
        },
      },
      {
        $project: {
          "academie.geo_nom": 1,
          "departement.geo_nom": 1,
          "region.geo_nom": 1,
          "uu.geo_nom": 1,
          aca_id: 1,
          dep_id: 1,
          geo_id: 1,
          geo_nom: 1,
          niveau_geo: 1,
          reg_id: 1,
          uucr_id: 1,
        },
      },
    ])
    .toArray();

  if (data.length === 0) {
    res.status(404).json({});
  }

  res.status(200).json({
    aca_id: data[0]?.aca_id,
    aca_nom: data[0]?.academie[0]?.geo_nom,
    dep_id: data[0]?.dep_id,
    dep_nom: data[0]?.departement[0]?.geo_nom,
    geo_id: data[0]?.geo_id,
    geo_nom: data[0]?.geo_nom,
    niveau_geo: data[0]?.niveau_geo,
    reg_id: data[0]?.reg_id,
    reg_nom: data[0]?.region[0]?.geo_nom,
    uu_id: data[0]?.uucr_id,
    uu_nom: data[0]?.uu[0]?.geo_nom,
  });
});

router
  .route("/atlas/number-of-students-historic-by-level")
  .get(async (req, res) => {
    const filters = { ...req.query };
    if (req.query.niveau_geo === "ACADEMIE") {
      filters.niveau_geo = "REGION";
    }
    if (req.query.niveau_geo === "DEPARTEMENT") {
      filters.niveau_geo = "ACADEMIE";
    }
    if (req.query.niveau_geo === "COMMUNE") {
      filters.niveau_geo = "DEPARTEMENT";
    }

    const currentCollectionName = await getCurrentCollectionName("atlas");
    const response = await db
      .collection(currentCollectionName)
      .findOne({ ...filters }, { projection: { geo_nom: 1 } });
    const levelName = response?.geo_nom || "France";

    let query = req.query;
    if (
      !req.query.geo_id &&
      !req.query.reg_id &&
      !req.query.dep_id &&
      !req.query.uucr_id &&
      !req.query.aca_id
    ) {
      // cas PAYS_100
      query = {
        geo_id: { $ne: "R99" }, // français à l'etrangers
        $or: [
          { geo_id: "D978" },
          { geo_id: "D986" },
          { geo_id: "D987" },
          { geo_id: "D988" },
          { niveau_geo: req.query.niveau_geo },
        ],
      };
    }

    db.collection(currentCollectionName)
      .find(query, {
        projection: {
          effectif: 1,
          geo_id: 1,
          geo_nom: 1,
          annee_universitaire: 1,
          regroupement: 1,
          _id: 0,
        },
      })
      .toArray()
      .then((data) => {
        const years = [
          ...new Set(data.map((item) => item.annee_universitaire)),
        ].sort((a, b) => {
          if (a > b) return 1;
          if (a < b) return -1;
          return 0;
        });

        const geoIds = [...new Set(data.map((item) => item.geo_id))];
        const dataByGeo = [];
        geoIds.map((geo_id) => {
          dataByGeo.push({
            geo_id, // ex: "A24"
            geo_nom: data.find((item) => item.geo_id === geo_id).geo_nom, // ex: "Créteil"
            data: years.map((year) => {
              return {
                annee_universitaire: year,
                effectif: data
                  .filter(
                    (item) =>
                      item.annee_universitaire === year &&
                      item.geo_id === geo_id &&
                      item.regroupement === "TOTAL"
                  )
                  ?.reduce((acc, item) => acc + item.effectif, 0),
              };
            }),
          });
        });

        res.json({
          level_nom: levelName, // ex: "Ile-de-France"
          data: dataByGeo,
        });
      });
  });

router
  .route("/atlas/number-of-students-by-gender-and-level")
  .get(async (req, res) => {
    const filters = { ...req.query };
    const constants = await getConstants();
    const DEFAULT_CURRENT_YEAR = constants.find(
      (el) => el.key === "DEFAULT_CURRENT_YEAR"
    )?.value;

    if (!req.query.annee_universitaire) {
      filters.annee_universitaire = DEFAULT_CURRENT_YEAR;
    }
    const currentCollectionName = await getCurrentCollectionName("atlas");
    const data = await db
      .collection(currentCollectionName)
      .aggregate([
        { $match: filters },
        {
          $group: {
            _id: {
              genre: "$sexe",
              regroupement: "$regroupement",
              rgp_formations_ou_etablissements:
                "$rgp_formations_ou_etablissements",
            },
            effectif: { $sum: "$effectif" },
          },
        },
        {
          $project: {
            _id: 0,
            genre: "$_id.genre",
            regroupement: "$_id.regroupement",
            effectif: 1,
            label: "$_id.rgp_formations_ou_etablissements",
          },
        },
        { $sort: { regroupement: 1 } },
        {
          $group: {
            _id: { regroupement: "$regroupement" },
            effectif_masculin: {
              $sum: { $cond: [{ $eq: ["$genre", "1"] }, "$effectif", 0] },
            },
            effectif_feminin: {
              $sum: { $cond: [{ $eq: ["$genre", "2"] }, "$effectif", 0] },
            },
            effectif_total: { $sum: "$effectif" },
            label: { $first: "$label" },
          },
        },
        {
          $project: {
            _id: 0,
            id: "$_id.regroupement",
            effectif_masculin: 1,
            effectif_feminin: 1,
            effectif_total: 1,
            label: 1,
          },
        },
      ])
      .toArray();

    const ret = [];
    filieresOrder.map((regroupementId) => {
      const datRegroupement = data.find((item) => item.id === regroupementId);
      if (datRegroupement) {
        ret.push(datRegroupement);
      }
    });

    res.json(ret);
  });

router
  .route("/atlas/number-of-students-by-sector-and-sublevel")
  .get(async (req, res) => {
    const filters = { ...req.query };
    const constants = await getConstants();
    const DEFAULT_CURRENT_YEAR = constants.find(
      (el) => el.key === "DEFAULT_CURRENT_YEAR"
    )?.value;

    if (!req.query.annee_universitaire) {
      filters.annee_universitaire = DEFAULT_CURRENT_YEAR;
    }
    filters.regroupement = "TOTAL";

    const currentCollectionName = await getCurrentCollectionName("atlas");

    const data = await db
      .collection(currentCollectionName)
      .aggregate([
        { $match: filters },
        {
          $group: {
            _id: {
              geo_id: "$geo_id",
              geo_nom: "$geo_nom",
              secteur: "$secteur",
            },
            effectif: { $sum: "$effectif" },
          },
        },
        {
          $project: {
            _id: 0,
            secteur: "$_id.secteur",
            geo_id: "$_id.geo_id",
            geo_nom: "$_id.geo_nom",
            effectif: 1,
          },
        },
        {
          $group: {
            _id: { geo_id: "$geo_id", geo_nom: "$geo_nom" },
            effectif_secteur_public: {
              $sum: { $cond: [{ $eq: ["$secteur", "PU"] }, "$effectif", 0] },
            },
            effectif_secteur_prive: {
              $sum: { $cond: [{ $eq: ["$secteur", "PR"] }, "$effectif", 0] },
            },
            effectif_total: { $sum: "$effectif" },
          },
        },
        {
          $project: {
            _id: 0,
            id: "$_id.geo_id",
            nom: "$_id.geo_nom",
            effectif_secteur_public: 1,
            effectif_secteur_prive: 1,
            effectif_total: 1,
          },
        },
        { $sort: { effectif_total: -1 } },
      ])
      .toArray();
    res.json(data);
  });

router
  .route("/atlas/number-of-students-by-gender-and-sublevel")
  .get(async (req, res) => {
    const filters = { ...req.query };
    const constants = await getConstants();
    const DEFAULT_CURRENT_YEAR = constants.find(
      (el) => el.key === "DEFAULT_CURRENT_YEAR"
    )?.value;

    if (!req.query.annee_universitaire) {
      filters.annee_universitaire = DEFAULT_CURRENT_YEAR;
    }

    const currentCollectionName = await getCurrentCollectionName("atlas");

    const data = await db
      .collection(currentCollectionName)
      .aggregate([
        { $match: filters },
        {
          $group: {
            _id: {
              geo_id: "$geo_id",
              geo_nom: "$geo_nom",
              sexe: "$sexe",
            },
            effectif: { $sum: "$effectif" },
          },
        },
        {
          $project: {
            _id: 0,
            sexe: "$_id.sexe",
            geo_id: "$_id.geo_id",
            geo_nom: "$_id.geo_nom",
            effectif: 1,
          },
        },
        {
          $group: {
            _id: { geo_id: "$geo_id", geo_nom: "$geo_nom" },
            effectif_feminin: {
              $sum: { $cond: [{ $eq: ["$sexe", "2"] }, "$effectif", 0] },
            },
            effectif_masculin: {
              $sum: { $cond: [{ $eq: ["$sexe", "1"] }, "$effectif", 0] },
            },
            effectif_total: { $sum: "$effectif" },
          },
        },
        {
          $project: {
            _id: 0,
            id: "$_id.geo_id",
            nom: "$_id.geo_nom",
            effectif_feminin: 1,
            effectif_masculin: 1,
            effectif_total: 1,
          },
        },
        { $sort: { effectif_total: -1 } },
      ])
      .toArray();
    res.json(data);
  });

router
  .route("/atlas/number-of-students-by-field-and-sublevel")
  .get(async (req, res) => {
    const filters = { ...req.query };
    const constants = await getConstants();
    const DEFAULT_CURRENT_YEAR = constants.find(
      (el) => el.key === "DEFAULT_CURRENT_YEAR"
    )?.value;

    if (!req.query.annee_universitaire) {
      filters.annee_universitaire = DEFAULT_CURRENT_YEAR;
    }

    const currentCollectionName = await getCurrentCollectionName("atlas");

    const data = await db
      .collection(currentCollectionName)
      .aggregate([
        { $match: filters },
        {
          $group: {
            _id: {
              geo_id: "$geo_id",
              geo_nom: "$geo_nom",
            },
            effectif: { $sum: "$effectif" },
          },
        },
        {
          $project: {
            _id: 0,
            geo_id: "$_id.geo_id",
            geo_nom: "$_id.geo_nom",
            effectif: 1,
          },
        },
        {
          $group: {
            _id: { geo_id: "$geo_id", geo_nom: "$geo_nom" },
            effectif_total: { $sum: "$effectif" },
          },
        },
        {
          $project: {
            _id: 0,
            id: "$_id.geo_id",
            nom: "$_id.geo_nom",
            effectif_total: 1,
          },
        },
        { $sort: { effectif_total: -1 } },
      ])
      .toArray();
    res.json(data);
  });

router.route("/atlas/number-of-students").get(async (req, res) => {
  const filters = { ...req.query };
  const constants = await getConstants();
  const DEFAULT_CURRENT_YEAR = constants.find(
    (el) => el.key === "DEFAULT_CURRENT_YEAR"
  )?.value;

  if (!req.query.annee_universitaire) {
    filters.annee_universitaire = DEFAULT_CURRENT_YEAR;
  }

  if (!req.query.geo_id) {
    filters.geo_id = "PAYS_100";
  }

  const allData = {};

  const currentCollectionName = await getCurrentCollectionName("atlas");

  db.collection(currentCollectionName)
    .find(filters)
    .toArray()
    .then(
      (response) => {
        allData.data = response.map((item) => ({
          effectif: item.effectif,
          geo_id: item.geo_id,
          geo_nom: item.geo_nom,
          secteur: item.secteur,
          secteur_de_l_etablissement: item.secteur_de_l_etablissement,
          regroupement: item.regroupement,
          rgp_formations_ou_etablissements:
            item.rgp_formations_ou_etablissements,
          gender: item.sexe,
          sexe_de_l_etudiant: item.sexe_de_l_etudiant,
          effectif_form_ens: item.effectif_form_ens,
          effectif_ing: item.effectif_ing,
          effectif_dut: item.effectif_dut,
          annee_universitaire: item.annee_universitaire,
        }));

        const data = {};
        data.geo_id = req.query.geo_id || "FRA";
        data.geo_nom = allData.data[0]?.geo_nom || "Unknown";
        data.annee_universitaire = filters.annee_universitaire;

        // Secteurs
        data.secteurs = [];
        data.secteurs.push({
          id: "PU",
          label: "Secteur public",
          value: allData.data
            .filter((item) => item.secteur === "PU")
            ?.reduce((acc, item) => acc + item.effectif, 0),
        });
        data.secteurs.push({
          id: "PR",
          label: "Secteur privé",
          value: allData.data
            .filter((item) => item.secteur === "PR")
            ?.reduce((acc, item) => acc + item.effectif, 0),
        });

        // Filieres
        data.filieres = [];
        filieresOrder.map((regroupementId) => {
          const datRegroupement = allData.data.filter(
            (item) => item.regroupement === regroupementId
          );
          datRegroupement
            .filter((item) => item.regroupement !== "TOTAL")
            .map((item) => {
              if (!data.filieres.find((el) => el.id === item.regroupement)) {
                const obj = {
                  id: item.regroupement, // ex: CPGE
                  label: item.rgp_formations_ou_etablissements,
                };
                obj[`effectif_${item.secteur}`] = item.effectif;

                data.filieres.push(obj);
              } else {
                if (
                  data.filieres.find(
                    (el) =>
                      el.id === item.regroupement &&
                      el[`effectif_${item.secteur}`]
                  )
                ) {
                  data.filieres.find((el) => el.id === item.regroupement)[
                    `effectif_${item.secteur}`
                  ] += item.effectif;
                } else {
                  data.filieres.find((el) => el.id === item.regroupement)[
                    `effectif_${item.secteur}`
                  ] = item.effectif;
                }

                data.filieres[item.regroupement] += item.effectif;
              }
            });
        });

        // Gender
        data.gender = [];
        data.gender.push({
          id: "1",
          label: allData.data.find((item) => item.gender === "1")
            ?.sexe_de_l_etudiant,
          value: allData.data
            .filter((item) => item.gender === "1")
            ?.reduce((acc, item) => acc + item.effectif, 0),
        });
        data.gender.push({
          id: "2",
          label: allData.data.find((item) => item.gender === "2")
            ?.sexe_de_l_etudiant,
          value: allData.data
            .filter((item) => item.gender === "2")
            ?.reduce((acc, item) => acc + item.effectif, 0),
        });

        // Effectif ing
        data.effectif_ing = allData.data.reduce(
          (acc, item) => acc + item.effectif_ing,
          0
        );

        // Effectif dut
        data.effectif_dut = allData.data.reduce(
          (acc, item) => acc + item.effectif_dut,
          0
        );

        // Effectif form ens
        data.effectif_form_ens = allData.data.reduce(
          (acc, item) => acc + item.effectif_form_ens,
          0
        );

        res.json(data);
      }
      // }
    );
});

router.route("/atlas/number-of-students-by-year").get(async (req, res) => {
  const filters = {};
  if (req.query.geo_id) {
    filters.geo_id = req.query.geo_id;
  } else {
    filters.geo_id = "PAYS_100";
  }
  if (req.query.regroupement) {
    filters.regroupement = req.query.regroupement;
  } else {
    filters.regroupement = "TOTAL";
  }

  const currentCollectionName = await getCurrentCollectionName("atlas");
  const constants = await getConstants();
  const START_YEAR = constants.find((el) => el.key === "START_YEAR")?.value;
  const END_YEAR = constants.find((el) => el.key === "END_YEAR")?.value;

  db.collection(currentCollectionName)
    .find(filters)
    .toArray()
    .then((data) => {
      const dataByYear = [];
      data.map((item) => {
        const index = dataByYear.findIndex(
          (el) => el.annee_universitaire === item.annee_universitaire
        );
        if (index === -1) {
          dataByYear.push({
            annee_universitaire: item.annee_universitaire,
            effectif_total: item.effectif,
            effectif_pr: item.secteur === "PR" ? item.effectif : 0,
            effectif_pu: item.secteur === "PU" ? item.effectif : 0,
            effectif_masculin: item.sexe === "1" ? item.effectif : 0,
            effectif_feminin: item.sexe === "2" ? item.effectif : 0,
            effectif_dut: item.effectif_dut,
            effectif_form_ens: item.effectif_form_ens,
            effectif_ing: item.effectif_ing,
          });
        } else {
          dataByYear[index].effectif_total += item.effectif;
          dataByYear[index].effectif_pr +=
            item.secteur === "PR" ? item.effectif : 0;
          dataByYear[index].effectif_pu +=
            item.secteur === "PU" ? item.effectif : 0;
          dataByYear[index].effectif_masculin +=
            item.sexe === "1" ? item.effectif : 0;
          dataByYear[index].effectif_feminin +=
            item.sexe === "2" ? item.effectif : 0;
          dataByYear[index].effectif_dut += item.effectif_dut;
          dataByYear[index].effectif_form_ens += item.effectif_form_ens;
          dataByYear[index].effectif_ing += item.effectif_ing;
        }
      });

      dataByYear.sort((a, b) => {
        if (a.annee_universitaire > b.annee_universitaire) return 1;
        if (a.annee_universitaire < b.annee_universitaire) return -1;
        return 0;
      });

      const range = [];
      for (let year = Number(START_YEAR); year <= Number(END_YEAR); year++) {
        range.push(year);
      }

      const dataByYearFull = [];
      for (let i = 0; i < range.length; i++) {
        const currentYear = `${range[i]}-${(range[i] + 1)
          .toString()
          .slice(-2)}`;
        if (!dataByYear.find((el) => el.annee_universitaire === currentYear)) {
          dataByYearFull.push({
            annee_universitaire: currentYear,
            effectif_total: 0,
            effectif_pr: 0,
            effectif_pu: 0,
            effectif_masculin: 0,
            effectif_feminin: 0,
            effectif_dut: 0,
            effectif_form_ens: 0,
            effectif_ing: 0,
          });
        } else {
          dataByYearFull.push(
            dataByYear.find((el) => el.annee_universitaire === currentYear)
          );
        }
      }

      res.json(dataByYearFull);
    });
});

router.route("/atlas/get-years").get(async (req, res) => {
  const currentCollectionName = await getCurrentCollectionName("atlas");

  db.collection(currentCollectionName)
    .distinct("annee_universitaire")
    .then((data) => {
      res.json(data);
    });
});

router.route("/atlas/get-filieres").get(async (req, res) => {
  const currentCollectionName = await getCurrentCollectionName("atlas");

  db.collection(currentCollectionName)
    .distinct("regroupement")
    .then((data) => {
      res.json(data);
    });
});

router.route("/atlas/get-filters-values").get(async (req, res) => {
  /*
  annees_universitaires_onlyData & annees_universitaires_all
  => permet de présenter toutes les années universitaires, 
  et de désactiver celles pour lesquelles il n'y a pas de données
  */
  let filters = {};
  if (req.query.geo_id) {
    filters = { geo_id: req.query.geo_id };
  }

  const currentCollectionName = await getCurrentCollectionName("atlas");
  const constants = await getConstants();
  const START_YEAR = constants.find((el) => el.key === "START_YEAR")?.value;
  const END_YEAR = constants.find((el) => el.key === "END_YEAR")?.value;

  const annees_universitaires_onlyData_temp = await db
    .collection(currentCollectionName)
    .distinct("annee_universitaire", filters);
  const annees_universitaires_all_temp = await db
    .collection(currentCollectionName)
    .distinct("annee_universitaire");

  // limiter aux années paramétrées
  const annees_universitaires_onlyData =
    annees_universitaires_onlyData_temp.filter((year) => {
      const yearNum = parseInt(year.substring(0, 4));
      return yearNum >= START_YEAR && yearNum <= END_YEAR;
    });
  const annees_universitaires_all = annees_universitaires_all_temp.filter(
    (year) => {
      const yearNum = parseInt(year.substring(0, 4));
      return yearNum >= START_YEAR && yearNum <= END_YEAR;
    }
  );

  const temp = await db
    .collection(currentCollectionName)
    .aggregate([
      {
        $group: {
          _id: {
            geoid: "$geo_id",
            geoname: "$geo_nom",
            geotype: "$niveau_geographique",
          },
        },
      },
    ])
    .toArray();

  const geo = {
    communes: temp
      .filter((item) => item._id.geotype === "Commune")
      .map((item) => ({ geo_id: item._id.geoid, geo_nom: item._id.geoname })),
    departements: temp
      .filter((item) => item._id.geotype === "Département")
      .map((item) => ({ geo_id: item._id.geoid, geo_nom: item._id.geoname })),
    academies: temp
      .filter((item) => item._id.geotype === "Académie")
      .map((item) => ({ geo_id: item._id.geoid, geo_nom: item._id.geoname })),
    regions: temp
      .filter((item) => item._id.geotype === "Région")
      .map((item) => ({ geo_id: item._id.geoid, geo_nom: item._id.geoname })),
    unites_urbaines: temp
      .filter((item) => item._id.geotype === "Unité urbaine")
      .map((item) => ({ geo_id: item._id.geoid, geo_nom: item._id.geoname })),
  };

  const data = {
    annees_universitaires: {
      all: annees_universitaires_all,
      onlyWithData: annees_universitaires_onlyData,
    },
    geo_id: geo,
  };
  res.json(data);
});

router.route("/atlas/get-references").get(async (req, res) => {
  const currentCollectionName = await getCurrentCollectionName("atlas");

  const response = await db
    .collection(currentCollectionName)
    .findOne({ ...req.query });
  const { niveau_geo } = response;

  const objMapping = {
    REGION: "reg_id",
    ACADEMIE: "aca_id",
    DEPARTEMENT: "dep_id",
    UNITE_URBAINE: "uu_id",
    COMMUNE: "com_id",
    PAYS: "geo_id",
  };

  const obj = {};
  obj.data = await db
    .collection(currentCollectionName)
    .aggregate([
      { $match: { [objMapping[niveau_geo]]: req.query.geo_id } },
      {
        $group: {
          _id: { geo_id: "$geo_id" },
          geo_nom: { $first: "$geo_nom" },
          niveau: { $first: "$niveau_geographique" },
          geo_id: { $first: "$geo_id" },
        },
      },
      { $project: { _id: 0 } },
      { $sort: { geo_nom: 1 } },
      {
        $group: {
          _id: { niveau: "$niveau" },
          data: { $push: "$$ROOT" },
        },
      },
      { $project: { "data.niveau": 0 } },
      { $project: { niveau: "$_id.niveau", data: 1, _id: 0 } },
    ])
    .toArray();

  res.json(obj);
});

router.route("/atlas/get-similar-elements").get(async (req, res) => {
  const filters = {};

  if (!req.query.niveau_geo) {
    res.status(400).send("niveau_geo is required");
  }
  if (!req.query.needle) {
    res.status(400).send("needle is required");
  }
  if (!req.query.gt) {
    res.status(400).send("gt is required");
  }
  if (!req.query.lt) {
    res.status(400).send("lt is required");
  }
  if (!req.query.annee_universitaire) {
    res.status(400).send("annee_universitaire is required");
  }

  filters.niveau_geo = req.query.niveau_geo;
  filters.annee_universitaire = req.query.annee_universitaire;

  filters[req.query.needle] = {
    $gt: parseInt(req.query.gt),
    $lt: parseInt(req.query.lt),
  };

  const currentCollectionName = await getCurrentCollectionName(
    "similar-elements"
  );

  db.collection(currentCollectionName)
    .find(filters)
    .toArray()
    .then((data) => {
      res.json(data);
    });
});

router.route("/atlas/get-indexes").get(async (req, res) => {
  const currentCollectionName = await getCurrentCollectionName(
    req.query.collectionId
  );

  const response = await db.collection(currentCollectionName).indexes();
  res.json(response);
});

export default router;
