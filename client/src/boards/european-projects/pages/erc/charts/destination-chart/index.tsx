import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SegmentedControl, SegmentedElement } from "@dataesr/dsfr-plus";

import { getData, DestinationChartItem } from "./query";
import OptionsProjects from "./options";
import OptionsFunding from "./options-funding";

import ChartWrapper from "../../../../../../components/chart-wrapper";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";

import { formatNumber, formatToRates, formatCurrency } from "../../../../../../utils/format";

interface DestinationChartProps {
  countryCode?: string;
  callYear?: string;
  currentLang?: string;
}

const configProjects = {
  id: "ercDestinationChartProjects",
  idQuery: "ercDestinationChart",
  comment: {
    fr: (
      <>
        Ce graphique présente le nombre de projets évalués et lauréats par type de financement ERC (Starting, Consolidator, Advanced, Synergy, Proof
        of Concept). La ligne orange représente le taux de succès pour chaque type.
      </>
    ),
    en: (
      <>
        This chart shows the number of evaluated and successful projects by ERC funding type (Starting, Consolidator, Advanced, Synergy, Proof of
        Concept). The orange line represents the success rate for each type.
      </>
    ),
  },
  readingKey: {
    fr: (
      <>
        Les barres bleues représentent les projets évalués, les barres vertes les projets lauréats. Un taux de succès élevé indique une meilleure
        performance pour ce type de financement.
      </>
    ),
    en: (
      <>
        Blue bars represent evaluated projects, green bars represent successful projects. A high success rate indicates better performance for that
        funding type.
      </>
    ),
  },
  integrationURL: "/european-projects/components/pages/erc/charts/destination-chart",
};

const configFunding = {
  id: "ercDestinationChartFunding",
  idQuery: "ercDestinationChart",
  comment: {
    fr: (
      <>
        Ce graphique présente les financements demandés et obtenus par type de financement ERC (Starting, Consolidator, Advanced, Synergy, Proof of
        Concept). La ligne orange représente le taux de succès en termes de financement.
      </>
    ),
    en: (
      <>
        This chart shows the requested and obtained funding by ERC funding type (Starting, Consolidator, Advanced, Synergy, Proof of Concept). The
        orange line represents the success rate in terms of funding.
      </>
    ),
  },
  readingKey: {
    fr: (
      <>
        Les barres bleues représentent les financements demandés, les barres vertes les financements obtenus. Un taux de succès élevé indique une
        meilleure performance pour ce type de financement.
      </>
    ),
    en: (
      <>
        Blue bars represent requested funding, green bars represent obtained funding. A high success rate indicates better performance for that
        funding type.
      </>
    ),
  },
  integrationURL: "/european-projects/components/pages/erc/charts/destination-chart-funding",
};

// Mapping des codes de destination vers des noms lisibles
const DESTINATION_NAMES: Record<string, { fr: string; en: string }> = {
  STG: { fr: "Starting Grants", en: "Starting Grants" },
  COG: { fr: "Consolidator Grants", en: "Consolidator Grants" },
  ADG: { fr: "Advanced Grants", en: "Advanced Grants" },
  SYG: { fr: "Synergy Grants", en: "Synergy Grants" },
  POC: { fr: "Proof of Concept", en: "Proof of Concept" },
};

// Ordre de tri des destinations
const DESTINATION_ORDER = ["STG", "COG", "ADG", "SYG", "POC"];

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

function renderDataTableProjects(data: DestinationChartItem[], currentLang: string) {
  const sortedData = [...data].sort((a, b) => {
    const indexA = DESTINATION_ORDER.indexOf(a.destination_code);
    const indexB = DESTINATION_ORDER.indexOf(b.destination_code);
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });

  return (
    <table className="fr-table">
      <caption>{currentLang === "fr" ? "Projets par type de financement ERC" : "Projects by ERC funding type"}</caption>
      <thead>
        <tr>
          <th>{currentLang === "fr" ? "Type de financement" : "Funding type"}</th>
          <th>{currentLang === "fr" ? "Projets évalués" : "Evaluated"}</th>
          <th>{currentLang === "fr" ? "Projets lauréats" : "Successful"}</th>
          <th>{currentLang === "fr" ? "Taux de succès" : "Success rate"}</th>
        </tr>
      </thead>
      <tbody>
        {sortedData.map((item) => {
          const evaluated = item.evaluated?.total_involved || 0;
          const successful = item.successful?.total_involved || 0;
          const successRate = evaluated > 0 ? successful / evaluated : 0;
          const name = DESTINATION_NAMES[item.destination_code]?.[currentLang] || item.destination_name_en;

          return (
            <tr key={item.destination_code}>
              <td>{name}</td>
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

function renderDataTableFunding(data: DestinationChartItem[], currentLang: string) {
  const sortedData = [...data].sort((a, b) => {
    const indexA = DESTINATION_ORDER.indexOf(a.destination_code);
    const indexB = DESTINATION_ORDER.indexOf(b.destination_code);
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });

  return (
    <table className="fr-table">
      <caption>{currentLang === "fr" ? "Financements par type de financement ERC" : "Funding by ERC funding type"}</caption>
      <thead>
        <tr>
          <th>{currentLang === "fr" ? "Type de financement" : "Funding type"}</th>
          <th>{currentLang === "fr" ? "Financements demandés" : "Requested"}</th>
          <th>{currentLang === "fr" ? "Financements obtenus" : "Obtained"}</th>
          <th>{currentLang === "fr" ? "Taux de succès" : "Success rate"}</th>
        </tr>
      </thead>
      <tbody>
        {sortedData.map((item) => {
          const evaluated = item.evaluated?.total_funding_entity || 0;
          const successful = item.successful?.total_funding_entity || 0;
          const successRate = evaluated > 0 ? successful / evaluated : 0;
          const name = DESTINATION_NAMES[item.destination_code]?.[currentLang] || item.destination_name_en;

          return (
            <tr key={item.destination_code}>
              <td>{name}</td>
              <td>{formatCurrency(evaluated)}</td>
              <td>{formatCurrency(successful)}</td>
              <td>{formatToRates(successRate)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export function DestinationChartProjects({ countryCode: propCountryCode, callYear: propCallYear, currentLang: propLang }: DestinationChartProps) {
  const { params: urlParams, currentLang: urlLang } = useGetParams();
  const currentLang = propLang || urlLang;

  // Construire les params soit depuis les props soit depuis l'URL
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

export function DestinationChartFunding({ countryCode: propCountryCode, callYear: propCallYear, currentLang: propLang }: DestinationChartProps) {
  const { params: urlParams, currentLang: urlLang } = useGetParams();
  const currentLang = propLang || urlLang;

  // Construire les params soit depuis les props soit depuis l'URL
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

interface DestinationChartWithSelectorProps {
  countryCode?: string;
  callYear?: string;
  currentLang?: string;
}

export default function DestinationChart({ countryCode, callYear, currentLang: propLang }: DestinationChartWithSelectorProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("projects");
  const [searchParams] = useSearchParams();
  const currentLang = propLang || searchParams.get("language") || "fr";

  return (
    <div className="fr-my-3w">
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
        <SegmentedControl className="fr-segmented--sm" name="destination-chart-view-mode">
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
        <DestinationChartProjects countryCode={countryCode} callYear={callYear} currentLang={currentLang} />
      ) : (
        <DestinationChartFunding countryCode={countryCode} callYear={callYear} currentLang={currentLang} />
      )}
    </div>
  );
}
