import express from "express";

import { BadRequestError } from "../../../../commons/errors/index.js";
import { getCollection } from "../collections.js";

const router = new express.Router();

const CLASSEMENT = "erc";
const MONDE = "MONDE";
const PERIMETRES = ["toutes_revues_openalex", "revues_sjr"];
const DOMAINES = ["LS", "PE", "SH"];
const INDICATEURS = ["poids", "influence", "prestige"];
const CODE_PATTERN = /^[A-Za-z0-9]+$/;

function parseYear(value, name) {
  const year = Number.parseInt(value, 10);
  if (!Number.isInteger(year) || String(year) !== String(value)) {
    throw new BadRequestError(`${name} must be a year`);
  }
  return year;
}

// Filtres communs à toutes les routes d'indicateurs, validés une fois
function parseFilters(query, { withEntite = true, withDiscipline = true } = {}) {
  const { entite_id, perimetre, annee_debut, annee_fin, discipline_code, domaine_code, inclure_multidisciplinaires } = query;

  if (withEntite && (!entite_id || !CODE_PATTERN.test(entite_id))) throw new BadRequestError("entite_id is required");
  if (!PERIMETRES.includes(perimetre)) throw new BadRequestError(`perimetre must be one of ${PERIMETRES.join(", ")}`);
  const debut = parseYear(annee_debut, "annee_debut");
  const fin = parseYear(annee_fin, "annee_fin");
  if (debut > fin) throw new BadRequestError("annee_debut must be lower than or equal to annee_fin");
  if (discipline_code && !CODE_PATTERN.test(discipline_code)) throw new BadRequestError("invalid discipline_code");
  if (domaine_code && !DOMAINES.includes(domaine_code)) throw new BadRequestError(`domaine_code must be one of ${DOMAINES.join(", ")}`);

  const match = {
    perimetre,
    classement: CLASSEMENT,
    annee_publication: { $gte: debut, $lte: fin },
  };
  if (withEntite) match.entite_id = { $in: [entite_id, MONDE] };
  if (withDiscipline && discipline_code) match.discipline_code = discipline_code;
  else if (withDiscipline && domaine_code) match.discipline_code = { $regex: `^${domaine_code}` };

  return { entiteId: entite_id, debut, fin, match, multi: inclure_multidisciplinaires === "true" };
}

const SUMS = {
  nb_articles: { $sum: "$nb_articles" },
  nb_articles_top10_cites: { $sum: "$nb_articles_top10_cites" },
  nb_articles_revues_tete_disciplinaires: { $sum: "$nb_articles_revues_tete_disciplinaires" },
  nb_articles_revues_tete_multidisciplinaires: { $sum: "$nb_articles_revues_tete_multidisciplinaires" },
  influence_provisoire: { $max: "$influence_provisoire" },
};

function ratio(numerateur = 0, denominateur = 0) {
  return { valeur: denominateur ? numerateur / denominateur : null, numerateur, denominateur };
}

// On additionne d'abord, on divise ensuite : jamais de moyenne de parts (CONTRAT_DONNEES §4)
function computeIndicators(entite = {}, monde = {}, multi = false) {
  const prestige = (row) => (row.nb_articles_revues_tete_disciplinaires ?? 0)
    + (multi ? row.nb_articles_revues_tete_multidisciplinaires ?? 0 : 0);
  return {
    poids: ratio(entite.nb_articles, monde.nb_articles),
    influence: ratio(entite.nb_articles_top10_cites, monde.nb_articles_top10_cites),
    prestige: ratio(prestige(entite), prestige(monde)),
    influence_provisoire: Boolean(monde.influence_provisoire),
  };
}

// Périodes de départ et d'arrivée de la matrice : 1 à 3 années à chaque bout de la plage.
// Pour l'influence, on écarte les années provisoires tant qu'il en reste au moins deux.
function computePeriodes(debut, fin, annees, provisoires, consolidees) {
  let ans = annees.filter((annee) => annee >= debut && annee <= fin);
  if (consolidees) {
    const stables = ans.filter((annee) => !provisoires.includes(annee));
    if (stables.length >= 2) ans = stables;
  }
  if (ans.length < 2) return null;
  const k = Math.max(1, Math.min(3, Math.floor(ans.length / 2)));
  return { depart: [ans[0], ans[k - 1]], arrivee: [ans[ans.length - k], ans[ans.length - 1]] };
}

router.route("/suivi-recherche/bibliometrie/meta").get(async (req, res) => {
  const collection = await getCollection("biblio_meta");
  const meta = await collection.findOne({}, { projection: { _id: 0, parametres: 0 } });
  res.json(meta);
});

router.route("/suivi-recherche/bibliometrie/disciplines").get(async (req, res) => {
  const collection = await getCollection("biblio_disciplines");
  const disciplines = await collection
    .find({ classement: CLASSEMENT }, { projection: { _id: 0 } })
    .toArray();
  res.json(disciplines);
});

router.route("/suivi-recherche/bibliometrie/entites").get(async (req, res) => {
  const collection = await getCollection("entites");
  const entites = await collection
    .find(
      { selecteur: true },
      { projection: { _id: 0, entite_id: 1, entite_type: 1, nom: 1, sigle: 1, categorie: 1, ville: 1, recherche: 1, ordre_selecteur: 1 } },
    )
    .sort({ ordre_selecteur: 1, nb_articles: -1 })
    .toArray();
  res.json(entites);
});

