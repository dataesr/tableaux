import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";

import { getI18nLabel } from "../../../../../../utils";
import { getCssColor } from "../../../../../../utils/colors";
import { formatToPercentLang } from "../../../../../../utils/format";
import { CreateChartOptions } from "../../../../components/chart-ep";
import i18n from "../../i18n-charts.json";

export default function options(data, displayType: string = "total_fund_eur", currentLang: string, title?: string) {
  if (!data) return null;
  const sorted = data.data.sort((a, b) => a.program.localeCompare(b.program));

  const lang: "fr" | "en" = currentLang === "en" ? "en" : "fr";

  const legend: any = {}
  let valueKey
  switch (displayType) {
    case "total_fund_eur":
      legend.serie_01 = getI18nLabel(i18n, "requestedFunding", lang)
      legend.serie_02 = getI18nLabel(i18n, "securedFunding", lang)
      valueKey = "proportion"
      break
    case "total_coordination_number":
      legend.serie_01 = getI18nLabel(i18n, "proportionEvaluated", lang)
      legend.serie_02 = getI18nLabel(i18n, "proportionSuccessful", lang)
      valueKey = "proportion_coordination_number"
      break
    case "total_number_involved":
      legend.serie_01 = getI18nLabel(i18n, "proportionApplicant", lang)
      legend.serie_02 = getI18nLabel(i18n, "proportionParticipant", lang)
      valueKey = "proportion_number_involved"
      break
    case "total_projects":
      legend.serie_01 = getI18nLabel(i18n, "proportionEvaluated", lang)
      legend.serie_02 = getI18nLabel(i18n, "proportionSuccessful", lang)
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
        return `${this.series.name} : <b>${formatToPercentLang(this.y ?? 0, lang)}</b>`;
      },
    },
    plotOptions: {
      series: {
        dataLabels: { enabled: true },
      },
      column: {
        borderWidth: 0, 
        grouping: true, 
        maxPointWidth: 90,
        groupPadding: 0.25, // espace entre les catégories (par défaut 0.2)
        pointPadding: 0.1,
      },
    },
    series: [
      {
        type: "column",
        name: legend.serie_01,
        color: getCssColor("evaluated-project"),
        data: sorted.filter((item) => item.stage === "evaluated").map((item) => [item.programme_name_fr, item[valueKey]]),
        dataLabels: {
          formatter: function () {
            return formatToPercentLang(this.y ?? 0, lang);
          },
        },
      },
      {
        type: "column",
        name: legend.serie_02,
        color: getCssColor("successful-project"),
        data: sorted.filter((item) => item.stage === "successful").map((item) => [item.programme_name_fr, item[valueKey]]),
        dataLabels: {
          formatter: function () {
            return formatToPercentLang(this.y ?? 0, lang);
          },
        },
      },
    ],
  };

  return CreateChartOptions("column", newOptions);
}
