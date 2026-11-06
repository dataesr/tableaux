const { VITE_APP_SERVER_URL } = import.meta.env;

export async function getData(params: string) {
  if (params === "") {
    return [];
  }

  const baseUrl = `${VITE_APP_SERVER_URL}/european-projects/overview/pillars-funding-evo-3-years`;
  const finalUrl = params.length ? `${baseUrl}?${params}` : baseUrl;

  return fetch(finalUrl).then((response) => response.json());
}
