import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";
import { CreateChartOptions } from "../../../../../components/chart-ep";
import { getCssColor } from "../../../../../../../utils/colors";
import { getResponsiveChartHeight } from "../../../../../../../utils";

interface DataItem {
  name_fr: string;
  name_en: string;
  total_projects_evaluated: number;
  total_projects_successful: number;
  rank_projects_evaluated: number;
  rank_projects_successful: number;
}

export default function OptionsProjects(data: DataItem[], currentLang: string): Highcharts.Options | null {
  if (!data) return null;

  const t =
    currentLang === "fr"
      ? { axis: "Nombre de projets", tooltip: "Nombre de projets", evaluated: "Projets évalués", successful: "Projets lauréats" }
      : { axis: "Number of projects", tooltip: "Number of projects", evaluated: "Evaluated projects", successful: "Successful projects" };

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
        text: t.axis,
      },
    },
    tooltip: {
      pointFormat: `${t.tooltip} : <b>{point.y}</b>`,
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
        name: t.evaluated,
        color: getCssColor("evaluated-project"),
        data: data.map((item) => ({
          name: item[`name_${currentLang}` as keyof DataItem],
          y: item.total_projects_evaluated,
          rank_projects_evaluated: item.rank_projects_evaluated,
        })),
        dataLabels: [
          {
            align: "right",
            format: "{point.rank_projects_evaluated}e",
          },
        ],
      } as Highcharts.SeriesBarOptions,
      {
        type: "bar",
        name: t.successful,
        color: getCssColor("successful-project"),
        data: data.map((item) => ({
          name: item[`name_${currentLang}` as keyof DataItem],
          y: item.total_projects_successful,
          rank_projects_successful: item.rank_projects_successful,
        })),
        dataLabels: [
          {
            align: "right",
            format: "{point.rank_projects_successful}e",
          },
        ],
      } as Highcharts.SeriesBarOptions,
    ],
  };
  return CreateChartOptions("bar", newOptions);
}
