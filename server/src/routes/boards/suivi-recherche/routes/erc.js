import express from "express";

import { BadRequestError } from "../../../../commons/errors/index.js";
import { getCollection } from "../collections.js";
import {
  computeIndices,
  computeTauxReference,
  DECALAGE,
  getAnneesVivier,
  getPaysReference,
  getTypesAvecPanel,
  loadIndiceEffectifs,
  VIVIER_DEFAUT,
  VIVIERS,
} from "../erc-indice.js";
import { computePeriodes, GROUPE_AUTRES, GROUPE_PAR_DEFAUT, GROUPES_ETABLISSEMENTS, groupeOf, median, shapeMatrice } from "../matrice.js";
import { computeAbscisses, computeRubans, DEMI_COLONNE, HAUTEUR } from "../rubans.js";

const router = new express.Router();

const MONDE = "MONDE";
const ENTITE_NATIONALE = "FR";
const DOMAINES = ["LS", "PE", "SH"];
const CODE_PATTERN = /^[A-Za-z0-9]+$/;
// En dessous de ce nombre de candidatures (ou de porteurs candidats en mode pi), un taux de succès ou une part
// est signalé comme peu fiable
const SEUIL_FIABILITE = 20;
// Matrice des établissements : en dessous de ce nombre de lauréats sur une des deux périodes, l'évolution de la part
// des lauréats est peu fiable (2 → 4 lauréats = +100 %)
const SEUIL_LAUREATS = 10;
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

// Méthode de l'indice de candidature, calculé par ce tableau (erc-indice.js) et non par athena
function getMethodeIndice(meta) {
  const reference = getPaysReference(meta);
  return [
    "Indice de candidature : candidatures observées / candidatures attendues. Les candidatures attendues sont celles "
      + "qu'aurait l'entité si elle candidatait comme la référence, discipline par discipline : pour chaque panel et "
      + "chaque appel, ses articles × (candidatures / articles des pays de référence). Au-dessus de 1, l'entité candidate "
      + "plus que la référence pour son vivier ; au-dessous, moins (signe possible d'auto-censure).",
    `Vivier : articles parus dans les revues classées SJR les ${DECALAGE} années précédant l'appel (2020 à 2022 pour `
      + "l'appel 2023). Par défaut, seuls les articles du top 10 % des plus cités de leur discipline comptent : l'ERC "
      + "sélectionne l'excellence. Le top 10 % est provisoire pour les années dont la fenêtre de citation n'est pas close.",
    `Référence : les ${reference.length} pays de l'Union européenne parmi les pays comparés (${reference.join(", ")}). `
      + "La Suisse et le Royaume-Uni ont été exclus de certains appels, et les pays tiers n'accueillent pas de bourse ERC : "
      + "ils sont affichés mais ne font pas partie de la référence.",
    "Décomposition : indice des lauréats (lauréats / lauréats attendus) = indice de candidature × indice de réussite "
      + "(taux de succès / taux de succès attendu avec le profil disciplinaire de l'entité).",
    "Seules les bourses avec panel (Starting, Consolidator, Advanced) entrent dans l'indice ; Synergy et Proof of Concept "
      + `n'ont pas de discipline. Un indice est peu fiable sous ${SEUIL_FIABILITE} candidatures attendues.`,
    "Limite : l'indice mesure un écart de volume, pas un potentiel. Un taux de succès élevé avec peu de candidatures peut "
      + "aussi refléter une présélection efficace ; davantage de candidatures ferait alors baisser le taux de succès.",
  ];
}

