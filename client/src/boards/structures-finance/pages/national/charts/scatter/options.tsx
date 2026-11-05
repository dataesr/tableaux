import Highcharts from "highcharts/es-modules/masters/highcharts.src.js";
import { createChartOptions } from "../../../../../../components/chart-wrapper/default-options";
import { getCssColor } from "../../../../../../utils/colors";

export interface ScatterConfig {
  title: string;
  xMetric: string;
  yMetric: string;
  xLabel: string;
  yLabel: string;
}

export const createScatterOptions = (
  config: ScatterConfig,
  data: any[]
): Highcharts.Options => {
  const regionGroups = new Map<string, any[]>();

  data
    .filter(
      (item) => item[config.xMetric] != null && item[config.yMetric] != null
    )
    .forEach((item) => {
      const region = item.region || "Non spécifié";
      if (!regionGroups.has(region)) {
        regionGroups.set(region, []);
      }

      const etablissementName =
        item.etablissement_lib || "Établissement inconnu";

      regionGroups.get(region)!.push({
        x: item[config.xMetric],
        y: item[config.yMetric],
        z: Math.sqrt(item[config.yMetric]) / 10,
        name: etablissementName,
        region: item.region,
        type: item.type,
      });
    });

  const colors = Array.from({ length: 17 }, (_, i) => getCssColor(`scale-randomized-${i}-color`));
  const series = Array.from(regionGroups.entries())
    .sort(([regionA], [regionB]) =>
      regionA.localeCompare(regionB, "fr", { sensitivity: "base" })
    )
    .map(([region, items], index) => ({
      name: region,
      type: "bubble" as const,
      data: items,
      color: colors[index % colors.length],
    }));

  return createChartOptions("bubble", {
    chart: {
      height: 600,
    },
    accessibility: {
      enabled: true,
      description: `Graphique de dispersion représentant ${config.title.toLowerCase()}. Chaque bulle représente un établissement, coloré par région.`,
      keyboardNavigation: {
        enabled: true,
      },
    },
    xAxis: {
      title: {
        text: config.xLabel,
        style: {
          fontSize: "13px",
          fontWeight: "500",
        },
      },
      gridLineWidth: 0,
    },
    yAxis: {
      title: {
        text: config.yLabel,
        style: {
          fontSize: "13px",
          fontWeight: "500",
        },
      },
    },
    tooltip: {
      useHTML: true,
      borderWidth: 1,
      borderRadius: 8,
      shadow: false,
      formatter: function () {
        const point = this as any;
        return `
          <div style="padding:10px">
            <div style="font-weight:bold;margin-bottom:8px;font-size:14px">${point.name
          }</div>
            <div style="margin-bottom:4px;color:#666;font-size:12px">${point.type
          } • ${point.region}</div>
            <div style="margin-top:8px;padding-top:8px;border-top:1px solid #e5e5e5">
              <div style="margin-bottom:4px"><strong>${config.xLabel
          }:</strong> ${Highcharts.numberFormat(point.x, 0, ",", " ")}</div>
              <div><strong>${config.yLabel}:</strong> ${Highcharts.numberFormat(
            point.y,
            2,
            ",",
            " "
          )}</div>
            </div>
          </div>
        `;
      },
    },
    plotOptions: {
      bubble: {
        minSize: 5,
        maxSize: 40,
      },
    },
    legend: {
      enabled: true,
      align: "right",
      verticalAlign: "middle",
      layout: "vertical",
      title: {
        text: "Régions",
        style: {
          color: "var(--text-default-grey)",
        },
      },
      itemStyle: {
        color: "var(--text-default-grey)",
      },
      accessibility: {
        enabled: true,
        keyboardNavigation: {
          enabled: true,
        },
      },
    },
    series: series,
  });
};
