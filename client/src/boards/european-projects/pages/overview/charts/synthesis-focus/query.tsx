const { VITE_APP_SERVER_URL } = import.meta.env;

export async function getData(params: string) {
  let url = `${VITE_APP_SERVER_URL}/european-projects/synthesis-focus`;
  if (params !== "") {
    url = `${VITE_APP_SERVER_URL}/european-projects/synthesis-focus?${params}`;
  }

  return fetch(url).then((response) => response.json());
}
