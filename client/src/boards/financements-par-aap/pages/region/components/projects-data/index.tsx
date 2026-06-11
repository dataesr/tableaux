import { Button, Col, Row, Text, Title } from "@dataesr/dsfr-plus"
import { useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"

import DefaultSkeleton from "../../../../../../components/charts-skeletons/default.tsx"
import { getEsQuery } from "../../../../utils.ts"
import DataTable from "./datatable.tsx"

const { VITE_APP_ES_INDEX_PARTICIPATIONS, VITE_APP_SERVER_URL } = import.meta.env

type Column = {
  id: string,
  isFilterable?: boolean, // Is the column filterable, by default a simple tetx input is displayed. False if omitted
  isFilterableBySelect?: boolean, // If true and if an aggregation named like the colummn id exists, display a select, feeded by the aggregations buckets
  isSortable?: boolean, // Is the column sortable. False if omitted
  label?: string, // Column label as header. If omitted, the column id is displayed instead
  sortableField?: string, // Is the column sortable
}

type Filter = {
  id: string
  value: string
}

type Project = {
  id: string
  instrument: string
  label: string
  participantId: string
  participantLabel: string
  participationFunding: number
  participationIsCoordinator: boolean
  projectBudgetFinanced: number
  region: string
  type: string
  uniqId: string
  year: number
}

type Sort = {
  id: string
  order: 'asc' | 'desc'
}

export default function ProjectsData() {
  const [searchParams] = useSearchParams()
  const region = searchParams.get("region")
  const structure = searchParams.get("structure")
  const yearMax = searchParams.get("yearMax")
  const yearMin = searchParams.get("yearMin")

  const [filters, setFilters] = useState<Filter[]>([])
  const [pagination, setPagination] = useState({ from: 0, size: 10 })
  const [sorting, setSorting] = useState<Sort>({ id: 'project_budgetFinanced', order: 'desc' })

  const body = {
    ...getEsQuery({ regions: [region], structures: [structure], yearMax, yearMin }),
    from: pagination?.from ?? 0,
    size: pagination?.size ?? 10,
  }

  const aggregations = {
    instrument: { terms: { field: 'project_instrument.keyword' } },
    participationIsCoordinator: { terms: { field: 'participation_is_coordinator' } },
    region: { terms: { field: 'participant_region_with_labs.keyword' } },
    type: { terms: { field: 'project_type.keyword' } },
    year: { terms: { field: 'project_year' } },
  }

  if (sorting?.id) {
    body.sort = { [sorting.id]: sorting.order }
  }
  if (filters.length > 0) {
    filters.forEach((filter) => {
      if (filter.id === 'id') {
        body.query.bool.filter.push({ match: { 'project_id.keyword': filter.value } })
      } else if (filter.id === 'instrument') {
        body.query.bool.filter.push({ match: { 'project_instrument.keyword': filter.value } })
      } else if (filter.id === 'label') {
        body.query.bool.filter.push({
          wildcard: {
            'project_label.keyword': {
              case_insensitive: true,
              value: `*${filter.value.toLowerCase()}*`,
            }
          }
        })
      } else if (filter.id === 'participantId') {
        body.query.bool.filter.push({ match: { 'participant_id.keyword': filter.value } })
      } else if (filter.id === 'participantLabel') {
        body.query.bool.filter.push({
          wildcard: {
            'participant_label.fr.keyword': {
              case_insensitive: true,
              value: `*${filter.value.toLowerCase()}*`,
            }
          }
        })
      } else if (filter.id === 'participationIsCoordinator') {
        body.query.bool.filter.push({ term: { participation_is_coordinator: filter.value === "1" } })
      } else if (filter.id === 'region') {
        body.query.bool.filter.push({ match: { 'participant_region_with_labs.keyword': filter.value } })
      } else if (filter.id === 'type') {
        body.query.bool.filter.push({ match: { 'project_type.keyword': filter.value } })
      } else if (filter.id === 'year') {
        body.query.bool.filter.push({ match: { project_year: filter.value } })
      } else {
        console.error(`Filter id not supported : ${filter.id}`)
      }
    })
  }

  const { data, isLoading } = useQuery({
    queryKey: ["fundings-data", filters, pagination, region, sorting, structure, yearMax, yearMin],
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

  const { data: dataAll, isLoading: isLoadingAll } = useQuery({
    queryKey: ["fundings-data-all", region, structure, yearMax, yearMin],
    queryFn: () =>
      fetch(`${VITE_APP_SERVER_URL}/elasticsearch?index=${VITE_APP_ES_INDEX_PARTICIPATIONS}`, {
        body: JSON.stringify({ ...body, from: 0, size: 10000, aggregations }),
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        method: "POST",
      }).then((response) => response.json()),
  })

  const dataTable: Project[] = (data?.hits?.hits ?? []).map((hit) => ({
    id: hit._source?.project_id,
    instrument: hit._source?.project_instrument,
    label: hit._source?.project_label,
    participantId: hit._source?.participant_id,
    participantLabel: hit._source?.participant_label?.fr,
    participationFunding: hit._source?.participation_funding ? `${hit._source.participation_funding.toLocaleString('fr-FR')} €` : '',
    participationIsCoordinator: hit._source?.participation_is_coordinator ? 'Oui' : 'Non',
    projectBudgetFinanced: hit._source?.project_budgetFinanced ? `${hit._source.project_budgetFinanced.toLocaleString('fr-FR')} €` : '',
    region: hit._source?.participant_region_with_labs.join(', '),
    type: hit._source?.project_type,
    uniqId: hit._source?.participant_key_id,
    year: hit._source?.project_year,
  }))
  const numberOfResults = data?.hits?.total?.value ?? 0

  const dataTableAll: Project[] = (dataAll?.hits?.hits ?? []).map((hit) => ({
    id: hit._source?.project_id,
    instrument: hit._source?.project_instrument,
    label: hit._source?.project_label,
    participantId: hit._source?.participant_id,
    participantLabel: hit._source?.participant_label?.fr,
    participationFunding: hit._source?.participation_funding ? `${hit._source.participation_funding.toLocaleString('fr-FR')} €` : '',
    participationIsCoordinator: hit._source?.participation_is_coordinator ? 'Oui' : 'Non',
    projectBudgetFinanced: hit._source?.project_budgetFinanced ? `${hit._source.project_budgetFinanced.toLocaleString('fr-FR')} €` : '',
    region: hit._source?.participant_region_with_labs.join(', '),
    type: hit._source?.project_type,
    uniqId: hit._source?.participant_key_id,
    year: hit._source?.project_year,
  }))

  const columns = useMemo<Column[]>(() => [
    {
      id: 'year',
      isFilterable: true,
      isFilterableBySelect: true,
      isSortable: true,
      label: 'Année',
      sortableField: 'project_year',
    },
    {
      id: 'region',
      isFilterable: true,
      isFilterableBySelect: true,
      isSortable: false,
      label: 'Région',
    },
    {
      id: 'participantId',
      isFilterable: true,
      isSortable: false,
      label: "Identifiant d'établissement",
    },
    {
      id: 'participantLabel',
      isFilterable: true,
      isSortable: false,
      label: "Nom de l'établissement",
    },
    {
      id: 'type',
      isFilterable: true,
      isFilterableBySelect: true,
      isSortable: true,
      label: 'Type',
      sortableField: 'project_type.keyword',
    },
    {
      id: 'id',
      isFilterable: true,
      isSortable: false,
      label: 'Identifiant',
    },
    {
      id: 'label',
      isFilterable: true,
      isSortable: false,
      label: 'Nom',
    },
    {
      id: 'instrument',
      isFilterable: true,
      isFilterableBySelect: true,
      isSortable: true,
      label: 'Instrument de financement',
      sortableField: 'project_instrument.keyword',
    },
    {
      id: 'participationIsCoordinator',
      isFilterable: true,
      isFilterableBySelect: true,
      isSortable: true,
      label: 'Coordinateur',
      sortableField: 'participation_is_coordinator',
    },
    {
      id: 'projectBudgetFinanced',
      isSortable: true,
      label: 'Financement global',
      sortableField: 'project_budgetFinanced',
    },
    {
      id: 'participationFunding',
      isSortable: true,
      label: 'Financement perçu',
      sortableField: 'participation_funding',
    }
  ], [])

  const downloadCsv = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (dataTableAll.length > 0) {
      // Extract keys from the first object to use as headers
      const headers = Object.keys(dataTableAll[0]);
      const rows = dataTableAll.map((row) => headers.map((header) => row?.[header] ? `"${row[header]}"` : ""));
      // Combine headers and rows into a single CSV string
      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.join(',')),
      ].join('\n');
      // Create a hidden download link
      const link = document.createElement('a');
      link.download = `tableaux_financements_par_aap_${structure ?? region}_${yearMin}_${yearMax}.csv`;
      link.href = URL.createObjectURL(new Blob([csvContent], { type: 'text/csv;charset=utf-8' }));
      link.style.visibility = 'hidden';
      // Append link to DOM, trigger click, and clean up
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  if (isLoading || isLoadingAll) return <DefaultSkeleton height="600px" />

  return (
    <>
      <Row className="fr-grid-row--middle fr-mb-3w">
        <Col>
          <Title as="h2" look="h4">Données détaillées</Title>
          <Text className="fr-text--sm fr-mb-0" style={{ color: "var(--text-mention-grey)" }}>
            Liste des participations aux projets financés pour la période sélectionnée
          </Text>
        </Col>
        <Col style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            icon="download-line"
            iconPosition="left"
            onClick={(e) => downloadCsv(e)}
            size="sm"
            variant="secondary"
          >
            Télécharger en CSV
          </Button>
        </Col>
      </Row>
      <Row>
        <Col>
          <DataTable
            aggregations={dataAll?.aggregations ?? {}}
            columns={columns}
            dataTable={dataTable}
            filters={filters}
            numberOfResults={numberOfResults}
            pagination={pagination}
            setFilters={setFilters}
            setPagination={setPagination}
            setSorting={setSorting}
            sorting={sorting}
          />
        </Col>
      </Row>
    </>
  )
}
