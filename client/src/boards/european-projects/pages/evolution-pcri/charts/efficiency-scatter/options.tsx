import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";

import { CreateChartOptions } from "../../../../components/chart-ep";
import type { EvolutionDataItem } from "./types";
import i18n from "./i18n.json";
import { getCssColor } from "../../../../../../utils/colors";
import { getI18nLabel } from "../../../../../../utils";

// Ordre des frameworks pour l'animation
export const FRAMEWORKS_ORDER = ["FP7", "Horizon 2020", "Horizon Europe"];

// Labels d'affichage des frameworks
export const FRAMEWORK_LABELS: Record<string, string> = {
  FP7: "FP7 (2007-2013)",
  "Horizon 2020": "Horizon 2020 (2014-2020)",
  "Horizon Europe": "Horizon Europe (2021-2027)",
};

// Variables disponibles pour les axes
export type AxisVariable =
  | "success_rate_project"
  | "success_rate_funding"
  | "success_rate_involved"
  | "success_rate_coordination"
  | "share_funding"
  | "share_project_number"
  | "share_number_involved"
  | "share_coordination_number"
  | "funding"
  | "project_number"
  | "number_involved"
  | "coordination_number";

export const AXIS_VARIABLES: AxisVariable[] = [
  "success_rate_project",
  "success_rate_funding",
  "success_rate_involved",
  "success_rate_coordination",
  "share_funding",
  "share_project_number",
  "share_number_involved",
  "share_coordination_number",
  "funding",
  "project_number",
  "number_involved",
  "coordination_number",
];

// Configuration des variables
export const VARIABLE_CONFIG: Record<AxisVariable, { i18nKey: string; isPercent: boolean; format: string }> = {
  success_rate_project: { i18nKey: "var-success-rate-project", isPercent: true, format: "{value}%" },
  success_rate_funding: { i18nKey: "var-success-rate-funding", isPercent: true, format: "{value}%" },
  success_rate_involved: { i18nKey: "var-success-rate-involved", isPercent: true, format: "{value}%" },
  success_rate_coordination: { i18nKey: "var-success-rate-coordination", isPercent: true, format: "{value}%" },
  share_funding: { i18nKey: "var-share-funding", isPercent: true, format: "{value}%" },
  share_project_number: { i18nKey: "var-share-project-number", isPercent: true, format: "{value}%" },
  share_number_involved: { i18nKey: "var-share-number-involved", isPercent: true, format: "{value}%" },
  share_coordination_number: { i18nKey: "var-share-coordination-number", isPercent: true, format: "{value}%" },
  funding: { i18nKey: "var-funding", isPercent: false, format: "{value}" },
  project_number: { i18nKey: "var-project-number", isPercent: false, format: "{value}" },
  number_involved: { i18nKey: "var-number-involved", isPercent: false, format: "{value}" },
  coordination_number: { i18nKey: "var-coordination-number", isPercent: false, format: "{value}" },
};

interface CountryData {
  country: string;
  countryCode: string;
  // Valeurs evaluated
  evaluated_project: number;
  evaluated_funding: number;
  evaluated_involved: number;
  evaluated_coordination: number;
  // Valeurs successful
  successful_project: number;
  successful_funding: number;
  successful_involved: number;
  successful_coordination: number;
  // Valeurs absolues (successful)
  funding: number;
  project_number: number;
  number_involved: number;
  coordination_number: number;
  // Taux de succès déclinés
  success_rate_project: number;
  success_rate_funding: number;
  success_rate_involved: number;
  success_rate_coordination: number;
  // Parts
  share_funding: number;
  share_project_number: number;
  share_number_involved: number;
  share_coordination_number: number;
}

