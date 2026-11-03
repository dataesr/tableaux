const { VITE_APP_SERVER_URL } = import.meta.env;

export interface DestinationChartItem {
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

export async function getData(params: string): Promise<DestinationChartItem[]> {
  if (params === "") {
    return [];
  }

  return fetch(`${VITE_APP_SERVER_URL}/european-projects/erc/synthesis-by-destination?${params}`).then((response) => response.json());
}
