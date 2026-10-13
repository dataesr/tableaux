import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";
import { CreateChartOptions } from "../../../../../components/chart-ep";
import { getCssColor } from "../../../../../../../utils/colors";
import { getResponsiveChartHeight } from "../../../../../../../utils";

interface DataItem {
  name_fr: string;
  name_en: string;
  total_coordination_number_evaluated: number;
  total_coordination_number_successful: number;
  rank_coordination_number_evaluated: number;
  rank_coordination_number_successful: number;
}

export default function OptionsCoordinationNumber(data: DataItem[], currentLang: string): Highcharts.Options | null {
  if (!data) return null;

  const newOptions: HighchartsInstance.Options = {
    chart: {
      height: getResponsiveChartHeight(data.length),
    },
    xAxis: {
      type: "category",
    },
    yAxis: {
      min: 0,
      title: {
        text: "Euros € (millions)",
      },
    },
    tooltip: {
      pointFormat: "Nombre de coordinations : <b>{point.y}</b>",
    },
    plotOptions: {
      series: { dataLabels: { enabled: true } },
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
        name: "Coordination de projets déposés",
        color: getCssColor("evaluated-project"),
        data: data.map((item) => ({
          name: item[`name_${currentLang}` as keyof DataItem],
          y: item.total_coordination_number_evaluated,
          rank_coordination_number_evaluated: item.rank_coordination_number_evaluated,
        })),
        dataLabels: [
          {
            align: "right",
            format: "{point.rank_coordination_number_evaluated}e",
          },
        ],
      } as Highcharts.SeriesBarOptions,
      {
        type: "bar",
        name: "Coordination de projets lauréats",
        color: getCssColor("successful-project"),
        data: data.map((item) => ({
          name: item[`name_${currentLang}` as keyof DataItem],
          y: item.total_coordination_number_successful,
          rank_coordination_number_successful: item.rank_coordination_number_successful,
        })),
        dataLabels: [
          {
            align: "right",
            format: "{point.rank_coordination_number_successful}e",
          },
        ],
      } as Highcharts.SeriesBarOptions,
    ],
  };
  return CreateChartOptions("bar", newOptions);
}
