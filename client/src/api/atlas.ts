const { VITE_APP_SERVER_URL } = import.meta.env;

function cleanedParams(params: string) {
  return params.replace(/&?shared/, '');
}

export async function getNumberOfStudentsMap(params: string) {
  const url = `${VITE_APP_SERVER_URL}/atlas/number-of-students-map?${cleanedParams(params)}`;
  return fetch(url).then((response) => response.json());
}

export async function getNumberOfStudents(params: string) {
  const url = `${VITE_APP_SERVER_URL}/atlas/number-of-students?${cleanedParams(params)}`;
  return fetch(url).then((response) => response.json());
}

export async function getReferences(params: string) {
  const url = `${VITE_APP_SERVER_URL}/atlas/get-references?${cleanedParams(params)}`;
  return fetch(url).then((response) => response.json());
}

export async function getNumberOfStudentsByYear(params: string) {
  const url = `${VITE_APP_SERVER_URL}/atlas/number-of-students-by-year?${cleanedParams(params)}`;
  return fetch(url).then((response) => response.json());
}

export async function getFiltersValues(geoId?: string) {
  const url = `${VITE_APP_SERVER_URL}/atlas/get-filters-values${
    geoId ? "?geo_id=" + geoId : ""
  }`;
  return fetch(url).then((response) => response.json());
}

export async function getNumberOfStudentsHistoricByLevel(
  geoId: string,
  currentYear: string
) {
  let level = `niveau_geo=COMMUNE&geo_id=${geoId}`;
  if (geoId.startsWith("R")) {
    level = `niveau_geo=ACADEMIE&reg_id=${geoId}`;
  }
  if (geoId.startsWith("D")) {
    level = `niveau_geo=COMMUNE&dep_id=${geoId}`;
  }
  if (geoId.startsWith("A")) {
    level = `niveau_geo=DEPARTEMENT&aca_id=${geoId}`;
  }
  if (geoId.startsWith("U")) {
    level = `niveau_geo=COMMUNE&uucr_id=${geoId}`;
  }
  if (geoId === "PAYS_100") {
    level = `niveau_geo=REGION`;
  }

  const url = `${VITE_APP_SERVER_URL}/atlas/number-of-students-historic-by-level?${level}`;
  const data = await fetch(url).then((response) => response.json());

  // // Tri par effectif décroissant
  data.data.sort((a, b) => {
    const aEffectif = a.data.find(
      (el) => el.annee_universitaire === currentYear
    )?.effectif;
    const bEffectif = b.data.find(
      (el) => el.annee_universitaire === currentYear
    )?.effectif;
    return bEffectif - aEffectif;
  });
  return data;
}

export async function getNumberOfStudentsByGenderAndLevel(params: string) {
  const url = `${VITE_APP_SERVER_URL}/atlas/number-of-students-by-gender-and-level?${cleanedParams(params)}`;
  return fetch(url).then((response) => response.json());
}

export async function getGeoPolygon(geoId: string) {
  if (!geoId) return null;
  const url = `${VITE_APP_SERVER_URL}/atlas/get-geo-polygons?originalId=${geoId}`;
  return fetch(url).then((response) => response.json());
}

export async function getSimilarElements({
  niveau_geo,
  needle,
  gt,
  lt,
  annee_universitaire,
}: {
  niveau_geo: string;
  needle: string;
  gt: number;
  lt: number;
  annee_universitaire: string;
}) {
  const url = `${VITE_APP_SERVER_URL}/atlas/get-similar-elements?niveau_geo=${niveau_geo}&needle=${needle}&gt=${gt}&lt=${lt}&annee_universitaire=${annee_universitaire}`;
  return fetch(url).then((response) => response.json());
}

export async function getGeoIdsFromSearch(
  q: string,
  territoiresType: string = ""
) {
  let niveau_geo = "";
  if (territoiresType !== "all") {
    niveau_geo = territoiresType;
  }
  const url = `${VITE_APP_SERVER_URL}/atlas/get-geo-ids-from-search?q=${q}&niveau_geo=${niveau_geo}`;
  return fetch(url).then((response) => response.json());
}

