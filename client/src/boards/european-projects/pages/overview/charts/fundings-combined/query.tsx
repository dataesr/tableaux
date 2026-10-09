const { VITE_APP_SERVER_URL } = import.meta.env;

export async function getData(params: string, groupBy: string) {
  if (params === "") {
    return [];
  }

  return fetch(`${VITE_APP_SERVER_URL}/european-projects/overview/funding?${params}&groupBy=${groupBy}`).then((response) => response.json());
}
