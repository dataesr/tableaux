import type Highcharts from "highcharts/es-modules/masters/highcharts.src.js";

import { getResponsiveChartHeight } from "../../../../../../../utils";
import { getCssColor } from "../../../../../../../utils/colors";
import { formatToMillionsLang } from "../../../../../../../utils/format";
import { CreateChartOptions } from "../../../../../components/chart-ep";

export default function Options(data, currentLang) {
  if (!data) return null;

  const newOptions: Highcharts.Options = {
    chart: {
      height: getResponsiveChartHeight(data.length),
    },
    xAxis: {
      type: "category",
    },
    yAxis: [
      {
        min: 0,
        title: {
          text: "Euros (M€)",
        },
      },
    ],
    plotOptions: {
      series: {
        dataLabels: { enabled: true },
      },
      bar: {
        groupPadding: 0.2,
        pointPadding: 0.1,
        borderWidth: 0,
        shadow: false,
        borderRadius: 0,
      },
    },
    series: [
      {
        type: "bar",
        name: "Financements demandés",
        color: getCssColor("evaluated-project"),
        data: data.map((item) => ({
          label: formatToMillionsLang(item.total_evaluated, currentLang, 1),
          name: item[`name_${currentLang}`],
          rank_evaluated: item.rank_evaluated,
          y: item.total_evaluated,
        })),
        dataLabels: [
          {
            align: "right",
            format: "{point.rank_evaluated}e",
          },
        ],
        tooltip: {
          pointFormat: "Financements demandés: <b>{point.label}</b>",
        },
      },
      {
        type: "bar",
        name: "Financements obtenus",
        color: getCssColor("successful-project"),
        data: data.map((item) => ({
          label: formatToMillionsLang(item.total_successful, currentLang, 1),
          name: item[`name_${currentLang}`],
          rank_successful: item.rank_successful,
          y: item.total_successful,
        })),
        dataLabels: [
          {
            align: "right",
            format: "{point.rank_successful}e",
          },
        ],
        tooltip: {
          pointFormat: "Financements obtenus: <b>{point.label}</b>",
        },
      },
    ],
  };

  return CreateChartOptions("bar", newOptions);
}
