import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";

import { CreateChartOptions } from "../../../../components/chart-ep";
import i18n from "./i18n.json";
const rootStyles = getComputedStyle(document.documentElement);

export default function Options(data, currentLang, nbToShow = 10) {
  if (!data) return null;

  function getI18nLabel(key) {
    return i18n[key][currentLang];
  }

  const newOptions: HighchartsInstance.Options = {
    chart: {
      borderWidth: 1,
      borderColor: "var(--border-default-grey)",
    },
    tooltip: {
      pointFormat: "<b>{point.y}</b>",
    },
    plotOptions: {
      packedbubble: {
        minSize: "30%",
        maxSize: "150%",
        layoutAlgorithm: {
          splitSeries: false,
          gravitationalConstant: 0.02,
        },
        dataLabels: {
          enabled: true,
          format: "{point.name}",
          // filter: {
          //   property: "y",
          //   operator: ">",
          //   value: 250,
          // },
          style: {
            color: "black",
            textOutline: "none",
            fontWeight: "normal",
          },
        },
      },
    },
    series: [
      {
        type: "packedbubble",
        name: getI18nLabel("number-of-common-projects"),
        data: data.slice(0, nbToShow).map((item) => ({
          name: item[`country_name_${currentLang}`],
          value: item.total_collaborations,
          color: rootStyles.getPropertyValue("--collaboration-color"),
        })),
      },
    ],
  };

  return CreateChartOptions("packedbubble", newOptions);
}
