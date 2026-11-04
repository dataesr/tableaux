import express from "express";

import { BadRequestError } from "../../../../commons/errors/index.js";
import { getCollection } from "../collections.js";

const router = new express.Router();

const MONDE = "MONDE";
const ENTITE_NATIONALE = "FR";
const DOMAINES = ["LS", "PE", "SH"];
// Textes de méthode d'erc_meta sur l'intensité de candidature, indicateur que le tableau n'affiche pas
const METHODE_NON_AFFICHEE = /^Intensité de candidature/;
const CODE_PATTERN = /^[A-Za-z0-9]+$/;
// En dessous de ce nombre de candidatures, un taux de succès ou une part est signalé comme peu fiable
const SEUIL_FIABILITE = 20;
// Identifiant ROR sans le préfixe https://ror.org/
const ROR_PATTERN = /^0[a-z0-9]{6}[0-9]{2}$/;

async function getMeta() {
  const meta = await (await getCollection("erc_meta")).findOne({}, { projection: { _id: 0, parametres: 0, controles: 0 } });
  return { ...meta, methode: meta.methode.filter((texte) => !METHODE_NON_AFFICHEE.test(texte)) };
}

function parseYear(value, name) {
  const year = Number.parseInt(value, 10);
  if (!Number.isInteger(year) || String(year) !== String(value)) {
    throw new BadRequestError(`${name} must be a year`);
  }
  return year;
}

// Filtres communs aux routes ERC, mêmes noms que la bibliométrie (plugins/tableaux/reference/url-parameters.md),
// plus `type_bourse` (codes séparés par des virgules ; absent = erc_meta.types_bourse_defaut).
// La période demandée est ramenée aux années d'appel disponibles ; `periode` est null si elles ne se recoupent pas.
function parseFilters(query, meta) {
  const { ror_id, year_min, year_max, discipline, domaine, type_bourse } = query;

  if (ror_id && !ROR_PATTERN.test(ror_id)) throw new BadRequestError("invalid ror_id");
  if (discipline && !CODE_PATTERN.test(discipline)) throw new BadRequestError("invalid discipline");
  if (domaine && !DOMAINES.includes(domaine)) throw new BadRequestError(`domaine must be one of ${DOMAINES.join(", ")}`);

  const codes = meta.types_bourse.map((type) => type.code);
  const types = type_bourse ? type_bourse.split(",") : meta.types_bourse_defaut;
  const inconnus = types.filter((type) => !codes.includes(type));
  if (inconnus.length) throw new BadRequestError(`type_bourse must be among ${codes.join(", ")}`);

  const annees = meta.annees;
  const debut = Math.max(year_min ? parseYear(year_min, "year_min") : annees[0], annees[0]);
  const fin = Math.min(year_max ? parseYear(year_max, "year_max") : annees.at(-1), annees.at(-1));

  const disciplineMatch = discipline ?? (domaine ? { $regex: `^${domaine}` } : undefined);
  return {
    entiteId: ror_id ?? ENTITE_NATIONALE,
    periode: debut <= fin ? [debut, fin] : null,
    types,
    disciplineMatch,
  };
}

function ratio(numerateur = 0, denominateur = 0) {
  return { valeur: denominateur ? numerateur / denominateur : null, numerateur, denominateur };
}

const SUMS_ERC = {
  nb_candidatures: { $sum: "$nb_candidatures" },
  nb_laureats: { $sum: "$nb_candidatures_retenues" },
};

// Effectifs ERC de l'entité et de MONDE (dénominateur des parts), par année d'appel
async function loadEffectifs({ entiteId, periode, types, disciplineMatch }) {
  const [debut, fin] = periode;
  const match = {
    entite_id: { $in: [entiteId, MONDE] },
    annee_appel: { $gte: debut, $lte: fin },
    type_bourse: { $in: types },
  };
  if (disciplineMatch) match.discipline_code = disciplineMatch;

  return (await getCollection("erc_effectifs"))
    .aggregate([{ $match: match }, { $group: { _id: { entite_id: "$entite_id", annee: "$annee_appel" }, ...SUMS_ERC } }])
    .toArray();
}

// Somme d'un effectif pour une entité, sur les années retenues
function somme(rows, entiteId, annees, champ) {
  return rows
    .filter((row) => row._id.entite_id === entiteId && annees.includes(row._id.annee))
    .reduce((total, row) => total + (row[champ] ?? 0), 0);
}

// On additionne d'abord, on divise ensuite : jamais de moyenne de parts (CONTRAT_DONNEES §4).
// Une part des lauréats supérieure à la part des candidatures traduit un taux de succès supérieur à la moyenne.
function computeIndicateurs(rows, entiteId, annees) {
  const candidatures = somme(rows, entiteId, annees, "nb_candidatures");
  const laureats = somme(rows, entiteId, annees, "nb_laureats");
  const candidaturesMonde = somme(rows, MONDE, annees, "nb_candidatures");
  const laureatsMonde = somme(rows, MONDE, annees, "nb_laureats");

  return {
    nb_candidatures: candidatures,
    nb_laureats: laureats,
    fiable: candidatures >= SEUIL_FIABILITE,
    taux_succes: ratio(laureats, candidatures),
    taux_succes_reference: ratio(laureatsMonde, candidaturesMonde),
    part_candidatures: ratio(candidatures, candidaturesMonde),
    part_laureats: ratio(laureats, laureatsMonde),
  };
}

function range([debut, fin]) {
  return Array.from({ length: fin - debut + 1 }, (_, index) => debut + index);
}

router.route("/suivi-recherche/financements/erc/meta").get(async (req, res) => {
  res.json(await getMeta());
});

// Chiffres clés de l'entité sur la période
router.route("/suivi-recherche/financements/erc/indicateurs").get(async (req, res) => {
  const meta = await getMeta();
  const filters = parseFilters(req.query, meta);
  if (!filters.periode) return res.json({ periode: null });

  const annees = range(filters.periode);
  const rows = await loadEffectifs(filters);
  return res.json({
    periode: filters.periode,
    seuil_fiabilite: SEUIL_FIABILITE,
    annees_provisoires: meta.annees_provisoires.filter((annee) => annees.includes(annee)),
    ...computeIndicateurs(rows, filters.entiteId, annees),
  });
});

// Mêmes indicateurs, année d'appel par année d'appel
router.route("/suivi-recherche/financements/erc/evolution").get(async (req, res) => {
  const meta = await getMeta();
  const filters = parseFilters(req.query, meta);
  if (!filters.periode) return res.json({ periode: null, annees: [] });

  const rows = await loadEffectifs(filters);
  return res.json({
    periode: filters.periode,
    seuil_fiabilite: SEUIL_FIABILITE,
    annees: range(filters.periode).map((annee) => ({
      annee_appel: annee,
      provisoire: meta.annees_provisoires.includes(annee),
      ...computeIndicateurs(rows, filters.entiteId, [annee]),
    })),
  });
});

export default router;
