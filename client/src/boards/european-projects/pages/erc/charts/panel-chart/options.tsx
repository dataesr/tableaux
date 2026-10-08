import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";
import { CreateChartOptions } from "../../../../components/chart-ep";
import type { PanelChartItem } from "./query";
import { formatNumber, formatToRates } from "../../../../../../utils/format";

// Mapping des domaines vers les variables CSS
const DOMAIN_CSS_VARS: Record<string, string> = {
  LS: "--erc-domain-ls-color",
  PE: "--erc-domain-pe-color",
  SH: "--erc-domain-sh-color",
};

// Labels des domaines scientifiques
const DOMAIN_LABELS: Record<string, { fr: string; en: string }> = {
  LS: { fr: "Sciences de la vie", en: "Life Sciences" },
  PE: { fr: "Sciences physiques et ingénierie", en: "Physical Sciences & Engineering" },
  SH: { fr: "Sciences sociales et humaines", en: "Social Sciences & Humanities" },
};

// Ordre de tri des domaines
const DOMAIN_ORDER = ["LS", "PE", "SH"];

interface OptionsParams {
  data: PanelChartItem[];
  currentLang?: string;
}

export default function OptionsProjects({ data, currentLang = "fr" }: OptionsParams) {
  if (!data || data.length === 0) return null;

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
      });
    }

    const agg = domainAggregates.get(domain)!;
    agg.evaluatedCount += item.evaluated?.total_involved || 0;
    agg.successfulCount += item.successful?.total_involved || 0;
  });

  // Trier selon l'ordre défini
  const sortedDomains = Array.from(domainAggregates.values()).sort((a, b) => {
    const indexA = DOMAIN_ORDER.indexOf(a.domain);
    const indexB = DOMAIN_ORDER.indexOf(b.domain);
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });

  // Préparer les catégories
  const categories = sortedDomains.map((d) => d.domain);

  // Récupérer les couleurs CSS
  const rootStyles = getComputedStyle(document.documentElement);
  const getDomainColor = (domain: string) => rootStyles.getPropertyValue(DOMAIN_CSS_VARS[domain] || "--erc-domain-ls-color").trim() || "#666666";

  // Préparer les données pour les barres
  const evaluatedData = sortedDomains.map((d) => d.evaluatedCount);
  const successfulData = sortedDomains.map((d) => ({
    y: d.successfulCount,
    color: getDomainColor(d.domain),
  }));

  // Calculer les taux de succès
  const successRates = sortedDomains.map((d) => {
    return d.evaluatedCount > 0 ? (d.successfulCount / d.evaluatedCount) * 100 : 0;
  });

  // Récupérer les autres couleurs CSS
  const evaluatedColor = rootStyles.getPropertyValue("--evaluated-project-color").trim() || "#009099";
  const successRateColor = rootStyles.getPropertyValue("--average-success-rate-color").trim() || "#d75521";

  const titleText = currentLang === "fr" ? "Projets par domaine scientifique ERC" : "Projects by ERC scientific domain";

  const newOptions: HighchartsInstance.Options = {
    chart: {
      height: 400,
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
          return DOMAIN_LABELS[code]?.[currentLang] || code;
        },
        style: { fontSize: "12px" },
      },
    },
    yAxis: [
      {
        title: {
          text: currentLang === "fr" ? "Nombre de projets" : "Number of projects",
          style: { fontSize: "13px" },
        },
        min: 0,
      },
      {
        title: {
          text: currentLang === "fr" ? "Taux de succès (%)" : "Success rate (%)",
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

        const domainCode = String(this.x);
        const domainName = DOMAIN_LABELS[domainCode]?.[currentLang] || domainCode;

        let html = `<strong>${domainName}</strong><br/>`;

        points.forEach((point) => {
          const seriesName = point.series.name;
          const value = point.y || 0;

          if (point.series.type === "line") {
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
      line: {
        marker: {
          enabled: true,
          radius: 5,
        },
        lineWidth: 2,
      },
    },
    series: [
      {
        type: "column",
        name: currentLang === "fr" ? "Projets évalués" : "Evaluated projects",
        color: evaluatedColor,
        data: evaluatedData,
        yAxis: 0,
      },
      {
        type: "column",
        name: currentLang === "fr" ? "Projets lauréats" : "Successful projects",
        data: successfulData,
        yAxis: 0,
      },
      {
        type: "line",
        name: currentLang === "fr" ? "Taux de succès" : "Success rate",
        color: successRateColor,
        data: successRates,
        yAxis: 1,
        marker: {
          symbol: "circle",
        },
        zIndex: 5,
      },
    ],
  };

  return CreateChartOptions("column", newOptions);
}
