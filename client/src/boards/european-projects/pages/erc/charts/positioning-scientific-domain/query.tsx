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
  total_projects: number;
  countries: CountryData[];
}

export interface PositioningByDomainData {
  successful: SynthesisData | null;
  evaluated: SynthesisData | null;
}

export interface PanelInfo {
  panel_id: string;
  panel_name: string;
  panel_lib: string;
  domaine_scientifique: string;
}

export async function getData(params: string): Promise<PositioningByDomainData> {
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

export async function getDataByPanel(params: string, panelId: string): Promise<PositioningByDomainData> {
  if (params === "") {
    return { successful: null, evaluated: null };
  }

  const baseParams = params
    .split("&")
    .filter((p) => !p.startsWith("country_code=") && !p.startsWith("domaine_scientifique="))
    .join("&");

  const sep = baseParams ? "&" : "";
  return fetch(`${VITE_APP_SERVER_URL}/european-projects/erc/synthesis?${baseParams}${sep}panel_id=${panelId}`).then((r) => r.json());
}

export async function getPanelsList(params: string): Promise<PanelInfo[]> {
  if (params === "") return [];

  const baseParams = params
    .split("&")
    .filter((p) => !p.startsWith("country_code=") && !p.startsWith("domaine_scientifique="))
    .join("&");

  const url = baseParams
    ? `${VITE_APP_SERVER_URL}/european-projects/erc/synthesis-by-panel?${baseParams}`
    : `${VITE_APP_SERVER_URL}/european-projects/erc/synthesis-by-panel`;

  const data: Array<{ panel_id: string; panel_name: string; panel_lib: string; domaine_scientifique: string }> = await fetch(url).then((r) =>
    r.json(),
  );

  return data.map((item) => ({
    panel_id: item.panel_id,
    panel_name: item.panel_name,
    panel_lib: item.panel_lib,
    domaine_scientifique: item.domaine_scientifique,
  }));
}
