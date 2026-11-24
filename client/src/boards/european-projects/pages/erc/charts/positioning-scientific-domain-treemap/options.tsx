import Highcharts from "highcharts/es-modules/masters/highcharts.src.js";
import type { ProcessedTreemapData } from "./utils";
import { getTreemapColors } from "./utils";
import { getI18nLabel } from "../../../../../../utils";
import i18n from "./i18n.json";

interface OptionsParams {
  processedData: ProcessedTreemapData;
  currentLang?: string;
  showOthersDetail?: boolean;
}

export default function Options({ processedData, currentLang = "fr", showOthersDetail = false }: OptionsParams): Highcharts.Options | null {
  if (!processedData || processedData.european.length === 0) return null;

  const colors = getTreemapColors(processedData.domainCode);

  const valueLabel =
    processedData.metric === "pi" ? getI18nLabel(i18n, "tooltip-pi", currentLang) : processedData.metric === "projects" ? getI18nLabel(i18n, "tooltip-projects", currentLang) : getI18nLabel(i18n, "tooltip-funding", currentLang);

  const othersLabel = getI18nLabel(i18n, "other-countries", currentLang);

  // Construction des points pour le treemap
  const points: Highcharts.PointOptionsObject[] = processedData.european.map((c) => ({
    id: c.code,
    name: c.name,
    value: c.value,
    color: c.isSelected ? colors.selectedCountry : colors.europeanCountry,
  }));

  // Case "Pays non-européens"
  if (showOthersDetail) {
    processedData.others.forEach((c) => {
      points.push({ id: `OTHER_${c.code}`, name: c.name, value: c.value, color: colors.otherCountries });
    });
  } else if (processedData.otherTotal > 0) {
    points.push({
      id: "OTHERS",
      name: othersLabel,
      value: processedData.otherTotal,
      color: colors.otherCountries,
    });
  }

  const fmtValue = (v: number) => (processedData.metric === "funding" ? `${(v / 1_000_000).toFixed(1)} M€` : `${Math.round(v)}`);

  const selectedName = processedData.european.find((c) => c.isSelected)?.name ?? "";
  const europeanLabel = currentLang === "fr" ? "Autres pays européens" : "Other European countries";

  // Séries fictives pour la légende Highcharts (le treemap ne supporte pas nativement la légende)
  const legendSeries: Highcharts.SeriesOptionsType[] = [];
  if (selectedName) {
    legendSeries.push({
      type: "line",
      name: selectedName,
      color: colors.selectedCountry,
      data: [],
      showInLegend: true,
      enableMouseTracking: false,
      marker: { symbol: "square", radius: 6 },
      lineWidth: 0,
      states: { hover: { lineWidth: 0 } },
    } as Highcharts.SeriesLineOptions);
  }
  legendSeries.push({
    type: "line",
    name: europeanLabel,
    color: colors.europeanCountry,
    data: [],
    showInLegend: true,
    enableMouseTracking: false,
    marker: { symbol: "square", radius: 6 },
    lineWidth: 0,
    states: { hover: { lineWidth: 0 } },
  } as Highcharts.SeriesLineOptions);
  if (processedData.otherTotal > 0) {
    legendSeries.push({
      type: "line",
      name: othersLabel,
      color: colors.otherCountries,
      data: [],
      showInLegend: true,
      enableMouseTracking: false,
      marker: { symbol: "square", radius: 6 },
      lineWidth: 0,
      states: { hover: { lineWidth: 0 } },
    } as Highcharts.SeriesLineOptions);
  }

  return {
    chart: {
      height: 540,
      margin: [0, 0, 40, 0],
      spacing: [8, 8, 8, 8],
    },
    title: { text: undefined },
    series: [
      ...legendSeries,
      {
        type: "treemap",
        layoutAlgorithm: "squarified",
        showInLegend: false,
        data: points,
        dataLabels: {
          enabled: true,
          crop: false,
          overflow: "allow",
          style: {
            textOutline: "1px contrast",
            fontSize: "11px",
            fontWeight: "bold",
            color: "#ffffff",
          },
          formatter: function () {
            const pt = this as unknown as { name: string; value: number };
            const total = processedData.european.reduce((s, c) => s + c.value, 0) + processedData.otherTotal;
            const pct = total > 0 ? ((pt.value / total) * 100).toFixed(1) : "0";
            if (pt.value / total > 0.03) {
              return `<b>${pt.name}</b><br>${fmtValue(pt.value)}<br>${pct} %`;
            }
            if (pt.value / total > 0.015) {
              return `<b>${pt.name}</b>`;
            }
            return "";
          },
        },
        borderColor: "#ffffff",
        states: {
          hover: {
            borderColor: "#333333",
            borderWidth: 2,
          },
        },
      } as Highcharts.SeriesTreemapOptions,
    ],
    tooltip: {
      useHTML: true,
      formatter: function () {
        const pt = this as unknown as { name: string; point: { id: string; value: number; color: string } };
        const total = processedData.european.reduce((s, c) => s + c.value, 0) + processedData.otherTotal;
        const pct = total > 0 ? ((pt.point.value / total) * 100).toFixed(1) : "0";
        const isOthers = pt.point.id === "OTHERS" || (pt.point.id?.startsWith("OTHER_") ?? false);
        const involvedLabel = getI18nLabel(i18n, "tooltip-involved", currentLang);
        const label = isOthers && (processedData.metric === "projects" || processedData.metric === "pi") ? involvedLabel : valueLabel;
        const lines = [`<b>${pt.name}</b>`, `${label} : <b>${fmtValue(pt.point.value)}</b>`, `Part : <b>${pct} %</b>`];
        if (isOthers && (processedData.metric === "projects" || processedData.metric === "pi")) {
          lines.push(
            `<i style="font-size:10px;color:#666">${currentLang === "fr" ? "(participation hors rôle PI)" : "(participation excl. PI role)"}</i>`,
          );
        }
        return lines.join("<br/>");
      },
    },
    legend: {
      enabled: true,
      align: "center",
      verticalAlign: "bottom",
      layout: "horizontal",
      symbolRadius: 0,
      itemStyle: { fontWeight: "normal", fontSize: "12px" },
    },
    credits: { enabled: false },
    exporting: { enabled: false },
  };
}
