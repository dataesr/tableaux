const { VITE_APP_SERVER_URL } = import.meta.env;

export interface EvolutionPanelDetailItem {
  call_year: string;
  panel_id: string;
  panel_name: string;
  panel_lib: string;
  domaine_scientifique: string;
  domaine_name_scientifique: string;
  total_funding_project: number;
  total_funding_entity: number;
  total_involved: number;
  total_pi: number;
  total_projects: number;
}

export interface EvolutionPanelDetailData {
  country: {
    successful: EvolutionPanelDetailItem[];
    evaluated: EvolutionPanelDetailItem[];
  };
  total: {
    successful: EvolutionPanelDetailItem[];
    evaluated: EvolutionPanelDetailItem[];
  };
}

export async function getData(params: string): Promise<EvolutionPanelDetailData> {
  if (params === "") {
    return {
      country: { successful: [], evaluated: [] },
      total: { successful: [], evaluated: [] },
    };
  }

  return fetch(`${VITE_APP_SERVER_URL}/european-projects/erc/evolution-by-panel?${params}`).then((response) => response.json());
}
