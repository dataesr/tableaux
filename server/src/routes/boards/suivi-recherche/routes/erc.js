import express from "express";

import { BadRequestError } from "../../../../commons/errors/index.js";
import { getCollection } from "../collections.js";
import { CODES_GROUPES, loadGroupeEtablissements } from "../matrice.js";
import { computeAbscisses, computeRubans, DEMI_COLONNE, HAUTEUR } from "../rubans.js";
import { getSourcesBibliometrie, getSourcesErc } from "../sources.js";
import {
  computeTauxVivier,
  getContexteVivier,
  getMethodeVivier,
  getVivierMeta,
  loadVivierEffectifs,
  loadVivierEffectifsParDiscipline,
  shapeNuage,
  sommerEffectifs,
  VIVIER_DEFAUT,
  VIVIERS,
} from "../vivier.js";

const router = new express.Router();

const MONDE = "MONDE";
const ENTITE_NATIONALE = "FR";
const DOMAINES = ["LS", "PE", "SH"];
const CODE_PATTERN = /^[A-Za-z0-9]+$/;
// En dessous de ce nombre de candidatures (ou de porteurs candidats en mode pi), un taux de succès ou une part
// est signalé comme peu fiable
const SEUIL_FIABILITE = 20;
// Comptage en projets ou en porteurs (PI) : champs de chaque mode dans erc_meta.modes_comptage
const COMPTAGES = ["projets", "pi"];
const COMPTAGE_DEFAUT = "projets";
// Pays tiers de erc_meta.pays_compares : ils n'accueillent pas de bourse ERC, hors de la comparaison des pays
const PAYS_TIERS = ["US"];
// Identifiant ROR sans le préfixe https://ror.org/
const ROR_PATTERN = /^0[a-z0-9]{6}[0-9]{2}$/;

async function getMeta() {
  return (await getCollection("erc_meta")).findOne({}, { projection: { _id: 0, parametres: 0, controles: 0 } });
}

function parseYear(value, name) {
  const year = Number.parseInt(value, 10);
  if (!Number.isInteger(year) || String(year) !== String(value)) {
    throw new BadRequestError(`${name} must be a year`);
  }
  return year;
}

// Filtres communs aux routes ERC, mêmes noms que la bibliométrie (plugins/tableaux/reference/url-parameters.md),
// plus `type_bourse` (codes séparés par des virgules ; absent = erc_meta.types_bourse_defaut)
// `comptage` (`projets` ou `pi` ; absent = projets) et `vivier`, dénominateur du taux de candidature au vivier
// (`actifs` ou `top10` ; absent = actifs).
// La période demandée est ramenée aux années d'appel disponibles ; `periode` est null si elles ne se recoupent pas.
function parseFilters(query, meta) {
  const { ror_id, year_min, year_max, discipline, domaine, type_bourse, comptage = COMPTAGE_DEFAUT, vivier = VIVIER_DEFAUT } = query;

  if (ror_id && !ROR_PATTERN.test(ror_id)) throw new BadRequestError("invalid ror_id");
  if (discipline && !CODE_PATTERN.test(discipline)) throw new BadRequestError("invalid discipline");
  if (domaine && !DOMAINES.includes(domaine)) throw new BadRequestError(`domaine must be one of ${DOMAINES.join(", ")}`);
  if (!COMPTAGES.includes(comptage)) throw new BadRequestError(`comptage must be one of ${COMPTAGES.join(", ")}`);
  if (!(vivier in VIVIERS)) throw new BadRequestError(`vivier must be one of ${Object.keys(VIVIERS).join(", ")}`);

  const codes = meta.types_bourse.map((type) => type.code);
  const types = type_bourse ? type_bourse.split(",") : meta.types_bourse_defaut;
  const inconnus = types.filter((type) => !codes.includes(type));
  if (inconnus.length) throw new BadRequestError(`type_bourse must be among ${codes.join(", ")}`);

  const annees = meta.annees;
  const debut = Math.max(year_min ? parseYear(year_min, "year_min") : annees[0], annees[0]);
  const fin = Math.min(year_max ? parseYear(year_max, "year_max") : annees.at(-1), annees.at(-1));

  const disciplineMatch = discipline ?? (domaine ? { $regex: `^${domaine}` } : undefined);
  // Champs sommés pour le mode choisi : on ne mélange jamais projets et porteurs dans un ratio
  const [champCandidatures, champLaureats] = meta.modes_comptage[comptage];
  return {
    champs: { candidatures: champCandidatures, laureats: champLaureats },
    comptage,
    entiteId: ror_id ?? ENTITE_NATIONALE,
    periode: debut <= fin ? [debut, fin] : null,
    types,
    disciplineMatch,
    vivier,
  };
}

