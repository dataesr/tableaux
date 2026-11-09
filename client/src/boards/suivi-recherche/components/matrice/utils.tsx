import type { Matrice, MatricePoint, QuadrantKey, Ratio } from "../../api";
import { formatDynamique, formatPart, formatPeriode } from "../../utils";

// Diamètres des bulles en px ; la taille suit l'aire (sizeBy « area », le défaut de Highcharts)
export const TAILLE_MIN = 8;
export const TAILLE_MAX = 36;

// Libellés des quadrants ; le classement de chaque point est fait par le serveur.
// `titre` : évolution coupée à 0 (disciplines), « en progression » et « en recul » sont absolus ;
// `titreGroupe` : évolution coupée à la médiane du groupe (établissements), la dynamique est relative au groupe
export const QUADRANTS = [
  { key: "hd", titre: "Atouts en progression", titreGroupe: "Atouts, dynamique supérieure au groupe" },
  { key: "hg", titre: "Rattrapage", titreGroupe: "Rattrapage, dynamique supérieure au groupe" },
  { key: "bd", titre: "Atouts en recul", titreGroupe: "Atouts, dynamique inférieure au groupe" },
  { key: "bg", titre: "Fragilités qui s'accentuent", titreGroupe: "Retard, dynamique inférieure au groupe" },
] as const;

// Titre d'un quadrant : relatif au groupe quand l'évolution est coupée à une médiane (référence portée par un point)
export function getTitreQuadrant(key: QuadrantKey, { dynamique }: Matrice<unknown, string>["references"]): string {
  const quadrant = QUADRANTS.find((q) => q.key === key)!;
  return dynamique.point === undefined ? quadrant.titre : quadrant.titreGroupe;
}

// Définition d'un quadrant avec les deux lignes qui le bornent, nommées et chiffrées
export function getDefinitionQuadrant(key: QuadrantKey, { niveau, dynamique }: Matrice<unknown, string>["references"]): string {
  const droite = key.endsWith("d");
  const haut = key.startsWith("h");
  return `Niveau ${droite ? "supérieur ou égal" : "inférieur"} à « ${niveau.libelle} » (${formatPart(niveau.valeur)}), `
    + `évolution ${haut ? "supérieure ou égale" : "inférieure"} à « ${dynamique.libelle} » (${formatDynamique(dynamique.valeur)}).`;
}

// Position d'un point par rapport au repère international, en toutes lettres (null sans repère)
export function getTexteInternational(data: Matrice<unknown, string>, point: MatricePoint): string | null {
  const { international } = data.references;
  if (!international || point.international === null) return null;
  return point.international ? international.au_dessus : international.en_dessous;
}

type ContexteReferences<P> = {
  // Clé d'un point, celle que porte une référence médiane (`point`)
  cle: (point: P & MatricePoint) => string;
  // Nom d'un point dans le texte
  nom: (point: P & MatricePoint) => string;
  // Points comptés : « établissements »
  pluriel: string;
  // Calcul des ratios de la base du repère international, quand ses unités diffèrent de celles du niveau
  calculBase?: (ratio: Ratio) => string;
};

// Phrase du commentaire sur les points peu fiables posés sur le bord du cadre, avec leur évolution exacte (vide s'il n'y en a pas)
export function getTexteHorsCadre<P>(data: Matrice<P, string>, nom: (point: P & MatricePoint) => string): string {
  const horsCadre = data.points.filter((p) => p.hors_cadre);
  if (horsCadre.length === 0) return "";
  return "Posés sur le bord du cadre, avec un triangle, pour ne pas écraser les autres points : évolutions peu fiables et très éloignées des autres, "
    + `${horsCadre.map((p) => `${nom(p)} (${formatDynamique(p.dynamique)})`).join(", ")}. `;
}

