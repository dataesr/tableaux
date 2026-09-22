const { VITE_APP_SERVER_URL } = import.meta.env;

export async function getData(params: string) {
  // if (params === "") {
  //   return [];
  // }

  console.log("params", params);
  // showAllPrograms
  return fetch(`${VITE_APP_SERVER_URL}/european-projects/overview/funding?${params}&showAllPrograms=true`).then((response) => response.json());
}
