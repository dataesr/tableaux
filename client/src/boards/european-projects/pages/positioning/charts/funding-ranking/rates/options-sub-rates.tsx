import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";

import { CreateChartOptions } from "../../../../../components/chart-ep";
import { getCssColor } from "../../../../../../../utils/colors";

export default function Options(data, currentLang) {
  if (!data) return null;

  const newOptions: HighchartsInstance.Options = {
    legend: {
      enabled: true,
      layout: "horizontal",
    },
    xAxis: {
      type: "category",
    },
    yAxis: [
      {
        min: 0,
        title: {
          text: "%",
        },
      },
    ],
    plotOptions: {
      series: { dataLabels: { enabled: true } },
      column: {
        groupPadding: 0.2,
        pointPadding: 0.1,
        borderWidth: 0,
        shadow: false,
        borderRadius: 0,
      },
    },
    series: [
      {
        name: "Financements demandés",
        type: "column",
        color: getCssColor("evaluated-project"),
        data: data.map((item) => ({
          name: item[`name_${currentLang}`],
          y: parseFloat(item.total_evaluated_ratio),
          rank_evaluated: item.rank_evaluated,
        })),
        dataLabels: [
          {
            align: "right",
            format: "{point.rank_evaluated}e",
          },
        ],
        tooltip: {
          pointFormat: "Part des financements demandés : <b>{point.y:.2f} %</b>",
        },
      },
      {
        name: "Financements obtenus",
        type: "column",
        color: getCssColor("successful-project"),
        data: data.map((item) => ({
          name: item[`name_${currentLang}`],
          y: parseFloat(item.total_successful_ratio),
          rank_successful: item.rank_successful,
        })),
        dataLabels: [
          {
            align: "right",
            format: "{point.rank_successful}e",
          },
        ],
        tooltip: {
          pointFormat: "Part des financements obtenus : <b>{point.y:.2f} %</b>",
        },
      },
    ],
  };

  return CreateChartOptions("column", newOptions);
}
