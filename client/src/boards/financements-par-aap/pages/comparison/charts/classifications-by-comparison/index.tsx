import { Title } from "@dataesr/dsfr-plus"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { useSearchParams } from "react-router-dom"
import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js"

import DefaultSkeleton from "../../../../../../components/charts-skeletons/default.tsx"
import { useChartColor } from "../../../../../../hooks/useChartColor.tsx"
import { getI18nLabel } from "../../../../../../utils"
import ChartWrapperFundings from "../../../../components/chart-wrapper-fundings"
import SegmentedControl from "../../../../components/segmented-control"
import i18n from "../../../../i18n.json"
import { formatCompactNumber, getCssColor, getEsQuery, getYearRangeLabel, pattern } from "../../../../utils.ts"

const { VITE_APP_ES_INDEX_PARTICIPATIONS, VITE_APP_SERVER_URL } = import.meta.env

export default function ClassificationsByComparison() {
  const [selectedControl, setSelectedControl] = useState("projects")
  const [searchParams] = useSearchParams()
  const structures = searchParams.getAll("structure")
  const yearMax = searchParams.get("yearMax")
  const yearMin = searchParams.get("yearMin")
  const color = useChartColor()

  const body = {
    ...getEsQuery({ structures, yearMax, yearMin }),
    aggregations: {
      by_structure_project: {
        terms: {
          field: "participant_encoded_key",
          size: structures.length,

        },
        aggregations: {
          by_classifications: {
            terms: {
              field: "project_classification.primary_field.keyword",
              size: 15,
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
            },
          },
        },
      },
      by_structure_budget: {
        terms: {
          field: "participant_encoded_key",
          order: { "sum_budget": "desc" },
          size: structures.length,
        },
        aggregations: {
          sum_budget: {
            sum: {
              field: "project_budgetFinanced",
            },
          },
          by_classifications: {
            terms: {
              field: "project_classification.primary_field.keyword",
              size: 15,
            },
            aggregations: {
              is_coordinator: {
                terms: {
                  field: "participation_is_coordinator",
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
      by_structure_funding: {
        terms: {
          field: "participant_encoded_key",
          order: { "sum_funding": "desc" },
          size: structures.length,
        },
        aggregations: {
          sum_funding: {
            sum: {
              field: "participation_funding",
            },
          },
          by_classifications: {
            terms: {
              field: "project_classification.primary_field.keyword",
              size: 15,
            },
            aggregations: {
              is_coordinator: {
                terms: {
                  field: "participation_is_coordinator",
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

  const { data, isLoading } = useQuery({
    queryKey: ["fundings-classifications-by-structures", structures, yearMax, yearMin],
    queryFn: () =>
      fetch(`${VITE_APP_SERVER_URL}/elasticsearch?index=${VITE_APP_ES_INDEX_PARTICIPATIONS}`, {
        body: JSON.stringify(body),
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        method: "POST",
      }).then((response) => response.json()),
  })

  const seriesBudget: any[] = []
  const seriesParticipation: any[] = []
  const seriesProject: any[] = []
  const structuresBudget = data?.aggregations?.by_structure_budget?.buckets ?? []
  const structuresParticipation = data?.aggregations?.by_structure_funding?.buckets ?? []
  const structuresProject = data?.aggregations?.by_structure_project?.buckets ?? []
  (structuresBudget?.[0]?.by_classifications?.buckets ?? []).forEach((bucket) => {
    seriesBudget.push({
      color: { pattern: { ...pattern, backgroundColor: getCssColor({ name: bucket.key, prefix: "classification" }) } },
      data: structuresBudget.map((sss) => sss.by_classifications.buckets.find((classification) => classification.key === bucket.key)?.is_coordinator?.buckets?.find((bucket) => bucket.key === 1)?.sum_budget?.value ?? 0),
      name: [bucket.key, getI18nLabel(i18n, 'coordinator')].join(' - '),
    })
    seriesBudget.push({
      color: getCssColor({ name: bucket.key, prefix: "classification" }),
      data: structuresBudget.map((sss) => sss.by_classifications.buckets.find((classification) => classification.key === bucket.key)?.is_coordinator?.buckets?.find((bucket) => bucket.key === 0)?.sum_budget?.value ?? 0),
      name: [bucket.key, getI18nLabel(i18n, 'not-coordinator')].join(' - '),
    })
  })
  (structuresParticipation?.[0]?.by_classifications?.buckets ?? []).forEach((bucket) => {
    seriesParticipation.push({
      color: { pattern: { ...pattern, backgroundColor: getCssColor({ name: bucket.key, prefix: "classification" }) } },
      data: structuresParticipation.map((sss) => sss.by_classifications.buckets.find((classification) => classification.key === bucket.key)?.is_coordinator?.buckets?.find((bucket) => bucket.key === 1)?.sum_funding?.value ?? 0),
      name: [bucket.key, getI18nLabel(i18n, 'coordinator')].join(' - '),
    })
    seriesParticipation.push({
      color: getCssColor({ name: bucket.key, prefix: "classification" }),
      data: structuresParticipation.map((sss) => sss.by_classifications.buckets.find((classification) => classification.key === bucket.key)?.is_coordinator?.buckets?.find((bucket) => bucket.key === 0)?.sum_funding?.value ?? 0),
      name: [bucket.key, getI18nLabel(i18n, 'not-coordinator')].join(' - '),
    })
  });
  (structuresProject?.[0]?.by_classifications?.buckets ?? []).forEach((bucket) => {
    seriesProject.push({
      color: { pattern: { ...pattern, backgroundColor: getCssColor({ name: bucket.key, prefix: "classification" }) } },
      data: structuresProject.map((sss) => sss.by_classifications.buckets.find((classification) => classification.key === bucket.key)?.is_coordinator?.buckets?.find((bucket) => bucket.key === 1)?.by_unique_project?.value ?? 0),
      name: [bucket.key, getI18nLabel(i18n, 'coordinator')].join(' - '),
    })
    seriesProject.push({
      color: getCssColor({ name: bucket.key, prefix: "classification" }),
      data: structuresProject.map((sss) => sss.by_classifications.buckets.find((classification) => classification.key === bucket.key)?.is_coordinator?.buckets?.find((bucket) => bucket.key === 0)?.by_unique_project?.value ?? 0),
      name: [bucket.key, getI18nLabel(i18n, 'not-coordinator')].join(' - '),
    })
  })
  const categoriesBudget = structuresBudget.map((bucket) => (Object.fromEntries(new URLSearchParams(bucket.key))).label)
  const categoriesParticipation = structuresParticipation.map((bucket) => (Object.fromEntries(new URLSearchParams(bucket.key))).label)
  const categoriesProject = structuresProject.map((bucket) => (Object.fromEntries(new URLSearchParams(bucket.key))).label)

  // If view by number of projects, view by default
  let axis = getI18nLabel(i18n, 'number_of_projects_funded')
  let categories = categoriesProject
  let dataLabel = function (this: any) {
    return `${this.y} projet${this.y > 1 ? 's' : ''}`
  }
  let series = seriesProject.reverse()
  let stackLabel = function (this: any) {
    return `${this.total} projet${this.total > 1 ? 's' : ''}`
  }
  let title = `Profils disciplinaires des établissements via les projets financés ${getYearRangeLabel({ yearMax, yearMin })}`
  let tooltip = function (this: any) {
    return `<b>${this.y}</b> projets ont débuté ${getYearRangeLabel({ isBold: true, yearMax, yearMin })} en <b>${this.series.name}</b> auxquels prend part <b>${categoriesProject[this.x]}</b>`
  }
  switch (selectedControl) {
    // If view by global amount
    case 'amount_global':
      axis = getI18nLabel(i18n, 'funding_total')
      categories = categoriesBudget
      dataLabel = function (this: any) {
        return `${formatCompactNumber(this.y)} €`
      }
      series = seriesBudget.reverse()
      stackLabel = function (this: any) {
        return `${formatCompactNumber(this.total)} €`
      }
      title = `Profils disciplinaires des établissements via le montant des projets financés ${getYearRangeLabel({ yearMax, yearMin })}`
      tooltip = function (this: any) {
        return `<b>${formatCompactNumber(this.y)} €</b> ont été financés au global en <b>${this.series.name}</b> pour des projets débutés ${getYearRangeLabel({ isBold: true, yearMax, yearMin })} auxquels prend part <b>${categoriesBudget[this.x]}</b>`
      }
      break
    // If view by amount by structure
    case 'amount_by_structure':
      axis = getI18nLabel(i18n, 'funding_by_structure')
      categories = categoriesParticipation
      dataLabel = function (this: any) {
        return `${formatCompactNumber(this.y)} €`
      }
      series = seriesParticipation.reverse()
      stackLabel = function (this: any) {
        return `${formatCompactNumber(this.total)} €`
      }
      title = `Profils disciplinaires des établissements via les montants perçus ${getYearRangeLabel({ yearMax, yearMin })}`
      tooltip = function (this: any) {
        return `<b>${formatCompactNumber(this.y)} €</b> ont été perçus par <b>${categoriesBudget[this.x]}</b> pour des projets en <b>${this.series.name}</b> débutés ${getYearRangeLabel({ isBold: true, yearMax, yearMin })}`
      }
      break
  }

  const config = {
    comment: {
      "fr": <>Ce graphe présente, pour chaque établissement, la répartition des projets financés par AAP selon les grandes classifications disciplinaires.
        Chaque barre correspond à un établissement et est ventilée par discipline, permettant d’observer la structure scientifique de sa participation aux projets financés.
        L’analyse doit se concentrer sur la composition relative des barres, afin de comparer les profils disciplinaires indépendamment de la taille des établissements.
        Le type de participation est distingué, en pointillé quand l'établissement est coordinateur, en couleur simple s'il est partenaire non-coordinateur. Le financement global représente le volume total de financements des projets auxquels participe l'établissement. Le financement perçu approxime la part réelle allouée à chaque établissement partenaire d’un projet (en assimilant consommation et subvention pour le PIA).
      </>
    },
    id: "classificationsByComparison",
    integrationURL: `/integration?chart_id=classificationsByComparison&${searchParams.toString()}`,
    title,
  }

  const options: HighchartsInstance.Options = {
    legend: { enabled: true, reversed: true },
    plotOptions: {
      series: {
        dataLabels: {
          enabled: true,
          formatter: dataLabel,
        },
        stacking: "normal",
      }
    },
    series,
    tooltip: { formatter: tooltip },
    title: { text: "" },
    xAxis: { categories, title: { text: "" } },
    yAxis: {
      stackLabels: {
        enabled: true,
        formatter: stackLabel,
        style: { fontWeight: "bold" },
      },
      title: { text: axis },
    },
  }

  return (
    <div className={`chart-container chart-container--${color}`} id="classifications-by-comparison">
      <Title as="h2" look="h6">
        {title}
      </Title>
      <SegmentedControl selectedControl={selectedControl} setSelectedControl={setSelectedControl} />
      {isLoading ? <DefaultSkeleton height="600px" /> : <ChartWrapperFundings config={config} hideTitle options={options} />}
    </div>
  )
}
