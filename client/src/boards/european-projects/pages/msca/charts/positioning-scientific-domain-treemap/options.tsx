import Highcharts from "highcharts/es-modules/masters/highcharts.src.js";
import { CreateChartOptions } from "../../../../components/chart-ep";
import type { TreemapData } from "./query";

interface OptionsParams {
  data: TreemapData[];
  currentLang?: string;
}

export default function Options({ data }: OptionsParams): Highcharts.Options | null {
  if (!data || data.length === 0) return null;

  const legendOpts = { legendType: "point" } as Record<string, unknown>;
  const newOptions: Highcharts.Options = {
    chart: {
      height: 600,
    },
    title: {
      text: "",
    },
    legend: { enabled: true },
    series: [
      {
        type: "treemap",
        colorByPoint: true,
        ...legendOpts,
        showInLegend: true,
        layoutAlgorithm: "squarified",
        data: data.map((item) => ({
          name: item.name,
          value: item.value,
          color: item.color,
        })),
        tooltip: {
          pointFormat: "{point.name}: {point.value}",
        },
        dataLabels: {
          enabled: true,
          format: "{point.name}",
          style: {
            fontSize: "12px",
            fontWeight: "normal",
          },
        },
      },
    ],
  };

  return CreateChartOptions("treemap", newOptions);
}
