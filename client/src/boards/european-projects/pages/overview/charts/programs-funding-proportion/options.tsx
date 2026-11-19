import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";

import { getI18nLabel } from "../../../../../../utils";
import { getCssColor } from "../../../../../../utils/colors";
import { formatToPercent } from "../../../../../../utils/format";
import { CreateChartOptions } from "../../../../components/chart-ep";
import i18n from "../../i18n-charts.json";

export default function options(data, displayType: string = "total_fund_eur", currentLang: string, title?: string) {
  if (!data) return null;
  const sorted = data.data.sort((a, b) => a.program.localeCompare(b.program));

  const legend: any = {}
  let valueKey
  switch (displayType) {
    case "total_fund_eur":
      legend.serie_01 = getI18nLabel(i18n, "requestedFunding", currentLang)
      legend.serie_02 = getI18nLabel(i18n, "securedFunding", currentLang)
      valueKey = "proportion"
      break
    case "total_coordination_number":
      legend.serie_01 = getI18nLabel(i18n, "evaluatedCoordinations", currentLang)
      legend.serie_02 = getI18nLabel(i18n, "successfulCoordinations", currentLang)
      valueKey = "proportion_coordination_number"
      break
    case "total_number_involved":
      legend.serie_01 = getI18nLabel(i18n, "applicantsNumber", currentLang)
      legend.serie_02 = getI18nLabel(i18n, "participantsNumber", currentLang)
      valueKey = "proportion_number_involved"
      break
    case "total_projects":
      legend.serie_01 = getI18nLabel(i18n, "evaluatedProjects", currentLang)
      legend.serie_02 = getI18nLabel(i18n, "successfulProjects", currentLang)
      valueKey = "proportion_projects"
      break
    default:
      break
  }

  const newOptions: HighchartsInstance.Options = {
    title: { text: title },
    xAxis: {
      type: "category",
      gridLineColor: "var(--background-default-grey-hover)",
      gridLineWidth: 0.5,
    },
    yAxis: {
      min: 0,
      title: {
        text: "Part (%)",
      },
      gridLineColor: "var(--background-default-grey-hover)",
      gridLineWidth: 0.5,
    },
    tooltip: {
      pointFormatter: function () {
        return `${this.series.name} : <b>${formatToPercent(this.y ?? 0)}</b>`;
      },
    },
    plotOptions: {
      series: {
        dataLabels: { enabled: true },
      },
      column: {
        borderWidth: 0,
        borderRadius: 0,
      },
    },
    series: [
      {
        type: "column",
        name: legend.serie_01,
        color: getCssColor("evaluated-project"),
        groupPadding: 0,
        data: sorted.filter((item) => item.stage === "evaluated").map((item) => [item.programme_name_fr, item[valueKey]]),
        dataLabels: {
          formatter: function () {
            return formatToPercent(this.y ?? 0);
          },
        },
      },
      {
        type: "column",
        name: legend.serie_02,
        color: getCssColor("successful-project"),
        groupPadding: 0,
        data: sorted.filter((item) => item.stage === "successful").map((item) => [item.programme_name_fr, item[valueKey]]),
        dataLabels: {
          formatter: function () {
            return formatToPercent(this.y ?? 0);
          },
        },
      },
    ],
  };

  return CreateChartOptions("column", newOptions);
}
