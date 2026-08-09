import Highcharts from "highcharts/es-modules/masters/highcharts.src.js";
import { createChartOptions } from "../../../../../../../../components/chart-wrapper/default-options";
import { createThresholdPlotBands } from "../../../../../../components/threshold/threshold-bands";
import type { ThresholdConfig } from "../../../../../../components/threshold/threshold-legend";
import { calculateOptimalTickInterval } from "../../../../../../utils/chartUtils";
import {
  deduplicateByPaysageId,
  type MetricConfig,
} from "../../../../../../utils/utils";
import type { MetricSens } from "../../../../../../components/metric-sort";
import { getCssColor } from "../../../../../../../../utils/colors";

export interface PositioningComparisonBarConfig {
  metric: string;
  metricLabel: string;
  metricConfig: MetricConfig;
  threshold?: ThresholdConfig | null;
  sens?: MetricSens;
}

export const createPositioningComparisonBarOptions = (
  config: PositioningComparisonBarConfig,
  data: any[],
  currentStructureId?: string,
  currentStructureName?: string
): Highcharts.Options => {
  const uniqueData = deduplicateByPaysageId(data);

  const unsortedData = uniqueData.map((item: any) => {
    const itemId = item.etablissement_id_paysage_actuel;
    const isCurrentStructure =
      currentStructureId && itemId === currentStructureId;

    return {
      name:
        item.etablissement_actuel_lib || item.etablissement_lib || "Sans nom",
      value: item[config.metric] || 0,
      isCurrentStructure,
    };
  });

  // - "augmentation" → ascendant (le plus bas = meilleur, ex: charges/produits)
  // - "diminution" ou null → descendant (le plus haut = meilleur)
  const chartData = [...unsortedData].sort((a, b) =>
    config.sens === "augmentation" ? a.value - b.value : b.value - a.value
  );

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

  const chartHeight = Math.max(500, chartData.length * 25);

  return createChartOptions("bar", {
    chart: {
      height: chartHeight,
    },
    title: {
      text: "",
    },
    accessibility: {
      description: `Graphique en barres comparant ${config.metricLabel} pour ${chartData.length} établissements. ${currentStructureName || "L'établissement sélectionné"} est mis en évidence.`,
    },
    xAxis: {
      categories: chartData.map((d) => d.name),
      labels: {
        formatter: function () {
          const index = this.pos;
          const item = chartData[index];
          if (item?.isCurrentStructure) {
            return `◆ ${this.value}`;
          }
          return `${this.value}`;
        },
      },
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
          <div class="fr-p-2w" >
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
        data: chartData.map((d) => ({
          y: d.value,
          color: d.isCurrentStructure
            ? `${getCssColor("scale-1")}`
            : `${getCssColor("scale-8")}`,
        })),
      },
    ],
  });
};
