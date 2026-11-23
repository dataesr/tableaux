import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";

import type { HighchartsOptions } from "../../../../../../components/chart-wrapper";
import { getI18nLabel } from "../../../../../../utils";
import { getCssColor } from "../../../../../../utils/colors";
import { formatNumberLang, formatToPercentLang, formatCurrencyLang } from "../../../../../../utils/format";
import { CreateChartOptions } from "../../../../components/chart-ep";
import i18n from "../../i18n-charts.json";
import { getEvolLegend, getEvolYAxisTitle, getLevelFromData, LEVELS } from "../../evol-charts-text";

export default function getOptionsValues(data, displayType, currentLang): HighchartsOptions {
  if (!data || !Array.isArray(data)) return null;

  // level correspond à pillar | program | topic
  const level = getLevelFromData(data);
  const { itemsKey, codeKey } = LEVELS[level];

  const countryData = data.filter((item) => item.country !== "all")[0];
  if (!countryData?.data) return null;

  const filteredData = countryData.data;

  const valueKey = (["total_fund_eur", "total_coordination_number", "total_number_involved", "count", "total_projects"].includes(displayType) ? displayType : "total_fund_eur") as
    | "total_fund_eur"
    | "total_coordination_number"
    | "total_number_involved"
    | "total_projects";
  const isFunding = valueKey === "total_fund_eur";
  // const formatter = Intl.NumberFormat(currentLang, { notation: 'compact' })

  // liste de toutes les années/code disponibles en parcourant tous les items
  const years = new Set();
  const itemsLabels = new Set();
  filteredData.forEach((el) => {
    el[itemsKey].forEach((item) => {
      itemsLabels.add(item[codeKey]);
      item.years.forEach((y) => {
        years.add(y.year);
      });
    });
  });
  const sortedYears = Array.from(years).sort(); // ['2021', '2022', '2023', '2024', '2025']
  const labels = Array.from(itemsLabels);
  const categories = sortedYears.flatMap((year) => labels.map((label) => `${label} - ${year}`));

  const index = {}; // Index : stage -> code -> year -> valeur
  filteredData.forEach((el) => {
    const stage = el.stage;
    index[stage] = index[stage] || {};
    el[itemsKey].forEach((item) => {
      const code = item[codeKey];
      index[stage][code] = index[stage][code] || {};
      item.years.forEach((year) => {
        index[stage][code][year.year] = year[displayType];
      });
    });
  });

  const evaluated = sortedYears.flatMap((year) => labels.map((code) => index["evaluated"]?.[code]?.[year] ?? 0));
  const evaluatedColor = getCssColor("evaluated-project");

  const successful = sortedYears.flatMap((year) => labels.map((code) => index["successful"]?.[code]?.[year] ?? 0));
  const successfulColor = getCssColor("successful-project");

  const successRates = successful.map((valSuccessful, i) => (evaluated[i] ? (valSuccessful / evaluated[i]) * 100 : 0));
  const successRateColor = getCssColor("success-rate");

  const legend = getEvolLegend(displayType, currentLang);

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
        title: { text: getEvolYAxisTitle(displayType, currentLang) },
        min: 0,
        gridLineColor: "var(--background-default-grey-hover)",
        gridLineWidth: 0.5,
      },
      {
        title: { text: `${getI18nLabel(i18n, "successRate", currentLang)} (%)` },
        opposite: true,
        min: 0,
        max: 100,
        labels: { format: "{value}%"},
      },
    ],
    tooltip: {
      shared: true,
      useHTML: true,
      formatter: function () {
        let html = `<strong>${this.category}</strong><br/>`;
        (this.points || []).forEach((point) => {
          const value = point.y || 0;
          const formatted = point.series.type === "scatter" ? formatToPercentLang(value, currentLang) : isFunding ? formatCurrencyLang(value, currentLang) : formatNumberLang(value, currentLang);
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
        name: legend.serie_01,
        color: evaluatedColor,
        data: evaluated,
        yAxis: 0,
      },
      {
        type: "column",
        name: legend.serie_02,
        color: successfulColor,
        data: successful,
        yAxis: 0,
      },
      {
        type: "scatter",
        name: `${getI18nLabel(i18n, "successRate", currentLang)}`,
        color: successRateColor,
        data: successRates,
        yAxis: 1,
        marker: { symbol: "circle", radius: 6 },
        dataLabels: {
          enabled: true,
          formatter: function () {
            return formatToPercentLang(this.y ?? 0, currentLang);
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
