import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Title } from "@dataesr/dsfr-plus";

import { EvolutionIndicator, evolutionConfig, useEvolutionMetric } from "../evolution-indicator";
import { getData } from "./query";
import { getI18nLabel } from "../../../../../../utils";
import { useGetParams, processEvolutionPanelData } from "./utils";
import ChartWrapper from "../../../../../../components/chart-wrapper";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";
import Options from "./options";

import i18n from "../../i18n.json";

interface EvolutionPanelsChartsProps {
  countryAdjective?: string;
  currentLang?: string;
}

const configWeight = {
  id: "ercEvolutionPanelWeight",
  idQuery: "ercEvolutionPanel",
  integrationURL: "/european-projects/components/pages/erc/charts/evolution-panel-weight",
};

const configSuccessRate = {
  id: "ercEvolutionPanelSuccessRate",
  idQuery: "ercEvolutionPanel",
  integrationURL: "/european-projects/components/pages/erc/charts/evolution-panel-success-rate",
};

export default function EvolutionPanelsCharts({ countryAdjective = "français", currentLang: propLang }: EvolutionPanelsChartsProps) {
  const { params, currentLang: urlLang } = useGetParams();
  const currentLang = propLang || urlLang;
  const { metric, setMetric } = useEvolutionMetric("erc_domain_evolution_metric");

  const { data, isLoading } = useQuery({
    queryKey: ["ercEvolutionPanel", params],
    queryFn: () => getData(params),
    enabled: params !== "",
  });
  const processedData = useMemo(() => (data ? processEvolutionPanelData(data, currentLang, metric) : null), [data, currentLang, metric]);

  if (isLoading || !processedData) return <DefaultSkeleton />;

  if (processedData.years.length === 0) {
    return (
      <div className="fr-alert fr-alert--info">
        <p>{getI18nLabel(i18n, "evolution.noDataAvailable", currentLang)}</p>
      </div>
    );
  }

  return (
    <div className="evolution-panels-charts">
      <Title as="h3">{currentLang === "fr" ? `Évolution ${countryAdjective} par domaine scientifique` : `${countryAdjective} evolution by scientific domain`}</Title>

      <EvolutionIndicator metric={metric} setMetric={setMetric} currentLang={currentLang} name="erc-domain-evolution-metric" />

      {/* Graphique 1: Poids des projets par domaine */}
      <div className="fr-mb-1w chart-container chart-container--default">
        <ChartWrapper
          config={evolutionConfig(configWeight, "weight", metric, { fr: "domaine scientifique", en: "scientific domain" }, processedData.years, processedData.weightSeries)}
          options={Options({
            processedData,
            chartType: "weight",
            metric,
            currentLang,
          })}
        />
      </div>

      {/* Graphique 2: Taux de succès par domaine */}
      <div className="fr-mb-4w chart-container chart-container--default">
        <ChartWrapper
          config={evolutionConfig(configSuccessRate, "successRate", metric, { fr: "domaine scientifique", en: "scientific domain" }, processedData.years, processedData.successRateSeries)}
          options={Options({
            processedData,
            chartType: "successRate",
            metric,
            currentLang,
          })}
        />
      </div>
    </div>
  );
}
