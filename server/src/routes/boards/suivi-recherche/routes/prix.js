import express from "express";

import { BadRequestError } from "../../../../commons/errors/index.js";
import { getCollection } from "../collections.js";
import { CODES_GROUPES, computePeriodes, loadGroupeEtablissements, median, shapeMatrice } from "../matrice.js";
import { getSourcesPrix } from "../sources.js";

// Prix et distinctions (athena : prix_meta, prix_catalogue, prix_effectifs, prix_effectifs_disciplines).
// Prix français seulement, sans candidatures : la France compte chaque lauréat une fois, un établissement compte
// les lauréats de toutes ses structures (tutelles comprises). Indicateur : nombre de nominations et part du total.

const router = new express.Router();

const ENTITE_NATIONALE = "FR";
const DOMAINES = ["LS", "PE", "SH"];
const CODE_PATTERN = /^[A-Za-z0-9]+$/;
const ROR_PATTERN = /^0[a-z0-9]{6}[0-9]{2}$/;
// Matrice : en dessous de ce nombre de nominations sur une des deux périodes, l'évolution de la part est peu fiable
const SEUIL_NOMINATIONS = 5;

async function getMeta() {
  const meta = await (await getCollection("prix_meta")).findOne({}, { projection: { _id: 0, parametres: 0, controles: 0 } });
  // Année du calcul : les prix de l'année en cours ne sont peut-être pas tous recensés
  const anneeCalcul = Number.parseInt(meta.date_calcul, 10);
  return { ...meta, annees_provisoires: meta.annees.filter((annee) => annee >= anneeCalcul) };
}

// Libellés des prix des groupes, dans l'ordre de prix_meta.groupes
async function getPrix(meta) {
  const ids = meta.groupes.flatMap(({ prix }) => prix);
  const catalogue = await (await getCollection("prix_catalogue"))
    .find({ prix_id: { $in: ids } }, { projection: { _id: 0, prix_id: 1, libelle: 1 } })
    .toArray();
  const libelles = new Map(catalogue.map(({ prix_id: id, libelle }) => [id, libelle]));
  return Object.fromEntries(meta.groupes.map(({ code, prix }) => [code, prix.map((id) => ({ prix_id: id, libelle: libelles.get(id) ?? id }))]));
}

function parseYear(value, name) {
  const year = Number.parseInt(value, 10);
  if (!Number.isInteger(year) || String(year) !== String(value)) throw new BadRequestError(`${name} must be a year`);
  return year;
}

// Mêmes paramètres que la bibliométrie et l'ERC (plugins/tableaux/reference/url-parameters.md),
// plus `distinction` : code d'un groupe de prix_meta.groupes (absent : tous les groupes, ou le groupe par défaut)
function parseFilters(query, meta) {
  const { ror_id, year_min, year_max, discipline, domaine, distinction } = query;
  if (ror_id && !ROR_PATTERN.test(ror_id)) throw new BadRequestError("invalid ror_id");
  if (discipline && !CODE_PATTERN.test(discipline)) throw new BadRequestError("invalid discipline");
  if (domaine && !DOMAINES.includes(domaine)) throw new BadRequestError(`domaine must be one of ${DOMAINES.join(", ")}`);
  const codes = meta.groupes.map(({ code }) => code);
  if (distinction && !codes.includes(distinction)) throw new BadRequestError(`distinction must be one of ${codes.join(", ")}`);

  const { annees } = meta;
  const debut = Math.max(year_min ? parseYear(year_min, "year_min") : annees[0], annees[0]);
  const fin = Math.min(year_max ? parseYear(year_max, "year_max") : annees.at(-1), annees.at(-1));
  return {
    distinction: distinction ?? meta.groupe_defaut,
    entiteId: ror_id ?? ENTITE_NATIONALE,
    periode: debut <= fin ? [debut, fin] : null,
    disciplineMatch: discipline ?? (domaine ? { $regex: `^${domaine}` } : undefined),
  };
}

function ratio(numerateur = 0, denominateur = 0) {
  return { valeur: denominateur ? numerateur / denominateur : null, numerateur, denominateur };
}

function range([debut, fin]) {
  return Array.from({ length: fin - debut + 1 }, (_, index) => debut + index);
}

