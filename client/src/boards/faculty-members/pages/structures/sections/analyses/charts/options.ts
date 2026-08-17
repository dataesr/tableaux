import Highcharts from "highcharts/es-modules/masters/highcharts.src.js";
import { createChartOptions } from "../../../../../../../components/chart-wrapper/default-options";
import { getCssColor } from "../../../../../../../utils/colors";
import type { FmMetricConfig } from "../../../../../config/analyses-config";

type Records = Record<string, any>[];

const formatValue = (
  v: number,
  format: FmMetricConfig["format"],
  suffix?: string
) => {
  if (format === "percent") return `${v.toFixed(2)}${suffix || "\u00a0%"}`;
  return Highcharts.numberFormat(v, 0, ",", "\u00a0");
};

export function createFmSingleOptions(
  records: Records,
  metricKey: string,
  config: FmMetricConfig
): Highcharts.Options {
  const categories = records.map((r) => r.annee_universitaire);
  const data = records.map((r) => {
    const v = r[metricKey];
    return typeof v === "number" ? v : null;
  });

  const isPercent = config.format === "percent";

  return createChartOptions("line", {
    chart: { height: 440 },
    xAxis: {
      categories,
      title: { text: "Année universitaire" },
      crosshair: true,
    },
    yAxis: {
      title: { text: isPercent ? "%" : "Effectif" },
      labels: { format: isPercent ? "{value:.1f}\u00a0%" : "{value:,.0f}" },
      min: isPercent ? undefined : 0,
    },
    plotOptions: {
      line: {
        lineWidth: 2.5,
        marker: { enabled: true, radius: 4, symbol: "circle" },
        dataLabels: {
          enabled: true,
          format: isPercent ? "{y:.1f}\u00a0%" : "{y:,.0f}",
          style: {
            fontSize: "10px",
            fontWeight: "normal",
            textOutline: "none",
          },
        },
      },
    },
    tooltip: {
      formatter: function () {
        return `<b>${this.x}</b><br/><span style="color:${this.color}">●</span> ${config.label}: <b>${formatValue(this.y as number, config.format, config.suffix)}</b>`;
      },
    },
    legend: { enabled: false },
    series: [{ type: "line", name: config.label, data, color: config.color }],
  });
}

export function createFmVariationOptions(
  records: Records,
  metricKey: string,
  config: FmMetricConfig
): Highcharts.Options {
  const yearsFrom = records.slice(1).map((r) => r.annee_universitaire);
  const deltas = records.slice(1).map((r, i) => {
    const curr = r[metricKey];
    const prev = records[i][metricKey];
    if (typeof curr !== "number" || typeof prev !== "number") return null;
    return curr - prev;
  });

  const isPercent = config.format === "percent";
  const colors = deltas.map((d) =>
    d === null
      ? "transparent"
      : d >= 0
        ? config.color
        : getCssColor("error-main-525")
  );

  return createChartOptions("column", {
    chart: { height: 440 },
    xAxis: {
      categories: yearsFrom,
      title: { text: "Année universitaire" },
    },
    yAxis: {
      title: { text: isPercent ? "Variation (pp)" : "Variation (effectif)" },
      labels: { format: isPercent ? "{value:.1f}" : "{value:,.0f}" },
      plotLines: [
        {
          value: 0,
          color: getCssColor("border-default-grey"),
          width: 1,
          zIndex: 3,
        },
      ],
    },
    plotOptions: {
      column: {
        borderWidth: 0,
        borderRadius: 3,
        colorByPoint: true,
        dataLabels: {
          enabled: true,
          format: isPercent ? "{y:.2f}" : "{y:,.0f}",
          style: {
            fontSize: "10px",
            fontWeight: "normal",
            textOutline: "none",
          },
        },
      },
    },
    tooltip: {
      formatter: function () {
        const sign = (this.y as number) >= 0 ? "+" : "";
        return `<b>${this.x}</b><br/>${config.label}: <b>${sign}${formatValue(this.y as number, config.format, config.suffix)}</b>`;
      },
    },
    legend: { enabled: false },
    colors,
    series: [{ type: "column", name: config.label, data: deltas }],
  });
}