// Phrases du commentaire sur les lignes de référence : ce que vaut chaque ligne et d'où vient sa valeur
// (point qui porte la médiane avec son calcul, ou ratio), puis le repère international et sa base
export function getTexteReferences<P>(data: Matrice<P, string>, textes: MatriceTextes, contexte: ContexteReferences<P>): string[] {
  const { cle, nom, pluriel, calculBase = textes.calcul } = contexte;
  const { niveau, dynamique, international } = data.references;
  const { arrivee, depart } = data.periodes;
  const pointNiveau = data.points.find((p) => cle(p) === niveau.point);
  const pointDynamique = data.points.find((p) => cle(p) === dynamique.point);
  const origineNiveau = pointNiveau
    ? `, celui de ${nom(pointNiveau)} (${textes.calcul(pointNiveau.niveau)})`
    : niveau.ratio ? ` (${textes.calcul(niveau.ratio)})` : "";
  const origineDynamique = pointDynamique
    ? `, celle de ${nom(pointDynamique)} (${formatPart(pointDynamique.niveau_depart.valeur)} → ${formatPart(pointDynamique.niveau.valeur)})`
    : "";

  const phrases = [
    `Ligne verticale en tirets : ${niveau.libelle.toLowerCase()}, ${formatPart(niveau.valeur)}${origineNiveau} ; à droite, un niveau supérieur ou égal.`,
    `Ligne horizontale en trait plein : ${dynamique.libelle.toLowerCase()}, ${formatDynamique(dynamique.valeur)}${origineDynamique} ; au-dessus, une évolution supérieure ou égale.`,
  ];
  if (pointNiveau || pointDynamique) {
    phrases.push(`Médianes des ${data.points.length} ${pluriel} représentés : autant de part et d'autre de chaque ligne, à un près.`);
  }
  if (international) {
    const { base } = international;
    phrases.push(
      `Ligne horizontale en pointillés, repère international : ${international.libelle.toLowerCase()}, ${formatDynamique(international.valeur)} ; `
      + `au-dessus, ${international.au_dessus} ; en dessous, ${international.en_dessous} (${international.nb_en_dessous} ${pluriel} sur ${data.points.length}).`,
      `${base.libelle} : ${formatPart(base.depart.valeur)} sur ${formatPeriode(depart)} (${calculBase(base.depart)}), `
      + `${formatPart(base.arrivee.valeur)} sur ${formatPeriode(arrivee)} (${calculBase(base.arrivee)}), soit ${formatDynamique(base.dynamique)}.`,
    );
  }
  return phrases;
}

// Ce qui distingue un indicateur d'un autre dans la matrice (part mondiale d'articles, part ou taux de lauréats) :
// libellés des axes, format du niveau, calcul en toutes lettres et unité de la taille des bulles
export type MatriceTextes = {
  axeX: string;
  axeY: string;
  // Calcul du niveau, avec ses unités : « 1 234 / 56 789 articles », « 45 lauréats / 230 candidatures »
  calcul: (ratio: Ratio) => string;
  // Nom du niveau dans l'infobulle et les tableaux : « Part », « Taux de succès »
  niveau: string;
  // Bulle vide : « moins de 30 articles »
  peuFiable: string;
  // Taille des bulles : « articles », en-tête de colonne « Articles »
  taille: { colonne: string; format: (nombre: number) => string; unite: string };
};


// Diamètre d'une bulle, calculé comme Highcharts, pour la légende des tailles
export function getDiametre(z: number, zMin: number, zMax: number): number {
  const position = zMax > zMin ? Math.sqrt((z - zMin) / (zMax - zMin)) : 1;
  return TAILLE_MIN + position * (TAILLE_MAX - TAILLE_MIN);
}

// Nom court : premier segment du nom (nom complet au survol et dans le tableau)
export function getNomCourt(nom: string, max = 26): string {
  const segment = nom.split(/[:,]/)[0].trim();
  if (segment.length <= max) return segment;
  // Coupe au dernier mot entier, sans laisser un « and » ou un « of » en fin de libellé
  const words = segment.slice(0, max).split(" ").slice(0, -1);
  while (words.length > 1 && /^(and|of|the|in|for|its)$/i.test(words[words.length - 1])) words.pop();
  return `${words.join(" ")}…`;
}


// Exemple de lecture (clé `readingKey` de ChartWrapper) : un point en toutes lettres, niveaux d'arrivée et de départ
// avec leur calcul, évolution relative et quadrant. Le point lu : l'entité mise en avant, sinon la plus grosse bulle.
export function getLectureMatrice<P>(data: Matrice<P, string>, textes: MatriceTextes, point: P & MatricePoint, nom: string): string {
  const { arrivee, depart } = data.periodes;
  const quadrant = getTitreQuadrant(point.quadrant, data.references);
  const international = getTexteInternational(data, point);
  return `${nom} : ${textes.niveau.toLowerCase()} de ${formatPart(point.niveau.valeur)} sur ${formatPeriode(arrivee)} (${textes.calcul(point.niveau)}), `
    + `contre ${formatPart(point.niveau_depart.valeur)} sur ${formatPeriode(depart)} (${textes.calcul(point.niveau_depart)}), `
    + `soit une évolution relative de ${formatDynamique(point.dynamique)} : quadrant « ${quadrant} »`
    + `${international ? ` ; à l'international, ${international}` : ""}.`;
}
