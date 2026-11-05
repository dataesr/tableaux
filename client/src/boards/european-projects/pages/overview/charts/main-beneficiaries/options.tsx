import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";

import { CreateChartOptions } from "../../../../components/chart-ep";

export default function Options(data) {
  if (!data) return null;

  const newOptions: HighchartsInstance.Options = {
    xAxis: {
      type: "category",
    },
    yAxis: {
      min: 0,
      title: {
        text: "Euros (M€)",
      },
    },
    tooltip: {
      pointFormat: "Total des subventions : <b>{point.y:.1f} €</b>",
    },
    series: [
      {
        type: "bar",
        name: "Total subventions en euros",
        colors: ["#1E3859"],
        colorByPoint: true,
        groupPadding: 0,
        data: data.list.map((item) => [item.acronym, item.total_fund_eur]),
      },
    ],
  };

  return CreateChartOptions("bar", newOptions);
}
