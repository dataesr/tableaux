import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";
import { CreateChartOptions } from "../../../../components/chart-ep";
import type { ProcessedEvolutionData } from "./utils";

interface OptionsParams {
  processedData: ProcessedEvolutionData;
  chartType: "weight" | "successRate";
}

export default function Options({ processedData, chartType }: OptionsParams): HighchartsInstance.Options | null {
  if (!processedData || processedData.years.length === 0) return null;

  const series = chartType === "weight" ? processedData.weightSeries : processedData.successRateSeries;

  const yAxisLabel = chartType === "weight" ? "%" : "%";

  const highchartsSeries: HighchartsInstance.SeriesOptionsType[] = series.map((s) => ({
    type: "line" as const,
    name: s.name,
    color: s.color,
    data: s.data,
    marker: {
      enabled: true,
      radius: 4,
    },
    dataLabels: {
      enabled: true,
      format: "{y}%",
      style: {
        fontSize: "10px",
        fontWeight: "normal",
      },
      y: -8,
    },
    connectNulls: false,
  }));

  const newOptions: HighchartsInstance.Options = {
    xAxis: {
      categories: processedData.years,
      title: {
        text: "",
      },
      labels: {
        style: {
          fontSize: "12px",
        },
      },
    },
    yAxis: {
      title: {
        text: "",
      },
      labels: {
        format: `{value}${yAxisLabel}`,
        style: {
          fontSize: "12px",
        },
      },
      min: 0,
      gridLineWidth: 0.5,
      gridLineColor: "#e0e0e0",
    },
    tooltip: {
      shared: true,
      useHTML: true,
      headerFormat: "<b>{point.key}</b><br/>",
      pointFormat: '<span style="color:{series.color}">\u25CF</span> {series.name}: <b>{point.y}%</b><br/>',
    },
    legend: {
      enabled: true,
      layout: "horizontal",
      align: "center",
      verticalAlign: "bottom",
      itemStyle: {
        fontSize: "11px",
      },
    },
    plotOptions: {
      line: {
        lineWidth: 2,
        states: {
          hover: {
            lineWidth: 3,
          },
        },
      },
    },
    series: highchartsSeries,
  };

  return CreateChartOptions("line", newOptions);
}
