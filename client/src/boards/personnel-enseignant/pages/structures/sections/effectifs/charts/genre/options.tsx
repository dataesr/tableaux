import Highcharts from "highcharts/es-modules/masters/highcharts.src.js";
import { createChartOptions } from "../../../../../../../../components/chart-wrapper/default-options";
import { getCssColor } from "../../../../../../../../utils/colors";

export function createGenderChartOptions(
  maleCount: number,
  femaleCount: number
): Highcharts.Options {
  return createChartOptions("bar", {
    chart: { height: 160 },
    xAxis: { visible: false, categories: [""] },
    yAxis: { visible: false, min: 0 },
    plotOptions: {
      bar: {
        stacking: "percent",
        borderWidth: 0,
        borderRadius: 0,
        pointWidth: 52,
        dataLabels: {
          enabled: true,
          format: "{series.name}<br/><b>{point.percentage:.1f}\u00a0%</b>",
          style: {
            fontSize: "12px",
            fontWeight: "normal",
            textOutline: "none",
            color: getCssColor("text-inverted-grey"),
          },
        },
      },
    },
    tooltip: {
      pointFormat:
        '<span style="color:{series.color}">●</span> {series.name}: <b>{point.y:,.0f}</b> ({point.percentage:.1f}\u00a0%)<br/>',
    },
    legend: {
      enabled: true,
      itemStyle: { fontSize: "11px", fontWeight: "normal" },
    },
    series: [
      {
        type: "bar",
        name: "Hommes",
        data: [maleCount],
        color: getCssColor("fm-hommes"),
      },
      {
        type: "bar",
        name: "Femmes",
        data: [femaleCount],
        color: getCssColor("fm-femmes"),
      },
    ],
  });
}
