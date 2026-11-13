import { NotFoundError } from "../../../commons/errors/index.js";
import { getCollection } from "./collections.js";
import { getBornesTukey, getPointMedian } from "./matrice.js";

// Taux de candidature au vivier (CONTRAT_DONNEES §3) : candidatures ERC par an pour 1 000 chercheurs actifs,
// même entité, mêmes panels. Candidatures : erc_effectifs (structure de dépôt) ; chercheurs : viviers_effectifs.

// Dénominateur : tous les chercheurs actifs (défaut) ou les chercheurs « top 10 % », plus proches de la population
// visée par l'ERC. Comptage par discipline principale (`nb_chercheurs*`), jamais mélangé avec le fractionnaire.
export const VIVIERS = { actifs: "nb_chercheurs", top10: "nb_chercheurs_top10" };
export const VIVIER_DEFAUT = "actifs";
// Le taux est exprimé pour 1 000 chercheurs et par an d'appel
const POUR = 1000;

// viviers_meta, ou null tant que les viviers ne sont pas activés dans l'administration du tableau
export async function getVivierMeta() {
  try {
    return await (await getCollection("viviers_meta")).findOne({}, { projection: { _id: 0, parametres: 0, controles: 0 } });
  } catch (error) {
    if (error instanceof NotFoundError) return null;
    throw error;
  }
}

// Méthode du taux de candidature au vivier, rédigée par le tableau, suivie de celle des viviers (athena)
export function getMethodeVivier(vivierMeta, seuil) {
  const { annee_debut: debut, annee_fin: fin, annee_debut_recente: debutRecent } = vivierMeta.periode;
  const provisoires = vivierMeta.annees_influence_provisoire ?? [];
  return [
    "Taux de candidature au vivier : candidatures ERC déposées dans l'entité, par an d'appel, pour 1\u00a0000 chercheurs "
      + "actifs de l'entité, dans les mêmes disciplines (panel principal du chercheur). On additionne les candidatures "
      + "et les chercheurs avant de diviser. Seules les bourses avec panel (Starting, Consolidator, Advanced) comptent : "
      + "Synergy et Proof of Concept n'ont pas de discipline.",
    `Le vivier est une estimation fixe dans le temps. Il est mesuré une seule fois, sur les articles ${debut}-${fin} : `
      + `un chercheur en fait partie s'il est actif sur cette fenêtre, et il est rattaché à un pays ou à un établissement `
      + `d'après ses affiliations ${debutRecent}-${fin}. Ce n'est pas une série annuelle : le même nombre de chercheurs `
      + `sert de dénominateur à toutes les années d'appel. Le taux n'est donc calculé que pour les appels ${debut}-${fin}, `
      + "compris dans la période choisie, en divisant les candidatures par le nombre d'années d'appel retenues.",
    "Conséquences : le taux ne se suit pas année par année (une variation ne viendrait que des candidatures, pas du "
      + "vivier) ; un chercheur arrivé ou parti pendant la période compte là où il publie en fin de période ; un jeune "
      + "chercheur qui a encore peu d'articles (une partie des candidats Starting) n'est pas dans le vivier ; un "
      + "changement de période du vivier, décidé explicitement, change tous les taux.",
    "Variante « chercheurs top 10 % » : chercheurs ayant au moins un article parmi les 10 % les plus cités de sa "
      + "discipline et de son année, population plus proche de celle que vise l'ERC"
      + (provisoires.length ? ` ; provisoire, la fenêtre de citation des articles ${provisoires.join(", ")} n'étant pas close.` : "."),
    "Référence : l'ensemble des pays comparés, candidatures et chercheurs additionnés avant de diviser. La Suisse et le "
      + "Royaume-Uni, exclus de certains appels, ont des taux faussés vers le bas. Les chercheurs sont des auteurs "
      + "OpenAlex (ordres de grandeur, pas des effectifs RH). Un chercheur peut compter pour plusieurs établissements "
      + "(UMR et tutelles) : les taux des établissements ne s'additionnent pas.",
    `Un taux est peu fiable sous ${seuil} candidatures : il varie alors fortement d'une candidature à l'autre.`,
    ...(vivierMeta.methode ?? []),
  ];
}

// Seuls les types avec panel se rapprochent du vivier, discipline par discipline
export function getTypesAvecPanel(meta, types) {
  return meta.types_bourse.filter(({ code, avec_panel }) => avec_panel && types.includes(code)).map(({ code }) => code);
}

