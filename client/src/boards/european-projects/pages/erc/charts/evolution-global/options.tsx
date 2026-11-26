import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";
import { CreateChartOptions } from "../../../../components/chart-ep";
import { DESTINATION_LABELS, formatRatio } from "./utils";
import type { EvolutionData, EvolutionItem, EvolutionMetric, EvolutionRatio } from "./query";
import { getCssColor } from "../../../../../../utils/colors";

interface ProcessedEvolutionData {
  years: string[];
  weightSeries: { name: string; color: string; data: (EvolutionRatio | null)[] }[];
  successRateSeries: { name: string; color: string; data: (EvolutionRatio | null)[] }[];
}

export function processEvolutionData(data: EvolutionData, currentLang: string, metric: EvolutionMetric): ProcessedEvolutionData {
  const field = { funding: "total_funding_project", pi: "total_pi", projects: "total_projects" } as const;
  const successful = [...data.country.successful, ...data.total.successful];
  const years = [...new Set(successful.map((item) => item.call_year))].sort();
  const destinations = [...new Set(successful.map((item) => item.destination_code))].sort();
  const key = (item: EvolutionItem) => `${item.call_year}-${item.destination_code}`;
  const toMap = (items: EvolutionItem[]) => new Map(items.map((item) => [key(item), item]));
  const country = toMap(data.country.successful);
  const evaluated = toMap(data.country.evaluated);
  const total = toMap(data.total.successful);
  const ratio = (numerator?: EvolutionItem, denominator?: EvolutionItem): EvolutionRatio | null => {
    if (!numerator || !denominator) return null;
    const n = numerator[field[metric]];
    const d = denominator[field[metric]];
    if (n == null || d == null || d === 0) return null;
    return { value: Math.round((n / d) * 1000) / 10, numerator: n, denominator: d };
  };
  const mapSeries = (denominator: Map<string, EvolutionItem>) => destinations.map((destination) => ({
    name: DESTINATION_LABELS[destination]?.[currentLang] || destination,
    color: getCssColor(`erc-destination-${destination.toLowerCase()}-color`),
    data: years.map((year) => {
      const itemKey = `${year}-${destination}`;
      return ratio(country.get(itemKey), denominator.get(itemKey));
    }),
  }));
  return { years, weightSeries: mapSeries(total), successRateSeries: mapSeries(evaluated) };
}

interface OptionsParams {
  processedData: ProcessedEvolutionData;
  chartType: "weight" | "successRate";
  metric: EvolutionMetric;
  currentLang: string;
}

export default function Options({ processedData, chartType, metric, currentLang }: OptionsParams): HighchartsInstance.Options | null {
  if (!processedData || processedData.years.length === 0) return null;

  const series = chartType === "weight" ? processedData.weightSeries : processedData.successRateSeries;

  const yAxisLabel = chartType === "weight" ? "%" : "%";

  const highchartsSeries: HighchartsInstance.SeriesOptionsType[] = series.map((s) => ({
    type: "line" as const,
    name: s.name,
    color: s.color,
    data: s.data.map((point) => point ? { y: point.value, custom: { ratio: formatRatio(point, metric, currentLang) } } : null),
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
      pointFormat: '<span style="color:{series.color}">\u25CF</span> {series.name}: <b>{point.custom.ratio}</b><br/>',
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
