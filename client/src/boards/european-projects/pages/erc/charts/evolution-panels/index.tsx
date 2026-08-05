import { useQuery } from "@tanstack/react-query";
import { Title } from "@dataesr/dsfr-plus";

import { getData } from "./query";
import Options from "./options";
import { useGetParams, processEvolutionPanelData, renderDataTable } from "./utils";
import { getI18nLabel } from "../../../../../../utils";

import ChartWrapper from "../../../../../../components/chart-wrapper";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";

import i18n from "../../i18n.json";

interface EvolutionPanelsChartsProps {
  countryAdjective?: string;
  currentLang?: string;
}

const configWeight = {
  id: "ercEvolutionPanelWeight",
  idQuery: "ercEvolutionPanel",
  title: {
    en: "Share of successful projects by scientific domain",
    fr: "Poids des projets lauréats par domaine scientifique",
  },
  comment: {
    fr: (
      <>
        Ce graphique présente l'évolution du poids des projets lauréats du pays sélectionné par rapport au total européen, ventilé par domaine
        scientifique ERC (Sciences de la vie, Sciences physiques et ingénierie, Sciences sociales et humaines).
      </>
    ),
    en: (
      <>
        This chart shows the evolution of the share of successful projects from the selected country compared to the European total, broken down by
        ERC scientific domain (Life Sciences, Physical Sciences & Engineering, Social Sciences & Humanities).
      </>
    ),
  },
  readingKey: {
    fr: <>Un poids de 10% signifie que le pays représente 10% des porteurs de projets lauréats au niveau européen pour ce domaine scientifique.</>,
    en: <>A share of 10% means that the country represents 10% of successful project PIs at the European level for this scientific domain.</>,
  },
  integrationURL: "/european-projects/components/pages/erc/charts/evolution-panel-weight",
};

const configSuccessRate = {
  id: "ercEvolutionPanelSuccessRate",
  idQuery: "ercEvolutionPanel",
  title: {
    en: "Success rate by scientific domain",
    fr: "Taux de succès par domaine scientifique",
  },
  comment: {
    fr: (
      <>
        Ce graphique présente l'évolution du taux de succès des projets du pays sélectionné, calculé comme le ratio entre projets lauréats et projets
        évalués, ventilé par domaine scientifique ERC.
      </>
    ),
    en: (
      <>
        This chart shows the evolution of the success rate of projects from the selected country, calculated as the ratio of successful to evaluated
        projects, broken down by ERC scientific domain.
      </>
    ),
  },
  readingKey: {
    fr: <>Un taux de succès de 20% signifie que 20% des projets soumis et évalués ont été retenus pour ce domaine scientifique.</>,
    en: <>A success rate of 20% means that 20% of submitted and evaluated projects were selected for this scientific domain.</>,
  },
  integrationURL: "/european-projects/components/pages/erc/charts/evolution-panel-success-rate",
};

export default function EvolutionPanelsCharts({ countryAdjective = "français", currentLang: propLang }: EvolutionPanelsChartsProps) {
  const { params, currentLang: urlLang } = useGetParams();
  const currentLang = propLang || urlLang;

  const { data, isLoading } = useQuery({
    queryKey: ["ercEvolutionPanel", params],
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

  const weightOptions = Options({
    processedData,
    chartType: "weight",
    countryAdjective,
    currentLang,
  });

  const successRateOptions = Options({
    processedData,
    chartType: "successRate",
    countryAdjective,
    currentLang,
  });

  return (
    <div className="evolution-panels-charts">
      <Title as="h3">{currentLang === "fr" ? `Évolution ${countryAdjective} par domaine scientifique` : `${countryAdjective} evolution by scientific domain`}</Title>

      {/* Graphique 1: Poids des projets par domaine */}
      <div className="fr-mb-4w chart-container chart-container--default">
        <ChartWrapper config={configWeight} options={weightOptions} renderData={() => renderDataTable(processedData, "weight", currentLang)} />
      </div>

      {/* Graphique 2: Taux de succès par domaine */}
      <div className="fr-mb-4w chart-container chart-container--default">
        <ChartWrapper config={configSuccessRate} options={successRateOptions} renderData={() => renderDataTable(processedData, "successRate", currentLang)} />
      </div>
    </div>
  );
}
