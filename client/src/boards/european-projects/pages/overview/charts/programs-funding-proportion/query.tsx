const { VITE_APP_SERVER_URL } = import.meta.env;

// Données déjà triées par l'API (programme_code)
export async function getData(params: string) {
  if (params === "")  { return [] };

  const response = await fetch(`${VITE_APP_SERVER_URL}/european-projects/overview/funding-proportion?${params}&groupBy=program`);
  return response.json();
}