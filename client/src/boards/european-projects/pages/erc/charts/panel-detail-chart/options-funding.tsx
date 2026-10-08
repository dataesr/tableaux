import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";
import { CreateChartOptions } from "../../../../components/chart-ep";
import { PanelDetailItem } from "./query";

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

interface OptionsFundingProps {
  data: PanelDetailItem[];
  domain: string;
  currentLang: string;
}

export default function OptionsFunding({ data, domain, currentLang }: OptionsFundingProps) {
  // Filtrer par domaine sélectionné
  const filteredData = data.filter((item) => item.domaine_scientifique === domain);

  if (filteredData.length === 0) return null;

  // Trier par ordre naturel des panel_id
  const sortedData = [...filteredData].sort((a, b) => naturalSortPanelId(a.panel_id, b.panel_id));

  // Préparer les données pour le graphique (en millions d'euros)
  const categories = sortedData.map((item) => item.panel_name);
  const requestedData = sortedData.map((item) => (item.evaluated?.total_funding_entity || 0) / 1_000_000);
  const obtainedData = sortedData.map((item) => (item.successful?.total_funding_entity || 0) / 1_000_000);
  const successRates = sortedData.map((item) => {
    const requested = item.evaluated?.total_funding_entity || 0;
    const obtained = item.successful?.total_funding_entity || 0;
    return requested > 0 ? (obtained / requested) * 100 : 0;
  });

  // Couleurs depuis les variables CSS
  const rootStyles = getComputedStyle(document.documentElement);
  const domainColor = rootStyles.getPropertyValue(DOMAIN_CSS_VARS[domain] || "--erc-domain-ls-color").trim() || "#6b7280";
  const successRateColor = rootStyles.getPropertyValue("--average-success-rate-color").trim() || "#d75521";

  const newOptions: HighchartsInstance.Options = {
    chart: {
      height: 400,
    },
    title: {
      text: currentLang === "fr" ? `Financements par panel - ${DOMAIN_LABELS[domain]?.fr || domain}` : `Funding by panel - ${DOMAIN_LABELS[domain]?.en || domain}`,
    },
    xAxis: {
      categories,
      title: {
        text: currentLang === "fr" ? "Panel" : "Panel",
      },
      labels: {
        rotation: -45,
        style: {
          fontSize: "11px",
        },
      },
    },
    yAxis: [
      {
        title: {
          text: currentLang === "fr" ? "Financement (M€)" : "Funding (M€)",
        },
        min: 0,
        labels: {
          format: "{value} M€",
        },
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
    tooltip: {
      shared: true,
      useHTML: true,
      formatter: function () {
        const points = this.points;
        if (!points || points.length === 0) return "";

        // Utiliser l'index de la catégorie
        const categoryIndex = typeof this.x === "number" ? this.x : categories.indexOf(String(this.x));
        const panelData = sortedData[categoryIndex];
        if (!panelData) return "";

        const requested = panelData.evaluated?.total_funding_entity || 0;
        const obtained = panelData.successful?.total_funding_entity || 0;
        const rate = requested > 0 ? ((obtained / requested) * 100).toFixed(1) : "0";

        const formatEuros = (val: number) => {
          if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(2)} Md€`;
          if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(2)} M€`;
          return `${val.toLocaleString()} €`;
        };

        return `
          <div style="padding: 8px;">
            <strong>${panelData.panel_id}</strong><br/>
            <span style="color: #666; font-size: 11px;">${panelData.panel_name}</span><br/><br/>
            <span style="color: var(--evaluated-project-color);">●</span> ${currentLang === "fr" ? "Demandés" : "Requested"}: <strong>${formatEuros(requested)}</strong><br/>
            <span style="color: ${domainColor};">●</span> ${currentLang === "fr" ? "Obtenus" : "Obtained"}: <strong>${formatEuros(obtained)}</strong><br/>
            <span style="color: var(--average-success-rate-color);">●</span> ${currentLang === "fr" ? "Taux de succès" : "Success rate"}: <strong>${rate}%</strong>
          </div>
        `;
      },
    },
    legend: {
      align: "center" as const,
      verticalAlign: "bottom" as const,
    },
    plotOptions: {
      column: {
        borderRadius: 3,
        groupPadding: 0.1,
        pointPadding: 0.05,
      },
      spline: {
        marker: {
          enabled: true,
          radius: 4,
        },
        lineWidth: 2,
      },
    },
    series: [
      {
        name: currentLang === "fr" ? "Financements demandés" : "Requested funding",
        type: "column",
        data: requestedData,
        color: "var(--evaluated-project-color)",
        yAxis: 0,
      },
      {
        name: currentLang === "fr" ? "Financements obtenus" : "Obtained funding",
        type: "column",
        data: obtainedData,
        color: domainColor,
        yAxis: 0,
      },
      {
        name: currentLang === "fr" ? "Taux de succès" : "Success rate",
        type: "spline",
        data: successRates,
        color: "var(--average-success-rate-color)",
        yAxis: 1,
        tooltip: {
          valueSuffix: " %",
        },
        marker: {
          symbol: "circle",
        },
      },
    ],
  };

  return CreateChartOptions("column", newOptions);
}
