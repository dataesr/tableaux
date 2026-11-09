import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SegmentedControl, SegmentedElement } from "@dataesr/dsfr-plus";

import { getData, PanelChartItem } from "./query";
import OptionsProjects from "./options";
import OptionsFunding from "./options-funding";

import ChartWrapper from "../../../../../../components/chart-wrapper";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";

import { getI18nLabel } from "../../../../../../utils";
import { formatNumber, formatToRates, formatCurrency } from "../../../../../../utils/format";
import i18nGlobal from "../../../../i18n-global.json";
import i18n from "../../i18n.json";

interface PanelChartProps {
  countryCode?: string;
  callYear?: string;
  currentLang?: string;
}

const configProjects = {
  id: "ercPanelChartProjects",
  idQuery: "ercPanelChart",
  comment: {
    fr: <>{getI18nLabel(i18n, "panelChart.projects.comment", "fr")}</>,
    en: <>{getI18nLabel(i18n, "panelChart.projects.comment", "en")}</>,
  },
  readingKey: {
    fr: <>{getI18nLabel(i18n, "panelChart.projects.readingKey", "fr")}</>,
    en: <>{getI18nLabel(i18n, "panelChart.projects.readingKey", "en")}</>,
  },
  integrationURL: "/european-projects/components/pages/erc/charts/panel-chart",
};

const configFunding = {
  id: "ercPanelChartFunding",
  idQuery: "ercPanelChart",
  comment: {
    fr: <>{getI18nLabel(i18n, "panelChart.funding.comment", "fr")}</>,
    en: <>{getI18nLabel(i18n, "panelChart.funding.comment", "en")}</>,
  },
  readingKey: {
    fr: <>{getI18nLabel(i18n, "panelChart.funding.readingKey", "fr")}</>,
    en: <>{getI18nLabel(i18n, "panelChart.funding.readingKey", "en")}</>,
  },
  integrationURL: "/european-projects/components/pages/erc/charts/panel-chart-funding",
};