// Années de publication dont le top 10 % des plus cités est provisoire (fenêtre de citation pas close)
async function getAnneesInfluenceProvisoire() {
  const meta = await (await getCollection("biblio_meta")).findOne({}, { projection: { _id: 0, annees_influence_provisoire: 1 } });
  return meta?.annees_influence_provisoire ?? [];
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
// `comptage` (`projets` ou `pi` ; absent = projets) et `vivier` (`top10` ou `articles` ; absent = top10).
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

// Indice de candidature (erc-indice.js) : contexte commun aux routes. `null` si aucun type avec panel n'est retenu.
async function loadIndices(filters, meta, entiteIds) {
  const typesPanel = getTypesAvecPanel(meta, filters.types);
  if (!typesPanel.length) return null;
  const paysReference = getPaysReference(meta);
  const [effectifs, anneesInfluenceProvisoire] = await Promise.all([
    loadIndiceEffectifs(filters, typesPanel, [...new Set([...entiteIds, ...paysReference])], filters.vivier),
    getAnneesInfluenceProvisoire(),
  ]);
  return {
    // Vivier provisoire : top 10 % d'une année de publication dont la fenêtre de citation n'est pas close
    vivierProvisoire: (annees) => filters.vivier === "top10"
      && annees.some((appel) => getAnneesVivier(appel).some((annee) => anneesInfluenceProvisoire.includes(annee))),
    compute: (entiteId, annees) => computeIndices(effectifs, entiteId, annees, paysReference, SEUIL_FIABILITE),
    tauxReference: (annees) => computeTauxReference(effectifs, paysReference, annees),
    contexte: { pays_reference: paysReference, types_indice: typesPanel, vivier: filters.vivier },
  };
}

router.route("/suivi-recherche/financements/erc/meta").get(async (req, res) => {
  const meta = await getMeta();
  res.json({ ...meta, methode_indice: getMethodeIndice(meta) });
});

// Chiffres clés de l'entité sur la période
router.route("/suivi-recherche/financements/erc/indicateurs").get(async (req, res) => {
  const meta = await getMeta();
  const filters = parseFilters(req.query, meta);
  if (!filters.periode) return res.json({ comptage: filters.comptage, periode: null });

  const annees = range(filters.periode);
  const [rows, indices] = await Promise.all([loadEffectifs(filters), loadIndices(filters, meta, [filters.entiteId])]);
  return res.json({
    comptage: filters.comptage,
    periode: filters.periode,
    seuil_fiabilite: SEUIL_FIABILITE,
    annees_provisoires: meta.annees_provisoires.filter((annee) => annees.includes(annee)),
    ...computeIndicateurs(rows, filters.entiteId, annees),
    indices: indices && {
      ...indices.contexte,
      ...indices.compute(filters.entiteId, annees),
      vivier_provisoire: indices.vivierProvisoire(annees),
    },
  });
});

// Mêmes indicateurs, année d'appel par année d'appel
router.route("/suivi-recherche/financements/erc/evolution").get(async (req, res) => {
  const meta = await getMeta();
  const filters = parseFilters(req.query, meta);
  if (!filters.periode) return res.json({ comptage: filters.comptage, periode: null, annees: [] });

  const [rows, indices] = await Promise.all([loadEffectifs(filters), loadIndices(filters, meta, [filters.entiteId])]);
  return res.json({
    comptage: filters.comptage,
    periode: filters.periode,
    seuil_fiabilite: SEUIL_FIABILITE,
    indices: indices?.contexte ?? null,
    annees: range(filters.periode).map((annee) => ({
      annee_appel: annee,
      provisoire: meta.annees_provisoires.includes(annee),
      ...computeIndicateurs(rows, filters.entiteId, [annee]),
      indices: indices && { ...indices.compute(filters.entiteId, [annee]), vivier_provisoire: indices.vivierProvisoire([annee]) },
    })),
  });
});

// Indicateurs des rubans et de la comparaison des pays, dans l'ordre du sélecteur de la page
const INDICATEURS_PAYS = ["part_laureats", "part_candidatures", "taux_succes", "indice_candidature"];

// Classement d'une entité parmi d'autres sur un ratio : rang 1 = valeur la plus forte ; entités sans valeur exclues
function classer(ratios, entiteId) {
  const classees = ratios.filter(({ ratio: r }) => r?.valeur !== null && r?.valeur !== undefined)
    .sort((a, b) => b.ratio.valeur - a.ratio.valeur);
  const index = classees.findIndex(({ entite_id: id }) => id === entiteId);
  return { rang: index >= 0 ? index + 1 : null, nb: classees.length };
}

// France et autres pays : rubans (rang de chaque pays, année d'appel par année d'appel) et rangs de la France
// sur la période. Pays de erc_meta.pays_compares, sauf pays tiers ; l'établissement choisi ne s'applique pas.
router.route("/suivi-recherche/financements/erc/comparaison-internationale").get(async (req, res) => {
  const meta = await getMeta();
  const filters = parseFilters({ ...req.query, ror_id: undefined }, meta);
  if (!filters.periode) return res.json({ comptage: filters.comptage, periode: null });

  const paysCodes = meta.pays_compares.filter((pays) => !PAYS_TIERS.includes(pays));
  const annees = range(filters.periode);
  const [rows, indices, noms] = await Promise.all([
    loadEffectifs(filters, paysCodes),
    loadIndices(filters, meta, paysCodes),
    (await getCollection("entites"))
      .find({ entite_type: "pays", entite_id: { $in: paysCodes } }, { projection: { _id: 0, entite_id: 1, nom: 1 } })
      .toArray(),
  ]);
  const nomById = new Map(noms.map(({ entite_id: id, nom }) => [id, nom]));
  const pays = paysCodes.map((id) => ({ entite_id: id, nom: nomById.get(id) ?? id, reference: indices?.contexte.pays_reference.includes(id) ?? false }));

  // Ratios d'un pays sur des années d'appel ; `fiable` accompagne chaque ratio (petits effectifs)
  const ratiosPays = (id, ans) => {
    const ind = computeIndicateurs(rows, id, ans);
    const indice = indices?.compute(id, ans);
    return {
      part_laureats: { ...ind.part_laureats, fiable: true },
      part_candidatures: { ...ind.part_candidatures, fiable: true },
      taux_succes: { ...ind.taux_succes, fiable: ind.fiable },
      indice_candidature: indice ? { ...indice.candidature, fiable: indice.fiable } : null,
    };
  };
  const cellules = new Map(paysCodes.map((id) => [id, annees.map((annee) => ratiosPays(id, [annee]))]));
  const periode = new Map(paysCodes.map((id) => [id, ratiosPays(id, annees)]));
  const indicateurs = INDICATEURS_PAYS.filter((indicateur) => indicateur !== "indice_candidature" || indices);

  return res.json({
    ...(indices?.contexte ?? {}),
    comptage: filters.comptage,
    periode: filters.periode,
    seuil_fiabilite: SEUIL_FIABILITE,
    annees,
    annees_provisoires: meta.annees_provisoires.filter((annee) => annees.includes(annee)),
    vivier_provisoire: indices?.vivierProvisoire(annees) ?? false,
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
  });
});

const INDICATEURS_MATRICE = ["part_laureats", "taux_succes"];

// Établissements d'un groupe comparable : matrice niveau × dynamique (même grammaire que la bibliométrie) et rangs
// de l'établissement choisi sur la période.
// Niveau : part des lauréats ERC français (référence : médiane du groupe) ou taux de succès (référence : France).
// Dynamique : évolution relative du niveau entre deux périodes d'appels consolidés. Taille : lauréats de la période d'arrivée.
router.route("/suivi-recherche/financements/erc/positionnement-etablissements").get(async (req, res) => {
  const meta = await getMeta();
  const { indicateur = INDICATEURS_MATRICE[0], groupe: groupeDemande } = req.query;
  if (!INDICATEURS_MATRICE.includes(indicateur)) throw new BadRequestError(`indicateur must be one of ${INDICATEURS_MATRICE.join(", ")}`);
  const groupesValides = [...GROUPES_ETABLISSEMENTS, GROUPE_AUTRES].map(({ code }) => code);
  if (groupeDemande && !groupesValides.includes(groupeDemande)) throw new BadRequestError(`groupe must be one of ${groupesValides.join(", ")}`);
  const filters = parseFilters(req.query, meta);
  const selectionId = req.query.ror_id ?? null;

  const etablissements = (await (await getCollection("entites"))
    .find({ selecteur: true, entite_type: "etablissement" }, { projection: { _id: 0, entite_id: 1, nom: 1, sigle: 1, categorie: 1 } })
    .toArray())
    .map((etablissement) => ({ ...etablissement, groupe: groupeOf(etablissement.categorie) }));
  // Sans groupe demandé : celui de l'établissement sélectionné, sinon les universités
  const groupeSelection = etablissements.find(({ entite_id: id }) => id === selectionId)?.groupe ?? null;
  const groupe = groupeDemande ?? groupeSelection ?? GROUPE_PAR_DEFAUT;
  const membres = etablissements.filter((etablissement) => etablissement.groupe === groupe);
  const groupes = [...GROUPES_ETABLISSEMENTS, GROUPE_AUTRES]
    .map(({ code, libelle }) => ({ code, libelle, nb: etablissements.filter((etablissement) => etablissement.groupe === code).length }))
    .filter(({ nb }) => nb > 0);
  const contexte = { comptage: filters.comptage, indicateur, groupe, groupes, groupe_selection: groupeSelection };

  // Années d'appel consolidées de la période choisie, en deux périodes
  const periodes = filters.periode
    ? computePeriodes(filters.periode[0], filters.periode[1], meta.annees, meta.annees_provisoires, true)
    : null;
  if (!periodes) return res.json({ ...contexte, periodes: null });

  const annees = range(filters.periode);
  const rows = await loadEffectifs(filters, membres.map(({ entite_id: id }) => id));
  const effectifs = (id, ans) => ({
    candidatures: somme(rows, id, ans, "nb_candidatures"),
    laureats: somme(rows, id, ans, "nb_laureats"),
  });
  const niveau = (id, ans) => {
    const e = effectifs(id, ans);
    return indicateur === "taux_succes" ? ratio(e.laureats, e.candidatures) : ratio(e.laureats, effectifs(ENTITE_NATIONALE, ans).laureats);
  };

  const depart = range(periodes.depart);
  const arrivee = range(periodes.arrivee);
  const points = membres.map((etablissement) => {
    const id = etablissement.entite_id;
    const auDepart = effectifs(id, depart);
    const aLArrivee = effectifs(id, arrivee);
    const niveauArrivee = niveau(id, arrivee);
    const niveauDepart = niveau(id, depart);
    return {
      entite_id: id,
      nom: etablissement.nom,
      sigle: etablissement.sigle ?? null,
      categorie: etablissement.categorie,
      niveau: niveauArrivee,
      niveau_depart: niveauDepart,
      dynamique: niveauDepart.valeur && niveauArrivee.valeur !== null ? (niveauArrivee.valeur / niveauDepart.valeur - 1) * 100 : null,
      nb_candidatures: aLArrivee.candidatures,
      nb_laureats: aLArrivee.laureats,
      taille: aLArrivee.laureats,
      // Effectifs les plus faibles des deux périodes, pour la fiabilité de l'évolution
      min_candidatures: Math.min(auDepart.candidatures, aLArrivee.candidatures),
      min_laureats: Math.min(auDepart.laureats, aLArrivee.laureats),
      focus: id === selectionId,
    };
  });

  // Référence : médiane des parts des établissements représentés (pas de moyenne de parts) ; France pour le taux
  const representables = points.filter((p) => (p.niveau.valeur ?? 0) > 0 && p.dynamique !== null);
  const reference = indicateur === "taux_succes"
    ? niveau(ENTITE_NATIONALE, arrivee)
    : { valeur: median(representables.map((p) => p.niveau.valeur)) };
  const seuil = indicateur === "taux_succes"
    ? { valeur: SEUIL_FIABILITE, unite: "candidatures" }
    : { valeur: SEUIL_LAUREATS, unite: "lauréats" };
  const estFiable = (p) => (indicateur === "taux_succes" ? p.min_candidatures : p.min_laureats) >= seuil.valeur;

  // Chiffres clés de l'établissement choisi, sur toute la période : lauréats, part et taux, avec leur rang dans le groupe
  const periodeEntiere = membres.map(({ entite_id: id }) => {
    const e = effectifs(id, annees);
    return { entite_id: id, ...e, part: ratio(e.laureats, effectifs(ENTITE_NATIONALE, annees).laureats), taux: ratio(e.laureats, e.candidatures) };
  });
  const choisi = periodeEntiere.find(({ entite_id: id }) => id === selectionId);
  const classement = choisi && {
    nb_laureats: choisi.laureats,
    nb_candidatures: choisi.candidatures,
    part_laureats: { ratio: choisi.part, ...classer(periodeEntiere.map(({ entite_id: id, part }) => ({ entite_id: id, ratio: part })), selectionId) },
    // Taux classé parmi les établissements au-dessus du seuil de candidatures seulement
    taux_succes: {
      ratio: choisi.taux,
      fiable: choisi.candidatures >= SEUIL_FIABILITE,
      ...classer(periodeEntiere.filter(({ candidatures }) => candidatures >= SEUIL_FIABILITE).map(({ entite_id: id, taux }) => ({ entite_id: id, ratio: taux })), selectionId),
    },
  };

  return res.json({
    ...contexte,
    periode: filters.periode,
    periodes,
    annees_provisoires: meta.annees_provisoires.filter((annee) => annees.includes(annee)),
    // Période d'arrivée avec une année provisoire : seulement si la période choisie n'a pas deux années consolidées
    provisoire: arrivee.some((annee) => meta.annees_provisoires.includes(annee)),
    reference,
    seuil_fiabilite: seuil.valeur,
    seuil_unite: seuil.unite,
    seuil_taux: SEUIL_FIABILITE,
    classement: classement ?? null,
    ...shapeMatrice(points, reference.valeur ?? 0, (p) => p.entite_id, estFiable),
  });
});

export default router;
