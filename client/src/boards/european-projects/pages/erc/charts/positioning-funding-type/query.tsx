const { VITE_APP_SERVER_URL } = import.meta.env;

export interface CountryData {
  country_code: string;
  country_name_fr: string;
  country_name_en: string;
  total_funding_project: number;
  total_funding_entity: number;
  total_involved: number;
  total_pi: number;
  total_projects: number;
}

export interface SynthesisData {
  total_funding_project: number;
  total_funding_entity: number;
  total_involved: number;
  total_pi: number;
  countries: CountryData[];
}

export interface PositioningByFundingTypeData {
  successful: SynthesisData | null;
  evaluated: SynthesisData | null;
}

export async function getData(params: string): Promise<PositioningByFundingTypeData> {
  if (params === "") {
    return { successful: null, evaluated: null };
  }

  // Supprimer le filtre country_code pour avoir tous les pays
  const baseParams = params
    .split("&")
    .filter((p) => !p.startsWith("country_code="))
    .join("&");

  return fetch(`${VITE_APP_SERVER_URL}/european-projects/erc/synthesis?${baseParams}`).then((r) => r.json());
}
