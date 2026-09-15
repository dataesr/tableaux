import Highcharts from "highcharts/es-modules/masters/highcharts.src.js";
import { createChartOptions } from "../../../../../../../../components/chart-wrapper/default-options";
import { getCssColor } from "../../../../../../../../utils/colors";
import { FM_METRICS_CONFIG, type FmMetricKey } from "../../config";

function formatValue(value: number, format: "number" | "percent"): string {
  if (format === "percent") return `${value.toFixed(1)} %`;
  return value.toLocaleString("fr-FR");
}

export function createFmComparisonBarOptions(
  data: any[],
  metricKey: string,
  currentId?: string,
  currentName?: string,
  labelOverride?: string
): Highcharts.Options {
  const isDynamic =
    metricKey.startsWith("groupe_cnu:") ||
    metricKey.startsWith("section_cnu:") ||
    metricKey.startsWith("assimil:");
  const dataKey = (isDynamic ? "total_effectif" : metricKey) as FmMetricKey;
  const config =
    FM_METRICS_CONFIG[dataKey] ?? FM_METRICS_CONFIG["total_effectif"];
  const label = labelOverride || config.label;

  const sorted = [...data]
    .filter((item) => item[dataKey] != null && !isNaN(item[dataKey]))
    .map((item) => ({
      id: item.etablissement_id_paysage_actuel as string,
      name: item.etablissement_actuel_lib || "Sans nom",
      value: item[dataKey] as number,
    }))
    .sort((a, b) => b.value - a.value);

  const n = sorted.length;
  const mean = n > 0 ? sorted.reduce((s, d) => s + d.value, 0) / n : 0;

  const allPoints = sorted.map((d, i) => ({
    x: i + 1,
    y: d.value,
    name: d.name,
    isCurrent: d.id === currentId,
  }));

  const otherPoints = allPoints.filter((p) => !p.isCurrent);
  const currentPoints = allPoints.filter((p) => p.isCurrent);

  return createChartOptions("scatter", {
    chart: { height: 420 },
    xAxis: {
      min: 0,
      max: n + 1,
      title: { text: `Rang parmi ${n} entités` },
      gridLineWidth: 0,
      tickInterval: Math.max(1, Math.floor(n / 8)),
      labels: {
        formatter: function () {
          return `${this.value}`;
        },
      },
    },
    yAxis: {
      title: { text: "" },
      labels: {
        formatter: function () {
          return formatValue(this.value as number, config.format);
        },
      },
      plotLines: [
        {
          value: mean,
          color: getCssColor("text-mention-grey"),
          dashStyle: "Dash",
          width: 1,
          zIndex: 5,
          label: {
            text: `Moyenne : ${formatValue(mean, config.format)}`,
            align: "right",
            x: -4,
            style: {
              fontSize: "11px",
              color: getCssColor("text-mention-grey"),
            },
          },
        } as any,
      ],
    },
    tooltip: {
      useHTML: true,
      formatter: function () {
        const point = (this as any).point;
        return `<strong>${point.name}</strong><br/>${label} : <strong>${formatValue(this.y as number, config.format)}</strong><br/>Rang : <strong>${this.x} / ${n}</strong>`;
      },
    },
    plotOptions: {
      scatter: {
        marker: {
          states: { hover: { lineWidth: 0 } },
        },
      },
    },
    legend: { enabled: false },
    series: [
      {
        type: "scatter",
        name: label,
        data: otherPoints,
        marker: {
          radius: 4,
          symbol: "circle",
          fillColor: config.color,
          lineWidth: 0,
        },
      } as any,
      ...(currentPoints.length > 0
        ? [
            {
              type: "scatter",
              name: currentName || "Entité sélectionnée",
              data: currentPoints,
              marker: {
                radius: 9,
                symbol: "diamond",
                fillColor: getCssColor("blue-france-main-525"),
                lineWidth: 2,
                lineColor: getCssColor("blue-france-sun-113"),
              },
              dataLabels: {
                enabled: true,
                formatter: function () {
                  return currentName || "";
                },
                x: 12,
                align: "left" as const,
                style: {
                  fontSize: "12px",
                  fontWeight: "600",
                  color: getCssColor("blue-france-main-525"),
                },
              },
            } as any,
          ]
        : []),
    ],
    accessibility: {
      description: `Courbe de rang pour ${label} : ${n} entités.${currentPoints.length > 0 ? ` ${currentName} est au rang ${currentPoints[0].x} sur ${n}.` : ""}`,
    },
  });
}
