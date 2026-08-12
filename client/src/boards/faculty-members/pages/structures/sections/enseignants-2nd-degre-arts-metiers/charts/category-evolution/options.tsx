import Highcharts from "highcharts/es-modules/masters/highcharts.src.js";
import { createChartOptions } from "../../../../../../../../components/chart-wrapper/default-options";
import { getCssColor } from "../../../../../../../../utils/colors";

const SCALE_COLORS = Array.from({ length: 14 }, (_, i) => `scale-${i + 1}`);

export function createCategoryEvolutionOptions(
  categories: string[],
  categoryEvolution: any[]
): Highcharts.Options {
  const allCategories = new Set<string>();
  categoryEvolution.forEach((e: any) =>
    e.category_breakdown?.forEach((b: any) => allCategories.add(b.category))
  );

  const series: Highcharts.SeriesOptionsType[] = [...allCategories].map(
    (cat, i) => ({
      type: "area" as const,
      name: cat,
      color: getCssColor(SCALE_COLORS[i % SCALE_COLORS.length]),
      data: categoryEvolution.map((e: any) => {
        const b = e.category_breakdown?.find(
          (c: any) => c.category === cat
        );
        return b?.count || 0;
      }),
    })
  );

  return createChartOptions("area", {
    chart: { height: 350 },
    xAxis: {
      categories,
      title: { text: null },
      labels: { rotation: -45 },
    },
    yAxis: { min: 0, title: { text: "Effectif" } },
    plotOptions: {
      area: {
        stacking: "normal",
        lineWidth: 1,
        marker: { enabled: false, radius: 3 },
        fillOpacity: 0.4,
      },
    },
    tooltip: {
      shared: true,
      headerFormat: "<b>{point.key}</b><br/>",
      pointFormat:
        '<span style="color:{series.color}">\u25CF</span> {series.name}: <b>{point.y:,.0f}</b><br/>',
    },
    legend: {
      enabled: true,
      layout: "horizontal",
      align: "center",
      verticalAlign: "bottom",
      maxHeight: 66,
      itemDistance: 12,
      symbolWidth: 10,
      symbolHeight: 10,
      itemStyle: { fontSize: "11px", fontWeight: "normal" },
      navigation: { animation: true },
    },
    series,
  });
}