function ratio(numerateur = 0, denominateur = 0) {
  return { valeur: denominateur ? numerateur / denominateur : null, numerateur, denominateur };
}

// Effectifs ERC de l'entité, de MONDE (dénominateur des parts) et de la France (référence d'un établissement),
// par année d'appel, dans le mode de comptage choisi.
// Les clés restent nb_candidatures / nb_laureats quel que soit le mode.
// `entiteIds` : autres entités à charger (pays, établissements d'un groupe).
async function loadEffectifs({ champs, entiteId, periode, types, disciplineMatch }, entiteIds = [entiteId]) {
  const [debut, fin] = periode;
  const match = {
    entite_id: { $in: [...new Set([...entiteIds, MONDE, ENTITE_NATIONALE])] },
    annee_appel: { $gte: debut, $lte: fin },
    type_bourse: { $in: types },
  };
  if (disciplineMatch) match.discipline_code = disciplineMatch;

  return (await getCollection("erc_effectifs"))
    .aggregate([{
      $match: match,
    }, {
      $group: {
        _id: { entite_id: "$entite_id", annee: "$annee_appel" },
        nb_candidatures: { $sum: `$${champs.candidatures}` },
        nb_laureats: { $sum: `$${champs.laureats}` },
      },
    }])
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
    // Établissement sélectionné : la France sert aussi de référence (null quand l'entité est la France)
    taux_succes_france: entiteId === ENTITE_NATIONALE
      ? null
      : ratio(somme(rows, ENTITE_NATIONALE, annees, "nb_laureats"), somme(rows, ENTITE_NATIONALE, annees, "nb_candidatures")),
    part_candidatures: ratio(candidatures, candidaturesMonde),
    part_laureats: ratio(laureats, laureatsMonde),
  };
}

function range([debut, fin]) {
  return Array.from({ length: fin - debut + 1 }, (_, index) => debut + index);
}

// Pays comparés (pays tiers exclus : ils n'accueillent pas de bourse ERC)
function getPaysComparaison(meta) {
  return meta.pays_compares.filter((pays) => !PAYS_TIERS.includes(pays));
}

// Pays comparés présents dans le vivier : référence du taux de candidature au vivier
function getPaysVivier(meta, vivierMeta) {
  return getPaysComparaison(meta).filter((pays) => vivierMeta.pays.includes(pays));
}

router.route("/suivi-recherche/financements/erc/meta").get(async (req, res) => {
  const [meta, biblioMeta, vivierMeta] = await Promise.all([
    getMeta(),
    (await getCollection("biblio_meta")).findOne({}, { projection: { _id: 0, snapshot_openalex: 1 } }),
    getVivierMeta(),
  ]);
  res.json({
    ...meta,
    sources: getSourcesErc(meta),
    // Taux de candidature au vivier : null tant que les viviers ne sont pas activés dans l'administration du tableau
    vivier: vivierMeta && {
      periode: [vivierMeta.periode.annee_debut, vivierMeta.periode.annee_fin],
      annee_debut_recente: vivierMeta.periode.annee_debut_recente,
      methode: getMethodeVivier(vivierMeta, SEUIL_FIABILITE),
      // Chercheurs : auteurs OpenAlex
      sources: getSourcesBibliometrie(biblioMeta).filter(({ libelle }) => libelle === "OpenAlex"),
    },
  });
});

// Chiffres clés de l'entité sur la période
router.route("/suivi-recherche/financements/erc/indicateurs").get(async (req, res) => {
  const meta = await getMeta();
  const filters = parseFilters(req.query, meta);
  if (!filters.periode) return res.json({ comptage: filters.comptage, periode: null });

  const annees = range(filters.periode);
  const [rows, vivier] = await Promise.all([loadEffectifs(filters), loadVivierEntite(filters, meta)]);
  return res.json({
    comptage: filters.comptage,
    periode: filters.periode,
    seuil_fiabilite: SEUIL_FIABILITE,
    annees_provisoires: meta.annees_provisoires.filter((annee) => annees.includes(annee)),
    ...computeIndicateurs(rows, filters.entiteId, annees),
    vivier: vivier.calculer ? { ...vivier.contexte, ...vivier.calculer(range(vivier.contexte.appels)) } : vivier.contexte,
  });
});