const configPIs = {
  id: "ercPanelChartPIs",
  idQuery: "ercPanelChart",
  comment: {
    fr: <>Ce graphique présente le nombre de porteurs de projets évalués et lauréats par domaine scientifique ERC.</>,
    en: <>This chart shows the number of evaluated and successful project PIs by ERC scientific domain.</>,
  },
  readingKey: {
    fr: <>Les barres distinguent les porteurs de projets évalués et lauréats pour chaque domaine scientifique.</>,
    en: <>The bars distinguish evaluated and successful project PIs for each scientific domain.</>,
  },
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
        evaluatedFunding: 0,
        successfulFunding: 0,
        evaluatedPIs: 0,
        successfulPIs: 0,
      });
    }

    const agg = domainAggregates.get(domain)!;
    agg.evaluatedCount += item.evaluated?.total_projects || 0;
    agg.successfulCount += item.successful?.total_projects || 0;
    agg.evaluatedFunding += item.evaluated?.total_funding_entity || 0;
    agg.successfulFunding += item.successful?.total_funding_entity || 0;
    agg.evaluatedPIs += item.evaluated?.total_pi || 0;
    agg.successfulPIs += item.successful?.total_pi || 0;
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
      <caption>{getI18nLabel(i18n, "panelChart.projects.title", currentLang)}</caption>
      <thead>
        <tr>
          <th>{getI18nLabel(i18n, "panelFunding.tableScientificDomain", currentLang)}</th>
          <th>{getI18nLabel(i18nGlobal, "evaluated-projects", currentLang)}</th>
          <th>{getI18nLabel(i18nGlobal, "successful-projects", currentLang)}</th>
          <th>{getI18nLabel(i18nGlobal, "success-rate", currentLang)}</th>
        </tr>
      </thead>
      <tbody>
        {sortedDomains.map((item) => {
          const successRate = item.evaluatedCount > 0 ? item.successfulCount / item.evaluatedCount : 0;
          const name = getI18nLabel(i18n, `domains.${item.domain}`, currentLang) || item.domainName;

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
      <caption>{getI18nLabel(i18n, "panelChart.funding.title", currentLang)}</caption>
      <thead>
        <tr>
          <th>{getI18nLabel(i18n, "panelFunding.tableScientificDomain", currentLang)}</th>
          <th>{getI18nLabel(i18nGlobal, "requested-amount-millions", currentLang)}</th>
          <th>{getI18nLabel(i18nGlobal, "obtained-amount-millions", currentLang)}</th>
          <th>{getI18nLabel(i18nGlobal, "success-rate", currentLang)}</th>
        </tr>
      </thead>
      <tbody>
        {sortedDomains.map((item) => {
          const successRate = item.evaluatedFunding > 0 ? item.successfulFunding / item.evaluatedFunding : 0;
          const name = getI18nLabel(i18n, `domains.${item.domain}`, currentLang) || item.domainName;

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

function renderDataTablePIs(data: PanelChartItem[], currentLang: string) {
  const sortedDomains = aggregateByDomain(data);

  return (
    <table className="fr-table">
      <caption>{currentLang === "fr" ? "Porteurs de projets par domaine scientifique ERC" : "Project PIs by ERC scientific domain"}</caption>
      <thead>
        <tr>
          <th>{getI18nLabel(i18n, "panelFunding.tableScientificDomain", currentLang)}</th>
          <th>{getI18nLabel(i18n, "panelDetail.evaluatedPIs", currentLang)}</th>
          <th>{getI18nLabel(i18n, "panelDetail.successfulPIs", currentLang)}</th>
        </tr>
      </thead>
      <tbody>
        {sortedDomains.map((item) => {
          const name = getI18nLabel(i18n, `domains.${item.domain}`, currentLang) || item.domainName;
          return (
            <tr key={item.domain}>
              <td>{name}</td>
              <td>{formatNumber(item.evaluatedPIs)}</td>
              <td>{formatNumber(item.successfulPIs)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

type PanelProjectsView = "projects" | "pi";

export function PanelChartProjects({ countryCode: propCountryCode, callYear: propCallYear, currentLang: propLang, viewMode = "projects" }: PanelChartProps & { viewMode?: PanelProjectsView }) {
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

  const config = viewMode === "pi" ? configPIs : configProjects;
  const options = OptionsProjects({ data, currentLang, viewMode });

  if (!options) return null;

  return (
    <div className="fr-my-3w chart-container chart-container--default">
      <ChartWrapper key={config.id} config={config} options={options} renderData={() => (viewMode === "pi" ? renderDataTablePIs(data, currentLang) : renderDataTableProjects(data, currentLang))} />
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

type ViewMode = "projects" | "funding" | "pi";

interface PanelChartWithSelectorProps {
  countryCode?: string;
  callYear?: string;
  currentLang?: string;
}

export default function PanelChart({ countryCode, callYear, currentLang: propLang }: PanelChartWithSelectorProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("pi");
  const [searchParams] = useSearchParams();
  const currentLang = propLang || searchParams.get("language") || "fr";

  return (
    <div className="fr-my-3w">
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
        <SegmentedControl className="fr-segmented--sm" name="panel-chart-view-mode">
          <SegmentedElement checked={viewMode === "pi"} label={getI18nLabel(i18nGlobal, "pi", currentLang)} onClick={() => setViewMode("pi")} value="pi" />
          <SegmentedElement checked={viewMode === "funding"} label={getI18nLabel(i18nGlobal, "total-fund-eur", currentLang)} onClick={() => setViewMode("funding")} value="funding" />
          <SegmentedElement checked={viewMode === "projects"} label={getI18nLabel(i18nGlobal, "projects", currentLang)} onClick={() => setViewMode("projects")} value="projects" />
        </SegmentedControl>
      </div>
      {viewMode === "funding" ? <PanelChartFunding countryCode={countryCode} callYear={callYear} currentLang={currentLang} /> : <PanelChartProjects countryCode={countryCode} callYear={callYear} currentLang={currentLang} viewMode={viewMode} />}
    </div>
  );
}
