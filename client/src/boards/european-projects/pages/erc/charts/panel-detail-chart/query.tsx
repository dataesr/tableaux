const { VITE_APP_SERVER_URL } = import.meta.env;

export interface PanelDetailItem {
  panel_id: string;
  panel_name: string;
  panel_lib: string;
  domaine_scientifique: string;
  domaine_name_scientifique: string;
  evaluated: {
    total_funding_entity: number;
    total_projects: number;
    total_pi: number;
  } | null;
  successful: {
    total_funding_entity: number;
    total_projects: number;
    total_pi: number;
  } | null;
}

export async function getData(params: string): Promise<PanelDetailItem[]> {
  if (params === "") {
    return [];
  }

  return fetch(`${VITE_APP_SERVER_URL}/european-projects/erc/synthesis-by-panel?${params}`).then((response) => response.json());
}
