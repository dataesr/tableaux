const { VITE_APP_SERVER_URL } = import.meta.env;

export interface EvolutionPanelItem {
  call_year: string;
  domaine_scientifique: string;
  domaine_name_scientifique: string;
  total_funding_project: number;
  total_involved: number;
  total_pi: number;
  total_projects: number;
}

export interface EvolutionPanelData {
  country: {
    successful: EvolutionPanelItem[];
    evaluated: EvolutionPanelItem[];
  };
  total: {
    successful: EvolutionPanelItem[];
    evaluated: EvolutionPanelItem[];
  };
}

export async function getData(params: string): Promise<EvolutionPanelData> {
  if (params === "") {
    return {
      country: { successful: [], evaluated: [] },
      total: { successful: [], evaluated: [] },
    };
  }

  return fetch(`${VITE_APP_SERVER_URL}/european-projects/erc/evolution-by-domain?${params}`).then((response) => response.json());
}
