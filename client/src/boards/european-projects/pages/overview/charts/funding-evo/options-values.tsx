import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";

import { CreateChartOptions } from "../../../../components/chart-ep";
import { formatNumber, formatToRates, formatToMillions } from "../../../../../../utils/format";
import type { HighchartsOptions } from "../../../../../../components/chart-wrapper";
import { getCssColor } from "../../../../../../utils/colors";
import { getI18nLabel } from "../../../../../../utils";
import i18n from "../../i18n-charts.json";

export default function Options(data, displayType, currentLang): HighchartsOptions {
  if (!data || !Array.isArray(data)) return null;

  const countryData = data.filter((item) => item.country !== "all")[0];
  if (!countryData?.data) return null;

  const filteredData = countryData.data;

  const valueKey = (["total_fund_eur", "total_coordination_number", "total_number_involved", "count"].includes(displayType) ? displayType : "total_fund_eur") as
    | "total_fund_eur"
    | "total_coordination_number"
    | "total_number_involved"
    | "total_projects";
  const isFunding = valueKey === "total_fund_eur";
  // liste de toutes les années/code disponibles en parcourant tous les items
  const years = new Set();
  const itemsLabels = new Set();
  filteredData.forEach((el) => {
    el.items.forEach((item) => {
      itemsLabels.add(item.code);
      item.years.forEach((y) => {
        years.add(y.year);
      });
    });
  });
  const sortedYears = Array.from(years).sort(); // ['2021', '2022', '2023', '2024', '2025']
  const labels = Array.from(itemsLabels);
  const categories = sortedYears.flatMap((year) => labels.map((label) => `${label} - ${year}`));

  const index = {}; // Index : stage -> code -> year -> valeur
  filteredData.forEach(({ stage, items }) => {
    index[stage] = index[stage] || {};
    items.forEach(({ code, years }) => {
      index[stage][code] = index[stage][code] || {};
      years.forEach((year) => {
        index[stage][code][year.year] = year[displayType];
      });
    });
  });

  const evaluated = sortedYears.flatMap((year) => labels.map((code) => index["evaluated"]?.[code]?.[year] ?? 0));
  const evaluatedColor = getCssColor("evaluated-project");

  const successful = sortedYears.flatMap((year) => labels.map((code) => index["successful"]?.[code]?.[year] ?? 0));
  const successfulColor = getCssColor("successful-project");

  const successRates = successful.map((valSuccessful, i) => (evaluated[i] ? (valSuccessful / evaluated[i]) * 100 : 0));
  const successRateColor = getCssColor("average-success-rate") || "#d75521";

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
                .attr({ stroke: successRateColor, "stroke-width": 1.5, dashstyle: "Dot", zIndex: 3 })
                .add(),
            );
          });
        },
      },
    },
    xAxis: { categories, crosshair: true },
    yAxis: [
      {
        title: { text: displayType === "total_fund_eur" ? "Euros € (millions)" : displayType === "total_coordination_number" ? "Nombre de coordinations" : "Nombre de candidats et de participants" },
        min: 0,
        gridLineColor: "var(--background-default-grey-hover)",
        gridLineWidth: 0.5,
      },
      {
        title: { text: `${getI18nLabel(i18n, "successRate", currentLang)} (%)` },
        opposite: true,
        min: 0,
        max: 100,
        labels: { format: "{value}%", style: { color: successRateColor } },
      },
    ],
    tooltip: {
      shared: true,
      useHTML: true,
      formatter: function () {
        let html = `<strong>${this.category}</strong><br/>`;
        (this.points || []).forEach((point) => {
          const value = point.y || 0;
          const formatted = point.series.type === "scatter" ? formatToRates(value / 100) : isFunding ? formatToMillions(value * 1000000) : formatNumber(value);
          html += `<span style="color:${point.color}">●</span> ${point.series.name}: <strong>${formatted}</strong><br/>`;
        });
        return html;
      },
    },
    plotOptions: {
      column: { borderRadius: 2, borderWidth: 0, grouping: true },
    },
    series: [
      // Série pour les projets évalués
      {
        type: "column",
        name: getI18nLabel(i18n, "evaluatedProjects", currentLang),
        color: evaluatedColor,
        data: evaluated,
        yAxis: 0,
      },
      // Série pour les projets lauréats
      {
        type: "column",
        name: getI18nLabel(i18n, "successfulProjects", currentLang),
        color: successfulColor,
        data: successful,
        yAxis: 0,
      },
      // Série pour les taux de succès
      {
        type: "scatter",
        name: `${getI18nLabel(i18n, "successRate", currentLang)} (%)`,
        color: successRateColor,
        data: successRates,
        yAxis: 1,
        marker: { symbol: "circle", radius: 6 },
        dataLabels: {
          enabled: true,
          formatter: function () {
            return `${Number(this.y).toFixed(1)}%`;
          },
          y: -10,
          style: { fontSize: "11px", fontWeight: "600", textOutline: "none" },
        },
        zIndex: 5,
      },
    ],
  };

  return CreateChartOptions("column", newOptions);
}