// Taux de candidature au vivier de l'entité, de la France (pour un établissement) et de l'ensemble des pays comparés.
// `calculer(annees)` : taux sur des années d'appel retenues (null, avec la raison dans `contexte`, si non calculable).
async function loadVivierEntite(filters, meta) {
  const vivierMeta = await getVivierMeta();
  const contexte = getContexteVivier(filters, meta, vivierMeta);
  if (contexte.indisponible) return { contexte, calculer: null };
  const pays = getPaysVivier(meta, vivierMeta);
  const effectifs = await loadVivierEffectifs(filters, contexte, [...new Set([filters.entiteId, ENTITE_NATIONALE, ...pays])]);
  const calculer = (annees) => {
    const taux = (e) => computeTauxVivier(e, annees.length, SEUIL_FIABILITE);
    return {
      taux: taux(effectifs(filters.entiteId, annees)),
      france: filters.entiteId === ENTITE_NATIONALE ? null : taux(effectifs(ENTITE_NATIONALE, annees)),
      reference: taux(sommerEffectifs(effectifs, pays, annees)),
      nb_pays_reference: pays.length,
    };
  };
  return { contexte, calculer };
}

// Part de l'entité dans les effectifs de son ensemble, sur une année : la France pour un établissement, l'ensemble de
// l'ERC pour la France
function computePartsEnsemble(rows, entiteId, annee) {
  const ensemble = entiteId === ENTITE_NATIONALE ? MONDE : ENTITE_NATIONALE;
  const part = (champ) => ratio(somme(rows, entiteId, [annee], champ), somme(rows, ensemble, [annee], champ));
  return { candidatures: part("nb_candidatures"), laureats: part("nb_laureats") };
}

// Mêmes indicateurs, année d'appel par année d'appel
router.route("/suivi-recherche/financements/erc/evolution").get(async (req, res) => {
  const meta = await getMeta();
  const filters = parseFilters(req.query, meta);
  if (!filters.periode) return res.json({ comptage: filters.comptage, periode: null, annees: [] });

  const [rows, vivier] = await Promise.all([loadEffectifs(filters), loadVivierEntite(filters, meta)]);
  const annees = range(filters.periode);
  const appelsVivier = vivier.calculer ? range(vivier.contexte.appels) : [];
  return res.json({
    comptage: filters.comptage,
    periode: filters.periode,
    seuil_fiabilite: SEUIL_FIABILITE,
    // Ensemble des parts `part_ensemble` : la France pour un établissement, l'ensemble de l'ERC pour la France
    ensemble: filters.entiteId === ENTITE_NATIONALE ? "erc" : "france",
    // Contexte du taux de candidature au vivier (ou la raison de son absence)
    vivier: vivier.contexte,
    annees: annees.map((annee) => ({
      annee_appel: annee,
      provisoire: meta.annees_provisoires.includes(annee),
      ...computeIndicateurs(rows, filters.entiteId, [annee]),
      part_ensemble: computePartsEnsemble(rows, filters.entiteId, annee),
      // Taux de l'année (candidatures de l'année ÷ vivier fixe) ; null hors des appels de la période du vivier
      vivier: appelsVivier.includes(annee) ? vivier.calculer([annee]) : null,
    })),
  });
});

// Indicateurs des rubans et de la comparaison des pays, dans l'ordre du sélecteur de la page
const INDICATEURS_PAYS = ["part_laureats", "part_candidatures", "taux_succes"];

// Classement d'une entité parmi d'autres sur un ratio : rang 1 = valeur la plus forte ; entités sans valeur exclues
function classer(ratios, entiteId) {
  const classees = ratios.filter(({ ratio: r }) => r?.valeur !== null && r?.valeur !== undefined)
    .sort((a, b) => b.ratio.valeur - a.ratio.valeur);
  const index = classees.findIndex(({ entite_id: id }) => id === entiteId);
  return { rang: index >= 0 ? index + 1 : null, nb: classees.length };
}

