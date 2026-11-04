import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { ENTITE_NATIONALE, fetchJson } from "./index.ts";
import type { Ratio, Selection } from "./index.ts";

const { VITE_APP_SERVER_URL } = import.meta.env;

const BASE_URL = `${VITE_APP_SERVER_URL}/suivi-recherche/financements/erc`;

export type TypeBourse = {
  avec_panel: boolean;
  code: string;
  libelle: string;
  principal: boolean;
};

// Comptage en projets (défaut) ou en porteurs (PI) : ne diffère que pour les Synergy Grants (2 à 4 porteurs par projet)
export type Comptage = "projets" | "pi";
export const COMPTAGE_DEFAUT: Comptage = "projets";

export type ErcMeta = {
  annees: number[];
  annees_provisoires: number[];
  methode: string[];
  // Champs d'erc_effectifs [candidatures, lauréats] de chaque mode, lus par le serveur
  modes_comptage: Record<Comptage, [string, string]>;
  pays_compares: string[];
  sources: string;
  types_bourse: TypeBourse[];
  types_bourse_defaut: string[];
};

// Paramètres de calcul du bloc ERC, dans l'URL (type_bourse, comptage)
export type ErcOptions = {
  comptage: Comptage;
  types: string[];
};

// Part des lauréats > part des candidatures : l'entité réussit mieux que la moyenne.
// En mode pi, nb_candidatures et nb_laureats comptent des porteurs.
export type ErcIndicateurs = {
  // Au moins `seuil_fiabilite` candidatures : en dessous, le taux et les parts sont signalés comme peu fiables
  fiable: boolean;
  nb_candidatures: number;
  nb_laureats: number;
  part_candidatures: Ratio;
  part_laureats: Ratio;
  taux_succes: Ratio;
  taux_succes_reference: Ratio;
};

// `periode` : années d'appel retenues, null si la période choisie n'en contient aucune
// `comptage` : mode des effectifs renvoyés, pour libeller les données affichées et non celles demandées
export type ErcIndicateursPeriode =
  | { comptage: Comptage; periode: null }
  | (ErcIndicateurs & { annees_provisoires: number[]; comptage: Comptage; periode: [number, number]; seuil_fiabilite: number });

export type ErcEvolution = {
  annees: (ErcIndicateurs & { annee_appel: number; provisoire: boolean })[];
  comptage: Comptage;
  periode: [number, number] | null;
  seuil_fiabilite?: number;
};

// Noms des paramètres : plugins/tableaux/reference/url-parameters.md (ror_id absent = France).
// La période est celle de la sélection ; le serveur la ramène aux années d'appel disponibles.
function toSearchParams(selection: Selection, { comptage, types }: ErcOptions) {
  const params = new URLSearchParams({
    comptage,
    type_bourse: types.join(","),
    year_max: String(selection.anneeFin),
    year_min: String(selection.anneeDebut),
  });
  if (selection.entiteId !== ENTITE_NATIONALE) params.set("ror_id", selection.entiteId);
  if (selection.disciplineCode) params.set("discipline", selection.disciplineCode);
  if (selection.domaineCode) params.set("domaine", selection.domaineCode);
  return params;
}

function filtersKey(selection: Selection, { comptage, types }: ErcOptions) {
  return [
    selection.entiteId,
    selection.anneeDebut,
    selection.anneeFin,
    selection.disciplineCode ?? null,
    selection.domaineCode ?? null,
    types.join(","),
    comptage,
  ];
}

export const useErcMeta = () =>
  useQuery({
    queryKey: ["suivi-recherche", "erc", "meta"],
    queryFn: () => fetchJson<ErcMeta>(`${BASE_URL}/meta`),
  });

export const useErcIndicateurs = (selection: Selection, options: ErcOptions) =>
  useQuery({
    queryKey: ["suivi-recherche", "erc", "indicateurs", ...filtersKey(selection, options)],
    queryFn: () => fetchJson<ErcIndicateursPeriode>(`${BASE_URL}/indicateurs?${toSearchParams(selection, options)}`),
    placeholderData: keepPreviousData,
  });

// Tous les indicateurs de chaque année sont dans la réponse : changer d'indicateur ne relance pas de requête
export const useErcEvolution = (selection: Selection, options: ErcOptions) =>
  useQuery({
    queryKey: ["suivi-recherche", "erc", "evolution", ...filtersKey(selection, options)],
    queryFn: () => fetchJson<ErcEvolution>(`${BASE_URL}/evolution?${toSearchParams(selection, options)}`),
    placeholderData: keepPreviousData,
  });
