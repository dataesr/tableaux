/**
 * Utilitaires pour la gestion des paramètres d'URL de la page ERC
 * Les paramètres autorisés sont : country_code, range_of_years, language
 */

const ALLOWED_PARAMS = ["country_code", "range_of_years", "language", "section", "isEjo"];

/**
 * Nettoie les paramètres d'URL pour ne garder que ceux autorisés
 * @param searchParams Les paramètres de recherche actuels
 * @returns Les paramètres nettoyés
 */
export function cleanUrlParams(searchParams: URLSearchParams): URLSearchParams {
  const cleanedParams = new URLSearchParams();

  ALLOWED_PARAMS.forEach((param) => {
    const value = searchParams.get(param);
    if (value) {
      cleanedParams.set(param, value);
    }
  });

  return cleanedParams;
}

/**
 * Vérifie si l'URL actuelle contient des paramètres non autorisés
 * @param searchParams Les paramètres de recherche actuels
 * @returns true si l'URL doit être nettoyée
 */
export function needsUrlCleaning(searchParams: URLSearchParams): boolean {
  const keys = Array.from(searchParams.keys());
  return keys.some((key) => !ALLOWED_PARAMS.includes(key));
}

/**
 * Construit l'URL avec les paramètres fournis
 * @param params Objet contenant les paramètres
 * @returns URLSearchParams propres
 */
export function buildUrlParams(params: { country_code?: string; range_of_years?: string; language?: string }): URLSearchParams {
  const searchParams = new URLSearchParams();

  if (params.country_code) {
    searchParams.set("country_code", params.country_code);
  }
  if (params.range_of_years) {
    searchParams.set("range_of_years", params.range_of_years);
  }
  if (params.language) {
    searchParams.set("language", params.language);
  }

  return searchParams;
}

/**
 * Convertit le format range_of_years (pipe-separated) vers le format API (comma-separated)
 * @param rangeOfYears ex: "2021|2022|2023"
 * @returns ex: "2021,2022,2023"
 */
export function rangeOfYearsToApiFormat(rangeOfYears: string | null): string | undefined {
  if (!rangeOfYears) return undefined;
  return rangeOfYears.split("|").join(",");
}
