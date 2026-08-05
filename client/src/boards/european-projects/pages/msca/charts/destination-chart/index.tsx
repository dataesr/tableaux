import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SegmentedControl, SegmentedElement } from "@dataesr/dsfr-plus";

import { getData, MscaDestinationChartItem } from "./query";
import OptionsProjects from "./options";
import OptionsFunding from "./options-funding";

import ChartWrapper from "../../../../../../components/chart-wrapper";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";
import { formatNumber, formatCurrency, formatToRates } from "../../../../../../utils/format";

const DESTINATION_NAMES: Record<string, { fr: string; en: string }> = {
  PF: { fr: "Postdoctoral Fellowships", en: "Postdoctoral Fellowships" },
  DN: { fr: "Doctoral Networks", en: "Doctoral Networks" },
  SE: { fr: "Staff Exchanges", en: "Staff Exchanges" },
  COFUND: { fr: "COFUND", en: "COFUND" },
  ITN: { fr: "Innovative Training Networks", en: "Innovative Training Networks" },
  RISE: { fr: "RISE", en: "RISE" },
  IF: { fr: "Individual Fellowships", en: "Individual Fellowships" },
};

interface DestinationChartProps {
  countryCode?: string;
  callYear?: string;
  currentLang?: string;
}

const configProjects = {
  id: "mscaDestinationChartProjects",
  idQuery: "mscaDestinationChart",
  comment: {
    fr: (
      <>
        Ce graphique présente le nombre de projets évalués et lauréats par type de financement MSCA (Postdoctoral Fellowships, Doctoral Networks,
        Staff Exchanges…). La ligne orange représente le taux de succès pour chaque type.
      </>
    ),
    en: (
      <>
        This chart shows the number of evaluated and successful projects by MSCA funding type (Postdoctoral Fellowships, Doctoral Networks, Staff
        Exchanges…). The orange line represents the success rate for each type.
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
  integrationURL: "/european-projects/components/pages/msca/charts/destination-chart",
};

const configFunding = {
  id: "mscaDestinationChartFunding",
  idQuery: "mscaDestinationChart",
  comment: {
    fr: (
      <>
        Ce graphique présente les financements demandés et obtenus par type de financement MSCA. La ligne orange représente le taux de succès en
        termes de financement.
      </>
    ),
    en: (
      <>This chart shows the requested and obtained funding by MSCA funding type. The orange line represents the success rate in terms of funding.</>
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
  integrationURL: "/european-projects/components/pages/msca/charts/destination-chart-funding",
};

function buildParams(countryCode?: string, callYear?: string): string {
  const parts: string[] = [];
  if (countryCode) parts.push(`country_code=${countryCode}`);
  if (callYear) parts.push(`call_year=${callYear}`);
  return parts.join("&");
}

function renderDataTableProjects(data: MscaDestinationChartItem[], currentLang: string) {
  const sortedData = [...data].sort((a, b) => a.destination_code.localeCompare(b.destination_code));
  return (
    <table className="fr-table">
      <caption>{currentLang === "fr" ? "Projets par type de financement MSCA" : "Projects by MSCA funding type"}</caption>
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
          const evaluated = item.evaluated?.total_projects || 0;
          const successful = item.successful?.total_projects || 0;
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

function renderDataTableFunding(data: MscaDestinationChartItem[], currentLang: string) {
  const sortedData = [...data].sort((a, b) => a.destination_code.localeCompare(b.destination_code));
  return (
    <table className="fr-table">
      <caption>{currentLang === "fr" ? "Financements par type de financement MSCA" : "Funding by MSCA funding type"}</caption>
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
          const evaluated = item.evaluated?.total_funding || 0;
          const successful = item.successful?.total_funding || 0;
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

function DestinationChartProjects({ countryCode, callYear, currentLang = "fr" }: DestinationChartProps) {
  const params = buildParams(countryCode, callYear);

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

function DestinationChartFunding({ countryCode, callYear, currentLang = "fr" }: DestinationChartProps) {
  const params = buildParams(countryCode, callYear);

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

export default function DestinationChart({ countryCode, callYear, currentLang: propLang }: DestinationChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("projects");
  const [searchParams] = useSearchParams();
  const currentLang = propLang || searchParams.get("language") || "fr";

  return (
    <div className="fr-my-3w">
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
        <SegmentedControl className="fr-segmented--sm" name="msca-destination-chart-view-mode">
          <SegmentedElement checked={viewMode === "projects"} label={currentLang === "fr" ? "Projets" : "Projects"} onClick={() => setViewMode("projects")} value="projects" />
          <SegmentedElement checked={viewMode === "funding"} label={currentLang === "fr" ? "Financements" : "Funding"} onClick={() => setViewMode("funding")} value="funding" />
        </SegmentedControl>
      </div>
      {viewMode === "projects" ? <DestinationChartProjects countryCode={countryCode} callYear={callYear} currentLang={currentLang} /> : <DestinationChartFunding countryCode={countryCode} callYear={callYear} currentLang={currentLang} />}
    </div>
  );
}
