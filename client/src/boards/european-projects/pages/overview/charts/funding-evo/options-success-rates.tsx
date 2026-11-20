import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";
import type { HighchartsOptions } from "../../../../../../components/chart-wrapper";

import { getCssColor } from "../../../../../../utils/colors";
import { formatToPercentLang } from "../../../../../../utils/format";
import { CreateChartOptions } from "../../../../components/chart-ep";
import { normalizeIdForCssColorNames } from "../../../../utils";
import { getEvolLegend, getEvolYAxisTitle, getLevelFromData, LEVELS } from "../../evol-charts-text";

export default function getOptionsSuccessRates(data, displayType, currentLang): HighchartsOptions {
  if (!data || !Array.isArray(data)) return null;

  // level correspond à pillar | program | topic
  const level = getLevelFromData(data);
  const { itemsKey, codeKey, nameKey } = LEVELS[level];

  const countryData = data.filter((item) => item.country !== "all")[0];
  const allCountryData = data.find((item) => item.country === "all");

  if (!countryData?.data || !allCountryData?.data) return null;

  const filteredData = countryData.data;
  const allData = allCountryData.data;

  const evaluatedFiltered = filteredData.find((item) => item.stage === "evaluated");
  const successfulFiltered = filteredData.find((item) => item.stage === "successful");
  const evaluatedAll = allData.find((item) => item.stage === "evaluated");
  const successfulAll = allData.find((item) => item.stage === "successful");

  if (!evaluatedFiltered?.[itemsKey]?.length || !successfulFiltered?.[itemsKey]?.length) return null;
  if (!evaluatedAll?.[itemsKey]?.length || !successfulAll?.[itemsKey]?.length) return null;

  // liste de toutes les années/code disponibles en parcourant tous les items
  const years = new Set();
  const itemsLabels = new Set();
  filteredData.forEach((el) => {
    el[itemsKey].forEach((item) => {
      itemsLabels.add(item[codeKey]);
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

  const evaluatedItems = sortedData(evaluatedFiltered[itemsKey]);
  const successfulItems = sortedData(successfulFiltered[itemsKey]);
  const evaluatedAllItems = sortedData(evaluatedAll[itemsKey]);
  const successfulAllItems = sortedData(successfulAll[itemsKey]);

  const commonXAxis = {
    type: "category" as const,
    categories: sortedYears.map(String),
    width: "48%",
    offset: 0,
    gridLineWidth: 0,
  };

  const legend = getEvolLegend(displayType, currentLang);

  const newOptions: HighchartsInstance.Options = {
    yAxis: {
      gridLineColor: "var(--background-default-grey-hover)",
      gridLineWidth: 0.5,
      title: { text: getEvolYAxisTitle("share", currentLang) },
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
            return formatToPercentLang(this.y ?? 0, currentLang);
          },
        },
      },
    },
    tooltip: {
      shared: true,
      formatter: function () {
        let s = `<b>${this.key}</b>`;
        this.points?.forEach((point) => {
          s += `<br/><span style="color:${point.color}">\u25CF</span> ${point.series.name}: <b>${formatToPercentLang(point.y ?? 0, currentLang)}</b>`;
        });
        return s;
      },
    },
    series: evaluatedItems
      .map((item) => {
        const allItemData = evaluatedAllItems.find((t) => t[codeKey] === item[codeKey]);
        const itemName = currentLang === "fr" ? item[`${nameKey}_fr`] : item[`${nameKey}_en`];
        return {
          name: `${itemName} - ${legend.serie_01}`,
          data: item.years.map((year, index) => {
            const totalForYear = allItemData?.years[index]?.[displayType] ?? 0;
            const itemValue = year[displayType] ?? 0;
            return totalForYear > 0 ? (itemValue / totalForYear) * 100 : 0;
          }),
          color: getCssColor(`item-${normalizeIdForCssColorNames(item[codeKey])}-color`),
        };
      })
      .concat(
        successfulItems.map((item) => {
          const allItemData = successfulAllItems.find((t) => t[codeKey] === item[codeKey]);
          const itemName = currentLang === "fr" ? item[`${nameKey}_fr`] : item[`${nameKey}_en`];

          return {
            xAxis: 1,
            name: `${itemName} - ${legend.serie_02}`,
            data: item.years.map((year, index) => {
              const totalForYear = allItemData?.years[index]?.[displayType] ?? 0;
              const itemValue = year[displayType] ?? 0;
              return totalForYear > 0 ? (itemValue / totalForYear) * 100 : 0;
            }),
            color: getCssColor(`item-${normalizeIdForCssColorNames(item[codeKey])}-color`),
          };
        }),
      ),
  };
  return CreateChartOptions("line", newOptions);
}
