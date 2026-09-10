import { useQuery } from "@tanstack/react-query"
import { useSearchParams } from "react-router-dom"
import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js"

import DefaultSkeleton from "../../../../../../components/charts-skeletons/default.tsx"
import { useChartColor } from "../../../../../../hooks/useChartColor.tsx"
import { getI18nLabel } from "../../../../../../utils"
import ChartWrapperFundings from "../../../../components/chart-wrapper-fundings"
import { formatCompactNumber, getEsQuery, getYearRangeLabel } from "../../../../utils.ts"
import i18n from "../../../../i18n.json"

const { VITE_APP_ES_INDEX_PARTICIPATIONS, VITE_APP_SERVER_URL } = import.meta.env

export default function DispersionByComparison() {
  const [searchParams] = useSearchParams()
  const structures = searchParams.getAll("structure")
  const yearMax = searchParams.get("yearMax")
  const yearMin = searchParams.get("yearMin")
  const color = useChartColor()

  const body = {
    ...getEsQuery({ structures, yearMax, yearMin }),
    aggregations: {
      by_typology: {
        terms: {
          field: "participant_typologie_1.keyword",
        },
        aggregations: {
          by_structure: {
            terms: {
              field: "participant_encoded_key",
              size: structures.length,
            },
            aggregations: {
              by_unique_project: {
                cardinality: {
                  field: "project_id.keyword",
                },
              },
              sum_budget: {
                sum: {
                  field: "participation_funding",
                },
              },
              unique_labs: {
                cardinality: {
                  field: "co_partners_fr_labs.keyword"
                }
              }
            },
          },
        },
      },
    },
  }

  const { data, isLoading } = useQuery({
    queryKey: ["fundings-dispersion", structures, yearMax, yearMin],
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

  const series = (data?.aggregations?.by_typology?.buckets ?? []).map((typology) => ({
    data: (typology?.by_structure?.buckets ?? []).map((structure) => ({
      name: (Object.fromEntries(new URLSearchParams(structure.key))).label,
      x: structure?.by_unique_project?.value ?? 0,
      y: structure?.sum_budget?.value ?? 0,
      yFormatted: `${formatCompactNumber(structure?.sum_budget?.value ?? 0)} €`,
      z: structure?.unique_labs?.value ?? 0,
    })),
    name: typology.key,
  }))

  const xs = series.map((funder) => funder.data.map((structure) => structure.x)).flat()
  const tickInterval = (Math.max.apply(null, xs) - Math.min.apply(null, xs)) / 10
  const meanX = xs.length > 0 ? xs.reduce((prev, current) => prev + current) / xs.length : undefined
  const ys = series.map((funder) => funder.data.map((structure) => structure.y)).flat()
  const meanY = ys.length > 0 ? ys.reduce((prev, current) => prev + current) / ys.length : undefined

  const config = {
    comment: { "fr": <>Ce graphique positionne chaque établissement selon deux dimensions :
– en abscisse, le nombre de projets financés auxquels il participe ;
– en ordonnée, le financement perçu des projets correspondants. Il permet d’identifier différents profils :
des établissements impliqués dans un grand nombre de projets,
d'autres positionnés sur moins de projets mais de montant élevé,
et ceux combinant volume et intensité financière.
Le financement perçu approxime la part réelle allouée à chaque établissement partenaire d’un projet (en assimilant consommation et subvention pour le PIA).
</> },
    id: "dispersionByComparison",
    integrationURL: `/integration?chart_id=dispersionByComparison&${searchParams.toString()}`,
    title: `Positionnement des établissements selon le nombre de projets et le financement perçu associé ${getYearRangeLabel({ yearMax, yearMin })}`,
  }

  const options: HighchartsInstance.Options = {
    chart: { plotBorderWidth: 1, type: "bubble", zooming: { type: "xy" } },
    legend: { enabled: true },
    plotOptions: { series: { dataLabels: { enabled: true, format: "{point.name}" } } },
    series,
    tooltip: {
      format: `<b>{point.name}</b> a participé à <b>{point.x} projets</b> dont le financement perçu représente <b>{point.yFormatted}</b> ${getYearRangeLabel({ isBold: true, yearMax, yearMin })}</b> et a <b>{point.z}</b> laboratoires`,
    },
    xAxis: {
      categories: [],
      gridLineWidth: 1,
      lineWidth: 1,
      plotLines: [{
        dashStyle: "Dot",
        label: { rotation: 0, style: { fontStyle: "italic" }, text: `Nombre moyen de projets = ${Math.round(meanX || 0)}`, x: 10, y: 15 },
        value: meanX,
        width: 2,
        zIndex: 3,
      }],
      tickInterval,
      title: { text: getI18nLabel(i18n, 'number_of_projects_funded') },
    },
    yAxis: {
      lineWidth: 1,
      plotLines: [{
        dashStyle: "Dot",
        label: { align: "right", style: { fontStyle: "italic" }, text: `Montant moyen des projets = ${formatCompactNumber(meanY || 0)} €`, x: -8, y: -8 },
        value: meanY,
        width: 2,
        zIndex: 3
      }],
      title: { text: getI18nLabel(i18n, 'funding_total') },
    },
    title: { text: "" },
  }

  return (
    <div className={`chart-container chart-container--${color}`} id="dispersion-by-comparison">
      {isLoading ? <DefaultSkeleton height="600px" /> : <ChartWrapperFundings config={config} options={options} />}
    </div>
  )
}
