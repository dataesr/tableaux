import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";

import { CreateChartOptions } from "../../../../components/chart-ep";
import { formatToMillions } from "../../../../../../utils/format";
import type { HighchartsOptions } from "../../../../../../components/chart-wrapper";
import { getCssColor } from "../../../../../../utils/colors";
import { getI18nLabel } from "../../../../../../utils";
import i18n from "../../i18n-charts.json";

export default function Options(data, displayType, currentLang): HighchartsOptions {
  if (!data || !Array.isArray(data)) return null;

  const countryData = data.filter((item) => item.country !== "all")[0];
  if (!countryData?.data) return null;
  
  const filteredData = countryData.data;
 
  // liste de toutes les années/thema_code disponibles en parcourant tous les topics
  const years = new Set();
  const topicsLabels = new Set();
  filteredData.forEach((el) => {
    el.topics.forEach((topic) => {
      topicsLabels.add(topic.thema_code);
      topic.years.forEach((y) => {
        years.add(y.year);
      });
    });
  });
  const sortedYears = Array.from(years).sort(); // ['2021', '2022', '2023', '2024', '2025']
  const labels = Array.from(topicsLabels);
  const categories = sortedYears.flatMap((year) => labels.map((label) => `${label} - ${year}`));
  
  const index = {}; // Index : stage -> thema_code -> year -> valeur
  filteredData.forEach(({ stage, topics }) => {
    index[stage] = index[stage] || {};
    topics.forEach(({ thema_code, years }) => {
      index[stage][thema_code] = index[stage][thema_code] || {};
      years.forEach((year) => {
        index[stage][thema_code][year.year] = year[displayType];
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
    xAxis: {
      categories,
      crosshair: true,
    },
    yAxis: [
      {
        min: 0,
        title: {
          text: displayType === "total_fund_eur" ? "M€" : "Nombre",
        },
        gridLineColor: "var(--background-default-grey-hover)",
        gridLineWidth: 0.5,
      },
      {
        min: 0,
        max: 100,
        title: {
          text: `${getI18nLabel(i18n, "successRate", currentLang)} (%)`,
        },
        opposite: true,
        labels: {
          formatter: function (this: Highcharts.AxisLabelsFormatterContextObject) {
            return `${this.value}%`;
          },
          style: { color: successRateColor },
        },
        gridLineColor: "var(--background-default-grey-hover)",
        gridLineWidth: 0.5,
      },
    ],
    tooltip: {
      shared: true,
    },
    plotOptions: {
      column: {
        grouping: false,
        shadow: false,
        borderWidth: 0,
        borderRadius: 0,
        dataLabels: {
          enabled: true,
          formatter: function () {
            return displayType === "total_fund_eur" ? formatToMillions(this.y as number) : (this.y as number);
          },
        },
      },
    },
    series: [
      // Série pour les projets évalués
      {
        type: "column",
        name: getI18nLabel(i18n, "evaluatedProjects", currentLang),
        color: evaluatedColor,
        data: evaluated,
        pointPadding: 0.3,
        pointPlacement: -0.2,
      },
      // Série pour les projets lauréats
      {
        type: "column",
        name: getI18nLabel(i18n, "successfulProjects", currentLang),
        color: successfulColor,
        data: successful,
        pointPadding: 0.3,
        pointPlacement: 0.2,
      },
      // Série pour les taux de succès
      {
        type: "scatter",
        name: `${getI18nLabel(i18n, "successRate", currentLang)} (%)`,
        color: successRateColor,
        yAxis: 1,
        data: successRates,
        marker: { symbol: "circle", radius: 6 },
        dataLabels: {
          enabled: true,
          formatter: function () {
            return `${Number(this.y).toFixed(1)}%`;
          },
          y: -10,
          style: { fontSize: "11px", fontWeight: "600", textOutline: "none" },
        },
      },
    ],
  };

  return CreateChartOptions("column", newOptions);
}
