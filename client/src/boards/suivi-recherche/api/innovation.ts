import { keepPreviousData, useQuery } from "@tanstack/react-query";

import type { Entite, Selection, SourceDonnees } from "./index.ts";
import { ENTITE_NATIONALE, fetchJson } from "./index.ts";

const { VITE_APP_SERVER_URL } = import.meta.env;
const BASE_URL = `${VITE_APP_SERVER_URL}/suivi-recherche/innovation/startups`;

type Provenance = {
  date_calcul: string;
  date_observation: string | null;
  empreinte_sha256: string | null;
};

type Envelope<T> = { data: T; provenance: Provenance };

export type InnovationMeta = {
  annees: number[];
  annees_provisoires: number[];
  date_observation: string | null;
  controles: {
    nb_siren_comptes: number;
    nb_siren_sans_ror_resolu: number;
    nb_sirets_ambigus: number;
    nb_sirets_distincts: number;
    nb_sirets_non_resolus: number;
    nb_sirets_rattaches_unique: number;
  };
  methode: string[];
  sources: SourceDonnees[];
};

export type StartupsEvolution = {
  annees: { annee: number; nb_startups: number | null; provisoire: boolean }[];
  entite_id: string;
  periode: [number, number] | null;
};

async function fetchData<T>(url: string): Promise<T> {
  const response = await fetchJson<Envelope<T>>(url);
  return response.data;
}

export const useInnovationMeta = (enabled = true) =>
  useQuery({
    enabled,
    queryKey: ["suivi-recherche", "innovation", "meta"],
    queryFn: () => fetchData<InnovationMeta>(`${BASE_URL}/meta`),
  });

export const useInnovationEntites = (enabled = true) =>
  useQuery({
    enabled,
    queryKey: ["suivi-recherche", "innovation", "entites"],
    queryFn: () => fetchData<Entite[]>(`${BASE_URL}/entites`),
  });

export const useInnovationEvolution = (selection: Selection | null) => {
  const params = new URLSearchParams();
  if (selection) {
    params.set("year_min", String(selection.anneeDebut));
    params.set("year_max", String(selection.anneeFin));
    if (selection.entiteId !== ENTITE_NATIONALE) params.set("ror_id", selection.entiteId);
  }
  return useQuery({
    enabled: Boolean(selection),
    queryKey: [
      "suivi-recherche", "innovation", "startups-evolution",
      selection?.entiteId ?? null, selection?.anneeDebut ?? null, selection?.anneeFin ?? null,
    ],
    queryFn: () => fetchData<StartupsEvolution>(`${BASE_URL}/evolution?${params}`),
    placeholderData: keepPreviousData,
  });
};
