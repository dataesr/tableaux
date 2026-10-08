import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";
import { CreateChartOptions } from "../../../../../components/chart-ep";

interface DataItem {
  name: string;
  ratio: number;
}

export default function optionSuccessRate(data: DataItem[], currentLang: string): Highcharts.Options | null {
  if (!data) return null;

  const rootStyles = getComputedStyle(document.documentElement);

  // average ratio
  const total = data.reduce((acc, el) => acc + el.ratio, 0);
  const average = total / data.length;

  const translations = {
    fr: { successRate: "Taux de succès", average: "Moyenne des pays", successRateLabel: "Taux de succès sur les montants" },
    en: { successRate: "Success rate", average: "Average of countries", successRateLabel: "Success rate on amounts" },
  };
  const t = translations[currentLang as keyof typeof translations] || translations.en;

  const newOptions: HighchartsInstance.Options = {
    legend: { enabled: true, layout: "horizontal" },
    xAxis: {
      visible: false,
    },
    yAxis: {
      plotLines: [
        {
          color: rootStyles.getPropertyValue("--average-success-rate-color"),
          width: 4,
          value: average,
          zIndex: 4,
          dashStyle: "Dot",
        },
      ],
      min: 0,
      title: {
        text: `${t.successRate} %`,
      },
    },
    tooltip: {
      formatter: function (this: any) {
        return `<b>${this.point.name}</b><br/>${t.successRate} : <b>${this.point.y.toFixed(1)}%</b><br/><br/>${t.average} : <b>${average.toFixed(1)}%</b>`;
      },
    },
    plotOptions: {
      series: { dataLabels: { enabled: true } },
    },
    series: [
      {
        type: "bar",
        name: t.successRateLabel,
        color: rootStyles.getPropertyValue("--success-rate-color"),
        groupPadding: 0,
        data: data.map((item) => ({
          name: item[`name_${currentLang}`],
          y: item.ratio,
        })),
        dataLabels: [
          {
            align: "right",
            format: "{point.name}",
          },
        ],
      } as Highcharts.SeriesBarOptions,
    ],
  };
  return CreateChartOptions("bar", newOptions);
}
