import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";
import { CreateChartOptions } from "../../../../components/chart-ep";
import { PanelDetailItem } from "./query";
import { getI18nLabel } from "../../../../../../utils";
import { getCssColor } from "../../../../../../utils/colors";
import { formatNumber, formatToRates } from "../../../../../../utils/format";
import i18nGlobal from "../../../../i18n-global.json";
import i18n from "../../i18n.json";

const DOMAIN_COLORS: Record<string, string> = {
  LS: "erc-domain-ls-color",
  PE: "erc-domain-pe-color",
  SH: "erc-domain-sh-color",
};

// Fonction de tri naturel pour les panel_id (ex: PE1, PE2, PE10 au lieu de PE1, PE10, PE2)
function naturalSortPanelId(a: string, b: string): number {
  const regex = /^([A-Z]+)(\d+)$/;
  const matchA = a.match(regex);
  const matchB = b.match(regex);

  if (matchA && matchB) {
    const prefixCompare = matchA[1].localeCompare(matchB[1]);
    if (prefixCompare !== 0) return prefixCompare;
    return parseInt(matchA[2], 10) - parseInt(matchB[2], 10);
  }
  return a.localeCompare(b);
}

interface OptionsProjectsProps {
  data: PanelDetailItem[];
  domain: string;
  currentLang: string;
  viewMode?: "projects" | "pi";
}

export default function OptionsProjects({ data, domain, currentLang, viewMode = "projects" }: OptionsProjectsProps) {
  const filteredData = data.filter((item) => item.domaine_scientifique === domain);

  if (filteredData.length === 0) return null;
  const isPIs = viewMode === "pi";

  const sortedData = [...filteredData].sort((a, b) => naturalSortPanelId(a.panel_id, b.panel_id));

  const categories = sortedData.map((item) => item.panel_name);
  const evaluatedData = sortedData.map((item) => (isPIs ? item.evaluated?.total_pi : item.evaluated?.total_projects) || 0);
  const successfulData = sortedData.map((item) => (isPIs ? item.successful?.total_pi : item.successful?.total_projects) || 0);
  const successRates = isPIs
    ? []
    : sortedData.map((item) => {
        const evaluated = item.evaluated?.total_projects || 0;
        const successful = item.successful?.total_projects || 0;
        return evaluated > 0 ? (successful / evaluated) * 100 : 0;
      });

  const evaluatedColor = getCssColor("evaluated-project-color");
  const successRateColor = getCssColor("average-success-rate-color");
  const domainColor = getCssColor(DOMAIN_COLORS[domain] || DOMAIN_COLORS.LS);

  const domainLabel = getI18nLabel(i18n, `domains.${domain}`, currentLang);
  const titleText = getI18nLabel(i18n, isPIs ? "panelDetail.piTitle" : "panelDetail.projectsTitle", currentLang).replace("{domain}", domainLabel);

  const newOptions: HighchartsInstance.Options = {
    chart: {
      height: 400,
      ...(!isPIs && {
        events: {
          render(this: any) {
            (this._stems || []).forEach((el: any) => el.destroy());
            this._stems = [];
            const scatter = this.series.find((s: any) => s.type === "scatter");
            if (!scatter) return;
            const y0 = (this.yAxis[1] as any).toPixels(0);
            scatter.points.forEach((point: any) => {
              if (point.plotX == null || point.plotY == null) return;
              this._stems.push(
                this.renderer
                  .path(["M", this.plotLeft + point.plotX, y0, "L", this.plotLeft + point.plotX, this.plotTop + point.plotY])
                  .attr({ stroke: successRateColor, "stroke-width": 1.5, dashstyle: "Dot", zIndex: 3 })
                  .add(),
              );
            });
          },
        },
      }),
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
      crosshair: true,
      title: {
        text: getI18nLabel(i18n, "panelDetail.panel", currentLang),
      },
      labels: {
        rotation: -45,
        style: { fontSize: "11px" },
      },
    },
    yAxis: isPIs
      ? [
          {
            title: {
              text: getI18nLabel(i18nGlobal, "pi", currentLang),
              style: { fontSize: "13px" },
            },
            min: 0,
          },
        ]
      : [
          {
            title: {
              text: getI18nLabel(i18nGlobal, "total-projects", currentLang),
              style: { fontSize: "13px" },
            },
            min: 0,
          },
          {
            title: {
              text: getI18nLabel(i18nGlobal, "success-rate-percent", currentLang),
              style: { fontSize: "13px", color: successRateColor },
            },
            opposite: true,
            min: 0,
            max: 100,
            labels: {
              format: "{value}%",
              style: { color: successRateColor },
            },
          },
        ],
    legend: {
      align: "center",
      verticalAlign: "bottom",
      layout: "horizontal",
    },
    tooltip: {
      shared: true,
      useHTML: true,
      formatter: function () {
        const points = this.points;
        if (!points || points.length === 0) return "";

        const panelData = sortedData[points[0].index];
        const header = panelData ? `${panelData.panel_id} - ${panelData.panel_name}` : String(this.x);

        let html = `<strong>${header}</strong><br/>`;
        points.forEach((point) => {
          const value = point.y || 0;
          const formatted = point.series.type === "scatter" ? formatToRates(value / 100) : formatNumber(value);
          html += `<span style="color:${point.color}">●</span> ${point.series.name}: <strong>${formatted}</strong><br/>`;
        });
        return html;
      },
    },
    plotOptions: {
      column: {
        grouping: true,
        borderWidth: 0,
        borderRadius: 2,
      },
    },
    series: [
      {
        type: "column",
        name: isPIs
          ? getI18nLabel(i18n, "panelDetail.evaluatedPIs", currentLang)
          : getI18nLabel(i18nGlobal, "evaluated-projects", currentLang),
        color: evaluatedColor,
        data: evaluatedData,
        yAxis: 0,
      },
      {
        type: "column",
        name: isPIs
          ? getI18nLabel(i18n, "panelDetail.successfulPIs", currentLang)
          : getI18nLabel(i18nGlobal, "successful-projects", currentLang),
        color: domainColor,
        data: successfulData,
        yAxis: 0,
      },
      ...(!isPIs
        ? [
            {
              type: "scatter",
              name: getI18nLabel(i18nGlobal, "success-rate", currentLang),
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
          ]
        : []),
    ],
  };

  return CreateChartOptions("column", newOptions);
}