export async function getParentsFromGeoId(geoId: string) {
  if (!geoId) return Promise.resolve([]);
  const url = `${VITE_APP_SERVER_URL}/atlas/get-parents-from-geo-id?geo_id=${geoId}`;
  return fetch(url).then((response) => response.json());
}

export async function getNumberOfStudentsBySectorAndSublevel(
  geoId: string,
  currentYear: string
) {
  // ex: http://localhost:3000/api/atlas/number-of-students-by-sector-and-sublevel?aca_id=A11&niveau_geo=DEPARTEMENT
  let params = `niveau_geo=COMMUNE&geo_id=${geoId}&annee_universitaire=${currentYear}&regroupement=TOTAL`;
  if (geoId.startsWith("R")) {
    params = `niveau_geo=ACADEMIE&reg_id=${geoId}`;
  }
  if (geoId.startsWith("D")) {
    params = `niveau_geo=COMMUNE&dep_id=${geoId}`;
  }
  if (geoId.startsWith("A")) {
    params = `niveau_geo=DEPARTEMENT&aca_id=${geoId}`;
  }
  if (geoId.startsWith("U")) {
    params = `niveau_geo=COMMUNE&uucr_id=${geoId}`;
  }
  if (geoId === "PAYS_100") {
    params = `niveau_geo=REGION`;
  }
  const url = `${VITE_APP_SERVER_URL}/atlas/number-of-students-by-sector-and-sublevel?${params}`;
  return fetch(url).then((response) => response.json());
}

export async function getNumberOfStudentsByGenderAndSublevel(
  geoId: string,
  currentYear: string
) {
  // ex: http://localhost:3000/api/atlas/number-of-students-by-gender-and-sublevel?aca_id=A11&niveau_geo=DEPARTEMENT
  let params = `niveau_geo=COMMUNE&geo_id=${geoId}&annee_universitaire=${currentYear}`;
  if (geoId.startsWith("R")) {
    params = `niveau_geo=ACADEMIE&reg_id=${geoId}`;
  }
  if (geoId.startsWith("D")) {
    params = `niveau_geo=COMMUNE&dep_id=${geoId}`;
  }
  if (geoId.startsWith("A")) {
    params = `niveau_geo=DEPARTEMENT&aca_id=${geoId}`;
  }
  if (geoId.startsWith("U")) {
    params = `niveau_geo=COMMUNE&uucr_id=${geoId}`;
  }
  if (geoId === "PAYS_100") {
    params = `niveau_geo=REGION`;
  }
  const url = `${VITE_APP_SERVER_URL}/atlas/number-of-students-by-gender-and-sublevel?${params}`;
  return fetch(url).then((response) => response.json());
}

export async function getNumberOfStudentsByFieldAndSublevel(
  geoId: string,
  currentYear: string,
  field: string = "TOTAL"
) {
  // ex: http://localhost:3000/api/atlas/number-of-students-by-field-and-sublevel?aca_id=A11&niveau_geo=DEPARTEMENT
  let params = `niveau_geo=COMMUNE&geo_id=${geoId}&annee_universitaire=${currentYear}&regroupement=${field}`;
  if (geoId.startsWith("R")) {
    params = `niveau_geo=ACADEMIE&reg_id=${geoId}`;
  }
  if (geoId.startsWith("D")) {
    params = `niveau_geo=COMMUNE&dep_id=${geoId}`;
  }
  if (geoId.startsWith("A")) {
    params = `niveau_geo=DEPARTEMENT&aca_id=${geoId}&regroupement=${field}`;
  }
  if (geoId.startsWith("U")) {
    params = `niveau_geo=COMMUNE&uucr_id=${geoId}`;
  }
  if (geoId === "PAYS_100") {
    params = `niveau_geo=REGION`;
  }
  const url = `${VITE_APP_SERVER_URL}/atlas/number-of-students-by-field-and-sublevel?${params}`;
  return fetch(url).then((response) => response.json());
}
