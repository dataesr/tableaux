import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { getData } from "./query";
import Options, { getLegendItems } from "./options";
import { useGetParams, renderDataTable } from "./utils";
import { getI18nLabel } from "../../../../../../utils";

import ChartWrapper from "../../../../../../components/chart-wrapper";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";

import i18n from "../../i18n.json";
import "./styles.scss";
import { Title } from "@dataesr/dsfr-plus";

interface PanelFundingChartProps {
  countryAdjective?: string;
  currentLang?: string;
}

const config = {
  id: "ercPanelFunding",
  idQuery: "ercPanelFunding",
  // title: {
  //   en: "Funding by ERC Panel",
  //   fr: "Financements par Panel ERC",
  // },
  comment: {
    fr: (
      <>
        Ce graphique présente les financements obtenus et le nombre de porteurs de projets (PI) par domaine scientifique ERC et type de financement.
        Chaque point représente un cumul pour un domaine (Sciences de la vie, Sciences physiques et ingénierie, Sciences sociales et humaines) et un
        type de grant (Starting, Consolidator, Advanced).
      </>
    ),
    en: (
      <>
        This chart shows funding amounts and number of project PIs by ERC scientific domain and funding type. Each point represents an aggregate for a
        domain (Life Sciences, Physical Sciences and Engineering, Social Sciences and Humanities) and a grant type (Starting, Consolidator, Advanced).
      </>
    ),
  },
  readingKey: {
    fr: (
      <>
        Les points situés en haut à droite indiquent les domaines et types de financement ayant obtenu le plus de financements et le plus de porteurs
        de projets. Les lignes pointillées représentent les valeurs moyennes.
      </>
    ),
    en: (
      <>
        Points in the upper right indicate domains and funding types with the highest funding and most project PIs. Dashed lines represent average
        values.
      </>
    ),
  },
  integrationURL: "/european-projects/components/pages/erc/charts/panel-funding",
};

export default function PanelFundingChart({ countryAdjective = "français", currentLang: propLang }: PanelFundingChartProps) {
  const [stage, setStage] = useState<string>("successful");
  const { params, currentLang: urlLang } = useGetParams(stage);
  const currentLang = propLang || urlLang;

  const stageOptions = [
    { value: "successful", label: getI18nLabel(i18n, "panelFunding.successfulProjects", currentLang) },
    { value: "evaluated", label: getI18nLabel(i18n, "panelFunding.evaluatedProjects", currentLang) },
  ];

  const { data, isLoading } = useQuery({
    queryKey: [config.idQuery, params],
    queryFn: () => getData(params),
    enabled: params !== "",
  });

  if (isLoading || !data) return <DefaultSkeleton />;

  const options = Options({ data, countryAdjective, currentLang });
  const { domainItems, destinationItems } = getLegendItems(currentLang);

  return (
    <div className="panel-funding-chart fr-my-5w">
      <div className="panel-funding-chart__header">
        <Title as="h4">Croisements panel ERC/types de financements</Title>
        <div className="panel-funding-chart__filter">
          <div className="fr-select-group">
            <label className="fr-label" htmlFor="stage-select">
              {getI18nLabel(i18n, "panelFunding.projectStatus", currentLang)}
            </label>
            <select className="fr-select" id="stage-select" value={stage} onChange={(e) => setStage(e.target.value)}>
              {stageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="chart-container chart-container--default">
        <ChartWrapper config={config} options={options} renderData={() => renderDataTable(data, currentLang)} />
      </div>

      {/* Légende personnalisée */}
      <div className="panel-funding-chart__legend">
        <div className="panel-funding-chart__legend-section">
          <span className="panel-funding-chart__legend-title">{getI18nLabel(i18n, "panelFunding.ercPanel", currentLang)}</span>
          <div className="panel-funding-chart__legend-items">
            {domainItems.map((item) => (
              <span key={item.key} className="panel-funding-chart__legend-item">
                <span className="panel-funding-chart__legend-color" style={{ backgroundColor: item.color }} />
                {item.label}
              </span>
            ))}
          </div>
        </div>
        <div className="panel-funding-chart__legend-section">
          <span className="panel-funding-chart__legend-title">{getI18nLabel(i18n, "panelFunding.fundingType", currentLang)}</span>
          <div className="panel-funding-chart__legend-items">
            {destinationItems.map((item) => (
              <span key={item.key} className="panel-funding-chart__legend-item">
                <span className={`panel-funding-chart__legend-marker panel-funding-chart__legend-marker--${item.marker}`} />
                {item.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
