import { createContext, useContext } from "react";

import type { BiblioDiscipline, Selection } from "../../api";
import type { ErcMeta } from "../../api/erc.ts";

// Données et sélection communes aux onglets des financements, chargées une fois par la page
export type FinancementsContext = {
  disciplines: BiblioDiscipline[];
  entiteNom: string;
  ercMeta: ErcMeta;
  selection: Selection;
};

const Context = createContext<FinancementsContext | null>(null);

export const FinancementsProvider = Context.Provider;

export function useFinancements(): FinancementsContext {
  const value = useContext(Context);
  if (!value) throw new Error("useFinancements must be used inside FinancementsProvider");
  return value;
}
