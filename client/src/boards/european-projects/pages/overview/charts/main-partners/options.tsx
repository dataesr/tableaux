import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";

import { getI18nLabel } from "../../../../../../utils";
import { getCssColor } from "../../../../../../utils/colors";
import { formatToMillions } from "../../../../../../utils/format";
import { CreateChartOptions } from "../../../../components/chart-ep";
import i18n from "../../i18n-charts.json";

export default function getOptions(data, currentLang) {
  if (!data) return null;

  const newOptions: HighchartsInstance.Options = {
    chart: {
      height: data.list.length * 30 + 150,
    },
    xAxis: {
      type: "category",
    },
    yAxis: {
      min: 0,
      title: {
        text: undefined,
      },
      gridLineColor: "var(--background-default-grey-hover)",
      gridLineWidth: 0.5,
    },
    tooltip: {
      pointFormat: getI18nLabel(i18n, "totalFunding", currentLang) + ": <b>{point.label}</b>",
    },
    series: [
      {
        type: "bar",
        name: "Financements obtenus (M€)",
        color: getCssColor("main-partner"),
        groupPadding: 0,
        data: data.list.map((item) => ({
          label: formatToMillions(item.total_fund_eur),
          name: item.acronym || item.name,
          y: item.total_fund_eur,
        })),
      },
    ],
    plotOptions: {
      series: {
        animation: false,
        borderWidth: 0,
        dataLabels: {
          enabled: true,
          formatter: function () {
            return formatToMillions(this.y ?? 0);
          },
        },
      },
      bar: {
        pointWidth: 25,
        borderWidth: 0,
        borderRadius: 0,
      },
    },
  };

  return CreateChartOptions("bar", newOptions);
}
