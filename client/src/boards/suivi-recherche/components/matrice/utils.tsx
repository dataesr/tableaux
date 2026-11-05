import type { Ratio } from "../../api";

// Diamètres des bulles en px ; la taille suit l'aire (sizeBy « area », le défaut de Highcharts)
export const TAILLE_MIN = 8;
export const TAILLE_MAX = 36;

// Libellés des quadrants ; le classement de chaque point est fait par le serveur
export const QUADRANTS = [
  { key: "hd", titre: "Atouts en progression", definition: "Au-dessus de la référence et en progression." },
  { key: "hg", titre: "Rattrapage", definition: "Sous la référence, mais en progression." },
  { key: "bd", titre: "Atouts en recul", definition: "Au-dessus de la référence, mais en recul." },
  { key: "bg", titre: "Fragilités qui s'accentuent", definition: "Sous la référence et en recul." },
] as const;

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

