const { VITE_APP_SERVER_URL } = import.meta.env;

export interface MscaDestinationChartItem {
  destination_code: string;
  destination_name_en: string;
  evaluated: {
    total_funding_project: number;
    total_involved: number;
    total_projects: number;
  } | null;
  successful: {
    total_funding_project: number;
    total_involved: number;
    total_projects: number;
  } | null;
}

export async function getData(params: string): Promise<MscaDestinationChartItem[]> {
  if (params === "") return [];
  return fetch(`${VITE_APP_SERVER_URL}/european-projects/msca/synthesis-by-destination?${params}`).then((r) => r.json());
}
