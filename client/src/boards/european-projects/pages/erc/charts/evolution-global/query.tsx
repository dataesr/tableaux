const { VITE_APP_SERVER_URL } = import.meta.env;

export interface EvolutionItem {
  call_year: string;
  destination_code: string;
  destination_name_en: string;
  total_funding_project: number;
  total_involved: number;
  total_pi: number;
  total_projects: number;
}

export type EvolutionMetric = "funding" | "pi" | "projects";
export type EvolutionRatio = { value: number; numerator: number; denominator: number };
export interface EvolutionData {
  country: {
    successful: EvolutionItem[];
    evaluated: EvolutionItem[];
  };
  total: {
    successful: EvolutionItem[];
    evaluated: EvolutionItem[];
  };
}

export async function getData(params: string): Promise<EvolutionData> {
  const response = await fetch(`${VITE_APP_SERVER_URL}/european-projects/erc/evolution?${params}`);
  if (!response.ok) throw new Error(`ERC evolution request failed: ${response.status}`);
  return response.json();
}