// Fonction pour calculer les données agrégées par pays pour un ensemble de données
function computeCountryData(
  dataSet: EvolutionDataItem[],
  currentLang: string,
): {
  dataByCountry: Record<string, CountryData>;
  totals: { funding: number; project_number: number; number_involved: number; coordination_number: number };
} {
  // Calculer les totaux globaux (country_code = ALL, stage = successful)
  const totals = dataSet
    .filter((item) => item.country_code === "ALL" && item.stage === "successful")
    .reduce(
      (acc, item) => {
        acc.funding += item.funding || 0;
        acc.project_number += item.project_number || 0;
        acc.number_involved += item.number_involved || 0;
        acc.coordination_number += item.coordination_number || 0;
        return acc;
      },
      { funding: 0, project_number: 0, number_involved: 0, coordination_number: 0 },
    );

  const dataByCountry = dataSet
    .filter((item) => item.country_code !== "ALL" && item.country_code !== "UE")
    .reduce(
      (acc, item) => {
        if (!acc[item.country_code]) {
          acc[item.country_code] = {
            country: currentLang === "fr" ? item.country_name_fr : item.country_code,
            countryCode: item.country_code,
            // Valeurs evaluated
            evaluated_project: 0,
            evaluated_funding: 0,
            evaluated_involved: 0,
            evaluated_coordination: 0,
            // Valeurs successful
            successful_project: 0,
            successful_funding: 0,
            successful_involved: 0,
            successful_coordination: 0,
            // Valeurs absolues (successful)
            funding: 0,
            project_number: 0,
            number_involved: 0,
            coordination_number: 0,
            // Taux de succès déclinés
            success_rate_project: 0,
            success_rate_funding: 0,
            success_rate_involved: 0,
            success_rate_coordination: 0,
            // Parts
            share_funding: 0,
            share_project_number: 0,
            share_number_involved: 0,
            share_coordination_number: 0,
          };
        }
        if (item.stage === "evaluated") {
          acc[item.country_code].evaluated_project += item.project_number || 0;
          acc[item.country_code].evaluated_funding += item.funding || 0;
          acc[item.country_code].evaluated_involved += item.number_involved || 0;
          acc[item.country_code].evaluated_coordination += item.coordination_number || 0;
        } else if (item.stage === "successful") {
          acc[item.country_code].successful_project += item.project_number || 0;
          acc[item.country_code].successful_funding += item.funding || 0;
          acc[item.country_code].successful_involved += item.number_involved || 0;
          acc[item.country_code].successful_coordination += item.coordination_number || 0;
          // Valeurs absolues (pour tri et affichage)
          acc[item.country_code].funding += item.funding || 0;
          acc[item.country_code].project_number += item.project_number || 0;
          acc[item.country_code].number_involved += item.number_involved || 0;
          acc[item.country_code].coordination_number += item.coordination_number || 0;
        }
        return acc;
      },
      {} as Record<string, CountryData>,
    );

  // Calculer les taux de succès et parts
  Object.values(dataByCountry).forEach((country) => {
    // Taux de succès déclinés
    if (country.evaluated_project > 0) {
      country.success_rate_project = (country.successful_project / country.evaluated_project) * 100;
    }
    if (country.evaluated_funding > 0) {
      country.success_rate_funding = (country.successful_funding / country.evaluated_funding) * 100;
    }
    if (country.evaluated_involved > 0) {
      country.success_rate_involved = (country.successful_involved / country.evaluated_involved) * 100;
    }
    if (country.evaluated_coordination > 0) {
      country.success_rate_coordination = (country.successful_coordination / country.evaluated_coordination) * 100;
    }
    // Parts
    if (totals.funding > 0) {
      country.share_funding = (country.funding / totals.funding) * 100;
    }
    if (totals.project_number > 0) {
      country.share_project_number = (country.project_number / totals.project_number) * 100;
    }
    if (totals.number_involved > 0) {
      country.share_number_involved = (country.number_involved / totals.number_involved) * 100;
    }
    if (totals.coordination_number > 0) {
      country.share_coordination_number = (country.coordination_number / totals.coordination_number) * 100;
    }
  });

  return { dataByCountry, totals };
}

