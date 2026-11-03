import { createChartOptions } from "../../../../../../../../components/chart-wrapper/default-options";
import { getCssColor } from "../../../../../../../../utils/colors";
import {
  sortByMetricSens,
  type MetricSens,
} from "../../../../../../components/metric-sort";
import { createThresholdPlotBands } from "../../../../../../components/threshold/threshold-bands";
import type { ThresholdConfig } from "../../../../../../components/threshold/threshold-legend";
import { formatMetricValue } from "../../../../../../utils/utils";

export interface OverviewDataset {
  data: any[];
  label: string;
}

export interface ComparisonOverviewConfig {
  metric: string;
  metricLabel: string;
  format: "number" | "percent" | "decimal" | "euro";
  threshold?: ThresholdConfig | null;
  sens?: MetricSens;
  metricConfig: { year: string };
}

const SERIES_COLORS = [
  () => getCssColor("scale-2"),
  () => getCssColor("scale-7"),
  () => getCssColor("scale-8"),
  () => getCssColor("scale-10"),
];

export const createComparisonOverviewOptions = (
  config: ComparisonOverviewConfig,
  datasets: OverviewDataset[],
  currentStructureId?: string,
  currentStructureName?: string
): Highcharts.Options => {
  const series: (Highcharts.SeriesOptionsType | Highcharts.UnknownSeriesOptions)[] = [];

  let dataMin = Infinity;
  let dataMax = -Infinity;
  datasets.forEach((ds) => {
    ds.data.forEach((item) => {
      const value = item[config.metric];
      if (value != null && !isNaN(value)) {
        dataMin = Math.min(dataMin, value);
        dataMax = Math.max(dataMax, value);
      }
    });
  });

  const thresholdConfig = config.threshold
    ? createThresholdPlotBands(config.threshold)
    : { plotBands: [], plotLines: [] };

  datasets.forEach((ds, dsIndex) => {
    const seen = new Set<string>();
    const unique: { value: number; id: string; name: string }[] = [];
    ds.data.forEach((item) => {
      const id = item.etablissement_id_paysage_actuel;
      const value = item[config.metric];
      if (!id || seen.has(id) || value == null || isNaN(value)) return;
      seen.add(id);
      const name =
        item.etablissement_actuel_lib || item.etablissement_lib || "Sans nom";
      unique.push({ value, id, name });
    });

    if (!unique.length) return;

    const sorted = sortByMetricSens(unique, config.sens ?? null);
    const total = sorted.length;
    const color = SERIES_COLORS[dsIndex]();

    const isAugmentation = config.sens === "augmentation";
    const lineData = sorted.map((d, i) => {
      const pct = total > 1 ? (i / (total - 1)) * 100 : 50;
      return {
        x: d.value,
        y: isAugmentation ? pct : 100 - pct,
        custom: {
          name: d.name,
          id: d.id,
          rank: i + 1,
          total,
          value: d.value,
          filterLabel: ds.label,
        },
      };
    });

    const rankIdx = sorted.findIndex((d) => d.id === currentStructureId);

    series.push({
      type: "spline" as const,
      name: ds.label,
      color,
      data: lineData,
      marker: {
        enabled: true,
        radius: 2,
        symbol: "circle",
        states: { hover: { enabled: true, radius: 5 } },
      },
      lineWidth: 2.5,
    });

    if (rankIdx !== -1) {
      const val = sorted[rankIdx].value;
      const rawPct = total > 1 ? (rankIdx / (total - 1)) * 100 : 50;
      const pct = isAugmentation ? rawPct : 100 - rawPct;
      series.push({
        type: "scatter" as const,
        name: `${ds.label} — position`,
        linkedTo: ":previous",
        color,
        data: [
          {
            x: val,
            y: pct,
            custom: {
              name: sorted[rankIdx].name,
              id: sorted[rankIdx].id,
              rank: rankIdx + 1,
              total,
              value: val,
              filterLabel: ds.label,
            },
          } as any,
        ],
        marker: {
          symbol: "diamond",
          radius: 8,
          lineWidth: 2,
          lineColor: "#000",
        },
        zIndex: 5,
      });
    }
  });

  return createChartOptions("spline", {
    chart: { height: 420, backgroundColor: "transparent" },
    xAxis: {
      title: { text: config.metricLabel },
      labels: {
        formatter: function () {
          return formatMetricValue(this.value as number, config.format);
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
    yAxis: {
      title: { text: "" },
      min: 0,
      max: 100,
      tickInterval: 25,
      labels: {
        formatter: function () {
          const value = this.value as number;
          const labels: { [key: number]: string } = {
            0: "Minimum",
            25: "1er quartile",
            50: "Médiane",
            75: "3ème quartile",
            100: "Maximum",
          };
          return labels[value] || `${value}%`;
        },
      },
    },
    tooltip: {
      useHTML: true,
      shared: false,
      formatter: function () {
        const p = this as any;
        const custom = p.point?.custom;
        if (!custom) return false;
        const isCurrentStructure = custom.id === currentStructureId;
        const name = isCurrentStructure
          ? currentStructureName || "Mon établissement"
          : custom.name;
        const highlight = isCurrentStructure
          ? 'style="font-weight:bold;color:var(--text-action-high-blue-france);margin-bottom:6px"'
          : 'style="font-weight:bold;margin-bottom:6px"';
        return `
          <div style="padding:8px">
            <div ${highlight}>${name}</div>
            <div style="margin-bottom:2px">${custom.filterLabel}</div>
            <div>${config.metricLabel}: <b>${formatMetricValue(custom.value, config.format)}</b></div>
            <div>Rang: <b>${custom.rank}<sup>e</sup> / ${custom.total}</b></div>
          </div>`;
      },
    },

    legend: {
      enabled: true,
      layout: "horizontal",
      align: "center",
      verticalAlign: "bottom",
    },
    plotOptions: {
      spline: {
        states: { inactive: { opacity: 0.3 } },
        point: { events: {} },
      },
    },
    series,
  });
};
