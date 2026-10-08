import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";
import { CreateChartOptions } from "../../../../../components/chart-ep";

interface DataItem {
  name: string;
  ratio_involved: number;
}

export default function optionNumberInvolvedSuccessRate(data: DataItem[], currentLang: string): Highcharts.Options | null {
  if (!data) return null;

  const rootStyles = getComputedStyle(document.documentElement);

  // average ratio
  const total = data.reduce((acc, el) => acc + el.ratio_involved, 0);
  const average = total / data.length;

  const translations = {
    fr: { successRate: "Taux de succès", average: "Moyenne", successRateLabel: "Taux de succès sur les participants" },
    en: { successRate: "Success rate", average: "Average", successRateLabel: "Success rate on participants" },
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
        return `${this.point.name}<br/>${t.successRate} : <b>${this.point.y.toFixed(1)}%</b><br/><br/>${t.average} : <b>${average.toFixed(1)}%</b>`;
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
          y: item.ratio_involved,
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
