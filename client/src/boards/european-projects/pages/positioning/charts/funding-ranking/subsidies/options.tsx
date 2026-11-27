import type Highcharts from "highcharts/es-modules/masters/highcharts.src.js";


import { getI18nLabel, getResponsiveChartHeight } from "../../../../../../../utils";
import { getCssColor } from "../../../../../../../utils/colors";
import { formatToMillionsLang } from "../../../../../../../utils/format";
import { CreateChartOptions } from "../../../../../components/chart-ep";
import i18n from "./i18n.json";

export default function Options(data, currentLang) {
  if (!data) return null;

  const label = (key: string) => getI18nLabel(i18n, key, currentLang);

  const newOptions: Highcharts.Options = {
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
          text: "Euros (M€)",
        },
      },
    ],
    plotOptions: {
      series: {
        dataLabels: { 
          enabled: true, 
          style: {
            textOutline: "none",
          },
        },
      },
      bar: {
        groupPadding: 0.2,
        pointPadding: 0.1,
        borderWidth: 0,
        shadow: false,
      },
    },
    series: [
      {
        type: "bar",
        name: label("evaluated-funding"),
        color: getCssColor("evaluated-project"),
        data: data.map((item) => ({
          label: formatToMillionsLang(item.total_evaluated, currentLang, 1),
          name: item[`name_${currentLang}`],
          rank_evaluated: item.rank_evaluated,
          y: item.total_evaluated,
        })),
        dataLabels: [
          {
            align: "right",
            inside: true,
            format: "{point.rank_evaluated}e",
            style: { textOutline: "none" },
          },
        ],
        tooltip: {
          pointFormat: `${label("evaluated-funding")}: <b>{point.label}</b>`,
        },
      },
      {
        type: "bar",
        name: label("successful-funding"),
        color: getCssColor("successful-project"),
        data: data.map((item) => ({
          label: formatToMillionsLang(item.total_successful, currentLang, 1),
          name: item[`name_${currentLang}`],
          rank_successful: item.rank_successful,
          y: item.total_successful,
        })),
        dataLabels: [
          {
            align: "right",
            inside: true,
            format: "{point.rank_successful}e",
            style: { textOutline: "none" },
          },
        ],
        tooltip: {
          pointFormat: `${label("successful-funding")}: <b>{point.label}</b>`,
        },
      },
    ],
  };

  return CreateChartOptions("bar", newOptions);
}
