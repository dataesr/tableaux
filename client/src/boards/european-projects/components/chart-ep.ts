import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";

import { deepMerge } from "../../../utils";

const TEXT_COLOR = "var(--text-default-grey)";
const GRID_COLOR = "var(--border-default-grey)";

export function CreateChartOptions(type: NonNullable<HighchartsInstance.Options["chart"]>["type"], options: NonNullable<HighchartsInstance.Options>) {
  const rootStyles = getComputedStyle(document.documentElement);

  const defaultOptions: HighchartsInstance.Options = {
    chart: {
      backgroundColor: "var(--background-default-grey)",
    },
    title: { text: "" },
    legend: {
      enabled: true,
      itemStyle: { color: TEXT_COLOR },
      itemHoverStyle: { color: TEXT_COLOR },
    },
    plotOptions: { column: { borderWidth: 0 } },
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

  const axisDefaults = {
    gridLineColor: GRID_COLOR,
    labels: { style: { color: TEXT_COLOR } },
  };
  const styleYAxis = (axis) => {
    const merged = deepMerge(deepMerge({}, axisDefaults), axis);
    merged.title = deepMerge({ style: { color: TEXT_COLOR } }, axis.title ?? {});
    return merged;
  };
  if (options.yAxis) {
    options = {
      ...options,
      yAxis: Array.isArray(options.yAxis) ? options.yAxis.map(styleYAxis) : styleYAxis(options.yAxis),
    };
  } else {
    defaultOptions.yAxis = deepMerge({}, axisDefaults);
  }

  const chartOptions = deepMerge(defaultOptions, options);

  return chartOptions;
}
