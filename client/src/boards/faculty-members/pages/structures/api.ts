import { useQuery, keepPreviousData } from "@tanstack/react-query";

const { VITE_APP_SERVER_URL } = import.meta.env;

export type ViewType = "structure" | "discipline" | "region" | "academie";

export type FacultyScope = "permanents" | "all";

const FILTER_TYPE_MAP: Record<ViewType, string> = {
  structure: "structures",
  discipline: "disciplines",
  region: "regions",
  academie: "academies",
};

export const useFacultyFilters = (viewType: ViewType, year?: string) =>
  useQuery({
    queryKey: ["faculty", "filters", viewType, year ?? null],
    queryFn: async () => {
      const params = new URLSearchParams({ type: FILTER_TYPE_MAP[viewType] });
      if (year) params.append("year", year);
      const response = await fetch(
        `${VITE_APP_SERVER_URL}/faculty-members/filters?${params}`
      );
      if (!response.ok) throw new Error("Erreur récupération filtres");
      return response.json();
    },
  });

export const useFacultyYears = (viewType: ViewType, id?: string) =>
  useQuery({
    queryKey: ["faculty", "years", viewType, id ?? null],
    queryFn: async () => {
      const params = new URLSearchParams({ view: viewType });
      if (id) params.append("id", id);
      const response = await fetch(
        `${VITE_APP_SERVER_URL}/faculty-members/years?${params}`
      );
      if (!response.ok) throw new Error("Erreur récupération années");
      return response.json();
    },
  });

export const useFacultyDashboard = (
  viewType: ViewType,
  id?: string,
  year?: string
) =>
  useQuery({
    queryKey: ["faculty", "dashboard", viewType, id, year],
    queryFn: async () => {
      const params = new URLSearchParams({ view: viewType });
      if (id) params.append("id", id);
      if (year) params.append("year", year);
      const response = await fetch(
        `${VITE_APP_SERVER_URL}/faculty-members/dashboard?${params}`
      );
      if (!response.ok) throw new Error("Erreur récupération dashboard");
      return response.json();
    },
    enabled: !!year,
  });

export const useFacultyEvolution = (viewType: ViewType, id?: string) =>
  useQuery({
    queryKey: ["faculty", "evolution", viewType, id],
    queryFn: async () => {
      const params = new URLSearchParams({ view: viewType });
      if (id) params.append("id", id);
      const response = await fetch(
        `${VITE_APP_SERVER_URL}/faculty-members/evolution?${params}`
      );
      if (!response.ok) throw new Error("Erreur récupération évolution");
      return response.json();
    },
  });

export const useFacultyAnalyses = (
  viewType: ViewType,
  id?: string,
  ageClass?: string,
  gender?: string,
  status?: string
) =>
  useQuery({
    queryKey: ["faculty", "analyses", viewType, id, ageClass, gender, status],
    queryFn: async () => {
      const params = new URLSearchParams({ view: viewType });
      if (id) params.append("id", id);
      if (ageClass) params.append("age_class", ageClass);
      if (gender) params.append("gender", gender);
      if (status) params.append("status", status);
      const response = await fetch(
        `${VITE_APP_SERVER_URL}/faculty-members/analyses?${params}`
      );
      if (!response.ok) throw new Error("Erreur récupération analyses");
      return response.json();
    },
    enabled: !!id,
    placeholderData: keepPreviousData,
  });

export const useFacultyResearchTeachers = (
  viewType: ViewType,
  id?: string,
  year?: string
) =>
  useQuery({
    queryKey: ["faculty", "research-teachers", viewType, id, year],
    queryFn: async () => {
      const params = new URLSearchParams({ view: viewType });
      if (id) params.append("id", id);
      if (year) params.append("year", year);
      const response = await fetch(
        `${VITE_APP_SERVER_URL}/faculty-members/research-teachers?${params}`
      );
      if (!response.ok)
        throw new Error("Erreur récupération enseignants-chercheurs");
      return response.json();
    },
    enabled: !!year,
  });

