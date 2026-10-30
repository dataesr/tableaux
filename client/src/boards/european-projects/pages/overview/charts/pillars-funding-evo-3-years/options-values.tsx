import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";

import { CreateChartOptions } from "../../../../components/chart-ep";
import { formatNumber, formatToRates, formatToMillions } from "../../../../../../utils/format";
import type { HighchartsOptions } from "../../../../../../components/chart-wrapper";
import { getCssColor } from "../../../../../../utils/colors";
import { getI18nLabel } from "../../../../../../utils";
import i18n from "../../i18n-charts.json";

export default function Options(data, displayType, currentLang): HighchartsOptions {
  if (!data) return null;

  const years = new Set();
  const filteredData = data.filter((item) => item.country !== "all")[0].data;
  const evaluatedData = filteredData.find((item) => item.stage === "evaluated");
  const successfulData = filteredData.find((item) => item.stage === "successful");

  evaluatedData.pillars[0].years.forEach((year) => years.add(year.year));

  const valueKey = (["total_fund_eur", "total_coordination_number", "total_number_involved", "count", "total_projects"].includes(displayType) ? displayType : "total_fund_eur") as
    | "total_fund_eur"
    | "total_coordination_number"
    | "total_number_involved"
    | "total_projects";
  const isFunding = valueKey === "total_fund_eur";

  // Créer les catégories combinées : Année - Pilier
  const categories: string[] = [];
  const sortedYears = Array.from(years).sort();

  sortedYears.forEach((year) => {
    evaluatedData.pillars.forEach((pillar) => {
      categories.push(`${year} - ${pillar.pilier_name_fr}`);
    });
  });

  const evaluatedColor = getCssColor("evaluated-project");
  const successfulColor = getCssColor("successful-project");
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
    xAxis: { categories: sortedYears.map(String), crosshair: true },
    yAxis: [
      {
        title: {
          text: displayType === "total_fund_eur" ? "Euros € (millions)" : displayType === "total_coordination_number" ? "Nombre de coordinations" : displayType === "total_projects" ? "Nombre de projets" : "Nombre de candidats et de participants",
        },
        min: 0,
        gridLineColor: "var(--background-default-grey-hover)",
        gridLineWidth: 0.5,
      },
      {
        title: {
          text: `${getI18nLabel(i18n, "successRate", currentLang)} (%)`,
          style: { color: successRateColor }
        },
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
        data: (() => {
          const data: number[] = [];
          sortedYears.forEach((year) => {
            evaluatedData.pillars.forEach((pillar) => {
              const yearData = pillar.years.find((y) => y.year === year);
              data.push(yearData ? yearData[displayType] : 0);
            });
          });
          return data;
        })(),
        yAxis: 0,
      },
      // Série pour les projets lauréats
      {
        type: "column",
        name: getI18nLabel(i18n, "successfulProjects", currentLang),
        color: successfulColor,
        data: (() => {
          const data: number[] = [];
          sortedYears.forEach((year) => {
            successfulData.pillars.forEach((pillar) => {
              const yearData = pillar.years.find((y) => y.year === year);
              data.push(yearData ? yearData[displayType] : 0);
            });
          });
          return data;
        })(),
        yAxis: 0,
      },
      // Série pour les taux de succès
      {
        type: "scatter",
        name: `${getI18nLabel(i18n, "successRate", currentLang)} (%)`,
        color: successRateColor,
        yAxis: 1,
        data: (() => {
          const data: number[] = [];
          sortedYears.forEach((year) => {
            evaluatedData.pillars.forEach((pillar) => {
              const evaluatedYearData = pillar.years.find((y) => y.year === year);
              const successfulPillar = successfulData.pillars.find((p) => p.pilier_code === pillar.pilier_code);
              const successfulYearData = successfulPillar ? successfulPillar.years.find((y) => y.year === year) : null;
              const evaluatedValue = evaluatedYearData ? evaluatedYearData[displayType] : 0;
              const successfulValue = successfulYearData ? successfulYearData[displayType] : 0;
              const successRate = evaluatedValue > 0 ? (successfulValue / evaluatedValue) * 100 : 0;
              data.push(successRate);
            });
          });
          return data;
        })(),
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
