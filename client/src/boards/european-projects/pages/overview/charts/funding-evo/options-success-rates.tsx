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

  if (!evaluatedFiltered?.items?.length || !successfulFiltered?.items?.length) return null;
  if (!evaluatedAll?.items?.length || !successfulAll?.items?.length) return null;

  // liste de toutes les années/code disponibles en parcourant tous les items
  const years = new Set();
  const itemsLabels = new Set();
  filteredData.forEach((el) => {
    el.items.forEach((item) => {
      itemsLabels.add(item.code);
      item.years.forEach((y) => {
        years.add(y.year);
      });
    });
  });
  const sortedYears = Array.from(years).sort(); // ['2021', '2022', '2023', '2024', '2025']

  // Pour les items multiples, on construit les séries dynamiquement
  const sortedData = (items) =>
    items.map((item) => ({
      ...item,
      years: sortedYears.map((year) => item.years.find((item) => item.year === year) ?? { year }),
    }));

  const evaluatedItems = sortedData(evaluatedFiltered.items);
  const successfulItems = sortedData(successfulFiltered.items);
  const evaluatedAllItems = sortedData(evaluatedAll.items);
  const successfulAllItems = sortedData(successfulAll.items);

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
    series: evaluatedItems
      .map((item) => {
        const allItemData = evaluatedAllItems.find((t) => t.code === item.code);
        const itemName = currentLang === "fr" ? item.name_fr : item.name_en;
        return {
          name: `${itemName} - ${getI18nLabel(i18n, "evaluatedProjects", currentLang)}`,
          data: item.years.map((year, index) => {
            const totalForYear = allItemData?.years[index]?.[displayType] ?? 0;
            const itemValue = year[displayType] ?? 0;
            return totalForYear > 0 ? (itemValue / totalForYear) * 100 : 0;
          }),
          color: getCssColor(`item-${normalizeIdForCssColorNames(item.code)}-color`),
        };
      })
      .concat(
        successfulItems.map((item) => {
          const allItemData = successfulAllItems.find((t) => t.code === item.code);
          const itemName = currentLang === "fr" ? item.name_fr : item.name_en;

          return {
            xAxis: 1,
            name: `${itemName} - ${getI18nLabel(i18n, "successfulProjects", currentLang)}`,
            data: item.years.map((year, index) => {
              const totalForYear = allItemData?.years[index]?.[displayType] ?? 0;
              const itemValue = year[displayType] ?? 0;
              return totalForYear > 0 ? (itemValue / totalForYear) * 100 : 0;
            }),
            color: getCssColor(`item-${normalizeIdForCssColorNames(item.code)}-color`),
          };
        }),
      ),
  };
  return CreateChartOptions("line", newOptions);
}
