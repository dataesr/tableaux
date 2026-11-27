const { VITE_APP_SERVER_URL } = import.meta.env;

export async function getData(params) {
  if (params === "") {
    return [];
  }

  const baseUrl = `${VITE_APP_SERVER_URL}/european-projects/overview/funding-evo`;
  const finalUrl = params.length ? `${baseUrl}?${params}` : baseUrl;

  const data = await fetch(finalUrl).then((response) => response.json());

  // Destination = niveau le plus fin : prioritaire si présent dans les paramètres
  const searchParams = new URLSearchParams(params);
  if (Array.isArray(data) && searchParams.get("destinationIds")) {
    return data.map((item) => ({ ...item, level: "destination" }));
  }

  return data;
}