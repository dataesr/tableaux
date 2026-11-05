import Highcharts from "highcharts/es-modules/masters/highcharts.src.js";
import { CreateChartOptions } from "../../../../components/chart-ep";
import type { ProcessedPositioningByDomainData, ProcessedPositioningMultiPanelData } from "./utils";
import { getChartColors, SCIENTIFIC_DOMAINS } from "./utils";
import { getI18nLabel } from "../../../../../../utils";
import i18n from "./i18n.json";

interface OptionsParams {
  processedData: ProcessedPositioningByDomainData;
  currentLang?: string;
}

export default function Options({ processedData, currentLang = "fr" }: OptionsParams): Highcharts.Options | null {
  if (!processedData || processedData.countries.length === 0) return null;

  const domainLabel =
    SCIENTIFIC_DOMAINS.find((d) => d.code === processedData.domainCode)?.label[currentLang as "fr" | "en"] ?? processedData.domainCode;

  const yAxisLabel =
    processedData.metric === "projects" ? getI18nLabel(i18n, "y-axis-projects", currentLang) : getI18nLabel(i18n, "y-axis-funding", currentLang);

  const titleText =
    processedData.metric === "projects"
      ? `${getI18nLabel(i18n, "chart-title-projects", currentLang)} – ${domainLabel}`
      : `${getI18nLabel(i18n, "chart-title-funding", currentLang)} – ${domainLabel}`;

  const colors = getChartColors(processedData.domainCode);

  const categories = processedData.countries.map((c) => c.name);
  const dataPoints = processedData.countries.map((c) => ({
    y: processedData.metric === "funding" ? c.value / 1_000_000 : c.value,
    color: c.isSelected ? colors.selectedCountry : colors.otherCountries,
    name: c.name,
  }));

  const scale = processedData.metric === "funding" ? 1_000_000 : 1;
  const avgTop10Display = processedData.avgTop10 / scale;
  const avgAllDisplay = processedData.avgAll / scale;

  const labelAvgTop10 = getI18nLabel(i18n, "avg-top10", currentLang);
  const labelAvgAll = getI18nLabel(i18n, "avg-all", currentLang);

  const newOptions: Highcharts.Options = {
    chart: { height: 450 },
    title: {
      text: titleText,
      style: { fontSize: "14px", fontWeight: "600" },
    },
    xAxis: {
      categories,
      title: { text: "" },
      labels: { style: { fontSize: "12px" } },
    },
    yAxis: {
      title: { text: yAxisLabel },
      labels: {
        format: processedData.metric === "funding" ? "{value} M€" : "{value}",
        style: { fontSize: "12px" },
      },
      min: 0,
      gridLineWidth: 0.5,
      gridLineColor: "#e0e0e0",
    },
    tooltip: {
      useHTML: true,
      shared: false,
      formatter: function () {
        const ctx = this as unknown as { key: string; y: number; };
        const fmt = (v: number) => (processedData.metric === "funding" ? `${v.toFixed(1)} M€` : `${Math.round(v)}`);
        return [
          `<b>${ctx.key}</b>`,
          `${yAxisLabel}\u00a0: <b>${fmt(ctx.y)}</b>`,
          `<span style="color:${colors.avgTop10}">&#9135;</span> ${labelAvgTop10}\u00a0: <b>${fmt(avgTop10Display)}</b>`,
          `<span style="color:${colors.avgAll}">&#8943;</span> ${labelAvgAll}\u00a0: <b>${fmt(avgAllDisplay)}</b>`,
        ].join("<br/>");
      },
    },
    plotOptions: {
      bar: {
        dataLabels: {
          enabled: true,
          format: processedData.metric === "funding" ? "{y:.1f} M€" : "{y}",
          style: { fontSize: "11px", fontWeight: "normal" },
        },
        // borderRadius: 3,
      },
    },
    legend: {
      enabled: true,
      align: "center",
      verticalAlign: "bottom",
      layout: "horizontal",
    },
    series: [
      {
        type: "bar",
        name: yAxisLabel,
        showInLegend: false,
        data: dataPoints,
      },
      {
        type: "line",
        name: labelAvgTop10,
        color: colors.avgTop10,
        dashStyle: "ShortDash" as Highcharts.DashStyleValue,
        lineWidth: 2,
        marker: { enabled: false },
        enableMouseTracking: false,
        showInLegend: true,
        data: categories.map(() => avgTop10Display),
        zIndex: 5,
      },
      {
        type: "line",
        name: labelAvgAll,
        color: colors.avgAll,
        dashStyle: "Dot" as Highcharts.DashStyleValue,
        lineWidth: 2,
        marker: { enabled: false },
        enableMouseTracking: false,
        showInLegend: true,
        data: categories.map(() => avgAllDisplay),
        zIndex: 5,
      },
    ],
  };

  return CreateChartOptions("bar", newOptions);
}

