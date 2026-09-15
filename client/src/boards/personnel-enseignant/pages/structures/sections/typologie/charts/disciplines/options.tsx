import Highcharts from "highcharts/es-modules/masters/highcharts.src.js";
import { createChartOptions } from "../../../../../../../../components/chart-wrapper/default-options";
import { getCssColor } from "../../../../../../../../utils/colors";

export function createDisciplineChartOptions(
  categories: string[],
  maleData: number[],
  femaleData: number[]
): Highcharts.Options {
  return createChartOptions("bar", {
    chart: {
      height: Math.max(350, categories.length * 55),
    },
    xAxis: {
      categories,
      title: { text: null },
    },
    yAxis: {
      min: 0,
      title: { text: "Effectif" },
      stackLabels: {
        enabled: true,
        format: "{total:,.0f}",
        style: { fontSize: "10px", fontWeight: "bold" },
      },
    },
    plotOptions: {
      bar: { stacking: "normal", borderWidth: 0, borderRadius: 2 },
    },
    tooltip: {
      shared: true,
      headerFormat: "<b>{point.key}</b><br/>",
      pointFormat:
        '<span style="color:{series.color}">\u25CF</span> {series.name}: <b>{point.y:,.0f}</b><br/>',
    },
    legend: {
      enabled: true,
      reversed: true,
      itemStyle: { fontSize: "11px", fontWeight: "normal" },
    },
    series: [
      {
        type: "bar",
        name: "Hommes",
        data: maleData,
        color: getCssColor("fm-hommes"),
      },
      {
        type: "bar",
        name: "Femmes",
        data: femaleData,
        color: getCssColor("fm-femmes"),
      },
    ],
  });
}
