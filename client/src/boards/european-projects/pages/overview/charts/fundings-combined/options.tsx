import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";

import { CreateChartOptions } from "../../../../components/chart-ep";
import { formatNumber, formatToRates, formatToMillions } from "../../../../../../utils/format";
import { getCssColor } from "../../../../../../utils/colors";
import { getI18nLabel } from "../../../../../../utils";
import i18n from "../../i18n-charts.json";

type FundingItem = { code?: string; name_fr?: string; pilier_name_fr?: string; stage: string; total_fund_eur: number; total_coordination_number?: number; total_number_involved?: number; total_projects?: number };

export default function Options(data: { data?: FundingItem[] } | null, displayType: string = "total_fund_eur", title?: string) {
  const items = data?.data;
  if (!items || items.length === 0) return null;

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
  const successRates = evaluatedData.map((evaluated, i) => (evaluated > 0 ? (successfulData[i] / evaluated) * 100 : 0));

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
    title: { text: title },
    xAxis: { categories, crosshair: true },
    yAxis: [
      {
        title: { text: isFunding ? "Euros € (millions)" : valueKey === "total_coordination_number" ? "Nombre de coordinations" : valueKey === "total_projects" ? "Nombre de projets" : "Nombre de candidats et de participants" },
        min: 0,
        gridLineColor: "var(--background-default-grey-hover)",
        gridLineWidth: 0.5,
      },
      {
        title: { text: getI18nLabel(i18n, "successRate"), style: { color: successRateColor } },
        opposite: true,
        min: 0,
        max: 100,
        labels: { format: "{value}%", style: { color: successRateColor } },
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
      {
        type: "column",
        name: getI18nLabel(i18n, "evaluatedProjects"),
        color: evaluatedColor,
        data: evaluatedData,
        yAxis: 0,
      },
      {
        type: "column",
        name: getI18nLabel(i18n, "successfulProjects"),
        color: successfulColor,
        data: successfulData,
        yAxis: 0,
      },
      {
        type: "scatter",
        name: getI18nLabel(i18n, "successRate"),
        color: successRateColor,
        data: successRates,
        yAxis: 1,
        marker: { symbol: "circle", radius: 6 },
        dataLabels: {
          enabled: true,
          formatter: function () {
            return formatToRates(((this as any).y || 0) / 100);
          },
          y: -10,
          style: { fontSize: "11px", fontWeight: "600", color: successRateColor, textOutline: "none" },
        },
        zIndex: 5,
      } as any,
    ],
  };

  return CreateChartOptions("column", newOptions);
}
