import { useSearchParams } from "react-router-dom";
import { isEjoParam } from "../../../../utils/params";
import type { EvolutionPanelData, EvolutionPanelItem } from "./query";
import type { EvolutionMetric, EvolutionRatio } from "../evolution-global/query";
import { calculateRatio, metricFields } from "../evolution-indicator";

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

// Labels des domaines scientifiques
export const DOMAIN_LABELS: Record<string, { fr: string; en: string }> = {
  LS: { fr: "Sciences de la vie", en: "Life Sciences" },
  PE: { fr: "Sciences physiques et ingénierie", en: "Physical Sciences & Engineering" },
  SH: { fr: "Sciences sociales et humaines", en: "Social Sciences & Humanities" },
};

// Variables CSS pour les couleurs des domaines
export const DOMAIN_CSS_VARS: Record<string, string> = {
  LS: "--erc-domain-ls-color",
  PE: "--erc-domain-pe-color",
  SH: "--erc-domain-sh-color",
};

// Ordre de tri des domaines
export const DOMAIN_ORDER = ["LS", "PE", "SH"];

// Fonction pour récupérer la couleur d'un domaine depuis le CSS
export function getDomainColor(domainCode: string): string {
  const rootStyles = getComputedStyle(document.documentElement);
  const cssVar = DOMAIN_CSS_VARS[domainCode];
  if (cssVar) {
    const color = rootStyles.getPropertyValue(cssVar).trim();
    if (color) return color;
  }
  return "#666666";
}

export interface ProcessedEvolutionPanelData {
  years: string[];
  weightSeries: { name: string; color: string; data: (EvolutionRatio | null)[] }[];
  successRateSeries: { name: string; color: string; data: (EvolutionRatio | null)[] }[];
}

/**
 * Calcule le poids des projets et le taux de succès par domaine scientifique
 */
export function processEvolutionPanelData(data: EvolutionPanelData, currentLang: string, metric: EvolutionMetric): ProcessedEvolutionPanelData {
  if (!data || !data.country || !data.total) {
    return { years: [], weightSeries: [], successRateSeries: [] };
  }

  // Récupérer toutes les années uniques triées
  const allYears = new Set<string>();
  [...data.country.successful, ...data.total.successful].forEach((item) => {
    allYears.add(item.call_year);
  });
  const years = Array.from(allYears).sort();

  // Récupérer tous les domaines scientifiques (LS, PE, SH)
  const domains = new Set<string>();
  data.country.successful.forEach((item) => {
    if (DOMAIN_ORDER.includes(item.domaine_scientifique)) {
      domains.add(item.domaine_scientifique);
    }
  });
  data.total.successful.forEach((item) => {
    if (DOMAIN_ORDER.includes(item.domaine_scientifique)) {
      domains.add(item.domaine_scientifique);
    }
  });

  // Créer des maps pour accès rapide
  const createDataMap = (items: EvolutionPanelItem[]) => {
    const map = new Map<string, EvolutionPanelItem>();
    items.forEach((item) => {
      map.set(`${item.call_year}-${item.domaine_scientifique}`, item);
    });
    return map;
  };

  const countrySuccessfulMap = createDataMap(data.country.successful);
  const countryEvaluatedMap = createDataMap(data.country.evaluated);
  const totalSuccessfulMap = createDataMap(data.total.successful);

  // Créer les séries pour le poids des projets
  const weightSeries = DOMAIN_ORDER.filter((domainCode) => domains.has(domainCode)).map((domainCode) => {
    const seriesData = years.map((year) => {
      const countryItem = countrySuccessfulMap.get(`${year}-${domainCode}`);
      const totalItem = totalSuccessfulMap.get(`${year}-${domainCode}`);

      return calculateRatio(countryItem?.[metricFields[metric]], totalItem?.[metricFields[metric]]);
    });

    return {
      name: DOMAIN_LABELS[domainCode]?.[currentLang as "fr" | "en"] || domainCode,
      color: getDomainColor(domainCode),
      data: seriesData,
    };
  });

  // Créer les séries pour le taux de succès
  const successRateSeries = DOMAIN_ORDER.filter((domainCode) => domains.has(domainCode)).map((domainCode) => {
    const seriesData = years.map((year) => {
      const countrySuccessful = countrySuccessfulMap.get(`${year}-${domainCode}`);
      const countryEvaluated = countryEvaluatedMap.get(`${year}-${domainCode}`);

      return calculateRatio(countrySuccessful?.[metricFields[metric]], countryEvaluated?.[metricFields[metric]]);
    });

    return {
      name: DOMAIN_LABELS[domainCode]?.[currentLang as "fr" | "en"] || domainCode,
      color: getDomainColor(domainCode),
      data: seriesData,
    };
  });

  return { years, weightSeries, successRateSeries };
}
