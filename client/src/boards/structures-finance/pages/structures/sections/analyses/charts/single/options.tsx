import Highcharts from "highcharts/es-modules/masters/highcharts.src.js";
import { createChartOptions } from "../../../../../../../../components/chart-wrapper/default-options";
import { createThresholdPlotBands } from "../../../../../../components/threshold/threshold-bands";
import type { ThresholdConfig } from "../../../../../../components/threshold/threshold-legend";
import { calculateOptimalTickInterval } from "../../../../../../utils/chartUtils";
import { getCssColor } from "../../../../../../../../utils/colors";
import { InstitutionSeries } from "..";

interface MetricConfig {
  label: string;
  format: "number" | "percent" | "decimal" | "euro";
  color: string;
}

const PREDECESSOR_SCALE = ["scale-1-color", "scale-2-color", "scale-4-color", "scale-5-color", "scale-6-color"];
const PREDECESSOR_DASH: Highcharts.DashStyleValue[] = ["ShortDash", "ShortDot", "Dash", "Dot", "LongDash"];

const formatValue = (value: number, format: MetricConfig["format"]): string => {
  if (format === "euro") return `${Highcharts.numberFormat(value, 0, ",", " ")} €`;
  if (format === "percent") return `${value.toFixed(2)}%`;
  if (format === "decimal") return value.toFixed(2);
  return Highcharts.numberFormat(value, 0, ",", " ");
};

export const createSingleChartOptions = (
  seriesGroups: InstitutionSeries[],
  metricKey: string,
  metricsConfig: Record<string, MetricConfig>,
  threshold: ThresholdConfig | null,
  xAxisField: "exercice" | "exercice_fin" | "anuniv"
): Highcharts.Options => {
  const config = metricsConfig[metricKey];
  const isIPCMetric = metricKey.endsWith("_ipc");
  const refIpc = seriesGroups.flatMap(g => g.records).find(r => r.ref_ipc)?.ref_ipc ?? null;
  const thresholdConfig = threshold ? createThresholdPlotBands(threshold) : { plotBands: [], plotLines: [] };

  const allCats = new Set<string>();
  seriesGroups.forEach(group =>
    group.records.forEach(item => {
      if (item[metricKey] != null && item[metricKey] !== 0)
        allCats.add(String(item[xAxisField]));
    })
  );
  const categories = Array.from(allCats).sort((a, b) => parseInt(a) - parseInt(b));

  let dataMin = Infinity, dataMax = -Infinity;
  seriesGroups.forEach(group =>
    group.records.forEach(item => {
      const v = Number(item[metricKey]);
      if (!isNaN(v)) { dataMin = Math.min(dataMin, v); dataMax = Math.max(dataMax, v); }
    })
  );
  const tickInterval = calculateOptimalTickInterval(dataMin, dataMax, config.format);
  const hasMultiple = seriesGroups.length > 1;

  let predecessorIndex = 0;
  const series = seriesGroups.map(group => {
    let name = group.label;
    if (isIPCMetric && refIpc) name = `${name} (IPC ${refIpc})`;

    const color = group.isCurrent
      ? (isIPCMetric ? getCssColor("blue-france-main-525") : getCssColor("scale-3-color"))
      : getCssColor(PREDECESSOR_SCALE[predecessorIndex % PREDECESSOR_SCALE.length]);

    const dashStyle: Highcharts.DashStyleValue = group.isCurrent
      ? "Solid"
      : PREDECESSOR_DASH[predecessorIndex % PREDECESSOR_DASH.length];

    if (!group.isCurrent) predecessorIndex++;

    return {
      name,
      type: "line" as const,
      color,
      dashStyle,
      lineWidth: 2,
      marker: { enabled: true, radius: group.isCurrent ? 4 : 3, symbol: group.isCurrent ? "circle" : "diamond" as any },
      data: categories.map(cat => {
        const item = group.records.find(r => String(r[xAxisField]) === cat);
        if (!item) return null;
        const v = Number(item[metricKey]);
        return isNaN(v) || v === 0 ? null : v;
      }),
    };
  });

  return createChartOptions("line", {
    chart: { height: 500 },
    xAxis: {
      categories,
      title: { text: xAxisField === "anuniv" ? "Année universitaire" : "Exercice" },
      crosshair: true,
      lineWidth: 1,
    },
    yAxis: {
      title: { text: config.label },
      tickInterval,
      labels: {
        formatter: function (this: any) {
          return formatValue(this.value as number, config.format);
        },
      },
      plotBands: thresholdConfig.plotBands.length > 0 ? thresholdConfig.plotBands : undefined,
      plotLines: thresholdConfig.plotLines.length > 0 ? thresholdConfig.plotLines : undefined,
    },
    legend: { enabled: hasMultiple },
    tooltip: {
      shared: true,
      useHTML: true,
      borderWidth: 1,
      borderRadius: 8,
      shadow: false,
      formatter: function () {
        const year = this.points?.[0]?.key || this.x;
        let tooltip = `<div style="padding:10px"><div style="font-weight:bold;margin-bottom:8px">${year}</div>`;
        this.points?.forEach((point: any) => {
          let valueStr = formatValue(point.y, config.format);
          if (isIPCMetric && refIpc) {
            valueStr += `<br/><span style="font-size:11px">base ${refIpc}</span>`;
          }
          tooltip += `<div style="margin-top:4px"><span style="color:${point.series.color}">●</span> <strong>${point.series.name}:</strong> ${valueStr}</div>`;
        });
        if (threshold) {
          const value = this.points?.[0]?.y;
          if (value != null) {
            const isAlert = threshold.ale_sens === "sup"
              ? value >= (threshold.ale_val ?? Infinity)
              : value <= (threshold.ale_val ?? -Infinity);
            const isVigilance = threshold.vig_min != null && threshold.vig_max != null
              && value >= threshold.vig_min && value <= threshold.vig_max;
            if (isAlert) tooltip += `<div style="margin-top:8px;padding-top:8px;border-top:1px solid #ddd;color:${getCssColor("threshold-alert-line")}"><strong>⚠ Zone d'alerte</strong></div>`;
            else if (isVigilance) tooltip += `<div style="margin-top:8px;padding-top:8px;border-top:1px solid #ddd;color:${getCssColor("threshold-vigilance-line")}"><strong>⚠ Zone de vigilance</strong></div>`;
          }
        }
        return tooltip + "</div>";
      },
    },
    plotOptions: {
      line: { lineWidth: 2 },
    },
    series: series as any,
  });
};