export function createFmStackedOptions(
  records: Records,
  metricKeys: string[],
  metricsConfig: Record<string, FmMetricConfig>,
  showPercentage: boolean
): Highcharts.Options {
  const categories = records.map((r) => r.annee_universitaire);

  const series = [...metricKeys]
    .reverse()
    .map((key) => {
      const cfg = metricsConfig[key];
      const hasData = records.some((r) => r[key] != null && r[key] !== 0);
      if (!hasData) return null;
      return {
        type: "column" as const,
        name: cfg?.label || key,
        color: cfg?.color,
        data: records.map((r) => {
          const v = r[key];
          if (showPercentage) {
            const total = metricKeys.reduce(
              (sum, k) => sum + (Number(r[k]) || 0),
              0
            );
            return total > 0 ? (Number(v) / total) * 100 : 0;
          }
          return typeof v === "number" ? v : 0;
        }),
      };
    })
    .filter(Boolean) as Highcharts.SeriesOptionsType[];

  return createChartOptions("column", {
    chart: { height: 480 },
    xAxis: {
      categories,
      title: { text: "Année universitaire" },
      crosshair: true,
    },
    yAxis: {
      title: { text: showPercentage ? "Répartition (%)" : "Effectif" },
      labels: {
        format: showPercentage ? "{value:.0f}\u00a0%" : "{value:,.0f}",
      },
      min: 0,
      max: showPercentage ? 100 : undefined,
      stackLabels: {
        enabled: !showPercentage,
        format: "{total:,.0f}",
        style: {
          fontSize: "10px",
          fontWeight: "bold",
          textOutline: "none",
          color: getCssColor("text-title-grey"),
        },
      },
    },
    plotOptions: {
      column: {
        stacking: showPercentage ? "percent" : "normal",
        borderWidth: 0,
        borderRadius: 2,
        dataLabels: {
          enabled: true,
          format: showPercentage ? "{point.percentage:.1f}\u00a0%" : "{y:,.0f}",
          style: {
            fontSize: "10px",
            fontWeight: "normal",
            textOutline: "none",
          },
          filter: {
            property: showPercentage ? "percentage" : "y",
            operator: ">",
            value: showPercentage ? 4 : 0,
          },
        },
      },
    },
    tooltip: {
      shared: true,
      headerFormat: "<b>{point.key}</b><br/>",
      pointFormat:
        '<span style="color:{series.color}">●</span> {series.name}: <b>{point.y:,.0f}</b>' +
        (showPercentage ? " ({point.percentage:.1f}\u00a0%)" : "") +
        "<br/>",
    },
    legend: {
      enabled: true,
      reversed: true,
      itemStyle: { fontSize: "11px", fontWeight: "normal" },
    },
    series,
  });
}

