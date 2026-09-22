import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";

import { CreateChartOptions } from "../../../../components/chart-ep";
import { formatToMillions } from "../../../../../../utils/format";
import { getCssColor } from "../../../../../../utils/colors";
import { getI18nLabel, getResponsiveChartHeight } from "../../../../../../utils";
// import i18n from "../../i18n-charts.json";

export default function Options(data, title, currentLang) {
  if (!data) return null;

  const i18n = {
    HORIZON1: { fr: "Excellence scientifique", en: "Excellent science" },
    HORIZON2: { fr: "Problématique mondiales et compétitivité industrielle européenne", en: "Global challenges an europeanindustrial competitiveness" },
    HORIZON3: { fr: "Europe plus innovante", en: "Innovative Europe" },
    HORIZON4: { fr: "Elargir la participation et renforcer l'espace européen de la recherche", en: "Widening participation and strengthening the european research area" },
  };

  const pilarConfig = [
    { key: "HORIZON.1", name: getI18nLabel(i18n, "HORIZON1", currentLang), color: getCssColor("pillar-p1-color") },
    { key: "HORIZON.2", name: getI18nLabel(i18n, "HORIZON2", currentLang), color: getCssColor("pillar-p2-color") },
    { key: "HORIZON.3", name: getI18nLabel(i18n, "HORIZON3", currentLang), color: getCssColor("pillar-p3-color") },
    { key: "HORIZON.4", name: getI18nLabel(i18n, "HORIZON4", currentLang), color: getCssColor("pillar-p4-color") },
  ];

  // Regrouper les programmes "successful" par pilier
  const groups = pilarConfig.map((pilar) => ({
    ...pilar,
    items: data.data.filter((program) => program.code.startsWith(pilar.key) && program.stage === "successful"),
  }));

  // Construire la liste de catégories = tous les name_fr, dans l'ordre des piliers
  const categories = groups.flatMap((group) => group.items.map((item) => item.name_fr));

  // Construire une série par pilier, avec des null ailleurs que sur ses propres catégories
  let cursor = 0;
  const series = groups.map((group) => {
    const start = cursor;
    const pointsData = categories.map((_, index) => {
      if (index >= start && index < start + group.items.length) {
        const item = group.items[index - start];
        return { y: item.total_fund_eur, custom: { valueName: item[`name_${currentLang}`] } };
      }
      return null;
    });
    cursor += group.items.length;

    return {
      type: "column" as const, // <-- force TypeScript à retenir le littéral "column", pas "string"
      name: group.name,
      color: group.color,
      data: pointsData,
    };
  });

  const newOptions: HighchartsInstance.Options = {
    chart: {
      type: "column",
      height: getResponsiveChartHeight(categories.length),
    },
    title: {
      text: title,
    },
    xAxis: {
      categories,
      labels: {
        rotation: -45,
      },
    },
    yAxis: {
      min: 0,
      title: {
        text: "Euros € (millions)",
      },
    },
    plotOptions: {
      column: {
        grouping: false, // essentiel : sinon Highcharts réserve de la place pour les 4 séries à chaque catégorie
        pointPadding: 0.1,
        groupPadding: 0.15,
        borderWidth: 0,
        dataLabels: {
          enabled: true,
          formatter: function () {
            return formatToMillions(this.y ?? 0);
          },
        },
      },
    },
    tooltip: {
      pointFormatter: function () {
        const point = this as Highcharts.Point & { custom?: { valueName: string } };
        return `<span style="color:${point.color}">●</span> ${point.custom?.valueName ?? point.category}: <b>${formatToMillions(point.y ?? 0)}</b><br/>`;
      },
    },
    legend: {
      enabled: true,
    },
    series,
  };

  return CreateChartOptions("column", newOptions);
}
