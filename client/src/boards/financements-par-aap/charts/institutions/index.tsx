import { Title } from "@dataesr/dsfr-plus";
import { useQuery } from "@tanstack/react-query";
import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";

import DefaultSkeleton from "../../../../components/charts-skeletons/default.tsx";
import { useChartColor } from "../../../../hooks/useChartColor.tsx";
import { getI18nLabel } from "../../../../utils.tsx";
import ChartWrapperFundings from "../../components/chart-wrapper-fundings/index.tsx";
import SegmentedControl from "../../components/segmented-control/index.tsx";
import i18n from "../../i18n.json";
import { formatCompactNumber, funders, getCssColor, getEsQuery, getYearRangeLabel, pattern } from "../../utils.ts";

const { VITE_APP_ES_INDEX_PARTICIPATIONS, VITE_APP_SERVER_URL } = import.meta.env;

export default function Institutions({ name }: { name: string | undefined }) {
  const [selectedControl, setSelectedControl] = useState("projects")
  const [searchParams] = useSearchParams()
  const region = searchParams.get("region")
  const structure = searchParams.get("structure")
  const yearMax = searchParams.get("yearMax")
  const yearMin = searchParams.get("yearMin")
  const color = useChartColor()

  const body: any = {
    ...getEsQuery({ regions: [region], structures: [structure], yearMax, yearMin }),
    aggregations: {
      by_institution_project: {
        terms: {
          field: "participant_id_name_default.keyword",
          order: { "by_unique_project": "desc" },
        },
        aggregations: {
          by_unique_project: {
            cardinality: {
              field: "project_id.keyword",
            },
          },
          by_project_type: {
            terms: {
              field: "project_type.keyword",
            },
            aggregations: {
              is_coordinator: {
                terms: {
                  field: "participation_is_coordinator",
                },
                aggregations: {
                  by_unique_project: {
                    cardinality: {
                      field: "project_id.keyword",
                    },
                  },
                },
              },
              by_unique_project: {
                cardinality: {
                  field: "project_id.keyword",
                },
              },
            },
          },
        },
      },
      by_institution_budget: {
        terms: {
          field: "participant_id_name_default.keyword",
          order: { "sum_budget": "desc" },
        },
        aggregations: {
          sum_budget: {
            sum: {
              field: "project_budgetFinanced",
            },
          },
          by_project_type: {
            terms: {
              field: "project_type.keyword",
            },
            aggregations: {
              is_coordinator: {
                terms: {
                  field: "participation_is_coordinator",
                },
                aggregations: {
                  should_ignore_budget: {
                    terms: {
                      field: structure ? "participant_ignore_total_budget" : "region_ignore_total_budget",
                      missing: 0,
                    },
                    aggregations: {
                      sum_budget: {
                        sum: {
                          field: "project_budgetFinanced",
                        },
                      },
                    },
                  },
                },
              },
              should_ignore_budget: {
                terms: {
                  field: structure ? "participant_ignore_total_budget" : "region_ignore_total_budget",
                  missing: 0,
                },
                aggregations: {
                  sum_budget: {
                    sum: {
                      field: "project_budgetFinanced",
                    },
                  },
                },
              },
            },
          },
        },
      },
      by_institution_funding: {
        terms: {
          field: "participant_id_name_default.keyword",
          order: { "sum_funding": "desc" },
        },
        aggregations: {
          sum_funding: {
            sum: {
              field: "participation_funding",
            },
          },
          by_project_type: {
            terms: {
              field: "project_type.keyword",
            },
            aggregations: {
              is_coordinator: {
                terms: {
                  field: "participation_is_coordinator",
                },
                aggregations: {
                  should_ignore_funding: {
                    terms: {
                      field: structure ? "participant_ignore_funding" : "region_ignore_funding",
                      missing: 0,
                    },
                    aggregations: {
                      sum_funding: {
                        sum: {
                          field: "participation_funding",
                        },
                      },
                    },
                  },
                },
              },
              should_ignore_funding: {
                terms: {
                  field: structure ? "participant_ignore_funding" : "region_ignore_funding",
                  missing: 0,
                },
                aggregations: {
                  sum_funding: {
                    sum: {
                      field: "participation_funding",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  }
  if (region) {
    const filters = body.query.bool.filter.filter((f) => !f?.terms?.["participant_region.keyword"])// && f?.terms?.["participant_region.keyword"]?.length === 0 && f?.terms?.["participant_region.keyword"]?.[0] === region)
    filters.push({ terms: { "participant_region_with_labs.keyword": [region] } })
    body.query.bool.filter = filters
  }

  const { data, isLoading } = useQuery({
    queryKey: ["fundings-institutions", region, structure, yearMax, yearMin],
    queryFn: () =>
      fetch(`${VITE_APP_SERVER_URL}/elasticsearch?index=${VITE_APP_ES_INDEX_PARTICIPATIONS}`, {
        body: JSON.stringify(body),
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        method: "POST",
      }).then((response) => response.json()),
  });

  const seriesBudget: any = []
  const seriesFunding: any = []
  const seriesProject: any = []
  const seriesBudgetRegion: any = []
  const seriesFundingRegion: any = []
  const seriesProjectRegion: any = []
  const institutionsBudget = data?.aggregations?.by_institution_budget?.buckets ?? []
  const institutionsFunding = data?.aggregations?.by_institution_funding?.buckets ?? []
  const institutionsProject = data?.aggregations?.by_institution_project?.buckets ?? []

  // 1. Calculer les totaux réels pour le tri (après filtrage should_ignore)
  const budgetTotals = institutionsBudget.map((bucket) => {
    return funders.reduce((sum, funder) => {
      const val = bucket.by_project_type.buckets
        ?.find((bucket) => bucket.key === funder)
        ?.should_ignore_budget?.buckets
        ?.find((bucket) => bucket.key.toString() === '0')
        ?.sum_budget?.value ?? 0;
      return sum + val;
    }, 0)
  })
  const fundingTotals = institutionsFunding.map((bucket) => {
    return funders.reduce((sum, funder) => {
      const val = bucket.by_project_type.buckets
        ?.find((bucket) => bucket.key === funder)
        ?.should_ignore_funding?.buckets
        ?.find((bucket) => bucket.key.toString() === '0')
        ?.sum_funding?.value ?? 0;
      return sum + val;
    }, 0)
  })
  // 2. Calculer l'ordre de tri décroissant
  const sortedIndicesBudget = budgetTotals
    .map((total, index) => ({ index, total }))
    .sort((a, b) => b.total - a.total)
    .map(({ index }) => index);
  const sortedIndicesFunding = fundingTotals
    .map((total, index) => ({ index, total }))
    .sort((a, b) => b.total - a.total)
    .map(({ index }) => index);
  // 3. Réordonner les catégories
  const categoriesBudget = sortedIndicesBudget.map((i) =>
    institutionsBudget[i].key.split('###')[1]
  )
  const categoriesFunding = sortedIndicesFunding.map((i) =>
    institutionsFunding[i].key.split('###')[1]
  )
  // 4. Réordonner les données dans chaque série
  const sortedBudgetBuckets = sortedIndicesBudget.map((i) => institutionsBudget[i]);
  const sortedFundingBuckets = sortedIndicesFunding.map((i) => institutionsFunding[i]);

  funders.forEach((funder) => {
    seriesBudget.push({
      color: { pattern: { ...pattern, backgroundColor: getCssColor({ name: funder, prefix: 'funder' }) } },
      data: sortedBudgetBuckets.map((bucket) => bucket.by_project_type.buckets
        ?.find((bucket) => bucket.key === funder)?.is_coordinator?.buckets
        ?.find((bucket) => bucket.key === 1)?.should_ignore_budget?.buckets
        ?.find((bucket) => bucket.key.toString() === '0')?.sum_budget?.value ?? 0),
      name: [funder, getI18nLabel(i18n, 'coordinator')].join(' - '),
    });
    seriesBudget.push({
      color: getCssColor({ name: funder, prefix: 'funder' }),
      data: sortedBudgetBuckets.map((bucket) => bucket.by_project_type.buckets
        ?.find((bucket) => bucket.key === funder)?.is_coordinator?.buckets
        ?.find((bucket) => bucket.key === 0)?.should_ignore_budget?.buckets
        ?.find((bucket) => bucket.key.toString() === '0')?.sum_budget?.value ?? 0),
      name: [funder, getI18nLabel(i18n, 'not-coordinator')].join(' - '),
    });
    seriesBudgetRegion.push({
      color: getCssColor({ name: funder, prefix: 'funder' }),
      data: sortedBudgetBuckets.map((bucket) => bucket
        ?.by_project_type.buckets?.find((bucket) => bucket.key === funder)
        ?.should_ignore_budget?.buckets?.find((bucket) => bucket.key.toString() === '0')?.sum_budget?.value ?? 0),
      name: funder,
    });
    seriesFunding.push({
      color: { pattern: { ...pattern, backgroundColor: getCssColor({ name: funder, prefix: 'funder' }) } },
      data: sortedFundingBuckets.map((bucket) => bucket.by_project_type.buckets
        ?.find((bucket) => bucket.key === funder)?.is_coordinator?.buckets
        ?.find((bucket) => bucket.key === 1)?.should_ignore_funding?.buckets
        ?.find((bucket) => bucket.key.toString() === '0')?.sum_funding?.value ?? 0),
      name: [funder, getI18nLabel(i18n, 'coordinator')].join(' - '),
    });
    seriesFunding.push({
      color: getCssColor({ name: funder, prefix: 'funder' }),
      data: sortedFundingBuckets.map((bucket) => bucket.by_project_type.buckets
        ?.find((bucket) => bucket.key === funder)?.is_coordinator?.buckets
        ?.find((bucket) => bucket.key === 0)?.should_ignore_funding?.buckets
        ?.find((bucket) => bucket.key.toString() === '0')?.sum_funding?.value ?? 0),
      name: [funder, getI18nLabel(i18n, 'not-coordinator')].join(' - '),
    });
    seriesFundingRegion.push({
      color: getCssColor({ name: funder, prefix: 'funder' }),
      data: sortedFundingBuckets.map((bucket) => bucket
        ?.by_project_type.buckets?.find((bucket) => bucket.key === funder)
        ?.should_ignore_funding?.buckets?.find((bucket) => bucket.key.toString() === '0')?.sum_funding?.value ?? 0),
      name: funder,
    });
    seriesProject.push({
      color: { pattern: { ...pattern, backgroundColor: getCssColor({ name: funder, prefix: 'funder' }) } },
      data: institutionsProject.map((bucket) => bucket.by_project_type.buckets
        ?.find((bucket) => bucket.key === funder)?.is_coordinator?.buckets
        ?.find((bucket) => bucket.key === 1)?.by_unique_project?.value ?? 0),
      name: [funder, getI18nLabel(i18n, 'coordinator')].join(' - '),
    });
    seriesProject.push({
      color: getCssColor({ name: funder, prefix: 'funder' }),
      data: institutionsProject.map((bucket) => bucket.by_project_type.buckets
        ?.find((bucket) => bucket.key === funder)?.is_coordinator?.buckets
        ?.find((bucket) => bucket.key === 0)?.by_unique_project?.value ?? 0),
      name: [funder, getI18nLabel(i18n, 'not-coordinator')].join(' - '),
    });
    seriesProjectRegion.push({
      color: getCssColor({ name: funder, prefix: 'funder' }),
      data: institutionsProject.map((bucket) => bucket
        ?.by_project_type.buckets?.find((bucket) => bucket.key === funder)
        ?.by_unique_project?.value ?? 0),
      name: funder,
    });
  });
  seriesBudget.reverse()
  seriesFunding.reverse()
  seriesProject.reverse()
  seriesBudgetRegion.reverse()
  seriesFundingRegion.reverse()
  seriesProjectRegion.reverse()
  const categoriesProject = institutionsProject.map((bucket) => bucket.key.split('###')[1]);

  const title = `Principaux établissements de ${structure ? "l'établissement" : "la région"} ${name} impliqués dans les projets par AAP ${getYearRangeLabel({ yearMax, yearMin })}`;
  // If view by number of projects
  let axis = getI18nLabel(i18n, 'number_of_projects_funded');
  let categories = categoriesProject;
  let dataLabel = function (this: any) {
    return `${this.y} projet${this.y > 1 ? 's' : ''}`;
  };
  let series = structure ? seriesProject : seriesProjectRegion;
  let stackLabel = function (this: any) {
    return `${this.total} projet${this.total > 1 ? 's' : ''}`;
  };
  let tooltip = function (this: any) {
    return `<b>${this.y}</b> projets <b>${this.series.name}</b> auxquels participe <b>${categoriesProject[this.x]}</b> ${getYearRangeLabel({ isBold: true, yearMax, yearMin })}`;
  };
  switch (selectedControl) {
    // If view by global amount
    case 'amount_global':
      axis = getI18nLabel(i18n, 'funding_total');
      categories = categoriesBudget;
      dataLabel = function (this: any) {
        return `${formatCompactNumber(this.y)} €`;
      };
      series = structure ? seriesBudget : seriesBudgetRegion;
      stackLabel = function (this: any) {
        return `${formatCompactNumber(this.total)} €`;
      };
      tooltip = function (this: any) {
        return `<b>${formatCompactNumber(this.y)} €</b> ont été financés au global dans le cadre de projets <b>${this.series.name}</b> pour des projets débutés ${getYearRangeLabel({ isBold: true, yearMax, yearMin })} auxquels prend part <b>${categoriesBudget[this.x]}</b>`;
      };
      break;
    // If view by amount by structure
    case 'amount_by_structure':
      axis = getI18nLabel(i18n, structure ? 'funding_by_structure' : 'funding_by_region');
      categories = categoriesFunding;
      dataLabel = function (this: any) {
        return `${formatCompactNumber(this.y)} €`;
      };
      series = structure ? seriesFunding : seriesFundingRegion;
      stackLabel = function (this: any) {
        return `${formatCompactNumber(this.total)} €`;
      };
      tooltip = function (this: any) {
        return `<b>${formatCompactNumber(this.y)} €</b> ont été perçus par <b>${categoriesFunding[this.x]}</b> dans le cadre de projets <b>${this.series.name}</b> pour des projets débutés ${getYearRangeLabel({ isBold: true, yearMax, yearMin })}`;
      };
      break;
  };

  const config = {
    comment: {
      "fr": <>{`Ce graphe présente la répartition des projets financés par appels à projets (AAP) dans lesquels 
        ${structure ? "l'établissement" : "la région"} est impliqué${structure ? "" : "e"}, ventilée par laboratoire et par 
        financeur. Les sources de données ne donnent pas toujours accès au niveau laboratoire. Pour les projets européens, 
        c'est un travail mené avec 5 organismes pour ajouter ce niveau, avec un délai d'actualisation de un an. Pour le PIA, 
        les données au niveau laboratoire ne sont pas disponibles. ${structure ? "Le type de participation est distingué, en \
        pointillé quand l'établissement est coordinateur, en couleur simple s'il est partenaire non-coordinateur." : ""} Le 
        financement global représente le volume total de financements des projets auxquels participe ${structure ? "l'établissement" : "la région"}. 
        Le financement perçu approxime la part réelle allouée à chaque ${structure ? "l'établissement" : "la région"} partenaire 
        d’un projet (en assimilant consommation et subvention pour le PIA).`}</>,
    },
    id: "institutions",
    integrationURL: `/integration?chart_id=institutions&${searchParams.toString()}`,
    title,
  };

  const options: HighchartsInstance.Options = {
    chart: { height: "1000px" },
    legend: { enabled: true, reversed: true },
    plotOptions: {
      series: {
        dataLabels: {
          enabled: true,
          formatter: dataLabel,
        },
        stacking: "normal",
      },
    },
    series,
    title: { text: "" },
    tooltip: { formatter: tooltip },
    xAxis: { categories, title: { text: "" } },
    yAxis: {
      stackLabels: {
        enabled: true,
        style: {
          fontWeight: "bold",
        },
        formatter: stackLabel,
      },
      title: { text: axis },
    },
  };

  return (
    <div className={`chart-container chart-container--${color}`} id="institutions">
      <Title as="h2" look="h6">
        {title}
      </Title>
      <SegmentedControl selectedControl={selectedControl} setSelectedControl={setSelectedControl} />
      {isLoading ? <DefaultSkeleton height="1000px" /> : <ChartWrapperFundings config={config} hideTitle options={options} />}
    </div>
  );
}
