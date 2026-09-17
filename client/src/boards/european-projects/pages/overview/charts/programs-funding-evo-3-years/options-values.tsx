import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";

import { CreateChartOptions } from "../../../../components/chart-ep";
import { formatToMillions } from "../../../../../../utils/format";
import type { HighchartsOptions } from "../../../../../../components/chart-wrapper";
import { getCssColor } from "../../../../../../utils/colors";
import { getI18nLabel } from "../../../../../../utils";
import i18n from "../../i18n-charts.json";

export default function Options(data, displayType, currentLang): HighchartsOptions {
  if (!data) return null;

  const years = new Set();
  const filteredData = data.filter((item) => item.country !== "all")[0].data;
  const evaluatedData = filteredData.find((item) => item.stage === "evaluated");
  const successfulData = filteredData.find((item) => item.stage === "successful");

  evaluatedData.programs[0].years.forEach((year) => years.add(year.year));

  const sortedYears = Array.from(years).sort();

  const newOptions: HighchartsInstance.Options = {
    xAxis: {
      categories: sortedYears.map(String),
      labels: {
        rotation: -45,
        style: {
          fontSize: "10px",
        },
      },
    },
    yAxis: [
      {
        min: 0,
        title: {
          text: displayType === "total_fund_eur" ? "M€" : "Nombre",
        },
        gridLineColor: "var(--background-default-grey-hover)",
        gridLineWidth: 0.5,
      },
      {
        min: 0,
        max: 100,
        title: {
          text: `${getI18nLabel(i18n, "successRate", currentLang)} (%)`,
        },
        opposite: true,
        labels: {
          formatter: function (this: Highcharts.AxisLabelsFormatterContextObject) {
            return `${this.value}%`;
          },
        },
        gridLineColor: "var(--background-default-grey-hover)",
        gridLineWidth: 0.5,
      },
    ],
    tooltip: {
      shared: true,
    },
    plotOptions: {
      column: {
        grouping: false,
        shadow: false,
        borderWidth: 0,
        borderRadius: 0,
        dataLabels: {
          enabled: true,
          formatter: function () {
            return displayType === "total_fund_eur" ? formatToMillions(this.y as number) : (this.y as number);
          },
        },
      },
    },
    series: [
      // Série pour les projets évalués
      {
        type: "column",
        name: getI18nLabel(i18n, "evaluatedProjects", currentLang),
        color: getCssColor("evaluated-project"),
        data: (() => {
          const data: number[] = [];
          sortedYears.forEach((year) => {
            evaluatedData.programs.forEach((program) => {
              const yearData = program.years.find((y) => y.year === year);
              data.push(yearData ? yearData[displayType] : 0);
            });
          });
          return data;
        })(),
        pointPadding: 0.3,
        pointPlacement: -0.2,
      },
      // Série pour les projets lauréats
      {
        type: "column",
        name: getI18nLabel(i18n, "successfulProjects", currentLang),
        color: getCssColor("successful-project"),
        data: (() => {
          const data: number[] = [];
          sortedYears.forEach((year) => {
            successfulData.programs.forEach((program) => {
              const yearData = program.years.find((y) => y.year === year);
              data.push(yearData ? yearData[displayType] : 0);
            });
          });
          return data;
        })(),
        pointPadding: 0.3,
        pointPlacement: 0.2,
      },
      // Série pour les taux de succès
      {
        type: "line",
        name: `${getI18nLabel(i18n, "successRate", currentLang)} (%)`,
        color: getCssColor("successRate"),
        yAxis: 1,
        data: (() => {
          const data: number[] = [];
          sortedYears.forEach((year) => {
            evaluatedData.programs.forEach((program) => {
              const evaluatedYearData = program.years.find((y) => y.year === year);
              const successfulProgram = successfulData.programs.find((p) => p.programme_code === program.programme_code);
              const successfulYearData = successfulProgram ? successfulProgram.years.find((y) => y.year === year) : null;
              const evaluatedValue = evaluatedYearData ? evaluatedYearData[displayType] : 0;
              const successfulValue = successfulYearData ? successfulYearData[displayType] : 0;
              const successRate = evaluatedValue > 0 ? (successfulValue / evaluatedValue) * 100 : 0;
              data.push(successRate);
            });
          });
          return data;
        })(),
        marker: {
          enabled: true,
          radius: 4,
        },
        dataLabels: {
          enabled: true,
          formatter: function () {
            return `${Number(this.y).toFixed(1)}%`;
          },
        },
      },
    ],
  };

  return CreateChartOptions("column", newOptions);
}
