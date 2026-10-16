const { VITE_APP_SERVER_URL } = import.meta.env;

export async function GetData(destinationIds: string | null, thematicIds: string | null, rangeOfYears: string | null, countryCode: string | null) {
  const params: string[] = [];

  if (destinationIds) params.push(`destinationIds=${destinationIds}`);
  if (thematicIds) params.push(`thematicIds=${thematicIds}`);
  if (countryCode) params.push(`country_code=${countryCode}`);
  if (rangeOfYears) params.push(`range_of_years=${rangeOfYears}`);

  const baseUrl = `${VITE_APP_SERVER_URL}/european-projects/overview/funding-evo`;
  const finalUrl = params.length ? `${baseUrl}?${params.join("&")}` : baseUrl;

  return fetch(finalUrl).then((response) => response.json());
}
