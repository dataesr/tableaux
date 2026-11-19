import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";

import type { HighchartsOptions } from "../../../../../../components/chart-wrapper";
import { getI18nLabel } from "../../../../../../utils";
import { getCssColor } from "../../../../../../utils/colors";
import { CreateChartOptions } from "../../../../components/chart-ep";
import i18n from "../../i18n-charts.json";

export default function getOptionsSuccessRates(data, displayType, currentLang): HighchartsOptions {
  if (!data) return null;

  const years = new Set();
  const filteredData = data.filter((item) => item.country !== "all")[0].data;
  const allData = data.find((item) => item.country === "all").data;

  filteredData.find((item) => item.stage === "evaluated").programs[0].years.forEach((year) => years.add(year.year));

  const commonXAxis = {
    type: "category" as const,
    categories: Array.from(years).map(String),
    width: "48%",
    offset: 0,
    gridLineWidth: 0,
  };

  const legend: any = {}
  switch (displayType) {
    case "total_fund_eur":
      legend.serie_01 = getI18nLabel(i18n, "requestedFunding", currentLang)
      legend.serie_02 = getI18nLabel(i18n, "securedFunding", currentLang)
      break
    case "total_coordination_number":
      legend.serie_01 = getI18nLabel(i18n, "evaluatedCoordinations", currentLang)
      legend.serie_02 = getI18nLabel(i18n, "successfulCoordinations", currentLang)
      break
    case "total_number_involved":
      legend.serie_01 = getI18nLabel(i18n, "applicantsNumber", currentLang)
      legend.serie_02 = getI18nLabel(i18n, "participantsNumber", currentLang)
      break
    case "total_projects":
      legend.serie_01 = getI18nLabel(i18n, "evaluatedProjects", currentLang)
      legend.serie_02 = getI18nLabel(i18n, "successfulProjects", currentLang)
      break
    default:
      break
  }

  const newOptions: HighchartsInstance.Options = {
    yAxis: {
      gridLineColor: "var(--background-default-grey-hover)",
      gridLineWidth: 0.5,
      title: { text: "Part (%)" }
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
        let s = `<b>${this.key}</b>`;
        this.points?.forEach((point) => {
          s += `<br/><span style="color:${point.color}">\u25CF</span> ${point.series.name}: <b>${Number(point.y).toFixed(1)}%</b>`;
        });
        return s;
      },
    },
    series: filteredData
      .find((item) => item.stage === "evaluated")
      .programs.map((program) => {
        const allProgramData = allData.find((item) => item.stage === "evaluated").programs.find((p) => p.programme_code === program.programme_code);
        return {
          color: getCssColor("evaluated-project"),
          name: legend.serie_01,
          data: program.years.map((year, index) => {
            const totalForYear = allProgramData.years[index][displayType];
            return totalForYear > 0 ? (year[displayType] / totalForYear) * 100 : 0;
          }),
        };
      })
      .concat(
        filteredData
          .find((item) => item.stage === "successful")
          .programs.map((program) => {
            const allProgramData = allData.find((item) => item.stage === "successful").programs.find((p) => p.programme_code === program.programme_code);
            return {
              xAxis: 1,
              name: legend.serie_02,
              data: program.years.map((year, index) => {
                const totalForYear = allProgramData.years[index][displayType];
                return totalForYear > 0 ? (year[displayType] / totalForYear) * 100 : 0;
              }),
              color: getCssColor("successful-project"),
            };
          }),
      ),
  };
  return CreateChartOptions("line", newOptions);
}
