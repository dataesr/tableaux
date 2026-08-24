const { VITE_APP_SERVER_URL } = import.meta.env;

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MscaCountryData {
  country_code: string;
  country_name_fr: string;
  country_name_en: string;
  total_funding_project: number;
  total_involved: number;
  total_projects: number;
  total_pi: number;
}

export interface MscaStageSummary {
  total_funding_project: number;
  total_involved: number;
  total_projects: number;
  total_coordinations: number;
  countries: MscaCountryData[];
}

export interface MscaSynthesisResponse {
  successful: MscaStageSummary | null;
  evaluated: MscaStageSummary | null;
}

export interface MscaDestinationData {
  destination_code: string;
  destination_name_en: string;
  evaluated: {
    total_funding_project: number;
    total_involved: number;
    total_projects: number;
    total_coordinations: number;
  } | null;
  successful: {
    total_funding_project: number;
    total_involved: number;
    total_projects: number;
    total_coordinations: number;
  } | null;
}

export interface MscaPanelData {
  panel_id: string;
  panel_name: string;
  evaluated: {
    total_funding: number;
    total_involved: number;
    total_coordinations: number;
    total_projects: number;
  } | null;
  successful: {
    total_funding: number;
    total_involved: number;
    total_coordinations: number;
    total_projects: number;
  } | null;
}

export interface MscaFiltersResponse {
  years: string[];
  destinations: { code: string; name: string }[];
  frameworks: string[];
  yearsByFramework: Record<string, string[]>;
}

// ─── API Functions ────────────────────────────────────────────────────────────

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
}

export async function getMscaSynthesis(params?: {
  country_code?: string;
  call_year?: string;
  destination_code?: string;
}): Promise<MscaSynthesisResponse> {
  const searchParams = new URLSearchParams();
  if (params?.country_code) searchParams.append("country_code", params.country_code);
  if (params?.call_year) searchParams.append("call_year", params.call_year);
  if (params?.destination_code) searchParams.append("destination_code", params.destination_code);

  const qs = searchParams.toString();
  return fetchJson(`${VITE_APP_SERVER_URL}/european-projects/msca/synthesis${qs ? `?${qs}` : ""}`);
}

export async function getMscaSynthesisByDestination(params?: { country_code?: string; call_year?: string }): Promise<MscaDestinationData[]> {
  const searchParams = new URLSearchParams();
  if (params?.country_code) searchParams.append("country_code", params.country_code);
  if (params?.call_year) searchParams.append("call_year", params.call_year);

  const qs = searchParams.toString();
  return fetchJson(`${VITE_APP_SERVER_URL}/european-projects/msca/synthesis-by-destination${qs ? `?${qs}` : ""}`);
}

export async function getMscaSynthesisByPanel(params?: {
  country_code?: string;
  call_year?: string;
  destination_code?: string;
}): Promise<MscaPanelData[]> {
  const searchParams = new URLSearchParams();
  if (params?.country_code) searchParams.append("country_code", params.country_code);
  if (params?.call_year) searchParams.append("call_year", params.call_year);
  if (params?.destination_code) searchParams.append("destination_code", params.destination_code);

  const qs = searchParams.toString();
  return fetchJson(`${VITE_APP_SERVER_URL}/european-projects/msca/synthesis-by-panel${qs ? `?${qs}` : ""}`);
}

export async function getMscaFilters(): Promise<MscaFiltersResponse> {
  return fetchJson(`${VITE_APP_SERVER_URL}/european-projects/msca/filters`);
}
