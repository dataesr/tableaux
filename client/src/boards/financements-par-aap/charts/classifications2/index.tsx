import { Title } from "@dataesr/dsfr-plus"
import { useQuery } from "@tanstack/react-query"
import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js"
import { useState } from "react"
import { useSearchParams } from "react-router-dom"

import DefaultSkeleton from "../../../../components/charts-skeletons/default.tsx"
import { useChartColor } from "../../../../hooks/useChartColor.tsx"
import { getI18nLabel } from "../../../../utils.tsx"
import ChartWrapperFundings from "../../components/chart-wrapper-fundings/index.tsx"
import SegmentedControl from "../../components/segmented-control/index.tsx"
import i18n from "../../i18n.json"
import { formatCompactNumber, funders, getCssColor, getEsQuery, getYearRangeLabel, pattern } from "../../utils.ts"

const { VITE_APP_ES_INDEX_PARTICIPATIONS, VITE_APP_SERVER_URL } = import.meta.env

export default function Classifications2({ name }: { name: string | undefined }) {
  const [selectedControl, setSelectedControl] = useState("projects")
  const [searchParams] = useSearchParams()
  const region = searchParams.get("region")
  const structure = searchParams.get("structureId")
  const yearMax = searchParams.get("yearMax")
  const yearMin = searchParams.get("yearMin")
  const color = useChartColor()

  const body = {
    ...getEsQuery({ regions: [region], structures: [structure], yearMax, yearMin }),
    aggregations: {
      by_classifications_project: {
        terms: {
          field: "project_classification.primary_field.keyword",
          size: 15,
        },
        aggregations: {
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
      by_classifications_budget: {
        terms: {
          field: "project_classification.primary_field.keyword",
          order: { "sum_budget": "desc" },
          size: 15,
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
      by_classifications_funding: {
        terms: {
          field: "project_classification.primary_field.keyword",
          order: { "sum_funding": "desc" },
          size: 15,
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
  };

  const { data, isLoading } = useQuery({
    queryKey: ["fundings-classifications2", region, structure, yearMax, yearMin],
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

  const seriesBudget: any = [];
  const seriesFunding: any = [];
  const seriesProject: any = [];
  const seriesBudgetRegion: any = [];
  const seriesFundingRegion: any = [];
  const seriesProjectRegion: any = [];
  const classificationsBudget = data?.aggregations?.by_classifications_budget?.buckets ?? [];
  const classificationsFunding = data?.aggregations?.by_classifications_funding?.buckets ?? [];
  const classificationsProject = data?.aggregations?.by_classifications_project?.buckets ?? [];
  classificationsBudget.forEach((classification) => {
    seriesBudget.push({
      color: { pattern: { ...pattern, backgroundColor: getCssColor({ name: classification.key, prefix: "classification" }) } },
      data: funders.map((funder) => classification?.by_project_type?.buckets
        ?.find((bucket) => bucket.key === funder)?.is_coordinator?.buckets
        ?.find((bucket) => bucket.key === 1)?.should_ignore_budget?.buckets
        ?.find((bucket) => bucket.key.toString() === '0')?.sum_budget?.value ?? 0),
      name: [classification.key, getI18nLabel(i18n, 'coordinator')].join(' - '),
    });
    seriesBudget.push({
      color: getCssColor({ name: classification.key, prefix: "classification" }),
      data: funders.map((funder) => classification?.by_project_type?.buckets
        ?.find((bucket) => bucket.key === funder)?.is_coordinator?.buckets
        ?.find((bucket) => bucket.key === 0)?.should_ignore_budget?.buckets
        ?.find((bucket) => bucket.key.toString() === '0')?.sum_budget?.value ?? 0),
      name: [classification.key, getI18nLabel(i18n, 'not-coordinator')].join(' - '),
    });
    seriesBudgetRegion.push({
      color: getCssColor({ name: classification.key, prefix: "classification" }),
      data: funders.map((funder) => classification
        ?.by_project_type.buckets?.find((project) => project.key === funder)
        ?.should_ignore_budget?.buckets?.find((bucket) => bucket.key.toString() === '0')?.sum_budget?.value ?? 0),
      name: classification.key,
    });
  });
  classificationsFunding.forEach((classification) => {
    seriesFunding.push({
      color: { pattern: { ...pattern, backgroundColor: getCssColor({ name: classification.key, prefix: "classification" }) } },
      data: funders.map((funder) => classification?.by_project_type?.buckets
        ?.find((bucket) => bucket.key === funder)?.is_coordinator?.buckets
        ?.find((bucket) => bucket.key === 1)?.should_ignore_funding?.buckets
        ?.find((bucket) => bucket.key.toString() === '0')?.sum_funding?.value ?? 0),
      name: [classification.key, getI18nLabel(i18n, 'coordinator')].join(' - '),
    });
    seriesFunding.push({
      color: getCssColor({ name: classification.key, prefix: "classification" }),
      data: funders.map((funder) => classification?.by_project_type?.buckets
        ?.find((bucket) => bucket.key === funder)?.is_coordinator?.buckets
        ?.find((bucket) => bucket.key === 0)?.should_ignore_funding?.buckets
        ?.find((bucket) => bucket.key.toString() === '0')?.sum_funding?.value ?? 0),
      name: [classification.key, getI18nLabel(i18n, 'not-coordinator')].join(' - '),
    });
    seriesFundingRegion.push({
      color: getCssColor({ name: classification.key, prefix: "classification" }),
      data: funders.map((funder) => classification
        ?.by_project_type.buckets?.find((project) => project.key === funder)
        ?.should_ignore_funding?.buckets?.find((bucket) => bucket.key.toString() === '0')?.sum_funding?.value ?? 0),
      name: classification.key,
    });
  });
  classificationsProject.forEach((classification) => {
    seriesProject.push({
      color: { pattern: { ...pattern, backgroundColor: getCssColor({ name: classification.key, prefix: "classification" }) } },
      data: funders.map((funder) => classification?.by_project_type?.buckets
        ?.find((bucket) => bucket.key === funder)?.is_coordinator?.buckets
        ?.find((bucket) => bucket.key === 1)?.by_unique_project?.value ?? 0),
      name: [classification.key, getI18nLabel(i18n, 'coordinator')].join(' - '),
    });
    seriesProject.push({
      color: getCssColor({ name: classification.key, prefix: "classification" }),
      data: funders.map((funder) => classification?.by_project_type?.buckets
        ?.find((bucket) => bucket.key === funder)?.is_coordinator?.buckets
        ?.find((bucket) => bucket.key === 0)?.by_unique_project?.value ?? 0),
      name: [classification.key, getI18nLabel(i18n, 'not-coordinator')].join(' - '),
    });
    seriesProjectRegion.push({
      color: getCssColor({ name: classification.key, prefix: "classification" }),
      data: funders.map((funder) => classification
        ?.by_project_type.buckets?.find((project) => project.key === funder)
        ?.by_unique_project?.value ?? 0),
      name: classification.key,
    });
  });

  const title = `Disciplines par financeur de ${structure ? "l'établissement" : "la région"} ${name} ${getYearRangeLabel({ yearMax, yearMin })}`;
  // If view by number of projects
  let axis = getI18nLabel(i18n, 'number_of_projects_funded');
  let dataLabel = function (this: any) {
    return `${this.y} projet${this.y > 1 ? 's' : ''}`;
  };
  let series = structure ? seriesProject.reverse() : seriesProjectRegion.reverse();
  let stackLabel = function (this: any) {
    return `${this.total} projet${this.total > 1 ? 's' : ''}`;
  };
  let tooltip = function (this: any) {
    return `<b>${this.y}</b> projets <b>${this.key}</b> auxquels participe ${structure ? "l'établissement" : "la région"} <b>${name}</b> en <b>${this.series.name}</b> ${getYearRangeLabel({ isBold: true, yearMax, yearMin })}`;
  };
  switch (selectedControl) {
    // If view by global amount
    case 'amount_global':
      axis = getI18nLabel(i18n, 'funding_total');
      dataLabel = function (this: any) {
        return `${formatCompactNumber(this.y)} €`;
      };
      series = structure ? seriesBudget.reverse() : seriesBudgetRegion.reverse();
      stackLabel = function (this: any) {
        return `${formatCompactNumber(this.total)} €`;
      };
      tooltip = function (this: any) {
        return `<b>${formatCompactNumber(this.y)} €</b> financés au global pour les projets <b>${this.key}</b> auxquels participe ${structure ? "l'établissement" : "la région"} <b>${name}</b> en <b>${this.series.name}</b> ${getYearRangeLabel({ isBold: true, yearMax, yearMin })}`;
      };
      break;
    // If view by amount by structure
    case 'amount_by_structure':
      axis = getI18nLabel(i18n, structure ? 'funding_by_structure' : 'funding_by_region');
      dataLabel = function (this: any) {
        return `${formatCompactNumber(this.y)} €`;
      };
      series = structure ? seriesFunding.reverse() : seriesFundingRegion.reverse();
      stackLabel = function (this: any) {
        return `${formatCompactNumber(this.total)} €`;
      };
      tooltip = function (this: any) {
        return `<b>${formatCompactNumber(this.y)} €</b> perçus pour les projets <b>${this.key}</b> auxquels participe ${structure ? "l'établissement" : "la région"} <b>${name}</b> en <b>${this.series.name}</b> ${getYearRangeLabel({ isBold: true, yearMax, yearMin })}`;
      };
      break;
  };

  const config = {
    comment: {
      "fr": <>{`Ce graphe présente la distribution des projets auxquels participe ${structure ? "l'établissement" : "la région"}, 
        par financeur et selon les grandes classifications disciplinaires. Les barres représentent le nombre / le financement 
        global ou perçu pour les projets rattachés à chaque domaine, permettant d’identifier les champs scientifiques les plus 
        présents dans les projets auxquels ${structure ? "l'établissement" : "la région"} participe. ${structure ? "Le type de \
        participation est distingué, en pointillé quand l'établissement est coordinateur, en couleur simple s'il est partenaire \
        non-coordinateur." : ""} Le financement global représente le volume total de financements des projets auxquels participe 
        ${structure ? "l'établissement" : "la région"}. Le financement perçu approxime la part réelle allouée à chaque 
        ${structure ? "établissement" : "région"} partenaire d’un projet (en assimilant consommation et subvention pour le PIA). 
        Les disciplines ont été estimées par IA, à partir du titre, résumé et mots clés des projets.`}</>,
    },
    id: "classifications2",
    integrationURL: `/integration?chart_id=classifications2&${searchParams.toString()}`,
    title,
  };

  const options: HighchartsInstance.Options = {
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
    xAxis: { categories: funders, title: { text: "" } },
    yAxis: {
      stackLabels: {
        enabled: true,
        formatter: stackLabel,
        style: { fontWeight: "bold" },
      },
      title: { text: axis },
    },
  };

  return (
    <div className={`chart-container chart-container--${color}`} id="classifications2">
      <Title as="h2" look="h6">
        {title}
      </Title>
      <SegmentedControl selectedControl={selectedControl} setSelectedControl={setSelectedControl} />
      {isLoading ? <DefaultSkeleton height="600px" /> : <ChartWrapperFundings config={config} hideTitle options={options} />}
    </div>
  );
};
