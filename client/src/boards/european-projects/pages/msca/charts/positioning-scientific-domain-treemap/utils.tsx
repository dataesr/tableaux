import { useSearchParams } from "react-router-dom";
import { isEjoParam } from "../../../../utils/params";
import { rangeOfYearsToApiFormat } from "../../url-utils";

export function useGetParams() {
  const [searchParams] = useSearchParams();

  const params: string[] = [];

  // Récupérer le paramètre country_code s'il existe
  const countryCode = searchParams.get("country_code") || "FRA";
  params.push(`country_code=${countryCode}`);

  // Filtres additionnels
  // Convertir range_of_years (format URL: pipe-separated) en call_year (format API: comma-separated)
  const rangeOfYears = searchParams.get("range_of_years");
  const callYear = rangeOfYearsToApiFormat(rangeOfYears);
  if (callYear) {
    params.push(`call_year=${callYear}`);
  }

  const framework = searchParams.get("framework");
  if (framework) {
    params.push(`framework=${framework}`);
  }

  if (searchParams.has("isEjo")) {
    params.push(isEjoParam());
  }

  const currentLang = searchParams.get("language") || "fr";

  return { params: params.join("&"), currentLang, countryCode };
}
