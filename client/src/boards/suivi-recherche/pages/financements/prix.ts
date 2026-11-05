import type { NonClasses } from "../../api/prix.ts";
import { formatNombre, formatPart } from "../../utils";

// « 5,3 % du total (20 / 376 nominations) »
export function formatPartTotal(ratio: { valeur: number | null; numerateur: number; denominateur: number }): string {
  return `${formatPart(ratio.valeur)} du total (${formatNombre(ratio.numerateur)} / ${formatNombre(ratio.denominateur)} nominations)`;
}

// Discipline choisie : nominations sans discipline, hors du calcul
export function formatNonClasses(nonClasses: NonClasses | undefined): string | null {
  if (!nonClasses || nonClasses.nb === 0) return null;
  return `${formatNombre(nonClasses.nb)} nominations sur ${formatNombre(nonClasses.total)} n'ont pas de discipline (lauréat non retrouvé dans OpenAlex) : `
    + "elles ne comptent que pour « Toutes disciplines ».";
}
