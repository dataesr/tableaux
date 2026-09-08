const { VITE_APP_SERVER_URL } = import.meta.env;

export interface MscaPanelChartItem {
  panel_id: string;
  panel_name: string;
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

export async function getData(params: string): Promise<MscaPanelChartItem[]> {
  if (params === "") return [];
  return fetch(`${VITE_APP_SERVER_URL}/european-projects/msca/synthesis-by-panel?${params}`).then((r) => r.json());
}