router.route("/suivi-recherche/bibliometrie/indicateurs").get(async (req, res) => {
  const { entiteId, match, multi } = parseFilters(req.query);
  const collection = await getCollection("biblio_effectifs");
  const rows = await collection
    .aggregate([{ $match: match }, { $group: { _id: "$entite_id", ...SUMS } }])
    .toArray();

  const entite = rows.find((row) => row._id === entiteId);
  const monde = rows.find((row) => row._id === MONDE);
  res.json({ ...computeIndicators(entite, monde, multi), nb_articles: entite?.nb_articles ?? 0 });
});

router.route("/suivi-recherche/bibliometrie/evolution").get(async (req, res) => {
  const { entiteId, match, multi } = parseFilters(req.query);
  const collection = await getCollection("biblio_effectifs");
  const rows = await collection
    .aggregate([
      { $match: match },
      { $group: { _id: { entite_id: "$entite_id", annee_publication: "$annee_publication" }, ...SUMS } },
    ])
    .toArray();

  const years = [...new Set(rows.map((row) => row._id.annee_publication))].sort((a, b) => a - b);
  const find = (id, year) => rows.find((row) => row._id.entite_id === id && row._id.annee_publication === year);
  res.json(years.map((year) => ({
    annee_publication: year,
    ...computeIndicators(find(entiteId, year), find(MONDE, year), multi),
  })));
});

// Pays retenus pour la comparaison internationale (biblio_meta.pays_compares), année par année
router.route("/suivi-recherche/bibliometrie/comparaison-internationale").get(async (req, res) => {
  const { match, multi } = parseFilters(req.query, { withEntite: false });
  const meta = await (await getCollection("biblio_meta")).findOne({}, { projection: { pays_compares: 1 } });
  const pays = meta?.pays_compares ?? [];

  const [rows, noms] = await Promise.all([
    (await getCollection("biblio_effectifs"))
      .aggregate([
        { $match: { ...match, entite_id: { $in: [...pays, MONDE] } } },
        { $group: { _id: { entite_id: "$entite_id", annee_publication: "$annee_publication" }, ...SUMS } },
      ])
      .toArray(),
    (await getCollection("entites"))
      .find({ entite_id: { $in: pays } }, { projection: { _id: 0, entite_id: 1, nom: 1 } })
      .toArray(),
  ]);

  const years = [...new Set(rows.map((row) => row._id.annee_publication))].sort((a, b) => a - b);
  const find = (id, year) => rows.find((row) => row._id.entite_id === id && row._id.annee_publication === year);
  res.json(pays.flatMap((entiteId) => years.map((year) => ({
    entite_id: entiteId,
    nom: noms.find((item) => item.entite_id === entiteId)?.nom ?? entiteId,
    annee_publication: year,
    ...computeIndicators(find(entiteId, year), find(MONDE, year), multi),
  }))));
});

// Matrice niveau × dynamique : une ligne par discipline de l'entité
router.route("/suivi-recherche/bibliometrie/positionnement").get(async (req, res) => {
  const { entiteId, debut, fin, match, multi } = parseFilters(req.query, { withDiscipline: false });
  const { indicateur } = req.query;
  if (!INDICATEURS.includes(indicateur)) throw new BadRequestError(`indicateur must be one of ${INDICATEURS.join(", ")}`);

  const meta = await (await getCollection("biblio_meta")).findOne({}, { projection: { annees: 1, annees_influence_provisoire: 1 } });
  const provisoires = meta?.annees_influence_provisoire ?? [];
  const periodes = computePeriodes(debut, fin, meta?.annees ?? [], provisoires, indicateur === "influence");
  if (!periodes) throw new BadRequestError("the period must contain at least two years");

  const { depart, arrivee } = periodes;
  const [rows, disciplines] = await Promise.all([
    (await getCollection("biblio_effectifs"))
      .aggregate([
        { $match: { ...match, annee_publication: { $in: [...range(depart), ...range(arrivee)] } } },
        {
          $group: {
            _id: {
              entite_id: "$entite_id",
              discipline_code: "$discipline_code",
              periode: { $cond: [{ $lte: ["$annee_publication", depart[1]] }, "depart", "arrivee"] },
            },
            ...SUMS,
          },
        },
      ])
      .toArray(),
    (await getCollection("biblio_disciplines")).find({ classement: CLASSEMENT }, { projection: { _id: 0 } }).toArray(),
  ]);

  const sum = (id, periode, code) => rows
    .filter((row) => row._id.entite_id === id && row._id.periode === periode && (!code || row._id.discipline_code === code))
    .reduce((total, row) => {
      Object.keys(SUMS).forEach((key) => {
        total[key] = key === "influence_provisoire" ? total[key] || row[key] : (total[key] ?? 0) + (row[key] ?? 0);
      });
      return total;
    }, {});

  const reference = computeIndicators(sum(entiteId, "arrivee"), sum(MONDE, "arrivee"), multi)[indicateur];
  const points = disciplines.map((discipline) => {
    const code = discipline.discipline_code;
    const entiteArrivee = sum(entiteId, "arrivee", code);
    const niveau = computeIndicators(entiteArrivee, sum(MONDE, "arrivee", code), multi)[indicateur];
    const niveauDepart = computeIndicators(sum(entiteId, "depart", code), sum(MONDE, "depart", code), multi)[indicateur];
    const dynamique = niveauDepart.valeur && niveau.valeur !== null ? (niveau.valeur / niveauDepart.valeur - 1) * 100 : null;
    return { ...discipline, niveau, niveau_depart: niveauDepart, dynamique, nb_articles: entiteArrivee.nb_articles ?? 0 };
  });

  res.json({
    indicateur,
    periodes,
    provisoire: indicateur === "influence" && range(arrivee).some((annee) => provisoires.includes(annee)),
    reference,
    points,
  });
});

function range([start, end]) {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export default router;
