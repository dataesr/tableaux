import { useSearchParams } from "react-router-dom";
import { rangeOfYearsToApiFormat } from "../../url-utils";
import type { PositioningData, CountryData } from "./query";
import React from "react";

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

  const destinationCode = searchParams.get("destination_code");
  if (destinationCode) {
    params.push(`destination_code=${destinationCode}`);
  }

  const framework = searchParams.get("framework");
  if (framework) {
    params.push(`framework=${framework}`);
  }

  const currentLang = searchParams.get("language") || "fr";

  return { params: params.join("&"), currentLang, countryCode };
}

const css = (v: string) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

export function getChartColors() {
  return {
    selectedCountry: css("--selected-country-color"),
    otherCountries: css("--msca-destination-stg-color"),
    avgTop10: css("--msca-avg-top10-color"),
    avgAll: css("--msca-avg-all-color"),
  };
}

export interface ProcessedPositioningData {
  countries: {
    code: string;
    name: string;
    value: number;
    isSelected: boolean;
  }[];
  selectedCountry: CountryData | null;
  metric: "projects" | "funding";
  avgTop10: number;
  avgAll: number;
}

/**
 * Traite les données pour créer le classement des pays
 */
export function processPositioningData(
  data: PositioningData,
  countryCode: string,
  currentLang: string = "fr",
  metric: "projects" | "funding" = "projects",
): ProcessedPositioningData {
  if (!data || !data.successful || !data.successful.countries) {
    return { countries: [], selectedCountry: null, metric, avgTop10: 0, avgAll: 0 };
  }

  const countries = data.successful.countries;

  const selectedCountry = countries.find((c) => c.country_code === countryCode) || null;

  const getValue = (c: CountryData) => (metric === "projects" ? c.total_involved : c.total_funding_project);

  const sortedCountries = [...countries].sort((a, b) => getValue(b) - getValue(a));

  const top10 = sortedCountries.slice(0, 10);
  const avgTop10 = top10.length > 0 ? top10.reduce((sum, c) => sum + getValue(c), 0) / top10.length : 0;
  const avgAll = countries.length > 0 ? countries.reduce((sum, c) => sum + getValue(c), 0) / countries.length : 0;

  const selectedRank = sortedCountries.findIndex((c) => c.country_code === countryCode);

  let displayCountries = sortedCountries.slice(0, 10);
  if (selectedRank >= 10 && selectedCountry) {
    displayCountries = [...displayCountries.slice(0, 9), selectedCountry];
  }

  const formattedCountries = displayCountries.map((c) => ({
    code: c.country_code,
    name: currentLang === "fr" ? c.country_name_fr : c.country_name_en,
    value: getValue(c),
    isSelected: c.country_code === countryCode,
  }));

  formattedCountries.sort((a, b) => b.value - a.value);

  return { countries: formattedCountries, selectedCountry, metric, avgTop10, avgAll };
}

/**
 * Génère le tableau de données pour l'accessibilité
 */
export function renderDataTable(processedData: ProcessedPositioningData, currentLang: string = "fr"): React.JSX.Element {
  const headers =
    currentLang === "fr"
      ? ["Rang", "Pays", processedData.metric === "projects" ? "Nombre de participants" : "Financements (M€)"]
      : ["Rank", "Country", processedData.metric === "projects" ? "Number of participants" : "Funding (M€)"];

  return (
    <table className="fr-table">
      <caption>
        {currentLang === "fr" ? "Classement des pays par nombre de participants MSCA" : "Country ranking by number of MSCA participants"}
      </caption>
      <thead>
        <tr>
          {headers.map((header, i) => (
            <th key={i} scope="col">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {processedData.countries.map((country, index) => (
          <tr key={country.code} style={country.isSelected ? { fontWeight: "bold" } : {}}>
            <td>{index + 1}</td>
            <td>{country.name}</td>
            <td>{processedData.metric === "funding" ? (country.value / 1_000_000).toFixed(1) : country.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