// Fonction pour calculer les limites globales des axes (min/max) sur tous les frameworks
function computeGlobalAxisLimits(
  data: EvolutionDataItem[],
  currentLang: string,
  xVar: AxisVariable,
  yVar: AxisVariable,
): { xMin: number; xMax: number; yMin: number; yMax: number } {
  let allXValues: number[] = [];
  let allYValues: number[] = [];

  // Calculer pour chaque framework individuellement
  for (const framework of FRAMEWORKS_ORDER) {
    const frameworkData = data.filter((item) => item.framework === framework);
    if (frameworkData.length === 0) continue;

    const { dataByCountry } = computeCountryData(frameworkData, currentLang);

    const validCountries = Object.values(dataByCountry)
      .filter((c) => c.funding > 0)
      .sort((a, b) => b.funding - a.funding)
      .slice(0, 15);

    validCountries.forEach((c) => {
      const xValue = c[xVar];
      const yValue = c[yVar];
      if (xValue !== undefined && xValue !== null) allXValues.push(xValue);
      if (yValue !== undefined && yValue !== null) allYValues.push(yValue);
    });
  }

  if (allXValues.length === 0 || allYValues.length === 0) {
    return { xMin: 0, xMax: 100, yMin: 0, yMax: 100 };
  }

  const xMinVal = Math.min(...allXValues);
  const xMaxVal = Math.max(...allXValues);
  const yMinVal = Math.min(...allYValues);
  const yMaxVal = Math.max(...allYValues);

  // Ajouter une marge de 5%
  const xMargin = (xMaxVal - xMinVal) * 0.05 || 1;
  const yMargin = (yMaxVal - yMinVal) * 0.05 || 1;

  return {
    xMin: Math.max(0, Math.floor(xMinVal - xMargin)),
    xMax: Math.ceil(xMaxVal + xMargin),
    yMin: Math.max(0, Math.floor(yMinVal - yMargin)),
    yMax: Math.ceil(yMaxVal + yMargin),
  };
}