// Nominations par entité, année et prix. Avec une discipline : lauréats dont c'est la discipline principale
// (prix_effectifs_disciplines, lauréats classés seulement) ; sinon tous les lauréats (prix_effectifs).
async function loadEffectifs({ disciplineMatch, periode }, prix, entiteIds) {
  const match = {
    entite_id: { $in: [...new Set([...entiteIds, ENTITE_NATIONALE])] },
    annee: { $gte: periode[0], $lte: periode[1] },
    prix_id: { $in: prix },
  };
  if (disciplineMatch) match.discipline_code = disciplineMatch;
  return (await getCollection(disciplineMatch ? "prix_effectifs_disciplines" : "prix_effectifs"))
    .aggregate([
      { $match: match },
      { $group: { _id: { entite_id: "$entite_id", annee: "$annee", prix_id: "$prix_id" }, nb: { $sum: "$nb_laureats" } } },
    ])
    .toArray();
}

// Nominations françaises sans discipline (non classées) : elles ne comptent que pour « Toutes disciplines »
async function loadNonClasses({ disciplineMatch, periode }, prix) {
  if (!disciplineMatch) return null;
  const total = async (nom) => (await (await getCollection(nom))
    .aggregate([
      { $match: { entite_id: ENTITE_NATIONALE, annee: { $gte: periode[0], $lte: periode[1] }, prix_id: { $in: prix } } },
      { $group: { _id: null, nb: { $sum: "$nb_laureats" } } },
    ])
    .toArray())[0]?.nb ?? 0;
  const [tous, classes] = await Promise.all([total("prix_effectifs"), total("prix_effectifs_disciplines")]);
  return { nb: tous - classes, total: tous };
}

function somme(rows, entiteId, annees, prix) {
  return rows
    .filter(({ _id }) => _id.entite_id === entiteId && annees.includes(_id.annee) && (!prix || prix.includes(_id.prix_id)))
    .reduce((total, row) => total + row.nb, 0);
}

// Nominations de l'entité, détail par prix, et part du total France (null pour la France)
function computeIndicateurs(rows, entiteId, annees, prix) {
  const ids = prix.map(({ prix_id: id }) => id);
  const nb = somme(rows, entiteId, annees, ids);
  return {
    nb_laureats: nb,
    par_prix: prix.map(({ prix_id: id, libelle }) => ({ prix_id: id, libelle, nb_laureats: somme(rows, entiteId, annees, [id]) })),
    part: entiteId === ENTITE_NATIONALE ? null : ratio(nb, somme(rows, ENTITE_NATIONALE, annees, ids)),
  };
}

function classer(ratios, entiteId) {
  const classees = ratios.filter(({ ratio: r }) => r.valeur !== null).sort((a, b) => b.ratio.valeur - a.ratio.valeur);
  const index = classees.findIndex(({ entite_id: id }) => id === entiteId);
  return { rang: index >= 0 ? index + 1 : null, nb: classees.length };
}

router.route("/suivi-recherche/financements/prix/meta").get(async (req, res) => {
  const meta = await getMeta();
  const prix = await getPrix(meta);
  res.json({
    annees: meta.annees,
    annees_provisoires: meta.annees_provisoires,
    groupes: meta.groupes.map(({ code, libelle }) => ({ code, libelle, prix: prix[code] })),
    groupe_defaut: meta.groupe_defaut,
    methode: meta.methode,
    sources: getSourcesPrix(meta),
  });
});

// Chiffres clés de l'entité sur la période, pour chaque groupe de prix
router.route("/suivi-recherche/financements/prix/indicateurs").get(async (req, res) => {
  const meta = await getMeta();
  const filters = parseFilters(req.query, meta);
  if (!filters.periode) return res.json({ periode: null });

  const prix = await getPrix(meta);
  const tousPrix = meta.groupes.flatMap(({ code }) => prix[code].map(({ prix_id: id }) => id));
  const annees = range(filters.periode);
  const [rows, nonClasses] = await Promise.all([
    loadEffectifs(filters, tousPrix, [filters.entiteId]),
    Promise.all(meta.groupes.map(({ code }) => loadNonClasses(filters, prix[code].map(({ prix_id: id }) => id)))),
  ]);
  return res.json({
    periode: filters.periode,
    annees_provisoires: meta.annees_provisoires.filter((annee) => annees.includes(annee)),
    groupes: meta.groupes.map(({ code, libelle }, index) => ({
      code,
      libelle,
      non_classes: nonClasses[index],
      ...computeIndicateurs(rows, filters.entiteId, annees, prix[code]),
    })),
  });
});

