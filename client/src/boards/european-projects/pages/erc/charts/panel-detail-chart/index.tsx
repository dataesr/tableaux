import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SegmentedControl, SegmentedElement } from "@dataesr/dsfr-plus";

import { getData, PanelDetailItem } from "./query";
import OptionsProjects from "./options";
import OptionsFunding from "./options-funding";

import ChartWrapper from "../../../../../../components/chart-wrapper";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";

import { formatNumber, formatToRates, formatCurrency } from "../../../../../../utils/format";

interface PanelDetailChartProps {
  countryCode?: string;
  callYear?: string;
  currentLang?: string;
}

// Labels des domaines scientifiques
const DOMAIN_LABELS: Record<string, { fr: string; en: string }> = {
  LS: { fr: "Sciences de la vie", en: "Life Sciences" },
  PE: { fr: "Sciences physiques et ingénierie", en: "Physical Sciences & Engineering" },
  SH: { fr: "Sciences sociales et humaines", en: "Social Sciences & Humanities" },
};

// Variables CSS pour les couleurs de domaine
const DOMAIN_CSS_VARS: Record<string, string> = {
  LS: "var(--erc-domain-ls-color)",
  PE: "var(--erc-domain-pe-color)",
  SH: "var(--erc-domain-sh-color)",
};

// Ordre des domaines
const DOMAIN_ORDER = ["LS", "PE", "SH"];

// Fonction de tri naturel
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

const configProjects = {
  id: "ercPanelDetailChartProjects",
  idQuery: "ercPanelDetailChart",
  comment: {
    fr: (
      <>
        Ce graphique présente le nombre de projets évalués et lauréats par panel ERC au sein du domaine scientifique sélectionné. La ligne orange
        représente le taux de succès pour chaque panel.
      </>
    ),
    en: (
      <>
        This chart shows the number of evaluated and successful projects by ERC panel within the selected scientific domain. The orange line
        represents the success rate for each panel.
      </>
    ),
  },
  readingKey: {
    fr: (
      <>
        Les barres bleues représentent les projets évalués, les barres colorées les projets lauréats. Un taux de succès élevé indique une meilleure
        performance pour ce panel.
      </>
    ),
    en: (
      <>
        Blue bars represent evaluated projects, colored bars represent successful projects. A high success rate indicates better performance for that
        panel.
      </>
    ),
  },
  integrationURL: "/european-projects/components/pages/erc/charts/panel-detail-chart",
};

const configFunding = {
  id: "ercPanelDetailChartFunding",
  idQuery: "ercPanelDetailChart",
  comment: {
    fr: (
      <>
        Ce graphique présente les financements demandés et obtenus par panel ERC au sein du domaine scientifique sélectionné. La ligne orange
        représente le taux de succès en termes de financement.
      </>
    ),
    en: (
      <>
        This chart shows the requested and obtained funding by ERC panel within the selected scientific domain. The orange line represents the success
        rate in terms of funding.
      </>
    ),
  },
  readingKey: {
    fr: (
      <>
        Les barres bleues représentent les financements demandés, les barres colorées les financements obtenus. Un taux de succès élevé indique une
        meilleure performance pour ce panel.
      </>
    ),
    en: (
      <>
        Blue bars represent requested funding, colored bars represent obtained funding. A high success rate indicates better performance for that
        panel.
      </>
    ),
  },
  integrationURL: "/european-projects/components/pages/erc/charts/panel-detail-chart-funding",
};

function useGetParams() {
  const [searchParams] = useSearchParams();

  const params: string[] = [];

  const countryCode = searchParams.get("country_code");
  if (countryCode) {
    params.push(`country_code=${countryCode}`);
  }

  const rangeOfYears = searchParams.get("range_of_years");
  if (rangeOfYears) {
    const [startYear, endYear] = rangeOfYears.split("-").map(Number);
    const years: string[] = [];
    for (let year = startYear; year <= endYear; year++) {
      years.push(year.toString());
    }
    params.push(`call_year=${years.join(",")}`);
  }

  const currentLang = searchParams.get("language") || "fr";

  return { params: params.join("&"), currentLang };
}