export default function Options(
  data: EvolutionDataItem[],
  currentLang: string = "fr",
  selectedFramework: string,
  xVar: AxisVariable = "success_rate_project",
  yVar: AxisVariable = "share_funding",
) {
  if (!data || data.length === 0) return null;

  // Calculer les limites globales des axes (basées sur TOUS les frameworks)
  const { xMin, xMax, yMin, yMax } = computeGlobalAxisLimits(data, currentLang, xVar, yVar);

  // Filtrer les données par framework sélectionné
  const filteredData = data.filter((item) => item.framework === selectedFramework);

  // Calculer les données par pays
  const { dataByCountry } = computeCountryData(filteredData, currentLang);

  // Filtrer les pays valides et prendre les top 15 par financement
  const validCountries = Object.values(dataByCountry)
    .filter((c) => c.funding > 0)
    .sort((a, b) => b.funding - a.funding)
    .slice(0, 15);

  // Préparer les données pour le scatter
  const frameworkLabel = FRAMEWORK_LABELS[selectedFramework] || selectedFramework;

  const xConfig = VARIABLE_CONFIG[xVar];
  const yConfig = VARIABLE_CONFIG[yVar];

  const scatterData = validCountries.map((country) => {
    const xValue = xVar === "funding" ? country[xVar] / 1000000 : country[xVar];
    const yValue = yVar === "funding" ? country[yVar] / 1000000 : country[yVar];

    return {
      x: xValue,
      y: yValue,
      z: country.successful_project, // Taille de la bulle = nombre de projets réussis
      name: country.country,
      country: country.country,
      // Toutes les valeurs pour le tooltip
      success_rate_project: country.success_rate_project,
      success_rate_funding: country.success_rate_funding,
      success_rate_involved: country.success_rate_involved,
      success_rate_coordination: country.success_rate_coordination,
      share_funding: country.share_funding,
      share_project_number: country.share_project_number,
      share_number_involved: country.share_number_involved,
      share_coordination_number: country.share_coordination_number,
      funding: country.funding / 1000000,
      project_number: country.project_number,
      number_involved: country.number_involved,
      coordination_number: country.coordination_number,
      projects: country.successful_project,
      framework: frameworkLabel,
    };
  });

  // const seriesColor = frameworkColors[selectedFramework] || "rgba(220, 53, 69, 0.5)";
  const seriesColor = getCssColor(`framework-${selectedFramework.toLowerCase().replace(/\s/g, "-")}`) || "rgba(220, 53, 69, 0.5)";

  // Formater la valeur pour le tooltip en fonction du type de variable
  const formatTooltipValue = (varName: AxisVariable, pointKey: string): string => {
    const config = VARIABLE_CONFIG[varName];
    if (config.isPercent) {
      return `{point.${pointKey}:.2f}%`;
    }
    if (varName === "funding") {
      return `{point.${pointKey}:.2f} M€`;
    }
    return `{point.${pointKey}}`;
  };

  const newOptions: HighchartsInstance.Options = {
    chart: {
      type: "bubble",
      height: 600,
      animation: {
        duration: 800,
      },
    },
    title: {
      text: FRAMEWORK_LABELS[selectedFramework],
      style: {
        fontSize: "16px",
        fontWeight: "bold",
      },
    },
    xAxis: {
      min: xVar === "funding" ? xMin / 1000000 : xMin,
      max: xVar === "funding" ? xMax / 1000000 : xMax,
      title: {
        text: getI18nLabel(i18n, xConfig.i18nKey, currentLang),
      },
      gridLineWidth: 1,
      labels: {
        format: xConfig.isPercent ? "{value}%" : xVar === "funding" ? "{value} M€" : "{value}",
      },
      gridLineColor: "var(--background-default-grey-hover)",
    },
    yAxis: {
      min: yVar === "funding" ? yMin / 1000000 : yMin,
      max: yVar === "funding" ? yMax / 1000000 : yMax,
      title: {
        text: getI18nLabel(i18n, yConfig.i18nKey, currentLang),
      },
      labels: {
        format: yConfig.isPercent ? "{value}%" : yVar === "funding" ? "{value} M€" : "{value}",
      },
      gridLineColor: "var(--background-default-grey-hover)",
      gridLineWidth: 0.5,
    },
    legend: {
      enabled: false,
    },
    tooltip: {
      useHTML: true,
      headerFormat: "<table>",
      pointFormat:
        '<tr><th colspan="2"><h3>{point.country}</h3></th></tr>' +
        `<tr><th>${getI18nLabel(i18n, "tooltip-framework", currentLang)}:</th><td><b>{point.framework}</b></td></tr>` +
        `<tr><th>${getI18nLabel(i18n, xConfig.i18nKey, currentLang)}:</th><td><b>${formatTooltipValue(xVar, xVar)}</b></td></tr>` +
        `<tr><th>${getI18nLabel(i18n, yConfig.i18nKey, currentLang)}:</th><td><b>${formatTooltipValue(yVar, yVar)}</b></td></tr>` +
        `<tr><th>${getI18nLabel(i18n, "tooltip-projects", currentLang)}:</th><td><b>{point.projects}</b></td></tr>`,
      footerFormat: "</table>",
      followPointer: true,
    },
    plotOptions: {
      bubble: {
        minSize: 10,
        maxSize: 60,
        dataLabels: {
          enabled: true,
          format: "{point.name}",
          style: {
            fontSize: "9px",
            fontWeight: "normal",
            // textOutline: "1px contrast",
          },
        },
      },
    },
    series: [
      {
        type: "bubble",
        name: getI18nLabel(i18n, "tooltip-country", currentLang),
        data: scatterData,
        color: seriesColor,
      },
    ],
  };

  return CreateChartOptions("bubble", newOptions);
}
