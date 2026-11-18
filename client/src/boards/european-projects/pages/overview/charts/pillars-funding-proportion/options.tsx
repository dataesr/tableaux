import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";

import { CreateChartOptions } from "../../../../components/chart-ep";
import { formatToPercentLang } from "../../../../../../utils/format";
import { getCssColor } from "../../../../../../utils/colors";
import { getI18nLabel } from "../../../../../../utils";
import { getName, sortByCode } from "./utils";
import i18n from "../../i18n-charts.json";

export default function Options(data, displayType: string = "total_fund_eur", title?: string, currentLang: "fr" | "en" = "fr") {
  if (!data) return null;

  const valueKeys: Record<string, string> = {
  total_coordination_number: "proportion_coordination_number",
  total_number_involved: "proportion_number_involved",
  total_projects: "proportion_projects",
  total_fund_eur: "proportion",
  };
  const valueKey = valueKeys[displayType] ?? "proportion";

  const evaluated = sortByCode(data.data.filter((item) => item.stage === "evaluated"));
  const successful = sortByCode(data.data.filter((item) => item.stage === "successful"));

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
      enabled: false,
      pointFormatter: function () {
        return `${getI18nLabel(i18n, valueKey)} : <b>${formatToPercentLang(this.y ?? 0, currentLang)}</b>`;
      },
    },
    plotOptions: {
      series: {
        dataLabels: { enabled: true },
      },
      column: {
        borderWidth: 0,
        borderRadius: 0,
        maxPointWidth: 60,
        groupPadding: 0.2, // espace entre les catégories (par défaut 0.2)
        pointPadding: 0.001,
      },
    },
    series: [
      {
        type: "column",
        name: getI18nLabel(i18n, "evaluatedProjects"),
        color: getCssColor("evaluated-project"),
        // groupPadding: 0,
        data: evaluated.map((item) => [getName(item, currentLang), item[valueKey]]),
        dataLabels: {
          formatter: function () {
            return formatToPercentLang(this.y ?? 0, currentLang);
          },
        },
      },
      {
        type: "column",
        name: getI18nLabel(i18n, "successfulProjects"),
        color: getCssColor("successful-project"),
        // groupPadding: 0,
        data: successful.map((item) => [getName(item, currentLang), item[valueKey]]),
        dataLabels: {
          formatter: function () {
            return formatToPercentLang(this.y ?? 0, currentLang);
          },
        },
      },
    ],
  };

  return CreateChartOptions("column", newOptions);
}