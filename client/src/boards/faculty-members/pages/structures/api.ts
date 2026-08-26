import { useQuery, keepPreviousData } from "@tanstack/react-query";

const { VITE_APP_SERVER_URL } = import.meta.env;

export type ViewType = "structure" | "discipline" | "region" | "academie";
export type FacultyScope = "permanents" | "all";
export type MapLevel = "region" | "academie";

const FILTER_TYPE_MAP: Record<ViewType, string> = {
  structure: "structures",
  discipline: "disciplines",
  region: "regions",
  academie: "academies",
};

type Query = Record<string, string | number | undefined>;

// Un seul point d'accès réseau : construit l'URL, lance la requête, renvoie le JSON.
async function get<T = any>(path: string, query: Query = {}): Promise<T> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value != null && value !== "") params.append(key, String(value));
  }
  const response = await fetch(
    `${VITE_APP_SERVER_URL}/faculty-members/${path}?${params}`
  );
  if (!response.ok) throw new Error(`Erreur de récupération : ${path}`);
  return response.json() as Promise<T>;
}

// La fabrique de clés — toutes les clés de cette ressource, au même endroit.
export const facultyMembersKeys = {
  all: ["faculty"] as const,
  filters: (view: ViewType, year?: string) =>
    [...facultyMembersKeys.all, "filters", view, year ?? null] as const,
  years: (view: ViewType, id?: string) =>
    [...facultyMembersKeys.all, "years", view, id ?? null] as const,
  dashboard: (view: ViewType, id?: string, year?: string) =>
    [...facultyMembersKeys.all, "dashboard", view, id, year] as const,
  evolution: (view: ViewType, id?: string) =>
    [...facultyMembersKeys.all, "evolution", view, id] as const,
  analyses: (
    view: ViewType,
    id?: string,
    ageClass?: string,
    gender?: string,
    status?: string
  ) =>
    [...facultyMembersKeys.all, "analyses", view, id, ageClass, gender, status] as const,
  population: (endpoint: string, view: ViewType, id?: string, year?: string) =>
    [...facultyMembersKeys.all, endpoint, view, id, year] as const,
  mapData: (year?: string, level?: MapLevel) =>
    [...facultyMembersKeys.all, "map-data", year, level] as const,
  positioning: (
    view: ViewType,
    year?: string,
    cnuType?: string,
    cnuCode?: number,
    assimilCode?: string
  ) =>
    [
      ...facultyMembersKeys.all,
      "positioning",
      view,
      year,
      cnuType ?? null,
      cnuCode ?? null,
      assimilCode ?? null,
    ] as const,
  cnuList: (year?: string) =>
    [...facultyMembersKeys.all, "cnu-list", year ?? null] as const,
  assimilationList: (year?: string) =>
    [...facultyMembersKeys.all, "assimilation-list", year ?? null] as const,
};

export const useFacultyFilters = (view: ViewType, year?: string) =>
  useQuery({
    queryKey: facultyMembersKeys.filters(view, year),
    queryFn: () => get("filters", { type: FILTER_TYPE_MAP[view], year }),
  });

export const useFacultyYears = (view: ViewType, id?: string) =>
  useQuery({
    queryKey: facultyMembersKeys.years(view, id),
    queryFn: () => get("years", { view, id }),
  });

export const useFacultyDashboard = (view: ViewType, id?: string, year?: string) =>
  useQuery({
    queryKey: facultyMembersKeys.dashboard(view, id, year),
    queryFn: () => get("dashboard", { view, id, year }),
    enabled: !!year,
  });

export const useFacultyEvolution = (view: ViewType, id?: string) =>
  useQuery({
    queryKey: facultyMembersKeys.evolution(view, id),
    queryFn: () => get("evolution", { view, id }),
  });

export const useFacultyAnalyses = (
  view: ViewType,
  id?: string,
  ageClass?: string,
  gender?: string,
  status?: string
) =>
  useQuery({
    queryKey: facultyMembersKeys.analyses(view, id, ageClass, gender, status),
    queryFn: () =>
      get("analyses", { view, id, age_class: ageClass, gender, status }),
    enabled: !!id,
    placeholderData: keepPreviousData,
  });

// Les trois populations partagent la même requête ; seul l'endpoint change.
const usePopulation = (
  endpoint: string,
  view: ViewType,
  id?: string,
  year?: string
) =>
  useQuery({
    queryKey: facultyMembersKeys.population(endpoint, view, id, year),
    queryFn: () => get(endpoint, { view, id, year }),
    enabled: !!year,
  });

export const useFacultyResearchTeachers = (
  view: ViewType,
  id?: string,
  year?: string
) => usePopulation("research-teachers", view, id, year);

export const useFaculty2ndDegreeTeachers = (
  view: ViewType,
  id?: string,
  year?: string
) => usePopulation("2nd-degree-teachers", view, id, year);

export const useFacultyNonPermanentsTeachers = (
  view: ViewType,
  id?: string,
  year?: string
) => usePopulation("non-permanents-teachers", view, id, year);

export const useFacultyMapData = (year?: string, level: MapLevel = "region") =>
  useQuery({
    queryKey: facultyMembersKeys.mapData(year, level),
    queryFn: () => get("geo/map-data", { level, annee_universitaire: year }),
    enabled: !!year,
  });

export const useFacultyPositioning = (
  view: ViewType,
  year?: string,
  cnuType?: string,
  cnuCode?: number,
  assimilCode?: string
) =>
  useQuery({
    queryKey: facultyMembersKeys.positioning(view, year, cnuType, cnuCode, assimilCode),
    queryFn: () =>
      get("positioning", {
        view,
        year,
        cnu_type: cnuType,
        cnu_code: cnuCode,
        assimil_code: assimilCode,
      }),
    enabled: !!year,
    placeholderData: keepPreviousData,
  });

type CnuList = {
  groupes: { code: number; label: string }[];
  sections: { code: number; label: string; groupe: number }[];
};

export const useFacultyCnuList = (year?: string) =>
  useQuery({
    queryKey: facultyMembersKeys.cnuList(year),
    queryFn: () => get<CnuList>("cnu-list", { year }),
    enabled: !!year,
  });

type AssimilationList = { categories: { code: number; label: string }[] };

export const useFacultyAssimilationList = (year?: string) =>
  useQuery({
    queryKey: facultyMembersKeys.assimilationList(year),
    queryFn: () => get<AssimilationList>("assimilation-list", { year }),
    enabled: !!year,
  });
