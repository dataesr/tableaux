import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";
import { CreateChartOptions } from "../../../../../components/chart-ep";
import { getCssColor } from "../../../../../../../utils/colors";
import { getResponsiveChartHeight } from "../../../../../../../utils";

interface DataItem {
  name_fr: string;
  name_en: string;
  total_number_involved_evaluated: number;
  total_number_involved_successful: number;
  rank_involved_evaluated: number;
  rank_involved_successful: number;
}

export default function OptionsNumberInvolved(data: DataItem[], currentLang: string): Highcharts.Options | null {
  if (!data) return null;

  const newOptions: HighchartsInstance.Options = {
    chart: {
      type: "bar",
      height: getResponsiveChartHeight(data.length),
    },
    credits: { enabled: false },
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
      pointFormat: "Nombre de candidats : <b>{point.y}</b>",
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
        name: "Candidats",
        color: getCssColor("candidats-color"),
        data: data.map((item) => ({
          name: item[`name_${currentLang}` as keyof DataItem],
          y: item.total_number_involved_evaluated,
          rank_number_involved_evaluated: item.rank_involved_evaluated,
        })),
        dataLabels: [
          {
            align: "right",
            format: "{point.rank_number_involved_evaluated}e",
          },
        ],
      } as Highcharts.SeriesBarOptions,
      {
        type: "bar",
        name: "Participants",
        color: getCssColor("participants-color"),
        data: data.map((item) => ({
          name: item[`name_${currentLang}` as keyof DataItem],
          y: item.total_number_involved_successful,
          rank_number_involved_successful: item.rank_involved_successful,
        })),
        dataLabels: [
          {
            align: "right",
            format: "{point.rank_number_involved_successful}e",
          },
        ],
      } as Highcharts.SeriesBarOptions,
    ],
  };
  return CreateChartOptions("bar", newOptions);
}
