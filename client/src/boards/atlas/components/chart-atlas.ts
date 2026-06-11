import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";

import { deepMerge } from "../../../utils";

export function CreateChartOptions(type: NonNullable<HighchartsInstance.Options["chart"]>["type"], options: NonNullable<HighchartsInstance.Options>) {
  const rootStyles = getComputedStyle(document.documentElement);

  const defaultOptions: HighchartsInstance.Options = {
    chart: {
      backgroundColor: "var(--background-default-grey)",
    },
    title: { text: "" },
    legend: { enabled: false },
    exporting: { enabled: false },
    credits: { enabled: false },
    accessibility: { enabled: true },
  };

  if (Array.isArray(options.xAxis) && options.xAxis.length > 0) {
    defaultOptions.xAxis = options.xAxis.map((axis) => {
      return {
        ...axis,
        labels: {
          autoRotation: [-45, -90],
          style: {
            fontSize: "13px",
            fontFamily: "Marianne, sans-serif",
            color: rootStyles.getPropertyValue("--label-color"),
          },
        },
      };
    });
  } else {
    defaultOptions.xAxis = {
      labels: {
        autoRotation: [-45, -90],
        style: {
          fontSize: "13px",
          fontFamily: "Marianne, sans-serif",
          color: rootStyles.getPropertyValue("--label-color"),
        },
      },
    };
  }

  if (type !== "empty") {
    if (defaultOptions.chart) {
      defaultOptions.chart.type = type;
    }
  }

  const chartOptions = deepMerge(defaultOptions, options);

  return chartOptions;
}
