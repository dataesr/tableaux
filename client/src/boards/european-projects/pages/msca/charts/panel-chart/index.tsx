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

const configProjects = {
  id: "mscaPanelChartProjects",
  idQuery: "mscaPanelChart",
  comment: {
    fr: (
      <>
        Ce graphique présente le nombre de projets évalués et lauréats par panel scientifique MSCA. La ligne orange représente le taux de succès pour
        chaque panel.
      </>
    ),
    en: (
      <>
        This chart shows the number of evaluated and successful projects by MSCA scientific panel. The orange line represents the success rate for
        each panel.
      </>
    ),
  },
  readingKey: {
    fr: (
      <>
        Les barres bleues représentent les projets évalués, les barres vertes les projets lauréats. Un taux de succès élevé indique une meilleure
        performance pour ce panel scientifique.
      </>
    ),
    en: (
      <>
        Blue bars represent evaluated projects, green bars represent successful projects. A high success rate indicates better performance for that
        scientific panel.
      </>
    ),
  },
  integrationURL: "/european-projects/components/pages/msca/charts/panel-chart",
};

const configFunding = {
  id: "mscaPanelChartFunding",
  idQuery: "mscaPanelChart",
  comment: {
    fr: (
      <>
        Ce graphique présente les financements demandés et obtenus par panel scientifique MSCA. La ligne orange représente le taux de succès en termes
        de financement.
      </>
    ),
    en: (
      <>
        This chart shows the requested and obtained funding by MSCA scientific panel. The orange line represents the success rate in terms of funding.
      </>
    ),
  },
  readingKey: {
    fr: (
      <>
        Les barres bleues représentent les financements demandés, les barres vertes les financements obtenus. Un taux de succès élevé indique une
        meilleure performance pour ce panel scientifique.
      </>
    ),
    en: (
      <>
        Blue bars represent requested funding, green bars represent obtained funding. A high success rate indicates better performance for that
        scientific panel.
      </>
    ),
  },
  integrationURL: "/european-projects/components/pages/msca/charts/panel-chart-funding",
};

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
        {currentLang === "fr" ? "Données du graphique des projets par panel scientifique MSCA" : "Data from the project graph by scientific panel"}
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
      <caption>{currentLang === "fr" ? "Financements par panel scientifique MSCA" : "Funding by MSCA scientific panel"}</caption>
      <thead>
        <tr>
          <th>{currentLang === "fr" ? "Panel scientifique" : "Scientific panel"}</th>
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
    queryKey: [configProjects.idQuery + "-projects", params],
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

function PanelChartFunding({ countryCode, callYear, currentLang = "fr" }: PanelChartProps) {
  const params = buildParams(countryCode, callYear);

  const { data, isLoading } = useQuery({
    queryKey: [configFunding.idQuery + "-funding", params],
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
