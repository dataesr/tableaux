/**
 * Utilitaires pour la gestion des paramètres d'URL de la page MSCA
 * Les paramètres autorisés sont : country_code, range_of_years, language, section
 */

const ALLOWED_PARAMS = ["country_code", "range_of_years", "language", "section", "isEjo"];

/**
 * Nettoie les paramètres d'URL pour ne garder que ceux autorisés
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
 */
export function needsUrlCleaning(searchParams: URLSearchParams): boolean {
  const keys = Array.from(searchParams.keys());
  return keys.some((key) => !ALLOWED_PARAMS.includes(key));
}

/**
 * Convertit le format range_of_years (pipe-separated) vers le format API (comma-separated)
 */
export function rangeOfYearsToApiFormat(rangeOfYears: string | null): string | undefined {
  if (!rangeOfYears) return undefined;
  return rangeOfYears.split("|").join(",");
}
