import { useSearchParams } from "react-router-dom";
import { isEjoParam } from "../../../../utils/params";
import type { EvolutionMetric, EvolutionRatio } from "./query";

export function useGetParams() {
  const [searchParams] = useSearchParams();

  const params: string[] = [];

  // Récupérer le paramètre country_code s'il existe
  const countryCode = searchParams.get("country_code") || "FRA";
  params.push(`country_code=${countryCode}`);

  const currentLang = searchParams.get("language") || "fr";

  if (searchParams.has("isEjo")) {
    params.push(isEjoParam());
  }

  return { params: params.join("&"), currentLang };
}

// Labels des types de financement
export const DESTINATION_LABELS: Record<string, { fr: string; en: string }> = {
  ADG: { fr: "Advanced grants", en: "Advanced grants" },
  COG: { fr: "Consolidator grants", en: "Consolidator grants" },
  STG: { fr: "Starting grants", en: "Starting grants" },
  SYG: { fr: "Synergy grants", en: "Synergy grants" },
  POC: { fr: "Proof of concept grants", en: "Proof of concept grants" },
};


export function formatRatio(ratio: EvolutionRatio, metric: EvolutionMetric, lang: string) {
  const format = new Intl.NumberFormat(lang === "en" ? "en" : "fr", metric === "funding"
    ? { style: "currency", currency: "EUR", maximumFractionDigits: 2 }
    : { maximumFractionDigits: 0 });
  return `${ratio.value}% (${format.format(ratio.numerator)} / ${format.format(ratio.denominator)})`;
}