// France et autres pays : rubans (rang de chaque pays, année d'appel par année d'appel) et rangs de la France
// sur la période. Pays de erc_meta.pays_compares, sauf pays tiers ; l'établissement choisi ne s'applique pas.
// `vivier` : rubans du taux de candidature au vivier, sur leurs propres années (appels de la période du vivier) et
// leurs propres pays (pays comparés présents dans le vivier), ou la raison de leur absence.
router.route("/suivi-recherche/financements/erc/comparaison-internationale").get(async (req, res) => {
  const meta = await getMeta();
  const filters = parseFilters({ ...req.query, ror_id: undefined }, meta);
  if (!filters.periode) return res.json({ comptage: filters.comptage, periode: null });

  const paysCodes = getPaysComparaison(meta);
  const annees = range(filters.periode);
  const [rows, noms, vivier] = await Promise.all([loadEffectifs(filters, paysCodes), loadNomsPays(paysCodes), loadVivierPays(filters, meta)]);
  const pays = paysCodes.map((id) => ({ entite_id: id, nom: noms.get(id) ?? id }));

  // Ratios d'un pays sur des années d'appel ; `fiable` accompagne chaque ratio (petits effectifs)
  const ratiosPays = (id, ans) => {
    const ind = computeIndicateurs(rows, id, ans);
    return {
      part_laureats: { ...ind.part_laureats, fiable: true },
      part_candidatures: { ...ind.part_candidatures, fiable: true },
      taux_succes: { ...ind.taux_succes, fiable: ind.fiable },
    };
  };
  const cellules = new Map(paysCodes.map((id) => [id, annees.map((annee) => ratiosPays(id, [annee]))]));
  const periode = new Map(paysCodes.map((id) => [id, ratiosPays(id, annees)]));
  const indicateurs = INDICATEURS_PAYS;

  return res.json({
    comptage: filters.comptage,
    periode: filters.periode,
    seuil_fiabilite: SEUIL_FIABILITE,
    annees,
    annees_provisoires: meta.annees_provisoires.filter((annee) => annees.includes(annee)),
    pays,
    geometrie: { hauteur: HAUTEUR, demi_colonne: DEMI_COLONNE, abscisses: computeAbscisses(annees) },
    indicateurs: Object.fromEntries(indicateurs.map((indicateur) => [
      indicateur,
      computeRubans(annees, pays, (id, j) => cellules.get(id)[j][indicateur]),
    ])),
    // Chiffres clés : valeur et rang de la France sur toute la période, pour chaque indicateur
    france: Object.fromEntries(indicateurs.map((indicateur) => {
      const ratios = paysCodes.map((id) => ({ entite_id: id, ratio: periode.get(id)[indicateur] }));
      return [indicateur, { ratio: periode.get(ENTITE_NATIONALE)?.[indicateur] ?? null, ...classer(ratios, ENTITE_NATIONALE) }];
    })),
    vivier,
  });
});

// Taux de candidature au vivier des pays : rubans année d'appel par année d'appel (candidatures de l'année ÷ vivier fixe),
// rang de la France et référence (ensemble des pays) sur tous les appels retenus
async function loadVivierPays(filters, meta) {
  const vivierMeta = await getVivierMeta();
  const contexte = getContexteVivier(filters, meta, vivierMeta);
  if (contexte.indisponible) return contexte;

  const paysCodes = getPaysVivier(meta, vivierMeta);
  const annees = range(contexte.appels);
  const [effectifs, noms] = await Promise.all([loadVivierEffectifs(filters, contexte, paysCodes), loadNomsPays(paysCodes)]);
  const pays = paysCodes.map((id) => ({ entite_id: id, nom: noms.get(id) ?? id }));
  // Taux d'une année : nb_annees = 1 ; de la période : nombre d'années d'appel retenues
  const taux = (e, ans) => computeTauxVivier(e, ans.length, SEUIL_FIABILITE);
  const periode = paysCodes.map((id) => ({ entite_id: id, ratio: taux(effectifs(id), annees) }));

  return {
    ...contexte,
    annees,
    pays,
    geometrie: { hauteur: HAUTEUR, demi_colonne: DEMI_COLONNE, abscisses: computeAbscisses(annees) },
    rubans: computeRubans(annees, pays, (id, j) => taux(effectifs(id, [annees[j]]), [annees[j]])),
    france: { ratio: taux(effectifs(ENTITE_NATIONALE), annees), ...classer(periode, ENTITE_NATIONALE) },
    reference: taux(sommerEffectifs(effectifs, paysCodes), annees),
  };
}

