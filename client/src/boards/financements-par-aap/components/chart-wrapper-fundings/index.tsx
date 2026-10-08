import { useQuery } from "@tanstack/react-query"
import Highcharts from "highcharts/es-modules/masters/highcharts.src.js"
import React from "react"

import { createChartOptions } from "../../../../components/chart-wrapper/default-options"
import ChartWrapper, { ChartConfig, HighchartsOptions } from "../../../../components/chart-wrapper/index.js"
import DefaultSkeleton from "../../../../components/charts-skeletons/default.js"
import { deepMerge } from "../../../../utils"

const { VITE_APP_ES_INDEX_PARTICIPATIONS, VITE_APP_SERVER_URL } = import.meta.env

const fundingsSources = [
  {
    label: {
      en: React.createElement(React.Fragment, null, "ANR (DGDS)"),
      fr: React.createElement(React.Fragment, null, "ANR (DGDS)"),
    },
    url: {
      en: "https://www.data.gouv.fr/datasets/anr-01-projets-anr-dos-et-dgds-detail-des-projets-et-des-partenaires",
      fr: "https://www.data.gouv.fr/datasets/anr-01-projets-anr-dos-et-dgds-detail-des-projets-et-des-partenaires",
    },
  },
  {
    label: {
      en: React.createElement(React.Fragment, null, "PIA ANR (DGPIE)"),
      fr: React.createElement(React.Fragment, null, "PIA ANR (DGPIE)"),
    },
    url: {
      en: "https://www.data.gouv.fr/datasets/anr-02-projets-anr-dgpie-detail-des-projets-et-des-partenaires",
      fr: "https://www.data.gouv.fr/datasets/anr-02-projets-anr-dgpie-detail-des-projets-et-des-partenaires",
    },
  },
  {
    label: {
      en: React.createElement(React.Fragment, null, "PIA Web"),
      fr: React.createElement(React.Fragment, null, "PIA Web"),
    },
    url: {
      en: "https://piaweb.adc.education.fr/",
      fr: "https://piaweb.adc.education.fr/",
    },
  },
  {
    label: {
      en: React.createElement(React.Fragment, null, "European projects"),
      fr: React.createElement(React.Fragment, null, "Projets européens"),
    },
    url: {
      en: "https://data.enseignementsup-recherche.gouv.fr/explore/dataset/fr-esr-horizon-projects-entities/information/?disjunctive.paysage_category&disjunctive.region_1_name&disjunctive.regional_unit_name&disjunctive.free_keywords",
      fr: "https://data.enseignementsup-recherche.gouv.fr/explore/dataset/fr-esr-horizon-projects-entities/information/?disjunctive.paysage_category&disjunctive.region_1_name&disjunctive.regional_unit_name&disjunctive.free_keywords",
    },
  },
]


export default function ChartWrapperFundings({
  config,
  constructorType,
  hideTitle = false,
  legend,
  options,
  renderData,
}: {
  config: ChartConfig;
  constructorType?: "chart" | "stockChart" | "mapChart";
  hideTitle?: boolean;
  legend?: React.ReactNode;
  options: HighchartsOptions;
  renderData?: (options: Highcharts.Options) => React.ReactNode;
}) {
  const { data: dataAlias, isLoading: isLoadingAlias } = useQuery({
    queryKey: ["fundings-alias"],
    queryFn: () =>
      fetch(
        `${VITE_APP_SERVER_URL}/elasticsearch/get-index-name-by-alias?index=${VITE_APP_ES_INDEX_PARTICIPATIONS}`,
        {
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
          method: "GET",
        },
      ).then((response) => response.json()),
  })

  let update: any = "";
  if (dataAlias) {
    update = dataAlias?.index?.replace("\n", "")?.split("-")?.[2]
    update = `${update.substring(0, 4)}-${update.substring(4, 6)}-${update.substring(6, 8)}`
    update = new Date(update)
  }

  const configLocal = {
    ...config,
    sources: fundingsSources.map((source) => ({ ...source, update })),
  }

  const optionsLocal: HighchartsOptions = deepMerge(createChartOptions("bar", { chart: { height: "600px" } }), options)

  return isLoadingAlias ? <DefaultSkeleton height={String(options?.chart?.height)} /> : <ChartWrapper
    config={configLocal}
    constructorType={constructorType}
    hideTitle={hideTitle}
    legend={legend}
    options={optionsLocal}
    renderData={renderData}
  />
}
