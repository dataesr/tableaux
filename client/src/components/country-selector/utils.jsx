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
 * Récupère les adjectifs de nationalité (masculin et féminin) pour utilisation dans les textes
 * - français : en minuscule (« français », « allemande »)
 * - anglais : avec majuscule (« French », « German »)
 * @param iso3 Code ISO 3 du pays (ex: FRA, DEU, ITA)
 * @param lang Langue : "fr" (par défaut) ou "en"
 * @returns { m: string, f: string } Les adjectifs masculin et féminin
 */
export function getCountryAdjectives(iso3, lang = "fr") {
  const demonym = getCountryDemonym(iso3);
  const isFr = lang !== "en";
  const format = (s) => (isFr ? s.toLowerCase() : s);

  const forms = demonym?.[isFr ? "fr" : "en"];
  if (forms) {
    const fallbackValue = format(iso3);
    return {
      m: forms.m ? format(forms.m) : fallbackValue,
      f: forms.f ? format(forms.f) : fallbackValue,
    };
  }

  // Fallback : nom du pays dans la langue demandée
  const info = getCountryInfo(iso3);
  const name = isFr ? info?.name_fr : info?.name_en;
  if (name) {
    return { m: format(name), f: format(name) };
  }

  return { m: format(iso3), f: format(iso3) };
}

export async function getCountriesWithData() {
  const url = `${VITE_APP_SERVER_URL}/european-projects/get-countries-with-data`;
  return fetch(url).then((response) => response.json());
}