import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";

import { CreateChartOptions } from "../../../../components/chart-ep";
import { formatToMillions } from "../../../../../../utils/format";
import type { HighchartsOptions } from "../../../../../../components/chart-wrapper";
import { getCssColor } from "../../../../../../utils/colors";

import { getI18nLabel } from "../../../../../../utils";
import i18n from "../../i18n-charts.json";
// import { normalizeIdForCssColorNames } from "../../../../utils";

export default function Options(data, displayType, currentLang): HighchartsOptions {
  if (!data || !Array.isArray(data)) return null;

  const rootStyles = getComputedStyle(document.documentElement);
  const years = new Set();
  const countryData = data.filter((item) => item.country !== "all")[0];
  if (!countryData?.data) return null;

  const filteredData = countryData.data;
  const evaluatedData = filteredData.find((item) => item.stage === "evaluated");
  const successfulData = filteredData.find((item) => item.stage === "successful");

  if (!evaluatedData?.topics?.length || !successfulData?.topics?.length) return null;

  evaluatedData.topics[0].years.forEach((year) => years.add(year.year));

  const sortedYears = Array.from(years).sort();

  // Créer les catégories pour l'axe X (année + thématique si plusieurs)
  const hasMultipleTopics = evaluatedData.topics.length > 1;
  const categories = hasMultipleTopics
    ? sortedYears.flatMap((year) => evaluatedData.topics.map((topic) => `${year} - ${topic.thema_code}`))
    : sortedYears.map(String);

  const newOptions: HighchartsInstance.Options = {
    xAxis: {
      categories: categories,
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
          const dataPoints: { y: number; color: string }[] = [];
          sortedYears.forEach((year) => {
            evaluatedData.topics.forEach((topic) => {
              const yearData = topic.years.find((y) => y.year === year);
              dataPoints.push({
                y: yearData ? yearData[displayType] : 0,
                color: getCssColor("evaluated-project"),
              });
            });
          });
          return dataPoints;
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
          const dataPoints: { y: number; color: string }[] = [];
          sortedYears.forEach((year) => {
            successfulData.topics.forEach((topic) => {
              const yearData = topic.years.find((y) => y.year === year);
              dataPoints.push({
                y: yearData ? yearData[displayType] : 0,
                color: getCssColor("successful-project"),
              });
            });
          });
          return dataPoints;
        })(),
        pointPadding: 0.3,
        pointPlacement: 0.2,
      },
      // Série pour les taux de succès
      {
        type: "line",
        name: `${getI18nLabel(i18n, "successRate", currentLang)} (%)`,
        color: "var(--artwork-minor-green-emeraude)",
        yAxis: 1,
        data: (() => {
          const dataPoints: number[] = [];
          sortedYears.forEach((year) => {
            evaluatedData.topics.forEach((topic) => {
              const evaluatedYearData = topic.years.find((y) => y.year === year);
              const successfulTopic = successfulData.topics.find((t) => t.thema_code === topic.thema_code);
              const successfulYearData = successfulTopic ? successfulTopic.years.find((y) => y.year === year) : null;
              const evaluatedValue = evaluatedYearData ? evaluatedYearData[displayType] : 0;
              const successfulValue = successfulYearData ? successfulYearData[displayType] : 0;
              const successRate = evaluatedValue > 0 ? (successfulValue / evaluatedValue) * 100 : 0;
              dataPoints.push(successRate);
            });
          });
          return dataPoints;
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
