import { Title } from "@dataesr/dsfr-plus";
import { useQuery } from "@tanstack/react-query";

import ChartWrapper from "../../../../../../components/chart-wrapper";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";
import { getI18nLabel } from "../../../../../../utils";
import { EPChartsSources } from "../../../../config.js";
import i18n from "../../i18n.json";
import Options from "./options";
import { getData } from "./query";
import { processEvolutionData, renderDataTable, useGetParams } from "./utils";

interface EvolutionChartsProps {
  countryAdjective?: string;
  currentLang?: string;
}

export default function EvolutionFundingsCharts({ countryAdjective = "français", currentLang: propLang }: EvolutionChartsProps) {
  const { params, currentLang: urlLang } = useGetParams();
  const currentLang = propLang || urlLang;

  const { data, isLoading } = useQuery({
    queryKey: ["mscaEvolution", params],
    queryFn: () => getData(params),
    enabled: params !== "",
  });

  if (isLoading || !data) return <DefaultSkeleton />;

  const processedData = processEvolutionData(data, currentLang);

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
    id: "mscaEvolutionWeight",
    idQuery: "mscaEvolution",
    comment: {
      fr: (
        <>
          Ce graphique présente l'évolution du poids des projets lauréats du pays sélectionné par rapport au total européen, ventilé par type de
          financement MSCA.
        </>
      ),
      en: (
        <>
          This chart shows the evolution of the share of successful projects from the selected country compared to the European total, broken down by
          MSCA funding type.
        </>
      ),
    },
    readingKey: {
      fr: <>Un poids de 10% signifie que le pays représente 10% des porteurs de projets lauréats au niveau européen pour ce type de financement.</>,
      en: <>A share of 10% means that the country represents 10% of successful project PIs at the European level for this funding type.</>,
    },
    sources: EPChartsSources,
    integrationURL: "/european-projects/components/pages/msca/charts/evolution-weight",
    title: {
      en: `Share of ${countryAdjective} successful projects since ${firstYear}`,
      fr: `Poids des projets ${countryAdjective} lauréats depuis ${firstYear}`,
    }
  };

  const configSuccessRate = {
    id: "mscaEvolutionSuccessRate",
    idQuery: "mscaEvolution",
    comment: {
      fr: (
        <>
          Ce graphique présente l'évolution du taux de succès des projets du pays sélectionné, calculé comme le ratio entre projets lauréats et projets
          évalués, ventilé par type de financement MSCA.
        </>
      ),
      en: (
        <>
          This chart shows the evolution of the success rate of projects from the selected country, calculated as the ratio of successful to evaluated
          projects, broken down by MSCA funding type.
        </>
      ),
    },
    readingKey: {
      fr: <>Un taux de succès de 20% signifie que 20% des projets soumis et évalués ont été retenus pour ce type de financement.</>,
      en: <>A success rate of 20% means that 20% of submitted and evaluated projects were selected for this funding type.</>,
    },
    sources: EPChartsSources,
    integrationURL: "/european-projects/components/pages/msca/charts/evolution-success-rate",
    title: {
      en: `Success rate on ${countryAdjective} projects since ${firstYear}`,
      fr: `Taux de succès sur les projets ${countryAdjective} depuis ${firstYear}`,
    }
  };

  return (
    <div className="evolution-charts">
      <Title as="h2" look="h5">
        {getI18nLabel(i18n, "evolution.sectionTitle", currentLang)} {countryAdjective} {getI18nLabel(i18n, "evolution.byFundingType", currentLang)}
      </Title>

      {/* Graphique 1: Poids des projets */}
      <div className="fr-mb-4w chart-container--default">
        <ChartWrapper
          config={configWeight}
          options={Options({ chartType: "weight", processedData })}
          renderData={() => renderDataTable(processedData, "weight", currentLang)}
        />
      </div>

      {/* Graphique 2: Taux de succès */}
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
