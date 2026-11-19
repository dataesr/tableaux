import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";

import { getI18nLabel } from "../../../../../../utils";
import { getCssColor } from "../../../../../../utils/colors";
import { formatToPercent } from "../../../../../../utils/format";
import { CreateChartOptions } from "../../../../components/chart-ep";
import i18n from "../../i18n-charts.json";

export default function getOptions(data, displayType: string = "total_fund_eur", currentLang: string) {
  if (!data) return null;

  const valueKey = displayType === "total_coordination_number" ? "proportion_coordination_number" : displayType === "total_number_involved" ? "proportion_number_involved" : displayType === "total_fund_eur" ? "proportion" : "proportion_projects";

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
        return `${getI18nLabel(i18n, valueKey)} : <b>${formatToPercent(this.y ?? 0)}</b>`;
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
        data: data.data.filter((item) => item.stage === "evaluated").map((item) => [item.thema_name_fr, item[valueKey]]),
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
        data: data.data.filter((item) => item.stage === "successful").map((item) => [item.thema_name_fr, item[valueKey]]),
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
