import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";

import { CreateChartOptions } from "../../../../components/chart-ep";
import { formatToMillions } from "../../../../../../utils/format";
import { getColorByFramework } from "./utils";
import type { EvolutionDataItem } from "./types";
import i18n from "./i18n.json";

export default function Options(data: EvolutionDataItem[], currentLang: string = "fr") {
  if (!data || data.length === 0) return null;

  function getI18nLabel(key: string): string {
    return i18n[key]?.[currentLang] || i18n[key]?.["fr"] || key;
  }

  interface YearFrameworkData {
    year: string;
    frameworks: Record<string, number>;
  }

  // Grouper les données par année et framework
  const dataByYear: Record<string, YearFrameworkData> = data.reduce(
    (acc, item) => {
      if (!acc[item.call_year]) {
        acc[item.call_year] = {
          year: item.call_year,
          frameworks: {},
        };
      }
      if (!acc[item.call_year].frameworks[item.framework]) {
        acc[item.call_year].frameworks[item.framework] = 0;
      }
      acc[item.call_year].frameworks[item.framework] += item.funding || 0;
      return acc;
    },
    {} as Record<string, YearFrameworkData>,
  );

  // Trier par année
  const sortedYears = Object.values(dataByYear).sort((a, b) => parseInt(a.year) - parseInt(b.year));

  // Extraire les catégories (années)
  const categories = sortedYears.map((item) => item.year);

  // Liste des frameworks dans l'ordre chronologique
  const frameworkOrder = ["FP6", "FP7", "Horizon 2020", "Horizon Europe"];

  // Créer les séries pour chaque framework
  const series = frameworkOrder.map((framework) => ({
    name: framework,
    type: "area" as const,
    data: sortedYears.map((yearData) => yearData.frameworks[framework] || 0),
    color: getColorByFramework(framework),
  }));

  const newOptions: HighchartsInstance.Options = {
    chart: {
      type: "area",
      height: 500,
    },
    title: {
      text: undefined,
    },
    xAxis: {
      categories: categories,
      title: {
        text: getI18nLabel("x-axis-title"),
      },
    },
    yAxis: {
      min: 0,
      title: {
        text: getI18nLabel("y-axis-title"),
      },
      labels: {
        formatter: function () {
          return formatToMillions(this.value as number);
        },
      },
    },
    legend: {
      enabled: true,
      align: "center",
      verticalAlign: "bottom",
    },
    tooltip: {
      shared: true,
      formatter: function () {
        let s = `<b>${getI18nLabel("tooltip-year")} ${this.key}</b><br/>`;
        let total = 0;

        this.points?.forEach((point) => {
          s += `<span style="color:${point.color}">\u25CF</span> ${point.series.name}: <b>${formatToMillions(point.y ?? 0)}</b><br/>`;
          total += point.y ?? 0;
        });

        s += `<b>${getI18nLabel("tooltip-total")}: ${formatToMillions(total)}</b>`;
        return s;
      },
    },
    plotOptions: {
      area: {
        stacking: "normal",
        lineColor: "#666666",
        lineWidth: 1,
        marker: {
          enabled: false,
        },
      },
    },
    series: series,
  };

  return CreateChartOptions("area", newOptions);
}
