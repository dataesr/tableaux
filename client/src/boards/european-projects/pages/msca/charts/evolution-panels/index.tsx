import { Title } from "@dataesr/dsfr-plus";
import { useQuery } from "@tanstack/react-query";

import ChartWrapper from "../../../../../../components/chart-wrapper";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";
import { getI18nLabel } from "../../../../../../utils";
import { EPChartsSources } from "../../../../config.js";
import i18n from "../../i18n.json";
import Options from "./options";
import { getData } from "./query";
import { processEvolutionPanelData, renderDataTable, useGetParams } from "./utils";

interface EvolutionPanelsChartsProps {
  countryAdjective?: string;
  currentLang?: string;
}

export default function EvolutionPanelsCharts({ countryAdjective = "français", currentLang: propLang }: EvolutionPanelsChartsProps) {
  const { params, currentLang: urlLang } = useGetParams();
  const currentLang = propLang || urlLang;

  const { data, isLoading } = useQuery({
    queryKey: ["mscaEvolutionPanel", params],
    queryFn: () => getData(params),
    enabled: params !== "",
  });

  if (isLoading || !data) return <DefaultSkeleton />;

  const processedData = processEvolutionPanelData(data, currentLang);

  if (processedData.years.length === 0) {
    return (
      <div className="fr-alert fr-alert--info">
        <p>{getI18nLabel(i18n, "evolution.noDataAvailable", currentLang)}</p>
      </div>
    );
  }

  // Déterminer l'année de départ pour le titre
  const firstYear = processedData?.years?.[0] ?? "2014"

  const configWeight = {
    id: "mscaEvolutionPanelWeight",
    idQuery: "mscaEvolutionPanel",
    comment: {
      fr: (
        <>Ce graphique présente l'évolution du poids des projets lauréats du pays sélectionné par rapport au total européen, ventilé par panel MSCA.</>
      ),
      en: (
        <>
          This chart shows the evolution of the share of successful projects from the selected country compared to the European total, broken down by
          MSCA panel.
        </>
      ),
    },
    readingKey: {
      fr: <>Un poids de 10% signifie que le pays représente 10% des porteurs de projets lauréats au niveau européen pour ce panel.</>,
      en: <>A share of 10% means that the country represents 10% of successful project PIs at the European level for this panel.</>,
    },
    sources: EPChartsSources,
    integrationURL: "/european-projects/components/pages/msca/charts/evolution-panel-weight",
    title: {
      en: `Share of ${countryAdjective} successful projects by domain since ${firstYear}`,
      fr: `Poids des projets ${countryAdjective} lauréats par domaine depuis ${firstYear}`,
    },
  };

  const configSuccessRate = {
    id: "mscaEvolutionPanelSuccessRate",
    idQuery: "mscaEvolutionPanel",
    comment: {
      fr: (
        <>
          Ce graphique présente l'évolution du taux de succès des projets du pays sélectionné, calculé comme le ratio entre projets lauréats et projets
          évalués, ventilé par panel MSCA.
        </>
      ),
      en: (
        <>
          This chart shows the evolution of the success rate of projects from the selected country, calculated as the ratio of successful to evaluated
          projects, broken down by MSCA panel.
        </>
      ),
    },
    readingKey: {
      fr: <>Un taux de succès de 20% signifie que 20% des projets soumis et évalués ont été retenus pour ce panel.</>,
      en: <>A success rate of 20% means that 20% of submitted and evaluated projects were selected for this panel.</>,
    },
    sources: EPChartsSources,
    integrationURL: "/european-projects/components/pages/msca/charts/evolution-panel-success-rate",
    title: {
      en: `Success rate on ${countryAdjective} projects by domain since ${firstYear}`,
      fr: `Taux de succès des projets ${countryAdjective} par domaine depuis ${firstYear}`,
    },
  };

  return (
    <div className="evolution-panels-charts">
      <Title as="h2" look="h5">
        {currentLang === "fr" ? `Évolution ${countryAdjective} par domaine scientifique` : `${countryAdjective} evolution by scientific domain`}
      </Title>

      {/* Graphique 1: Poids des projets par domaine */}
      <div className="fr-mb-4w chart-container--default">
        <ChartWrapper
          config={configWeight}
          options={Options({ chartType: "weight", processedData })}
          renderData={() => renderDataTable(processedData, "weight", currentLang)}
        />
      </div>

      {/* Graphique 2: Taux de succès par domaine */}
      <div className="fr-mb-4w chart-container--default">
        <ChartWrapper
          config={configSuccessRate}
          options={Options({ chartType: "successRate", processedData })}
          renderData={() => renderDataTable(processedData, "successRate", currentLang)}
        />
      </div>
    </div>
  );
}
