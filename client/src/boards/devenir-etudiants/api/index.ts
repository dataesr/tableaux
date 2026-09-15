import { keepPreviousData, useQuery } from "@tanstack/react-query";

const { VITE_APP_SERVER_URL } = import.meta.env;

export type OutcomesFilterField =
  | "groupe_disciplinaire"
  | "sexe"
  | "origine_sociale"
  | "bac_type"
  | "bac_mention"
  | "retard_scolaire"
  | "devenir_en_un_an"
  | "type_de_trajectoire";

export type OutcomesFilterOption = {
  count: number;
  dipl?: number;
  ndipl?: number;
  key: string;
  label: string;
};

export type OutcomesFluxLink = {
  source_annee: string;
  source_rel: number;
  source_situation: string;
  target_annee: string;
  target_rel: number;
  target_situation: string;
  value: number;
};

type OutcomesFluxResponse = {
  cohort: {
    annee: string;
    situation: string;
  };
  filterOptions: Record<OutcomesFilterField, OutcomesFilterOption[]>;
  filters: Partial<Record<OutcomesFilterField, string>> & {
    cohorte_annee: string;
    cohorte_situation: string;
  };
  links: OutcomesFluxLink[];
  minValue: number;
  relativeYears: number[];
  totalStudents: number;
};

type UseOutcomesFluxParams = {
  cohorteAnnee: string;
  cohorteSituation: string;
  filters: Partial<Record<OutcomesFilterField, string | null>>;
  minValue?: number;
  relativeYears?: number[];
};

export const useOutcomesFlux = ({
  cohorteAnnee,
  cohorteSituation,
  filters,
  minValue = 100,
  relativeYears = [0, 1, 2, 3, 4],
}: UseOutcomesFluxParams) =>
  useQuery({
    queryKey: [
      "outcomes",
      "flux",
      cohorteAnnee,
      cohorteSituation,
      filters.groupe_disciplinaire ?? null,
      filters.sexe ?? null,
      filters.origine_sociale ?? null,
      filters.bac_type ?? null,
      filters.bac_mention ?? null,
      filters.retard_scolaire ?? null,
      filters.devenir_en_un_an ?? null,
      filters.type_de_trajectoire ?? null,
      minValue,
      relativeYears.join(","),
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        annee_rel: relativeYears.join(","),
        cohorte_annee: cohorteAnnee,
        cohorte_situation: cohorteSituation,
        min_value: String(minValue),
      });

      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.append(key, value);
        }
      });

      const response = await fetch(
        `${VITE_APP_SERVER_URL}/outcomes/flux?${params.toString()}`
      );
      if (!response.ok) {
        throw new Error("Erreur récupération flux outcomes");
      }
      return response.json() as Promise<OutcomesFluxResponse>;
    },
    enabled: !!cohorteAnnee && !!cohorteSituation,
    placeholderData: keepPreviousData,
  });

type OutcomesDistributionItem = {
  annee_rel: number;
  count: number;
  situation: string;
};

type OutcomesRepartitionResponse = {
  cohort: { annee: string; situation: string };
  distribution: OutcomesDistributionItem[];
  filterOptions: Record<OutcomesFilterField, OutcomesFilterOption[]>;
  filters: Partial<Record<OutcomesFilterField, string>> & {
    cohorte_annee: string;
    cohorte_situation: string;
  };
  relativeYears: number[];
  totalStudents: number;
};

type UseOutcomesRepartitionParams = {
  cohorteAnnee: string;
  cohorteSituation: string;
  filters: Partial<Record<OutcomesFilterField, string | null>>;
  relativeYears?: number[];
};

export const useOutcomesRepartition = ({
  cohorteAnnee,
  cohorteSituation,
  filters,
  relativeYears = [0, 1, 2, 3, 4],
}: UseOutcomesRepartitionParams) =>
  useQuery({
    queryKey: [
      "outcomes",
      "repartition",
      cohorteAnnee,
      cohorteSituation,
      filters.groupe_disciplinaire ?? null,
      filters.sexe ?? null,
      filters.origine_sociale ?? null,
      filters.bac_type ?? null,
      filters.bac_mention ?? null,
      filters.retard_scolaire ?? null,
      filters.devenir_en_un_an ?? null,
      filters.type_de_trajectoire ?? null,
      relativeYears.join(","),
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        annee_rel: relativeYears.join(","),
        cohorte_annee: cohorteAnnee,
        cohorte_situation: cohorteSituation,
      });

      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.append(key, value);
        }
      });

      const response = await fetch(
        `${VITE_APP_SERVER_URL}/outcomes/repartition?${params.toString()}`
      );
      if (!response.ok) {
        throw new Error("Erreur récupération répartition outcomes");
      }
      return response.json() as Promise<OutcomesRepartitionResponse>;
    },
    enabled: !!cohorteAnnee && !!cohorteSituation,
  });

type OutcomesDiplomaRow = {
  diplome: string;
  dontInscrits: number;
  dontSortants: number;
  effectif: number;
  pourcentage: number;
};

type OutcomesPlusHautDiplomeResponse = {
  cohort: { annee: string; situation: string };
  filterOptions: Record<OutcomesFilterField, OutcomesFilterOption[]>;
  filters: Partial<Record<OutcomesFilterField, string>> & {
    cohorte_annee: string;
    cohorte_situation: string;
  };
  lastYear: number;
  rows: OutcomesDiplomaRow[];
  totalStudents: number;
  totals: {
    diplomes: Omit<OutcomesDiplomaRow, "diplome">;
    nonDiplomes: Omit<OutcomesDiplomaRow, "diplome">;
  };
};

type UseOutcomesPlusHautDiplomeParams = {
  cohorteAnnee: string;
  cohorteSituation: string;
  filters: Partial<Record<OutcomesFilterField, string | null>>;
};

export const useOutcomesPlusHautDiplome = ({
  cohorteAnnee,
  cohorteSituation,
  filters,
}: UseOutcomesPlusHautDiplomeParams) =>
  useQuery({
    queryKey: [
      "outcomes",
      "plus-haut-diplome",
      cohorteAnnee,
      cohorteSituation,
      filters.groupe_disciplinaire ?? null,
      filters.sexe ?? null,
      filters.origine_sociale ?? null,
      filters.bac_type ?? null,
      filters.bac_mention ?? null,
      filters.retard_scolaire ?? null,
      filters.devenir_en_un_an ?? null,
      filters.type_de_trajectoire ?? null,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        cohorte_annee: cohorteAnnee,
        cohorte_situation: cohorteSituation,
      });

      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.append(key, value);
        }
      });

      const response = await fetch(
        `${VITE_APP_SERVER_URL}/outcomes/plus-haut-diplome?${params.toString()}`
      );
      if (!response.ok) {
        throw new Error("Erreur récupération plus haut diplôme outcomes");
      }
      return response.json() as Promise<OutcomesPlusHautDiplomeResponse>;
    },
    enabled: !!cohorteAnnee && !!cohorteSituation,
  });
