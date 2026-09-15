import Highcharts from "highcharts/es-modules/masters/highcharts.src.js";
import { createChartOptions } from "../../../../../../../../components/chart-wrapper/default-options";
import { getCssColor } from "../../../../../../../../utils/colors";

export function createCategoryFeminizationOptions(
  categoryDistribution: any[]
): Highcharts.Options {
  const withFemPct = categoryDistribution
    .map((c) => {
      const total = c.total || 0;
      const female = c.gender_breakdown?.find((g: any) => g.gender === "Féminin")?.count || 0;
      return { name: c._id || "Non précisé", femPct: total > 0 ? (female / total) * 100 : 0, total };
    })
    .sort((a, b) => b.femPct - a.femPct);

  return createChartOptions("bar", {
    chart: { height: Math.max(200, withFemPct.length * 44) },
    xAxis: { categories: withFemPct.map((d) => d.name), title: { text: null } },

    plotOptions: {
      bar: {
        borderWidth: 0,
        borderRadius: 4,
        colorByPoint: false,
        pointWidth: 28,
        dataLabels: {
          enabled: true,
          format: "{y:.1f}\u00a0%",
          style: { fontSize: "11px", fontWeight: "normal" },
        },
      },
    },
    tooltip: {
      headerFormat: "<b>{point.key}</b><br/>",
      pointFormat: "Part des femmes\u00a0: <b>{point.y:.1f}\u00a0%</b>",
    },
    legend: { enabled: false },
    series: [{
      type: "bar",
      name: "% femmes",
      data: withFemPct.map((d) => ({
        y: parseFloat(d.femPct.toFixed(1)),
        color: d.femPct >= 50 ? getCssColor("fm-femmes") : getCssColor("fm-hommes"),
      })),
    }],
  });
}

export function createCategoryChartOptions(
  categories: string[],
  maleData: number[],
  femaleData: number[]
): Highcharts.Options {
  return createChartOptions("bar", {
    chart: {
      height: Math.max(220, categories.length * 44),
    },
    xAxis: {
      categories,
      title: { text: null },
    },
    yAxis: { visible: false, min: 0, max: 100 },
    plotOptions: {
      bar: {
        stacking: "percent",
        borderWidth: 0,
        borderRadius: 0,
        pointWidth: 28,
        dataLabels: {
          enabled: true,
          format: "{point.percentage:.0f}\u00a0%",
          style: {
            fontSize: "10px",
            fontWeight: "bold",
            textOutline: "none",
            color: getCssColor("text-inverted-grey"),
          },
          filter: { property: "percentage", operator: ">", value: 8 },
        },
      },
    },
    tooltip: {
      shared: true,
      headerFormat: "<b>{point.key}</b><br/>",
      pointFormat:
        '<span style="color:{series.color}">●</span> {series.name}: <b>{point.y:,.0f}</b> ({point.percentage:.1f}\u00a0%)<br/>',
    },
    legend: {
      enabled: true,
      reversed: true,
      itemStyle: { fontSize: "11px", fontWeight: "normal" },
    },
    series: [
      {
        type: "bar",
        name: "Hommes",
        data: maleData,
        color: getCssColor("fm-hommes"),
      },
      {
        type: "bar",
        name: "Femmes",
        data: femaleData,
        color: getCssColor("fm-femmes"),
      },
    ],
  });
}
