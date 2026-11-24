import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";

import { getI18nLabel } from "../../../../../../utils";
import { getCssColor } from "../../../../../../utils/colors";
import { formatNumberLang, formatToMillionsLang, formatToPercentLang } from "../../../../../../utils/format";
import { CreateChartOptions } from "../../../../components/chart-ep";
import { type Level, sortByLevel } from "../../../../utils/levelsSort";
import i18n from "../../i18n-charts.json";

type FundingItem = { code?: string; name_fr?: string; pilier_name_fr?: string; stage: string; total_fund_eur: number; total_coordination_number?: number; total_number_involved?: number; total_projects?: number };

export default function getOptions(data: { data?: FundingItem[] } | null, displayType: string = "total_fund_eur", currentLang: string, title?: string, groupBy: Level = "pillar") {
  const items = data?.data ? sortByLevel(data.data, groupBy) : undefined;
  if (!items || items.length === 0) return null;

  const lang: "fr" | "en" = currentLang === "en" ? "en" : "fr";

  const valueKey = (["total_fund_eur", "total_coordination_number", "total_number_involved", "total_projects"].includes(displayType) ? displayType : "total_fund_eur") as
    | "total_fund_eur"
    | "total_coordination_number"
    | "total_number_involved"
    | "total_projects";
  const isFunding = valueKey === "total_fund_eur";
  const divider = isFunding ? 1000000 : 1;

  const getName = (item: FundingItem) => item.name_fr ?? item.pilier_name_fr ?? item.code ?? "";
  const categories = Array.from(new Set(items.map(getName)));

  const getValue = (name: string, stage: string) => items.filter((item) => getName(item) === name && item.stage === stage).reduce((sum, item) => sum + (item[valueKey] || 0), 0);

  const evaluatedData = categories.map((name) => getValue(name, "evaluated") / divider);
  const successfulData = categories.map((name) => getValue(name, "successful") / divider);
  const successRates = evaluatedData.map((evaluated, i) => {
    if (evaluated <= 0) return { label: 0, y: 0 }
    const rate = (successfulData[i] / evaluated) * 100
    if (rate > 100) return { label: rate, y: 100, marker: { symbol: "triangle" } }
    return { label: rate, y: rate }
  });

  const successRateColor = getCssColor("success-rate") || "#00A95F";

  const legend: any = {}
  switch (displayType) {
    case "total_fund_eur":
      legend.serie_01 = getI18nLabel(i18n, "requestedFunding", lang)
      legend.serie_02 = getI18nLabel(i18n, "securedFunding", lang)
      break
    case "total_coordination_number":
      legend.serie_01 = getI18nLabel(i18n, "evaluatedCoordinations", lang)
      legend.serie_02 = getI18nLabel(i18n, "successfulCoordinations", lang)
      break
    case "total_number_involved":
      legend.serie_01 = getI18nLabel(i18n, "applicantsNumber", lang)
      legend.serie_02 = getI18nLabel(i18n, "participantsNumber", lang)
      break
    case "total_projects":
      legend.serie_01 = getI18nLabel(i18n, "evaluatedProjects", lang)
      legend.serie_02 = getI18nLabel(i18n, "successfulProjects", lang)
      break
    default:
      break
  }

  const newOptions: HighchartsInstance.Options = {
    chart: {
      events: {
        render(this: any) {
          (this._stems || []).forEach((el: any) => el.destroy());
          this._stems = [];
          const scatter = this.series.find((s: any) => s.type === "scatter");
          if (!scatter) return;
          const y0 = (this.yAxis[1] as any).toPixels(0);
          scatter.points.forEach((pt: any) => {
            if (pt.plotX == null || pt.plotY == null) return;
            this._stems.push(
              this.renderer
                .path(["M", this.plotLeft + pt.plotX, y0, "L", this.plotLeft + pt.plotX, this.plotTop + pt.plotY])
                .attr({ stroke: successRateColor, "stroke-width": 2, dashstyle: "Dot", zIndex: 3 })
                .add(),
            );
          });
        },
      },
    },
    title: { text: title },
    xAxis: { categories, crosshair: true },
    yAxis: [
      {
        title: { text: isFunding ? "Euros (M€)" : valueKey === "total_coordination_number" ? "Nombre de projets coordonnés" : valueKey === "total_projects" ? "Nombre de projets" : "Nombre de candidats et de participants" },
        min: 0,
        gridLineColor: "var(--background-default-grey-hover)",
        gridLineWidth: 0.5,
      },
      {
        title: { text: `${getI18nLabel(i18n, "successRate", lang)} (%)` },
        opposite: true,
        min: 0,
        max: 100,
        labels: { format: "{value}%" },
      },
    ],
    legend: { enabled: true, align: "center", verticalAlign: "bottom", layout: "horizontal" },
    tooltip: {
      shared: true,
      useHTML: true,
      formatter: function () {
        let html = `<strong>${this.category}</strong><br/>`;
        (this.points || []).forEach((point) => {
          const value = point.y || 0;
          const formatted =
            point.series.type === "scatter"
              ? formatToPercentLang(value, lang)
              : isFunding
                ? formatToMillionsLang(value * 1000000, lang)
                : formatNumberLang(value, lang);
          html += `<span style="color:${point.color}">●</span> ${point.series.name}: <strong>${formatted}</strong><br/>`;
        });
        return html;
      },
    },
    plotOptions: {
      column: {
        borderWidth: 0,
        grouping: true,
        maxPointWidth: 90,
        groupPadding: 0.25, // espace entre les catégories (par défaut 0.2)
        pointPadding: 0.1,
      },
    },
    series: [
      {
        type: "column",
        name: legend.serie_01,
        color: getCssColor("evaluated-project"),
        data: evaluatedData,
        yAxis: 0,
      },
      {
        type: "column",
        name: legend.serie_02,
        color: getCssColor("successful-project"),
        data: successfulData,
        yAxis: 0,
      },
      {
        type: "scatter",
        name: getI18nLabel(i18n, "successRate", lang),
        color: successRateColor,
        data: successRates,
        yAxis: 1,
        marker: { symbol: "circle", radius: 6 },
        dataLabels: {
          enabled: true,
          formatter: function () {
            return formatToPercentLang((this as any).label || 0, lang);
          },
          y: -10,
          style: { fontSize: "11px", fontWeight: "600", textOutline: "none" },
        },
        zIndex: 5,
      } as any,
    ],
  };

  return CreateChartOptions("column", newOptions);
}