import { useOutletContext } from "react-router-dom";

import type { BiblioDiscipline, BiblioMeta, BiblioOptions, Entite, Selection } from "../../api";

// Données et sélection communes aux sous-pages de la bibliométrie, chargées une fois par la mise en page
export type BibliometrieContext = {
  disciplines: BiblioDiscipline[];
  entiteNom: string;
  entites: Entite[];
  meta: BiblioMeta;
  options: BiblioOptions;
  selection: Selection;
};

export const useBibliometrie = () => useOutletContext<BibliometrieContext>();

export const PERIMETRE_LABELS: Record<BiblioOptions["perimetre"], string> = {
  revues_sjr: "Revues classées par SJR",
  toutes_revues_openalex: "Toutes les revues (OpenAlex)",
};

// Rappel des paramètres de calcul, repris dans le résumé replié et au-dessus des chiffres clés
export function getOptionsLabel(options: BiblioOptions): string {
  return `${PERIMETRE_LABELS[options.perimetre]} · prestige ${options.inclureMultidisciplinaires ? "avec" : "sans"} les revues multidisciplinaires`;
}
