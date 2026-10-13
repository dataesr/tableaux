import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";
import type { HighchartsOptions } from "../../../../../../components/chart-wrapper";

import { CreateChartOptions } from "../../../../components/chart-ep";
import { getCssColor } from "../../../../../../utils/colors";
import { getI18nLabel } from "../../../../../../utils";
import i18n from "../../i18n-charts.json";

export default function Options(data, displayType, currentLang): HighchartsOptions {
  if (!data) return null;

  const years = new Set();
  const filteredData = data.filter((item) => item.country !== "all")[0].data;
  const allData = data.find((item) => item.country === "all").data;

  filteredData.find((item) => item.stage === "evaluated").pillars[0].years.forEach((year) => years.add(year.year));

  const commonXAxis = {
    type: "category" as const,
    categories: Array.from(years).map(String),
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
    series: filteredData
      .find((item) => item.stage === "evaluated")
      .pillars.map((pillar) => {
        const allPillarData = allData.find((item) => item.stage === "evaluated").pillars.find((p) => p.pilier_code === pillar.pilier_code);

        return {
          color: getCssColor("evaluated-project"),
          name: getI18nLabel(i18n, "evaluatedProjects", currentLang),
          data: pillar.years.map((year, index) => {
            const totalForYear = allPillarData.years[index][displayType];
            return totalForYear > 0 ? (year[displayType] / totalForYear) * 100 : 0;
          }),
        };
      })
      .concat(
        filteredData
          .find((item) => item.stage === "successful")
          .pillars.map((pillar) => {
            const allPillarData = allData.find((item) => item.stage === "successful").pillars.find((p) => p.pilier_code === pillar.pilier_code);
            return {
              xAxis: 1,
              name: getI18nLabel(i18n, "successfulProjects", currentLang),
              data: pillar.years.map((year, index) => {
                const totalForYear = allPillarData.years[index][displayType];
                return totalForYear > 0 ? (year[displayType] / totalForYear) * 100 : 0;
              }),
              color: getCssColor("successful-project"),
            };
          }),
      ),
  };
  return CreateChartOptions("line", newOptions);
}
