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
  CITIZENS: { fr: "CITIZENS", en: "CITIZENS" },
  ITN: { fr: "Innovative Training Networks", en: "Innovative Training Networks" },
  RISE: { fr: "RISE", en: "RISE" },
  IF: { fr: "Individual Fellowships", en: "Individual Fellowships" },
};

interface DestinationChartProps {
  countryCode?: string;
  callYear?: string;
  currentLang?: string;
}

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
      <caption>{currentLang === "fr" ? "Nombre de projets par type de financement" : "Number of projects by action type"}</caption>
      <thead>
        <tr>
          <th>{currentLang === "fr" ? "Type de financement" : "Action type"}</th>
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
      <caption>{currentLang === "fr" ? "Répartition des financements et des taux de succès par type de financement" : "Breakdown of funding ans success rates by action type"}</caption>
      <thead>
        <tr>
          <th>{currentLang === "fr" ? "Type de financement" : "Action type"}</th>
          <th>{currentLang === "fr" ? "Financements demandés" : "Requested"}</th>
          <th>{currentLang === "fr" ? "Financements obtenus" : "Secured"}</th>
          <th>{currentLang === "fr" ? "Taux de succès" : "Success rate"}</th>
        </tr>
      </thead>
      <tbody>
        {sortedData.map((item) => {
          const evaluated = item.evaluated?.total_funding_project || 0;
          const successful = item.successful?.total_funding_project || 0;
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
    queryKey: ["mscaDestinationChart", params],
    queryFn: () => getData(params),
    enabled: params !== "",
  });


  if (isLoading || !data) return <DefaultSkeleton />;

  const options = OptionsProjects({ data, currentLang });
  if (!options) return null;

  const readingChoice = data[0];
  const destinationName = readingChoice?.destination_name_en ?? "";
  const countryEval = readingChoice?.evaluated?.total_projects ?? 0;
  const countrySucc = readingChoice?.successful?.total_projects ?? 0;
  const successRate = countryEval > 0 ? countrySucc / countryEval : 0;

  const configProjects = {
    id: "mscaDestinationChartProjects",
    // idQuery: "mscaDestinationChart",
    comment: {
      fr: (
        <>
          Ce graphique présente le nombre de projets évalués et lauréats pour chaque type de financement (Postdoctoral Fellowships, Doctoral Networks, Staff Exchanges, etc.). 
          La ligne orange indique le taux de succès dans chaque type, soit le rapport entre les projets lauréats et les projets évalués.
        </>
      ),
      en: (
        <>
          This chart shows the number of projects evaluated and successful projects for each action type (Postdoctoral Fellowships, Doctoral Networks, Staff Exchanges, etc.). 
          The orange line shows the success rate in each type, i.e. the ratio of successful projects to projects evaluated.
        </>
      ),
      },
      readingKey: {
        fr: (
          <>
            Dans le cadre des appels à projets "{destinationName}", sur {formatNumber(countryEval)} propositions évaluées{" "}
            {formatNumber(countrySucc)} d'entre elles sont lauréates, soit un taux de succès de {formatToRates(successRate)}.
          </>
        ),
        en: (
          <>
            Under "{destinationName}" calls for proposals, of the {formatNumber(countryEval)} proposals evaluated,{" "}
            {formatNumber(countrySucc)} were successful, a success rate of {formatToRates(successRate)}.
          </>
        ),
      },
      integrationURL: "/european-projects/components/pages/msca/charts/destination-chart",
    };

  return (
    <div className="fr-my-3w chart-container chart-container--default">
      <ChartWrapper config={configProjects} options={options} renderData={() => renderDataTableProjects(data, currentLang)} />
    </div>
  );
}

function DestinationChartFunding({ countryCode, callYear, currentLang = "fr" }: DestinationChartProps) {
  const params = buildParams(countryCode, callYear);

  const { data, isLoading } = useQuery({
    queryKey: ["mscaDestinationChart", params],
    queryFn: () => getData(params),
    enabled: params !== "",
  });

  if (isLoading || !data) return <DefaultSkeleton />;

  const options = OptionsFunding({ data, currentLang });
  if (!options) return null;

  const readingChoice = data[0];
  const destinationName = readingChoice?.destination_name_en ?? "";
  const countryEval = readingChoice?.evaluated?.total_funding_project ?? 0;
  const countrySucc = readingChoice?.successful?.total_funding_project ?? 0;
  const successRate = countryEval > 0 ? countrySucc / countryEval : 0;

  const configFunding = {
    id: "mscaDestinationChartFunding",
    // idQuery: "mscaDestinationChart",
    comment: {
      fr: (
        <>
          Ce graphique présente les financements demandés et obtenus pour chaque type de financement (Postdoctoral Fellowships, Doctoral Networks, Staff Exchanges, etc.).
          La ligne orange indique le taux de succès des financements, soit le rapport entre les financements obtenus et les financements demandés.
        </>
      ),
      en: (
        <>
          This chart shows the funding requested and secured for each action type (Postdoctoral Fellowships, Doctoral Networks, Staff Exchanges, etc.).
          The orange line shows the funding success rate, i.e. the ratio of funding secured to funding requested.
        </>
      ),
    },
    readingKey: {
      fr: (
        <>
          Dans le cadre des appels à projets "{destinationName}", les participants du pays sélectionné ont demandé {formatCurrency(countryEval)} et{" "}
          obtenu {formatCurrency(countrySucc)} soit un taux de succès de {formatToRates(successRate)}.
        </>
      ),
      en: (
        <>
          Under calls for proposals "{destinationName}", participants from the selected country requested {formatCurrency(countryEval)} and{" "}
          secured {formatCurrency(countrySucc)}, a success rate of {formatToRates(successRate)}.
        </>
      ),
    },
    integrationURL: "/european-projects/components/pages/msca/charts/destination-chart-funding",
  };


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
