import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SegmentedControl, SegmentedElement } from "@dataesr/dsfr-plus";

import { getData, PanelChartItem } from "./query";
import OptionsProjects from "./options";
import OptionsFunding from "./options-funding";

import ChartWrapper from "../../../../../../components/chart-wrapper";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";

import { formatNumber, formatToRates, formatCurrency } from "../../../../../../utils/format";

interface PanelChartProps {
  countryCode?: string;
  callYear?: string;
  currentLang?: string;
}

const configProjects = {
  id: "ercPanelChartProjects",
  idQuery: "ercPanelChart",
  comment: {
    fr: (
      <>
        Ce graphique présente le nombre de projets évalués et lauréats par domaine scientifique ERC (Sciences de la vie, Sciences physiques et
        ingénierie, Sciences sociales et humaines). La ligne orange représente le taux de succès pour chaque domaine.
      </>
    ),
    en: (
      <>
        This chart shows the number of evaluated and successful projects by ERC scientific domain (Life Sciences, Physical Sciences and Engineering,
        Social Sciences and Humanities). The orange line represents the success rate for each domain.
      </>
    ),
  },
  readingKey: {
    fr: (
      <>
        Les barres bleues représentent les projets évalués, les barres vertes les projets lauréats. Un taux de succès élevé indique une meilleure
        performance pour ce domaine scientifique.
      </>
    ),
    en: (
      <>
        Blue bars represent evaluated projects, green bars represent successful projects. A high success rate indicates better performance for that
        scientific domain.
      </>
    ),
  },
  integrationURL: "/european-projects/components/pages/erc/charts/panel-chart",
};

const configFunding = {
  id: "ercPanelChartFunding",
  idQuery: "ercPanelChart",
  comment: {
    fr: (
      <>
        Ce graphique présente les financements demandés et obtenus par domaine scientifique ERC (Sciences de la vie, Sciences physiques et ingénierie,
        Sciences sociales et humaines). La ligne orange représente le taux de succès en termes de financement.
      </>
    ),
    en: (
      <>
        This chart shows the requested and obtained funding by ERC scientific domain (Life Sciences, Physical Sciences and Engineering, Social
        Sciences and Humanities). The orange line represents the success rate in terms of funding.
      </>
    ),
  },
  readingKey: {
    fr: (
      <>
        Les barres bleues représentent les financements demandés, les barres vertes les financements obtenus. Un taux de succès élevé indique une
        meilleure performance pour ce domaine scientifique.
      </>
    ),
    en: (
      <>
        Blue bars represent requested funding, green bars represent obtained funding. A high success rate indicates better performance for that
        scientific domain.
      </>
    ),
  },
  integrationURL: "/european-projects/components/pages/erc/charts/panel-chart-funding",
};

// Labels des domaines scientifiques
const DOMAIN_LABELS: Record<string, { fr: string; en: string }> = {
  LS: { fr: "Sciences de la vie", en: "Life Sciences" },
  PE: { fr: "Sciences physiques et ingénierie", en: "Physical Sciences & Engineering" },
  SH: { fr: "Sciences sociales et humaines", en: "Social Sciences & Humanities" },
};

// Ordre de tri des domaines
const DOMAIN_ORDER = ["LS", "PE", "SH"];

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

function aggregateByDomain(data: PanelChartItem[]) {
  const validDomains = ["LS", "PE", "SH"];
  const filteredData = data.filter((item) => validDomains.includes(item.domaine_scientifique));

  const domainAggregates = new Map<
    string,
    {
      domain: string;
      domainName: string;
      evaluatedCount: number;
      successfulCount: number;
      evaluatedFunding: number;
      successfulFunding: number;
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
        evaluatedFunding: 0,
        successfulFunding: 0,
      });
    }

    const agg = domainAggregates.get(domain)!;
    agg.evaluatedCount += item.evaluated?.total_involved || 0;
    agg.successfulCount += item.successful?.total_involved || 0;
    agg.evaluatedFunding += item.evaluated?.total_funding_entity || 0;
    agg.successfulFunding += item.successful?.total_funding_entity || 0;
  });

  return Array.from(domainAggregates.values()).sort((a, b) => {
    const indexA = DOMAIN_ORDER.indexOf(a.domain);
    const indexB = DOMAIN_ORDER.indexOf(b.domain);
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });
}

