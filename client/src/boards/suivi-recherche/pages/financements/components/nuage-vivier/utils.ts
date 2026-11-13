import type { QuadrantKey, Ratio } from "../../../../api";
import type { NuageVivier, NuageVivierPoint } from "../../../../api/erc.ts";
import { formatNombre, formatPart, formatPeriode } from "../../../../utils";
import { UNITES } from "../../comptage.ts";
import { formatCalculVivier, formatValeurVivier, UNITE_TAUX_VIVIER, VIVIER_LABELS } from "../../vivier.ts";

// Nuages à quadrants taux de candidature au vivier × taux de succès : établissements d'un groupe (section
// Établissements) ou disciplines d'une entité (section Profil). Ce module et `options.ts` servent aux deux.

// Quadrants coupés aux médianes des points : en haut, un taux de succès supérieur ou égal ; à droite, un taux de
// candidature au vivier supérieur ou égal. Le mot avant la virgule reste seul dans un coin sur un écran étroit.
export const QUADRANTS_VIVIER: { key: QuadrantKey; titre: string }[] = [
  { key: "hd", titre: "Moteurs, candidature et succès au-dessus des médianes" },
  { key: "hg", titre: "Réserve, succès au-dessus et candidature sous la médiane" },
  { key: "bd", titre: "Volontaristes, candidature au-dessus et succès sous la médiane" },
  { key: "bg", titre: "En retrait, candidature et succès sous les médianes" },
];

export function getTitreQuadrantVivier(key: QuadrantKey): string {
  return QUADRANTS_VIVIER.find((q) => q.key === key)!.titre;
}

// « médiane du groupe », « médiane des disciplines » : libellé des repères fourni par le serveur
export function getDefinitionQuadrantVivier<P extends NuageVivierPoint>(key: QuadrantKey, { references }: NuageVivier<P>): string {
  const droite = key.endsWith("d");
  const haut = key.startsWith("h");
  const mediane = references.candidature.libelle.toLowerCase();
  return `Taux de candidature ${droite ? "supérieur ou égal" : "inférieur"} à la ${mediane} (${formatValeurVivier(references.candidature.valeur)}), `
    + `taux de succès ${haut ? "supérieur ou égal" : "inférieur"} à la ${mediane} (${formatPart(references.succes.valeur)}).`;
}

// Libellés et calculs en toutes lettres, avec les unités du mode de comptage des données affichées
export function getTextesNuage<P extends NuageVivierPoint>(data: NuageVivier<P>) {
  const unites = UNITES[data.comptage];
  const vivier = VIVIER_LABELS[data.vivier].toLowerCase();
  const calculSucces = ({ numerateur, denominateur }: Ratio) => `${formatNombre(numerateur)} ${unites.laureats} / ${formatNombre(denominateur)} ${unites.candidatures}`;
  const peuFiable = `moins de ${data.seuil_fiabilite} ${unites.candidatures}`;
  return {
    unites,
    peuFiable,
    calculSucces,
    axeX: `Candidatures ${UNITE_TAUX_VIVIER} (${vivier}, échelle logarithmique)`,
    axeY: "Taux de succès",
    // Taille des bulles (légende, tableaux)
    taille: { colonne: unites.Laureats, format: formatNombre, unite: unites.laureats },
    // `entete` : lignes d'identification du point (nom, catégorie ou domaine)
    infobulle: (p: P, entete: string[]) => [
      ...entete,
      `<i>${getTitreQuadrantVivier(p.quadrant)}</i>`,
      `Candidatures ${UNITE_TAUX_VIVIER} : <b>${formatValeurVivier(p.candidature.valeur)}</b> = ${formatCalculVivier(p.candidature, data.vivier, unites)}`,
      `Taux de succès : <b>${formatPart(p.succes.valeur)}</b> = ${calculSucces(p.succes)}${p.hors_cadre ? ` (hors du cadre, posé sur le bord ${p.hors_cadre})` : ""}`,
      `Taille : ${formatNombre(p.taille)} ${unites.laureats} sur les appels ${formatPeriode(data.appels)}${p.fiable ? "" : ` (peu fiable : ${peuFiable})`}`,
    ],
  };
}

// Exemple de lecture d'un point, désigné par `nom`
export function getLectureNuage<P extends NuageVivierPoint>(data: NuageVivier<P>, p: P, nom: string): string {
  const { unites, calculSucces } = getTextesNuage(data);
  return `${nom} : ${formatValeurVivier(p.candidature.valeur)} ${unites.candidatures} ${UNITE_TAUX_VIVIER} `
    + `(${formatCalculVivier(p.candidature, data.vivier, unites)}) et un taux de succès de ${formatPart(p.succes.valeur)} (${calculSucces(p.succes)}) : `
    + `quadrant « ${getTitreQuadrantVivier(p.quadrant)} »${p.fiable ? "" : `, position peu fiable (moins de ${data.seuil_fiabilite} ${unites.candidatures})`}.`;
}
