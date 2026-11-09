import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";
import { CreateChartOptions } from "../../../../components/chart-ep";
import type { PanelChartItem } from "./query";
import { getI18nLabel } from "../../../../../../utils";
import { getCssColor } from "../../../../../../utils/colors";
import { formatNumber, formatToRates } from "../../../../../../utils/format";
import i18nGlobal from "../../../../i18n-global.json";
import i18n from "../../i18n.json";

const DOMAIN_CSS_VARS: Record<string, string> = {
  LS: "erc-domain-ls-color",
  PE: "erc-domain-pe-color",
  SH: "erc-domain-sh-color",
};

// Ordre de tri des domaines
const DOMAIN_ORDER = ["LS", "PE", "SH"];

interface OptionsParams {
  data: PanelChartItem[];
  currentLang?: string;
  viewMode?: "projects" | "pi";
}

export default function OptionsProjects({ data, currentLang = "fr", viewMode = "projects" }: OptionsParams) {
  if (!data || data.length === 0) return null;
  const isPIs = viewMode === "pi";

  // Filtrer les données avec domaine_scientifique valide (LS, PE, SH)
  const validDomains = ["LS", "PE", "SH"];
  const filteredData = data.filter((item) => validDomains.includes(item.domaine_scientifique));

  if (filteredData.length === 0) return null;

  // Agréger par domaine scientifique
  const domainAggregates = new Map<
    string,
    {
      domain: string;
      domainName: string;
      evaluatedCount: number;
      successfulCount: number;
      evaluatedPIs: number;
      successfulPIs: number;
    }
  >();

  filteredData.forEach((item) => {
    const domain = item.domaine_scientifique;
    if (!domainAggregates.has(domain)) {
      domainAggregates.set(domain, {
        domain,
        domainName: item.domaine_name_scientifique,
        evaluatedCount: 0,
        successfulCount: 0,
        evaluatedPIs: 0,
        successfulPIs: 0,
      });
    }

    const agg = domainAggregates.get(domain)!;
    agg.evaluatedCount += item.evaluated?.total_projects || 0;
    agg.successfulCount += item.successful?.total_projects || 0;
    agg.evaluatedPIs += item.evaluated?.total_pi || 0;
    agg.successfulPIs += item.successful?.total_pi || 0;
  });

  // Trier selon l'ordre défini
  const sortedDomains = Array.from(domainAggregates.values()).sort((a, b) => {
    const indexA = DOMAIN_ORDER.indexOf(a.domain);
    const indexB = DOMAIN_ORDER.indexOf(b.domain);
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });

  // Préparer les catégories
  const categories = sortedDomains.map((d) => d.domain);

  const getDomainColor = (domain: string) => getCssColor(DOMAIN_CSS_VARS[domain] || DOMAIN_CSS_VARS.LS);

  // Préparer les données pour les barres
  const evaluatedData = sortedDomains.map((d) => (isPIs ? d.evaluatedPIs : d.evaluatedCount));
  const successfulData = sortedDomains.map((d) => ({
    y: isPIs ? d.successfulPIs : d.successfulCount,
    color: getDomainColor(d.domain),
  }));

  // Calculer les taux de succès
  const successRates = isPIs
    ? []
    : sortedDomains.map((d) => {
        return d.evaluatedCount > 0 ? (d.successfulCount / d.evaluatedCount) * 100 : 0;
      });

  const evaluatedColor = getCssColor("evaluated-project-color");
  const successRateColor = getCssColor("average-success-rate-color");

  const titleText = isPIs
    ? currentLang === "fr"
      ? "Porteurs de projets par domaine scientifique ERC"
      : "Project PIs by ERC scientific domain"
    : getI18nLabel(i18n, "panelChart.projects.title", currentLang);

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
      labels: {
        formatter: function () {
          const code = this.value as string;
          return getI18nLabel(i18n, `domains.${code}`, currentLang);
        },
        style: { fontSize: "12px" },
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
        if (!points) return "";

        const domainCode = String(this.key);
        const domainName = getI18nLabel(i18n, `domains.${domainCode}`, currentLang);

        let html = `<strong>${domainName}</strong><br/>`;

        points.forEach((point) => {
          const seriesName = point.series.name;
          const value = point.y || 0;

          if (point.series.type === "scatter") {
            html += `<span style="color:${point.color}">●</span> ${seriesName}: <strong>${formatToRates(value / 100)}</strong><br/>`;
          } else {
            html += `<span style="color:${point.color}">●</span> ${seriesName}: <strong>${formatNumber(value)}</strong><br/>`;
          }
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
