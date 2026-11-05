const { VITE_APP_SERVER_URL } = import.meta.env;

export async function getData(params: string, entityType: string) {
  if (params === "") {
    return [];
  }
  const searchParams = new URLSearchParams(params);
  searchParams.append("cordis_type_entity_code", entityType);

  return fetch(`${VITE_APP_SERVER_URL}/european-projects/type-beneficiaries/type-beneficiaries-evolution?${searchParams.toString()}`).then(
    (response) => response.json(),
  );
}
