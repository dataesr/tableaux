import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SegmentedControl, SegmentedElement } from "@dataesr/dsfr-plus";

import { getData, MscaPanelChartItem } from "./query";
import OptionsProjects from "./options";
import OptionsFunding from "./options-funding";
import ChartWrapper from "../../../../../../components/chart-wrapper";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";
import { formatNumber, formatCurrency, formatToRates } from "../../../../../../utils/format";

interface PanelChartProps {
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

function renderDataTableProjects(data: MscaPanelChartItem[], currentLang: string) {
  const sortedData = [...data].filter((d) => d.panel_id).sort((a, b) => a.panel_id.localeCompare(b.panel_id));
  return (
    <table className="fr-table">
      <caption>
        {currentLang === "fr" ? "Nombre de projets par panel scientifique" : "Number of projects by scientific panel"}
      </caption>
      <thead>
        <tr>
          <th>{currentLang === "fr" ? "Panel scientifique" : "Scientific panel"}</th>
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
          return (
            <tr key={item.panel_id}>
              <td>{item.panel_name || item.panel_id}</td>
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

function renderDataTableFunding(data: MscaPanelChartItem[], currentLang: string) {
  const sortedData = [...data].filter((d) => d.panel_id).sort((a, b) => a.panel_id.localeCompare(b.panel_id));
  return (
    <table className="fr-table">
      <caption>{currentLang === "fr" ? "Financements par panel scientifique" : "Funding by scientific panel"}</caption>
      <thead>
        <tr>
          <th>{currentLang === "fr" ? "Panel scientifique" : "Scientific panel"}</th>
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
          return (
            <tr key={item.panel_id}>
              <td>{item.panel_name || item.panel_id}</td>
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

function PanelChartProjects({ countryCode, callYear, currentLang = "fr" }: PanelChartProps) {
  const params = buildParams(countryCode, callYear);

  const { data, isLoading } = useQuery({
    queryKey: ["mscaPanelChart", params],
    queryFn: () => getData(params),
    enabled: params !== "",
  });

  if (isLoading || !data) return <DefaultSkeleton />;

  const options = OptionsProjects({ data, currentLang });
  if (!options) return null;

  const readingChoice = data[0];
  const countryEval = readingChoice?.evaluated?.total_projects ?? 0;
  const countrySucc = readingChoice?.successful?.total_projects ?? 0;
  const successRate = countryEval > 0 ? countrySucc / countryEval : 0;

  const configProjects = {
    id: "mscaPanelChartProjects",
    // idQuery: "mscaPanelChart",
    comment: {
      fr: (
        <>
          Ce graphique présente le nombre de projets évalués et lauréats pour chaque panel scientifique. 
          La ligne orange indique le taux de succès dans chaque panel, soit le nombre de projets lauréats sur le nombre projets évalués.
        </>
      ),
      en: (
        <>
          This chart shows the number of evaluated and successful projects for each scientific panel.
          The orange line shows the success rate in each panel, i.e. the ratio of successful projects to projects evaluated.
        </>
      ),
    },
    readingKey: {
      fr: (
        <>
          En {readingChoice.panel_name}, sur {formatNumber(countryEval)} propositions évaluées {formatNumber(countrySucc)} sont lauréates, soit un taux de succès de {formatToRates(successRate)}.
        </>
      ),
      en: (
        <>
          In {readingChoice.panel_name}, of the {formatNumber(countryEval)} proposals evaluated,{" "} {formatNumber(countrySucc)} were successful, a success rate of {formatToRates(successRate)}.
        </>
      ),
    },
    integrationURL: "/european-projects/components/pages/msca/charts/panel-chart",
  };



  return (
    <div className="fr-my-3w chart-container chart-container--default">
      <ChartWrapper config={configProjects} options={options} renderData={() => renderDataTableProjects(data, currentLang)} />
    </div>
  );
}

function PanelChartFunding({ countryCode, callYear, currentLang = "fr" }: PanelChartProps) {
  const params = buildParams(countryCode, callYear);

  const { data, isLoading } = useQuery({
    queryKey: ["mscaPanelChart", params],
    queryFn: () => getData(params),
    enabled: params !== "",
  });

  if (isLoading || !data) return <DefaultSkeleton />;

  const options = OptionsFunding({ data, currentLang });
  if (!options) return null;

  const readingChoice = data[0];
  const countryEval = readingChoice?.evaluated?.total_funding_project ?? 0;
  const countrySucc = readingChoice?.successful?.total_funding_project ?? 0;
  const successRate = countryEval > 0 ? countrySucc / countryEval : 0;
   
  const configFunding = {
    id: "mscaPanelChartFunding",
    // idQuery: "mscaPanelChart",
    comment: {
      fr: (
        <>
          Ce graphique présente les financements demandés et obtenus pour chaque panel scientifique. 
          La ligne orange indique le taux de succès de chaque panel, soit le montant des financements obtenus sur le montant des financements demandés.
        </>
      ),
      en: (
        <>
          This chart shows the funding requested and secured for each scientific panel.
          The orange line shows the funding success rate for each panel, i.e. the ratio of funding secured to funding requested.
        </>
      ),
    },
    readingKey: {
      fr: (
        <>
          En {readingChoice.panel_name}, les participants du pays sélectionné ont demandé {formatCurrency(countryEval)} et{" "}
          obtenu {formatCurrency(countrySucc)} soit un taux de succès de {formatToRates(successRate)}.
        </>
      ),
      en: (
        <>
          In {readingChoice.panel_name}, participants from the selected country requested {formatCurrency(countryEval)} and{" "}
          secured {formatCurrency(countrySucc)}, a success rate of {formatToRates(successRate)}.
        </>
      ),
    },
    integrationURL: "/european-projects/components/pages/msca/charts/panel-chart-funding",
  };


  return (
    <div className="fr-my-3w chart-container chart-container--default">
      <ChartWrapper config={configFunding} options={options} renderData={() => renderDataTableFunding(data, currentLang)} />
    </div>
  );
}

type ViewMode = "projects" | "funding";

export default function PanelChart({ countryCode, callYear, currentLang: propLang }: PanelChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("projects");
  const [searchParams] = useSearchParams();
  const currentLang = propLang || searchParams.get("language") || "fr";

  return (
    <div className="fr-my-3w">
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
        <SegmentedControl className="fr-segmented--sm" name="msca-panel-chart-view-mode">
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