async function loadNomsPays(paysCodes) {
  const noms = await (await getCollection("entites"))
    .find({ entite_type: "pays", entite_id: { $in: paysCodes } }, { projection: { _id: 0, entite_id: 1, nom: 1 } })
    .toArray();
  return new Map(noms.map(({ entite_id: id, nom }) => [id, nom]));
}

// Rang de l'établissement choisi dans son groupe sur la période choisie : candidatures et lauréats (rang sur leur part
// du total français) et taux de succès (classé parmi les établissements d'au moins SEUIL_FIABILITE candidatures).
// null si l'établissement choisi n'est pas dans le groupe.
function classerEtablissement(rows, ids, selectionId, annees) {
  if (!ids.includes(selectionId)) return null;
  const effectifs = (id) => ({ candidatures: somme(rows, id, annees, "nb_candidatures"), laureats: somme(rows, id, annees, "nb_laureats") });
  const france = effectifs(ENTITE_NATIONALE);
  const etablissements = ids.map((id) => {
    const e = effectifs(id);
    return {
      entite_id: id,
      ...e,
      part_candidatures: ratio(e.candidatures, france.candidatures),
      part_laureats: ratio(e.laureats, france.laureats),
      taux_succes: ratio(e.laureats, e.candidatures),
    };
  });
  const rang = (liste, cle) => classer(liste.map((e) => ({ entite_id: e.entite_id, ratio: e[cle] })), selectionId);
  const choisi = etablissements.find(({ entite_id: id }) => id === selectionId);
  return {
    nb_candidatures: choisi.candidatures,
    nb_laureats: choisi.laureats,
    part_candidatures: { ratio: choisi.part_candidatures, ...rang(etablissements, "part_candidatures") },
    part_laureats: { ratio: choisi.part_laureats, ...rang(etablissements, "part_laureats") },
    taux_succes: {
      ratio: choisi.taux_succes,
      fiable: choisi.candidatures >= SEUIL_FIABILITE,
      ...rang(etablissements.filter(({ candidatures }) => candidatures >= SEUIL_FIABILITE), "taux_succes"),
    },
  };
}

// Nuage à quadrants taux de candidature au vivier × taux de succès des établissements d'un groupe, coupé aux médianes
// du groupe ; taille : lauréats. Mêmes appels (période du vivier) et mêmes panels pour les deux axes. Le contexte
// seul (avec la raison) si le taux n'est pas calculable.
async function loadNuageVivier(filters, meta, membres, selectionId) {
  const contexte = getContexteVivier(filters, meta, await getVivierMeta());
  if (contexte.indisponible) return contexte;

  const ids = membres.map(({ entite_id: id }) => id);
  const effectifs = await loadVivierEffectifs(filters, contexte, [...ids, ENTITE_NATIONALE]);
  const taux = (e) => computeTauxVivier(e, contexte.nb_annees, SEUIL_FIABILITE);
  const points = membres.map((etablissement) => {
    const e = effectifs(etablissement.entite_id);
    return {
      entite_id: etablissement.entite_id,
      nom: etablissement.nom,
      sigle: etablissement.sigle ?? null,
      categorie: etablissement.categorie,
      candidature: taux(e),
      succes: ratio(e.laureats, e.candidatures),
      nb_chercheurs: e.chercheurs,
      taille: e.laureats,
      fiable: e.candidatures >= SEUIL_FIABILITE,
      focus: etablissement.entite_id === selectionId,
    };
  });

  // Rang de l'établissement choisi sur le taux de candidature, parmi les établissements du groupe qui ont un vivier
  const classes = points.filter((p) => p.candidature.valeur !== null).sort((a, b) => b.candidature.valeur - a.candidature.valeur);
  const index = classes.findIndex((p) => p.focus);
  const france = effectifs(ENTITE_NATIONALE);

  return {
    ...contexte,
    comptage: filters.comptage,
    seuil_fiabilite: SEUIL_FIABILITE,
    ...shapeNuage(points, (p) => p.entite_id),
    // Repères cités dans le commentaire : France entière
    france: { candidature: taux(france), succes: ratio(france.laureats, france.candidatures) },
    classement: index >= 0 ? { rang: index + 1, nb: classes.length, point: classes[index] } : null,
  };
}

