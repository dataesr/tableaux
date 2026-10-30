const { VITE_APP_SERVER_URL } = import.meta.env;

export async function getData(params: string) {
  let url = `${VITE_APP_SERVER_URL}/european-projects/beneficiaries/main-beneficiaries-pct-50`;
  if (params !== "") {
    url += `?${params}`;
  }

  return fetch(url).then((response) => response.json());
}
