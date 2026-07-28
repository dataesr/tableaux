import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";

import { CreateChartOptions } from "../../../../components/chart-ep";
import { formatToRates } from "../../../../../../utils/format";
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
      labels: {
        enabled: false,
      },
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
        return `${getI18nLabel(i18n, "successRate")} : <b>${formatToRates(this.y ?? 0)}</b>`;
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
        name: getI18nLabel(i18n, "successRate"),
        color: getCssColor("successRate"),
        groupPadding: 0,
        data: data.successRatesByCodes.map((item) => ({
          name: item.code,
          y: item.successRate,
        })),
        dataLabels: [
          {
            formatter: function () {
              return this.name;
            },
            inside: true,
            align: "left",
          },
          {
            formatter: function () {
              return formatToRates(this.y ?? 0);
            },
            inside: false,
            align: "right",
          },
        ],
      },
    ],
  };

  return CreateChartOptions("bar", newOptions);
}
