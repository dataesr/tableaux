const { VITE_APP_SERVER_URL } = import.meta.env;

// Types pour les données ERC
export interface ErcCountryData {
  country_code: string;
  country_name_fr: string;
  country_name_en: string;
  total_funding_project: number;
  total_funding_entity: number;
  total_involved: number;
  total_pi: number;
  total_projects: number;
}

export interface ErcSynthesisData {
  total_funding_project: number;
  total_funding_entity: number;
  total_involved: number;
  total_pi: number;
  total_projects: number;
  countries: ErcCountryData[];
}

export interface ErcSynthesisResponse {
  successful: ErcSynthesisData | null;
  evaluated: ErcSynthesisData | null;
}

export interface ErcDestinationData {
  destination_code: string;
  destination_name_en: string;
  evaluated: {
    total_funding_project: number;
    total_funding_entity: number;
    total_projects: number;
    total_pi: number;
  } | null;
  successful: {
    total_funding_project: number;
    total_funding_entity: number;
    total_projects: number;
    total_pi: number;
  } | null;
}

export interface ErcPanelData {
  panel_id: string;
  panel_name: string;
  panel_lib: string;
  domaine_scientifique: string;
  domaine_name_scientifique: string;
  evaluated: {
    total_funding_entity: number;
    total_involved: number;
    total_projects: number;
    total_pi: number;
  } | null;
  successful: {
    total_funding_entity: number;
    total_involved: number;
    total_projects: number;
    total_pi: number;
  } | null;
}

export interface ErcEvolutionData {
  call_year: string;
  destination_code: string;
  destination_name_en: string;
  total_funding_project: number;
  total_involved: number;
  total_projects: number;
  total_pi: number;
}

export interface ErcEvolutionResponse {
  successful: ErcEvolutionData[];
  evaluated: ErcEvolutionData[];
}

export interface ErcFiltersResponse {
  years: string[];
  destinations: { code: string; name: string }[];
  panels: { id: string; name: string; lib: string; domaine: string; domaine_name: string }[];
  frameworks: string[];
  yearsByFramework: Record<string, string[]>;
}

// API Functions
export async function getErcSynthesis(params?: {
  country_code?: string;
  call_year?: string;
  destination_code?: string;
  panel_id?: string;
}): Promise<ErcSynthesisResponse> {
  const searchParams = new URLSearchParams();

  if (params?.country_code) searchParams.append("country_code", params.country_code);
  if (params?.call_year) searchParams.append("call_year", params.call_year);
  if (params?.destination_code) searchParams.append("destination_code", params.destination_code);
  if (params?.panel_id) searchParams.append("panel_id", params.panel_id);

  const queryString = searchParams.toString();
  const url = `${VITE_APP_SERVER_URL}/european-projects/erc/synthesis${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export async function getErcSynthesisByDestination(params?: {
  country_code?: string;
  call_year?: string;
  panel_id?: string;
}): Promise<ErcDestinationData[]> {
  const searchParams = new URLSearchParams();

  if (params?.country_code) searchParams.append("country_code", params.country_code);
  if (params?.call_year) searchParams.append("call_year", params.call_year);
  if (params?.panel_id) searchParams.append("panel_id", params.panel_id);

  const queryString = searchParams.toString();
  const url = `${VITE_APP_SERVER_URL}/european-projects/erc/synthesis-by-destination${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export async function getErcSynthesisByPanel(params?: { country_code?: string; call_year?: string; destination_code?: string }): Promise<ErcPanelData[]> {
  const searchParams = new URLSearchParams();

  if (params?.country_code) searchParams.append("country_code", params.country_code);
  if (params?.call_year) searchParams.append("call_year", params.call_year);
  if (params?.destination_code) searchParams.append("destination_code", params.destination_code);

  const queryString = searchParams.toString();
  const url = `${VITE_APP_SERVER_URL}/european-projects/erc/synthesis-by-panel${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export async function getErcEvolution(params?: { country_code?: string; destination_code?: string; panel_id?: string }): Promise<ErcEvolutionResponse> {
  const searchParams = new URLSearchParams();

  if (params?.country_code) searchParams.append("country_code", params.country_code);
  if (params?.destination_code) searchParams.append("destination_code", params.destination_code);
  if (params?.panel_id) searchParams.append("panel_id", params.panel_id);

  const queryString = searchParams.toString();
  const url = `${VITE_APP_SERVER_URL}/european-projects/erc/evolution${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export async function getErcFilters(): Promise<ErcFiltersResponse> {
  const url = `${VITE_APP_SERVER_URL}/european-projects/erc/filters`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}