function renderDataTableProjects(data: PanelChartItem[], currentLang: string) {
  const sortedDomains = aggregateByDomain(data);

  return (
    <table className="fr-table">
      <caption>{currentLang === "fr" ? "Projets par domaine scientifique ERC" : "Projects by ERC scientific domain"}</caption>
      <thead>
        <tr>
          <th>{currentLang === "fr" ? "Domaine scientifique" : "Scientific domain"}</th>
          <th>{currentLang === "fr" ? "Projets évalués" : "Evaluated"}</th>
          <th>{currentLang === "fr" ? "Projets lauréats" : "Successful"}</th>
          <th>{currentLang === "fr" ? "Taux de succès" : "Success rate"}</th>
        </tr>
      </thead>
      <tbody>
        {sortedDomains.map((item) => {
          const successRate = item.evaluatedCount > 0 ? item.successfulCount / item.evaluatedCount : 0;
          const name = DOMAIN_LABELS[item.domain]?.[currentLang] || item.domainName;

          return (
            <tr key={item.domain}>
              <td>{name}</td>
              <td>{formatNumber(item.evaluatedCount)}</td>
              <td>{formatNumber(item.successfulCount)}</td>
              <td>{formatToRates(successRate)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function renderDataTableFunding(data: PanelChartItem[], currentLang: string) {
  const sortedDomains = aggregateByDomain(data);

  return (
    <table className="fr-table">
      <caption>{currentLang === "fr" ? "Financements par domaine scientifique ERC" : "Funding by ERC scientific domain"}</caption>
      <thead>
        <tr>
          <th>{currentLang === "fr" ? "Domaine scientifique" : "Scientific domain"}</th>
          <th>{currentLang === "fr" ? "Financements demandés" : "Requested"}</th>
          <th>{currentLang === "fr" ? "Financements obtenus" : "Obtained"}</th>
          <th>{currentLang === "fr" ? "Taux de succès" : "Success rate"}</th>
        </tr>
      </thead>
      <tbody>
        {sortedDomains.map((item) => {
          const successRate = item.evaluatedFunding > 0 ? item.successfulFunding / item.evaluatedFunding : 0;
          const name = DOMAIN_LABELS[item.domain]?.[currentLang] || item.domainName;

          return (
            <tr key={item.domain}>
              <td>{name}</td>
              <td>{formatCurrency(item.evaluatedFunding)}</td>
              <td>{formatCurrency(item.successfulFunding)}</td>
              <td>{formatToRates(successRate)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export function PanelChartProjects({ countryCode: propCountryCode, callYear: propCallYear, currentLang: propLang }: PanelChartProps) {
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
    queryKey: [configProjects.idQuery, params],
    queryFn: () => getData(params),
    enabled: params !== "",
  });

  if (isLoading || !data) return <DefaultSkeleton />;

  const options = OptionsProjects({ data, currentLang });

  if (!options) return null;

  return (
    <div className="fr-my-3w chart-container chart-container--default">
      <ChartWrapper config={configProjects} options={options} renderData={() => renderDataTableProjects(data, currentLang)} />
    </div>
  );
}

export function PanelChartFunding({ countryCode: propCountryCode, callYear: propCallYear, currentLang: propLang }: PanelChartProps) {
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
    queryKey: [configFunding.idQuery, params],
    queryFn: () => getData(params),
    enabled: params !== "",
  });

  if (isLoading || !data) return <DefaultSkeleton />;

  const options = OptionsFunding({ data, currentLang });

  if (!options) return null;

  return (
    <div className="fr-my-3w chart-container chart-container--default">
      <ChartWrapper config={configFunding} options={options} renderData={() => renderDataTableFunding(data, currentLang)} />
    </div>
  );
}

type ViewMode = "projects" | "funding";

interface PanelChartWithSelectorProps {
  countryCode?: string;
  callYear?: string;
  currentLang?: string;
}

export default function PanelChart({ countryCode, callYear, currentLang: propLang }: PanelChartWithSelectorProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("projects");
  const [searchParams] = useSearchParams();
  const currentLang = propLang || searchParams.get("language") || "fr";

  return (
    <div className="fr-my-3w">
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
        <SegmentedControl className="fr-segmented--sm" name="panel-chart-view-mode">
          <SegmentedElement
            checked={viewMode === "projects"}
            label={currentLang === "fr" ? "Projets" : "Projects"}
            onClick={() => setViewMode("projects")}
            value="projects"
          />
          <SegmentedElement
            checked={viewMode === "funding"}
            label={currentLang === "fr" ? "Financements" : "Funding"}
            onClick={() => setViewMode("funding")}
            value="funding"
          />
        </SegmentedControl>
      </div>
      {viewMode === "projects" ? (
        <PanelChartProjects countryCode={countryCode} callYear={callYear} currentLang={currentLang} />
      ) : (
        <PanelChartFunding countryCode={countryCode} callYear={callYear} currentLang={currentLang} />
      )}
    </div>
  );
}
