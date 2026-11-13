import type { TauxVivier, Vivier, VivierContexte, VivierIndisponible } from "../../api/erc.ts";
import { formatNombre, formatPeriode } from "../../utils";
import type { Unites } from "./comptage.ts";

// Dénominateur du taux de candidature au vivier
export const VIVIER_LABELS: Record<Vivier, string> = {
  actifs: "Tous les chercheurs actifs",
  top10: "Chercheurs top 10 %",
};
const VIVIER_UNITES: Record<Vivier, string> = {
  actifs: "chercheurs actifs",
  top10: "chercheurs top 10 %",
};

// Espace insécable (\u00a0) dans « 1 000 » : le nombre n'est jamais coupé en fin de ligne
export const TITRE_TAUX_VIVIER = "Candidatures ERC pour 1\u00a0000 chercheurs";
export const UNITE_TAUX_VIVIER = "par an pour 1\u00a0000 chercheurs";

// Valeur seule : « 2,1 », « 0,35 »
export function formatValeurVivier(valeur: number | null): string {
  if (valeur === null) return "—";
  return valeur.toLocaleString("fr-FR", { maximumSignificantDigits: 2 });
}

// Le calcul en toutes lettres : « 3 040 candidatures en 5 ans / 290 000 chercheurs actifs »
export function formatCalculVivier(taux: TauxVivier, vivier: Vivier, unites: Unites): string {
  const ans = taux.nb_annees > 1 ? `${taux.nb_annees} ans` : "1 an";
  return `${formatNombre(taux.numerateur)} ${unites.candidatures} en ${ans} / ${formatNombre(taux.denominateur)} ${VIVIER_UNITES[vivier]}`;
}

// « 2,1 par an pour 1 000 chercheurs (3 040 candidatures en 5 ans / 290 000 chercheurs actifs) »
export function formatTauxVivier(taux: TauxVivier, vivier: Vivier, unites: Unites): string {
  return `${formatValeurVivier(taux.valeur)} ${UNITE_TAUX_VIVIER} (${formatCalculVivier(taux, vivier, unites)})`;
}

// Pourquoi le taux de candidature au vivier n'est pas affiché
export function getTexteIndisponible({ indisponible, periode_vivier: periode }: VivierIndisponible): string {
  if (indisponible === "vivier") return "Les viviers de chercheurs ne sont pas encore disponibles : le taux de candidature au vivier ne peut pas être calculé.";
  if (indisponible === "types") {
    return "Le taux de candidature au vivier ne porte que sur les bourses avec panel (Starting, Consolidator, Advanced) : cochez-en au moins une dans les paramètres de calcul.";
  }
  const vivier = periode ? formatPeriode(periode) : "";
  return `Le vivier de chercheurs est mesuré une seule fois, sur ${vivier} : choisissez une période qui contient des appels ${vivier} pour voir le taux de candidature au vivier.`;
}

// Rappel, sous chaque taux : le vivier est une estimation fixe, pas une série annuelle
export function getTexteVivierFixe({ appels, periode_vivier: periode, vivier, vivier_provisoire: provisoire }: VivierContexte): string {
  return `Vivier fixe dans le temps : ${VIVIER_UNITES[vivier]} mesurés une seule fois, sur les articles ${formatPeriode(periode)} ; `
    + `le même nombre de chercheurs sert de dénominateur à chaque année d'appel ${formatPeriode(appels)} : `
    + "d'une année à l'autre, le taux ne varie qu'avec les candidatures, pas avec le nombre de chercheurs."
    + (provisoire ? " Chercheurs top 10 % provisoires : le top 10 % des articles récents n'est pas définitif." : "");
}

// Définition du taux pour un ensemble d'entités (« chaque pays », « chaque établissement »), vivier fixe, appels provisoires
export function getCommentaireVivier(contexte: VivierContexte, entites: string): string {
  return `Candidatures ERC déposées dans ${entites} (bourses Starting, Consolidator, Advanced) sur les appels ${formatPeriode(contexte.appels)}, `
    + `par an, rapportées à ses chercheurs du vivier dans les mêmes disciplines, pour 1\u00a0000 chercheurs. ${getTexteVivierFixe(contexte)}`
    + (contexte.appels_provisoires.length > 0 ? ` Appels ${contexte.appels_provisoires.join(", ")} provisoires : tous les résultats ne sont pas publiés.` : "");
}
