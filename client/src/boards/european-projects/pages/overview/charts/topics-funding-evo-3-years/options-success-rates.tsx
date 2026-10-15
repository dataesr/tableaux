import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";
import type { HighchartsOptions } from "../../../../../../components/chart-wrapper";

import { CreateChartOptions } from "../../../../components/chart-ep";
import { getI18nLabel } from "../../../../../../utils";
import i18n from "../../i18n-charts.json";
import { normalizeIdForCssColorNames } from "../../../../utils";
import { getCssColor } from "../../../../../../utils/colors";

export default function Options(data, displayType, currentLang): HighchartsOptions {
  if (!data || !Array.isArray(data)) return null;

  const countryData = data.filter((item) => item.country !== "all")[0];
  const allCountryData = data.find((item) => item.country === "all");

  if (!countryData?.data || !allCountryData?.data) return null;

  const filteredData = countryData.data;
  const allData = allCountryData.data;

  const evaluatedFiltered = filteredData.find((item) => item.stage === "evaluated");
  const successfulFiltered = filteredData.find((item) => item.stage === "successful");
  const evaluatedAll = allData.find((item) => item.stage === "evaluated");
  const successfulAll = allData.find((item) => item.stage === "successful");

  if (!evaluatedFiltered?.topics?.length || !successfulFiltered?.topics?.length) return null;
  if (!evaluatedAll?.topics?.length || !successfulAll?.topics?.length) return null;

  // liste de toutes les années/thema_code disponibles en parcourant tous les topics
  const years = new Set();
  const topicsLabels = new Set();
  filteredData.forEach((el) => {
    el.topics.forEach((topic) => {
      topicsLabels.add(topic.thema_code);
      topic.years.forEach((y) => {
        years.add(y.year);
      });
    });
  });
  const sortedYears = Array.from(years).sort(); // ['2021', '2022', '2023', '2024', '2025']

  // Pour les topics multiples, on construit les séries dynamiquement
  const sortedData = (topics) =>
    topics.map((topic) => ({
      ...topic,
      years: sortedYears.map((year) => topic.years.find((item) => item.year === year) ?? { year }),
    }));

  const evaluatedTopics = sortedData(evaluatedFiltered.topics);
  const successfulTopics = sortedData(successfulFiltered.topics);
  const evaluatedAllTopics = sortedData(evaluatedAll.topics);
  const successfulAllTopics = sortedData(successfulAll.topics);

  const commonXAxis = {
    type: "category" as const,
    categories: sortedYears.map(String),
    width: "48%",
    offset: 0,
    gridLineWidth: 0,
  };

  const newOptions: HighchartsInstance.Options = {
    yAxis: {
      gridLineColor: "var(--background-default-grey-hover)",
      gridLineWidth: 0.5,
    },
    xAxis: [
      { ...commonXAxis, left: "0%" },
      { ...commonXAxis, left: "50%" },
    ],
    plotOptions: {
      line: {
        marker: {
          enabled: true,
          symbol: "circle",
          radius: 3,
          lineWidth: 2,
          lineColor: undefined,
        },
        dataLabels: {
          enabled: true,
          formatter: function () {
            return `${Number(this.y).toFixed(1)}%`;
          },
        },
      },
    },
    tooltip: {
      shared: true,
      formatter: function () {
        let s = `<b>${this.x}</b>`; // annee
        this.points?.forEach((point) => {
          s += `<br/><span style="color:${point.color}">\u25CF</span> ${point.series.name}: <b>${Number(point.y).toFixed(1)}%</b>`;
        });
        return s;
      },
    },
    series: evaluatedTopics
      .map((topic) => {
        const allTopicData = evaluatedAllTopics.find((t) => t.thema_code === topic.thema_code);
        const topicName = currentLang === "fr" ? topic.thema_name_fr : topic.thema_name_en;
        return {
          name: `${topicName} - ${getI18nLabel(i18n, "evaluatedProjects", currentLang)}`,
          data: topic.years.map((year, index) => {
            const totalForYear = allTopicData?.years[index]?.[displayType] ?? 0;
            const topicValue = year[displayType] ?? 0;
            return totalForYear > 0 ? (topicValue / totalForYear) * 100 : 0;
          }),
          color: getCssColor(`topic-${normalizeIdForCssColorNames(topic.thema_code)}-color`),
        };
      })
      .concat(
        successfulTopics.map((topic) => {
          const allTopicData = successfulAllTopics.find((t) => t.thema_code === topic.thema_code);
          const topicName = currentLang === "fr" ? topic.thema_name_fr : topic.thema_name_en;

          return {
            xAxis: 1,
            name: `${topicName} - ${getI18nLabel(i18n, "successfulProjects", currentLang)}`,
            data: topic.years.map((year, index) => {
              const totalForYear = allTopicData?.years[index]?.[displayType] ?? 0;
              const topicValue = year[displayType] ?? 0;
              return totalForYear > 0 ? (topicValue / totalForYear) * 100 : 0;
            }),
            color: getCssColor(`topic-${normalizeIdForCssColorNames(topic.thema_code)}-color`),
          };
        }),
      ),
  };
  return CreateChartOptions("line", newOptions);
}
