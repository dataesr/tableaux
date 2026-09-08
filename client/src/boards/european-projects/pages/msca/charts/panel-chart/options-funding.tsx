import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";
import { CreateChartOptions } from "../../../../components/chart-ep";
import type { MscaPanelChartItem } from "./query";
import { formatCurrency, formatToRates } from "../../../../../../utils/format";

interface OptionsParams {
  data: MscaPanelChartItem[];
  currentLang?: string;
}

export default function OptionsFunding({ data, currentLang = "fr" }: OptionsParams) {
  if (!data || data.length === 0) return null;

  const sortedData = [...data].filter((d) => d.panel_id).sort((a, b) => a.panel_id.localeCompare(b.panel_id));

  const categories = sortedData.map((d) => d.panel_id);
  const evaluatedData = sortedData.map((d) => (d.evaluated?.total_funding_project || 0) / 1_000_000);
  const successfulData = sortedData.map((d) => (d.successful?.total_funding_project || 0) / 1_000_000);
  const successRates = sortedData.map((d) => {
    const evaluated = d.evaluated?.total_funding_project || 0;
    const successful = d.successful?.total_funding_project || 0;
    return evaluated > 0 ? (successful / evaluated) * 100 : 0;
  });

  const rootStyles = getComputedStyle(document.documentElement);
  const evaluatedColor = rootStyles.getPropertyValue("--evaluated-project-color").trim() || "#009099";
  const successfulColor = rootStyles.getPropertyValue("--successful-project-color").trim() || "#233e41";
  const successRateColor = rootStyles.getPropertyValue("--averageSuccessRate-color").trim() || "#d75521";

  const titleText = currentLang === "fr" ? "Financements par panel scientifique MSCA" : "Funding by MSCA scientific panel";

  const newOptions: HighchartsInstance.Options = {
    chart: {
      height: 400,
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
    title: {
      text: titleText,
      style: { fontSize: "14px", fontWeight: "600" },
    },
    xAxis: {
      categories,
      crosshair: true,
      labels: {
        formatter: function () {
          return String(this.value);
        },
        style: { fontSize: "12px" },
      },
    },
    yAxis: [
      {
        title: {
          text: currentLang === "fr" ? "Financements (M€)" : "Funding (M€)",
          style: { fontSize: "13px" },
        },
        min: 0,
        labels: { format: "{value} M€" },
      },
      {
        title: {
          text: currentLang === "fr" ? "Taux de succès (%)" : "Success rate (%)",
          style: { fontSize: "13px", color: successRateColor },
        },
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
        const index = typeof this.x === "number" ? this.x : 0;
        const item = sortedData[index];
        const name = item?.panel_name || item?.panel_id || "";
        let html = `<strong>${name}</strong><br/>`;
        const points = this.points || [];
        points.forEach((point) => {
          if (point.series.type === "scatter") return;
          const value = point.y || 0;
          html += `<span style="color:${point.color}">●</span> ${point.series.name}: <strong>${formatCurrency(value * 1_000_000)}</strong><br/>`;
        });
        const rate = successRates[index];
        if (rate != null) {
          html += `<span style="color:${successRateColor}">●</span> ${currentLang === "fr" ? "Taux de succès" : "Success rate"}: <strong>${formatToRates(rate / 100)}</strong><br/>`;
        }
        return html;
      },
    },
    plotOptions: {
      column: { grouping: true, borderWidth: 0, borderRadius: 2 },
      line: { marker: { enabled: true, radius: 5 }, lineWidth: 2 },
    },
    series: [
      {
        type: "column",
        name: currentLang === "fr" ? "Financements demandés" : "Requested funding",
        color: evaluatedColor,
        data: evaluatedData,
        yAxis: 0,
      },
      {
        type: "column",
        name: currentLang === "fr" ? "Financements obtenus" : "Obtained funding",
        color: successfulColor,
        data: successfulData,
        yAxis: 0,
      },
      {
        type: "scatter",
        name: currentLang === "fr" ? "Taux de succès" : "Success rate",
        color: successRateColor,
        data: successRates,
        yAxis: 1,
        pointPlacement: 0,
        marker: { symbol: "circle", radius: 6 },
        dataLabels: {
          enabled: true,
          formatter: function () {
            return formatToRates(((this as any).y || 0) / 100);
          },
          y: -10,
          style: {
            fontSize: "11px",
            fontWeight: "600",
            color: successRateColor,
            textOutline: "none",
          },
        },
        zIndex: 5,
      } as any,
    ],
  };

  return CreateChartOptions("column", newOptions);
}
