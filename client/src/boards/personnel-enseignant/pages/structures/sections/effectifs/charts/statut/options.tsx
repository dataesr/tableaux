import Highcharts from "highcharts/es-modules/masters/highcharts.src.js";
import { createChartOptions } from "../../../../../../../../components/chart-wrapper/default-options";
import { getCssColor } from "../../../../../../../../utils/colors";

const STATUS_ORDER = ["enseignant_chercheur", "titulaire_non_chercheur", "non_titulaire"];
const STATUS_LABELS: Record<string, string> = {
  enseignant_chercheur: "Enseignants-chercheurs",
  titulaire_non_chercheur: "Autres permanents",
  non_titulaire: "Non permanents",
};

export function createStatusChartOptions(statusDistribution: any[]): Highcharts.Options {
  const sorted = STATUS_ORDER.map(
    (key) => statusDistribution.find((s) => s._id === key) || { _id: key, gender_breakdown: [] }
  );

  const categories = sorted.map((s) => STATUS_LABELS[s._id]);
  const maleData = sorted.map((s) => s.gender_breakdown?.find((g: any) => g.gender === "Masculin")?.count || 0);
  const femaleData = sorted.map((s) => s.gender_breakdown?.find((g: any) => g.gender === "Féminin")?.count || 0);

  return createChartOptions("bar", {
    chart: { height: 240 },
    xAxis: { categories, title: { text: null } },
    yAxis: {
      min: 0,
      title: { text: undefined },
      stackLabels: {
        enabled: true,
        format: "{total:,.0f}",
        style: { fontSize: "10px", fontWeight: "bold", textOutline: "none", color: "inherit" },
      },
    },
    plotOptions: {
      bar: {
        stacking: "normal",
        borderWidth: 0,
        borderRadius: 2,
        pointWidth: 32,
        dataLabels: {
          enabled: true,
          format: "{point.y:,.0f}",
          style: { fontSize: "10px", fontWeight: "normal", textOutline: "none", color: getCssColor("text-inverted-grey") },
          filter: { property: "y", operator: ">", value: 0 },
        },
      },
    },
    tooltip: {
      shared: true,
      headerFormat: "<b>{point.key}</b><br/>",
      pointFormat: '<span style="color:{series.color}">●</span> {series.name}\u00a0: <b>{point.y:,.0f}</b><br/>',
    },
    legend: { enabled: true, reversed: true, itemStyle: { fontSize: "11px", fontWeight: "normal" } },
    series: [
      { type: "bar", name: "Hommes", data: maleData, color: getCssColor("fm-hommes") },
      { type: "bar", name: "Femmes", data: femaleData, color: getCssColor("fm-femmes") },
    ],
  });
}


export function createStatusFeminizationOptions(
  statusDistribution: any[]
): Highcharts.Options {
  const order = ["enseignant_chercheur", "titulaire_non_chercheur", "non_titulaire"];
  const sorted = order
    .map((key) => statusDistribution.find((s) => s._id === key))
    .filter(Boolean);

  const labels = sorted.map((s) => STATUS_LABELS[s._id] || s._id);

  const maleData = sorted.map((s) =>
    s.gender_breakdown?.find((g: any) => g.gender === "Masculin")?.count || 0
  );
  const femaleData = sorted.map((s) =>
    s.gender_breakdown?.find((g: any) => g.gender === "Féminin")?.count || 0
  );

  return createChartOptions("bar", {
    chart: { height: 220 },
    xAxis: { categories: labels, title: { text: null } },
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
          filter: { property: "percentage", operator: ">", value: 6 },
        },
      },
    },
    tooltip: {
      shared: true,
      headerFormat: "<b>{point.key}</b><br/>",
      pointFormat:
        '<span style="color:{series.color}">\u25cf</span> {series.name}\u00a0: <b>{point.y:,.0f}</b> ({point.percentage:.1f}\u00a0%)<br/>',
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

