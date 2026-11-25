const { VITE_APP_SERVER_URL } = import.meta.env;

export interface ErcEntityData {
  name: string;
  acronym: string | null;
  total_fund_eur: number;
  total_pi?: number;
  total_projects?: number;
}

export interface ErcDomainPanelEntitiesData {
  total_fund_eur: number;
  total_pi?: number;
  total_projects?: number;
  list: ErcEntityData[];
}

export async function getAllData(params: string, byDomain: boolean): Promise<ErcDomainPanelEntitiesData> {
  if (!params) return { total_fund_eur: 0, list: [] };
  const endpoint = byDomain ? "main-entities-by-domain" : "main-entities";
  return fetch(`${VITE_APP_SERVER_URL}/european-projects/erc/${endpoint}?${params}&limit=all`).then((r) => r.json());
}
