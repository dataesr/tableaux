import { lazy } from "react";

/**
 * Registre central des composants graphiques disponibles pour l'intégration
 * Ajoutez ici tous les graphiques que vous souhaitez rendre disponibles via l'API d'intégration
 */
export const chartsRegistry = {
  // European Projects - Collaborations
  // MapOfEuropeCollaborationsFlow: lazy(() => import("../european-projects/pages/collaborations/charts/map-of-europe-collaborations-flow")),
  // CountryNeighbourgs: lazy(() => import("../european-projects/pages/collaborations/charts/country-neighbourgs")),
  CountriesCollaborationsBubble: lazy(
    () =>
      import("../european-projects/pages/collaborations/charts/countries-collaborations-bubble")
  ),
  CollaborationsEntityVariablePie: lazy(
    () =>
      import("../european-projects/pages/collaborations/charts/entity-variable-pie")
  ),

  // European Projects - Positioning
  top10beneficiaries: lazy(
    () =>
      import("../european-projects/pages/positioning/charts/top-10-beneficiaries")
  ),
  fundingRankingRates: lazy(
    () =>
      import("../european-projects/pages/positioning/charts/funding-ranking/rates")
  ),
  FundingRankingSubsidies: lazy(
    () =>
      import("../european-projects/pages/positioning/charts/funding-ranking/subsidies")
  ),
  FundingRankingParticipations: lazy(
    () =>
      import("../european-projects/pages/positioning/charts/funding-ranking/participations")
  ),
  fundingRankingCoordination: lazy(
    () =>
      import("../european-projects/pages/positioning/charts/funding-ranking/coordination")
  ),

  // European Projects - Synthesis
  // TODO

  // European Projects - Evolution PCRI
  fundingStackedArea: lazy(
    () =>
      import("../european-projects/pages/evolution-pcri/charts/funding-stacked-area")
  ),
  successRateEvolution: lazy(
    () =>
      import("../european-projects/pages/evolution-pcri/charts/success-rate-evolution")
  ),
  countriesHeatmap: lazy(
    () =>
      import("../european-projects/pages/evolution-pcri/charts/countries-heatmap")
  ),
  countriesRanking: lazy(
    () =>
      import("../european-projects/pages/evolution-pcri/charts/countries-ranking")
  ),
  fundingByCountry: lazy(
    () =>
      import("../european-projects/pages/evolution-pcri/charts/funding-by-country")
  ),
  efficiencyScatter: lazy(
    () =>
      import("../european-projects/pages/evolution-pcri/charts/efficiency-scatter")
  ),

  // Structures Finance
  ressourcesPropres: lazy(
    () =>
      import("../structures-finance/pages/structures/sections/resources/charts/ressources-propres")
  ),
  ressourcesPropresEvolution: lazy(
    () =>
      import("../structures-finance/pages/structures/sections/resources/charts/ressources-propres-evolution")
  ),
  "effectifs-niveau": lazy(
    () =>
      import("../structures-finance/pages/structures/sections/formations/charts/effectifs/effectifs-niveau")
  ),
  "effectifs-specifiques": lazy(
    () =>
      import("../structures-finance/pages/structures/sections/formations/charts/effectifs/effectifs-specifiques")
  ),
  "effectifs-disciplines": lazy(
    () =>
      import("../structures-finance/pages/structures/sections/formations/charts/effectifs/effectifs-disciplines")
  ),
  "effectifs-degrees": lazy(
    () =>
      import("../structures-finance/pages/structures/sections/formations/charts/effectifs/effectifs-degrees")
  ),
  "effectifs-evolution": lazy(
    () =>
      import("../structures-finance/pages/structures/sections/formations/charts/effectifs-evolution")
  ),
  "evolution-stacked": lazy(
    () =>
      import("../structures-finance/pages/structures/sections/analyses/charts")
  ),
  "evolution-single": lazy(
    () =>
      import("../structures-finance/pages/structures/sections/analyses/charts")
  ),
  "evolution-comparison": lazy(
    () =>
      import("../structures-finance/pages/structures/sections/analyses/charts")
  ),
  "evolution-part": lazy(
    () =>
      import("../structures-finance/pages/structures/sections/analyses/charts")
  ),
  "evolution-metric1": lazy(
    () =>
      import("../structures-finance/pages/structures/sections/analyses/charts")
  ),
  "evolution-metric2": lazy(
    () =>
      import("../structures-finance/pages/structures/sections/analyses/charts")
  ),
  "positioning-comparison-bar": lazy(
    () =>
      import("../structures-finance/pages/structures/sections/positionning/charts/comparison-bar")
  ),
  "positioning-scatter": lazy(
    () =>
      import("../structures-finance/pages/structures/sections/positionning/charts/scatter")
  ),

  // Financements par APP - Fundings
  projectsByFunder: lazy(
    () => import("../financements-par-aap/charts/projects-by-funder")
  ),
  classifications: lazy(
    () => import("../financements-par-aap/charts/classifications")
  ),
  classifications2: lazy(
    () => import("../financements-par-aap/charts/classifications2")
  ),
  frenchPartnersByStructure: lazy(
    () => import("../financements-par-aap/charts/french-partners")
  ),
  instrumentsForAnr: lazy(
    () => import("../financements-par-aap/charts/instruments-for-anr")
  ),
  instrumentsForEurope: lazy(
    () => import("../financements-par-aap/charts/instruments-for-europe")
  ),
  instrumentsOverTimeForAnr: lazy(
    () => import("../financements-par-aap/charts/instruments-over-time-for-anr")
  ),
  instrumentsOverTimeForEurope: lazy(
    () => import("../financements-par-aap/charts/instruments-for-europe")
  ),
  internationalPartners: lazy(
    () => import("../financements-par-aap/charts/international-partners")
  ),
  laboratories: lazy(
    () => import("../financements-par-aap/charts/laboratories")
  ),
  overview: lazy(
    () => import("../financements-par-aap/charts/overview")
  ),
  projectsOverTime: lazy(
    () => import("../financements-par-aap/charts/projects-over-time")
  ),
  classificationsByComparison: lazy(
    () => import("../financements-par-aap/pages/comparison/charts/classifications-by-comparison")
  ),
  dispersionByComparison: lazy(
    () => import("../financements-par-aap/pages/comparison/charts/dispersion-by-comparison")
  ),
  projectsByComparison: lazy(
    () => import("../financements-par-aap/pages/comparison/charts/projects-by-comparison")
  ),

  // Outcomes
  outcomesFluxSankey: lazy(
    () => import("../devenir-etudiants/pages/flux/charts/sankey")
  ),
  outcomesPhdDonut: lazy(
    () => import("../devenir-etudiants/pages/plus-haut-diplome/charts/diploma-donut")
  ),
  outcomesRepartition: lazy(
    () => import("../devenir-etudiants/pages/repartition/charts/repartition-column")
  ),
  outcomesCroisementsHeatmap: lazy(
    () => import("../devenir-etudiants/pages/croisements/heatmap")
  ),
  outcomesComparaisonProfils: lazy(
    () => import("../devenir-etudiants/pages/comparaison-profils")
  ),
};

export type ChartId = keyof typeof chartsRegistry;

export function getChart(chartId: string) {
  return chartsRegistry[chartId as ChartId];
}

export function isValidChartId(chartId: string): chartId is ChartId {
  return chartId in chartsRegistry;
}
