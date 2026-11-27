const { VITE_APP_SERVER_URL } = import.meta.env;

// Données déjà triées par l'API (destination_sort, vides en fin)
export async function getData(params: string) {
  if (params === "") return { data: [] };

  const response = await fetch(`${VITE_APP_SERVER_URL}/european-projects/overview/funding-proportion?${params}&groupBy=destination`);
  return response.json();
}
