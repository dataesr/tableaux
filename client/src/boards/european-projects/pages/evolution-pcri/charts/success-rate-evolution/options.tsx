import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";

import { CreateChartOptions } from "../../../../components/chart-ep";
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
    framework: string;
    evaluated: number;
    successful: number;
    successRate: number;
  }

  // Grouper les données par année et framework
  const dataByYearFramework: Record<string, YearFrameworkData> = data
    .filter((item) => item.country_code === "ALL") // Uniquement les totaux
    .reduce(
      (acc, item) => {
        const key = `${item.call_year}_${item.framework}`;
        if (!acc[key]) {
          acc[key] = {
            year: item.call_year,
            framework: item.framework,
            evaluated: 0,
            successful: 0,
            successRate: 0,
          };
        }
        if (item.stage === "evaluated") {
          acc[key].evaluated = item.project_number || 0;
        } else if (item.stage === "successful") {
          acc[key].successful = item.project_number || 0;
        }
        return acc;
      },
      {} as Record<string, YearFrameworkData>,
    );

  // Calculer le taux de succès
  Object.values(dataByYearFramework).forEach((item) => {
    if (item.evaluated > 0) {
      item.successRate = (item.successful / item.evaluated) * 100;
    }
  });

  // Trier par année
  const sortedData = Object.values(dataByYearFramework)
    .filter((item) => item.framework !== "FP6") // Exclure FP6 (pas de données evaluated)
    .sort((a, b) => parseInt(a.year) - parseInt(b.year));

  // Extraire les années uniques
  const years = [...new Set(sortedData.map((d) => d.year))].sort();

  // Créer les séries par framework (sans FP6)
  const frameworkOrder = ["FP7", "Horizon 2020", "Horizon Europe"];
  const series = frameworkOrder.map((framework) => {
    const frameworkData = years.map((year) => {
      const item = sortedData.find((d) => d.year === year && d.framework === framework);
      return item ? item.successRate : null;
    });

    return {
      name: framework,
      type: "line" as const,
      data: frameworkData,
      color: getColorByFramework(framework),
      marker: {
        enabled: true,
        radius: 4,
      },
    };
  });

  const newOptions: HighchartsInstance.Options = {
    chart: {
      type: "line",
      height: 500,
    },
    title: {
      text: undefined,
    },
    xAxis: {
      categories: years,
      title: {
        text: getI18nLabel("x-axis-title"),
      },
    },
    yAxis: {
      min: 0,
      max: 100,
      title: {
        text: getI18nLabel("y-axis-title"),
      },
      labels: {
        format: "{value}%",
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
        let s = `<b>${getI18nLabel("tooltip-year")} ${this.x}</b><br/>`;

        this.points?.forEach((point) => {
          const year = years[point.index];
          const framework = point.series.name;
          const yearFrameworkData = sortedData.find((d) => d.year === year && d.framework === framework);

          s += `<span style="color:${point.color}">\u25CF</span> ${point.series.name}: <b>${point.y?.toFixed(1)}%</b><br/>`;
          if (yearFrameworkData) {
            s += `&nbsp;&nbsp;&nbsp;&nbsp;${getI18nLabel("tooltip-successful")}: ${yearFrameworkData.successful} / ${getI18nLabel(
              "tooltip-evaluated",
            )}: ${yearFrameworkData.evaluated}<br/>`;
          }
        });

        return s;
      },
    },
    plotOptions: {
      line: {
        lineWidth: 2,
      },
    },
    series: series,
  };

  return CreateChartOptions("line", newOptions);
}
