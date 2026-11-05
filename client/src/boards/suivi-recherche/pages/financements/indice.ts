import type { Ratio } from "../../api";
import type { RatioTaux, Vivier } from "../../api/erc.ts";
import { formatIndice, formatNombre, formatPart } from "../../utils";
import type { UNITES } from "./comptage.ts";

type Unites = (typeof UNITES)[keyof typeof UNITES];

export const VIVIER_LABELS: Record<Vivier, string> = {
  top10: "Articles du top 10 % des plus cités",
  articles: "Tous les articles (revues SJR)",
};

// Le calcul de chaque indice en toutes lettres, avec ses unités
// « 1,04 (2 997 candidatures / 2 878 attendues) »
export function formatIndiceCandidature(ratio: Ratio, unites: Unites): string {
  return `${formatIndice(ratio.valeur)} (${formatNombre(ratio.numerateur)} ${unites.candidatures} / ${formatNombre(Math.round(ratio.denominateur))} ${unites.attendues})`;
}

// « 1,25 (565 lauréats / 452 attendus) »
export function formatIndiceLaureats(ratio: Ratio, unites: Unites): string {
  return `${formatIndice(ratio.valeur)} (${formatNombre(ratio.numerateur)} ${unites.laureats} / ${formatNombre(Math.round(ratio.denominateur))} attendus)`;
}

// « 1,20 (18,9 % de succès / 15,7 % attendu) »
export function formatIndiceReussite(ratio: RatioTaux): string {
  return `${formatIndice(ratio.valeur)} (${formatPart(ratio.numerateur)} de succès / ${formatPart(ratio.denominateur)} attendu)`;
}