// Contexte commun aux routes : appels de la période choisie compris dans la période du vivier, types avec panel,
// dénominateur. `null` (avec la raison) si le taux n'est pas calculable.
export function getContexteVivier(filters, meta, vivierMeta) {
  if (!vivierMeta) return { indisponible: "vivier" };
  const { annee_debut: debut, annee_fin: fin } = vivierMeta.periode;
  const types = getTypesAvecPanel(meta, filters.types);
  if (!types.length) return { indisponible: "types" };
  const appels = filters.periode
    ? meta.annees.filter((annee) => annee >= Math.max(debut, filters.periode[0]) && annee <= Math.min(fin, filters.periode[1]))
    : [];
  if (!appels.length) return { indisponible: "periode", periode_vivier: [debut, fin] };
  return {
    indisponible: null,
    vivier: filters.vivier,
    periode_vivier: [debut, fin],
    appels: [appels[0], appels.at(-1)],
    nb_annees: appels.length,
    types,
    appels_provisoires: meta.annees_provisoires.filter((annee) => appels.includes(annee)),
    // Chercheurs top 10 % : le top 10 % des articles récents n'est pas définitif
    vivier_provisoire: filters.vivier === "top10" && (vivierMeta.annees_influence_provisoire ?? []).length > 0,
  };
}

// Candidatures, lauréats (types avec panel, appels retenus) et chercheurs du vivier des entités demandées.
// Renvoie `effectifs(id, annees)` : effectifs d'une entité sur des années d'appel (toutes les années retenues par défaut) ;
// le vivier, sans année, est le même quelles que soient les années.
// Sans filtre de discipline, les candidatures sans panel comptent aussi : le vivier couvre alors toutes les disciplines,
// et le nombre de candidatures est celui des chiffres clés.
export async function loadVivierEffectifs({ champs, disciplineMatch }, contexte, entiteIds) {
  const [debut, fin] = contexte.appels;
  const matchErc = {
    entite_id: { $in: entiteIds },
    annee_appel: { $gte: debut, $lte: fin },
    type_bourse: { $in: contexte.types },
  };
  if (disciplineMatch) matchErc.discipline_code = disciplineMatch;
  const [erc, viviers] = await Promise.all([
    (await getCollection("erc_effectifs")).aggregate([{
      $match: matchErc,
    }, {
      $group: {
        _id: { entite_id: "$entite_id", annee: "$annee_appel" },
        candidatures: { $sum: `$${champs.candidatures}` },
        laureats: { $sum: `$${champs.laureats}` },
      },
    }]).toArray(),
    (await getCollection("viviers_effectifs")).aggregate([{
      $match: { entite_id: { $in: entiteIds }, discipline_code: disciplineMatch ?? { $ne: null } },
    }, {
      $group: { _id: "$entite_id", chercheurs: { $sum: `$${VIVIERS[contexte.vivier]}` } },
    }]).toArray(),
  ]);
  const chercheursById = new Map(viviers.map(({ _id, chercheurs }) => [_id, chercheurs]));
  return (id, annees = null) => erc
    .filter(({ _id }) => _id.entite_id === id && (!annees || annees.includes(_id.annee)))
    .reduce(
      (total, row) => ({ ...total, candidatures: total.candidatures + row.candidatures, laureats: total.laureats + row.laureats }),
      { candidatures: 0, laureats: 0, chercheurs: chercheursById.get(id) ?? 0 },
    );
}

// Candidatures, lauréats (types avec panel, appels retenus) et chercheurs du vivier d'une entité, discipline par discipline :
// Map discipline_code → { candidatures, laureats, chercheurs }
export async function loadVivierEffectifsParDiscipline({ champs }, contexte, entiteId) {
  const [debut, fin] = contexte.appels;
  const [erc, viviers] = await Promise.all([
    (await getCollection("erc_effectifs")).aggregate([{
      $match: {
        entite_id: entiteId,
        annee_appel: { $gte: debut, $lte: fin },
        type_bourse: { $in: contexte.types },
        discipline_code: { $ne: null },
      },
    }, {
      $group: { _id: "$discipline_code", candidatures: { $sum: `$${champs.candidatures}` }, laureats: { $sum: `$${champs.laureats}` } },
    }]).toArray(),
    (await getCollection("viviers_effectifs")).aggregate([{
      $match: { entite_id: entiteId, discipline_code: { $ne: null } },
    }, {
      $group: { _id: "$discipline_code", chercheurs: { $sum: `$${VIVIERS[contexte.vivier]}` } },
    }]).toArray(),
  ]);
  const effectifs = new Map();
  const ligne = (code) => {
    if (!effectifs.has(code)) effectifs.set(code, { candidatures: 0, laureats: 0, chercheurs: 0 });
    return effectifs.get(code);
  };
  erc.forEach(({ _id, candidatures, laureats }) => Object.assign(ligne(_id), { candidatures, laureats }));
  viviers.forEach(({ _id, chercheurs }) => Object.assign(ligne(_id), { chercheurs }));
  return effectifs;
}

// Effectifs additionnés d'un ensemble d'entités (référence : tous les pays comparés)
export function sommerEffectifs(effectifs, entiteIds, annees = null) {
  return entiteIds.reduce((total, id) => {
    const e = effectifs(id, annees);
    return { candidatures: total.candidatures + e.candidatures, laureats: total.laureats + e.laureats, chercheurs: total.chercheurs + e.chercheurs };
  }, { candidatures: 0, laureats: 0, chercheurs: 0 });
}

