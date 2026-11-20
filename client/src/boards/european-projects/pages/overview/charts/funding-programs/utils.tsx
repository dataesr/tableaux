import { useSearchParams } from "react-router-dom";
import { isEjoParam } from "../../../../utils/params";
import { getCountryNameWithArticle } from "../../../../utils/country-mapping";
import { getCountryAdjectives } from "../../../../../../components/country-selector/utils.jsx";


export function useGetParams() {
  const [searchParams] = useSearchParams();

  const params: string[] = [];

  // Récupérer le paramètre country_code s'il existe
  const countryCode = searchParams.get("country_code");
  if (countryCode) {
    params.push(`country_code=${countryCode}`);
  }

  // Récupérer le paramètre pillarId et l'ajouter comme pillars s'il existe
  const pillarId = searchParams.get("pillarId");
  if (pillarId) {
    params.push(`pillars=${pillarId}`);
  }

  // Récupérer le paramètre programId et l'ajouter comme programs s'il existe
  const programId = searchParams.get("programId");
  if (programId) {
    params.push(`programs=${programId}`);
  }

  // Récupérer le paramètre thematicIds et l'ajouter comme topics s'il existe
  const thematicIds = searchParams.get("thematicIds");
  if (thematicIds) {
    params.push(`thematics=${thematicIds}`);
  }

  // Récupérer le paramètre structureid s'il existe
  const structureId = searchParams.get("structureid");
  if (structureId) {
    params.push(`structureid=${structureId}`);
  }

  const rangeOfYears = searchParams.get("range_of_years");
  if (rangeOfYears) {
    params.push(`range_of_years=${encodeURIComponent(rangeOfYears)}`);
  }

  if (searchParams.has("isEjo")) {
    params.push(isEjoParam());
  }

  const currentLang = (searchParams.get("language") === "en" ? "en" : "fr") as "fr" | "en";
  const code = countryCode || "FRA";
  const countryN = getCountryNameWithArticle(code, currentLang).replace(/^(Le |La |Les |L')/, (m) => m.toLowerCase());

  // const countryAdj = getCountryAdjectives(code, currentLang);
  // // Pluriel seulement en français
  // const adjMascPlural =
  // currentLang === "fr" && !countryAdj.m.endsWith("s") ? `${countryAdj.m}s` : countryAdj.m;


  return{ params: params.join("&"), currentLang, countryN};
}
