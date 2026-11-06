import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { ENTITE_NATIONALE, fetchJson } from "./index.ts";
import type { GroupeEtablissements, Matrice, Ratio, Selection } from "./index.ts";
import type { EtablissementPoint } from "./index.ts";

const { VITE_APP_SERVER_URL } = import.meta.env;

const BASE_URL = `${VITE_APP_SERVER_URL}/suivi-recherche/financements/prix`;

// Prix et distinctions français (athena) : nominations seulement, pas de candidatures
export type Prix = { libelle: string; prix_id: string };

// Groupe de prix (IUF, médailles du CNRS), choisi par le paramètre `distinction`
export type PrixMeta = {
  annees: number[];
  annees_provisoires: number[];
  groupe_defaut: string;
  groupes: { code: string; libelle: string; prix: Prix[] }[];
  methode: string[];
  sources: string;
};

// Discipline choisie : nominations françaises sans discipline, comptées seulement pour « Toutes disciplines »
export type NonClasses = { nb: number; total: number } | null;

// Nominations de l'entité, détail par prix et part du total France (null quand l'entité est la France)
export type PrixIndicateurs = {
  nb_laureats: number;
  par_prix: (Prix & { nb_laureats: number })[];
  part: Ratio | null;
};

export type PrixIndicateursPeriode =
  | { periode: null }
  | {
    annees_provisoires: number[];
    groupes: (PrixIndicateurs & { code: string; libelle: string; non_classes: NonClasses })[];
    periode: [number, number];
  };

export type PrixEvolution = {
  annees: (PrixIndicateurs & { annee: number; provisoire: boolean })[];
  distinction: string;
  non_classes?: NonClasses;
  periode: [number, number] | null;
  prix?: Prix[];
};

export type PrixEtablissementPoint = EtablissementPoint & { nb_laureats: number; min_laureats: number };

type PrixPositionnementContexte = {
  distinction: string;
  groupe: string;
  groupe_selection: string | null;
  groupes: GroupeEtablissements[];
};
export type PrixPositionnementMatrice = PrixPositionnementContexte & Matrice<PrixEtablissementPoint, "part_laureats"> & {
  annees_provisoires: number[];
  classement: { nb_laureats: number; part: { nb: number; rang: number | null; ratio: Ratio } } | null;
  non_classes: NonClasses;
  periode: [number, number];
};
// `periodes` null : moins de deux années dans la période choisie
export type PrixPositionnement = (PrixPositionnementContexte & { periodes: null }) | PrixPositionnementMatrice;

function toSearchParams(selection: Selection, distinction?: string) {
  const params = new URLSearchParams({ year_max: String(selection.anneeFin), year_min: String(selection.anneeDebut) });
  if (selection.entiteId !== ENTITE_NATIONALE) params.set("ror_id", selection.entiteId);
  if (selection.disciplineCode) params.set("discipline", selection.disciplineCode);
  if (selection.domaineCode) params.set("domaine", selection.domaineCode);
  if (distinction) params.set("distinction", distinction);
  return params;
}

function filtersKey(selection: Selection) {
  return [selection.entiteId, selection.anneeDebut, selection.anneeFin, selection.disciplineCode ?? null, selection.domaineCode ?? null];
}

export const usePrixMeta = () =>
  useQuery({
    queryKey: ["suivi-recherche", "prix", "meta"],
    queryFn: () => fetchJson<PrixMeta>(`${BASE_URL}/meta`),
  });

// Tous les groupes de prix dans une seule réponse
export const usePrixIndicateurs = (selection: Selection) =>
  useQuery({
    queryKey: ["suivi-recherche", "prix", "indicateurs", ...filtersKey(selection)],
    queryFn: () => fetchJson<PrixIndicateursPeriode>(`${BASE_URL}/indicateurs?${toSearchParams(selection)}`),
    placeholderData: keepPreviousData,
  });

export const usePrixEvolution = (selection: Selection, distinction: string) =>
  useQuery({
    queryKey: ["suivi-recherche", "prix", "evolution", distinction, ...filtersKey(selection)],
    queryFn: () => fetchJson<PrixEvolution>(`${BASE_URL}/evolution?${toSearchParams(selection, distinction)}`),
    placeholderData: keepPreviousData,
  });

// Sans groupe : celui de l'établissement sélectionné, sinon les universités (choix du serveur).
// `enabled` : faux quand le bloc des prix est masqué (paramètre `dispositif`)
export const usePrixPositionnement = (selection: Selection, distinction: string, groupe?: string, enabled = true) =>
  useQuery({
    enabled,
    queryKey: ["suivi-recherche", "prix", "positionnement-etablissements", distinction, groupe ?? null, ...filtersKey(selection)],
    queryFn: () => {
      const params = toSearchParams(selection, distinction);
      if (groupe) params.set("groupe", groupe);
      return fetchJson<PrixPositionnement>(`${BASE_URL}/positionnement-etablissements?${params}`);
    },
    placeholderData: keepPreviousData,
  });