// Candidatures par an pour 1 000 chercheurs : numérateur = candidatures sur les appels retenus, dénominateur = chercheurs
// du vivier ; `nb_annees` complète le calcul (valeur = numérateur ÷ nb_annees ÷ dénominateur × 1 000).
// `fiable` : au moins `seuil` candidatures.
export function computeTauxVivier({ candidatures, chercheurs }, nbAnnees, seuil) {
  return {
    valeur: chercheurs ? (candidatures / nbAnnees / chercheurs) * POUR : null,
    numerateur: candidatures,
    denominateur: chercheurs,
    nb_annees: nbAnnees,
    fiable: candidatures >= seuil,
  };
}

// Représentable : taux de candidature > 0 (échelle logarithmique) et taux de succès calculable
const estRepresentable = (p) => (p.candidature.valeur ?? 0) > 0 && p.succes.valeur !== null;

// Nuage à quadrants des établissements d'un groupe : taux de candidature au vivier (horizontal) × taux de succès
// (vertical), coupés aux médianes du groupe ; même lecture (quadrants, zoom, bulles vides) que les matrices.
// Chaque point porte `candidature`, `succes`, `taille` (lauréats) et `fiable`.
// `libelle` : nom des repères (« Médiane du groupe », « Médiane des disciplines »)
export function shapeNuage(points, cle, libelle = "Médiane du groupe") {
  const representables = points.filter(estRepresentable);
  const medianeX = getPointMedian(representables, (p) => p.candidature.valeur);
  const medianeY = getPointMedian(representables, (p) => p.succes.valeur);
  const references = {
    candidature: { libelle, valeur: medianeX?.candidature.valeur ?? null, point: medianeX ? cle(medianeX) : null },
    succes: { libelle, valeur: medianeY?.succes.valeur ?? null, point: medianeY ? cle(medianeY) : null },
  };
  const refX = references.candidature.valeur ?? 0;
  const refY = references.succes.valeur ?? 0;
  const enrichis = representables
    .map((p) => ({ ...p, quadrant: `${p.succes.valeur >= refY ? "h" : "b"}${p.candidature.valeur >= refX ? "d" : "g"}` }))
    // Grosses bulles d'abord : les petites, dessinées ensuite, restent visibles par-dessus
    .sort((a, b) => b.taille - a.taille);

  // Membres de chaque quadrant, du plus fort au plus faible taux de candidature
  const quadrants = Object.fromEntries(["hd", "hg", "bd", "bg"].map((key) => [
    key,
    enrichis.filter((p) => p.quadrant === key).sort((a, b) => b.candidature.valeur - a.candidature.valeur).map(cle),
  ]));

  // Cadre ajusté aux données et aux médianes. En hauteur, un taux de succès peu fiable et très éloigné des autres
  // (un lauréat venu d'ailleurs pour deux candidatures déposées : 50 %, voire plus de 100 %) est posé sur le bord
  // (`hors_cadre`) pour ne pas écraser les autres points ; sa valeur exacte reste dans l'infobulle et les tableaux.
  const xs = [refX, ...enrichis.map((p) => p.candidature.valeur)].filter((x) => x > 0);
  const [bas, haut] = getBornesTukey(enrichis.map((p) => p.succes.valeur));
  const dansLeCadre = enrichis.filter((p) => p.fiable || (p.succes.valeur >= bas && p.succes.valeur <= haut));
  const ys = [refY, ...dansLeCadre.map((p) => p.succes.valeur)];
  const margeY = (Math.max(...ys) - Math.min(...ys)) * 0.08 || 0.05;
  const bornesY = [Math.max(0, Math.min(...ys) - margeY), Math.max(...ys) + margeY];
  enrichis.forEach((p) => {
    p.hors_cadre = p.succes.valeur > bornesY[1] ? "haut" : p.succes.valeur < bornesY[0] ? "bas" : null;
  });
  const tailles = enrichis.map((p) => p.taille);
  const tailleMin = tailles.length ? Math.min(...tailles) : 0;
  const tailleMax = tailles.length ? Math.max(...tailles) : 0;

  return {
    points: enrichis,
    // Établissements non représentés : aucune candidature ou aucun chercheur dans le vivier
    exclus: points.filter((p) => !estRepresentable(p)).map(cle),
    quadrants,
    references,
    bornes: { x: xs.length ? [Math.min(...xs) / 1.3, Math.max(...xs) * 1.3] : [null, null], y: bornesY },
    // Trois tailles de référence pour la légende : la plus petite, une intermédiaire, la plus grande
    tailles: tailles.length ? [tailleMin, Math.round(tailleMin + (tailleMax - tailleMin) / 4), tailleMax] : [],
  };
}
