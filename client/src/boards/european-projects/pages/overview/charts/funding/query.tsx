const { VITE_APP_SERVER_URL } = import.meta.env;

export async function getData(params: string) {
  if (params === "") {
    return [];
  }

  return fetch(`${VITE_APP_SERVER_URL}/european-projects/overview/funding?${params}`).then((response) => response.json());
}
