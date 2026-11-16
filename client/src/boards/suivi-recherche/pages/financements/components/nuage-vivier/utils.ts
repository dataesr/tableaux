import type { QuadrantKey, Ratio } from "../../../../api";
import type { NuageVivier, NuageVivierPoint } from "../../../../api/erc.ts";
import { formatNombre, formatPart, formatPeriode } from "../../../../utils";
import { UNITES } from "../../comptage.ts";
import { formatCalculVivier, formatValeurVivier, UNITE_TAUX_VIVIER, VIVIER_LABELS } from "../../vivier.ts";

// Nuages à quadrants candidature × succès : établissements d'un groupe (section Établissements, taux bruts coupés aux
// médianes) ou disciplines d'une entité (section Profil, indices coupés à la moyenne européenne). Ce module,
// `options.ts` et `quadrants.tsx` servent aux deux ; `AxesNuage` porte ce qui change d'un nuage à l'autre.

// Ce que montrent les axes d'un nuage : grandeurs, formats, quadrants et textes qui en dépendent
export type AxesNuage<P extends NuageVivierPoint> = {
  axeX: string;
  axeY: string;
  // Position du point (abscisse > 0 : échelle logarithmique)
  x: (point: P) => number;
  y: (point: P) => number;
  formatX: (valeur: number | null) => string;
  formatY: (valeur: number | null) => string;
  // Quadrants dans l'ordre d'affichage ; le mot avant la virgule reste seul dans un coin sur un écran étroit
  quadrants: { key: QuadrantKey; titre: string }[];
  definitionQuadrant: (key: QuadrantKey) => string;
  // Position du point en toutes lettres, avec ses calculs (infobulle)
  infobulle: (point: P) => string[];
  // Colonnes des tableaux de quadrants, entre le nom du point et sa taille
  colonnes: { titre: string; valeur: (point: P) => string }[];
  // Exemple de lecture d'un point, désigné par `nom`
  lecture: (point: P, nom: string) => string;
};

export function getTitreQuadrant<P extends NuageVivierPoint>(axes: AxesNuage<P>, key: QuadrantKey): string {
  return axes.quadrants.find((q) => q.key === key)!.titre;
}

// Libellés et calculs en toutes lettres, avec les unités du mode de comptage des données affichées
export function getTextesNuage<P extends NuageVivierPoint>(data: NuageVivier<P>) {
  const unites = UNITES[data.comptage];
  const calculSucces = ({ numerateur, denominateur }: Ratio) => `${formatNombre(numerateur)} ${unites.laureats} / ${formatNombre(denominateur)} ${unites.candidatures}`;
  const peuFiable = `moins de ${data.seuil_fiabilite} ${unites.candidatures}`;
  return {
    unites,
    peuFiable,
    calculSucces,
    // Taille des bulles (légende, tableaux)
    taille: { colonne: unites.Laureats, format: formatNombre, unite: unites.laureats },
    // Infobulle : identification du point (`entete` : nom, catégorie ou domaine), quadrant, position, taille
    infobulle: (p: P, entete: string[], axes: AxesNuage<P>) => [
      ...entete,
      `<i>${getTitreQuadrant(axes, p.quadrant)}</i>`,
      ...axes.infobulle(p),
      ...(p.hors_cadre ? [`Hors du cadre, posé sur le bord ${p.hors_cadre}`] : []),
      `Taille : ${formatNombre(p.taille)} ${unites.laureats} sur les appels ${formatPeriode(data.appels)}${p.fiable ? "" : ` (peu fiable : ${peuFiable})`}`,
    ],
  };
}

// Axes des établissements : taux de candidature au vivier × taux de succès, coupés aux médianes du groupe
export function getAxesTaux<P extends NuageVivierPoint>(data: NuageVivier<P>): AxesNuage<P> {
  const { unites, calculSucces } = getTextesNuage(data);
  const { candidature, succes } = data.references;
  // « médiane du groupe » : libellé des repères fourni par le serveur
  const mediane = candidature.libelle.toLowerCase();
  const axes: AxesNuage<P> = {
    axeX: `Candidatures ${UNITE_TAUX_VIVIER} (${VIVIER_LABELS[data.vivier].toLowerCase()}, échelle logarithmique)`,
    axeY: "Taux de succès",
    x: (p) => p.candidature.valeur!,
    y: (p) => p.succes.valeur!,
    formatX: formatValeurVivier,
    formatY: formatPart,
    quadrants: [
      { key: "hd", titre: "Moteurs, candidature et succès au-dessus des médianes" },
      { key: "hg", titre: "Réserve, succès au-dessus et candidature sous la médiane" },
      { key: "bd", titre: "Volontaristes, candidature au-dessus et succès sous la médiane" },
      { key: "bg", titre: "En retrait, candidature et succès sous les médianes" },
    ],
    definitionQuadrant: (key) => `Taux de candidature ${key.endsWith("d") ? "supérieur ou égal" : "inférieur"} à la ${mediane} `
      + `(${formatValeurVivier(candidature.valeur)}), taux de succès ${key.startsWith("h") ? "supérieur ou égal" : "inférieur"} `
      + `à la ${mediane} (${formatPart(succes.valeur)}).`,
    infobulle: (p) => [
      `Candidatures ${UNITE_TAUX_VIVIER} : <b>${formatValeurVivier(p.candidature.valeur)}</b> = ${formatCalculVivier(p.candidature, data.vivier, unites)}`,
      `Taux de succès : <b>${formatPart(p.succes.valeur)}</b> = ${calculSucces(p.succes)}`,
    ],
    colonnes: [
      { titre: `Candidatures ${UNITE_TAUX_VIVIER}`, valeur: (p) => formatValeurVivier(p.candidature.valeur) },
      { titre: "Taux de succès", valeur: (p) => `${formatPart(p.succes.valeur)} (${calculSucces(p.succes)})` },
    ],
    lecture: (p, nom) => `${nom} : ${formatValeurVivier(p.candidature.valeur)} ${unites.candidatures} ${UNITE_TAUX_VIVIER} `
      + `(${formatCalculVivier(p.candidature, data.vivier, unites)}) et un taux de succès de ${formatPart(p.succes.valeur)} (${calculSucces(p.succes)}) : `
      + `quadrant « ${getTitreQuadrant(axes, p.quadrant)} »${p.fiable ? "" : `, position peu fiable (moins de ${data.seuil_fiabilite} ${unites.candidatures})`}.`,
  };
  return axes;
}
