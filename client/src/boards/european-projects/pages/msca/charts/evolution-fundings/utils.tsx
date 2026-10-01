import { useSearchParams } from "react-router-dom";
import { getCssColor } from "../../../../../../utils/colors";
import { isEjoParam } from "../../../../utils/params";
import type { EvolutionData, EvolutionItem } from "./query";

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
  COFUND: {
    fr: "Co-funding of regional, national and international programmes",
    en: "Co-funding of regional, national and international programmes",
  },
  DN: { fr: "Doctoral Networks", en: "Doctoral Networks" },
  PF: { fr: "Postdoctoral Fellowships", en: "Postdoctoral Fellowships" },
  SE: { fr: "Staff Exchanges", en: "Staff Exchanges" },
  CITIZENS: { fr: "European Researchers' Night", en: "European Researchers' Night" },
};

export interface ProcessedEvolutionData {
  years: string[];
  weightSeries: { name: string; color: string; data: (number | null)[] }[];
  successRateSeries: { name: string; color: string; data: (number | null)[] }[];
}

/**
 * Calcule le poids des projets et le taux de succès
 */
export function processEvolutionData(data: EvolutionData, currentLang: string = "fr"): ProcessedEvolutionData {
  if (!data || !data.country || !data.total) {
    return { years: [], weightSeries: [], successRateSeries: [] };
  }

  // Récupérer toutes les années uniques triées
  const allYears = new Set<string>();
  [...data.country.successful, ...data.total.successful].forEach((item) => {
    allYears.add(item.call_year);
  });
  const years = Array.from(allYears).sort();

  // Récupérer tous les types de financement
  const destinations = new Set<string>();
  data.country.successful.forEach((item) => destinations.add(item.destination_code));
  data.total.successful.forEach((item) => destinations.add(item.destination_code));

  // Créer des maps pour accès rapide
  const createDataMap = (items: EvolutionItem[]) => {
    const map = new Map<string, EvolutionItem>();
    items.forEach((item) => {
      map.set(`${item.call_year}-${item.destination_code}`, item);
    });
    return map;
  };

  const countrySuccessfulMap = createDataMap(data.country.successful);
  const countryEvaluatedMap = createDataMap(data.country.evaluated);
  const totalSuccessfulMap = createDataMap(data.total.successful);

  // Créer les séries pour le poids des projets
  const weightSeries = Array.from(destinations)
    .sort()
    .map((destCode) => {
      const seriesData = years.map((year) => {
        const countryItem = countrySuccessfulMap.get(`${year}-${destCode}`);
        const totalItem = totalSuccessfulMap.get(`${year}-${destCode}`);

        if (!countryItem || !totalItem || totalItem.total_funding_project === 0) {
          return null;
        }

        // Poids = (total_funding_project pays / total_funding_project total) * 100
        const weight = (countryItem.total_funding_project / totalItem.total_funding_project) * 100;
        return Math.round(weight * 10) / 10; // Arrondi à 1 décimale
      });

      return {
        name: DESTINATION_LABELS[destCode]?.[currentLang] || destCode,
        color: getCssColor(`msca-destination-${destCode.toLowerCase()}-color`),
        data: seriesData,
      };
    });

  // Créer les séries pour le taux de succès
  const successRateSeries = Array.from(destinations)
    .sort()
    .map((destCode) => {
      const seriesData = years.map((year) => {
        const countrySuccessful = countrySuccessfulMap.get(`${year}-${destCode}`);
        const countryEvaluated = countryEvaluatedMap.get(`${year}-${destCode}`);

        if (!countrySuccessful || !countryEvaluated || countryEvaluated.total_funding_project === 0) {
          return null;
        }

        // Taux de succès = (total_funding_project lauréats / total_funding_project évalués) * 100
        const successRate = (countrySuccessful.total_funding_project / countryEvaluated.total_funding_project) * 100;
        return Math.round(successRate * 10) / 10; // Arrondi à 1 décimale
      });

      return {
        name: DESTINATION_LABELS[destCode]?.[currentLang] || destCode,
        color: getCssColor(`msca-destination-${destCode.toLowerCase()}-color`),
        data: seriesData,
      };
    });

  return { years, weightSeries, successRateSeries };
}

/**
 * Render le tableau de données pour l'export
 */
export function renderDataTable(processedData: ProcessedEvolutionData, chartType: "weight" | "successRate", currentLang: string) {
  if (!processedData || processedData.years.length === 0) return null;

  const series = chartType === "weight" ? processedData.weightSeries : processedData.successRateSeries;

  const labels = {
    caption: chartType === "weight" ? (currentLang === "fr" ? "Poids des projets lauréats" : "Share of successful projects") : currentLang === "fr" ? "Taux de succès" : "Success rate",
    year: currentLang === "fr" ? "Année" : "Year",
    type: currentLang === "fr" ? "Type de financement" : "Funding type",
    value: chartType === "weight" ? (currentLang === "fr" ? "Poids (%)" : "Share (%)") : currentLang === "fr" ? "Taux (%)" : "Rate (%)",
  };

  return (
    <table className="fr-table">
      <caption>{labels.caption}</caption>
      <thead>
        <tr>
          <th scope="col">{labels.year}</th>
          {series.map((s) => (
            <th key={s.name} scope="col">
              {s.name}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {processedData.years.map((year, yearIndex) => (
          <tr key={year}>
            <td>{year}</td>
            {series.map((s) => (
              <td key={`${year}-${s.name}`}>{s.data[yearIndex] !== null ? `${s.data[yearIndex]}%` : "-"}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