function renderDataTableProjects(data: PanelDetailItem[], domain: string, currentLang: string) {
  const filteredData = data.filter((item) => item.domaine_scientifique === domain).sort((a, b) => naturalSortPanelId(a.panel_id, b.panel_id));

  const domainLabel = DOMAIN_LABELS[domain]?.[currentLang as "fr" | "en"] || domain;

  return (
    <table className="fr-table">
      <caption>{currentLang === "fr" ? `Projets par panel - ${domainLabel}` : `Projects by panel - ${domainLabel}`}</caption>
      <thead>
        <tr>
          <th>{currentLang === "fr" ? "Panel" : "Panel"}</th>
          <th>{currentLang === "fr" ? "Nom" : "Name"}</th>
          <th>{currentLang === "fr" ? "Projets évalués" : "Evaluated"}</th>
          <th>{currentLang === "fr" ? "Projets lauréats" : "Successful"}</th>
          <th>{currentLang === "fr" ? "Taux de succès" : "Success rate"}</th>
        </tr>
      </thead>
      <tbody>
        {filteredData.map((item) => {
          const evaluated = item.evaluated?.total_involved || 0;
          const successful = item.successful?.total_involved || 0;
          const successRate = evaluated > 0 ? successful / evaluated : 0;

          return (
            <tr key={item.panel_id}>
              <td>{item.panel_id}</td>
              <td>{item.panel_name}</td>
              <td>{formatNumber(evaluated)}</td>
              <td>{formatNumber(successful)}</td>
              <td>{formatToRates(successRate)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function renderDataTableFunding(data: PanelDetailItem[], domain: string, currentLang: string) {
  const filteredData = data.filter((item) => item.domaine_scientifique === domain).sort((a, b) => naturalSortPanelId(a.panel_id, b.panel_id));

  const domainLabel = DOMAIN_LABELS[domain]?.[currentLang as "fr" | "en"] || domain;

  return (
    <table className="fr-table">
      <caption>{currentLang === "fr" ? `Financements par panel - ${domainLabel}` : `Funding by panel - ${domainLabel}`}</caption>
      <thead>
        <tr>
          <th>{currentLang === "fr" ? "Panel" : "Panel"}</th>
          <th>{currentLang === "fr" ? "Nom" : "Name"}</th>
          <th>{currentLang === "fr" ? "Financements demandés" : "Requested"}</th>
          <th>{currentLang === "fr" ? "Financements obtenus" : "Obtained"}</th>
          <th>{currentLang === "fr" ? "Taux de succès" : "Success rate"}</th>
        </tr>
      </thead>
      <tbody>
        {filteredData.map((item) => {
          const requested = item.evaluated?.total_funding_entity || 0;
          const obtained = item.successful?.total_funding_entity || 0;
          const successRate = requested > 0 ? obtained / requested : 0;

          return (
            <tr key={item.panel_id}>
              <td>{item.panel_id}</td>
              <td>{item.panel_name}</td>
              <td>{formatCurrency(requested)}</td>
              <td>{formatCurrency(obtained)}</td>
              <td>{formatToRates(successRate)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

type ViewMode = "projects" | "funding";

export default function PanelDetailChart({ countryCode: propCountryCode, callYear: propCallYear, currentLang: propLang }: PanelDetailChartProps) {
  const [selectedDomain, setSelectedDomain] = useState<string>("LS");
  const [viewMode, setViewMode] = useState<ViewMode>("projects");
  const { params: urlParams, currentLang: urlLang } = useGetParams();
  const currentLang = propLang || urlLang;

  let params = urlParams;
  if (propCountryCode || propCallYear) {
    const customParams: string[] = [];
    if (propCountryCode) customParams.push(`country_code=${propCountryCode}`);
    if (propCallYear) customParams.push(`call_year=${propCallYear}`);
    params = customParams.join("&");
  }

  const { data, isLoading } = useQuery({
    queryKey: ["ercPanelDetailChart", params],
    queryFn: () => getData(params),
    enabled: params !== "",
  });

  if (isLoading || !data) return <DefaultSkeleton />;

  // Vérifier quels domaines ont des données
  const availableDomains = DOMAIN_ORDER.filter((domain) => data.some((item) => item.domaine_scientifique === domain));

  if (availableDomains.length === 0) return null;

  // S'assurer que le domaine sélectionné est disponible
  const effectiveDomain = availableDomains.includes(selectedDomain) ? selectedDomain : availableDomains[0];

  const config = viewMode === "projects" ? configProjects : configFunding;
  const options =
    viewMode === "projects"
      ? OptionsProjects({ data, domain: effectiveDomain, currentLang })
      : OptionsFunding({ data, domain: effectiveDomain, currentLang });

  if (!options) return null;

  return (
    <div className="fr-my-3w">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
        {/* Sélecteur de domaine */}
        <SegmentedControl className="fr-segmented--sm" name="panel-detail-domain">
          {availableDomains.map((domain) => {
            const domainColor = DOMAIN_CSS_VARS[domain];
            const label = DOMAIN_LABELS[domain]?.[currentLang as "fr" | "en"] || domain;
            return (
              <SegmentedElement
                key={domain}
                checked={effectiveDomain === domain}
                label={label}
                onClick={() => setSelectedDomain(domain)}
                value={domain}
                style={effectiveDomain === domain ? { backgroundColor: domainColor, color: "white", borderColor: domainColor } : {}}
              />
            );
          })}
        </SegmentedControl>

        {/* Sélecteur projets/financements */}
        <SegmentedControl className="fr-segmented--sm" name="panel-detail-view-mode">
          <SegmentedElement checked={viewMode === "projects"} label={currentLang === "fr" ? "Projets" : "Projects"} onClick={() => setViewMode("projects")} value="projects" />
          <SegmentedElement checked={viewMode === "funding"} label={currentLang === "fr" ? "Financements" : "Funding"} onClick={() => setViewMode("funding")} value="funding" />
        </SegmentedControl>
      </div>

      <div className="chart-container chart-container--default">
        <ChartWrapper config={config} options={options} renderData={() => (viewMode === "projects" ? renderDataTableProjects(data, effectiveDomain, currentLang) : renderDataTableFunding(data, effectiveDomain, currentLang))} />
      </div>
    </div>
  );
}