// Palette de couleurs pour les panels
const PANEL_COLORS = [
  "#0063CB",
  "#8B2FAF",
  "#3B7A57",
  "#C74B04",
  "#805E00",
  "#164171",
  "#5E6472",
  "#D4005A",
  "#00799B",
  "#34A853",
  "#EA4335",
  "#FBBC04",
];

export interface MultiPanelOptionsParams {
  multiPanelData: ProcessedPositioningMultiPanelData;
  currentLang?: string;
}

export function OptionsMultiPanel({ multiPanelData, currentLang = "fr" }: MultiPanelOptionsParams): Highcharts.Options | null {
  if (!multiPanelData || multiPanelData.countries.length === 0 || multiPanelData.panels.length === 0) return null;

  const yAxisLabel =
    multiPanelData.metric === "projects" ? getI18nLabel(i18n, "y-axis-projects", currentLang) : getI18nLabel(i18n, "y-axis-funding", currentLang);

  const domainLabel =
    SCIENTIFIC_DOMAINS.find((d) => d.code === multiPanelData.domainCode)?.label[currentLang as "fr" | "en"] ?? multiPanelData.domainCode;

  const titleText =
    multiPanelData.metric === "projects"
      ? `${getI18nLabel(i18n, "chart-title-projects", currentLang)} – ${domainLabel}`
      : `${getI18nLabel(i18n, "chart-title-funding", currentLang)} – ${domainLabel}`;

  const categories = multiPanelData.countries.map((c) => c.name);

  // Hauteur dynamique selon le nombre de pays × panels
  const chartHeight = Math.max(450, multiPanelData.countries.length * multiPanelData.panels.length * 22 + 120);

  const series: Highcharts.SeriesOptionsType[] = multiPanelData.panels.map((panel, i) => ({
    type: "bar",
    name: panel.panelName || panel.panelId,
    color: PANEL_COLORS[i % PANEL_COLORS.length],
    data: panel.values.map((v, ci) => {
      const val = multiPanelData.metric === "funding" ? v / 1_000_000 : v;
      const isSelected = multiPanelData.countries[ci]?.isSelected;
      return {
        y: val,
        borderWidth: isSelected ? 1 : 0,
        borderColor: isSelected ? "#161616" : undefined,

        name: categories[ci],
      };
    }),
  }));

  const newOptions: Highcharts.Options = {
    chart: { height: chartHeight },
    title: {
      text: titleText,
      style: { fontSize: "14px", fontWeight: "600" },
    },
    xAxis: {
      categories,
      title: { text: "" },
      labels: { style: { fontSize: "12px" } },
    },
    yAxis: {
      title: { text: yAxisLabel },
      labels: {
        format: multiPanelData.metric === "funding" ? "{value} M€" : "{value}",
        style: { fontSize: "12px" },
      },
      min: 0,
      gridLineWidth: 0.5,
      gridLineColor: "#e0e0e0",
    },
    tooltip: {
      useHTML: true,
      shared: true,
      formatter: function () {
        const ctx = this as unknown as { x: string; points: Array<{ series: { name: string; color: string }; y: number }> };
        const fmt = (v: number) => (multiPanelData.metric === "funding" ? `${v.toFixed(1)} M€` : `${Math.round(v)}`);
        const lines = [`<b>${ctx.x}</b>`];
        ctx.points?.forEach((pt) => {
          lines.push(`<span style="color:${pt.series.color}">●</span> ${pt.series.name}: <b>${fmt(pt.y)}</b>`);
        });
        return lines.join("<br/>");
      },
    },
    plotOptions: {
      bar: {
        grouping: true,
        dataLabels: {
          enabled: multiPanelData.panels.length <= 3,
          format: multiPanelData.metric === "funding" ? "{y:.1f} M€" : "{y}",
          style: { fontSize: "10px", fontWeight: "normal" },
        },
        borderRadius: 2,
      },
    },
    legend: {
      enabled: true,
      align: "center",
      verticalAlign: "bottom",
      layout: "horizontal",
    },
    series,
  };

  return CreateChartOptions("bar", newOptions);
}