// Nominations d'un groupe de prix (`distinction`), année par année
router.route("/suivi-recherche/financements/prix/evolution").get(async (req, res) => {
  const meta = await getMeta();
  const filters = parseFilters(req.query, meta);
  if (!filters.periode) return res.json({ distinction: filters.distinction, periode: null, annees: [] });

  const prix = (await getPrix(meta))[filters.distinction];
  const ids = prix.map(({ prix_id: id }) => id);
  const [rows, nonClasses] = await Promise.all([loadEffectifs(filters, ids, [filters.entiteId]), loadNonClasses(filters, ids)]);
  return res.json({
    distinction: filters.distinction,
    periode: filters.periode,
    non_classes: nonClasses,
    prix,
    annees: range(filters.periode).map((annee) => ({
      annee,
      provisoire: meta.annees_provisoires.includes(annee),
      ...computeIndicateurs(rows, filters.entiteId, [annee], prix),
    })),
  });
});

// Établissements d'un groupe comparable : matrice niveau × dynamique, même grammaire que l'ERC et la bibliométrie.
// Niveau : part des nominations du groupe de prix (référence : médiane du groupe) ; dynamique : évolution relative
// entre deux périodes ; taille : nominations de la période d'arrivée. Rang de l'établissement choisi sur la période.
router.route("/suivi-recherche/financements/prix/positionnement-etablissements").get(async (req, res) => {
  const meta = await getMeta();
  const { groupe: groupeDemande } = req.query;
  if (groupeDemande && !CODES_GROUPES.includes(groupeDemande)) throw new BadRequestError(`groupe must be one of ${CODES_GROUPES.join(", ")}`);
  const filters = parseFilters(req.query, meta);
  const selectionId = req.query.ror_id ?? null;

  const { groupe, groupeSelection, groupes, membres } = await loadGroupeEtablissements(await getCollection("entites"), selectionId, groupeDemande);
  const contexte = { distinction: filters.distinction, groupe, groupes, groupe_selection: groupeSelection };
  const periodes = filters.periode
    ? computePeriodes(filters.periode[0], filters.periode[1], meta.annees, meta.annees_provisoires, true)
    : null;
  if (!periodes) return res.json({ ...contexte, periodes: null });

  const prix = (await getPrix(meta))[filters.distinction];
  const ids = prix.map(({ prix_id: id }) => id);
  const annees = range(filters.periode);
  const [rows, nonClasses] = await Promise.all([
    loadEffectifs(filters, ids, membres.map(({ entite_id: id }) => id)),
    loadNonClasses(filters, ids),
  ]);
  const part = (id, ans) => ratio(somme(rows, id, ans), somme(rows, ENTITE_NATIONALE, ans));

  const depart = range(periodes.depart);
  const arrivee = range(periodes.arrivee);
  const points = membres.map((etablissement) => {
    const id = etablissement.entite_id;
    const niveauArrivee = part(id, arrivee);
    const niveauDepart = part(id, depart);
    return {
      entite_id: id,
      nom: etablissement.nom,
      sigle: etablissement.sigle ?? null,
      categorie: etablissement.categorie,
      niveau: niveauArrivee,
      niveau_depart: niveauDepart,
      dynamique: niveauDepart.valeur && niveauArrivee.valeur !== null ? (niveauArrivee.valeur / niveauDepart.valeur - 1) * 100 : null,
      nb_laureats: niveauArrivee.numerateur,
      taille: niveauArrivee.numerateur,
      // Nominations les plus faibles des deux périodes, pour la fiabilité de l'évolution
      min_laureats: Math.min(niveauDepart.numerateur, niveauArrivee.numerateur),
      focus: id === selectionId,
    };
  });

  // Référence : médiane des parts des établissements représentés (pas de moyenne de parts)
  const representables = points.filter((p) => (p.niveau.valeur ?? 0) > 0 && p.dynamique !== null);
  const reference = { valeur: median(representables.map((p) => p.niveau.valeur)) };

  const parts = membres.map(({ entite_id: id }) => ({ entite_id: id, ratio: part(id, annees) }));
  const choisi = parts.find(({ entite_id: id }) => id === selectionId);

  return res.json({
    ...contexte,
    indicateur: "part_laureats",
    periode: filters.periode,
    periodes,
    non_classes: nonClasses,
    annees_provisoires: meta.annees_provisoires.filter((annee) => annees.includes(annee)),
    provisoire: arrivee.some((annee) => meta.annees_provisoires.includes(annee)),
    reference,
    seuil_fiabilite: SEUIL_NOMINATIONS,
    classement: choisi ? { nb_laureats: choisi.ratio.numerateur, part: { ratio: choisi.ratio, ...classer(parts, selectionId) } } : null,
    ...shapeMatrice(points, reference.valeur ?? 0, (p) => p.entite_id, (p) => p.min_laureats >= SEUIL_NOMINATIONS),
  });
});

export default router;
