import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";

import { CreateChartOptions } from "../../../../components/chart-ep";
import { formatToMillions } from "../../../../../../utils/format";
import { getCssColor } from "../../../../../../utils/colors";
import { getI18nLabel } from "../../../../../../utils";
import i18n from "./i18n.json";

export default function Options(data, country_code, currentLang) {
  if (!data) return null;

  const label = (key: string) => getI18nLabel(i18n, key, currentLang);

  const newOptions: HighchartsInstance.Options = {
    xAxis: {
      type: "category",
    },
    legend: {
      enabled: true,
    },
    yAxis: [
      {
        title: {
          text: label("total-funding-eur-axis"),
        },
      },
      {
        title: {
          text: label("cumulative-weight-axis"),
        },
        opposite: true,
      },
    ],
    series: [
      {
        name: label("total-funding-eur"),
        type: "column",
        color: getCssColor("countries"),
        data: data.map((item) => ({
          name: item[`name_${currentLang}`],
          y: item.total_fund_eur,
          color: item.id == country_code ? getCssColor("selected-country") : getCssColor("countries"),
        })),
        tooltip: {
          pointFormatter: function (this: HighchartsInstance.Point) {
            return `${label("total-funding")} : <b>${formatToMillions(this.y ?? 0)}</b>`;
          },
        },
      },
      {
        name: label("weight-of-funding"),
        type: "spline",
        color: getCssColor("cumulative-weight"),
        data: data.map((item) => [item[`name_${currentLang}`], item.influence]),
        tooltip: {
          pointFormat: `${label("weight-of-funding")} : <b>{point.y:.1f} %</b>`,
        },
        yAxis: 1,
        lineWidth: 0,
        states: {
          hover: {
            lineWidthPlus: 0,
          },
        },
      },
    ],
  };

  return CreateChartOptions("empty", newOptions);
}
