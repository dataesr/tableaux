import Highcharts from "highcharts/es-modules/masters/highcharts.src.js";
import { createChartOptions } from "../../../../../../../../components/chart-wrapper/default-options";
import { calculateOptimalTickInterval } from "../../../../../../utils/chartUtils";
import { getCssColor } from "../../../../../../../../utils/colors";
import { InstitutionSeries } from "..";

interface MetricConfig {
  label: string;
  format: "number" | "percent" | "decimal" | "euro";
  color: string;
}

const INSTITUTION_DASH: Highcharts.DashStyleValue[] = ["ShortDash", "ShortDot", "Dash", "Dot", "LongDash"];
const PREDECESSOR_SCALE = ["scale-1-color", "scale-2-color", "scale-4-color", "scale-5-color", "scale-6-color"];

const formatValue = (value: number, format: MetricConfig["format"]): string => {
  if (format === "euro") return `${Highcharts.numberFormat(value, 0, ",", " ")} €`;
  if (format === "percent") return `${value.toFixed(2)}%`;
  if (format === "decimal") return value.toFixed(2);
  return Highcharts.numberFormat(value, 0, ",", " ");
};

export const createDualChartOptions = (
  seriesGroups: InstitutionSeries[],
  metric1Key: string,
  metric2Key: string,
  metricsConfig: Record<string, MetricConfig>,
  xAxisField: "exercice" | "exercice_fin" | "anuniv"
): Highcharts.Options => {
  const config1 = metricsConfig[metric1Key];
  const config2 = metricsConfig[metric2Key];
  const useSameAxis = config1.format === config2.format;

  const allCats = new Set<string>();
  seriesGroups.forEach(group =>
    group.records.forEach(item => {
      if ((item[metric1Key] != null && item[metric1Key] !== 0) ||
        (item[metric2Key] != null && item[metric2Key] !== 0))
        allCats.add(String(item[xAxisField]));
    })
  );
  const categories = Array.from(allCats).sort((a, b) => parseInt(a) - parseInt(b));

  let data1Min = Infinity, data1Max = -Infinity;
  let data2Min = Infinity, data2Max = -Infinity;
  seriesGroups.forEach(group => group.records.forEach(item => {
    const v1 = Number(item[metric1Key]);
    const v2 = Number(item[metric2Key]);
    if (!isNaN(v1)) { data1Min = Math.min(data1Min, v1); data1Max = Math.max(data1Max, v1); }
    if (!isNaN(v2)) { data2Min = Math.min(data2Min, v2); data2Max = Math.max(data2Max, v2); }
  }));

  const tickInterval1 = calculateOptimalTickInterval(data1Min, data1Max, config1.format);
  const tickInterval2 = calculateOptimalTickInterval(data2Min, data2Max, config2.format);

  const refIpc = seriesGroups.flatMap(g => g.records).find(r => r.ref_ipc)?.ref_ipc ?? null;
  const hasMultiple = seriesGroups.length > 1;

  let predecessorIndex = 0;
  const series = seriesGroups.flatMap(group => {
    const isMetric2IPC = metric2Key.endsWith("_ipc");
    const isCurrent = group.isCurrent;

    const color1 = isCurrent ? config1.color : getCssColor(PREDECESSOR_SCALE[predecessorIndex % PREDECESSOR_SCALE.length]);
    const color2 = isCurrent
      ? (isMetric2IPC ? getCssColor("blue-france-main-525") : config2.color)
      : getCssColor(PREDECESSOR_SCALE[predecessorIndex % PREDECESSOR_SCALE.length]);
    const dash1: Highcharts.DashStyleValue = isCurrent ? "Solid" : INSTITUTION_DASH[predecessorIndex % INSTITUTION_DASH.length];
    const dash2: Highcharts.DashStyleValue = isCurrent ? "ShortDash" : INSTITUTION_DASH[predecessorIndex % INSTITUTION_DASH.length];
    const suffix = hasMultiple ? ` — ${group.label}` : "";

    if (!isCurrent) predecessorIndex++;

    const makeData = (metricKey: string) =>
      categories.map(cat => {
        const item = group.records.find(r => String(r[xAxisField]) === cat);
        if (!item) return null;
        const v = Number(item[metricKey]);
        return isNaN(v) ? null : v;
      });

    let name1 = `${config1.label}${suffix}`;
    let name2 = config2.label + (isMetric2IPC && refIpc ? ` (IPC ${refIpc})` : "") + suffix;

    return [
      { name: name1, type: "line" as const, color: color1, dashStyle: dash1, yAxis: 0, lineWidth: 2, marker: { enabled: true, radius: 4, symbol: "circle" as any }, data: makeData(metric1Key) },
      { name: name2, type: "line" as const, color: color2, dashStyle: dash2, yAxis: useSameAxis ? 0 : 1, lineWidth: 2, marker: { enabled: true, radius: isMetric2IPC ? 5 : 4, symbol: isMetric2IPC ? "square" : "diamond" as any }, data: makeData(metric2Key) },
    ];
  });

  const makeAxisLabels = (format: MetricConfig["format"]) => ({
    formatter: function (this: any) { return formatValue(this.value as number, format); },
  });

  const yAxisConfig = useSameAxis
    ? { title: { text: `${config1.label} / ${config2.label}` }, tickInterval: tickInterval1, labels: makeAxisLabels(config1.format) }
    : [
      { title: { text: config1.label }, tickInterval: tickInterval1, labels: makeAxisLabels(config1.format) },
      { title: { text: config2.label }, opposite: true, tickInterval: tickInterval2, labels: makeAxisLabels(config2.format), gridLineColor: "transparent" },
    ];

  return createChartOptions("line", {
    chart: { height: 500 },
    xAxis: {
      categories,
      title: { text: xAxisField === "anuniv" ? "Année universitaire" : "Exercice" },
      crosshair: true,
      lineWidth: 1,
    },
    yAxis: yAxisConfig as any,
    tooltip: {
      shared: true,
      useHTML: true,
      borderWidth: 1,
      borderRadius: 8,
      shadow: false,
      formatter: function () {
        const year = this.points?.[0]?.key || this.x;
        let tooltip = `<div style="padding:10px"><div style="font-weight:bold;margin-bottom:8px">${year}</div>`;
        const points = this.points || [];
        if (hasMultiple) {
          for (let i = 0; i < points.length; i += 2) {
            const p1 = points[i];
            const p2 = points[i + 1];
            if (!p1) continue;
            const instLabel = seriesGroups[Math.floor(i / 2)]?.label ?? "";
            const instColor = String(p1.series.color);
            tooltip += `<div style="margin-top:8px;padding-left:6px;border-left:3px solid ${instColor}"><strong>${instLabel}</strong></div>`;
            if (p1.y != null) tooltip += `<div style="padding-left:12px;margin-top:2px">${config1.label} : <strong>${formatValue(p1.y, config1.format)}</strong></div>`;
            if (p2?.y != null) tooltip += `<div style="padding-left:12px;margin-top:2px">${config2.label} : <strong>${formatValue(p2.y, config2.format)}</strong></div>`;
          }
        } else {
          points.forEach((point: any, i: number) => {
            const fmt = i % 2 === 0 ? config1.format : config2.format;
            tooltip += `<div style="margin-top:4px"><span style="color:${point.series.color}">●</span> <strong>${point.series.name}:</strong> ${formatValue(point.y, fmt)}</div>`;
          });
        }
        return tooltip + "</div>";
      },
    },
    legend: { enabled: true, align: "center", verticalAlign: "bottom" },
    plotOptions: { line: { lineWidth: 2 } },
    series: series as any,
  });
};
