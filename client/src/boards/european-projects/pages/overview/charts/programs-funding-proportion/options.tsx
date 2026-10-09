import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";

import { CreateChartOptions } from "../../../../components/chart-ep";
import { formatToPercent } from "../../../../../../utils/format";
import { getCssColor } from "../../../../../../utils/colors";
import { getI18nLabel } from "../../../../../../utils";
import i18n from "../../i18n-charts.json";

export default function Options(data, displayType: string = "total_fund_eur", title?: string) {
  if (!data) return null;

  const valueKey = displayType === "total_coordination_number" ? "proportion_coordination_number" : displayType === "total_number_involved" ? "proportion_number_involved" : "proportion";

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
        text: "%",
      },
      gridLineColor: "var(--background-default-grey-hover)",
      gridLineWidth: 0.5,
    },
    tooltip: {
      pointFormatter: function () {
        return `${getI18nLabel(i18n, "fundingProportion")} : <b>${formatToPercent(this.y ?? 0)}</b>`;
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
        name: getI18nLabel(i18n, "evaluatedProjects"),
        color: getCssColor("evaluated-project"),
        groupPadding: 0,
        data: data.data.filter((item) => item.stage === "evaluated").map((item) => [item.programme_name_fr, item[valueKey]]),
        dataLabels: {
          formatter: function () {
            return formatToPercent(this.y ?? 0);
          },
        },
      },
      {
        type: "column",
        name: getI18nLabel(i18n, "successfulProjects"),
        color: getCssColor("successful-project"),
        groupPadding: 0,
        data: data.data.filter((item) => item.stage === "successful").map((item) => [item.programme_name_fr, item[valueKey]]),
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
