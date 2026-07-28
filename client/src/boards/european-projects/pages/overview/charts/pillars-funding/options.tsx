import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";

import { CreateChartOptions } from "../../../../components/chart-ep";
import { formatToMillions } from "../../../../../../utils/format";
import { getCssColor } from "../../../../../../utils/colors";
import { getI18nLabel } from "../../../../../../utils";
import i18n from "../../i18n-charts.json";

export default function Options(data, title) {
  if (!data) return null;

  const height = data.data.length * 50;

  const newOptions: HighchartsInstance.Options = {
    chart: { height: height },
    title: { text: title },
    xAxis: {
      type: "category",
    },
    yAxis: {
      min: 0,
      title: {
        text: "Euros € (millions)",
      },
      gridLineColor: "var(--background-default-grey-hover)",
      gridLineWidth: 0.5,
    },
    tooltip: {
      pointFormatter: function () {
        return `${getI18nLabel(i18n, "totalFunding")} : <b>${formatToMillions(this.y ?? 0)}</b>`;
      },
    },
    plotOptions: {
      series: {
        dataLabels: { enabled: true },
      },
      bar: {
        pointWidth: 25,
        borderWidth: 0,
        borderRadius: 0,
      },
    },
    series: [
      {
        type: "bar",
        name: getI18nLabel(i18n, "evaluatedProjects"),
        color: getCssColor("evaluated-project"),
        groupPadding: 0,
        data: data.data.filter((item) => item.stage === "evaluated").map((item) => [item.name_fr, item.total_fund_eur]),
        dataLabels: {
          formatter: function () {
            return formatToMillions(this.y ?? 0);
          },
        },
      },
      {
        type: "bar",
        name: getI18nLabel(i18n, "successfulProjects"),
        color: getCssColor("successful-project"),
        groupPadding: 0,
        data: data.data.filter((item) => item.stage === "successful").map((item) => [item.name_fr, item.total_fund_eur]),
        dataLabels: {
          formatter: function () {
            return formatToMillions(this.y ?? 0);
          },
        },
      },
    ],
  };

  return CreateChartOptions("bar", newOptions);
}