export function createFmStackedAreaOptions(
  records: Records,
  metricKeys: string[],
  metricsConfig: Record<string, FmMetricConfig>,
  showPercentage: boolean
): Highcharts.Options {
  const categories = records.map((r) => r.annee_universitaire);

  const series = [...metricKeys]
    .reverse()
    .map((key) => {
      const cfg = metricsConfig[key];
      const hasData = records.some((r) => r[key] != null && r[key] !== 0);
      if (!hasData) return null;
      return {
        type: "area" as const,
        name: cfg?.label || key,
        color: cfg?.color,
        fillOpacity: 0.55,
        lineWidth: 1.5,
        marker: { enabled: false, symbol: "circle" as const, radius: 3 },
        data: records.map((r) => {
          const v = r[key];
          if (showPercentage) {
            const total = metricKeys.reduce(
              (sum, k) => sum + (Number(r[k]) || 0),
              0
            );
            return total > 0 ? (Number(v) / total) * 100 : 0;
          }
          return typeof v === "number" ? v : 0;
        }),
      };
    })
    .filter(Boolean) as Highcharts.SeriesOptionsType[];

  return createChartOptions("area", {
    chart: { height: 480 },
    xAxis: {
      categories,
      title: { text: "Année universitaire" },
      crosshair: true,
    },
    yAxis: {
      title: { text: showPercentage ? "Répartition (%)" : "Effectif" },
      labels: {
        format: showPercentage ? "{value:.0f}\u00a0%" : "{value:,.0f}",
      },
      min: 0,
      max: showPercentage ? 100 : undefined,
    },
    plotOptions: {
      area: {
        stacking: showPercentage ? "percent" : "normal",
        lineWidth: 1.5,
        marker: { enabled: false },
      },
    },
    tooltip: {
      shared: true,
      headerFormat: "<b>{point.key}</b><br/>",
      pointFormat:
        '<span style="color:{series.color}">●</span> {series.name}: <b>{point.y:,.0f}</b>' +
        (showPercentage ? " ({point.percentage:.1f}\u00a0%)" : "") +
        "<br/>",
    },
    legend: {
      enabled: true,
      reversed: true,
      itemStyle: { fontSize: "11px", fontWeight: "normal" },
    },
    series,
  });
}

export function createFmBase100Options(
  records: Records,
  metricKeys: string[],
  metricsConfig: Record<string, FmMetricConfig>
): Highcharts.Options {
  const categories = records.map((r) => r.annee_universitaire);

  const DASH_STYLES: Highcharts.DashStyleValue[] = [
    "Solid",
    "ShortDash",
    "Dot",
    "LongDash",
    "ShortDot",
  ];

  const series = metricKeys.map((key, i) => {
    const cfg = metricsConfig[key];
    const values = records.map((r) =>
      typeof r[key] === "number" ? r[key] : null
    );
    const base = values.find((v) => v != null && v !== 0);
    const normalized = values.map((v) =>
      v != null && base != null ? (v / base) * 100 : null
    );
    return {
      type: "line" as const,
      name: cfg?.label || key,
      color: cfg?.color,
      dashStyle: DASH_STYLES[i % DASH_STYLES.length],
      lineWidth: 2,
      marker: { enabled: true, radius: 3 },
      data: normalized,
    };
  });

  return createChartOptions("line", {
    chart: { height: 480 },
    xAxis: {
      categories,
      title: { text: "Année universitaire" },
      crosshair: true,
    },
    yAxis: {
      title: { text: "Indice (base 100)" },
      plotLines: [
        {
          value: 100,
          color: getCssColor("border-default-grey"),
          width: 1,
          dashStyle: "ShortDash",
          zIndex: 3,
        },
      ],
    },
    plotOptions: {
      line: {
        lineWidth: 2,
        marker: { enabled: true, radius: 3 },
        dataLabels: {
          enabled: false,
        },
      },
    },
    tooltip: {
      shared: true,
      headerFormat: "<b>{point.key}</b><br/>",
      pointFormat:
        '<span style="color:{series.color}">●</span> {series.name}: <b>{point.y:.1f}</b><br/>',
    },
    legend: {
      enabled: true,
      itemStyle: { fontSize: "11px", fontWeight: "normal" },
    },
    series,
  });
}

const AGE_CATEGORIES = ["≤ 35 ans", "36 – 55 ans", "≥ 56 ans"];
const AGE_H_KEYS = ["age_35_moins_h", "age_36_55_h", "age_56_plus_h"];
const AGE_F_KEYS = ["age_35_moins_f", "age_36_55_f", "age_56_plus_f"];

