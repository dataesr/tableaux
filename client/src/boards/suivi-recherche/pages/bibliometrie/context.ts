import { createContext, useContext } from "react";

import type { BiblioDiscipline, BiblioMeta, BiblioOptions, Entite, Selection } from "../../api";

// Données et sélection communes aux onglets de la bibliométrie, chargées une fois par la page
export type BibliometrieContext = {
  disciplines: BiblioDiscipline[];
  entiteNom: string;
  entites: Entite[];
  meta: BiblioMeta;
  options: BiblioOptions;
  selection: Selection;
};

const Context = createContext<BibliometrieContext | null>(null);

export const BibliometrieProvider = Context.Provider;

export function useBibliometrie(): BibliometrieContext {
  const value = useContext(Context);
  if (!value) throw new Error("useBibliometrie must be used inside BibliometrieProvider");
  return value;
}

export const PERIMETRE_LABELS: Record<BiblioOptions["perimetre"], string> = {
  revues_sjr: "Revues classées par SJR",
  toutes_revues_openalex: "Toutes les revues (OpenAlex)",
};

// Rappel des paramètres de calcul, repris dans le résumé replié et au-dessus des chiffres clés
export function getOptionsLabel(options: BiblioOptions): string {
  return `${PERIMETRE_LABELS[options.perimetre]} · prestige ${options.inclureMultidisciplinaires ? "avec" : "sans"} les revues multidisciplinaires`;
}