// Établissements d'un groupe comparable : rangs de l'établissement choisi sur la période choisie (chiffres clés) et
// nuage à quadrants taux de candidature au vivier × taux de succès (`vivier`)
router.route("/suivi-recherche/financements/erc/etablissements").get(async (req, res) => {
  const { groupe: groupeDemande } = req.query;
  if (groupeDemande && !CODES_GROUPES.includes(groupeDemande)) throw new BadRequestError(`groupe must be one of ${CODES_GROUPES.join(", ")}`);
  const meta = await getMeta();
  const filters = parseFilters(req.query, meta);
  const selectionId = req.query.ror_id ?? null;

  const { groupe, groupeSelection, groupes, membres } = await loadGroupeEtablissements(await getCollection("entites"), selectionId, groupeDemande);
  const contexte = { comptage: filters.comptage, groupe, groupes, groupe_selection: groupeSelection };
  if (!filters.periode) return res.json({ ...contexte, periode: null });

  const annees = range(filters.periode);
  const ids = membres.map(({ entite_id: id }) => id);
  const [rows, vivier] = await Promise.all([loadEffectifs(filters, ids), loadNuageVivier(filters, meta, membres, selectionId)]);

  return res.json({
    ...contexte,
    periode: filters.periode,
    annees_provisoires: meta.annees_provisoires.filter((annee) => annees.includes(annee)),
    seuil_fiabilite: SEUIL_FIABILITE,
    classement: classerEtablissement(rows, ids, selectionId, annees),
    vivier,
  });
});

// Nuage à quadrants des disciplines de l'entité : taux de candidature au vivier × taux de succès, discipline (panel ERC)
// par discipline, coupé aux médianes des disciplines ; taille : lauréats. Mêmes appels (période du vivier) et mêmes
// panels pour les deux axes. `entite` : l'entité toutes disciplines, repère cité dans le commentaire.
async function loadNuageDisciplines(filters, meta) {
  const contexte = getContexteVivier(filters, meta, await getVivierMeta());
  if (contexte.indisponible) return contexte;

  const [effectifs, disciplines] = await Promise.all([
    loadVivierEffectifsParDiscipline(filters, contexte, filters.entiteId),
    (await getCollection("biblio_disciplines")).find({ classement: "erc" }, { projection: { _id: 0, classement: 0 } }).toArray(),
  ]);
  const taux = (e) => computeTauxVivier(e, contexte.nb_annees, SEUIL_FIABILITE);
  const vide = { candidatures: 0, laureats: 0, chercheurs: 0 };
  const points = disciplines.map((discipline) => {
    const e = effectifs.get(discipline.discipline_code) ?? vide;
    return {
      ...discipline,
      candidature: taux(e),
      succes: ratio(e.laureats, e.candidatures),
      nb_chercheurs: e.chercheurs,
      taille: e.laureats,
      fiable: e.candidatures >= SEUIL_FIABILITE,
    };
  });
  const total = [...effectifs.values()].reduce((somme, e) => ({
    candidatures: somme.candidatures + e.candidatures,
    laureats: somme.laureats + e.laureats,
    chercheurs: somme.chercheurs + e.chercheurs,
  }), vide);

  return {
    ...contexte,
    comptage: filters.comptage,
    seuil_fiabilite: SEUIL_FIABILITE,
    ...shapeNuage(points, (p) => p.discipline_code, "Médiane des disciplines"),
    entite: { candidature: taux(total), succes: ratio(total.laureats, total.candidatures) },
  };
}

// Disciplines de l'entité (France ou établissement) : nuage à quadrants taux de candidature au vivier × taux de succès.
// Le filtre de discipline ne s'applique pas : chaque point est une discipline.
router.route("/suivi-recherche/financements/erc/disciplines").get(async (req, res) => {
  const meta = await getMeta();
  const filters = { ...parseFilters(req.query, meta), disciplineMatch: undefined };
  if (!filters.periode) return res.json({ comptage: filters.comptage, periode: null });
  return res.json({ comptage: filters.comptage, periode: filters.periode, vivier: await loadNuageDisciplines(filters, meta) });
});

export default router;
