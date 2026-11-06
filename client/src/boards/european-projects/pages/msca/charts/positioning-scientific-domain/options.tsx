import Highcharts from "highcharts/es-modules/masters/highcharts.src.js";
import { CreateChartOptions } from "../../../../components/chart-ep";
import type { ProcessedPositioningByScientificDomainData } from "./utils";
import { getChartColors, SCIENTIFIC_DOMAINS } from "./utils";
import { getI18nLabel } from "../../../../../../utils";
import i18n from "./i18n.json";

interface OptionsParams {
  processedData: ProcessedPositioningByScientificDomainData;
  currentLang?: string;
}

export default function Options({ processedData, currentLang = "fr" }: OptionsParams): Highcharts.Options | null {
  if (!processedData || processedData.countries.length === 0) return null;
  
  /*retrieving the name of the scientific domain for title chart*/  
  const scientificLabel = SCIENTIFIC_DOMAINS.find((t) => t.code === processedData.domain)?.label[currentLang] ?? processedData.domain
  
  /*replacement of domain code with scientific label*/
  const titleText =
    processedData.metric === "projects"
      ? getI18nLabel(i18n, "chart-title-projects", currentLang).replace("{domain}", scientificLabel)
      : getI18nLabel(i18n, "chart-title-funding", currentLang).replace("{domain}", scientificLabel)

  const yAxisLabel =
    processedData.metric === "projects" ? getI18nLabel(i18n, "y-axis-projects", currentLang) : getI18nLabel(i18n, "y-axis-funding", currentLang);

  const colors = getChartColors(processedData.domain);

  const categories = processedData.countries.map((c) => c.name);
  const dataPoints = processedData.countries.map((c) => ({
    y: processedData.metric === "funding" ? c.value / 1_000_000 : c.value,
    color: c.isSelected ? colors.selectedCountry : colors.otherCountries,
    name: c.name,
  }));

  const scale = processedData.metric === "funding" ? 1_000_000 : 1;
  const avgTop10Display = processedData.avgTop10 / scale;
  const avgAllDisplay = processedData.avgAll / scale;

  const labelAvgTop10 = getI18nLabel(i18n, "avg-top10", currentLang);
  const labelAvgAll = getI18nLabel(i18n, "avg-all", currentLang);

  const newOptions: Highcharts.Options = {
    chart: {
      height: 450,
    },
    title: {
      text: titleText,
      style: {
        fontSize: "14px",
        fontWeight: "600",
      },
    },
    xAxis: {
      categories,
      title: {
        text: "",
      },
      labels: {
        style: {
          fontSize: "12px",
        },
      },
    },
    yAxis: {
      title: {
        text: yAxisLabel,
      },
      labels: {
        format: processedData.metric === "funding" ? "{value} M€" : "{value}",
        style: {
          fontSize: "12px",
        },
      },
      min: 0,
      gridLineWidth: 0.5,
      gridLineColor: "#e0e0e0",
    },
    tooltip: {
      useHTML: true,
      shared: false,
      formatter: function () {
        const ctx = this as unknown as { x: string; y: number };
        const fmt = (v: number) => (processedData.metric === "funding" ? `${v.toFixed(1)} M€` : `${Math.round(v)}`);
        return [
          `<b>Position : ${ctx.x}</b>`,
          `${yAxisLabel}\u00a0: <b>${fmt(ctx.y)}</b>`,
          `<span style="color:${colors.avgTop10}">&#9135;</span> ${labelAvgTop10}\u00a0: <b>${fmt(avgTop10Display)}</b>`,
          `<span style="color:${colors.avgAll}">&#8943;</span> ${labelAvgAll}\u00a0: <b>${fmt(avgAllDisplay)}</b>`,
        ].join("<br/>");
      },
    },
    plotOptions: {
      bar: {
        dataLabels: {
          enabled: true,
          format: processedData.metric === "funding" ? "{y:.1f} M€" : "{y}",
          style: {
            fontSize: "11px",
            fontWeight: "normal",
          },
        },
        borderRadius: 3,
      },
    },
    legend: {
      enabled: true,
      align: "center",
      verticalAlign: "bottom",
      layout: "horizontal",
    },
    series: [
      {
        type: "bar",
        name: yAxisLabel,
        showInLegend: false,
        data: dataPoints,
      },
      {
        type: "line",
        name: labelAvgTop10,
        color: colors.avgTop10,
        dashStyle: "ShortDash" as Highcharts.DashStyleValue,
        lineWidth: 2,
        marker: { enabled: false },
        enableMouseTracking: false,
        showInLegend: true,
        data: categories.map(() => avgTop10Display),
        zIndex: 5,
      },
      {
        type: "line",
        name: labelAvgAll,
        color: colors.avgAll,
        dashStyle: "Dot" as Highcharts.DashStyleValue,
        lineWidth: 2,
        marker: { enabled: false },
        enableMouseTracking: false,
        showInLegend: true,
        data: categories.map(() => avgAllDisplay),
        zIndex: 5,
      },
    ],
  };

  return CreateChartOptions("bar", newOptions);
}