export const useFaculty2ndDegreeTeachers = (
  viewType: ViewType,
  id?: string,
  year?: string
) =>
  useQuery({
    queryKey: ["faculty", "2nd-degree-teachers", viewType, id, year],
    queryFn: async () => {
      const params = new URLSearchParams({ view: viewType });
      if (id) params.append("id", id);
      if (year) params.append("year", year);
      const response = await fetch(
        `${VITE_APP_SERVER_URL}/faculty-members/2nd-degree-teachers?${params}`
      );
      if (!response.ok)
        throw new Error(
          "Erreur récupération Enseignants 2nd Degré & Arts et Métiers"
        );
      return response.json();
    },
    enabled: !!year,
  });

export const useFacultyNonPermanentsTeachers = (
  viewType: ViewType,
  id?: string,
  year?: string
) =>
  useQuery({
    queryKey: ["faculty", "non-permanents-teachers", viewType, id, year],
    queryFn: async () => {
      const params = new URLSearchParams({ view: viewType });
      if (id) params.append("id", id);
      if (year) params.append("year", year);
      const response = await fetch(
        `${VITE_APP_SERVER_URL}/faculty-members/non-permanents-teachers?${params}`
      );
      if (!response.ok)
        throw new Error("Erreur récupération Enseignants Non Permanents");
      return response.json();
    },
    enabled: !!year,
  });

export type MapLevel = "region" | "academie";

export const useFacultyMapData = (year?: string, level: MapLevel = "region") =>
  useQuery({
    queryKey: ["faculty", "map-data", year, level],
    queryFn: async () => {
      const params = new URLSearchParams({ level });
      if (year) params.append("annee_universitaire", year);
      const response = await fetch(
        `${VITE_APP_SERVER_URL}/faculty-members/geo/map-data?${params}`
      );
      if (!response.ok) throw new Error("Erreur récupération données carte");
      return response.json();
    },
    enabled: !!year,
  });

export const useFacultyComparison = (
  viewType: ViewType,
  id?: string,
  year?: string
) =>
  useQuery({
    queryKey: ["faculty", "comparison", viewType, id, year],
    queryFn: async () => {
      const params = new URLSearchParams({ view: viewType });
      if (id) params.append("id", id);
      if (year) params.append("year", year);
      const response = await fetch(
        `${VITE_APP_SERVER_URL}/faculty-members/comparison?${params}`
      );
      if (!response.ok) throw new Error("Erreur récupération comparaison");
      return response.json();
    },
    enabled: !!id && !!year,
  });

export const useFacultyPositioning = (
  viewType: ViewType,
  year?: string,
  cnuType?: string,
  cnuCode?: number,
  assimilCode?: string
) =>
  useQuery({
    queryKey: [
      "faculty",
      "positioning",
      viewType,
      year,
      cnuType ?? null,
      cnuCode ?? null,
      assimilCode ?? null,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({ view: viewType });
      if (year) params.append("year", year);
      if (cnuType) params.append("cnu_type", cnuType);
      if (cnuCode != null) params.append("cnu_code", String(cnuCode));
      if (assimilCode != null) params.append("assimil_code", assimilCode);
      const response = await fetch(
        `${VITE_APP_SERVER_URL}/faculty-members/positioning?${params}`
      );
      if (!response.ok) throw new Error("Erreur récupération positionnement");
      return response.json();
    },
    enabled: !!year,
    placeholderData: keepPreviousData,
  });

export const useFacultyCnuList = (year?: string) =>
  useQuery({
    queryKey: ["faculty", "cnu-list", year ?? null],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (year) params.append("year", year);
      const response = await fetch(
        `${VITE_APP_SERVER_URL}/faculty-members/cnu-list?${params}`
      );
      if (!response.ok) throw new Error("Erreur récupération liste CNU");
      return response.json() as Promise<{
        groupes: { code: number; label: string }[];
        sections: { code: number; label: string; groupe: number }[];
      }>;
    },
    enabled: !!year,
  });

export const useFacultyAssimilationList = (year?: string) =>
  useQuery({
    queryKey: ["faculty", "assimilation-list", year ?? null],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (year) params.append("year", year);
      const response = await fetch(
        `${VITE_APP_SERVER_URL}/faculty-members/assimilation-list?${params}`
      );
      if (!response.ok)
        throw new Error("Erreur récupération liste assimilation");
      return response.json() as Promise<{
        categories: { code: number; label: string }[];
      }>;
    },
    enabled: !!year,
  });
