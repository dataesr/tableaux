const { VITE_APP_SERVER_URL } = import.meta.env;

export async function GetData(pillarId: string | null, rangeOfYears: string | null, countryCode: string | null) {
  const params: string[] = [];

  if (pillarId) params.push(`pillars=${pillarId}`);
  if (countryCode) params.push(`country_code=${countryCode}`);
  if (rangeOfYears) params.push(`range_of_years=${rangeOfYears}`);

  const baseUrl = `${VITE_APP_SERVER_URL}/european-projects/overview/pillars-funding-evo-3-years`;
  const finalUrl = params.length ? `${baseUrl}?${params.join("&")}` : baseUrl;

  return fetch(finalUrl).then((response) => response.json());
}
