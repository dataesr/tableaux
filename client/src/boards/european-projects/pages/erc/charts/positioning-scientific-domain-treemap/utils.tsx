import { useSearchParams } from "react-router-dom";
import { rangeOfYearsToApiFormat } from "../../url-utils";
import type { PositioningByDomainData, CountryData } from "./query";
import { SCIENTIFIC_DOMAINS, type ScientificDomainCode } from "../positioning-scientific-domain/utils";
import React from "react";

export { SCIENTIFIC_DOMAINS, type ScientificDomainCode };

// Liste des codes pays considérés comme "européens" (ERC + associés)
export const EUROPEAN_COUNTRY_CODES = new Set([
  "AUT", //CEE
  "BEL", //CEE
  "BGR", //CEE
  // "CHE",
  "CYP", //CEE
  "CZE", //CEE
  "DEU", //CEE
  "DNK", //CEE
  "ESP", //CEE
  "EST", //CEE
  "FIN", //CEE
  "FRA", //CEE
  // "GBR",
  "GRC", //CEE
  "HRV", //CEE
  "HUN", //CEE
  "IRL", //CEE
  // "ISL",
  // "ISR",
  "ITA", //CEE
  "LTU", //CEE
  "LUX", //CEE
  "LVA", //CEE
  "MLT", //CEE
  "NLD", //CEE
  // "NOR",
  "POL", //CEE
  "PRT", //CEE
  "ROU", //CEE
  "SVK", //CEE
  "SVN", //CEE
  "SWE", //CEE
  // "TUR",
  // "UKR",
]);

const css = (v: string) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

export function getTreemapColors(domainCode: ScientificDomainCode) {
  return {
    selectedCountry: css("--selected-country-color") || "#6dd897",
    europeanCountry: css(`--erc-domain-${domainCode.toLowerCase()}-color`) || "#3b82f6",
    otherCountries: "#9ca3af",
  };
}

export interface TreemapCountryPoint {
  code: string;
  name: string;
  value: number;
  isSelected: boolean;
  isEuropean: boolean;
}

export interface ProcessedTreemapData {
  european: TreemapCountryPoint[];
  others: TreemapCountryPoint[];
  otherTotal: number;
  otherCount: number;
  selectedCountry: CountryData | null;
  metric: "projects" | "funding";
  domainCode: ScientificDomainCode;
}

export function useGetParams() {
  const [searchParams] = useSearchParams();

  const params: string[] = [];

  const countryCode = searchParams.get("country_code") || "FRA";
  params.push(`country_code=${countryCode}`);

  const rangeOfYears = searchParams.get("range_of_years");
  const callYear = rangeOfYearsToApiFormat(rangeOfYears);
  if (callYear) {
    params.push(`call_year=${callYear}`);
  }

  const framework = searchParams.get("framework");
  if (framework) {
    params.push(`framework=${framework}`);
  }

  const currentLang = searchParams.get("language") || "fr";

  return { params: params.join("&"), currentLang, countryCode };
}

function getValue(c: CountryData, metric: "projects" | "funding"): number {
  return metric === "projects" ? c.total_pi : c.total_funding_project;
}

// Pour les pays non-européens, total_pi vaut toujours 0 (les porteurs ERC doivent
// être hébergés dans une institution européenne éligible). On utilise total_involved
// pour alimenter la case "Autres pays" afin de montrer leur présence comme partenaires.
function getValueForOthers(c: CountryData, metric: "projects" | "funding"): number {
  return metric === "projects" ? c.total_involved : c.total_funding_project;
}

export function processTreemapData(
  data: PositioningByDomainData,
  countryCode: string,
  currentLang: string = "fr",
  metric: "projects" | "funding" = "projects",
  domainCode: ScientificDomainCode = "LS",
): ProcessedTreemapData {
  if (!data?.successful?.countries) {
    return { european: [], others: [], otherTotal: 0, otherCount: 0, selectedCountry: null, metric, domainCode };
  }

  const countries = data.successful.countries;
  const selectedCountry = countries.find((c) => c.country_code === countryCode) || null;

  const european: TreemapCountryPoint[] = [];
  const others: TreemapCountryPoint[] = [];
  let otherTotal = 0;
  let otherCount = 0;

  for (const c of countries) {
    const val = getValue(c, metric);
    if (val <= 0) continue;

    if (EUROPEAN_COUNTRY_CODES.has(c.country_code)) {
      european.push({
        code: c.country_code,
        name: currentLang === "fr" ? c.country_name_fr : c.country_name_en,
        value: val,
        isSelected: c.country_code === countryCode,
        isEuropean: true,
      });
    } else {
      const otherVal = getValueForOthers(c, metric);
      if (otherVal > 0) {
        otherTotal += otherVal;
        otherCount++;
        others.push({
          code: c.country_code,
          name: currentLang === "fr" ? c.country_name_fr : c.country_name_en,
          value: otherVal,
          isSelected: false,
          isEuropean: false,
        });
      }
    }
  }

  european.sort((a, b) => b.value - a.value);
  others.sort((a, b) => b.value - a.value);

  return { european, others, otherTotal, otherCount, selectedCountry, metric, domainCode };
}

export function renderDataTable(processedData: ProcessedTreemapData, currentLang: string = "fr", showOthersDetail: boolean = false): React.JSX.Element {
  const headers =
    currentLang === "fr"
      ? ["Pays", processedData.metric === "projects" ? "Porteurs de projets" : "Financements (M€)"]
      : ["Country", processedData.metric === "projects" ? "Project PIs" : "Funding (M€)"];

  const rows = processedData.european.map((c) => [
    c.name,
    processedData.metric === "funding" ? `${(c.value / 1_000_000).toFixed(1)} M€` : String(c.value),
  ]);

  const othersLabel = currentLang === "fr" ? "Pays non-européens" : "Other countries";
  const othersValue =
    processedData.metric === "funding" ? `${(processedData.otherTotal / 1_000_000).toFixed(1)} M€` : String(processedData.otherTotal);

  return (
    <table className="fr-table">
      <caption>{currentLang === "fr" ? "Répartition par pays – Treemap ERC" : "Country distribution – ERC Treemap"}</caption>
      <thead>
        <tr>
          {headers.map((h) => (
            <th key={h}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} style={processedData.european[i]?.isSelected ? { fontWeight: "bold" } : {}}>
            {row.map((cell, j) => (
              <td key={j}>{cell}</td>
            ))}
          </tr>
        ))}
        {showOthersDetail
          ? processedData.others.map((c, i) => (
              <tr key={`other_${i}`}>
                <td>{c.name}</td>
                <td>{processedData.metric === "funding" ? `${(c.value / 1_000_000).toFixed(1)} M€` : String(c.value)}</td>
              </tr>
            ))
          : processedData.otherTotal > 0 && (
              <tr>
                <td>{othersLabel}</td>
                <td>{othersValue}</td>
              </tr>
            )}
      </tbody>
    </table>
  );
}
