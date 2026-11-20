import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";

import type { HighchartsOptions } from "../../../../../../components/chart-wrapper";
import { getCssColor } from "../../../../../../utils/colors";
import { formatToPercentLang } from "../../../../../../utils/format";
import { CreateChartOptions } from "../../../../components/chart-ep";
import { getEvolLegend, getEvolYAxisTitle, getLevelFromData, LEVELS } from "../../evol-charts-text";

export default function getOptionsSuccessRates(data, displayType, currentLang): HighchartsOptions {
  if (!data) return null;

  // level correspond à pillar | program | topic
  const level = getLevelFromData(data);
  const { itemsKey, codeKey } = LEVELS[level];

  const years = new Set();
  const filteredData = data.filter((item) => item.country !== "all")[0].data;
  const allData = data.find((item) => item.country === "all").data;

  filteredData.find((item) => item.stage === "evaluated")[itemsKey][0].years.forEach((year) => years.add(year.year));

  const commonXAxis = {
    type: "category" as const,
    categories: Array.from(years).map(String),
    width: "48%",
    offset: 0,
    gridLineWidth: 0,
  };

  const legend = getEvolLegend(displayType, currentLang);

  const newOptions: HighchartsInstance.Options = {
    yAxis: {
      gridLineColor: "var(--background-default-grey-hover)",
      gridLineWidth: 0.5,
      title: { text: getEvolYAxisTitle("share", currentLang) }
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
    series: filteredData
      .find((item) => item.stage === "evaluated")
      [itemsKey].map((item) => {
        const allItemData = allData.find((d) => d.stage === "evaluated")[itemsKey].find((a) => a[codeKey] === item[codeKey]);
        return {
          color: getCssColor("evaluated-project"),
          name: legend.serie_01,
          data: item.years.map((year, index) => {
            const totalForYear = allItemData.years[index][displayType];
            return totalForYear > 0 ? (year[displayType] / totalForYear) * 100 : 0;
          }),
        };
      })
      .concat(
        filteredData
          .find((item) => item.stage === "successful")
          [itemsKey].map((item) => {
            const allItemData = allData.find((d) => d.stage === "successful")[itemsKey].find((a) => a[codeKey] === item[codeKey]);
            return {
              xAxis: 1,
              name: legend.serie_02,
              data: item.years.map((year, index) => {
                const totalForYear = allItemData.years[index][displayType];
                return totalForYear > 0 ? (year[displayType] / totalForYear) * 100 : 0;
              }),
              color: getCssColor("successful-project"),
            };
          }),
      ),
  };
  return CreateChartOptions("line", newOptions);
}