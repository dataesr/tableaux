import { useSearchParams } from "react-router-dom";
import { getCssColor } from "../../../../../../utils/colors";
import { isEjoParam } from "../../../../utils/params";
import type { EvolutionPanelData, EvolutionPanelItem } from "./query";

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
export const PANEL_LABELS: Record<string, { fr: string; en: string }> = {
  CHE: { en: "Chemistry", fr: "Chimie" },
  ECO: { en: "Economics Sciences", fr: "Sciences économiques" },
  ENV: { en: "Environment and Geosciences", fr: "Environnement et géosciences" },
  ENG: { en: "Information Science and Engineering", fr: "Sciences de l'information et de l'ingénierie" },
  LIF: { en: "Life Sciences", fr: "Sciences de la vie" },
  MAT: { en: "Mathematics", fr: "Mathématiques" },
  PHY: { en: "Physics", fr: "Physique" },
  SOC: { en: "Social Sciences and Humanities", fr: "Sciences sociales et humaines" },
};

// Ordre de tri des panels
export const DOMAIN_ORDER = ["CHE", "ECO", "ENV", "ENG", "LIF", "MAT", "PHY", "SOC"];

export interface ProcessedEvolutionPanelData {
  years: string[];
  weightSeries: { name: string; color: string; data: (number | null)[] }[];
  successRateSeries: { name: string; color: string; data: (number | null)[] }[];
}

/**
 * Calcule le poids des projets et le taux de succès par domaine scientifique
 */
export function processEvolutionPanelData(data: EvolutionPanelData, currentLang: string = "fr"): ProcessedEvolutionPanelData {
  if (!data || !data.country || !data.total) {
    return { years: [], weightSeries: [], successRateSeries: [] };
  }

  // Récupérer toutes les années uniques triées
  const allYears = new Set<string>();
  [...data.country.successful, ...data.total.successful].forEach((item) => {
    allYears.add(item.call_year);
  });
  const years = Array.from(allYears).sort();

  // Récupérer tous les panels
  const panels = new Set<string>();
  data.country.successful.forEach((item) => {
    panels.add(item.panel_id);
  });
  data.total.successful.forEach((item) => {
    panels.add(item.panel_id);
  });

  // Créer des maps pour accès rapide
  const createDataMap = (items: EvolutionPanelItem[]) => {
    const map = new Map<string, EvolutionPanelItem>();
    items.forEach((item) => {
      map.set(`${item.call_year}-${item.panel_id}`, item);
    });
    return map;
  };

  const countrySuccessfulMap = createDataMap(data.country.successful);
  const countryEvaluatedMap = createDataMap(data.country.evaluated);
  const totalSuccessfulMap = createDataMap(data.total.successful);

  // Créer les séries pour le poids des projets
  const weightSeries = DOMAIN_ORDER.filter((panelCode) => panels.has(panelCode)).map((panelCode) => {
    const seriesData = years.map((year) => {
      const countryItem = countrySuccessfulMap.get(`${year}-${panelCode}`);
      const totalItem = totalSuccessfulMap.get(`${year}-${panelCode}`);

      if (!countryItem || !totalItem || totalItem.total_funding === 0) {
        return null;
      }

      // Poids = (total_funding pays / total_funding total) * 100
      const weight = (countryItem.total_funding / totalItem.total_funding) * 100;
      return Math.round(weight * 10) / 10; // Arrondi à 1 décimale
    });

    return {
      name: PANEL_LABELS[panelCode]?.[currentLang as "fr" | "en"] || panelCode,
      color: getCssColor(`msca-panel-${panelCode.toLowerCase()}-color`),
      data: seriesData,
    };
  });

  // Créer les séries pour le taux de succès
  const successRateSeries = DOMAIN_ORDER.filter((panelCode) => panels.has(panelCode)).map((panelCode) => {
    const seriesData = years.map((year) => {
      const countrySuccessful = countrySuccessfulMap.get(`${year}-${panelCode}`);
      const countryEvaluated = countryEvaluatedMap.get(`${year}-${panelCode}`);

      if (!countrySuccessful || !countryEvaluated || countryEvaluated.total_funding === 0) {
        return null;
      }

      // Taux de succès = (total_funding lauréats / total_funding évalués) * 100
      const successRate = (countrySuccessful.total_funding / countryEvaluated.total_funding) * 100;
      return Math.round(successRate * 10) / 10; // Arrondi à 1 décimale
    });

    return {
      name: PANEL_LABELS[panelCode]?.[currentLang as "fr" | "en"] || panelCode,
      color: getCssColor(`msca-panel-${panelCode.toLowerCase()}-color`),
      data: seriesData,
    };
  });

  return { years, weightSeries, successRateSeries };
}

/**
 * Render le tableau de données pour l'export
 */
export function renderDataTable(processedData: ProcessedEvolutionPanelData, chartType: "weight" | "successRate", currentLang: string) {
  if (!processedData || processedData.years.length === 0) return null;

  const series = chartType === "weight" ? processedData.weightSeries : processedData.successRateSeries;

  const labels = {
    caption:
      chartType === "weight"
        ? currentLang === "fr"
          ? "Poids des projets lauréats par domaine"
          : "Share of successful projects by domain"
        : currentLang === "fr"
          ? "Taux de succès par domaine"
          : "Success rate by domain",
    year: currentLang === "fr" ? "Année" : "Year",
    domain: currentLang === "fr" ? "Domaine scientifique" : "Scientific domain",
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
