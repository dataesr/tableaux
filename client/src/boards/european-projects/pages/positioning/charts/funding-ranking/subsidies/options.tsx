import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";
import { CreateChartOptions } from "../../../../../components/chart-ep";
import { getCssColor } from "../../../../../../../utils/colors";
import { getResponsiveChartHeight } from "../../../../../../../utils";

export default function Options(data, currentLang) {
  if (!data) return null;

  const newOptions: HighchartsInstance.Options = {
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
          text: "Euros € (millions)",
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
          name: item[`name_${currentLang}`],
          y: item.total_evaluated,
          rank_evaluated: item.rank_evaluated,
        })),
        dataLabels: [
          {
            align: "right",
            format: "{point.rank_evaluated}e",
          },
        ],
        tooltip: {
          pointFormat: "Financements demandés: <b>{point.y:.1f} €</b>",
        },
      },
      {
        type: "bar",
        name: "Financements obtenus",
        color: getCssColor("successful-project"),
        data: data.map((item) => ({
          name: item[`name_${currentLang}`],
          y: item.total_successful,
          rank_successful: item.rank_successful,
        })),
        dataLabels: [
          {
            align: "right",
            format: "{point.rank_successful}e",
          },
        ],
        tooltip: {
          pointFormat: "Financements obtenus: <b>{point.y:.1f} €</b>",
        },
      },
    ],
  };

  return CreateChartOptions("bar", newOptions);
}
