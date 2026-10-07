import { Col, Row } from "@dataesr/dsfr-plus"
import { useQuery } from "@tanstack/react-query"
import { useSearchParams } from "react-router-dom"

import { useEffect, useState } from "react"
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default.tsx"
import Select from "../../../../../../components/select"
import { getEsQuery } from "../../../../utils.ts"

const { VITE_APP_ES_INDEX_PARTICIPATIONS, VITE_APP_SERVER_URL } = import.meta.env


export default function StructureSelector({ setStructures }) {
  const [selectedRegion, setSelectedRegion] = useState("*")
  const [searchParams, setSearchParams] = useSearchParams({})
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTypology, setSelectedTypology] = useState("*")

  const bodyRegions: any = {
    ...getEsQuery({}),
    aggregations: {
      by_region: {
        terms: {
          field: "address.region.keyword",
          order: { _key: "asc" },
          size: 30,
        },
      },
    },
  }
  bodyRegions.query.bool.filter.push({ term: { participant_type: "institution" } })
  bodyRegions.query.bool.filter.push({ terms: { "participant_typologie_1.keyword": ["Ecoles, instituts et assimilés", "Organismes de recherche", "Universités et assimilés"] } })
  if (selectedTypology) {
    bodyRegions.query.bool.filter.push({ wildcard: { "participant_typologie_1.keyword": selectedTypology } })
  }
  const { data: dataRegions, isLoading: isLoadingRegions } = useQuery({
    queryKey: ["fundings-regions", selectedTypology],
    queryFn: () =>
      fetch(
        `${VITE_APP_SERVER_URL}/elasticsearch?index=${VITE_APP_ES_INDEX_PARTICIPATIONS}`,
        {
          body: JSON.stringify(bodyRegions),
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json",
          },
          method: "POST",
        }
      ).then((response) => response.json()),
  })
  const regions = (dataRegions?.aggregations?.by_region?.buckets ?? [])
    .map((bucket) => bucket.key)
    .sort((a, b) => a.localeCompare(b))

  const bodyTypologies: any = {
    ...getEsQuery({}),
    aggregations: {
      by_typology: {
        terms: {
          field: "participant_typologie_1.keyword",
          order: { _key: "desc" },
        },
      },
    },
  }
  bodyTypologies.query.bool.filter.push({ term: { participant_type: "institution" } })
  bodyTypologies.query.bool.filter.push({ terms: { "participant_typologie_1.keyword": ["Ecoles, instituts et assimilés", "Organismes de recherche", "Universités et assimilés"] } })
  if (selectedRegion) {
    bodyTypologies.query.bool.filter.push({ wildcard: { "address.region.keyword": selectedRegion } })
  }
  const { data: dataTypologies, isLoading: isLoadingTypologies } = useQuery({
    queryKey: ["fundings-typologies", selectedRegion],
    queryFn: () =>
      fetch(
        `${VITE_APP_SERVER_URL}/elasticsearch?index=${VITE_APP_ES_INDEX_PARTICIPATIONS}`,
        {
          body: JSON.stringify(bodyTypologies),
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json",
          },
          method: "POST",
        }
      ).then((response) => response.json()),
  })
  const typologies = (dataTypologies?.aggregations?.by_typology?.buckets ?? []).map((bucket) => bucket.key)

  const bodyStructures: any = {
    ...getEsQuery({}),
    aggregations: {
      by_structure: {
        terms: {
          field: "participant_encoded_key",
          size: 1500,
        },
      },
    },
  }
  bodyStructures.query.bool.filter.push({ term: { participant_type: "institution" } })
  bodyStructures.query.bool.filter.push({ terms: { "participant_typologie_1.keyword": ["Ecoles, instituts et assimilés", "Organismes de recherche", "Universités et assimilés"] } })
  if (selectedRegion) {
    bodyStructures.query.bool.filter.push({ wildcard: { "address.region.keyword": selectedRegion } })
  }
  if (selectedTypology) {
    bodyStructures.query.bool.filter.push({ wildcard: { "participant_typologie_1.keyword": selectedTypology } })
  }
  const { data: dataStructures, isLoading: isLoadingStructures } = useQuery({
    queryKey: ["fundings-structures", selectedRegion, selectedTypology],
    queryFn: () =>
      fetch(
        `${VITE_APP_SERVER_URL}/elasticsearch?index=${VITE_APP_ES_INDEX_PARTICIPATIONS}`,
        {
          body: JSON.stringify(bodyStructures),
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json",
          },
          method: "POST",
        }
      ).then((response) => response.json()),
  })

  const structures =
    (dataStructures?.aggregations?.by_structure?.buckets ?? []).map((bucket) => {
      const structureInfo = Object.fromEntries(new URLSearchParams(bucket?.key ?? ""))
      structureInfo.searchableText = `${structureInfo.label.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()} ${structureInfo.acronym.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()}`
      let displayText = structureInfo.label
      if (structureInfo?.acronym && structureInfo.acronym !== 'None') displayText += ` (${structureInfo.acronym})`
      structureInfo.displayText = displayText
      return structureInfo
    }) || []

  const handleStructureChange = (selectedStructure?: string) => {
    if (selectedStructure) {
      searchParams.set("structureId", selectedStructure)
      searchParams.delete("region")
      setSearchParams(searchParams)
    }
  }

  useEffect(() => {
    setStructures((dataStructures?.aggregations?.by_structure?.buckets ?? []).map((bucket) => {
      const structureInfo = Object.fromEntries(new URLSearchParams(bucket?.key ?? ""))
      structureInfo.searchableText = structureInfo.label.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
      return structureInfo
    }) || [])
  }, [dataStructures])

  return (
    <Row gutters className="fr-grid-row--middle" role="group" aria-label="Filtrer les établissements">
      <Col xs="12" sm="3">
        {isLoadingRegions ? <DefaultSkeleton /> : (
          <Select
            aria-label="Rechercher une région par nom..."
            fullWidth
            icon="map-pin-2-line"
            label={selectedRegion === "*" ? <>Région <span className="fr-badge fr-badge--sm fr-ml-1v">{regions.length}</span></> : selectedRegion}
            size="sm"
          >
            <Select.Option
              onClick={() => setSelectedRegion("*")}
              selected={selectedRegion === "*"}
              value="*"
            >
              Toutes les régions
            </Select.Option>
            {regions.map((region: string) => (
              <Select.Option
                key={region}
                onClick={() => setSelectedRegion(region)}
                selected={selectedRegion === region}
                value={region}
              >
                {region}
              </Select.Option>
            ))}
          </Select>
        )}
      </Col>

      <Col xs="12" sm="3">
        {isLoadingTypologies ? <DefaultSkeleton height="40px" /> : (
          <Select
            aria-label="Rechercher une typologie par nom..."
            fullWidth
            icon="layout-grid-line"
            label={selectedTypology === "*" ? <>Typologie <span className="fr-badge fr-badge--sm fr-ml-1v">{typologies.length}</span></> : selectedTypology}
            size="sm"
          >
            <Select.Option
              onClick={() => setSelectedTypology("*")}
              selected={selectedTypology === "*"}
              value="*"
            >
              Toutes les typologies
            </Select.Option>
            {typologies.map((typology: string) => (
              <Select.Option
                key={typology}
                onClick={() => setSelectedTypology(typology)}
                selected={selectedTypology === typology}
                value={typology}
              >
                {typology}
              </Select.Option>
            ))}
          </Select>
        )}
      </Col>

      <Col xs="12" sm="6">
        {isLoadingStructures ? <DefaultSkeleton height="40px" /> : (
          <Select
            aria-label="Rechercher un établissement par nom..."
            fullWidth
            icon="search-line"
            label={<>Établissement <span className="fr-badge fr-badge--sm fr-ml-1v">{structures.length}</span></>}
            size="sm"
          >
            <Select.Search
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un établissement par nom..."
              value={searchQuery}
            />
            <Select.Content maxHeight="300px">
              {structures
                .filter((structure) =>
                  searchQuery
                    ? structure.searchableText.includes(searchQuery.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase())
                    : true
                )
                .map((structure) => (
                  <Select.Option
                    key={structure.id}
                    value={structure.id}
                    onClick={() => handleStructureChange(structure.id)}
                  >
                    {structure.displayText}
                  </Select.Option>
                ))}
              {structures
                .filter((structure) =>
                  searchQuery
                    ? structure.searchableText.includes(searchQuery.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase())
                    : true
                )
                .length === 0 && (
                  <Select.Empty>Aucun établissement trouvé</Select.Empty>
                )}
            </Select.Content>
          </Select>
        )}
      </Col>
    </Row>
  )
}