export function createFmPyramidOptions(
  record: Record<string, any>
): Highcharts.Options {
  const hommesData = AGE_H_KEYS.map((k) => -(record[k] || 0));
  const femmesData = AGE_F_KEYS.map((k) => record[k] || 0);

  const maxVal = Math.max(
    ...AGE_H_KEYS.map((k) => record[k] || 0),
    ...AGE_F_KEYS.map((k) => record[k] || 0)
  );
  const axisMax = Math.ceil(maxVal * 1.15);

  return createChartOptions("bar", {
    chart: { height: 360 },
    xAxis: {
      categories: AGE_CATEGORIES,
      reversed: false,
      labels: {
        style: {
          fontSize: "12px",
          fontWeight: "600",
          color: getCssColor("text-default-grey"),
        },
      },
    },
    yAxis: {
      title: { text: "Effectif" },
      min: -axisMax,
      max: axisMax,
      labels: {
        formatter: function () {
          return Highcharts.numberFormat(
            Math.abs(this.value as number),
            0,
            ",",
            "\u00a0"
          );
        },
      },
    },
    plotOptions: {
      bar: {
        borderWidth: 0,
        borderRadius: 3,
        groupPadding: 0.15,
        pointPadding: 0.05,
        dataLabels: {
          enabled: true,
          formatter: function () {
            return Highcharts.numberFormat(
              Math.abs(this.y as number),
              0,
              ",",
              "\u00a0"
            );
          },
          style: {
            fontSize: "11px",
            fontWeight: "normal",
            textOutline: "none",
          },
        },
      },
    },
    tooltip: {
      formatter: function () {
        return `<b>${this.series.name}</b><br/>${this.x}: <b>${Highcharts.numberFormat(Math.abs(this.y as number), 0, ",", "\u00a0")}</b>`;
      },
    },
    legend: {
      enabled: true,
      itemStyle: { fontSize: "11px", fontWeight: "normal" },
    },
    series: [
      {
        type: "bar",
        name: "Hommes",
        color: getCssColor("fm-hommes"),
        data: hommesData,
      },
      {
        type: "bar",
        name: "Femmes",
        color: getCssColor("fm-femmes"),
        data: femmesData,
      },
    ],
  });
}

export function createFmLinesOptions(
  records: Records,
  metricKeys: string[],
  metricsConfig: Record<string, FmMetricConfig>
): Highcharts.Options {
  const categories = records.map((r) => r.annee_universitaire);
  const isPercent = metricsConfig[metricKeys[0]]?.format === "percent";

  const DASH: Highcharts.DashStyleValue[] = [
    "Solid",
    "ShortDash",
    "Dot",
    "LongDash",
    "ShortDot",
  ];

  const series = metricKeys.map((key, i) => {
    const cfg = metricsConfig[key];
    return {
      type: "line" as const,
      name: cfg?.label || key,
      color: cfg?.color,
      dashStyle: DASH[i % DASH.length],
      lineWidth: 2.5,
      marker: { enabled: true, radius: 3 },
      data: records.map((r) => (typeof r[key] === "number" ? r[key] : null)),
    };
  });

  return createChartOptions("line", {
    chart: { height: 480 },
    xAxis: {
      categories,
      title: { text: "Année universitaire" },
      crosshair: true,
    },
    yAxis: {
      title: { text: isPercent ? "%" : "Effectif" },
      labels: { format: isPercent ? "{value:.0f}\u00a0%" : "{value:,.0f}" },
      min: isPercent ? 0 : undefined,
    },
    plotOptions: {
      line: {
        lineWidth: 2.5,
        marker: { enabled: true, radius: 3 },
      },
    },
    tooltip: {
      shared: true,
      headerFormat: "<b>{point.key}</b><br/>",
      pointFormat: isPercent
        ? '<span style="color:{series.color}">●</span> {series.name}: <b>{point.y:.1f}\u00a0%</b><br/>'
        : '<span style="color:{series.color}">●</span> {series.name}: <b>{point.y:,.0f}</b><br/>',
    },
    legend: {
      enabled: true,
      itemStyle: { fontSize: "11px", fontWeight: "normal" },
    },
    series,
  });
}
