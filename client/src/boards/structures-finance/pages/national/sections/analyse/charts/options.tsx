import Highcharts from "highcharts/es-modules/masters/highcharts.src.js";
import { createChartOptions } from "../../../../../../../components/chart-wrapper/default-options";
import { getCssColor } from "../../../../../../../utils/colors";
import { createThresholdPlotBands } from "../../../../../components/threshold/threshold-bands";
import type { ThresholdConfig } from "../../../../../components/threshold/threshold-legend";
import { calculateOptimalTickInterval } from "../../../../../utils/chartUtils";

interface MetricConfig {
  label: string;
  format: "number" | "percent" | "decimal" | "euro";
  color: string;
  suffix?: string;
}

export interface ComparisonBarConfig {
  metric: string;
  metricLabel: string;
  metricConfig: MetricConfig;
  topN: number;
  threshold?: ThresholdConfig | null;
}

export const createComparisonBarOptions = (
  config: ComparisonBarConfig,
  data: any[]
): Highcharts.Options => {
  const chartData = data
    .filter((item: any) => {
      const value = item[config.metric];
      return value != null && !isNaN(value);
    })
    .map((item: any) => ({
      name:
        item.etablissement_actuel_lib || item.etablissement_lib || "Sans nom",
      value: item[config.metric],
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, config.topN);

  let dataMin = Infinity;
  let dataMax = -Infinity;
  chartData.forEach((item) => {
    const value = item.value;
    if (!isNaN(value)) {
      dataMin = Math.min(dataMin, value);
      dataMax = Math.max(dataMax, value);
    }
  });

  const thresholdConfig = config.threshold
    ? createThresholdPlotBands(config.threshold)
    : { plotBands: [], plotLines: [] };

  const tickInterval = calculateOptimalTickInterval(
    dataMin,
    dataMax,
    config.metricConfig.format
  );

  return createChartOptions("bar", {
    chart: {
      height: Math.max(400, chartData.length * 25 + 100),
    },
    title: {
      text: "",
    },
    accessibility: {
      description: `Graphique en barres comparant ${config.metricLabel} pour ${chartData.length} établissements`,
    },
    xAxis: {
      categories: chartData.map((d) => d.name),
      gridLineWidth: 0,
    },
    yAxis: {
      title: {
        text: "",
      },
      tickInterval: tickInterval,
      labels: {
        formatter: function () {
          const value = this.value as number;
          if (config.metricConfig.format === "euro") {
            return `${Highcharts.numberFormat(value, 0, ",", " ")} €`;
          }
          if (config.metricConfig.format === "percent") {
            return `${value.toFixed(1)}%`;
          }
          if (config.metricConfig.format === "decimal") {
            return value.toFixed(2);
          }
          return Highcharts.numberFormat(value, 0, ",", " ");
        },
      },
      plotBands:
        thresholdConfig.plotBands.length > 0
          ? thresholdConfig.plotBands
          : undefined,
      plotLines:
        thresholdConfig.plotLines.length > 0
          ? thresholdConfig.plotLines
          : undefined,
    },
    tooltip: {
      useHTML: true,
      borderWidth: 1,
      borderRadius: 8,
      shadow: false,
      formatter: function () {
        const point = this as any;
        const value = point.y as number;
        let formatted: string;
        if (config.metricConfig.format === "euro") {
          formatted = `${Highcharts.numberFormat(value, 0, ",", " ")} €`;
        } else if (config.metricConfig.format === "percent") {
          formatted = `${value.toFixed(2)}%`;
        } else if (config.metricConfig.format === "decimal") {
          formatted = value.toFixed(2);
        } else {
          formatted = Highcharts.numberFormat(value, 0, ",", " ");
        }

        return `
          <div class="fr-p-2w">
            <div class="fr-text--bold fr-mb-1v">
              ${point.category}
            </div>
            <div class="fr-mt-1w">
              <strong>${config.metricLabel}:</strong> ${formatted}
            </div>
          </div>
        `;
      },
    },
    plotOptions: {
      bar: {
        dataLabels: {
          enabled: false,
        },
        color: getCssColor("scale-5-color"),
        borderRadius: 4,
      },
    },
    legend: {
      enabled: false,
    },
    series: [
      {
        type: "bar",
        name: config.metricLabel,
        data: chartData.map((d) => d.value),
      },
    ],
  });
};
