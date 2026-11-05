import allCountries from "./all-countries.json";

const { VITE_APP_SERVER_URL } = import.meta.env;

export function getCountryInfo(iso3) {
  const data = allCountries.find((country) => country.cca3 === iso3);
  if (!data) {
    return null;
  }
  return {
    continent: data.continents,
    flag: data.flags[0],
    iso3: data.cca3,
    iso2: data.cca2,
    name_fr: data.translations.fra.common,
    name_en: data.name.common,
  };
}

/**
 * Récupère les adjectifs de nationalité (demonyms) pour un pays donné
 * @param iso3 Code ISO 3 du pays (ex: FRA, DEU, ITA)
 * @returns Objet avec les formes masculin/féminin en français et anglais, ou null si non trouvé
 */
export function getCountryDemonym(iso3) {
  const data = allCountries.find((country) => country.cca3 === iso3);
  if (!data || !data.demonyms) {
    return null;
  }
  return {
    fr: data.demonyms.fra || null,
    en: data.demonyms.eng || null,
  };
}

/**
 * Récupère l'adjectif de nationalité français (masculin singulier, en minuscule)
 * pour utilisation dans les textes comme "les équipes françaises"
 * @param iso3 Code ISO 3 du pays (ex: FRA, DEU, ITA)
 * @returns L'adjectif masculin en minuscule ou le code pays si non trouvé
 */
export function getCountryAdjective(iso3) {
  const demonym = getCountryDemonym(iso3);
  if (demonym?.fr?.m) {
    return demonym.fr.m.toLowerCase();
  }
  // Fallback: retourner le nom du pays
  const info = getCountryInfo(iso3);
  if (info?.name_fr) {
    return info.name_fr.toLowerCase();
  }
  return iso3;
}

/**
 * Récupère les adjectifs de nationalité français (masculin et féminin, en minuscule)
 * pour utilisation dans les textes
 * @param iso3 Code ISO 3 du pays (ex: FRA, DEU, ITA)
 * @returns { m: string, f: string } Les adjectifs masculin et féminin en minuscule
 */
export function getCountryAdjectives(iso3) {
  const demonym = getCountryDemonym(iso3);
  const fallback = iso3.toLowerCase();
  
  if (demonym?.fr) {
    return {
      m: demonym.fr.m ? demonym.fr.m.toLowerCase() : fallback,
      f: demonym.fr.f ? demonym.fr.f.toLowerCase() : fallback,
    };
  }
  
  // Fallback: retourner le nom du pays
  const info = getCountryInfo(iso3);
  if (info?.name_fr) {
    const name = info.name_fr.toLowerCase();
    return { m: name, f: name };
  }
  
  return { m: fallback, f: fallback };
}

export async function getCountriesWithData() {
  const url = `${VITE_APP_SERVER_URL}/european-projects/get-countries-with-data`;
  return fetch(url).then((response) => response.json());
}
